import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { NovelStatus, Chapter } from './types';
import { AuthModal, EditNovelOverlay, NovelDetailOverlay, ReaderView, } from './components';
import { HomePage, WritePage, LibraryPage, AdminPage, ProfilePage, } from './pages';
import { useNovels, useAuth, useNovelFilters } from './hooks';
import { App as AntdApp } from 'antd';
import { TABS } from './utils/cores/constants';
import { useOfflineState, OfflineIndicator } from './hooks/useOfflineState';

export default function App() {
  const { message, modal } = AntdApp.useApp();
  const offlineState = useOfflineState();
  
  // === STATE MANAGEMENT ===
  const { novels, loading, updateNovel, createNovel, deleteNovel, refetchNovels } = useNovels();
  const { currentUser, login, logout, updateProfile, updateLibrary } = useAuth();
  const { searchQuery, setSearchQuery, selectedGenres, setSelectedGenres, sortBy, setSortBy, getFilteredNovels } =
    useNovelFilters(novels);

  // === VIEW STATE ===
  const [activeTab, setActiveTab] = useState(() => {
    // Restore active tab from localStorage on mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('activeTab');
      return saved || TABS.HOME;
    }
    return TABS.HOME;
  });
  const [viewNovelId, setViewNovelId] = useState<string | null>(null);
  const [readChapterId, setReadChapterId] = useState<string | null>(null);
  const [editingNovelId, setEditingNovelId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // === REGISTER SERVICE WORKER ===
  useEffect(() => {
    if (offlineState.isSupported && !offlineState.isReady) {
      offlineState.registerSW();
    }
  }, [offlineState]);

  // === PERSIST ACTIVE TAB TO LOCALSTORAGE ===
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  // === AUTO-REFETCH NOVELS ON WRITE TAB ===
  // Refetch every 5 seconds when on WRITE or LIBRARY tab to check for admin approvals
  // Disable if offline to avoid excessive errors
  useEffect(() => {
    if (!offlineState.isOnline) return;
    if (activeTab !== TABS.WRITE && activeTab !== TABS.LIBRARY) return;

    const interval = setInterval(() => {
      refetchNovels();
    }, 5000);

    return () => clearInterval(interval);
  }, [activeTab, refetchNovels, offlineState.isOnline]);

  // === TAB CHANGE ===
  const handleTabChange = (tab: string) => {
    if ((tab === TABS.LIBRARY || tab === TABS.WRITE || tab === TABS.ADMIN || tab === TABS.PROFILE) && !currentUser) {
      setShowAuthModal(true);
      message.info('Bạn cần đăng nhập để truy cập tính năng này.');
      return;
    }
    setActiveTab(tab);
    if (tab !== TABS.PROFILE) setIsEditingProfile(false);
    
    // Refetch novels when switching to WRITE or LIBRARY to get latest admin decisions
    if (tab === TABS.WRITE || tab === TABS.LIBRARY) {
      refetchNovels();
    }
  };

  // === AUTH HANDLERS ===
  const handleLogin = (user: any) => {
    if (user.role === 'BANNED') {
      message.error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
      return;
    }
    login(user);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    logout();
    setActiveTab(TABS.HOME);
    setIsEditingProfile(false);
  };

  // === NOVEL HANDLERS ===
  const handleReadChapter = async (novelId: string, chapterId: string) => {
    setViewNovelId(novelId);
    setReadChapterId(chapterId);
    
    const novel = novels.find((n) => n.id === novelId);
    if (novel && currentUser) {
      const chapterIndex = novel.chapters.findIndex((c) => c.id === chapterId);
      if (chapterIndex !== -1) {
        const updatedChapters = [...novel.chapters];
        updatedChapters[chapterIndex] = {
          ...updatedChapters[chapterIndex],
          readCount: updatedChapters[chapterIndex].readCount + 1,
        };
        try {
          await updateNovel(novelId, { chapters: updatedChapters });
        } catch {
          // Error already handled
        }
      }
    }
  };

  const handleAddComment = async (content: string) => {
    if (!currentUser || !viewNovelId || !readChapterId) return;

    const novel = novels.find((n) => n.id === viewNovelId);
    if (!novel) return;

    const chapterIndex = novel.chapters.findIndex((c) => c.id === readChapterId);
    if (chapterIndex === -1) return;

    const newComment = {
      id: `cmt-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatarUrl,
      content: content,
      timestamp: Date.now(),
    };

    const updatedChapters = [...novel.chapters];
    updatedChapters[chapterIndex] = {
      ...updatedChapters[chapterIndex],
      comments: [newComment, ...updatedChapters[chapterIndex].comments],
    };

    try {
      await updateNovel(novel.id, { chapters: updatedChapters });
      message.success('Đã gửi bình luận!');
    } catch {
      // Error already handled
    }
  };

  const handleToggleSaveToLibrary = async (novelId: string) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    try {
      await updateLibrary(novelId);
    } catch {
      message.error('Có lỗi xảy ra');
    }
  };

  const handleCreateNovel = async (novelData: any) => {
    if (!currentUser) {
      message.error('Bạn cần đăng nhập để tạo truyện');
      return;
    }

    const key = 'create_novel';
    message.loading({ content: 'Đang tạo...', key });

    try {
      const newNovel = {
        id: `novel-${Date.now()}`,
        title: novelData.title?.trim() || 'Truyện mới',
        description: novelData.description?.trim() || 'Mô tả truyện',
        authorId: currentUser.id || 'unknown',
        authorName: currentUser.name || 'Tác giả',
        coverUrl: novelData.coverUrl?.trim() || 'https://images.unsplash.com/photo-1507842217343-583f20270319?w=300&h=450&fit=crop',
        tags: novelData.tags || ['Truyện'],
        chapters: [],
        status: NovelStatus.DRAFT,
        updatedAt: Date.now(),
      };

      console.log('[CreateNovel] Sending data:', {
        authorId: newNovel.authorId,
        authorName: newNovel.authorName,
        title: newNovel.title,
        description: newNovel.description,
        coverUrl: newNovel.coverUrl,
        tags: newNovel.tags,
      });

      await createNovel(newNovel);
      message.success({ content: 'Đã tạo bản thảo mới!', key });
    } catch (error) {
      console.error('[CreateNovel] Error:', error);
      message.error({ content: 'Có lỗi xảy ra', key });
    }
  };

  const handleAddChapter = async (novelId: string) => {
    const novel = novels.find((n) => n.id === novelId);
    if (!novel) return;

    const newChapter: Chapter = {
      id: `ch-${Date.now()}`,
      order: novel.chapters.length + 1,
      title: `Chương ${novel.chapters.length + 1}`,
      content: '',
      publishedAt: Date.now(),
      readCount: 0,
      comments: [],
    };

    try {
      await updateNovel(novelId, { chapters: [...novel.chapters, newChapter] });
    } catch {
      // Error already handled
    }
  };

  const handleSaveChapterContent = async (novelId: string, chapterIndex: number, content: string) => {
    const novel = novels.find((n) => n.id === novelId);
    if (!novel) return;

    const updatedChapters = [...novel.chapters];
    updatedChapters[chapterIndex] = {
      ...updatedChapters[chapterIndex],
      content,
      novelId: novelId, // Ensure novelId is set
    };

    try {
      await updateNovel(novelId, { chapters: updatedChapters });
      message.success('Đã lưu nội dung chương!');
    } catch (error) {
      console.error('Save chapter error:', error);
      message.error('Không thể lưu nội dung chương');
    }
  };

  const handleSubmitForReview = async (novelId: string) => {
    const novel = novels.find((n) => n.id === novelId);
    if (!novel) {
      message.error('Không tìm thấy truyện');
      return;
    }

    // Validate required fields
    if (!novel.title || novel.title.trim() === '') {
      message.warning('Vui lòng nhập tên truyện!');
      return;
    }

    if (!novel.description || novel.description.trim() === '') {
      message.warning('Vui lòng nhập mô tả truyện!');
      return;
    }

    if (novel.chapters.length === 0) {
      message.warning('Cần ít nhất 1 chương để đăng truyện!');
      return;
    }

    const key = 'submit_review';
    message.loading({ content: 'Đang gửi yêu cầu...', key });
    try {
      await updateNovel(novelId, { status: NovelStatus.PENDING });
      message.success({ content: 'Đã gửi yêu cầu duyệt! Vui lòng chờ phản hồi.', key, duration: 2 });
      // Navigate to WRITE tab after success
      setTimeout(() => {
        setActiveTab(TABS.WRITE);
        setEditingNovelId(null);
      }, 500);
    } catch (error) {
      console.error('Submit error:', error);
      message.error({ content: 'Có lỗi xảy ra', key });
    }
  };

  const handleApproveNovel = async (novelId: string) => {
    const key = 'approve';
    message.loading({ content: 'Đang duyệt...', key });
    try {
      await updateNovel(novelId, { status: NovelStatus.APPROVED });
      message.success({ content: 'Đã duyệt truyện!', key });
      // Refetch novels to update status across all components
      refetchNovels();
    } catch {
      message.error({ content: 'Lỗi khi duyệt truyện', key });
    }
  };

  const handleRejectNovel = async (novelId: string) => {
    const key = 'reject';
    message.loading({ content: 'Đang từ chối...', key });
    try {
      await updateNovel(novelId, { status: NovelStatus.REJECTED });
      message.info({ content: 'Đã từ chối truyện.', key });
      // Refetch novels to update status across all components
      refetchNovels();
    } catch {
      message.error({ content: 'Lỗi khi từ chối truyện', key });
    }
  };

  const handleDeleteNovel = async (novelId: string) => {
    if (confirm('Xóa truyện này khỏi nền tảng?')) {
      const key = 'delete';
      message.loading({ content: 'Đang xóa...', key });
      try {
        await deleteNovel(novelId);
        message.success({ content: 'Đã xóa truyện.', key });
        if (editingNovelId === novelId) setEditingNovelId(null);
      } catch {
        message.error({ content: 'Lỗi khi xóa truyện', key });
      }
    }
  };

  // === DERIVED DATA ===
  // Ensure novels is always an array (safety check for API response format)
  const novelsArray = Array.isArray(novels) ? novels : [];

  const novel = novelsArray.find((n) => n.id === viewNovelId);
  const chapter =
    novel && readChapterId ? novel.chapters.find((c) => c.id === readChapterId) : null;
  const chapterIndex = novel && chapter ? novel.chapters.indexOf(chapter) : -1;

  const editingNovel = novelsArray.find((n) => n.id === editingNovelId);
  const visibleNovels = getFilteredNovels(novelsArray);

  const libraryNovels = currentUser
    ? novelsArray.filter((n) => currentUser.library.includes(n.id))
    : [];

  const myNovels = currentUser
    ? novelsArray.filter((n) => n.authorId === currentUser.id)
    : [];

  const pendingNovels = novelsArray.filter((n) => n.status === NovelStatus.PENDING);

  // === LOADING STATE ===
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // === READER VIEW ===
  if (novel && chapter && chapterIndex !== -1) {
    return (
      <ReaderView
        novel={novel}
        chapter={chapter}
        onBack={() => {
          // Only close the reader, keep the novel detail view
          setReadChapterId(null);
        }}
        onPrev={() => {
          if (chapterIndex > 0) {
            handleReadChapter(novel.id, novel.chapters[chapterIndex - 1].id);
          }
        }}
        onNext={() => {
          if (chapterIndex < novel.chapters.length - 1) {
            handleReadChapter(novel.id, novel.chapters[chapterIndex + 1].id);
          }
        }}
        hasPrev={chapterIndex > 0}
        hasNext={chapterIndex < novel.chapters.length - 1}
        onToggleSave={() => handleToggleSaveToLibrary(novel.id)}
        isSaved={currentUser ? currentUser.library.includes(novel.id) : false}
        currentUser={currentUser}
        onAddComment={handleAddComment}
        onRequestLogin={() => setShowAuthModal(true)}
      />
    );
  }

  // === EDIT NOVEL VIEW ===
  if (editingNovelId && editingNovel && currentUser) {
    return (
      <EditNovelOverlay
        novel={editingNovel}
        onClose={() => setEditingNovelId(null)}
        onUpdateNovel={updateNovel}
        onAddChapter={handleAddChapter}
        onSaveChapterContent={handleSaveChapterContent}
        onSubmitForReview={handleSubmitForReview}
      />
    );
  }

  // === NOVEL DETAIL VIEW ===
  if (viewNovelId && novel) {
    return (
      <NovelDetailOverlay
        novel={novel}
        currentUser={currentUser}
        onBack={() => {
          setViewNovelId(null);
          setReadChapterId(null);
        }}
        onReadChapter={handleReadChapter}
        onToggleSave={() => handleToggleSaveToLibrary(novel.id)}
        isSaved={currentUser ? currentUser.library.includes(novel.id) : false}
        onRequestLogin={() => setShowAuthModal(true)}
      />
    );
  }

  // === MAIN LAYOUT ===
  return (
    <Layout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      currentUser={currentUser}
      onShowAuth={() => setShowAuthModal(true)}
    >
      {/* Offline indicator */}
      <div className="sticky top-0 z-40">
        <OfflineIndicator state={offlineState} className="m-2" />
      </div>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
        />
      )}

      {/* Banned user notice */}
      {currentUser?.role === 'BANNED' && (
        <div className="p-4 pb-20">
          <div className="bg-red-600/20 border border-red-600 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-400 mb-3">Tài khoản bị khóa</h2>
            <p className="text-red-300 mb-4">
              Tài khoản của bạn đã bị khóa. Bạn không thể sử dụng các tính năng trên nền tảng.
            </p>
            <p className="text-sm text-red-300">
              Vui lòng liên hệ quản trị viên nếu bạn tin rằng đây là một lỗi.
            </p>
            <button
              onClick={handleLogout}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      )}

      {currentUser?.role !== 'BANNED' && (
        <>
          {activeTab === TABS.HOME && (
            <HomePage
              novels={visibleNovels}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedGenres={selectedGenres}
              onGenreToggle={(genre) => {
                setSelectedGenres((prev) =>
                  prev.includes(genre)
                    ? prev.filter((g) => g !== genre)
                    : [...prev, genre]
                );
              }}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onNovelClick={(id) => setViewNovelId(id)}
            />
          )}

          {activeTab === TABS.LIBRARY && (
            <LibraryPage
              libraryNovels={libraryNovels}
              onNovelClick={(id) => setViewNovelId(id)}
            />
          )}

          {activeTab === TABS.WRITE && currentUser && currentUser.role !== 'ADMIN' && (
            <WritePage
              myNovels={myNovels}
              currentUser={currentUser}
              onEditNovel={setEditingNovelId}
              onCreateNovel={handleCreateNovel}
              onDeleteNovel={handleDeleteNovel}
            />
          )}

          {activeTab === TABS.ADMIN && currentUser?.role === 'ADMIN' && (
            <AdminPage currentUser={currentUser} />
          )}

          {activeTab === TABS.PROFILE && currentUser && (
            <ProfilePage
              currentUser={currentUser}
              myNovels={myNovels}
              onLogout={handleLogout}
              onUpdateProfile={updateProfile}
              onShowInstall={() => {}}
            />
          )}
        </>
      )}
    </Layout>
  );
}
