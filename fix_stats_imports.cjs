const fs = require('fs');

// Fix StatsScreen.tsx
let statsContent = fs.readFileSync('src/screens/stats/StatsScreen.tsx', 'utf8');
statsContent = statsContent.replace(/\.\.\/components\/StatisticsChartsTab/g, './components/StatisticsChartsTab');
statsContent = statsContent.replace(/\.\.\/context\/ThemeContext/g, '../../context/ThemeContext');
statsContent = statsContent.replace(/\.\.\/context\/AuthContext/g, '../../context/AuthContext');
statsContent = statsContent.replace(/\.\.\/lib\/firebase/g, '../../lib/firebase');
statsContent = statsContent.replace(/\.\.\/components\//g, '../../components/'); // e.g. for ../components/namaz-block
fs.writeFileSync('src/screens/stats/StatsScreen.tsx', statsContent);

// Fix StatisticsChartsTab.tsx
let tabContent = fs.readFileSync('src/screens/stats/components/StatisticsChartsTab.tsx', 'utf8');
tabContent = tabContent.replace(/\.\/ui\/tabs/g, '../../../components/ui/tabs');
tabContent = tabContent.replace(/\.\.\/lib\/utils/g, '../../../lib/utils');
tabContent = tabContent.replace(/\.\.\/\.\.\/components\//g, '../../../components/'); // Just in case
fs.writeFileSync('src/screens/stats/components/StatisticsChartsTab.tsx', tabContent);

console.log("Fixed imports in Stats folders");
