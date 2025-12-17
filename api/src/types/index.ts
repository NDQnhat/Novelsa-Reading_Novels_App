// User types
export interface IUser {
  _id?: string;
  id: string;
  email: string;
  password: string;
  name: string;
  avatarUrl?: string;
  role: 'USER' | 'ADMIN' | 'BANNED';
  library: string[];
  downloadedChapters: string[];
  createdAt?: number;
  updatedAt?: number;
}

// Comment types
export interface IComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: number;
}

// Chapter types
export interface IChapter {
  id: string;
  novelId: string;
  title: string;
  content: string;
  order: number;
  readCount: number;
  likeCount: number;
  comments: IComment[];
  publishedAt: number;
}

// Novel types
export interface INovel {
  _id?: string;
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  description: string;
  coverUrl: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  tags: string[];
  createdAt: number;
  updatedAt: number;
  chapters: IChapter[];
}

// Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Request/Response bodies
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  avatarUrl?: string;
}

export interface UpdateUserRequest {
  name?: string;
  avatarUrl?: string;
  password?: string;
}

export interface CreateNovelRequest {
  authorId: string;
  authorName: string;
  title: string;
  description: string;
  coverUrl: string;
  tags: string[];
}

export interface UpdateNovelRequest {
  title?: string;
  description?: string;
  coverUrl?: string;
  status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  tags?: string[];
}
