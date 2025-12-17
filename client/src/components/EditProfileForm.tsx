import React, { useState, useRef } from 'react';
import { User } from '../types';
import { App as AntdApp } from 'antd';
import { Edit3, LogOut, Book, Heart, Settings, Download, Upload } from 'lucide-react';
import { utils } from '../services/services';
import { upload } from '../utils/index';

interface EditProfileFormProps {
  currentUser: User;
  onUpdateProfile: (data: Partial<User>) => void;
  onCancel: () => void;
}

export const EditProfileForm: React.FC<EditProfileFormProps> = ({
  currentUser,
  onUpdateProfile,
  onCancel,
}) => {
  const { message } = AntdApp.useApp();
  const [editName, setEditName] = useState(currentUser.name);
  const [editAvatar, setEditAvatar] = useState(currentUser.avatarUrl || '');
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [msg, setMsg] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      message.error('Vui lòng chọn một tệp hình ảnh');
      return;
    }

    // Validate file size (max 2MB for avatars)
    if (file.size > 2 * 1024 * 1024) {
      message.error('Kích thước ảnh không được vượt quá 2MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const imageUrl = await upload.image(file);
      setEditAvatar(imageUrl);
      message.success('Đã tải avatar lên!');
    } catch (error) {
      console.error('Avatar upload failed:', error);
      message.error('Không thể tải avatar lên');
    } finally {
      setIsUploadingAvatar(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = () => {
    if (!editName.trim()) {
      setMsg('Tên không được để trống');
      return;
    }

    if (oldPass || newPass) {
      if (oldPass !== currentUser.password) {
        setMsg('Mật khẩu cũ không đúng');
        message.error('Mật khẩu cũ không chính xác');
        return;
      }
      if (newPass.length < 6) {
        setMsg('Mật khẩu mới phải dài hơn 6 ký tự');
        message.error('Mật khẩu quá ngắn');
        return;
      }
    }

    const updates: Partial<User> = {
      name: editName,
      avatarUrl: editAvatar,
    };
    if (newPass) updates.password = newPass;

    onUpdateProfile(updates);
  };

  return (
    <div className="bg-slate-900 rounded-xl p-4 space-y-4 border border-slate-700">
      <div className="text-center mb-4">
        <h3 className="font-bold text-white">Chỉnh sửa thông tin</h3>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-2">Chọn Avatar</label>
        <div className="flex gap-2 justify-center mb-2">
          {utils.getAvatarUrls().slice(0, 4).map((url, idx) => (
            <button
              key={idx}
              onClick={() => setEditAvatar(url)}
              className={`relative rounded-full overflow-hidden w-10 h-10 border-2 ${
                editAvatar === url ? 'border-amber-400' : 'border-transparent opacity-50'
              }`}
            >
              <img src={url} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
        <div className="flex justify-center mb-3">
          <img src={editAvatar} className="w-20 h-20 rounded-full border-2 border-amber-400 object-cover" />
        </div>
        <div className="flex justify-center">
          <button
            onClick={handleAvatarClick}
            disabled={isUploadingAvatar}
            className="text-xs bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white px-3 py-1.5 rounded flex items-center gap-1"
          >
            <Upload size={12} /> {isUploadingAvatar ? 'Đang tải...' : 'Tải ảnh lên'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
            disabled={isUploadingAvatar}
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400">Tên hiển thị</label>
        <input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="w-full bg-slate-800 p-2 rounded border border-slate-700 text-sm focus:border-amber-400 outline-none"
        />
      </div>

      <div className="pt-2 border-t border-slate-800">
        <label className="text-xs text-slate-400 block mb-2">
          Đổi mật khẩu (Để trống nếu không đổi)
        </label>
        <input
          type="password"
          placeholder="Mật khẩu cũ"
          value={oldPass}
          onChange={(e) => setOldPass(e.target.value)}
          className="w-full bg-slate-800 p-2 rounded border border-slate-700 text-sm mb-2 focus:border-amber-400 outline-none"
        />
        <input
          type="password"
          placeholder="Mật khẩu mới"
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
          className="w-full bg-slate-800 p-2 rounded border border-slate-700 text-sm focus:border-amber-400 outline-none"
        />
      </div>

      {msg && <p className="text-red-400 text-xs text-center">{msg}</p>}

      <div className="flex gap-2 pt-2">
        <button onClick={onCancel} className="flex-1 bg-slate-700 py-2 rounded text-sm text-white hover:bg-slate-600">
          Hủy
        </button>
        <button
          onClick={handleSave}
          className="flex-1 bg-amber-400 text-slate-900 font-bold py-2 rounded text-sm hover:bg-amber-500"
        >
          Lưu
        </button>
      </div>
    </div>
  );
};
