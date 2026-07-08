import { asyncHandler } from "../utils/asyncHandler.js";
import { profileService } from "../services/profile/profileService.js";

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.getProfile(req.user.id);
  res.json(profile);
});
