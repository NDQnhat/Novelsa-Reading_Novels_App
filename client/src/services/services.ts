import axios, { AxiosResponse } from "axios";
import { Novel, User, Chapter, Comment, NovelStatus } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create Axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper: Execute Axios request and handle API response structure
async function apiCall<T>(
  apiFunc: () => Promise<AxiosResponse<any>>,
  errorMessage: string = "API request failed"
): Promise<T> {
  try {
    const response = await apiFunc();
    const data = response.data;

    // Handle API response with { success, data, message } structure
    if (data && typeof data === "object" && "success" in data && "data" in data) {
      return data.data as T;
    }

    // Return response data directly
    return data as T;
  } catch (error: any) {
    console.error(`[API] ${errorMessage}:`, error);
    
    // Extract error message from response
    const errorMsg = 
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      errorMessage;
    
    const customError = new Error(errorMsg);
    throw customError;
  }
}

// ============ UTILITY FUNCTIONS ============
export const utils = {
  /**
   * Calculate total reads from all chapters
   */
  calculateTotalReads: (novel: Novel): number => {
    if (!novel.chapters) return 0;
    return novel.chapters.reduce((sum, ch) => sum + (ch.readCount || 0), 0);
  },

  /**
   * Calculate total likes from all chapters
   */
  calculateTotalLikes: (novel: Novel): number => {
    if (!novel.chapters) return 0;
    return novel.chapters.reduce((sum, ch) => sum + (ch.likeCount || 0), 0);
  },

  /**
   * Format numbers: 1000 -> 1K, 1000000 -> 1M
   */
  formatNumber: (num: number): string => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  },

  /**
   * Static avatar URLs (fixed list, not random)
   */
  getAvatarUrls: (): string[] => [
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
  ],
};

// ============ AUTH ENDPOINTS ============
export const authAPI = {
  /**
   * Register new user
   */
  register: async (data: {
    email: string;
    password: string;
    name: string;
    avatarUrl?: string;
  }): Promise<User> => {
    return apiCall<User>(
      () => apiClient.post("/auth/register", data),
      "Registration failed"
    );
  },

  /**
   * Login user
   */
  login: async (email: string, password: string): Promise<User> => {
    return apiCall<User>(
      () => apiClient.post("/auth/login", { email, password }),
      "Login failed"
    );
  },

  /**
   * Update user profile
   */
  updateProfile: async (
    id: string,
    data: Partial<User>
  ): Promise<User> => {
    return apiCall<User>(
      () => apiClient.put(`/auth/users/${id}`, data),
      "Update profile failed"
    );
  },

  /**
   * Get user by ID
   */
  getUser: async (id: string): Promise<User> => {
    return apiCall<User>(
      () => apiClient.get(`/auth/users/${id}`),
      "Failed to fetch user"
    );
  },

  /**
   * Add novel to user library
   */
  addToLibrary: async (userId: string, novelId: string): Promise<User> => {
    return apiCall<User>(
      () => apiClient.post(`/auth/users/${userId}/library/${novelId}`),
      "Failed to add novel to library"
    );
  },

  /**
   * Remove novel from user library
   */
  removeFromLibrary: async (userId: string, novelId: string): Promise<User> => {
    return apiCall<User>(
      () => apiClient.delete(`/auth/users/${userId}/library/${novelId}`),
      "Failed to remove novel from library"
    );
  },
};

