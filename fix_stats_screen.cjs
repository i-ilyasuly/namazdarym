const fs = require('fs');

let content = fs.readFileSync('src/screens/StatsScreen.tsx', 'utf8');

// 1. Add imports at the top
const imports = `import { PrayerDonutChart } from "../components/PrayerDonutChart";
import { PrayerPieChart } from "../components/PrayerPieChart";
import { PrayerBarChart as GithubPrayerBarChart } from "../components/PrayerBarChart";
import { PrayerLineChart as GithubPrayerLineChart } from "../components/PrayerLineChart";
import { PrayerAreaChart as GithubPrayerAreaChart } from "../components/PrayerAreaChart";
import { PrayerRadarChart as GithubPrayerRadarChart } from "../components/PrayerRadarChart";\n`;

content = content.replace("import { format, subDays } from \"date-fns\";", imports + "import { format, subDays } from \"date-fns\";");

// 2. Replace the old Custom charts rendering with the GitHub ones
const targetRender = `{activeChart === "pie" && (
                <PieChartWithPaddingAngle
                  isAnimationActive={isAnimActive}
                  data={currentChartData}
                />
              )}
              {activeChart === "radar" && (
                <PrayerRadarChart
                  isAnimationActive={isAnimActive}
                  data={currentRadarData}
                />
              )}
              {activeChart === "line" && (
                <PrayerLineChart
                  isAnimationActive={isAnimActive}
                  data={currentLineData}
                />
              )}
              {activeChart === "area" && (
                <PrayerAreaChart
                  isAnimationActive={isAnimActive}
                  data={currentLineData}
                />
              )}
              {activeChart === "bar" && (
                <PrayerBarChart
                  isAnimationActive={isAnimActive}
                  data={barData}
                />
              )}`;

const replacementRender = `<View style={{ flex: 1, minHeight: 400, marginTop: 16 }}>
                {Platform.OS === 'web' ? (
                  <>
                    {activeChart === "pie" && <PrayerDonutChart data={getNewStatsData()} gender={(user as any)?.gender || "male"} />}
                    {activeChart === "radar" && <GithubPrayerRadarChart data={getNewStatsData()} />}
                    {activeChart === "line" && <GithubPrayerLineChart data={getNewStatsData()} />}
                    {activeChart === "area" && <GithubPrayerAreaChart data={getNewStatsData()} />}
                    {activeChart === "bar" && <GithubPrayerBarChart data={getNewStatsData()} />}
                  </>
                ) : (
                  <Text style={{textAlign: "center", marginTop: 20, color: isDark ? "#fff" : "#000"}}>Толық статистика тек веб нұсқада қолжетімді.</Text>
                )}
              </View>`;

content = content.replace(targetRender, replacementRender);

// 3. Fix labels
// We will replace "Зертхана" with "__temp__", "Статистика" with "Зертхана", then "__temp__" with "Статистика".
// BUT ONLY the ones inside the exact bottom segment buttons near "activeSegment ==="
content = content.replace(`              >
                Зертхана
              </Text>`, `              >
                Статистика
              </Text>`);

content = content.replace(`              >
                Статистика
              </Text>`, `              >
                Зертхана
              </Text>`);

fs.writeFileSync('src/screens/StatsScreen.tsx', content);
console.log("Done fixing StatsScreen!");
