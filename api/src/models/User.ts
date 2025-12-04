import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../types/index';

interface UserDocument extends IUser, Document {}

const UserSchema = new Schema<UserDocument>(
  {
    id: { type: String, unique: true, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    avatarUrl: { type: String, default: null },
    role: {
      type: String,
      enum: ['USER', 'ADMIN'],
      default: 'USER',
    },
    library: { type: [String], default: [] },
    downloadedChapters: { type: [String], default: [] },
  },
  { timestamps: true }
);

const User = mongoose.model<UserDocument>('User', UserSchema);

export default User;