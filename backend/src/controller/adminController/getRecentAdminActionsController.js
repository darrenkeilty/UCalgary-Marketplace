import db from "../../config/db.js";

/**
 * GET /api/admin/recent-actions?adminId=1
 * Fetches admin profile information and recent admin actions
 * Returns admin profile (fname, lname, email) and actions array
 */
export const getRecentAdminActions = (req, res) => {
    const { adminId } = req.query;

    if (!adminId) {
        return res.status(400).json({ error: "Admin ID is required" });
    }

    const adminIdNum = parseInt(adminId, 10);
    if (Number.isNaN(adminIdNum)) {
        return res.status(400).json({ error: "Admin ID must be a number" });
    }

    // First, get admin profile info
    const adminSql = `
        SELECT admin_id, fname, lname, email
        FROM admins
        WHERE admin_id = ?
    `;

    db.query(adminSql, [adminIdNum], (adminErr, adminRows) => {
        if (adminErr) {
            console.error("[getRecentAdminActions] DB error (admin query):", adminErr);
            return res.status(500).json({ error: "Database error" });
        }

        if (adminRows.length === 0) {
            return res.status(404).json({ error: "Admin not found" });
        }

        const admin = adminRows[0];

        // Then, get recent admin actions
        const actionsSql = `
            SELECT 
                action,
                action_timestamp AS date
            FROM admin_actions
            WHERE admin_id = ?
            ORDER BY action_timestamp DESC
            LIMIT 50
        `;

        db.query(actionsSql, [adminIdNum], (actionsErr, actionsRows) => {
            if (actionsErr) {
                console.error("[getRecentAdminActions] DB error (actions query):", actionsErr);
                return res.status(500).json({ error: "Database error fetching actions" });
            }

            // Format actions for frontend
            const actions = actionsRows.map((row) => ({
                date: row.date,
                action: row.action,
            }));

            // Return admin profile info and actions
            res.status(200).json({
                admin: {
                    id: admin.admin_id,
                    fname: admin.fname,
                    lname: admin.lname,
                    email: admin.email,
                },
                actions: actions,
            });
        });
    });
};