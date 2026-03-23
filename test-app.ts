import { fetchSongs } from './src/services/api';

async function testApp() {
  console.log("Running fetch...");
  try {
    const songs = await fetchSongs(10, ['pop']);
    console.log("Got songs:", songs.length);
    if(songs.length > 0) {
      console.log(songs[0]);
    }
  } catch (err) {
    console.error("Test failed:", err);
  }
}
testApp();
