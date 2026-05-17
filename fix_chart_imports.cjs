const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/screens/stats/components/*.tsx');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\.\.\/lib\/prayerIcons/g, '../../../lib/prayerIcons');
  fs.writeFileSync(file, content);
}
console.log('Fixed prayerIcons imports.');
