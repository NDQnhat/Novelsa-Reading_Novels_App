import React from 'react';
import { Novel, Chapter, User } from '../types';
import { ReaderView } from './ReaderView';

interface ReaderOverlayProps {
  novel: Novel;
  chapter: Chapter;
  chapterIndex: number;
  currentUser: User | null;
  onBack: () => void;
  onAddComment: (content: string) => Promise<void>;
  onToggleSave: () => Promise<void>;
  isSaved: boolean;
  onRequestLogin: () => void;
}

export function ReaderOverlay({
  novel,
  chapter,
  chapterIndex,
  currentUser,
  onBack,
  onAddComment,
  onToggleSave,
  isSaved,
  onRequestLogin,
}: ReaderOverlayProps) {
  return (
    <ReaderView
      novel={novel}
      chapter={chapter}
      onBack={onBack}
      onPrev={() => {
        // Navigation handled by parent
      }}
      onNext={() => {
        // Navigation handled by parent
      }}
      hasPrev={chapterIndex > 0}
      hasNext={chapterIndex < novel.chapters.length - 1}
      onToggleSave={onToggleSave}
      isSaved={isSaved}
      currentUser={currentUser}
      onAddComment={onAddComment}
      onRequestLogin={onRequestLogin}
    />
  );
}
