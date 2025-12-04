import { Request, Response } from 'express';
import User from '../models/User';
import { RegisterRequest, LoginRequest, UpdateUserRequest, ApiResponse } from '../types/index';
import { IUser } from '../types/index';

export const register = async (
  req: Request<{}, {}, RegisterRequest>,
  res: Response<ApiResponse<IUser>>
): Promise<void> => {
  try {
    const { email, password, name, avatarUrl } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        error: 'Email, password, and name are required',
      });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'Email already exists',
      });
      return;
    }

    const newUser = new User({
      id: `user-${Date.now()}`,
      email,
      password, // TODO: Hash password with bcrypt in production
      name,
      avatarUrl: avatarUrl || null,
      role: 'USER',
      library: [],
      downloadedChapters: [],
    });

    const savedUser = await newUser.save();
    res.status(201).json({
      success: true,
      data: savedUser.toObject() as IUser,
      message: 'User registered successfully',
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

export const login = async (
  req: Request<{}, {}, LoginRequest>,
  res: Response<ApiResponse<IUser>>
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
      return;
    }

    const user = await User.findOne({ email, password });
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
      return;
    }

    res.json({
      success: true,
      data: user.toObject() as IUser,
      message: 'Login successful',
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

export const updateUser = async (
  req: Request<{ id: string }, {}, UpdateUserRequest>,
  res: Response<ApiResponse<IUser>>
): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedUser = await User.findOneAndUpdate({ id }, updates, { new: true });
    if (!updatedUser) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: updatedUser.toObject() as IUser,
      message: 'User updated successfully',
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};