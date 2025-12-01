import db from "../../config/db.js";
import nodemailer from "nodemailer";

// Nodemailer transporter using Gmail app password
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * POST /api/contactSeller
 * Body: { buyerId, postId }
 * Inserts into contacted_seller table and sends automated email to seller/organizer
 */
export const contactSeller = (req, res) => {
    const { buyerId, postId } = req.body;

    // Validation
    if (!buyerId || !postId) {
        return res.status(400).json({
            error: "buyerId and postId are required"
        });
    }

    // Step 1: Check if this contact already exists (avoid duplicates)
    const checkExistingQuery = `
        SELECT * FROM contacted_seller
        WHERE user_id = ? AND post_id = ?
    `;

    db.query(checkExistingQuery, [buyerId, postId], (checkErr, checkResults) => {
        if (checkErr) {
            console.error("DB error (contactSeller - check existing):", checkErr);
            return res.status(500).json({ error: "Database error" });
        }

        // If already contacted, still proceed but don't insert duplicate
        const alreadyContacted = checkResults.length > 0;

        // Step 2: Get post details, seller/organizer info, and buyer info
        const getPostDetailsQuery = `
            SELECT 
                p.post_id,
                p.name AS post_title,
                p.post_type,
                p.price,
                p.description,
                u.user_id AS seller_id,
                u.fname AS seller_fname,
                u.lname AS seller_lname,
                u.email AS seller_email,
                e.organization_name,
                buyer.fname AS buyer_fname,
                buyer.lname AS buyer_lname,
                buyer.email AS buyer_email
            FROM posts p
            JOIN users u ON p.user_id = u.user_id
            JOIN users buyer ON buyer.user_id = ?
            LEFT JOIN event_posts e ON e.event_id = p.post_id
            WHERE p.post_id = ?
        `;

        db.query(getPostDetailsQuery, [buyerId, postId], (err, rows) => {
            if (err) {
                console.error("DB error (contactSeller - get post details):", err);
                return res.status(500).json({ error: "Failed to fetch post details" });
            }

            if (rows.length === 0) {
                return res.status(404).json({ error: "Post not found" });
            }

            const postData = rows[0];

            // Prevent users from contacting themselves
            if (postData.seller_id === parseInt(buyerId)) {
                return res.status(400).json({
                    error: "You cannot contact yourself about your own post"
                });
            }

            // Step 3: Insert into contacted_seller table (if not already contacted)
            if (!alreadyContacted) {
                const insertQuery = `
                    INSERT INTO contacted_seller (user_id, post_id)
                    VALUES (?, ?)
                `;

                db.query(insertQuery, [buyerId, postId], (insertErr) => {
                    if (insertErr) {
                        console.error("DB error (contactSeller - insert):", insertErr);
                        // Continue to send email even if insert fails (non-critical)
                    }
                });
            }

            // Step 4: Send automated email to seller/organizer
            const isEvent = postData.post_type === 'event';
            const sellerName = `${postData.seller_fname} ${postData.seller_lname}`;
            const buyerName = `${postData.buyer_fname} ${postData.buyer_lname}`;
            const itemType = isEvent ? 'event' : 'item';

            const sellerEmailSubject = isEvent
                ? `Someone is Interested in Your Event: ${postData.post_title}`
                : `Someone is Interested in Your Item: ${postData.post_title}`;

            const sellerEmailText = `
Hello ${sellerName},

Great news! ${buyerName} (${postData.buyer_email}) is interested in your ${itemType} "${postData.post_title}".

Post Details:
${isEvent && postData.organization_name ? `Organization: ${postData.organization_name}\n` : ''}${postData.price ? `Price: $${postData.price}\n` : ''}${postData.description ? `Description: ${postData.description}\n` : ''}
You can contact the buyer directly at: ${postData.buyer_email}

Thank you for using our marketplace!

Best regards,
Marketplace Team
            `;

            const sellerMailOptions = {
                from: process.env.EMAIL_USER,
                to: postData.seller_email,
                subject: sellerEmailSubject,
                text: sellerEmailText,
            };

            // Step 5: Send email to seller (non-blocking - don't fail if email fails)
            transporter.sendMail(sellerMailOptions, (mailErr, info) => {
                if (mailErr) {
                    console.error("Error sending email to seller:", mailErr);
                    // Still return success since the table insert succeeded
                } else {
                    console.log("Contact email sent to seller:", info.response);
                }
            });

            // Step 6: Send confirmation email to buyer (optional)
            const buyerEmailSubject = `Confirmation: You Contacted About ${postData.post_title}`;
            const buyerEmailText = `
Hello ${buyerName},

This is a confirmation that you have expressed interest in ${postData.post_title}.

${isEvent && postData.organization_name ? `Organization: ${postData.organization_name}\n` : ''}${postData.price ? `Price: $${postData.price}\n` : ''}
The seller/organizer (${sellerName}) has been notified and can be reached at: ${postData.seller_email}

You can view all your contacted posts in your account settings.

Thank you for using our marketplace!

Best regards,
Marketplace Team
            `;

            const buyerMailOptions = {
                from: process.env.EMAIL_USER,
                to: postData.buyer_email,
                subject: buyerEmailSubject,
                text: buyerEmailText,
            };

            transporter.sendMail(buyerMailOptions, (buyerMailErr, buyerInfo) => {
                if (buyerMailErr) {
                    console.error("Error sending confirmation email to buyer:", buyerMailErr);
                } else {
                    console.log("Confirmation email sent to buyer:", buyerInfo.response);
                }
            });

            // Return success response
            return res.status(201).json({
                success: true,
                message: alreadyContacted
                    ? "Email sent successfully (already contacted previously)"
                    : "Contact entry created and email sent successfully",
                sellerEmail: postData.seller_email,
            });
        });
    });
};

