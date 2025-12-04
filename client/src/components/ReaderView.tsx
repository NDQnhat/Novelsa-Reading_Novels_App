import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Novel, Chapter, Comment, User } from '../types';
import {
  ChevronLeft,
  Download,
  Settings,
  MessageCircle,
  Headphones,
  Play,
  Pause,
  Square,
  Mic,
  Send,
  X,
  Eye,
  Book,
} from 'lucide-react';

interface ReaderProps {
  novel: Novel;
  chapter: Chapter;
  onBack: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onToggleSave: () => void;
  isSaved: boolean;
  currentUser: User | null;
  onAddComment: (content: string) => void;
  onRequestLogin: () => void;
}

export const ReaderView: React.FC<ReaderProps> = ({
  novel,
  chapter,
  onBack,
  onNext,
  onPrev,
  hasPrev,
  hasNext,
  onToggleSave,
  isSaved,
  currentUser,
  onAddComment,
  onRequestLogin,
}) => {
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState<'dark' | 'light' | 'sepia'>('dark');
  const [showMenu, setShowMenu] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(-1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize Voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        const viVoice = availableVoices.find((v) => v.lang.includes('vi'));
        if (viVoice) {
          setSelectedVoice(viVoice);
        } else if (!selectedVoice) {
          setSelectedVoice(availableVoices[0]);
        }
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Advanced Chunking Logic
  const { visualContent, audioQueue } = useMemo(() => {
    if (!chapter.content) {
      return {
        visualContent: [
          {
            type: 'text',
            id: 'empty',
            segments: [{ text: 'Nội dung đang cập nhật', index: 0, id: 's-0' }],
          },
        ],
        audioQueue: ['Nội dung đang cập nhật'],
      };
    }

    const paras = chapter.content.split('\n');
    let globalIndex = 0;
    const queue: string[] = [];

    queue.push(chapter.title);
    const titleIndex = globalIndex++;

    const processed = paras.map((para, paraIdx) => {
      if (!para.trim()) return { type: 'empty', id: `p-${paraIdx}`, segments: [] };

      const sentences = para.match(/[^.!?\n]+([.!?]+|$)/g) || [para];

      const segments = sentences.map((text, sIdx) => {
        const currentIdx = globalIndex++;
        queue.push(text.trim());
        return {
          text: text,
          index: currentIdx,
          id: `s-${paraIdx}-${sIdx}`,
        };
      });

      return { type: 'text', id: `p-${paraIdx}`, segments };
    });

    return { visualContent: processed, audioQueue: queue };
  }, [chapter]);

  useEffect(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
    setCurrentChunkIndex(-1);
  }, [chapter.id]);

  const speakChunk = (index: number) => {
    if (index >= audioQueue.length) {
      setSpeaking(false);
      setPaused(false);
      setCurrentChunkIndex(-1);
      return;
    }

    window.speechSynthesis.cancel();
    const text = audioQueue[index];
    if (!text) {
      speakChunk(index + 1);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = rate;

    setCurrentChunkIndex(index);

    const el = document.getElementById(`tts-chunk-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    utterance.onend = () => {
      const nextIndex = index + 1;
      setTimeout(() => {
        if (speaking && !paused) {
          speakChunk(nextIndex);
        }
      }, 50);
    };

    utterance.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      console.error('Speech error type:', e.error);

      setTimeout(() => {
        if (speaking && !paused) speakChunk(index + 1);
      }, 500);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleTogglePlay = () => {
    if (speaking && !paused) {
      window.speechSynthesis.pause();
      setPaused(true);
    } else if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    } else {
      setSpeaking(true);
      setPaused(false);
      const startIndex = Math.max(0, currentChunkIndex === -1 ? 0 : currentChunkIndex);
      speakChunk(startIndex);
    }
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
    setCurrentChunkIndex(-1);
  };

  const handleRestart = () => {
    window.speechSynthesis.cancel();
    setCurrentChunkIndex(0);
    setSpeaking(true);
    setPaused(false);
    speakChunk(0);
  };

  const updateSettingsWhileSpeaking = () => {
    if (speaking && !paused && currentChunkIndex !== -1) {
      window.speechSynthesis.cancel();
      speakChunk(currentChunkIndex);
    }
  };

  const themeClasses = {
    dark: 'bg-slate-950 text-slate-300',
    light: 'bg-white text-slate-900',
    sepia: 'bg-orange-50 text-slate-800',
  };

  const handleSendComment = () => {
    if (commentText.trim()) {
      onAddComment(commentText);
      setCommentText('');
    }
  };

  const formatDate = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Vừa xong';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
    return new Date(timestamp).toLocaleDateString('vi-VN');
  };

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col ${themeClasses[theme]} transition-colors duration-300`}>
      {showMenu && (
        <div className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-4 bg-slate-900/90 backdrop-blur text-white shadow-md z-10">
          <button onClick={onBack}>
            <ChevronLeft />
          </button>
          <div className="flex-1 text-center px-4 truncate font-serif">{novel.title}</div>
          <button
            onClick={onToggleSave}
            className={isSaved ? 'text-amber-400' : 'text-white'}
          >
            <Download size={20} />
          </button>
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto px-5 py-20 leading-relaxed max-w-3xl mx-auto w-full"
        onClick={() => setShowMenu(!showMenu)}
        style={{ fontSize: `${fontSize}px`, fontFamily: 'Merriweather, serif' }}
      >
        <h2
          id="tts-chunk-0"
          className={`text-2xl font-bold mb-6 mt-4 transition-colors duration-300 rounded px-1 ${
            currentChunkIndex === 0 ? 'bg-yellow-500/50 text-white' : ''
          }`}
        >
          {chapter.title}
        </h2>

        <div className="whitespace-pre-wrap">
          {visualContent.map((block) => {
            if (block.type === 'empty') return <br key={block.id} className="mb-4 block" />;

            return (
              <p key={block.id} className="mb-4 text-justify">
                {block.segments.map((seg) => (
                  <span
                    key={seg.id}
                    id={`tts-chunk-${seg.index}`}
                    className={`transition-colors duration-300 rounded px-0.5 ${
                      currentChunkIndex === seg.index ? 'bg-yellow-500/50 text-white shadow-sm' : ''
                    }`}
                  >
                    {seg.text}{' '}
                  </span>
                ))}
              </p>
            );
          })}
        </div>

        <div className="mt-12 pt-6 border-t border-current opacity-50 text-sm flex justify-between">
          <span>{chapter.readCount} lượt đọc</span>
          <span>{chapter.likeCount} lượt thích</span>
        </div>
      </div>

      {showMenu && (
        <div className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur text-white p-4 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
          <div className="flex justify-between items-center mb-4 px-2">
            <button
              disabled={!hasPrev}
              onClick={onPrev}
              className={`p-2 rounded ${!hasPrev ? 'opacity-30' : 'active:bg-slate-700'}`}
            >
              Trước
            </button>
            <span className="text-sm font-light">Chương {chapter.order}</span>
            <button
              disabled={!hasNext}
              onClick={onNext}
              className={`p-2 rounded ${!hasNext ? 'opacity-30' : 'active:bg-slate-700'}`}
            >
              Sau
            </button>
          </div>

          <div className="flex justify-between items-center border-t border-slate-700 pt-3">
            <div className="flex gap-2 text-xs">
              <button
                onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                className="w-8 h-8 rounded bg-slate-800 border border-slate-600"
              >
                A-
              </button>
              <button
                onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                className="w-8 h-8 rounded bg-slate-800 border border-slate-600"
              >
                A+
              </button>
            </div>

            <div className="flex gap-4 items-center">
              <button
                onClick={() => setShowAudioSettings(true)}
                className={`relative p-1 ${
                  speaking ? 'text-amber-400 animate-pulse' : 'text-white'
                }`}
              >
                <Headphones size={24} />
              </button>

              <button onClick={() => setShowComments(true)} className="relative p-1">
                <MessageCircle size={24} />
                {chapter.comments.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                    {chapter.comments.length > 99 ? '99+' : chapter.comments.length}
                  </span>
                )}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setTheme('light')}
                  className="w-6 h-6 rounded-full bg-white border-2 border-slate-500"
                ></button>
                <button
                  onClick={() => setTheme('sepia')}
                  className="w-6 h-6 rounded-full bg-orange-100 border-2 border-slate-500"
                ></button>
                <button
                  onClick={() => setTheme('dark')}
                  className="w-6 h-6 rounded-full bg-slate-900 border-2 border-white"
                ></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAudioSettings && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-sm">
          <div
            className="bg-slate-900 w-full rounded-t-2xl flex flex-col animate-in slide-in-from-bottom duration-300 shadow-2xl border-t border-slate-700 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Headphones size={20} className="text-amber-400" /> Nghe truyện
              </h3>
              <button
                onClick={() => setShowAudioSettings(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex justify-center items-center gap-8 mb-8">
              <button
                onClick={handleStop}
                className="text-slate-400 hover:text-red-500 flex flex-col items-center"
              >
                <Square size={20} fill="currentColor" />
                <span className="text-[10px] mt-1">Dừng</span>
              </button>

              <button
                onClick={handleTogglePlay}
                className="w-16 h-16 bg-amber-400 rounded-full flex items-center justify-center text-slate-900 shadow-lg shadow-amber-500/20 active:scale-95 transition-transform"
              >
                {speaking && !paused ? (
                  <Pause size={32} fill="currentColor" />
                ) : (
                  <Play size={32} fill="currentColor" className="ml-1" />
                )}
              </button>

              <button
                onClick={handleRestart}
                className="text-slate-400 hover:text-white flex flex-col items-center"
              >
                <div className="w-5 h-5 border-2 border-current rounded-full border-t-transparent animate-none"></div>
                <span className="text-[10px] mt-1">Đọc lại</span>
              </button>
            </div>

            <div className="text-center mb-4 text-xs text-amber-400">
              {speaking
                ? `Đang đọc câu ${currentChunkIndex + 1} / ${audioQueue.length}`
                : paused
                  ? 'Đang tạm dừng'
                  : 'Sẵn sàng'}
            </div>

            <div className="space-y-4 bg-slate-800 p-4 rounded-xl">
              <div className="flex justify-between items-center text-sm text-slate-300">
                <span>Tốc độ: {rate}x</span>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={rate}
                  onChange={(e) => {
                    const newRate = parseFloat(e.target.value);
                    setRate(newRate);
                    setTimeout(updateSettingsWhileSpeaking, 100);
                  }}
                  className="w-32"
                />
              </div>

              <div className="flex items-center gap-3">
                <Mic size={18} className="text-slate-500" />
                <select
                  className="flex-1 bg-slate-900 border border-slate-700 text-white text-sm rounded p-2 focus:border-amber-400 outline-none"
                  value={selectedVoice?.name || ''}
                  onChange={(e) => {
                    const v = voices.find((voice) => voice.name === e.target.value);
                    if (v) {
                      setSelectedVoice(v);
                      setTimeout(updateSettingsWhileSpeaking, 100);
                    }
                  }}
                >
                  {voices.length === 0 && <option>Đang tải giọng đọc...</option>}
                  {voices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {showComments && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-sm">
          <div
            className="bg-slate-900 w-full h-[80%] rounded-t-2xl flex flex-col animate-in slide-in-from-bottom duration-300 shadow-2xl border-t border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-800">
              <h3 className="font-bold text-white">Bình luận ({chapter.comments.length})</h3>
              <button
                onClick={() => setShowComments(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chapter.comments.length === 0 ? (
                <div className="text-center text-slate-500 py-10">
                  <p>Chưa có bình luận nào.</p>
                  <p className="text-xs">Hãy là người đầu tiên bình luận!</p>
                </div>
              ) : (
                chapter.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    {comment.userAvatar ? (
                      <img
                        src={comment.userAvatar}
                        alt={comment.userName}
                        className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                        {comment.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="font-bold text-sm text-slate-200">{comment.userName}</span>
                        <span className="text-[10px] text-slate-500">
                          {formatDate(comment.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 bg-slate-800 p-2 rounded-br-lg rounded-bl-lg rounded-tr-lg inline-block">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900 pb-6">
              {currentUser ? (
                <div className="flex gap-2 items-end">
                  <img
                    src={currentUser.avatarUrl || ''}
                    className="w-8 h-8 rounded-full bg-slate-700 object-cover"
                  />
                  <div className="flex-1 relative">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Viết bình luận..."
                      className="w-full bg-slate-800 text-white rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"
                      rows={1}
                      style={{ minHeight: '38px' }}
                    />
                    <button
                      onClick={handleSendComment}
                      disabled={!commentText.trim()}
                      className={`absolute right-2 bottom-1.5 p-1 rounded-full ${
                        commentText.trim()
                          ? 'text-amber-400 hover:bg-slate-700'
                          : 'text-slate-600'
                      }`}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={onRequestLogin}
                  className="w-full bg-slate-800 text-amber-400 text-sm font-bold py-3 rounded-lg border border-dashed border-slate-600 hover:bg-slate-700"
                >
                  Đăng nhập để bình luận
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
