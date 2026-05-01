import axios from "axios";

async function run() {
  try {
    const res = await axios.get('http://localhost:3000/api/prayer-times?year=2026&lat=43.238949&lng=76.889709');
    console.log("Success:", JSON.stringify(res.data).substring(0, 1000));
  } catch (e: any) {
    console.log("Error:", e.response?.status, e.response?.data);
  }
}
run();
