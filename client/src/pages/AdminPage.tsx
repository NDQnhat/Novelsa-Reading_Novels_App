import React from 'react';
import { Novel, NovelStatus, User, UserRole } from '../types';
import { Trash2 } from 'lucide-react';

interface AdminPageProps {
  pendingNovels: Novel[];
  allNovels: Novel[];
  currentUser: User | null;
  onApprove: (novelId: string) => void;
  onReject: (novelId: string) => void;
  onDelete: (novelId: string) => void;
  onViewNovel: (novelId: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  pendingNovels,
  allNovels,
  currentUser,
  onApprove,
  onReject,
  onDelete,
  onViewNovel,
}) => {
  if (currentUser?.role !== UserRole.ADMIN) {
    return (
      <div className="p-4 text-center text-slate-500 h-screen flex items-center justify-center">
        Chỉ Admin mới có thể truy cập trang này.
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-6 pt-2 text-red-500">Admin Dashboard</h1>

      <div className="mb-6">
        <h2 className="text-sm font-bold text-slate-400 uppercase mb-3">
          Chờ phê duyệt ({pendingNovels.length})
        </h2>
        <div className="space-y-3">
          {pendingNovels.map((novel) => (
            <div key={novel.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-white">{novel.title}</h3>
                <span className="text-xs text-slate-400">Tác giả: {novel.authorName}</span>
              </div>
              <p className="text-xs text-slate-400 mb-4 line-clamp-2">{novel.description}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => onApprove(novel.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-2 rounded font-bold"
                >
                  Duyệt
                </button>
                <button
                  onClick={() => onReject(novel.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-2 rounded font-bold"
                >
                  Từ chối
                </button>
                <button
                  onClick={() => onViewNovel(novel.id)}
                  className="px-3 bg-slate-700 rounded text-xs hover:bg-slate-600"
                >
                  Xem
                </button>
              </div>
            </div>
          ))}
          {pendingNovels.length === 0 && (
            <p className="text-slate-500 italic text-sm">Không có yêu cầu nào.</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-slate-400 uppercase mb-3">Tất cả truyện ({allNovels.length})</h2>
        <div className="space-y-2">
          {allNovels.map((novel) => (
            <div
              key={novel.id}
              className="flex justify-between items-center p-2 bg-slate-900 rounded border border-slate-800"
            >
              <span className="text-xs truncate max-w-[150px]">{novel.title}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded ${
                  novel.status === 'APPROVED'
                    ? 'bg-green-900 text-green-300'
                    : 'bg-slate-700'
                }`}
              >
                {novel.status}
              </span>
              <button
                onClick={() => onDelete(novel.id)}
                className="text-red-500 p-1 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
