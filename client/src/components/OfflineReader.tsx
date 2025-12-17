/**
 * OfflineReader Component
 * Đọc truyện từ IndexedDB khi offline
 */

import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, List, Loader } from 'lucide-react';
import { indexedDB, type StoredChapter, type StoredNovel } from '../services/indexedDBService';

interface OfflineReaderProps {
  novelId: string;
  onClose?: () => void;
}

export default function OfflineReader({ novelId, onClose }: OfflineReaderProps) {
  const [novel, setNovel] = useState<StoredNovel | null>(null);
  const [chapters, setChapters] = useState<StoredChapter[]>([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showChapterList, setShowChapterList] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [lineHeight, setLineHeight] = useState<'normal' | 'relaxed' | 'loose'>(
    'relaxed'
  );

  // Load novel and chapters
  useEffect(() => {
    loadNovelData();
  }, [novelId]);

  // Save read position on chapter change
  useEffect(() => {
    if (novel && chapters.length > 0) {
      const currentChapter = chapters[currentChapterIndex];
      indexedDB.saveReadPosition({
        novelId: novel.id,
        chapterId: currentChapter.id,
        chapterNumber: currentChapter.chapterNumber,
        scrollPosition: 0,
        readAt: Date.now(),
      });

      // Update novel's last read chapter
      indexedDB.saveNovel({
        ...novel,
        lastReadChapter: currentChapter.chapterNumber,
        readProgress: ((currentChapterIndex + 1) / chapters.length) * 100,
      });
    }
  }, [currentChapterIndex, novel, chapters]);

  const loadNovelData = async () => {
    try {
      setLoading(true);

      // Get novel
      const novelData = await indexedDB.getNovel(novelId);
      if (!novelData) {
        console.error('[OfflineReader] Novel not found:', novelId);
        return;
      }
      setNovel(novelData);

      // Get chapters
      const chaptersData = await indexedDB.getChaptersByNovel(novelId);
      setChapters(chaptersData);

      // Resume from last read
      const readPos = await indexedDB.getReadPosition(novelId);
      if (readPos) {
        const index = chaptersData.findIndex(
          (c) => c.chapterNumber === readPos.chapterNumber
        );
        if (index >= 0) {
          setCurrentChapterIndex(index);
        }
      }
    } catch (err) {
      console.error('[OfflineReader] Load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const goToPrevious = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(currentChapterIndex - 1);
      window.scrollTo(0, 0);
    }
  };

  const goToNext = () => {
    if (currentChapterIndex < chapters.length - 1) {
      setCurrentChapterIndex(currentChapterIndex + 1);
      window.scrollTo(0, 0);
    }
  };

  const goToChapter = (index: number) => {
    setCurrentChapterIndex(index);
    setShowChapterList(false);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader className="animate-spin text-amber-500 mb-4 mx-auto" />
          <p className="text-slate-300">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!novel || chapters.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-slate-300 mb-4">Không tìm thấy dữ liệu truyện</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const currentChapter = chapters[currentChapterIndex];
  const fontSizeMap = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };
  const lineHeightMap = {
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
    loose: 'leading-loose',
  };

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/50 backdrop-blur">
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          title="Đóng"
        >
          <ChevronLeft className="text-amber-400" />
        </button>

        <div className="flex-1 text-center min-w-0">
          <h2 className="text-sm font-semibold text-slate-100 truncate">
            {novel.title}
          </h2>
          <p className="text-xs text-slate-400">
            {currentChapterIndex + 1} / {chapters.length}
          </p>
        </div>

        <button
          onClick={() => setShowChapterList(!showChapterList)}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          title="Danh sách chương"
        >
          <List size={20} className="text-amber-400" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Chapter list sidebar */}
        {showChapterList && (
          <div className="w-48 border-r border-slate-700 bg-slate-850 overflow-y-auto">
            <div className="p-4 space-y-1">
              {chapters.map((ch, idx) => (
                <button
                  key={ch.id}
                  onClick={() => goToChapter(idx)}
                  className={`
                    w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                    ${
                      idx === currentChapterIndex
                        ? 'bg-amber-600 text-white font-semibold'
                        : 'text-slate-300 hover:bg-slate-700'
                    }
                  `}
                >
                  <span className="text-xs text-slate-400">Ch {ch.chapterNumber}</span>
                  <p className="truncate">{ch.title}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reader content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Settings bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-slate-800/30">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Chữ:</span>
              <select
                value={fontSize}
                onChange={(e) =>
                  setFontSize(e.target.value as 'sm' | 'base' | 'lg' | 'xl')
                }
                className="text-xs bg-slate-700 text-slate-200 px-2 py-1 rounded border border-slate-600"
              >
                <option value="sm">Nhỏ</option>
                <option value="base">Vừa</option>
                <option value="lg">Lớn</option>
                <option value="xl">Rất lớn</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Dòng:</span>
              <select
                value={lineHeight}
                onChange={(e) =>
                  setLineHeight(
                    e.target.value as 'normal' | 'relaxed' | 'loose'
                  )
                }
                className="text-xs bg-slate-700 text-slate-200 px-2 py-1 rounded border border-slate-600"
              >
                <option value="normal">Bình thường</option>
                <option value="relaxed">Rộng</option>
                <option value="loose">Rất rộng</option>
              </select>
            </div>

            <div className="text-xs text-slate-400">
              Offline <span className="text-green-400">●</span>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto">
            <article
              className={`
                max-w-3xl mx-auto px-6 py-8 prose prose-invert
                ${fontSizeMap[fontSize]} ${lineHeightMap[lineHeight]}
              `}
            >
              <h1 className="text-2xl font-bold text-slate-100 mb-2">
                {currentChapter.title}
              </h1>
              <p className="text-xs text-slate-400 mb-6">
                Chương {currentChapter.chapterNumber}
              </p>

              <div
                className="text-slate-200 space-y-4"
                dangerouslySetInnerHTML={{ __html: currentChapter.content }}
              />
            </article>
          </div>

          {/* Navigation footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700 bg-slate-800/50">
            <button
              onClick={goToPrevious}
              disabled={currentChapterIndex === 0}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium
                transition-colors
                ${
                  currentChapterIndex === 0
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                }
              `}
            >
              <ChevronLeft size={18} />
              <span>Chương trước</span>
            </button>

            <span className="text-sm text-slate-400">
              {currentChapterIndex + 1} / {chapters.length}
            </span>

            <button
              onClick={goToNext}
              disabled={currentChapterIndex === chapters.length - 1}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium
                transition-colors
                ${
                  currentChapterIndex === chapters.length - 1
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                }
              `}
            >
              <span>Chương sau</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
