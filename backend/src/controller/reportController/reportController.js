import db from "../../config/db.js";

/**
 * Report a post
 * POST /api/reports/post
 * Body: { reporterId: number, postId: number, reason: string }
 */
export const reportPost = (req, res) => {
    const { reporterId, postId, reason } = req.body;

    // Validate required fields
    if (!reporterId || !postId || !reason) {
        return res.status(400).json({
            success: false,
            error: "reporterId, postId, and reason are required",
        });
    }

    // Validate reporterId and postId are numbers
    const reporterIdNum = Number(reporterId);
    const postIdNum = Number(postId);

    if (!Number.isInteger(reporterIdNum) || reporterIdNum <= 0) {
        return res.status(400).json({
            success: false,
            error: "Invalid reporterId",
        });
    }

    if (!Number.isInteger(postIdNum) || postIdNum <= 0) {
        return res.status(400).json({
            success: false,
            error: "Invalid postId",
        });
    }

    // Validate reason is not empty
    if (typeof reason !== "string" || reason.trim().length === 0) {
        return res.status(400).json({
            success: false,
            error: "Reason cannot be empty",
        });
    }

    // First, verify the reporter exists
    const checkReporterQuery = "SELECT user_id FROM users WHERE user_id = ?";
    db.query(checkReporterQuery, [reporterIdNum], (err, reporterRows) => {
        if (err) {
            console.error("DB error (check reporter):", err);
            return res.status(500).json({
                success: false,
                error: "Database error",
            });
        }

        if (reporterRows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Reporter user not found",
            });
        }

        // Verify the post exists
        const checkPostQuery = "SELECT post_id FROM posts WHERE post_id = ?";
        db.query(checkPostQuery, [postIdNum], (err2, postRows) => {
            if (err2) {
                console.error("DB error (check post):", err2);
                return res.status(500).json({
                    success: false,
                    error: "Database error",
                });
            }

            if (postRows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Post not found",
                });
            }

            // Check if user is trying to report their own post
            const checkOwnPostQuery =
                "SELECT user_id FROM posts WHERE post_id = ?";
            db.query(checkOwnPostQuery, [postIdNum], (err3, ownPostRows) => {
                if (err3) {
                    console.error("DB error (check own post):", err3);
                    return res.status(500).json({
                        success: false,
                        error: "Database error",
                    });
                }

                if (
                    ownPostRows.length > 0 &&
                    ownPostRows[0].user_id === reporterIdNum
                ) {
                    return res.status(400).json({
                        success: false,
                        error: "You cannot report your own post",
                    });
                }

                // Insert into reports table
                const insertReportQuery = `
                    INSERT INTO reports (reporter_id, report_type, reason)
                    VALUES (?, 'post', ?)
                `;

                db.query(
                    insertReportQuery,
                    [reporterIdNum, reason.trim()],
                    (err4, result) => {
                        if (err4) {
                            console.error("DB error (insert report):", err4);
                            return res.status(500).json({
                                success: false,
                                error: "Failed to create report",
                            });
                        }

                        const reportId = result.insertId;

                        // Insert into post_report table
                        const insertPostReportQuery = `
                            INSERT INTO post_report (report_id, post_id)
                            VALUES (?, ?)
                        `;

                        db.query(
                            insertPostReportQuery,
                            [reportId, postIdNum],
                            (err5) => {
                                if (err5) {
                                    console.error(
                                        "DB error (insert post_report):",
                                        err5
                                    );
                                    // Rollback: delete the report if post_report insert fails
                                    const deleteReportQuery =
                                        "DELETE FROM reports WHERE report_id = ?";
                                    db.query(
                                        deleteReportQuery,
                                        [reportId],
                                        (rollbackErr) => {
                                            if (rollbackErr) {
                                                console.error(
                                                    "Rollback error:",
                                                    rollbackErr
                                                );
                                            }
                                        }
                                    );
                                    return res.status(500).json({
                                        success: false,
                                        error: "Failed to create post report",
                                    });
                                }

                                return res.status(201).json({
                                    success: true,
                                    message: "Post reported successfully",
                                    reportId: reportId,
                                });
                            }
                        );
                    }
                );
            });
        });
    });
};

