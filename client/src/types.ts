export enum NovelStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: number;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
  readCount: number;
  likeCount?: number;
  comments: Comment[];
  publishedAt: number;
}

export interface Novel {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  description: string;
  coverUrl: string;
  status: NovelStatus;
  tags: string[];
  createdAt?: number;
  updatedAt?: number;
  chapters: Chapter[];
}

export interface User {
  id: string;
  email: string; // Added
  password: string; // Added (In real app, this is hashed)
  name: string;
  avatarUrl: string;
  role: UserRole;
  library: string[]; // Array of Novel IDs
  downloadedChapters: string[]; // Array of Chapter IDs available offline
}