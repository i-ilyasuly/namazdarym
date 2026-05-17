const fs = require('fs');
const path = require('path');

let content = fs.readFileSync('./src/components/StatisticsChartsTab.tsx', 'utf8');

// Replace relative imports
content = content.replace(/\.\.\/ui\/tabs/g, './ui/tabs');
content = content.replace(/\.\.\/\.\.\/lib\/utils/g, '../lib/utils');
content = content.replace(/\.\.\/LoadingScreen/g, './LoadingScreen'); // Actually we might not need loadigscreen, or we can replace it with our ActivityIndicator
content = content.replace(/\.\.\/Prayer/g, './Prayer');

// Replace LoadingScreen reference
content = content.replace(/<LoadingScreen fullScreen=\{false\} message=\{t\("loading"\)\} \/>/g, '<div className="flex justify-center p-8"><p>Жүктелуде...</p></div>');

fs.writeFileSync('./src/components/StatisticsChartsTab.tsx', content);
console.log("Done modifying StatisticsChartsTab");
