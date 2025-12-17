import React, { useState, useEffect } from 'react';
import { Novel, NovelStatus, User, UserRole } from '../types';
import { Trash2, Ban, Unlock } from 'lucide-react';
import { App as AntdApp, Modal } from 'antd';
import { api } from '../services/api';

interface AdminPageProps {
  currentUser: User | null;
}

export const AdminPage: React.FC<AdminPageProps> = ({ currentUser }) => {
  const { message, modal } = AntdApp.useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [novels, setNovels] = useState<Novel[]>([]);
  const [selectedNovelStatus, setSelectedNovelStatus] = useState<string>('PENDING');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingNovels, setLoadingNovels] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'novels'>('users');
  const [viewingNovelId, setViewingNovelId] = useState<string | null>(null);

  if (currentUser?.role !== UserRole.ADMIN) {
    return (
      <div className="p-4 text-center text-slate-500 h-screen flex items-center justify-center">
        Chỉ Admin mới có thể truy cập trang này.
      </div>
    );
  }

  // Load users
  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        const data = await api.getAllUsers();
        setUsers(data || []);
      } catch (err) {
        message.error('Lỗi tải danh sách người dùng');
      } finally {
        setLoadingUsers(false);
      }
    };
    if (activeTab === 'users') loadUsers();
  }, [activeTab]);

  // Load novels
  useEffect(() => {
    const loadNovels = async () => {
      setLoadingNovels(true);
      try {
        let data: Novel[];
        if (selectedNovelStatus === 'ALL') {
          data = await api.getAllNovels();
        } else {
          data = await api.getNovelsByStatus(selectedNovelStatus);
        }
        setNovels(data || []);
      } catch (err) {
        message.error('Lỗi tải danh sách truyện');
      } finally {
        setLoadingNovels(false);
      }
    };
    if (activeTab === 'novels') loadNovels();
  }, [selectedNovelStatus, activeTab]);

  // Handle ban user
  const handleBanUser = async (userId: string, currentBanned: boolean) => {
    try {
      const key = 'ban_user';
      message.loading({ content: 'Đang xử lý...', key });
      await api.banUser(userId, !currentBanned);
      const updatedUsers = users.map((u) =>
        u.id === userId ? { ...u, role: !currentBanned ? 'BANNED' : 'USER' } : u
      );
      setUsers(updatedUsers);
      message.success({
        content: !currentBanned ? 'Đã cấm người dùng' : 'Đã mở khóa người dùng',
        key,
      });
    } catch (err) {
      message.error('Lỗi cập nhật trạng thái người dùng');
    }
  };

  // Handle approve novel
  const handleApproveNovel = async (novelId: string) => {
    try {
      const key = 'approve_novel';
      message.loading({ content: 'Đang duyệt...', key });
      await api.approveNovel(novelId);
      const updated = novels.map((n) =>
        n.id === novelId ? { ...n, status: NovelStatus.APPROVED } : n
      );
      setNovels(updated);
      message.success({ content: 'Đã duyệt truyện', key });
    } catch (err) {
      message.error('Lỗi duyệt truyện');
    }
  };

  // Handle reject novel
  const handleRejectNovel = async (novelId: string) => {
    try {
      const key = 'reject_novel';
      message.loading({ content: 'Đang từ chối...', key });
      await api.rejectNovel(novelId);
      const updated = novels.map((n) =>
        n.id === novelId ? { ...n, status: NovelStatus.REJECTED } : n
      );
      setNovels(updated);
      message.success({ content: 'Đã từ chối truyện', key });
    } catch (err) {
      message.error('Lỗi từ chối truyện');
    }
  };

  // Handle delete novel
  const handleDeleteNovel = async (novelId: string) => {
    modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn chắc chắn muốn xóa truyện này? Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const key = 'delete_novel';
          message.loading({ content: 'Đang xóa...', key });
          await api.deleteNovelAdmin(novelId);
          setNovels(novels.filter((n) => n.id !== novelId));
          message.success({ content: 'Đã xóa truyện', key });
        } catch (err) {
          message.error('Lỗi xóa truyện');
        }
      },
    });
  };

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-6 pt-2 text-red-500">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-3 mb-6 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 font-semibold transition ${
            activeTab === 'users' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400'
          }`}
        >
          Quản lý người dùng ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('novels')}
          className={`pb-3 px-4 font-semibold transition ${
            activeTab === 'novels' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400'
          }`}
        >
          Quản lý truyện ({novels.length})
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          {loadingUsers ? (
            <div className="text-center text-slate-400">Đang tải...</div>
          ) : users.length === 0 ? (
            <div className="text-center text-slate-400">Chưa có người dùng</div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <img
                      src={user.avatarUrl || 'https://via.placeholder.com/40'}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-white">{user.name}</h3>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${
                        user.role === 'ADMIN'
                          ? 'bg-red-600 text-white'
                          : user.role === 'BANNED'
                            ? 'bg-gray-600 text-white'
                            : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {user.role === 'ADMIN' ? 'Admin' : user.role === 'BANNED' ? 'Cấm' : 'User'}
                    </span>
                    {user.role !== 'ADMIN' && (
                      <button
                        onClick={() => handleBanUser(user.id, user.role === 'BANNED')}
                        className="text-slate-400 hover:text-yellow-400 transition"
                        title={user.role === 'BANNED' ? 'Mở khóa' : 'Cấm'}
                      >
                        {user.role === 'BANNED' ? (
                          <Unlock size={18} />
                        ) : (
                          <Ban size={18} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Novels Tab */}
      {activeTab === 'novels' && (
        <div>
          {/* Status Filter */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {['ALL', 'APPROVED', 'PENDING', 'REJECTED'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedNovelStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  selectedNovelStatus === status
                    ? 'bg-amber-400 text-slate-900'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {status === 'ALL'
                  ? 'Toàn bộ'
                  : status === 'APPROVED'
                    ? 'Đã duyệt'
                    : status === 'PENDING'
                      ? 'Chờ duyệt'
                      : 'Từ chối'}
              </button>
            ))}
          </div>

          {/* Novels List */}
          {loadingNovels ? (
            <div className="text-center text-slate-400">Đang tải...</div>
          ) : novels.length === 0 ? (
            <div className="text-center text-slate-400">Không có truyện nào</div>
          ) : (
            <div className="space-y-3">
              {novels.map((novel) => (
                <div
                  key={novel.id}
                  className="bg-slate-800 p-4 rounded-lg border border-slate-700"
                >
                  <div className="flex gap-4">
                    <img
                      src={novel.coverUrl}
                      alt={novel.title}
                      className="w-16 h-24 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-white line-clamp-1">{novel.title}</h3>
                          <p className="text-xs text-slate-400 truncate">Tác giả: {novel.authorName}</p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded font-semibold whitespace-nowrap flex-shrink-0 ${
                            novel.status === NovelStatus.APPROVED
                              ? 'bg-green-600 text-white'
                              : novel.status === NovelStatus.PENDING
                                ? 'bg-yellow-600 text-white'
                                : 'bg-red-600 text-white'
                          }`}
                        >
                          {novel.status === NovelStatus.APPROVED
                            ? 'Đã duyệt'
                            : novel.status === NovelStatus.PENDING
                              ? 'Chờ duyệt'
                              : 'Từ chối'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                        {novel.description}
                      </p>
                      <div className="flex gap-2">
                        {novel.status === NovelStatus.PENDING && (
                          <>
                            <button
                              onClick={() => setViewingNovelId(novel.id)}
                              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition font-semibold"
                            >
                              Xem
                            </button>
                            <button
                              onClick={() => handleApproveNovel(novel.id)}
                              className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition font-semibold"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => handleRejectNovel(novel.id)}
                              className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition font-semibold"
                            >
                              Từ chối
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteNovel(novel.id)}
                          className="text-slate-400 hover:text-red-400 transition ml-auto"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* View Novel Modal */}
      <Modal
        title="Chi tiết truyện"
        open={viewingNovelId !== null}
        onCancel={() => setViewingNovelId(null)}
        footer={null}
        width={700}
      >
        {viewingNovelId && novels.find((n) => n.id === viewingNovelId) && (
          (() => {
            const novel = novels.find((n) => n.id === viewingNovelId)!;
            return (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <img
                    src={novel.coverUrl}
                    alt={novel.title}
                    className="w-24 h-36 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">{novel.title}</h2>
                    <p className="text-sm text-slate-600 mb-2">Tác giả: {novel.authorName}</p>
                    <p className="text-sm">{novel.description}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold mb-3 text-slate-900">Danh sách chương ({novel.chapters.length})</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {novel.chapters.length === 0 ? (
                      <p className="text-slate-600 text-sm">Không có chương nào</p>
                    ) : (
                      novel.chapters.map((ch) => (
                        <div key={ch.id} className="bg-slate-100 p-3 rounded">
                          <div className="font-semibold text-slate-900">Chương {ch.order}: {ch.title}</div>
                          <p className="text-sm text-slate-700 line-clamp-3 mt-1">{ch.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </Modal>
    </div>
  );
};

