import axios from 'axios';

const BASE_URL = 'https://api.quran.com/api/v4';

export interface Chapter {
  id: number;
  revelation_place: string;
  revelation_order: number;
  bismillah_pre: boolean;
  name_simple: string;
  name_complex: string;
  name_arabic: string;
  verses_count: number;
  pages: number[];
  translated_name: {
    language_name: string;
    name: string;
  };
}

export const getChapters = async (language = 'kk'): Promise<Chapter[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/chapters`, {
      params: { language }
    });
    return response.data.chapters;
  } catch (error) {
    console.error('Error fetching chapters:', error);
    // Fallback to en if kk fails
    if (language !== 'en') {
      return getChapters('en');
    }
    return [];
  }
};

export const getChapterDetails = async (id: number): Promise<Chapter | null> => {
  try {
    const response = await axios.get(`${BASE_URL}/chapters/${id}`, {
      params: { language: 'kk' }
    });
    return response.data.chapter;
  } catch (error) {
    console.error(`Error fetching chapter ${id}:`, error);
    return null;
  }
};

export const getMushafPageUrl = (pageNumber: number): string => {
  const padded = String(pageNumber).padStart(3, '0');
  // Using a stable GitHub repository that hosts the Madani mushaf pages
  return `https://raw.githubusercontent.com/hifdziapp/mushaf/main/madani/width_1260/page${padded}.png`;
};

export const MUSHAF_TOTAL_PAGES = 604;
