export const API_BASE = 'https://api.quran.com/api/v4';
export const AUDIO_BASE = 'https://verses.quran.com/';

export interface VerseItem {
  id: number;
  verse_key: string;
  number: number;
  text_uthmani: string;
  audio_url: string | null;
}

export async function fetchChapterVerses(chapter: number): Promise<VerseItem[]> {
  try {
    const versesRes = await fetch(`/api/quran/verses?chapter=${chapter}`);
    const versesData = await versesRes.json();
    
    let allVerses = versesData.verses || [];
    
    // Audio files
    const audioRes = await fetch(`/api/quran/audio?chapter=${chapter}`);
    const audioData = await audioRes.json();
    const audioMap = new Map();
    audioData.audio_files?.forEach((a: any) => {
      audioMap.set(a.verse_key, a.url);
    });

    return allVerses.map((v: any, i: number) => ({
      id: v.id,
      verse_key: v.verse_key,
      number: i + 1, // simplified verse number
      text_uthmani: v.text_uthmani,
      audio_url: audioMap.get(v.verse_key) ? `${AUDIO_BASE}${audioMap.get(v.verse_key)}` : null
    }));
  } catch (err) {
    console.error("Failed to fetch chapter", chapter, err);
    return [];
  }
}
