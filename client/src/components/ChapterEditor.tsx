import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

interface ChapterEditorProps {
  title: string;
  content: string;
  onSave: (title: string, content: string) => void;
  onCancel: () => void;
}

export const ChapterEditor: React.FC<ChapterEditorProps> = ({
  title: initTitle,
  content: initContent,
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = useState(initTitle);
  const [content, setContent] = useState(initContent);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col">
      <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
        <button onClick={onCancel} className="text-slate-400 hover:text-white">
          <X size={24} />
        </button>
        <span className="font-bold text-white">Soạn thảo chương</span>
        <button
          onClick={() => onSave(title, content)}
          className="bg-amber-400 text-slate-900 px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1"
        >
          <Save size={16} /> Lưu
        </button>
      </div>

      <div className="p-4 space-y-4 flex-1 flex flex-col overflow-hidden">
        <div>
          <label className="block text-xs text-slate-300 mb-1">Tiêu đề chương</label>
          <input
            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-medium focus:border-amber-400 outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Chương 1: Mở đầu"
          />
        </div>
        <div className="flex-1 flex flex-col">
          <label className="block text-xs text-slate-300 mb-1">Nội dung</label>
          <textarea
            className="flex-1 w-full bg-slate-800 border border-slate-700 rounded p-3 text-white leading-relaxed focus:border-amber-400 outline-none resize-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nhập nội dung truyện tại đây..."
          />
        </div>
      </div>
    </div>
  );
};
