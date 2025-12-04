import React, { useState } from 'react';
import { Novel, NovelStatus, Chapter } from '../types';
import { X, Plus, FileText } from 'lucide-react';
import { message } from 'antd';
import { ChapterEditor } from './ChapterEditor';

interface EditNovelOverlayProps {
  novel: Novel;
  onClose: () => void;
  onUpdateNovel: (novelId: string, updates: Partial<Novel>) => Promise<void>;
  onAddChapter: (novelId: string) => Promise<void>;
  onSaveChapterContent: (novelId: string, chapterIndex: number, content: string) => Promise<void>;
  onSubmitForReview: (novelId: string) => Promise<void>;
}

export function EditNovelOverlay({
  novel,
  onClose,
  onUpdateNovel,
  onAddChapter,
  onSaveChapterContent,
  onSubmitForReview,
}: EditNovelOverlayProps) {
  const [editorState, setEditorState] = useState<{ chapterIndex: number } | null>(null);

  const handleSubmit = async () => {
    if (novel.chapters.length === 0) {
      message.warning('Cần ít nhất 1 chương để đăng truyện!');
      return;
    }
    if (confirm('Gửi truyện cho admin duyệt?')) {
      await onSubmitForReview(novel.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-dark flex flex-col">
      {editorState !== null && (
        <ChapterEditor
          title={novel.chapters[editorState.chapterIndex]?.title || ''}
          content={novel.chapters[editorState.chapterIndex]?.content || ''}
          onSave={(content) => {
            onSaveChapterContent(novel.id, editorState.chapterIndex, content);
            setEditorState(null);
          }}
          onCancel={() => setEditorState(null)}
        />
      )}

      <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800">
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X size={24} />
        </button>
        <span className="font-bold">Quản lý truyện</span>
        <button
          onClick={handleSubmit}
          disabled={
            novel.status === NovelStatus.PENDING ||
            novel.status === NovelStatus.APPROVED
          }
          className={`text-sm px-3 py-1 rounded ${
            novel.status === NovelStatus.PENDING
              ? 'bg-yellow-600 opacity-50'
              : 'bg-primary text-dark font-bold'
          }`}
        >
          {novel.status === NovelStatus.PENDING ? 'Đang duyệt' : 'Đăng truyện'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="flex gap-4">
          <div className="w-24 h-36 bg-slate-800 rounded flex items-center justify-center shrink-0">
            <img
              src={novel.coverUrl}
              className="w-full h-full object-cover rounded opacity-60"
            />
          </div>
          <div className="flex-1 space-y-3">
            <input
              className="w-full bg-transparent border-b border-slate-700 p-1 text-lg font-bold focus:border-primary focus:outline-none"
              value={novel.title}
              onChange={(e) => onUpdateNovel(novel.id, { title: e.target.value })}
              placeholder="Tên truyện"
            />
            <textarea
              className="w-full h-20 bg-slate-800/50 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={novel.description}
              onChange={(e) => onUpdateNovel(novel.id, { description: e.target.value })}
              placeholder="Tóm tắt nội dung..."
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-300">Danh sách chương</h3>
            <button
              onClick={() => onAddChapter(novel.id)}
              className="flex items-center gap-1 text-primary text-sm"
            >
              <Plus size={16} /> Thêm chương
            </button>
          </div>
          <div className="space-y-2">
            {novel.chapters.map((ch, idx) => (
              <div
                key={ch.id}
                className="bg-slate-800 p-3 rounded flex justify-between items-center"
              >
                <div>
                  <div className="font-medium text-sm">Chương {ch.order}</div>
                  <input
                    className="bg-transparent text-xs text-slate-400 w-full focus:text-white focus:outline-none"
                    value={ch.title}
                    onChange={(e) => {
                      const updatedChapters = [...novel.chapters];
                      updatedChapters[idx] = { ...ch, title: e.target.value };
                      onUpdateNovel(novel.id, { chapters: updatedChapters });
                    }}
                    placeholder="Nhập tên chương..."
                  />
                </div>
                <button
                  onClick={() => setEditorState({ chapterIndex: idx })}
                  className="text-xs bg-slate-700 px-3 py-2 rounded hover:bg-slate-600 flex items-center gap-1"
                >
                  <FileText size={12} /> Sửa nội dung
                </button>
              </div>
            ))}
            {novel.chapters.length === 0 && (
              <div className="text-center py-8 text-slate-600 text-sm border border-dashed border-slate-800 rounded">
                Chưa có chương nào
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
