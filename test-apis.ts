async function testAladhan() {
  const url = `https://api.aladhan.com/v1/calendar/2026/4?latitude=51.133333&longitude=71.433333&method=2`;
  try {
    const res = await fetch(url);
    console.log("Aladhan ok:", res.ok);
  } catch (e) {
    console.error("Aladhan error:", e);
  }
}

async function testMuftyat() {
  const url = `https://api.muftyat.kz/prayer-times/2026/51.133333/71.433333`;
  try {
    const res = await fetch(url);
    console.log("Muftyat ok:", res.ok);
  } catch (e) {
    console.error("Muftyat error:", e);
  }
}

testAladhan();
testMuftyat();
