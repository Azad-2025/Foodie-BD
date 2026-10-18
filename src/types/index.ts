export interface Division {
  id: string;
  nameEn: string;
  nameBn: string;
  capitalEn: string;
  capitalBn: string;
}

export interface District {
  id: string;
  divisionId: string;
  nameEn: string;
  nameBn: string;
  shapeName: string; // Maps to GeoJSON shapeName
  lat: number;
  lng: number;
  prominentDishEn: string;
  prominentDishBn: string;
  description: string;
}

export type FoodCategory =
  | 'main_course'
  | 'traditional'
  | 'street_food'
  | 'snacks'
  | 'dessert'
  | 'drinks'
  | 'sweets_pitha';

export interface CategoryInfo {
  id: FoodCategory;
  nameEn: string;
  nameBn: string;
  description: string;
}

export interface Food {
  id: string;
  nameEn: string;
  nameBn: string;
  shortDescription: string;
  detailedDescription: string;
  category: FoodCategory;
  districtId: string;
  divisionId: string;
  imageUrl: string;
  originHistory: string;
  originSource?: string;
  isPublished: boolean;
  ingredients?: string[];
  approximatePriceBdt?: number;
  dietaryType?: 'non-veg' | 'veg' | 'sweet';
  createdAt: string;
  updatedAt: string;

  // Research, verification, and provenance metadata
  submissionId?: string;
  submittedByUserId?: string;
  submittedByUserName?: string;
  approvedByUserId?: string;
  approvedByUserName?: string;
  approvedAt?: string;
  verificationStatus?: 'verified' | 'admin_created' | 'community_submitted' | 'research_verified' | 'provisional';
  researchStatus?: 'verified' | 'partially_supported' | 'needs_verification' | 'gi_certified';
  citationSources?: string[];
  imageCaption?: string;
  imageAttribution?: string;
  imageVerified?: boolean;
}

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface SubmissionEditHistory {
  editedAt: string;
  summary: string;
}

export interface FoodSubmission {
  id: string;
  nameEn: string;
  nameBn: string;
  shortDescription: string;
  detailedDescription?: string;
  category: FoodCategory;
  districtId: string;
  divisionId: string;
  imageUrl: string;
  originHistory?: string;
  originSource?: string;
  approximatePriceBdt?: number;
  dietaryType?: 'non-veg' | 'veg' | 'sweet';
  ingredients?: string[];
  accurateInfoConfirmed: boolean;

  // Submitter details
  userId: string;
  submitterName: string;
  createdAt: string;
  updatedAt: string;

  // Review & Approval details
  status: SubmissionStatus;
  reviewedByUserId?: string;
  reviewedByUserName?: string;
  reviewedAt?: string;
  adminFeedback?: string;
  approvedFoodId?: string;

  editHistory?: SubmissionEditHistory[];
}

export type JourneyStatus = 'want_to_try' | 'tried';

export interface UserFoodTracking {
  id: string;
  userId: string;
  foodId: string;
  status: JourneyStatus;
  triedAt?: string;
  rating?: number;
  notes?: string;
  photoUrl?: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'guest' | 'user' | 'admin';
  avatarUrl?: string;
  homeDistrictId?: string;
  bio?: string;
  createdAt: string;
}

export interface FoodReview {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  foodId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  titleEn: string;
  titleBn: string;
  descriptionEn: string;
  descriptionBn: string;
  icon: string;
  category: 'count' | 'division' | 'specialty';
  threshold: number;
  unlockedAt?: string;
  progress?: number;
  isUnlocked?: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userName: string;
  details: string;
  createdAt: string;
}

export interface PlatformStats {
  totalDistricts: number;
  totalDivisions: number;
  totalFoods: number;
  totalTriedByUsers: number;
  activeFoodiesCount: number;
}

export type MapTheme = 'light' | 'dark' | 'minimal' | 'journey';
