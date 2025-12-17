import React, { useState, useRef } from 'react';
import { Novel, NovelStatus, Chapter } from '../types';
import { X, Plus, FileText, Upload } from 'lucide-react';
import { App as AntdApp } from 'antd';
import { ChapterEditor } from './ChapterEditor';
import { upload } from '../utils/index';

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
  const { message, modal } = AntdApp.useApp();
  const [editorState, setEditorState] = useState<{ chapterIndex: number } | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  // Local state for title and description to fix IME issues
  const [localTitle, setLocalTitle] = useState(novel.title);
  const [localDescription, setLocalDescription] = useState(novel.description);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync local state when novel prop changes (e.g., data refreshed from server)
  React.useEffect(() => {
    setLocalTitle(novel.title);
    setLocalDescription(novel.description);
  }, [novel.id]); // Only sync when novel changes, not on every render

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      message.error('Vui lòng chọn một tệp hình ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      message.error('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    setIsUploadingImage(true);
    try {
      const imageUrl = await upload.image(file);
      await onUpdateNovel(novel.id, { coverUrl: imageUrl });
      message.success('Đã cập nhật ảnh bìa!');
    } catch (error) {
      console.error('Upload failed:', error);
      message.error('Không thể tải ảnh lên');
    } finally {
      setIsUploadingImage(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Save title and description changes
  const handleSaveMetadata = async () => {
    if (!localTitle.trim()) {
      message.warning('Vui lòng nhập tên truyện!');
      return;
    }
    if (!localDescription.trim()) {
      message.warning('Vui lòng nhập mô tả truyện!');
      return;
    }

    setIsSaving(true);
    try {
      await onUpdateNovel(novel.id, {
        title: localTitle,
        description: localDescription,
      });
      message.success('Đã cập nhật thông tin truyện!');
    } catch (error) {
      message.error('Không thể cập nhật thông tin');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (novel.chapters.length === 0) {
      message.warning('Cần ít nhất 1 chương để đăng truyện!');
      return;
    }
    modal.confirm({
      title: 'Xác nhận đăng truyện',
      content: 'Gửi truyện cho admin duyệt?',
      okText: 'Có',
      cancelText: 'Không',
      onOk: () => {
        onSubmitForReview(novel.id);
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-dark flex flex-col">
      {editorState !== null && (
        <ChapterEditor
          title={novel.chapters[editorState.chapterIndex]?.title || ''}
          content={novel.chapters[editorState.chapterIndex]?.content || ''}
          onSave={(title, content) => {
            // Update chapter with both title and content
            const updatedChapters = [...novel.chapters];
            updatedChapters[editorState.chapterIndex] = {
              ...updatedChapters[editorState.chapterIndex],
              title,
              content,
            };
            onUpdateNovel(novel.id, { chapters: updatedChapters });
            setEditorState(null);
          }}
          onCancel={() => setEditorState(null)}
        />
      )}

      <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800">
        <button onClick={onClose} className="text-slate-300 hover:text-white">
          <X size={24} />
        </button>
        <span className="font-bold">Quản lý truyện</span>
        <button
          onClick={handleSubmit}
          disabled={
            novel.status === NovelStatus.PENDING ||
            novel.status === NovelStatus.APPROVED
          }
          className={`text-sm px-3 py-1 rounded transition ${
            novel.status === NovelStatus.PENDING || novel.status === NovelStatus.APPROVED
              ? 'bg-slate-600 text-slate-300 cursor-not-allowed opacity-50'
              : 'bg-primary text-dark font-bold hover:bg-amber-500'
          }`}
        >
          {novel.status === NovelStatus.PENDING
            ? 'Đang duyệt'
            : novel.status === NovelStatus.APPROVED
              ? 'Đã duyệt'
              : 'Đăng truyện'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="flex gap-4">
          <div
            onClick={handleImageClick}
            disabled={isUploadingImage}
            className="w-24 h-36 bg-slate-800 rounded flex items-center justify-center shrink-0 cursor-pointer hover:bg-slate-700 transition relative overflow-hidden group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              disabled={isUploadingImage}
            />
            {isUploadingImage ? (
              <div className="text-white text-xs text-center">Đang tải...</div>
            ) : (
              <>
                <img
                  src={novel.coverUrl}
                  className="w-full h-full object-cover rounded opacity-60"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded">
                  <Upload size={20} className="text-white" />
                </div>
              </>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <input
              className="w-full bg-transparent border-b border-slate-700 p-1 text-lg text-white font-bold focus:border-primary focus:outline-none"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              placeholder="Tên truyện"
            />
            <textarea
              className="w-full h-20 bg-slate-800/50 rounded p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
              value={localDescription}
              onChange={(e) => setLocalDescription(e.target.value)}
              placeholder="Tóm tắt nội dung..."
            />
            <button
              onClick={handleSaveMetadata}
              disabled={isSaving}
              className={`text-xs px-3 py-1.5 rounded transition ${
                isSaving
                  ? 'bg-slate-600 text-slate-300 cursor-not-allowed opacity-50'
                  : 'bg-slate-700 text-white hover:bg-slate-600'
              }`}
            >
              {isSaving ? 'Đang lưu...' : 'Lưu thông tin'}
            </button>
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
                  <div className="font-medium text-white text-sm">Chương {ch.order}</div>
                  <input
                    className="bg-transparent text-xs text-slate-300 w-full focus:text-white focus:outline-none"
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
                  className="text-xs bg-slate-700 px-3 py-2 rounded hover:bg-slate-600 flex items-center gap-1 text-white"
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
