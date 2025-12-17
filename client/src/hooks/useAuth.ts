import { useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { message } from 'antd';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const login = async (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    message.success('Đã đăng xuất.');
  };

  const updateProfile = async (updatedData: Partial<User>) => {
    if (!currentUser) return;
    const key = 'up_profile';
    message.loading({ content: 'Đang cập nhật...', key });
    try {
      const updatedUser = await api.updateUser(currentUser.id, updatedData);
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      message.success({ content: 'Cập nhật thông tin thành công!', key });
      return updatedUser;
    } catch (e) {
      message.error({ content: 'Có lỗi xảy ra khi cập nhật', key });
      throw e;
    }
  };

  const updateLibrary = async (novelId: string) => {
    if (!currentUser) throw new Error('Not logged in');

    const isSaved = currentUser.library.includes(novelId);
    const key = 'upd_lib';
    message.loading({ content: 'Đang cập nhật...', key });
    
    try {
      const updatedUser = isSaved
        ? await api.removeFromLibrary(currentUser.id, novelId)
        : await api.addToLibrary(currentUser.id, novelId);

      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      if (isSaved) {
        message.success({ content: 'Đã xóa khỏi tủ sách.', key });
      } else {
        message.success({ content: 'Đã thêm vào tủ sách!', key });
      }

      return updatedUser;
    } catch (e) {
      message.error({ content: 'Có lỗi xảy ra khi cập nhật tủ sách', key });
      throw e;
    }
  };

  return {
    currentUser,
    login,
    logout,
    updateProfile,
    updateLibrary,
  };
}
