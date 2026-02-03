/**
 * Application constants and configuration
 */

export const APP_NAME = 'Novelsa';
export const APP_VERSION = '1.1.0';

/**
 * API Configuration
 */
export const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined);
export const API_TIMEOUT = 5000; // 5 seconds

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  CURRENT_USER: 'currentUser',
  OFFLINE_NOVEL_PREFIX: 'offline_novel_',
  SEARCH_HISTORY: 'searchHistory',
  THEME_PREFERENCE: 'themePreference',
} as const;

/**
 * Novel Status
 */
export const NOVEL_STATUS = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

/**
 * User Roles
 */
export const USER_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;

/**
 * Tab Routes
 */
export const TABS = {
  HOME: 'home',
  LIBRARY: 'library',
  OFFLINE: 'offline',
  WRITE: 'write',
  ADMIN: 'admin',
  PROFILE: 'profile',
} as const;

/**
 * Reader Themes
 */
export const READER_THEMES = {
  DARK: 'dark',
  LIGHT: 'light',
  SEPIA: 'sepia',
} as const;

/**
 * Pagination
 */
export const PAGINATION = {
  NOVELS_PER_PAGE: 20,
  CHAPTERS_PER_PAGE: 50,
  COMMENTS_PER_PAGE: 10,
} as const;

/**
 * Messages
 */
export const MESSAGES = {
  AUTH: {
    LOGIN_SUCCESS: (name: string) => `Chào mừng trở lại, ${name}!`,
    REGISTER_SUCCESS: 'Đăng ký tài khoản thành công!',
    LOGOUT_SUCCESS: 'Đã đăng xuất.',
    LOGIN_REQUIRED: 'Bạn cần đăng nhập để truy cập tính năng này.',
  },
  NOVEL: {
    CREATE_SUCCESS: 'Đã tạo bản thảo mới!',
    UPDATE_SUCCESS: 'Đã cập nhật truyện!',
    DELETE_SUCCESS: 'Đã xóa truyện.',
    SUBMIT_SUCCESS: 'Đã gửi yêu cầu duyệt! Vui lòng chờ phản hồi.',
    NO_CHAPTERS: 'Cần ít nhất 1 chương để đăng truyện!',
  },
  LIBRARY: {
    ADD_SUCCESS: 'Đã thêm vào tủ sách & tải offline!',
    REMOVE_SUCCESS: 'Đã xóa khỏi tủ sách.',
  },
  COMMENT: {
    ADD_SUCCESS: 'Đã gửi bình luận!',
    ADD_ERROR: 'Không thể gửi bình luận',
  },
  PROFILE: {
    UPDATE_SUCCESS: 'Cập nhật thông tin thành công!',
    UPDATE_ERROR: 'Có lỗi xảy ra khi cập nhật',
    SAVE_CHAPTER_SUCCESS: 'Đã lưu nội dung chương!',
  },
  ADMIN: {
    APPROVE_SUCCESS: 'Đã duyệt truyện!',
    REJECT_SUCCESS: 'Đã từ chối truyện.',
    APPROVE_ERROR: 'Lỗi khi duyệt truyện',
    REJECT_ERROR: 'Lỗi khi từ chối truyện',
  },
  ERROR: {
    GENERAL: 'Có lỗi xảy ra',
    NETWORK: 'Lỗi kết nối mạng',
    NOT_FOUND: 'Không tìm thấy dữ liệu',
  },
} as const;

/**
 * Color Constants
 */
export const COLORS = {
  PRIMARY: '#FCD34D', // Amber 400
  SECONDARY: '#64748B', // Slate 500
  SUCCESS: '#10B981', // Green 500
  DANGER: '#EF4444', // Red 500
  WARNING: '#F59E0B', // Amber 500
} as const;

/**
 * Avatar URLs for mock data
 */
export const MOCK_AVATARS = [
  'https://picsum.photos/100/100?random=1',
  'https://picsum.photos/100/100?random=2',
  'https://picsum.photos/100/100?random=3',
  'https://picsum.photos/100/100?random=4',
  'https://picsum.photos/100/100?random=5',
] as const;
