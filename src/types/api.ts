export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface StoriesQuery {
  page?: number;
  limit?: number;
  genreSlug?: string;
  status?: "ongoing" | "completed";
  search?: string;
  sortBy?: "updated_at" | "view_count" | "rating" | "created_at";
}

export interface ChaptersQuery {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
}
