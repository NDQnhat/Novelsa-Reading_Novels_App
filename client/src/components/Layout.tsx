import React from 'react';
import { Home, BookOpen, Download, PenTool, User, ShieldAlert } from 'lucide-react';
import { User as UserType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentUser?: UserType | null;
  onShowAuth?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, currentUser, onShowAuth }) => {
  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-dark shadow-2xl relative overflow-hidden border-x border-slate-800">
      <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
        {children}
      </main>
      
      {/* Bottom Navigation */}
      <nav className="h-16 bg-slate-900 border-t border-slate-800 flex justify-around items-center px-2 shrink-0 z-50">
        <button 
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center p-2 ${activeTab === 'home' ? 'text-primary' : 'text-slate-500'}`}
        >
          <Home size={24} />
          <span className="text-[10px] mt-1">Trang chủ</span>
        </button>

        <button 
          onClick={() => onTabChange('library')}
          className={`flex flex-col items-center p-2 ${activeTab === 'library' ? 'text-primary' : 'text-slate-500'}`}
        >
          <BookOpen size={24} />
          <span className="text-[10px] mt-1">Tủ sách</span>
        </button>

        <button 
          onClick={() => onTabChange('offline')}
          className={`flex flex-col items-center p-2 ${activeTab === 'offline' ? 'text-primary' : 'text-slate-500'}`}
        >
          <Download size={24} />
          <span className="text-[10px] mt-1">Offline</span>
        </button>

        {!isAdmin && (
          <button 
            onClick={() => onTabChange('write')}
            className={`flex flex-col items-center p-2 ${activeTab === 'write' ? 'text-primary' : 'text-slate-500'}`}
          >
            <div className="bg-primary/20 p-2 rounded-full -mt-6 border-4 border-dark">
              <PenTool size={24} className={activeTab === 'write' ? 'text-primary' : 'text-slate-300'} />
            </div>
            <span className="text-[10px] mt-1">Sáng tác</span>
          </button>
        )}

        {isAdmin && (
          <button 
            onClick={() => onTabChange('admin')}
            className={`flex flex-col items-center p-2 ${activeTab === 'admin' ? 'text-primary' : 'text-slate-500'}`}
          >
            <div className="bg-primary/20 p-2 rounded-full -mt-6 border-4 border-dark">
              <ShieldAlert size={24} className={activeTab === 'admin' ? 'text-primary' : 'text-slate-300'} />
            </div>
            <span className="text-[10px] mt-1">Admin</span>
          </button>
        )}

        <button 
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center p-2 ${activeTab === 'profile' ? 'text-primary' : 'text-slate-500'}`}
        >
          <User size={24} />
          <span className="text-[10px] mt-1">Cá nhân</span>
        </button>
      </nav>
    </div>
  );
};