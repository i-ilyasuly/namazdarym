const fs = require('fs');

let content = fs.readFileSync('src/screens/StatsScreen.tsx', 'utf8');

// 1. Remove the existing status filter logic from chartCard
const oldFilterRegex = /<ScrollView horizontal showsHorizontalScrollIndicator=\{false\} style=\{\{ marginTop: 10, marginBottom: 10, paddingHorizontal: 16 \}\}>\s*\{\[\s*\{ id: "all", title: "Барлығы", icon: Layers \},[\s\S]*?<\/ScrollView>/;

content = content.replace(oldFilterRegex, "");

// 2. Insert the new status filter after the Period Selection
const periodEndRegex = /<\/TouchableOpacity>\s*\)\)\}\s*<\/View>\s*<\/ScrollView>\s*<\/View>\s*<\/>/;

const newFilterCode = `</TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Status Selection */}
          <View style={styles.periodContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.periodScroll}
            >
              <View
                style={[
                  styles.periodBackground,
                  { backgroundColor: isDark ? "#2c2c2e" : "#f1f1f6" },
                ]}
              >
                {[
                  { id: "all", title: "Барлығы", color: "#1c1c1e", icon: Layers },
                  { id: "jamaat", title: "Жамағат", color: "#10b981", icon: Users },
                  { id: "on_time", title: "Жалғыз", color: "#3b82f6", icon: User },
                  { id: "late", title: "Кешіктіру", color: "#ef4444", icon: Clock },
                  { id: "qaza", title: "Қаза", color: "#8e8e93", icon: XCircle },
                ].map((s) => {
                  const IconComp = s.icon;
                  const isActive = statsStatus === s.id;
                  let activeBg = s.color;
                  if (s.id === "all") {
                     activeBg = isDark ? "#fff" : "#1c1c1e";
                  }
                  
                  let iconColor = isActive ? (s.id === "all" ? (isDark ? "#000" : "#fff") : "#fff") : s.color;
                  if (s.id === "all" && !isActive) {
                    iconColor = isDark ? "#8e8e93" : "#8e8e93";
                  }

                  let textColor = isActive ? (s.id === "all" ? (isDark ? "#000" : "#fff") : "#fff") : (isDark ? "#fff" : "#1c1c1e");

                  return (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.periodBtn,
                      { flexDirection: "row", gap: 6 },
                      isActive && { backgroundColor: activeBg, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
                    ]}
                    onPress={() => setStatsStatus(s.id)}
                    activeOpacity={0.8}
                  >
                    <IconComp size={14} color={iconColor} strokeWidth={2.5} />
                    <Text
                      style={[
                        styles.periodText,
                        isActive && { color: textColor, fontWeight: "600" },
                        !isActive && isDark && { color: "#fff" },
                        !isActive && !isDark && { color: "#1c1c1e" },
                        { fontSize: 13 }
                      ]}
                    >
                      {s.title}
                    </Text>
                  </TouchableOpacity>
                )})}
              </View>
            </ScrollView>
          </View>
        </>`;

content = content.replace(periodEndRegex, newFilterCode);

fs.writeFileSync('src/screens/StatsScreen.tsx', content);
console.log("Status filter updated.");