// Cooldown period in hours (24 hours = 1 day)
const CONTACT_COOLDOWN_HOURS = 24;

// 1) Add contact entry when user contacts seller/organizer
// POST /api/contactSeller
// Body: { userId, postId }
export const contactSeller = (req, res) => {
    const { userId, postId } = req.body;

    if (!userId || !postId) {
        return res.status(400).json({ 
            error: "userId and postId are required" 
        });
    }

    const pid = Number(postId);
    if (!Number.isInteger(pid) || pid <= 0) {
        return res.status(400).json({ error: "Invalid postId" });
    }

    // Check if entry already exists
    const checkSql = `
        SELECT contacted_at 
        FROM contacted_seller 
        WHERE user_id = ? AND post_id = ?
    `;

    db.query(checkSql, [userId, pid], (checkErr, checkRows) => {
        if (checkErr) {
            console.error("DB error (contactSeller/check):", checkErr);
            return res.status(500).json({ error: "Database error" });
        }

        if (checkRows.length > 0) {
            // Entry exists, update timestamp
            const updateSql = `
                UPDATE contacted_seller 
                SET contacted_at = CURRENT_TIMESTAMP 
                WHERE user_id = ? AND post_id = ?
            `;

            db.query(updateSql, [userId, pid], (updateErr, updateResult) => {
                if (updateErr) {
                    console.error("DB error (contactSeller/update):", updateErr);
                    return res.status(500).json({ error: "Failed to update contact" });
                }

                return res.status(200).json({
                    success: true,
                    message: "Contact timestamp updated",
                    contacted_at: new Date().toISOString()
                });
            });
        } else {
            // New entry
            const insertSql = `
                INSERT INTO contacted_seller (user_id, post_id, contacted_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
            `;

            db.query(insertSql, [userId, pid], (insertErr, insertResult) => {
                if (insertErr) {
                    console.error("DB error (contactSeller/insert):", insertErr);
                    return res.status(500).json({ error: "Failed to add contact" });
                }

                return res.status(200).json({
                    success: true,
                    message: "Contact added successfully",
                    contacted_at: new Date().toISOString()
                });
            });
        }
    });
};

