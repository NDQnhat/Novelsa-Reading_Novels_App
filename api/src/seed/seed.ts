import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db';
import User from '../models/User';
import Novel from '../models/Novel';
import { IUser, INovel } from '../types/index';

const sampleUsers: IUser[] = [
  {
    id: 'user-admin-001',
    email: 'admin@example.com',
    password: 'admin123', // TODO: Hash in production
    name: 'Admin User',
    avatarUrl: 'https://picsum.photos/100/100?random=1',
    role: 'ADMIN',
    library: [],
    downloadedChapters: [],
  },
  {
    id: 'user-001',
    email: 'user1@example.com',
    password: 'user123',
    name: 'Nguyễn Văn A',
    avatarUrl: 'https://picsum.photos/100/100?random=2',
    role: 'USER',
    library: ['novel-001'],
    downloadedChapters: [],
  },
  {
    id: 'user-002',
    email: 'user2@example.com',
    password: 'user456',
    name: 'Trần Thị B',
    avatarUrl: 'https://picsum.photos/100/100?random=3',
    role: 'USER',
    library: ['novel-001', 'novel-002'],
    downloadedChapters: ['ch-001', 'ch-002'],
  },
];

const sampleNovels: INovel[] = [
  {
    id: 'novel-001',
    authorId: 'author-001',
    authorName: 'Lão Trư',
    title: 'Huyền Thoại Bắt Đầu',
    description:
      'Một câu chuyện giả tưởng về hành trình trở thành huyền thoại của một thiếu niên bình thường trong thế giới tu tiên đầy khắc nghiệt. Hắn mang theo tri thức hiện đại xuyên không về cổ đại, từng bước xây dựng thế lực...',
    coverUrl: 'https://picsum.photos/300/450?random=101',
    status: 'APPROVED',
    tags: ['Tiên Hiệp', 'Huyền Huyễn', 'Xuyên Không'],
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now(),
    chapters: [
      {
        id: 'ch-001',
        novelId: 'novel-001',
        title: 'Chương 1: Khởi đầu',
        content:
          'Trời trong xanh, mây trắng bay. Tại một ngôi làng nhỏ nằm dưới chân núi Thanh Vân, có một thiếu niên đang ngồi trầm tư bên bờ suối. Hắn tên là Lâm Phong, vốn không phải người của thế giới này...',
        order: 1,
        readCount: 1500,
        likeCount: 120,
        comments: [
          {
            id: 'cmt-001',
            userId: 'user-001',
            userName: 'Nguyễn Văn A',
            userAvatar: 'https://picsum.photos/100/100?random=2',
            content: 'Truyện hay quá!',
            timestamp: Date.now() - 3600000,
          },
        ],
        publishedAt: Date.now() - 86400000 * 30,
      },
      {
        id: 'ch-002',
        novelId: 'novel-001',
        title: 'Chương 2: Thử thách đầu tiên',
        content:
          'Lâm Phong đứng dậy, phủi bụi trên quần áo. Hôm nay là ngày Thiên Kiếm Môn tuyển chọn đệ tử ngoại môn. Hắn đã chuẩn bị cho ngày này từ rất lâu rồi...',
        order: 2,
        readCount: 1100,
        likeCount: 80,
        comments: [],
        publishedAt: Date.now() - 86400000 * 29,
      },
    ],
  },
  {
    id: 'novel-002',
    authorId: 'author-002',
    authorName: 'Mạnh Tước',
    title: 'Luyện Kiếm Thành Thần',
    description:
      'Một câu chuyện về một thiếu niên yếu ớt luyện tập kỹ năng kiếm pháp và trở thành một vị thần. Anh ta phải vượt qua nhiều thử thách và khắc phục những cảm xúc tiêu cực...',
    coverUrl: 'https://picsum.photos/300/450?random=102',
    status: 'APPROVED',
    tags: ['Tiên Hiệp', 'Võ Thuật', 'Hành Động'],
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 86400000 * 5,
    chapters: [
      {
        id: 'ch-003',
        novelId: 'novel-002',
        title: 'Chương 1: Con đường kiếm pháp',
        content:
          'Trong một thế giới nơi mạnh là quyền lực tối cao, Vương Hỗ bắt đầu cuộc hành trình luyện tập từ con số không...',
        order: 1,
        readCount: 950,
        likeCount: 75,
        comments: [],
        publishedAt: Date.now() - 86400000 * 20,
      },
    ],
  },
  {
    id: 'novel-003',
    authorId: 'author-003',
    authorName: 'Hương Sen',
    title: 'Phàm Nhân Tu Tiên',
    description:
      'Câu chuyện về một chàng trai bình thường bước vào thế giới tu tiên. Bằng sự kiên trì và thông minh, anh ta dần dần vươn lên trở thành một cao thủ...',
    coverUrl: 'https://picsum.photos/300/450?random=103',
    status: 'PENDING',
    tags: ['Tiên Hiệp', 'Tâm Lý', 'Phiêu Lưu'],
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 2,
    chapters: [
      {
        id: 'ch-004',
        novelId: 'novel-003',
        title: 'Chương 1: Vào thế gian tu tiên',
        content:
          'Tôi đã không bao giờ tưởng tượng rằng một ngày nào đó tôi sẽ được bước vào một thế giới kỳ diệu như thế...',
        order: 1,
        readCount: 500,
        likeCount: 40,
        comments: [],
        publishedAt: Date.now() - 86400000 * 10,
      },
    ],
  },
]; 

const seedDatabase = async (): Promise<void> => {
  try {
    await connectDB();
    console.log('Connected to database');

    // Clear existing data
    await User.deleteMany({});
    await Novel.deleteMany({});
    console.log('Cleared existing data');

    // Insert sample users
    const insertedUsers = await User.insertMany(sampleUsers);
    console.log(`✓ Inserted ${insertedUsers.length} users`);

    // Insert sample novels
    const insertedNovels = await Novel.insertMany(sampleNovels);
    console.log(`✓ Inserted ${insertedNovels.length} novels`);

    console.log('\n✓ Database seeding completed successfully!\n');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error seeding database:', errorMessage);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
};

seedDatabase();
