import db from "../../config/db.js";

/**
 * GET /api/admin/recent-actions?adminId=1
 * Fetches recent admin actions for the logged-in admin
 * Returns only the actions array (no admin profile information)
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

    // Get recent admin actions
    const actionsSql = `
        SELECT 
            action,
            action_timestamp AS date
        FROM admin_actions
        WHERE admin_id = ?
        ORDER BY action_timestamp DESC
        LIMIT 50
    `;

    db.query(actionsSql, [adminIdNum], (err, rows) => {
        if (err) {
            console.error("[getRecentAdminActions] DB error:", err);
            return res.status(500).json({ error: "Database error" });
        }

        // Format actions for frontend
        const actions = rows.map((row) => ({
            date: row.date,
            action: row.action,
        }));

        // Return only actions array
        res.status(200).json({
            actions: actions,
        });
    });
};