// 2) Check if user can contact seller/organizer (cooldown check)
// POST /api/canContactSeller
// Body: { userId, postId }
export const canContactSeller = (req, res) => {
    const { userId, postId } = req.body;

    if (!userId || !postId) {
        return res.status(400).json({ 
            error: "userId and postId are required" 
        });
    }

    const pid = Number(postId);
    if (!Number.isInteger(pid) || pid <= 0) {
        return res.status(400).json({ error: "Invalid postId" });
    }

    const sql = `
        SELECT contacted_at,
               TIMESTAMPDIFF(HOUR, contacted_at, NOW()) AS hours_since_contact
        FROM contacted_seller
        WHERE user_id = ? AND post_id = ?
    `;

    db.query(sql, [userId, pid], (err, rows) => {
        if (err) {
            console.error("DB error (canContactSeller):", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (rows.length === 0) {
            // Never contacted, can contact
            return res.status(200).json({
                canContact: true,
                reason: "never_contacted"
            });
        }

        const hoursSinceContact = rows[0].hours_since_contact;
        const canContact = hoursSinceContact >= CONTACT_COOLDOWN_HOURS;
        const hoursRemaining = canContact 
            ? 0 
            : CONTACT_COOLDOWN_HOURS - hoursSinceContact;

        return res.status(200).json({
            canContact,
            reason: canContact ? "cooldown_passed" : "cooldown_active",
            hoursSinceContact,
            hoursRemaining: Math.ceil(hoursRemaining),
            contactedAt: rows[0].contacted_at
        });
    });
};

// 3) Get all contacted posts for a user (with thumbnail + seller/organization + timeout info)
// POST /api/getContactedPosts
// Body: { userId }
export const getContactedPosts = (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    const sql = `
        SELECT
            cs.user_id,
            cs.contacted_at,
            TIMESTAMPDIFF(HOUR, cs.contacted_at, NOW()) AS hours_since_contact,
            p.post_id,
            p.post_type,
            p.name            AS title,
            p.price,
            p.postal_code,
            p.posted_date,
            p.description,
            u.fname           AS seller_fname,
            u.lname           AS seller_lname,
            e.organization_name,
            i.image_text_data AS thumbnail_blob
        FROM contacted_seller cs
            JOIN posts p   ON cs.post_id = p.post_id
            JOIN users u   ON p.user_id = u.user_id
            LEFT JOIN event_posts e
                ON e.event_id = p.post_id
            LEFT JOIN images i
                ON i.image_id = (
                    SELECT MIN(image_id)
                    FROM images
                    WHERE post_id = p.post_id
                )
        WHERE cs.user_id = ?
        ORDER BY cs.contacted_at DESC
    `;

    db.query(sql, [userId], (err, rows) => {
        if (err) {
            console.error("DB error (getContactedPosts):", err);
            return res.status(500).json({ error: "Database error" });
        }

        const contactedPosts = rows.map((row) => {
            const hoursSinceContact = row.hours_since_contact;
            const canContactAgain = hoursSinceContact >= CONTACT_COOLDOWN_HOURS;
            const hoursRemaining = canContactAgain 
                ? 0 
                : CONTACT_COOLDOWN_HOURS - hoursSinceContact;

            return {
                user_id: row.user_id,
                post_id: row.post_id,
                post_type: row.post_type,
                title: row.title,
                price: row.price,
                postal_code: row.postal_code,
                posted_date: row.posted_date,
                description: row.description,
                seller_fname: row.seller_fname,
                seller_lname: row.seller_lname,
                organization_name: row.organization_name,
                contacted_at: row.contacted_at,
                hours_since_contact: hoursSinceContact,
                can_contact_again: canContactAgain,
                hours_remaining: Math.ceil(hoursRemaining),
                thumbnail: row.thumbnail_blob
                    ? (Buffer.isBuffer(row.thumbnail_blob)
                        ? row.thumbnail_blob.toString("base64")
                        : row.thumbnail_blob)
                    : null,
            };
        });

        return res.status(200).json({ contactedPosts });
    });
};
