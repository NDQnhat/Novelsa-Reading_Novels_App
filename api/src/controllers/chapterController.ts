import { Request, Response } from 'express';
import Novel from '../models/Novel';
import { ApiResponse, IChapter, IComment } from '../types/index';

// ============ CHAPTER OPERATIONS ============

export const createChapter = async (
  req: Request<{ id: string }, {}, Omit<IChapter, 'id' | 'publishedAt'>>,
  res: Response<ApiResponse<IChapter>>
): Promise<void> => {
  try {
    const { id: novelId } = req.params;
    const { title, content, order } = req.body;

    if (!title || !content || order === undefined) {
      res.status(400).json({
        success: false,
        error: 'title, content, and order are required',
      });
      return;
    }

    const novel = await Novel.findOne({ id: novelId });
    if (!novel) {
      res.status(404).json({
        success: false,
        error: 'Novel not found',
      });
      return;
    }

    const newChapter: IChapter = {
      id: `ch-${Date.now()}`,
      novelId,
      title,
      content,
      order,
      readCount: 0,
      likeCount: 0,
      comments: [],
      publishedAt: Date.now(),
    };

    novel.chapters.push(newChapter);
    await novel.save();

    res.status(201).json({
      success: true,
      data: newChapter,
      message: 'Chapter created successfully',
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

export const updateChapter = async (
  req: Request<
    { id: string; chapterId: string },
    {},
    Partial<Omit<IChapter, 'id' | 'novelId' | 'publishedAt'>>
  >,
  res: Response<ApiResponse<IChapter>>
): Promise<void> => {
  try {
    const { id: novelId, chapterId } = req.params;

    const novel = await Novel.findOne({ id: novelId });
    if (!novel) {
      res.status(404).json({
        success: false,
        error: 'Novel not found',
      });
      return;
    }

    const chapter = novel.chapters.find((ch) => ch.id === chapterId);
    if (!chapter) {
      res.status(404).json({
        success: false,
        error: 'Chapter not found',
      });
      return;
    }

    // Update chapter fields
    const { title, content, order } = req.body;
    if (title !== undefined) chapter.title = title;
    if (content !== undefined) chapter.content = content;
    if (order !== undefined) chapter.order = order;

    await novel.save();

    res.json({
      success: true,
      data: chapter,
      message: 'Chapter updated successfully',
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

export const deleteChapter = async (
  req: Request<{ id: string; chapterId: string }>,
  res: Response<ApiResponse<null>>
): Promise<void> => {
  try {
    const { id: novelId, chapterId } = req.params;

    const novel = await Novel.findOne({ id: novelId });
    if (!novel) {
      res.status(404).json({
        success: false,
        error: 'Novel not found',
      });
      return;
    }

    const chapterIndex = novel.chapters.findIndex((ch) => ch.id === chapterId);
    if (chapterIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Chapter not found',
      });
      return;
    }

    novel.chapters.splice(chapterIndex, 1);
    await novel.save();

    res.json({
      success: true,
      message: 'Chapter deleted successfully',
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

export const getChapter = async (
  req: Request<{ id: string; chapterId: string }>,
  res: Response<ApiResponse<IChapter>>
): Promise<void> => {
  try {
    const { id: novelId, chapterId } = req.params;

    const novel = await Novel.findOne({ id: novelId });
    if (!novel) {
      res.status(404).json({
        success: false,
        error: 'Novel not found',
      });
      return;
    }

    const chapter = novel.chapters.find((ch) => ch.id === chapterId);
    if (!chapter) {
      res.status(404).json({
        success: false,
        error: 'Chapter not found',
      });
      return;
    }

    res.json({
      success: true,
      data: chapter,
      message: 'Chapter retrieved successfully',
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

// ============ READ COUNT ============

export const incrementReadCount = async (
  req: Request<{ id: string; chapterId: string }>,
  res: Response<ApiResponse<null>>
): Promise<void> => {
  try {
    const { id: novelId, chapterId } = req.params;

    const novel = await Novel.findOne({ id: novelId });
    if (!novel) {
      res.status(404).json({
        success: false,
        error: 'Novel not found',
      });
      return;
    }

    const chapter = novel.chapters.find((ch) => ch.id === chapterId);
    if (!chapter) {
      res.status(404).json({
        success: false,
        error: 'Chapter not found',
      });
      return;
    }

    chapter.readCount = (chapter.readCount || 0) + 1;
    await novel.save();

    res.json({
      success: true,
      message: 'Read count incremented',
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

// ============ LIKE TOGGLE ============

export const toggleLike = async (
  req: Request<{ id: string; chapterId: string }>,
  res: Response<ApiResponse<null>>
): Promise<void> => {
  try {
    const { id: novelId, chapterId } = req.params;

    const novel = await Novel.findOne({ id: novelId });
    if (!novel) {
      res.status(404).json({
        success: false,
        error: 'Novel not found',
      });
      return;
    }

    const chapter = novel.chapters.find((ch) => ch.id === chapterId);
    if (!chapter) {
      res.status(404).json({
        success: false,
        error: 'Chapter not found',
      });
      return;
    }

    chapter.likeCount = (chapter.likeCount || 0) + 1;
    await novel.save();

    res.json({
      success: true,
      message: 'Like toggled',
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

// ============ COMMENTS ============

export const addComment = async (
  req: Request<
    { id: string; chapterId: string },
    {},
    Omit<IComment, 'id' | 'timestamp'>
  >,
  res: Response<ApiResponse<IComment>>
): Promise<void> => {
  try {
    const { id: novelId, chapterId } = req.params;
    const { userId, userName, userAvatar, content } = req.body;

    if (!userId || !userName || !content) {
      res.status(400).json({
        success: false,
        error: 'userId, userName, and content are required',
      });
      return;
    }

    const novel = await Novel.findOne({ id: novelId });
    if (!novel) {
      res.status(404).json({
        success: false,
        error: 'Novel not found',
      });
      return;
    }

    const chapter = novel.chapters.find((ch) => ch.id === chapterId);
    if (!chapter) {
      res.status(404).json({
        success: false,
        error: 'Chapter not found',
      });
      return;
    }

    const newComment: IComment = {
      id: `cmt-${Date.now()}`,
      userId,
      userName,
      userAvatar,
      content,
      timestamp: Date.now(),
    };

    chapter.comments.push(newComment);
    await novel.save();

    res.status(201).json({
      success: true,
      data: newComment,
      message: 'Comment added successfully',
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

export const deleteComment = async (
  req: Request<{ id: string; chapterId: string; commentId: string }>,
  res: Response<ApiResponse<null>>
): Promise<void> => {
  try {
    const { id: novelId, chapterId, commentId } = req.params;

    const novel = await Novel.findOne({ id: novelId });
    if (!novel) {
      res.status(404).json({
        success: false,
        error: 'Novel not found',
      });
      return;
    }

    const chapter = novel.chapters.find((ch) => ch.id === chapterId);
    if (!chapter) {
      res.status(404).json({
        success: false,
        error: 'Chapter not found',
      });
      return;
    }

    const commentIndex = chapter.comments.findIndex((c) => c.id === commentId);
    if (commentIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Comment not found',
      });
      return;
    }

    chapter.comments.splice(commentIndex, 1);
    await novel.save();

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};
