import { Router } from "express";
import { reportPost, reportUser } from "../../controller/reportsController/reportController.js";

const router = Router();

// Report a post
router.post("/post", reportPost);

// Report a user
router.post("/user", reportUser);

export default router;