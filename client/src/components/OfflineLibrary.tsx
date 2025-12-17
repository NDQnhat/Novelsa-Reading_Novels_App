/**
 * OfflineLibrary Component
 * Hiển thị danh sách novels đã lưu offline
 */

import React, { useEffect, useState } from 'react';
import { Trash2, Download, Loader } from 'lucide-react';
import { indexedDB, type StoredNovel } from '../services/indexedDBService';
import { useAuth } from '../hooks/useAuth';
import { NovelCard } from './index';

interface OfflineLibraryProps {
  onReadNovel?: (novelId: string) => void;
}

export default function OfflineLibrary({ onReadNovel }: OfflineLibraryProps) {
  const { currentUser } = useAuth();
  const [novels, setNovels] = useState<StoredNovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageInfo, setStorageInfo] = useState<{
    usage: number;
    quota: number;
    percentUsed: number;
    novelsCount: number;
    chaptersCount: number;
  } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load offline novels
  useEffect(() => {
    loadOfflineNovels();
  }, []);

  // Load storage info periodically
  useEffect(() => {
    const loadStorageInfo = async () => {
      const info = await indexedDB.getStorageInfo();
      setStorageInfo(info);
    };

    loadStorageInfo();
    const interval = setInterval(loadStorageInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadOfflineNovels = async () => {
    try {
      setLoading(true);
      const data = await indexedDB.getAllNovels();
      setNovels(data);
    } catch (err) {
      console.error('[OfflineLibrary] Load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (novelId: string) => {
    if (!window.confirm('Xoá truyện này khỏi offline?')) return;

    try {
      setDeletingId(novelId);
      await indexedDB.deleteNovel(novelId);
      setNovels((prev) => prev.filter((n) => n.id !== novelId));
    } catch (err) {
      console.error('[OfflineLibrary] Delete failed:', err);
      alert('Lỗi khi xoá truyện');
    } finally {
      setDeletingId(null);
    }
  };

  const handleReadNovel = (novelId: string) => {
    if (onReadNovel) {
      onReadNovel(novelId);
    } else {
      // Navigate to offline reader
      window.location.hash = `/offline-reader/${novelId}`;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <Loader className="animate-spin text-amber-500" size={32} />
          <p className="text-slate-300">Đang tải thư viện offline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Storage info */}
      {storageInfo && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-300">
                Dung lượng: {formatBytes(storageInfo.usage)} / {formatBytes(storageInfo.quota)}
              </span>
              <span className="text-slate-400">
                {Math.round(storageInfo.percentUsed)}%
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  storageInfo.percentUsed > 90
                    ? 'bg-red-500'
                    : storageInfo.percentUsed > 70
                    ? 'bg-orange-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${storageInfo.percentUsed}%` }}
              />
            </div>
            <div className="text-xs text-slate-400">
              {storageInfo.novelsCount} truyện • {storageInfo.chaptersCount} chương
            </div>
          </div>
        </div>
      )}

      {/* Novels grid */}
      {novels.length === 0 ? (
        <div className="text-center py-12">
          <Download size={48} className="mx-auto text-slate-500 mb-4" />
          <p className="text-slate-300 mb-2">Chưa có truyện offline</p>
          <p className="text-slate-400 text-sm">
            Quay lại online để tải truyện về
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {novels.map((novel) => (
            <div
              key={novel.id}
              className="group cursor-pointer"
              onClick={() => handleReadNovel(novel.id)}
            >
              <div className="relative">
                <NovelCard
                  novel={{
                    id: novel.id,
                    title: novel.title,
                    author: novel.author,
                    coverImage: novel.coverImage,
                    genre: novel.genre,
                    rating: novel.rating,
                    viewCount: novel.viewCount,
                  }}
                />
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(novel.id);
                  }}
                  className={`
                    absolute top-2 right-2 p-2 bg-red-900/80 hover:bg-red-800
                    text-red-100 rounded-lg opacity-0 group-hover:opacity-100
                    transition-opacity ${deletingId === novel.id ? 'opacity-100' : ''}
                  `}
                  disabled={deletingId === novel.id}
                >
                  {deletingId === novel.id ? (
                    <Loader size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>

                {/* Progress badge */}
                {novel.readProgress !== undefined && novel.readProgress > 0 && (
                  <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs text-slate-200">
                    {Math.round(novel.readProgress)}%
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="mt-2">
                <h3 className="font-semibold text-slate-200 truncate group-hover:text-amber-400 transition-colors">
                  {novel.title}
                </h3>
                <p className="text-sm text-slate-400">{novel.author}</p>
                {novel.totalChapters > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    {novel.totalChapters} chương
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cleanup old data button */}
      {novels.length > 0 && (
        <div className="flex justify-end gap-2">
          <button
            onClick={async () => {
              const deleted = await indexedDB.cleanupOldData(30);
              alert(`Xoá ${deleted} truyện cũ`);
              loadOfflineNovels();
            }}
            className="
              px-4 py-2 text-sm text-slate-300 hover:text-slate-100
              border border-slate-600 hover:border-slate-500 rounded-lg
              transition-colors
            "
          >
            Dọn dẹp dữ liệu cũ
          </button>
        </div>
      )}
    </div>
  );
}
