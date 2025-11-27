import { Router } from "express";
import { getSavedPosts, unsavePost, savePost } from "../../controller/userSettingsController/savedPostController.js";

const router = Router();

router.post("/", getSavedPosts);      // POST /api/getSavedPosts/
router.post("/save", savePost);       // POST /api/getSavedPosts/save
router.post("/unsave", unsavePost);   // POST /api/getSavedPosts/unsave

export default router;

