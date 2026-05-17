const fs = require('fs');

const files = [
  'src/screens/stats/components/PrayerAreaChart.tsx',
  'src/screens/stats/components/PrayerBarChart.tsx',
  'src/screens/stats/components/PrayerDonutChart.tsx',
  'src/screens/stats/components/PrayerLineChart.tsx',
  'src/screens/stats/components/PrayerPieChart.tsx',
  'src/screens/stats/components/PrayerRadarChart.tsx',
  'src/screens/stats/components/PrayerRadarChart2.tsx',
  'src/screens/stats/components/PrayerStackedBarChart.tsx',
  'src/screens/stats/components/StatisticsChartsTab.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // We already replaced ./ui/chart and ./ui/tabs to ../../../components/ui/... 
    // Now replacing any remaining ./ui/ (e.g. ./ui/card) -> ../../../components/ui/
    // To avoid replacing things twice, we can just replace default exact match
    content = content.replace(/\.\/ui\/card/g, '../../../components/ui/card');
    fs.writeFileSync(file, content);
  }
}
console.log('Fixed ui card imports.');
