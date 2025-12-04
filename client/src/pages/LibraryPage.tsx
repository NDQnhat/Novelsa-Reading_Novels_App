import React from 'react';
import { Novel, User } from '../types';
import { BookOpen, Download, Check } from 'lucide-react';

interface LibraryPageProps {
  libraryNovels: Novel[];
  onNovelClick: (id: string) => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({ libraryNovels, onNovelClick }) => {
  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-6 pt-2">Tủ sách</h1>
      <div className="grid grid-cols-3 gap-4">
        {libraryNovels.map((novel) => (
          <div
            key={novel.id}
            onClick={() => onNovelClick(novel.id)}
            className="cursor-pointer relative"
          >
            <img
              src={novel.coverUrl}
              className="w-full aspect-[2/3] object-cover rounded-lg mb-2 bg-slate-700"
            />
            <div className="absolute top-1 right-1 bg-green-600 rounded-full p-0.5 border border-slate-900">
              <Check size={10} color="white" />
            </div>
            <h3 className="text-xs font-bold text-slate-300 line-clamp-2">{novel.title}</h3>
            <div className="mt-1 text-[9px] text-green-500 flex items-center gap-0.5">
              <Download size={8} /> Offline
            </div>
          </div>
        ))}
      </div>
      {libraryNovels.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
          <BookOpen size={48} className="mb-4 opacity-20" />
          <p>Tủ sách trống</p>
        </div>
      )}
    </div>
  );
};
