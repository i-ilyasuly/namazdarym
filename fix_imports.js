const fs = require('fs');
const glob = require('glob'); // Or just read sync if few files
const path = require('path');

const dir = './src/components';
const files = fs.readdirSync(dir).filter(f => f.startsWith('Prayer') && f.endsWith('.tsx'));

const translationMock = `
const t = (key: string, options?: any) => {
  const dict: any = {
    "status_missed": "Қаза",
    "status_delayed": "Уақытынан кеш",
    "status_menstruation": "Үзіліс",
    "status_congregation": "Жамағатпен",
    "status_prayed": "Орындалды",
    "total_performed": "Орындалғаны"
  };
  return dict[key] || (options && options.defaultValue) || key;
};
`;

for (const file of files) {
  const p = path.join(dir, file);
  let content = fs.readFileSync(p, 'utf8');
  
  // Remove import
  content = content.replace(/import \{ useTranslation \} from "react-i18next";?\n?/g, '');
  
  // Replace useTranslation hook inside the component
  content = content.replace(/const\s+\{\s*t\s*\}\s*=\s*useTranslation\(\);?\n?/g, translationMock);
  content = content.replace(/import \{.*?prayerIcons.*?\} from "\.\.\/lib\/prayerIcons";?/g, 'import { getPrayerTimeIcon } from "../lib/prayerIcons";');

  fs.writeFileSync(p, content);
}
console.log("Done modifying Prayer charts!");
