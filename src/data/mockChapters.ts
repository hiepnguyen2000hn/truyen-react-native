import { Chapter } from "../types/story";

const CHAPTER_CONTENT = `Tiêu Viêm bước vào phòng thi đấu, ánh mắt lạnh lùng quét qua những kẻ địch.

Anh ta hiểu rõ hơn ai hết rằng trong thế giới này, sức mạnh là tất cả. Không có sức mạnh, ngay cả tình thân cũng trở nên mỏng manh như giấy.

"Tiêu Viêm, ngươi dám đến đây?" Một giọng nói khinh thường vang lên từ phía trước.

Tiêu Viêm không vội vàng, môi khẽ cong lên một nụ cười lạnh. Hắn đã chờ đợi khoảnh khắc này quá lâu rồi.

Đấu khí bùng phát từ cơ thể hắn, màu vàng rực rỡ bao phủ toàn thân. Cấp bậc Đại Đấu Sư — một bước tiến vượt bậc chỉ trong một năm.

"Hôm nay, ta sẽ chứng minh cho tất cả thấy. Thiên tài không phải là bẩm sinh — mà là được rèn giũa qua thử thách."

Hắn giơ tay, một luồng đấu khí mạnh mẽ xoáy tròn trong lòng bàn tay. Đối thủ trước mặt chần chừ một chút, lùi lại vài bước.

Cuộc chiến bắt đầu.`;

export function getMockChapters(storyId: string): Chapter[] {
  return Array.from({ length: 50 }, (_, i) => ({
    id: `${storyId}-chapter-${i + 1}`,
    storyId,
    number: i + 1,
    title: `Chương ${i + 1}: ${getChapterTitle(i + 1)}`,
    content: CHAPTER_CONTENT.repeat(3) + `\n\n[Chương ${i + 1} của truyện ${storyId}]`,
    wordCount: 1200 + Math.floor(Math.random() * 800),
    publishedAt: new Date(Date.now() - (50 - i) * 86400000).toISOString(),
  }));
}

function getChapterTitle(n: number): string {
  const titles = [
    "Khởi Đầu Mới", "Thử Thách", "Sức Mạnh Tiềm Ẩn", "Bước Đột Phá",
    "Kẻ Thù Cũ", "Cơ Duyên Kỳ Ngộ", "Trận Đấu Quyết Định", "Thăng Cấp",
    "Bí Mật Phong Ấn", "Hành Trình Mới",
  ];
  return titles[(n - 1) % titles.length];
}