/**
 * Report a user
 * POST /api/reports/user
 * Body: { reporterId: number, reportedUserId: number, reason: string }
 */
export const reportUser = (req, res) => {
    const { reporterId, reportedUserId, reason } = req.body;

    // Validate required fields
    if (!reporterId || !reportedUserId || !reason) {
        return res.status(400).json({
            success: false,
            error: "reporterId, reportedUserId, and reason are required",
        });
    }

    // Validate reporterId and reportedUserId are numbers
    const reporterIdNum = Number(reporterId);
    const reportedUserIdNum = Number(reportedUserId);

    if (!Number.isInteger(reporterIdNum) || reporterIdNum <= 0) {
        return res.status(400).json({
            success: false,
            error: "Invalid reporterId",
        });
    }

    if (!Number.isInteger(reportedUserIdNum) || reportedUserIdNum <= 0) {
        return res.status(400).json({
            success: false,
            error: "Invalid reportedUserId",
        });
    }

    // Check if user is trying to report themselves
    if (reporterIdNum === reportedUserIdNum) {
        return res.status(400).json({
            success: false,
            error: "You cannot report yourself",
        });
    }

    // Validate reason is not empty
    if (typeof reason !== "string" || reason.trim().length === 0) {
        return res.status(400).json({
            success: false,
            error: "Reason cannot be empty",
        });
    }

    // First, verify the reporter exists
    const checkReporterQuery = "SELECT user_id FROM users WHERE user_id = ?";
    db.query(checkReporterQuery, [reporterIdNum], (err, reporterRows) => {
        if (err) {
            console.error("DB error (check reporter):", err);
            return res.status(500).json({
                success: false,
                error: "Database error",
            });
        }

        if (reporterRows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Reporter user not found",
            });
        }

        // Verify the reported user exists
        const checkReportedUserQuery =
            "SELECT user_id FROM users WHERE user_id = ?";
        db.query(
            checkReportedUserQuery,
            [reportedUserIdNum],
            (err2, reportedUserRows) => {
                if (err2) {
                    console.error("DB error (check reported user):", err2);
                    return res.status(500).json({
                        success: false,
                        error: "Database error",
                    });
                }

                if (reportedUserRows.length === 0) {
                    return res.status(404).json({
                        success: false,
                        error: "Reported user not found",
                    });
                }

                // Insert into reports table
                const insertReportQuery = `
                    INSERT INTO reports (reporter_id, report_type, reason)
                    VALUES (?, 'user', ?)
                `;

                db.query(
                    insertReportQuery,
                    [reporterIdNum, reason.trim()],
                    (err3, result) => {
                        if (err3) {
                            console.error("DB error (insert report):", err3);
                            return res.status(500).json({
                                success: false,
                                error: "Failed to create report",
                            });
                        }

                        const reportId = result.insertId;

                        // Insert into user_report table
                        const insertUserReportQuery = `
                            INSERT INTO user_report (report_id, reported_user_id)
                            VALUES (?, ?)
                        `;

                        db.query(
                            insertUserReportQuery,
                            [reportId, reportedUserIdNum],
                            (err4) => {
                                if (err4) {
                                    console.error(
                                        "DB error (insert user_report):",
                                        err4
                                    );
                                    // Rollback: delete the report if user_report insert fails
                                    const deleteReportQuery =
                                        "DELETE FROM reports WHERE report_id = ?";
                                    db.query(
                                        deleteReportQuery,
                                        [reportId],
                                        (rollbackErr) => {
                                            if (rollbackErr) {
                                                console.error(
                                                    "Rollback error:",
                                                    rollbackErr
                                                );
                                            }
                                        }
                                    );
                                    return res.status(500).json({
                                        success: false,
                                        error: "Failed to create user report",
                                    });
                                }

                                return res.status(201).json({
                                    success: true,
                                    message: "User reported successfully",
                                    reportId: reportId,
                                });
                            }
                        );
                    }
                );
            }
        );
    });
};