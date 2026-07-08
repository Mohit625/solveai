import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getProfile } from "../controllers/profileController.js";

const router = Router();

router.use(requireAuth);
router.get("/", getProfile);

export default router;
