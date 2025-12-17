import { Request, Response } from 'express';
import User from '../models/User';
import Novel from '../models/Novel';

/**
 * Get all users
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    console.error('[Admin] Get all users error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get users',
    });
  }
};

/**
 * Ban or unban user
 */
export const banUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { banned } = req.body;

    const user = await User.findOne({ id });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Update user role to BANNED or back to USER
    user.role = banned ? 'BANNED' : 'USER';
    await user.save();

    res.json({
      success: true,
      data: user,
      message: banned ? 'User banned' : 'User unbanned',
    });
  } catch (error: any) {
    console.error('[Admin] Ban user error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to ban user',
    });
  }
};

/**
 * Get novels by status
 */
export const getNovelsByStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status query parameter is required',
      });
    }

    const novels = await Novel.find({ status: status.toString().toUpperCase() });
    res.json({
      success: true,
      data: novels,
    });
  } catch (error: any) {
    console.error('[Admin] Get novels by status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get novels',
    });
  }
};

/**
 * Get all novels
 */
export const getAllNovels = async (req: Request, res: Response) => {
  try {
    // Get all novels except DRAFT (admin should only see PENDING, APPROVED, REJECTED)
    const novels = await Novel.find({ status: { $ne: 'DRAFT' } });
    res.json({
      success: true,
      data: novels,
    });
  } catch (error: any) {
    console.error('[Admin] Get all novels error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get novels',
    });
  }
};

/**
 * Approve novel
 */
export const approveNovel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('[Admin] Approving novel with id:', id);

    const updatedNovel = await Novel.findOneAndUpdate(
      { id },
      { status: 'APPROVED' },
      { new: true }
    );

    if (!updatedNovel) {
      return res.status(404).json({
        success: false,
        error: 'Novel not found',
      });
    }

    res.json({
      success: true,
      data: updatedNovel.toObject(),
      message: 'Novel approved',
    });
  } catch (error: any) {
    console.error('[Admin] Approve novel error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to approve novel',
    });
  }
};

/**
 * Reject novel
 */
export const rejectNovel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    console.log('[Admin] Rejecting novel with id:', id);

    const updatedNovel = await Novel.findOneAndUpdate(
      { id },
      { status: 'REJECTED' },
      { new: true }
    );

    if (!updatedNovel) {
      return res.status(404).json({
        success: false,
        error: 'Novel not found',
      });
    }

    res.json({
      success: true,
      data: updatedNovel.toObject(),
      message: 'Novel rejected',
    });
  } catch (error: any) {
    console.error('[Admin] Reject novel error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reject novel',
    });
  }
};

/**
 * Delete novel
 */
export const deleteNovel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const novel = await Novel.findOneAndDelete({ id });
    if (!novel) {
      return res.status(404).json({
        success: false,
        error: 'Novel not found',
      });
    }

    res.json({
      success: true,
      message: 'Novel deleted',
    });
  } catch (error: any) {
    console.error('[Admin] Delete novel error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete novel',
    });
  }
};
