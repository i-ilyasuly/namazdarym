const fs = require('fs');

const files = [
  'src/screens/stats/components/PrayerAreaChart.tsx',
  'src/screens/stats/components/PrayerBarChart.tsx',
  'src/screens/stats/components/PrayerDonutChart.tsx',
  'src/screens/stats/components/PrayerLineChart.tsx',
  'src/screens/stats/components/PrayerPieChart.tsx',
  'src/screens/stats/components/PrayerRadarChart.tsx',
  'src/screens/stats/components/PrayerRadarChart2.tsx',
  'src/screens/stats/components/PrayerStackedBarChart.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\.\/ui\/chart/g, '../../../components/ui/chart');
    fs.writeFileSync(file, content);
  }
}
console.log('Fixed ui chart imports.');
