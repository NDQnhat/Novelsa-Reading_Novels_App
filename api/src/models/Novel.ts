import mongoose, { Schema, Document } from 'mongoose';
import { INovel, IChapter, IComment } from '../types/index';

interface CommentDocument extends IComment, Document {}
interface ChapterDocument extends IChapter, Document {}
interface NovelDocument extends INovel, Document {}

const CommentSchema = new Schema<CommentDocument>(
  {
    id: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String, default: null },
    content: { type: String, required: true },
    timestamp: { type: Number, default: Date.now },
  },
  { _id: false }
);

const ChapterSchema = new Schema<ChapterDocument>(
  {
    id: { type: String, required: true },
    novelId: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    order: { type: Number, required: true },
    readCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    comments: { type: [CommentSchema], default: [] },
    publishedAt: { type: Number, default: Date.now },
  },
  { _id: false }
);

const NovelSchema = new Schema<NovelDocument>(
  {
    id: { type: String, unique: true, required: true },
    authorId: { type: String, required: true },
    authorName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    coverUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'DRAFT',
    },
    tags: { type: [String], default: [] },
    chapters: { type: [ChapterSchema], default: [] },
  },
  { timestamps: true }
);

const Novel = mongoose.model<NovelDocument>('Novel', NovelSchema);

export default Novel;