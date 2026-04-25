import { fetchChapterVerses } from './quranApi';
fetchChapterVerses(2).then(v => console.log('Al Baqarah verses count:', v.length)).catch(console.error);
