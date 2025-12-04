import express from "express";

import { 
    getPosts,
    getMarketResults,
    getEventResults,
    getEventById,
    getMarketItemById,
    getMarketItemByIdWithReports,
    getEventByIdWithReports
} from "../../controller/postsController/postController.js";

const router = express.Router();

// get posts for home thumbnails - supports optional ?type=market|event
// Also expose at root so frontend can call `/api/posts?type=...`
router.get("/postfetch", getPosts);

// get search results for marketplace
router.get("/marketres", getMarketResults);

// get search results for events
router.get("/eventres", getEventResults);

// get specific marketplace item by id
router.get("/itemdetails/:id", getMarketItemById);

// get specific event by id
router.get("/eventdetails/:id", getEventById);

// get specific marketplace item by id WITH report categories (for ViewReportedMarketPost page)
router.get("/itemdetails/:id/reports", getMarketItemByIdWithReports);

// get specific event by id WITH report categories (for ViewReportedEventPost page)
router.get("/eventdetails/:id/reports", getEventByIdWithReports);

export default router;


