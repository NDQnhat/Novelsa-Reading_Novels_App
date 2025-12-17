import { useState, useEffect } from 'react';
import { Novel, NovelStatus } from '../types';
import { api } from '../services/api';
import { message } from 'antd';

export function useNovels() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNovels = async () => {
    try {
      const fetchedNovels = await api.getNovels();
      // Ensure we always have an array
      const novelArray = Array.isArray(fetchedNovels) ? fetchedNovels : [];
      setNovels(novelArray);
    } catch (error) {
      console.error('Failed to load novels', error);
      message.error('Không thể tải dữ liệu truyện');
      setNovels([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNovels();
  }, []);

  const updateNovel = async (id: string, updates: Partial<Novel>) => {
    try {
      await api.updateNovel(id, updates);
      setNovels((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
      );
    } catch (error) {
      message.error('Có lỗi xảy ra');
      throw error;
    }
  };

  const createNovel = async (novel: Novel) => {
    try {
      // Only send required fields to API with validation
      const apiPayload = {
        authorId: novel.authorId || 'unknown',
        authorName: novel.authorName || 'Tác giả',
        title: novel.title || 'Truyện mới',
        description: novel.description || 'Mô tả truyện',
        coverUrl: novel.coverUrl || 'https://images.unsplash.com/photo-1507842217343-583f20270319?w=300&h=450&fit=crop',
        tags: novel.tags || ['Truyện'],
      };

      console.log('[useNovels] Creating novel with payload:', apiPayload);

      const createdNovel = await api.createNovel(apiPayload);
      setNovels((prev) => [...prev, createdNovel]);
      return createdNovel;
    } catch (error) {
      console.error('[useNovels] Create novel error:', error);
      message.error('Không thể tạo truyện mới');
      throw error;
    }
  };

  const deleteNovel = async (id: string) => {
    try {
      await api.deleteNovel(id);
      setNovels((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      message.error('Không thể xóa truyện');
      throw error;
    }
  };

  return { novels, loading, updateNovel, createNovel, deleteNovel, refetchNovels: loadNovels };
}
