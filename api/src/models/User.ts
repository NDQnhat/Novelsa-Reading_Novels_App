import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types/index';

const UserSchema = new Schema<IUser>(
  {
    id: { type: String, unique: true, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    avatarUrl: { type: String, default: null },
    role: {
      type: String,
      enum: ['USER', 'ADMIN', 'BANNED'],
      default: 'USER',
    },
    library: { type: [String], default: [] },
    downloadedChapters: { type: [String], default: [] },
  },
  { timestamps: true }
);

const User = mongoose.model<IUser>('User', UserSchema);

export default User;