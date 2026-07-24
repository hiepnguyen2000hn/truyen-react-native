export interface Genre {
  id: string;
  name: string;
  color: string;
}

export interface Story {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  description: string;
  genres: Genre[];
  totalChapters: number;
  viewCount: number;
  rating: number;
  status: "ongoing" | "completed";
  updatedAt: string;
}

export interface Chapter {
  id: string;
  storyId: string;
  number: number;
  title: string;
  content: string;
  wordCount: number;
  publishedAt: string;
}
