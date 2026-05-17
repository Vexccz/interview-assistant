// Profiles service
// Manages multiple interview profiles (resume, job desc, company)
// Stored in localStorage

const PROFILES_KEY = 'interview-profiles';
const ACTIVE_PROFILE_KEY = 'interview-active-profile';

export class ProfilesService {
  static getProfiles() {
    try {
      const data = localStorage.getItem(PROFILES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  static saveProfiles(profiles) {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  }

  static addProfile(profile) {
    const profiles = ProfilesService.getProfiles();
    const newProfile = {
      id: Date.now().toString(),
      name: profile.name || 'Untitled Profile',
      resume: profile.resume || '',
      jobDescription: profile.jobDescription || '',
      companyName: profile.companyName || '',
      companyInfo: profile.companyInfo || '',
      createdAt: new Date().toISOString()
    };
    profiles.push(newProfile);
    ProfilesService.saveProfiles(profiles);
    return newProfile;
  }

  static updateProfile(id, updates) {
    const profiles = ProfilesService.getProfiles();
    const index = profiles.findIndex(p => p.id === id);
    if (index !== -1) {
      profiles[index] = { ...profiles[index], ...updates };
      ProfilesService.saveProfiles(profiles);
      return profiles[index];
    }
    return null;
  }

  static deleteProfile(id) {
    const profiles = ProfilesService.getProfiles();
    const filtered = profiles.filter(p => p.id !== id);
    ProfilesService.saveProfiles(filtered);
  }

  static getActiveProfileId() {
    return localStorage.getItem(ACTIVE_PROFILE_KEY) || null;
  }

  static setActiveProfileId(id) {
    if (id) {
      localStorage.setItem(ACTIVE_PROFILE_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
    }
  }

  static getActiveProfile() {
    const id = ProfilesService.getActiveProfileId();
    if (!id) return null;
    const profiles = ProfilesService.getProfiles();
    return profiles.find(p => p.id === id) || null;
  }
}
