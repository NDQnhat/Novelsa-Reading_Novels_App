import { Request, Response } from 'express';
import Novel from '../models/Novel';
import { CreateNovelRequest, UpdateNovelRequest, ApiResponse } from '../types/index';
import { INovel } from '../types/index';

export const getNovels = async (
  req: Request,
  res: Response<ApiResponse<INovel[]>>
): Promise<void> => {
  try {
    const novels = await Novel.find().sort({ updatedAt: -1 });
    res.json({
      success: true,
      data: novels.map((n) => n.toObject() as INovel),
      message: 'Novels retrieved successfully',
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

export const createNovel = async (
  req: Request<{}, {}, CreateNovelRequest>,
  res: Response<ApiResponse<INovel>>
): Promise<void> => {
  try {
    const { authorId, authorName, title, description, coverUrl, tags } = req.body;

    // Validate all required fields
    const missingFields = [];
    if (!authorId) missingFields.push('authorId');
    if (!authorName) missingFields.push('authorName');
    if (!title) missingFields.push('title');
    if (!description && description !== '') missingFields.push('description');
    if (!coverUrl) missingFields.push('coverUrl');

    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
      });
      return;
    }

    const newNovel = new Novel({
      id: `novel-${Date.now()}`,
      authorId,
      authorName,
      title,
      description,
      coverUrl,
      tags: tags || [],
      status: 'DRAFT',
      chapters: [],
    });

    const savedNovel = await newNovel.save();
    res.status(201).json({
      success: true,
      data: savedNovel.toObject() as INovel,
      message: 'Novel created successfully',
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

export const updateNovel = async (
  req: Request<{ id: string }, {}, UpdateNovelRequest>,
  res: Response<ApiResponse<INovel>>
): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedNovel = await Novel.findOneAndUpdate({ id }, updates, { new: true });
    if (!updatedNovel) {
      res.status(404).json({
        success: false,
        error: 'Novel not found',
      });
      return;
    }

    res.json({
      success: true,
      data: updatedNovel.toObject() as INovel,
      message: 'Novel updated successfully',
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

export const deleteNovel = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<null>>
): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedNovel = await Novel.findOneAndDelete({ id });
    if (!deletedNovel) {
      res.status(404).json({
        success: false,
        error: 'Novel not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Novel deleted successfully',
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};