import fetch from 'node-fetch';

const terms = [
  "schlager", 
  "neue deutsche welle", 
  "deutschpop", 
  "deutschrock", 
  "deutscher hiphop", 
  "deutscher rap", 
  "ballermann", 
  "partyhits"
];

async function testTerms() {
  for (const term of terms) {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&limit=50`;
    try {
      const resp = await fetch(url);
      const data = await resp.json();
      console.log(`${term.padEnd(20)}: ${data.resultCount} results`);
    } catch (e) {
      console.log(`${term.padEnd(20)}: Error`);
    }
  }
}
testTerms();
