import React, { useState } from 'react';
import { User } from '../types';
import { message } from 'antd';
import { UserIcon, Mail, Lock, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { mockService } from '../services/mockService';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(mockService.getRandomAvatars()[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fillDemoAccount = (role: 'admin' | 'user') => {
    if (role === 'admin') {
      setEmail('admin@vietnovel.com');
      setPassword('password');
      message.info('Đã nhập tài khoản Admin Demo');
    } else {
      setEmail('user@example.com');
      setPassword('password');
      message.info('Đã nhập tài khoản User Demo');
    }
  };

  const handleAuth = async () => {
    setError('');

    if (!email.trim() || !password.trim()) {
      const msg = 'Vui lòng điền đầy đủ email và mật khẩu.';
      setError(msg);
      message.warning(msg);
      return;
    }

    setLoading(true);
    const key = 'auth';
    message.loading({ content: 'Đang xử lý...', key });

    try {
      let user;
      if (mode === 'login') {
        user = await api.login(email, password);
        message.success({ content: `Chào mừng trở lại, ${user.name}!`, key, duration: 2 });
      } else {
        if (!name.trim()) {
          const msg = 'Vui lòng nhập họ tên.';
          setError(msg);
          message.warning(msg);
          setLoading(false);
          return;
        }
        user = await api.register({
          email,
          password,
          name,
          avatarUrl: selectedAvatar,
        });
        message.success({ content: 'Đăng ký tài khoản thành công!', key, duration: 2 });
      }
      onLogin(user);
      onClose();
    } catch (err: any) {
      const errMsg = err.message || 'Có lỗi xảy ra';
      setError(errMsg);
      message.error({ content: errMsg, key, duration: 3 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center px-4 backdrop-blur-sm">
      <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
        <div className="flex border-b border-slate-800">
          <button
            className={`flex-1 py-4 font-bold text-sm ${
              mode === 'login' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => {
              setMode('login');
              setError('');
            }}
          >
            Đăng nhập
          </button>
          <button
            className={`flex-1 py-4 font-bold text-sm ${
              mode === 'register' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => {
              setMode('register');
              setError('');
            }}
          >
            Đăng ký
          </button>
        </div>

        <div className="p-6">
          {mode === 'register' && (
            <div className="mb-6">
              <label className="block text-xs text-slate-400 mb-2">Chọn Avatar</label>
              <div className="flex gap-2 justify-center">
                {mockService.getRandomAvatars().slice(0, 4).map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedAvatar(url)}
                    className={`relative rounded-full overflow-hidden w-12 h-12 border-2 ${
                      selectedAvatar === url ? 'border-amber-400' : 'border-transparent opacity-50'
                    }`}
                  >
                    <img src={url} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Họ và tên</label>
                <div className="relative">
                  <UserIcon size={16} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-3 py-3 text-white focus:border-amber-400 focus:outline-none"
                    placeholder="Nhập tên hiển thị"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-400 mb-1">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-slate-500" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-3 py-3 text-white focus:border-amber-400 focus:outline-none"
                  placeholder="vidu@email.com"
                  type="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Mật khẩu</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-slate-500" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-3 py-3 text-white focus:border-amber-400 focus:outline-none"
                  placeholder="******"
                  type="password"
                  onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                />
              </div>
            </div>

            {mode === 'login' && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => fillDemoAccount('admin')}
                  className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2 rounded text-xs text-slate-300 transition-colors"
                >
                  <ShieldCheck size={14} className="text-red-500" /> Demo Admin
                </button>
                <button
                  onClick={() => fillDemoAccount('user')}
                  className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2 rounded text-xs text-slate-300 transition-colors"
                >
                  <UserIcon size={14} className="text-blue-500" /> Demo User
                </button>
              </div>
            )}

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              onClick={handleAuth}
              disabled={loading}
              className="w-full bg-amber-400 text-slate-900 font-bold py-3 rounded-lg shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : mode === 'login' ? 'Vào đọc truyện' : 'Tạo tài khoản'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <button onClick={onClose} className="text-slate-500 text-xs hover:text-slate-300">
              Để sau, xem với tư cách Khách
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
