import {
  Division,
  District,
  Food,
  FoodSubmission,
  CategoryInfo,
  UserProfile,
  UserFoodTracking,
  FoodReview,
  Achievement,
  PlatformStats,
  AuditLog,
} from '../types';

const TOKEN_KEY = 'foodie_bd_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function removeStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

async function request<T>(endpoint: string, options: RequestInit = {}, maxRetries = 2): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second client timeout

    try {
      const res = await fetch(endpoint, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // If gateway timeout or temporary service unavailability, retry with exponential backoff
      if ((res.status === 504 || res.status === 502 || res.status === 503) && attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
        continue;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 504) {
          throw new Error(
            data.error ||
              'সার্ভার থেকে সাড়া পেতে কিছুটা বিলম্ব হচ্ছে (504 Gateway Timeout)। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
          );
        }
        if (res.status === 502 || res.status === 503) {
          throw new Error(
            data.error ||
              'সার্ভার সাময়িকভাবে অনুপলব্ধ (Service Temporarily Unavailable)। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।'
          );
        }
        throw new Error(data.error || `Request failed with status ${res.status}`);
      }

      return data as T;
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;

      if (err.name === 'AbortError') {
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
          continue;
        }
        throw new Error(
          'অনুরোধটির সময়সীমা পার হয়ে গেছে (504 Gateway Timeout)। অনুগ্রহ করে আবার চেষ্টা করুন।'
        );
      }

      // If network connection drop or fetch failure, retry before throwing
      if (attempt < maxRetries && (!err.message || !err.message.includes('401') && !err.message.includes('403') && !err.message.includes('400') && !err.message.includes('404') && !err.message.includes('409'))) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
        continue;
      }

      throw err;
    }
  }

  throw lastError || new Error('সার্ভার থেকে সাড়া পেতে কিছুটা বিলম্ব হচ্ছে (504 Gateway Timeout)।');
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: UserProfile }> {
    const res = await request<{ token: string; user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(res.token);
    return res;
  },

  async register(
    name: string,
    email: string,
    password: string,
    homeDistrictId?: string
  ): Promise<{ token: string; user: UserProfile }> {
    const res = await request<{ token: string; user: UserProfile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, homeDistrictId }),
    });
    setStoredToken(res.token);
    return res;
  },

  async getMe(): Promise<{ user: UserProfile }> {
    return request<{ user: UserProfile }>('/api/auth/me');
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<{ user: UserProfile }> {
    return request<{ user: UserProfile }>('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async resetPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.changePassword(currentPassword, newPassword);
  },

  logout(): void {
    removeStoredToken();
  },

  // Divisions & Districts
  async getDivisions(): Promise<Division[]> {
    return request<Division[]>('/api/divisions');
  },

  async getDistricts(): Promise<(District & { foodsCount: number })[]> {
    return request<(District & { foodsCount: number })[]>('/api/districts');
  },

  async getDistrictById(
    id: string
  ): Promise<{ district: District; division: Division; foods: Food[] }> {
    return request<{ district: District; division: Division; foods: Food[] }>(`/api/districts/${id}`);
  },

  async getCategories(): Promise<CategoryInfo[]> {
    return request<CategoryInfo[]>('/api/categories');
  },

  // Foods
  async getFoods(params?: {
    division?: string;
    district?: string;
    category?: string;
    dietary?: string;
    search?: string;
  }): Promise<Food[]> {
    const query = new URLSearchParams();
    if (params) {
      if (params.division) query.set('division', params.division);
      if (params.district) query.set('district', params.district);
      if (params.category) query.set('category', params.category);
      if (params.dietary) query.set('dietary', params.dietary);
      if (params.search) query.set('search', params.search);
    }
    const qStr = query.toString();
    return request<Food[]>(`/api/foods${qStr ? `?${qStr}` : ''}`);
  },

  async getFoodById(
    id: string
  ): Promise<{ food: Food; district: District; division: Division; reviews: FoodReview[] }> {
    return request<{ food: Food; district: District; division: Division; reviews: FoodReview[] }>(
      `/api/foods/${id}`
    );
  },

  async createFood(food: Partial<Food>): Promise<Food> {
    return request<Food>('/api/foods', {
      method: 'POST',
      body: JSON.stringify(food),
    });
  },

  async updateFood(id: string, updates: Partial<Food>): Promise<Food> {
    return request<Food>(`/api/foods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteFood(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/api/foods/${id}`, {
      method: 'DELETE',
    });
  },

  async togglePublishFood(id: string, isPublished: boolean): Promise<Food> {
    return request<Food>(`/api/foods/${id}/publish`, {
      method: 'PATCH',
      body: JSON.stringify({ isPublished }),
    });
  },

  // User Journey
  async getUserJourney(): Promise<
    (UserFoodTracking & { food?: Food; district?: District; division?: Division })[]
  > {
    return request<(UserFoodTracking & { food?: Food; district?: District; division?: Division })[]>(
      '/api/user/journey'
    );
  },

  async trackFood(
    foodId: string,
    status: 'tried' | 'want_to_try',
    extra?: { triedAt?: string; rating?: number; notes?: string; photoUrl?: string }
  ): Promise<UserFoodTracking> {
    return request<UserFoodTracking>('/api/user/journey', {
      method: 'POST',
      body: JSON.stringify({ foodId, status, ...extra }),
    });
  },

  async removeJourneyFood(foodId: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/user/journey/${foodId}`, {
      method: 'DELETE',
    });
  },

  async getUserAchievements(): Promise<Achievement[]> {
    return request<Achievement[]>('/api/user/achievements');
  },

  // Reviews
  async getReviews(foodId?: string): Promise<FoodReview[]> {
    return request<FoodReview[]>(`/api/reviews${foodId ? `?foodId=${foodId}` : ''}`);
  },

  async submitReview(foodId: string, rating: number, comment: string): Promise<FoodReview> {
    return request<FoodReview>('/api/reviews', {
      method: 'POST',
      body: JSON.stringify({ foodId, rating, comment }),
    });
  },

  async deleteReview(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/api/reviews/${id}`, {
      method: 'DELETE',
    });
  },

  // Stats
  async getStats(): Promise<PlatformStats> {
    return request<PlatformStats>('/api/stats');
  },

  // Admin
  async getAdminFoods(params?: {
    division?: string;
    district?: string;
    category?: string;
    search?: string;
    status?: 'all' | 'published' | 'draft';
  }): Promise<Food[]> {
    const query = new URLSearchParams();
    if (params) {
      if (params.division) query.set('division', params.division);
      if (params.district) query.set('district', params.district);
      if (params.category) query.set('category', params.category);
      if (params.search) query.set('search', params.search);
      if (params.status && params.status !== 'all') query.set('status', params.status);
    }
    const qStr = query.toString();
    return request<Food[]>(`/api/admin/foods${qStr ? `?${qStr}` : ''}`);
  },

  async getAdminOverview(): Promise<{
    totalUsers: number;
    totalFoods: number;
    publishedFoods: number;
    draftFoods: number;
    totalReviews: number;
    totalTrackingEntries: number;
    recentAudits: AuditLog[];
  }> {
    return request('/api/admin/overview');
  },

  async getAdminUsers(): Promise<UserProfile[]> {
    return request<UserProfile[]>('/api/admin/users');
  },

  async getAdminAuditLogs(): Promise<AuditLog[]> {
    return request<AuditLog[]>('/api/admin/audit-logs');
  },

  // Food Submissions (User & Admin)
  async submitFood(
    submissionData: Partial<FoodSubmission> & { confirmDuplicateOverride?: boolean }
  ): Promise<{ success: boolean; message: string; referenceId: string; submission: FoodSubmission }> {
    return request<{ success: boolean; message: string; referenceId: string; submission: FoodSubmission }>(
      '/api/submissions',
      {
        method: 'POST',
        body: JSON.stringify(submissionData),
      }
    );
  },

  async getUserSubmissions(): Promise<FoodSubmission[]> {
    return request<FoodSubmission[]>('/api/user/submissions');
  },

  async getUserSubmissionById(id: string): Promise<FoodSubmission> {
    return request<FoodSubmission>(`/api/user/submissions/${id}`);
  },

  async updateUserSubmission(id: string, updates: Partial<FoodSubmission>): Promise<FoodSubmission> {
    return request<FoodSubmission>(`/api/user/submissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async getAdminSubmissions(params?: {
    status?: string;
    search?: string;
    district?: string;
    division?: string;
  }): Promise<(FoodSubmission & { potentialDuplicate?: { id: string; nameEn: string; nameBn: string; districtId: string } | null })[]> {
    const query = new URLSearchParams();
    if (params) {
      if (params.status && params.status !== 'all') query.set('status', params.status);
      if (params.search) query.set('search', params.search);
      if (params.district && params.district !== 'all') query.set('district', params.district);
      if (params.division && params.division !== 'all') query.set('division', params.division);
    }
    const qStr = query.toString();
    return request<(FoodSubmission & { potentialDuplicate?: { id: string; nameEn: string; nameBn: string; districtId: string } | null })[]>(
      `/api/admin/submissions${qStr ? `?${qStr}` : ''}`
    );
  },

  async reviewAdminSubmission(
    id: string,
    review: {
      action: 'approve' | 'reject';
      adminFeedback?: string;
      correctedData?: Partial<FoodSubmission>;
      overrideReviewed?: boolean;
    }
  ): Promise<{ success: boolean; message: string; submission: FoodSubmission; food?: Food }> {
    return request<{ success: boolean; message: string; submission: FoodSubmission; food?: Food }>(
      `/api/admin/submissions/${id}/review`,
      {
        method: 'PUT',
        body: JSON.stringify(review),
      }
    );
  },

  // Direct Image File Upload System
  async uploadFoodImage(
    file: File,
    context?: 'food' | 'submission' | 'avatar',
    targetId?: string
  ): Promise<{
    success: boolean;
    imageUrl: string;
    storagePath: string;
    fileName: string;
    size: number;
    mimeType: string;
    provider?: string;
  }> {
    const token = getStoredToken();
    const formData = new FormData();
    formData.append('image', file);
    if (context) formData.append('context', context);
    if (targetId) formData.append('targetId', targetId);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000); // 35 seconds upload limit

    try {
      const res = await fetch('/api/upload/image', {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 504) {
          throw new Error('ছবি আপলোড করতে সময় বেশি লাগছে (504 Gateway Timeout)। অনুগ্রহ করে ফাইলের আকার ছোট করে পুনরায় চেষ্টা করুন।');
        }
        throw new Error(data.error || `Upload failed with status ${res.status}`);
      }

      return data;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('ছবি আপলোড করার সময়সীমা অতিক্রম করেছে (Upload timed out)। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
      }
      throw err;
    }
  },

  async uploadAvatarImage(file: File): Promise<{
    success: boolean;
    imageUrl: string;
    storagePath: string;
    fileName: string;
    size: number;
    mimeType: string;
    provider?: string;
  }> {
    return this.uploadFoodImage(file, 'avatar');
  },

  async deleteUploadedImage(fileName: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(
      `/api/upload/image/${encodeURIComponent(fileName)}`,
      {
        method: 'DELETE',
      }
    );
  },

  // Research-Based Content Audit & Dossier APIs
  async getResearchDossiers(): Promise<{
    totalDistricts: number;
    representedDistricts: number;
    unrepresentedDistricts: number;
    dossiersCount: number;
    dossiers: any[];
  }> {
    try {
      return await request('/api/research/dossiers');
    } catch {
      return await request('/api/admin/research/dossiers');
    }
  },

  async getDistrictResearch(districtId: string): Promise<any> {
    try {
      return await request(`/api/research/district/${districtId}`);
    } catch {
      return await request(`/api/admin/research/district/${districtId}`);
    }
  },

  async publishResearchDossier(payload: {
    districtId: string;
    customImageUrl?: string;
    customPrice?: number;
  }): Promise<{ success: boolean; message: string; food: Food }> {
    return request('/api/admin/research/publish-dossier', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

