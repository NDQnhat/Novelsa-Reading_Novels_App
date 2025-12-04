import { Novel, NovelStatus, User, UserRole } from '../types';

export const MOCK_USER: User = {
  id: 'user-1',
  email: 'user@example.com',
  password: 'password',
  name: 'Người Dùng Mẫu',
  avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
  role: UserRole.USER,
  library: ['novel-1'],
  downloadedChapters: []
};

export const MOCK_NOVELS: Novel[] = [
  {
    id: 'novel-1',
    authorId: 'author-1',
    authorName: 'Lão Trư',
    title: 'Huyền Thoại Bắt Đầu',
    description: 'Một câu chuyện giả tưởng về hành trình trở thành huyền thoại của một thiếu niên bình thường trong thế giới tu tiên đầy khắc nghiệt. Hắn mang theo tri thức hiện đại xuyên không về cổ đại, từng bước xây dựng thế lực...',
    coverUrl: 'https://images.unsplash.com/photo-1507842217343-583f20270319?w=300&h=450&fit=crop',
    status: NovelStatus.APPROVED,
    tags: ['Tiên Hiệp', 'Huyền Huyễn'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    chapters: [
      {
        id: 'ch-1',
        novelId: 'novel-1',
        title: 'Chương 1: Khởi đầu',
        content: 'Trời trong xanh, mây trắng bay. Tại một ngôi làng nhỏ nằm dưới chân núi Thanh Vân, có một thiếu niên đang ngồi trầm tư bên bờ suối. Hắn tên là Lâm Phong, vốn không phải người của thế giới này...\n\n"Đã ba năm rồi," Lâm Phong thở dài, ném một hòn đá xuống nước làm bắn lên những gợn sóng lăn tăn. Ba năm trước, hắn chỉ là một sinh viên đại học bình thường, sau một giấc ngủ trưa liền thấy mình tỉnh dậy trong thân xác này.',
        order: 1,
        readCount: 1500,
        likeCount: 120,
        comments: [],
        publishedAt: Date.now()
      },
       {
        id: 'ch-2',
        novelId: 'novel-1',
        title: 'Chương 2: Thử thách đầu tiên',
        content: 'Lâm Phong đứng dậy, phủi bụi trên quần áo. Hôm nay là ngày Thiên Kiếm Môn tuyển chọn đệ tử ngoại môn. Hắn đã chuẩn bị cho ngày này từ rất lâu rồi.\n\nĐám đông tụ tập trước cổng sơn môn đông nghịt người. Ai nấy đều mang theo vẻ mặt háo hức xen lẫn lo âu.',
        order: 2,
        readCount: 1100,
        likeCount: 80,
        comments: [],
        publishedAt: Date.now()
      }
    ]
  },
  {
    id: 'novel-2',
    authorId: 'author-2',
    authorName: 'Mộng Mơ',
    title: 'Chuyện Tình Mùa Hạ',
    description: 'Câu chuyện tình yêu nhẹ nhàng chốn học đường giữa những cơn mưa rào mùa hạ.',
    coverUrl: 'https://images.unsplash.com/photo-1517040997480-5a6b0dfc8adc?w=300&h=450&fit=crop',
    status: NovelStatus.APPROVED,
    tags: ['Ngôn Tình', 'Học Đường'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    chapters: []
  }
];

// Utility Service
export const mockService = {
  // Helper to generate avatars for UI
  getRandomAvatars: () => [
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1502685176493-4ee32cb4c31e?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
  ],

  calculateTotalReads: (novel: Novel): number => {
    if (!novel.chapters) return 0;
    return novel.chapters.reduce((sum, ch) => sum + ch.readCount, 0);
  },

  calculateTotalLikes: (novel: Novel): number => {
    if (!novel.chapters) return 0;
    return novel.chapters.reduce((sum, ch) => sum + ch.likeCount, 0);
  },

  formatNumber: (num: number): string => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }
};