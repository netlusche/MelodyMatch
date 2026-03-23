import fetch from 'node-fetch';
const term = "pop";
const limit = 5;
fetch(`http://localhost:5173/api/itunes/search?term=${encodeURIComponent(term)}&media=music&limit=${limit}`)
  .then(r => r.json())
  .then(d => {
     console.log("Success! Results: " + d.results.length);
  })
  .catch(e => console.log("Error: " + e.message));
