import axios, { AxiosResponse } from "axios";
import { Novel, User } from "../types";
import { MOCK_NOVELS, MOCK_USER } from "./mockService";

const API_URL = "http://localhost:5000/api";

// Create Axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 2000, // 2 seconds timeout to trigger fallback quickly if backend is down
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper: Execute Axios request, if fails (timeout/network error), return fallback
async function withFallback<T>(
  apiCall: () => Promise<AxiosResponse<any>>,
  fallbackValue: T | (() => T),
  errorMessage: string = "Service unavailable"
): Promise<T> {
  try {
    const response = await apiCall();
    const data = response.data;
    
    // Handle API response with { success, data, message } structure
    if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
      return data.data as T;
    }
    
    // Otherwise return response data directly
    return data as T;
  } catch (error) {
    console.warn(`[API] ${errorMessage}. Switching to Mock Data.`, error);
    return typeof fallbackValue === "function"
      ? (fallbackValue as Function)()
      : fallbackValue;
  }
}

export const api = {
  // Auth
  login: async (email: string, password: string): Promise<User> => {
    return withFallback(
      () => apiClient.post<User>("/auth/login", { email, password }),
      () => ({ ...MOCK_USER, email, name: email.split("@")[0] }), // Fallback user
      "Login failed"
    );
  },

  register: async (data: Partial<User>): Promise<User> => {
    return withFallback(
      () => apiClient.post<User>("/auth/register", data),
      () => ({ ...MOCK_USER, ...data, id: `mock-${Date.now()}` } as User),
      "Registration failed"
    );
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    return withFallback(
      () => apiClient.put<User>(`/users/${id}`, data),
      () => ({ ...MOCK_USER, ...data } as User),
      "Update User failed"
    );
  },

  // Novels
  getNovels: async (): Promise<Novel[]> => {
    try {
      const response = await apiClient.get("/novels");
      const data = response.data;
      
      // Handle API response structure
      if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
        return Array.isArray(data.data) ? data.data : MOCK_NOVELS;
      }
      
      // Return as array if it's already an array
      return Array.isArray(data) ? data : MOCK_NOVELS;
    } catch (error) {
      console.warn("[API] Get Novels failed. Switching to Mock Data.", error);
      return MOCK_NOVELS;
    }
  },

  createNovel: async (novel: Novel): Promise<Novel> => {
    return withFallback(
      () => apiClient.post<Novel>("/novels", novel),
      novel,
      "Create Novel failed"
    );
  },

  updateNovel: async (id: string, updates: Partial<Novel>): Promise<Novel> => {
    return withFallback(
      () => apiClient.put<Novel>(`/novels/${id}`, updates),
      () => {
        // Simple fallback logic for update: return merged data
        const original = MOCK_NOVELS.find((n) => n.id === id) || ({} as Novel);
        return { ...original, ...updates };
      },
      "Update Novel failed"
    );
  },

  deleteNovel: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/novels/${id}`);
    } catch (e) {
      console.warn("Mock delete active (backend unreachable)");
    }
  },
};
