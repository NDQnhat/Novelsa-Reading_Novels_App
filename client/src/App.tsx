import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { NovelStatus, Chapter } from './types';
import { AuthModal, EditNovelOverlay, NovelDetailOverlay, ReaderView, } from './components';
import { HomePage, WritePage, LibraryPage, AdminPage, ProfilePage, } from './pages';
import { useNovels, useAuth, useNovelFilters } from './hooks';
import { message } from 'antd';
import { TABS } from './utils/constants';

export default function App() {
  // === STATE MANAGEMENT ===
  const { novels, loading, updateNovel, createNovel, deleteNovel } = useNovels();
  const { currentUser, login, logout, updateProfile, updateLibrary } = useAuth();
  const { searchQuery, setSearchQuery, selectedGenres, setSelectedGenres, sortBy, setSortBy, getFilteredNovels } =
    useNovelFilters(novels);

  // === VIEW STATE ===
  const [activeTab, setActiveTab] = useState(TABS.HOME);
  const [viewNovelId, setViewNovelId] = useState<string | null>(null);
  const [readChapterId, setReadChapterId] = useState<string | null>(null);
  const [editingNovelId, setEditingNovelId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // === TAB CHANGE ===
  const handleTabChange = (tab: string) => {
    if ((tab === TABS.LIBRARY || tab === TABS.WRITE || tab === TABS.ADMIN) && !currentUser) {
      setShowAuthModal(true);
      message.info('Bạn cần đăng nhập để truy cập tính năng này.');
      return;
    }
    setActiveTab(tab);
    if (tab !== TABS.PROFILE) setIsEditingProfile(false);
  };

  // === AUTH HANDLERS ===
  const handleLogin = (user: any) => {
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
    if (!currentUser) return;

    const key = 'create_novel';
    message.loading({ content: 'Đang tạo...', key });

    try {
      const newNovel = {
        id: `novel-${Date.now()}`,
        title: novelData.title || 'Truyện mới',
        description: novelData.description || '',
        authorId: currentUser.id,
        authorName: currentUser.name,
        coverUrl: novelData.coverUrl || 'https://picsum.photos/200/300?random=1',
        tags: novelData.tags || ['Truyện'],
        chapters: [],
        status: NovelStatus.DRAFT,
        updatedAt: Date.now(),
      };

      await createNovel(newNovel);
      message.success({ content: 'Đã tạo bản thảo mới!', key });
    } catch {
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
    updatedChapters[chapterIndex] = { ...updatedChapters[chapterIndex], content };

    try {
      await updateNovel(novelId, { chapters: updatedChapters });
      message.success('Đã lưu nội dung chương!');
    } catch {
      // Error already handled
    }
  };

  const handleSubmitForReview = async (novelId: string) => {
    const novel = novels.find((n) => n.id === novelId);
    if (!novel || novel.chapters.length === 0) {
      message.warning('Cần ít nhất 1 chương để đăng truyện!');
      return;
    }

    const key = 'submit_review';
    message.loading({ content: 'Đang gửi yêu cầu...', key });
    try {
      await updateNovel(novelId, { status: NovelStatus.PENDING });
      message.success({ content: 'Đã gửi yêu cầu duyệt! Vui lòng chờ phản hồi.', key });
    } catch {
      message.error({ content: 'Có lỗi xảy ra', key });
    }
  };

  const handleApproveNovel = async (novelId: string) => {
    const key = 'approve';
    message.loading({ content: 'Đang duyệt...', key });
    try {
      await updateNovel(novelId, { status: NovelStatus.APPROVED });
      message.success({ content: 'Đã duyệt truyện!', key });
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
  console.log(novels);

  const novel = (novels).find((n) => n.id === viewNovelId);
  const chapter =
    novel && readChapterId ? novel.chapters.find((c) => c.id === readChapterId) : null;
  const chapterIndex = novel && chapter ? novel.chapters.indexOf(chapter) : -1;

  const editingNovel = novels.find((n) => n.id === editingNovelId);
  const visibleNovels = getFilteredNovels(novels);

  const libraryNovels = currentUser
    ? novels.filter((n) => currentUser.library.includes(n.id))
    : [];

  const myNovels = currentUser
    ? novels.filter((n) => n.authorId === currentUser.id)
    : [];

  const pendingNovels = novels.filter((n) => n.status === NovelStatus.PENDING);

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
          setReadChapterId(null);
          setViewNovelId(null);
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
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
        />
      )}

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

      {activeTab === TABS.WRITE && currentUser && (
        <WritePage
          myNovels={myNovels}
          currentUser={currentUser}
          onEditNovel={setEditingNovelId}
          onCreateNovel={handleCreateNovel}
          onDeleteNovel={handleDeleteNovel}
        />
      )}

      {activeTab === TABS.ADMIN && currentUser?.role === 'ADMIN' && (
        <AdminPage
          pendingNovels={pendingNovels}
          allNovels={novels}
          currentUser={currentUser}
          onApprove={handleApproveNovel}
          onReject={handleRejectNovel}
          onDelete={handleDeleteNovel}
          onViewNovel={(id) => setViewNovelId(id)}
        />
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
    </Layout>
  );
}
