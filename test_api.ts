import axios from 'axios';
async function test() {
  const res = await axios.get('https://api.muftyat.kz/prayer-times/2026/51.133333/71.433333');
  console.log(JSON.stringify(res.data).substring(0, 1000));
}
test();
