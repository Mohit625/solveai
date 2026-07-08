import { profileRepository } from "../../repositories/ProfileRepository.js";

export const profileService = {
  getProfile(userId) {
    return profileRepository.findById(userId);
  },

  updateName(userId, name) {
    return profileRepository.updateName(userId, name);
  },
};
