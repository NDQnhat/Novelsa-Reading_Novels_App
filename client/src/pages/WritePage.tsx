import React, { useState } from 'react';
import { Novel, User, NovelStatus, Chapter, Comment } from '../types';
import { Plus, Settings, FileText, X, Trash2 } from 'lucide-react';
import { App as AntdApp } from 'antd';

interface WritePageProps {
  myNovels: Novel[];
  currentUser: User | null;
  onCreateNovel: () => void;
  onEditNovel: (novelId: string) => void;
  onUpdateNovel: (id: string, updates: Partial<Novel>) => void;
  onAddChapter: (novelId: string) => void;
  onDeleteNovel: (novelId: string) => void;
}

export const WritePage: React.FC<WritePageProps> = ({
  myNovels,
  currentUser,
  onCreateNovel,
  onEditNovel,
  onUpdateNovel,
  onAddChapter,
  onDeleteNovel,
}) => {
  const { message, modal } = AntdApp.useApp();
  const handleDeleteClick = (novelId: string) => {
    modal.confirm({
      title: 'Xóa truyện',
      content: 'Bạn chắc chắn muốn xóa truyện này? Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk() {
        onDeleteNovel(novelId);
        message.success('Đã xóa truyện');
      },
    });
  };

  return (
    <div className="p-4 pb-20">
      <div className="flex justify-between items-center mb-6 pt-2">
        <h1 className="text-2xl font-bold">Quản lý truyện</h1>
        <button
          onClick={onCreateNovel}
          className="bg-amber-400 text-slate-900 rounded-full p-2 shadow-lg"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="space-y-4">
        {myNovels.map((novel) => (
          <div
            key={novel.id}
            className="bg-slate-800 p-4 rounded-xl border border-slate-700 relative overflow-hidden"
          >
            <div
              className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold rounded-bl-lg
                 ${
                   novel.status === NovelStatus.APPROVED
                     ? 'bg-green-600 text-white'
                     : novel.status === NovelStatus.PENDING
                       ? 'bg-yellow-600 text-white'
                       : novel.status === NovelStatus.REJECTED
                         ? 'bg-red-600 text-white'
                         : 'bg-slate-600 text-slate-300'
                 }
                `}
            >
              {novel.status === NovelStatus.APPROVED
                ? 'Đã duyệt'
                : novel.status === NovelStatus.PENDING
                  ? 'Chờ duyệt'
                  : novel.status === NovelStatus.REJECTED
                    ? 'Từ chối'
                    : 'Bản thảo'}
            </div>

            <div className="flex gap-4">
              <img
                src={novel.coverUrl}
                className="w-16 h-24 object-cover rounded bg-slate-900"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white mb-1 truncate">{novel.title}</h3>
                <p className="text-xs text-slate-300 mb-2 line-clamp-2">
                  {novel.description || 'Chưa có mô tả'}
                </p>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => onEditNovel(novel.id)}
                    className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded flex items-center gap-1"
                  >
                    <Settings size={12} /> Quản lý
                  </button>
                  {novel.status === NovelStatus.REJECTED && (
                    <span className="text-xs text-red-400 flex items-center">Bị từ chối</span>
                  )}
                  <button
                    onClick={() => handleDeleteClick(novel.id)}
                    className="text-slate-300 hover:text-red-400 transition ml-auto"
                    title="Xóa truyện"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {myNovels.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            Bạn chưa sáng tác truyện nào. <br /> Nhấn dấu + để bắt đầu.
          </div>
        )}
      </div>
    </div>
  );
};