// ============ NOVEL ENDPOINTS ============
export const novelAPI = {
  /**
   * Get all novels (with optional filters)
   */
  getNovels: async (filters?: {
    status?: NovelStatus;
    authorId?: string;
    tags?: string[];
  }): Promise<Novel[]> => {
    try {
      const response = await apiClient.get("/novels", { params: filters });
      const data = response.data;

      // Handle API response structure
      if (
        data &&
        typeof data === "object" &&
        "success" in data &&
        "data" in data
      ) {
        return Array.isArray(data.data) ? data.data : [];
      }

      // Return as array if it's already an array
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("[API] Failed to fetch novels:", error);
      return [];
    }
  },

  /**
   * Get single novel by ID
   */
  getNovelById: async (id: string): Promise<Novel | null> => {
    try {
      return await apiCall<Novel>(
        () => apiClient.get(`/novels/${id}`),
        `Failed to fetch novel ${id}`
      );
    } catch {
      return null;
    }
  },

  /**
   * Create new novel
   */
  createNovel: async (data: {
    authorId: string;
    authorName: string;
    title: string;
    description: string;
    coverUrl: string;
    tags?: string[];
  }): Promise<Novel> => {
    return apiCall<Novel>(
      () => apiClient.post("/novels", data),
      "Failed to create novel"
    );
  },

  /**
   * Update novel details (title, description, cover, status, tags)
   */
  updateNovel: async (
    id: string,
    updates: Partial<{
      title: string;
      description: string;
      coverUrl: string;
      status: NovelStatus;
      tags: string[];
    }>
  ): Promise<Novel> => {
    return apiCall<Novel>(
      () => apiClient.put(`/novels/${id}`, updates),
      "Failed to update novel"
    );
  },

  /**
   * Delete novel
   */
  deleteNovel: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/novels/${id}`);
    } catch (error) {
      console.error("[API] Failed to delete novel:", error);
      throw error;
    }
  },

  /**
   * Search novels by query
   */
  searchNovels: async (query: string): Promise<Novel[]> => {
    try {
      return await apiCall<Novel[]>(
        () => apiClient.get("/novels/search", { params: { q: query } }),
        "Failed to search novels"
      );
    } catch {
      return [];
    }
  },
};

// ============ CHAPTER ENDPOINTS ============
export const chapterAPI = {
  /**
   * Create chapter in novel
   */
  createChapter: async (
    novelId: string,
    data: {
      title: string;
      content: string;
      order: number;
    }
  ): Promise<Chapter> => {
    return apiCall<Chapter>(
      () => apiClient.post(`/novels/${novelId}/chapters`, data),
      "Failed to create chapter"
    );
  },

  /**
   * Update chapter
   */
  updateChapter: async (
    novelId: string,
    chapterId: string,
    updates: Partial<{
      title: string;
      content: string;
      order: number;
    }>
  ): Promise<Chapter> => {
    return apiCall<Chapter>(
      () => apiClient.put(`/novels/${novelId}/chapters/${chapterId}`, updates),
      "Failed to update chapter"
    );
  },

  /**
   * Delete chapter
   */
  deleteChapter: async (novelId: string, chapterId: string): Promise<void> => {
    try {
      await apiClient.delete(`/novels/${novelId}/chapters/${chapterId}`);
    } catch (error) {
      console.error("[API] Failed to delete chapter:", error);
      throw error;
    }
  },

  /**
   * Get chapter by ID
   */
  getChapter: async (novelId: string, chapterId: string): Promise<Chapter | null> => {
    try {
      return await apiCall<Chapter>(
        () => apiClient.get(`/novels/${novelId}/chapters/${chapterId}`),
        `Failed to fetch chapter ${chapterId}`
      );
    } catch {
      return null;
    }
  },

  /**
   * Increment read count for chapter
   */
  incrementReadCount: async (novelId: string, chapterId: string): Promise<void> => {
    try {
      await apiClient.post(`/novels/${novelId}/chapters/${chapterId}/read`);
    } catch (error) {
      console.error("[API] Failed to increment read count:", error);
    }
  },

  /**
   * Toggle like for chapter
   */
  toggleLike: async (novelId: string, chapterId: string): Promise<void> => {
    try {
      await apiClient.post(`/novels/${novelId}/chapters/${chapterId}/like`);
    } catch (error) {
      console.error("[API] Failed to toggle like:", error);
    }
  },
};

// ============ ADMIN API ============
export const adminAPI = {
  /**
   * Get all users
   */
  getAllUsers: async (): Promise<User[]> => {
    try {
      return await apiCall<User[]>(
        () => apiClient.get("/admin/users"),
        "Failed to fetch users"
      );
    } catch {
      return [];
    }
  },

  /**
   * Ban/unban user
   */
  banUser: async (userId: string, banned: boolean): Promise<User> => {
    return apiCall<User>(
      () => apiClient.post(`/admin/users/${userId}/ban`, { banned }),
      "Failed to update user status"
    );
  },

  /**
   * Get novels by status
   */
  getNovelsByStatus: async (status: string): Promise<Novel[]> => {
    try {
      return await apiCall<Novel[]>(
        () => apiClient.get(`/admin/novels`, { params: { status } }),
        "Failed to fetch novels"
      );
    } catch {
      return [];
    }
  },

  /**
   * Get all novels (all statuses)
   */
  getAllNovels: async (): Promise<Novel[]> => {
    try {
      return await apiCall<Novel[]>(
        () => apiClient.get("/admin/novels/all"),
        "Failed to fetch all novels"
      );
    } catch {
      return [];
    }
  },

  /**
   * Approve novel
   */
  approveNovel: async (novelId: string): Promise<Novel> => {
    return apiCall<Novel>(
      () => apiClient.post(`/admin/novels/${novelId}/approve`),
      "Failed to approve novel"
    );
  },

  /**
   * Reject novel
   */
  rejectNovel: async (novelId: string, reason?: string): Promise<Novel> => {
    return apiCall<Novel>(
      () => apiClient.post(`/admin/novels/${novelId}/reject`, { reason }),
      "Failed to reject novel"
    );
  },

  /**
   * Delete novel
   */
  deleteNovel: async (novelId: string): Promise<void> => {
    try {
      await apiClient.delete(`/admin/novels/${novelId}`);
    } catch (error) {
      console.error("[API] Failed to delete novel:", error);
      throw error;
    }
  },
};


export const commentAPI = {
  /**
   * Add comment to chapter
   */
  addComment: async (
    novelId: string,
    chapterId: string,
    data: {
      userId: string;
      userName: string;
      userAvatar: string;
      content: string;
    }
  ): Promise<Comment> => {
    return apiCall<Comment>(
      () =>
        apiClient.post(
          `/novels/${novelId}/chapters/${chapterId}/comments`,
          data
        ),
      "Failed to add comment"
    );
  },

  /**
   * Delete comment
   */
  deleteComment: async (
    novelId: string,
    chapterId: string,
    commentId: string
  ): Promise<void> => {
    try {
      await apiClient.delete(
        `/novels/${novelId}/chapters/${chapterId}/comments/${commentId}`
      );
    } catch (error) {
      console.error("[API] Failed to delete comment:", error);
      throw error;
    }
  },
};

// ============ AGGREGATED API OBJECT (for backward compatibility) ============
export const api = {
  // Auth
  login: authAPI.login,
  register: authAPI.register,
  updateUser: authAPI.updateProfile,
  updateProfile: authAPI.updateProfile,
  addToLibrary: authAPI.addToLibrary,
  removeFromLibrary: authAPI.removeFromLibrary,

  // Novels
  getNovels: novelAPI.getNovels,
  getNovelById: novelAPI.getNovelById,
  createNovel: novelAPI.createNovel,
  updateNovel: novelAPI.updateNovel,
  deleteNovel: novelAPI.deleteNovel,
  searchNovels: novelAPI.searchNovels,

  // Chapters
  createChapter: chapterAPI.createChapter,
  updateChapter: chapterAPI.updateChapter,
  deleteChapter: chapterAPI.deleteChapter,
  getChapter: chapterAPI.getChapter,
  incrementReadCount: chapterAPI.incrementReadCount,
  toggleLike: chapterAPI.toggleLike,

  // Comments
  addComment: commentAPI.addComment,
  deleteComment: commentAPI.deleteComment,

  // Admin
  getAllUsers: adminAPI.getAllUsers,
  banUser: adminAPI.banUser,
  getNovelsByStatus: adminAPI.getNovelsByStatus,
  getAllNovels: adminAPI.getAllNovels,
  approveNovel: adminAPI.approveNovel,
  rejectNovel: adminAPI.rejectNovel,
  deleteNovelAdmin: adminAPI.deleteNovel,

  // Utils
  utils,
};

export default api;
