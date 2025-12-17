import React from 'react';
import { Novel } from '../types';
import { Eye, Book, UserIcon } from 'lucide-react';
import { utils } from '../services/services';

interface NovelCardProps {
  novel: Novel;
  onClick: () => void;
}

export const NovelCard: React.FC<NovelCardProps> = ({ novel, onClick }) => {
  const totalReads = utils.calculateTotalReads(novel);

  return (
    <div onClick={onClick} className="flex gap-3 mb-4 p-2 active:bg-slate-800 rounded-lg transition-colors cursor-pointer">
      <img
        src={novel.coverUrl}
        alt={novel.title}
        className="w-20 h-28 object-cover rounded shadow-md bg-slate-700"
      />
      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <h3 className="font-bold text-lg text-slate-100 leading-tight mb-1 line-clamp-2">
            {novel.title}
          </h3>
          <div className="flex items-center text-xs text-slate-400 mb-2">
            <UserIcon size={12} className="mr-1" /> {novel.authorName}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Eye size={12} /> {utils.formatNumber(totalReads)}
          </span>
          <span className="flex items-center gap-1">
            <Book size={12} /> {novel.chapters.length} chương
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">
            {novel.tags[0] || 'Truyện'}
          </span>
        </div>
      </div>
    </div>
  );
};
