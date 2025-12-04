import { useState } from 'react';
import { Novel, NovelStatus } from '../types';

export function useNovelFilters(novels: Novel[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'relevance' | 'popular' | 'updated'>('relevance');

  const getFilteredNovels = (novelList: Novel[]) => {
    let filtered = novelList.filter((n) => n.status === NovelStatus.APPROVED);

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.description.toLowerCase().includes(query) ||
          n.authorName.toLowerCase().includes(query)
      );
    }

    // Genre filter
    if (selectedGenres.length > 0) {
      filtered = filtered.filter((n) =>
        selectedGenres.some((genre) => n.tags.includes(genre))
      );
    }

    // Sort
    if (sortBy === 'updated') {
      filtered.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }

    return filtered;
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedGenres,
    setSelectedGenres,
    sortBy,
    setSortBy,
    getFilteredNovels,
  };
}
