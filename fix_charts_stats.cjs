const fs = require('fs');

let content = fs.readFileSync('src/screens/StatsScreen.tsx', 'utf8');

// 1. Add imports at the top if they don't exist
const imports = `import { PrayerDonutChart } from "../components/PrayerDonutChart";
import { PrayerPieChart } from "../components/PrayerPieChart";
import { PrayerBarChart as GithubPrayerBarChart } from "../components/PrayerBarChart";
import { PrayerLineChart as GithubPrayerLineChart } from "../components/PrayerLineChart";
import { PrayerAreaChart as GithubPrayerAreaChart } from "../components/PrayerAreaChart";
import { PrayerRadarChart as GithubPrayerRadarChart } from "../components/PrayerRadarChart";\n`;

if (!content.includes('PrayerDonutChart')) {
  // Let's find "import { format, subDays }" and replace
  content = content.replace(/import \{ format, subDays \} from "date-fns";/g, imports + 'import { format, subDays } from "date-fns";');
}

// 2. Add Status Filter near activeSegment === "stats"
// We need to inject a ScrollView or view for status filters. 
// It's after: <Text style={[styles.chartTitle, { color: isDark ? "#fff" : "#1c1c1e" }]}> Намаз оқу активтілігі </Text>
const filterInjection = `
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10, marginBottom: 10, paddingHorizontal: 16 }}>
                {[
                  { id: "all", title: "Барлығы" },
                  { id: "jamaat", title: "Жамағат", color: "#10b981" },
                  { id: "on_time", title: "Жалғыз", color: "#3b82f6" },
                  { id: "late", title: "Кешіктіру", color: "#ef4444" },
                  { id: "qaza", title: "Қаза", color: "#8e8e93" },
                ].map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => setStatsStatus(s.id)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: statsStatus === s.id ? (s.color || (isDark ? "#fff" : "#000")) : (isDark ? "#2c2c2e" : "#f1f1f6"),
                      marginRight: 8,
                      borderWidth: 1,
                      borderColor: statsStatus === s.id ? "transparent" : (s.color || "transparent")
                    }}
                  >
                    <Text style={{ 
                      color: statsStatus === s.id ? (isDark && s.id==="all" ? "#000" : "#fff") : (isDark ? "#fff" : "#000"),
                      fontWeight: statsStatus === s.id ? "600" : "400"
                    }}>
                      {s.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
`;

if (!content.includes('id: "jamaat", title: "Жамағат"')) {
   content = content.replace(
      'Намаз оқу активтілігі\n              </Text>',
      'Намаз оқу активтілігі\n              </Text>' + filterInjection
   );
}


// Replace native charts with web charts inside <View style={[styles.chartCard]}>
// The web charts block
const newCharts = `
              <View style={{ flex: 1, minHeight: 400, marginTop: 16, paddingHorizontal: 16 }}>
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
              </View>
            </View>
`;

content = content.replace(/\{activeChart === "pie" && \([\s\S]*?<\/View>\s*<\/View>\s*<\/View>/g, newCharts);

fs.writeFileSync('src/screens/StatsScreen.tsx', content);
console.log("Replaced native charts with github web charts");
