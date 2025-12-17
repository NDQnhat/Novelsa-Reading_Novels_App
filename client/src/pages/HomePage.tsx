import React, { useState, useMemo } from 'react';
import { Novel, NovelStatus, User } from '../types';
import { Filter, Search, LogIn, Plus, Check, ChevronDown } from 'lucide-react';
import { message } from 'antd';
import { NovelCard } from '../components';
import { utils } from '../services/services';

interface HomePageProps {
  novels: Novel[];
  currentUser: User | null;
  loading: boolean;
  onNovelClick: (id: string) => void;
  onLoginClick: () => void;
  onToggleSaveToLibrary: (novelId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  novels,
  currentUser,
  loading,
  onNovelClick,
  onLoginClick,
  onToggleSaveToLibrary,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'relevance' | 'popular' | 'updated'>('relevance');
  const [visibleChaptersCount, setVisibleChaptersCount] = useState(50);

  // Derived Data
  const visibleNovels = useMemo(() => {
    return novels
      .filter((n) => n.status === NovelStatus.APPROVED)
      .sort((a, b) => {
        const tA = new Date(a.updatedAt || 0).getTime();
        const tB = new Date(b.updatedAt || 0).getTime();
        return tB - tA;
      });
  }, [novels]);

  const allGenres = useMemo(() => {
    const tags = new Set<string>();
    novels.forEach((n) => n.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [novels]);

  const filteredNovels = useMemo(() => {
    let result = visibleNovels.filter((n) => {
      const matchesSearch =
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.authorName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenres =
        selectedGenres.length === 0 || selectedGenres.every((g) => n.tags.includes(g));
      return matchesSearch && matchesGenres;
    });

    if (sortBy === 'popular') {
      result = [...result].sort(
        (a, b) => utils.calculateTotalReads(b) - utils.calculateTotalReads(a)
      );
    } else if (sortBy === 'updated') {
      result = [...result].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }

    return result;
  }, [visibleNovels, searchQuery, selectedGenres, sortBy]);

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres((prev) => prev.filter((g) => g !== genre));
    } else {
      setSelectedGenres((prev) => [...prev, genre]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 pt-2">
        <div>
          <h1 className="text-2xl font-bold text-white">VietNovel</h1>
          <p className="text-xs text-slate-300">Khám phá thế giới qua từng trang sách</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowFilter(!showFilter);
              if (showSearchBar) setShowSearchBar(false);
            }}
            className={`p-2 rounded-full transition-colors ${
              showFilter ? 'bg-amber-400 text-slate-900' : 'bg-slate-800 text-slate-300'
            }`}
          >
            <Filter size={20} />
          </button>
          <button
            onClick={() => {
              setShowSearchBar(!showSearchBar);
              if (showSearchBar) setSearchQuery('');
              if (showFilter) setShowFilter(false);
            }}
            className={`p-2 rounded-full transition-colors ${
              showSearchBar ? 'bg-amber-400 text-slate-900' : 'bg-slate-800 text-slate-300'
            }`}
          >
            <Search size={20} />
          </button>
          {!currentUser && (
            <button
              onClick={onLoginClick}
              className="p-2 bg-amber-400/20 text-amber-400 rounded-full"
            >
              <LogIn size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Search Bar */}
      {showSearchBar && (
        <div className="mb-4 animate-in slide-in-from-top duration-200">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-slate-500" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên truyện hoặc tác giả..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:border-amber-400 focus:outline-none text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter Panel */}
      {showFilter && (
        <div className="mb-6 bg-slate-900 border border-slate-800 rounded-xl p-4 animate-in slide-in-from-top duration-200">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-300 mb-2 uppercase">Sắp xếp theo</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('relevance')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                  sortBy === 'relevance'
                    ? 'bg-amber-400 text-slate-900 border-amber-400'
                    : 'text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
              >
                Liên quan
              </button>
              <button
                onClick={() => setSortBy('popular')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                  sortBy === 'popular'
                    ? 'bg-amber-400 text-slate-900 border-amber-400'
                    : 'text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
              >
                Phổ biến
              </button>
              <button
                onClick={() => setSortBy('updated')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                  sortBy === 'updated'
                    ? 'bg-amber-400 text-slate-900 border-amber-400'
                    : 'text-slate-400 border-slate-700 hover:border-slate-500'
                }`}
              >
                Mới cập nhật
              </button>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase">Thể loại</h3>
              {selectedGenres.length > 0 && (
                <button
                  onClick={() => setSelectedGenres([])}
                  className="text-[10px] text-red-400"
                >
                  Xóa chọn
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {allGenres.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleGenre(tag)}
                  className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors ${
                    selectedGenres.includes(tag)
                      ? 'bg-amber-400 text-slate-900 border-amber-400 font-bold'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      {searchQuery || selectedGenres.length > 0 || sortBy !== 'relevance' ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-slate-300">Kết quả ({filteredNovels.length})</h2>
            {(selectedGenres.length > 0 || sortBy !== 'relevance') && (
              <span className="text-[10px] text-amber-400 italic">Đang lọc/sắp xếp</span>
            )}
          </div>

          {filteredNovels.map((novel) => (
            <NovelCard
              key={novel.id}
              novel={novel}
              onClick={() => onNovelClick(novel.id)}
            />
          ))}

          {filteredNovels.length === 0 && (
            <div className="text-center py-10 text-slate-500">
              <Search size={48} className="mx-auto mb-4 opacity-20" />
              <p>Không tìm thấy truyện nào phù hợp.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGenres([]);
                  setSortBy('relevance');
                }}
                className="mt-4 text-amber-400 text-sm font-bold"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Featured Section */}
          {visibleNovels.length > 0 && (
            <div
              onClick={() => onNovelClick(visibleNovels[0].id)}
              className="relative h-48 rounded-2xl overflow-hidden mb-8 shadow-2xl cursor-pointer group"
            >
              <img
                src={visibleNovels[0].coverUrl}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="bg-amber-400 text-slate-900 text-[10px] font-bold px-2 py-1 rounded mb-2 inline-block">
                  Đề xuất
                </span>
                <h2 className="text-xl font-bold text-white mb-1 truncate">
                  {visibleNovels[0].title}
                </h2>
                <p className="text-xs text-slate-300 line-clamp-1">
                  {visibleNovels[0].description}
                </p>
              </div>
            </div>
          )}

          <h2 className="text-lg font-bold mb-4 text-slate-200">Mới cập nhật</h2>
          <div>
            {visibleNovels.map((novel) => (
              <NovelCard
                key={novel.id}
                novel={novel}
                onClick={() => onNovelClick(novel.id)}
              />
            ))}
            {visibleNovels.length === 0 && (
              <p className="text-center text-slate-500 py-10">Chưa có truyện nào được đăng.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
