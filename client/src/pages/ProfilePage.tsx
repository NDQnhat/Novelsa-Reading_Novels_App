import React, { useState } from 'react';
import { User, UserRole, Novel, NovelStatus } from '../types';
import {
  Edit3,
  LogOut,
  Book,
  Heart,
  Settings,
  Download,
  UserIcon,
  LogIn,
} from 'lucide-react';
import { EditProfileForm } from '../components';

interface ProfilePageProps {
  currentUser: User | null;
  myNovels: Novel[];
  onLogin: () => void;
  onLogout: () => void;
  onUpdateProfile: (data: Partial<User>) => void;
  onShowInstall: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  currentUser,
  myNovels,
  onLogin,
  onLogout,
  onUpdateProfile,
  onShowInstall,
}) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  if (!currentUser) {
    return (
      <div className="p-4 pb-20 flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
        <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <UserIcon size={48} className="text-slate-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Xin chào, Khách</h2>
        <p className="text-slate-300 text-center mb-8 text-sm px-8">
          Đăng nhập để lưu truyện vào tủ sách, tải truyện offline và bắt đầu sáng tác tác
          phẩm của riêng bạn.
        </p>
        <button
          onClick={onLogin}
          className="bg-amber-400 text-slate-900 font-bold py-3 px-10 rounded-full shadow-lg shadow-amber-500/20 flex items-center gap-2"
        >
          <LogIn size={20} /> Đăng nhập / Đăng ký
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      {!isEditingProfile ? (
        <>
          {/* User Info */}
          <div className="flex flex-col items-center mt-6 mb-8">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-700 mb-4 relative">
              <img src={currentUser.avatarUrl || ''} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 right-0 left-0 bg-black/50 text-[10px] text-center text-white py-1">
                {currentUser.role}
              </div>
            </div>
            <h2 className="text-xl font-bold">{currentUser.name}</h2>
            <p className="text-slate-300 text-sm">{currentUser.email}</p>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setIsEditingProfile(true)}
                className="px-4 py-2 bg-slate-800 rounded-full text-xs text-slate-300 border border-slate-700 flex items-center gap-2 hover:bg-slate-700"
              >
                <Edit3 size={14} /> Sửa thông tin
              </button>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-slate-800 rounded-full text-xs text-red-400 border border-slate-700 flex items-center gap-2 hover:bg-slate-700"
              >
                <LogOut size={14} /> Đăng xuất
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-slate-800 rounded-xl p-4 space-y-4 mb-8">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <span className="flex items-center gap-3">
                <Book size={18} className="text-slate-300" /> Truyện đã đăng
              </span>
              <span className="font-bold">
                {myNovels.filter((n) => n.status === NovelStatus.APPROVED).length}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <span className="flex items-center gap-3">
                <Heart size={18} className="text-slate-300" /> Truyện yêu thích
              </span>
              <span className="font-bold">{currentUser.library.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-3">
                <Settings size={18} className="text-slate-300" /> Cài đặt
              </span>
              <span className="text-slate-500 text-xs">v1.1.0</span>
            </div>
          </div>

          {/* Install App Section */}
          <div
            onClick={onShowInstall}
            className="p-4 bg-amber-400/10 rounded-lg border border-amber-400/20 cursor-pointer active:bg-amber-400/20 transition-colors"
          >
            <h3 className="text-amber-400 font-bold text-sm mb-2 flex items-center gap-2">
              <Download size={16} /> Tải xuống App
            </h3>
            <p className="text-xs text-slate-300">
              Đây là phiên bản Web. Để có trải nghiệm tốt nhất, hãy nhấn vào đây để xem
              hướng dẫn cài đặt ứng dụng về máy.
            </p>
          </div>
        </>
      ) : (
        <EditProfileForm
          currentUser={currentUser}
          onUpdateProfile={(data) => {
            onUpdateProfile(data);
            setIsEditingProfile(false);
          }}
          onCancel={() => setIsEditingProfile(false)}
        />
      )}
    </div>
  );
};
