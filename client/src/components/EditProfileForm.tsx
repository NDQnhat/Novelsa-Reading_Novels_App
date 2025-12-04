import React, { useState } from 'react';
import { User } from '../types';
import { message } from 'antd';
import { Edit3, LogOut, Book, Heart, Settings, Download } from 'lucide-react';
import { mockService } from '../services/mockService';

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
  const [editName, setEditName] = useState(currentUser.name);
  const [editAvatar, setEditAvatar] = useState(currentUser.avatarUrl || '');
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [msg, setMsg] = useState('');

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
          {mockService.getRandomAvatars().slice(0, 4).map((url, idx) => (
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
        <div className="flex justify-center">
          <img src={editAvatar} className="w-20 h-20 rounded-full border-2 border-amber-400 object-cover" />
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
        <button onClick={onCancel} className="flex-1 bg-slate-700 py-2 rounded text-sm">
          Hủy
        </button>
        <button
          onClick={handleSave}
          className="flex-1 bg-amber-400 text-slate-900 font-bold py-2 rounded text-sm"
        >
          Lưu
        </button>
      </div>
    </div>
  );
};
