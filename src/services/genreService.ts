import { apiClient } from "../lib/apiClient";
import { Genre } from "../types/story";

export const genreService = {
  getGenres(): Promise<Genre[]> {
    return apiClient.get("/api/v1/genres");
  },
};
