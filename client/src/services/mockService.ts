import { Novel, NovelStatus, User, UserRole } from '../types';

export const MOCK_USER: User = {
  id: 'user-1',
  email: 'user@example.com',
  password: 'password',
  name: 'Người Dùng Mẫu',
  avatarUrl: 'https://picsum.photos/100/100?random=99',
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
    coverUrl: 'https://picsum.photos/300/450?random=101',
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
    coverUrl: 'https://picsum.photos/300/450?random=102',
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
    'https://picsum.photos/100/100?random=10',
    'https://picsum.photos/100/100?random=11',
    'https://picsum.photos/100/100?random=12',
    'https://picsum.photos/100/100?random=13',
    'https://picsum.photos/100/100?random=14',
    'https://picsum.photos/100/100?random=15',
    'https://picsum.photos/100/100?random=16',
    'https://picsum.photos/100/100?random=17',
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