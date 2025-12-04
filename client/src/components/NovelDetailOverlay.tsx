import React, { useState } from 'react';
import { Novel } from '../types';
import { ChevronLeft, Plus, Check } from 'lucide-react';
import { message } from 'antd';
import { AuthModal } from './AuthModal';
import { User } from '../types';

interface NovelDetailOverlayProps {
  novel: Novel;
  currentUser: User | null;
  onBack: () => void;
  onReadChapter: (novelId: string, chapterId: string) => void;
  onToggleSave: () => Promise<void>;
  isSaved: boolean;
  onRequestLogin: () => void;
}

export function NovelDetailOverlay({
  novel,
  currentUser,
  onBack,
  onReadChapter,
  onToggleSave,
  isSaved,
  onRequestLogin,
}: NovelDetailOverlayProps) {
  const [visibleChaptersCount, setVisibleChaptersCount] = useState(50);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleToggleSave = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    try {
      await onToggleSave();
    } catch {
      // Error already handled in hook
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-dark flex flex-col overflow-y-auto no-scrollbar">
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLogin={() => onRequestLogin()}
        />
      )}

      <div className="relative h-64 shrink-0">
        <img
          src={novel.coverUrl}
          className="w-full h-full object-cover opacity-40 blur-sm absolute"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark to-transparent" />
        <button
          onClick={onBack}
          className="absolute top-4 left-4 p-2 bg-black/30 rounded-full backdrop-blur z-10"
        >
          <ChevronLeft color="white" />
        </button>

        <div className="absolute bottom-0 left-0 p-6 flex gap-4 w-full items-end">
          <img
            src={novel.coverUrl}
            className="w-24 h-36 object-cover rounded shadow-lg border border-slate-600"
          />
          <div className="flex-1 mb-2">
            <h1 className="text-xl font-bold text-white mb-1 line-clamp-2">
              {novel.title}
            </h1>
            <p className="text-sm text-primary font-medium">{novel.authorName}</p>
            <div className="flex gap-4 mt-3 text-xs text-slate-300">
              <div className="flex flex-col items-center">
                <span className="font-bold text-white">
                  {novel.chapters.reduce((sum, ch) => sum + ch.readCount, 0)}
                </span>
                <span>Lượt đọc</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-white">
                  {novel.chapters.reduce((sum, ch) => sum + (ch.likeCount || 0), 0)}
                </span>
                <span>Thích</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-dark flex-1">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              if (novel.chapters.length > 0) {
                onReadChapter(novel.id, novel.chapters[0].id);
              } else {
                message.info('Truyện chưa có chương nào.');
              }
            }}
            className="flex-1 bg-primary text-dark font-bold py-3 rounded-full shadow-lg shadow-amber-900/20"
          >
            Đọc ngay
          </button>
          <button
            onClick={handleToggleSave}
            className={`px-4 py-3 rounded-full border ${
              isSaved
                ? 'bg-slate-700 border-slate-600 text-primary'
                : 'border-slate-600 text-white'
            }`}
          >
            {isSaved ? <Check size={20} /> : <Plus size={20} />}
          </button>
        </div>

        <div className="mb-6">
          <p className="text-slate-300 text-sm leading-relaxed line-clamp-4">
            {novel.description}
          </p>
        </div>

        <div className="mb-20">
          <h3 className="font-bold text-lg mb-4 border-l-4 border-primary pl-3">
            Danh sách chương ({novel.chapters.length})
          </h3>
          <div className="space-y-3">
            {novel.chapters.length === 0 && (
              <p className="text-slate-500 italic">Chưa có chương nào.</p>
            )}
            {novel.chapters.slice(0, visibleChaptersCount).map((ch) => (
              <div
                key={ch.id}
                onClick={() => onReadChapter(novel.id, ch.id)}
                className="flex justify-between items-center p-3 bg-slate-800/50 rounded hover:bg-slate-800 cursor-pointer"
              >
                <span className="text-sm font-medium">{ch.title}</span>
                <span className="text-xs text-slate-500">
                  {new Date(ch.publishedAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            ))}

            {visibleChaptersCount < novel.chapters.length && (
              <button
                onClick={() => setVisibleChaptersCount((prev) => prev + 50)}
                className="w-full py-3 mt-4 bg-slate-800 text-slate-400 text-sm font-bold rounded-lg hover:bg-slate-700 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <span>Xem thêm chương</span>
                <span className="bg-slate-900 px-2 py-0.5 rounded text-[10px]">
                  {Math.min(novel.chapters.length - visibleChaptersCount, 50)}+
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
