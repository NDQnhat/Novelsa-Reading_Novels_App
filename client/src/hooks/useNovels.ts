import { useState, useEffect } from 'react';
import { Novel, NovelStatus } from '../types';
import { api } from '../services/api';
import { message } from 'antd';

export function useNovels() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      await api.createNovel(novel);
      setNovels((prev) => [...prev, novel]);
      return novel;
    } catch (error) {
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

  return { novels, loading, updateNovel, createNovel, deleteNovel, };
}
