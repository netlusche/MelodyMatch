# MelodyMatch API Manual

## Overview
MelodyMatch fetches music metadata and audio previews primarily utilizing the **Deezer API**. To ensure seamless compatibility and bypass CORS blocks directly in the browser (especially on iOS Safari), the application uses client-side **JSONP** requests (`output=jsonp`). 

To obtain original release years (rather than compilation release dates), the app performs an on-the-fly query to the **MusicBrainz API** as the primary source, and cascades to the **iTunes Search API** and **Deezer API** when a player starts their turn.

---

## 1. Initial Song Pool Fetch

When the user configures the game and clicks "Start Game", the required song pool size is calculated dynamically based on player count and rounds: `Math.max(100, state.players.length * state.totalRounds + 10)`. The application gathers the selected genres/decades and calls `fetchSongs(count, genres)`:

1. **Charts vs. Specific Genres/Decades**:
   - If **Charts** (key: `'all'`) is selected, it queries Deezer's global charts:
     `https://api.deezer.com/chart/0/tracks?limit=300`
   - Genre resolution follows a priority order: `all` → `GENRE_MAP` → `PLAYLIST_MAP` → text search fallback.

### GENRE_MAP

`GENRE_MAP` maps a genre key to a Deezer genre ID and queries the genre-specific chart endpoint:
`https://api.deezer.com/chart/{genreId}/tracks?limit=300`

| Genre | Deezer Genre ID | Notes |
|---|---|---|
| `hip-hop` | 116 | Hip-Hop charts are consistently genre-pure on Deezer |

**Why only one genre remains in GENRE_MAP:**

Deezer's genre charts reflect real-time streaming popularity within a broadly defined genre bucket. The categorization is driven by what labels submit to Deezer's catalog system — not by musical criteria. In practice this causes significant **genre pollution** or **artist over-concentration** for several genres:

- **Rock (152)**: Schlager and crossover pop tracks frequently appear in Deezer's Rock chart because labels file certain acts under "Rock" for chart purposes.
- **Pop (132)**: The chart is heavily skewed toward whatever is currently trending globally, with no historical depth — a pure top-40 feed rather than a representative Pop pool.
- **Electronic (106)**: Deezer's "Electro" bucket is very broad, mixing mainstream EDM, pop-EDM crossovers, and ambient in unpredictable proportions.
- **R&B (165)**: R&B/Soul/Pop crossover is common at the chart level; the pool lacks variety across eras.
- **Alternative (85)**: Deezer uses "Alternative" as a catch-all for anything that doesn't fit a primary genre — making it one of the least genre-coherent chart buckets.
- **Heavy Metal (464)**: Genre-pure, but heavily skewed toward a handful of currently-trending acts — a 300-track chart sample showed Electric Callboy, Bad Omens, and Rammstein alone accounting for ~23% of all tracks. Migrated to `PLAYLIST_MAP` for better artist balance (see Section 1 reference table).

For these six genres, switching to `PLAYLIST_MAP` with editorially curated playlists gives full control over song pool composition, historical coverage, genre purity, and artist balance. Hip-Hop was assessed as low-risk (its Deezer chart is relatively sortenrein and well-balanced) and kept in `GENRE_MAP` for simplicity.

### PLAYLIST_MAP

`PLAYLIST_MAP` maps a genre or decade key to one or more Deezer playlist IDs. All playlists for a genre are fetched in parallel using `Promise.all`:
`https://api.deezer.com/playlist/{playlistId}/tracks?limit=300`

   - **Parallel Fetching**: The tracklists for all mapped playlist IDs are fetched in parallel using `Promise.all` to optimize loading times:
     `https://api.deezer.com/playlist/{playlistId}/tracks?limit=300`

### PLAYLIST_MAP Reference

> **Key:** ✅ Official (Deezer editorial/curated) · ⚠️ Community (user-created, may disappear)
> 
> **Est. unique songs** assumes ~50% overlap between playlists within the same genre. Actual pool size depends on track availability at runtime.

#### 🎸 Rock (~600 unique songs, 13 playlists)
| ID | Title | Tracks | Type |
|---|---|---|---|
| 11242423484 | Rock Super Hits | ~100 | ✅ Deezer DE Editor |
| 752286631 | Rock Hits | ~65 | ✅ Deezer Rock Editor |
| 3126664682 | Rock Road Trip | ~80 | ✅ Deezer Rock Editor |
| 1419215845 | 2000s Rock | ~50 | ✅ Deezer Rock Editor |
| 1057779131 | 2010s Rock | ~50 | ✅ Deezer Rock Editor |
| 8621268482 | 80s Rock | ~50 | ✅ Deezer Rock Editor |
| 1728093421 | 90s Rock | ~50 | ✅ Deezer Rock Editor |
| 13693489781 | 2020s Rock | ~99 | ✅ Deezer Rock Editor |
| 11335739484 | Modern Rock Essentials | ~100 | ✅ Deezer Rock Editor |
| 761604441 | Hard Rock Essentials | ~50 | ✅ Deezer Rock Editor |
| 11801167321 | Rock Classics 60s–80s | ~300 | ⚠️ Community |
| 14512114763 | 2025 Rock | ~100 | ✅ Deezer Rock Editor |
| 2865616602 | Women of Rock | ~70 | ✅ Deezer Rock Editor |

> **Note on 2865616602 (Women of Rock):** Added to close a coverage gap for modern female-fronted hard rock acts (e.g. The Warning, Halestorm, Nova Twins, Laura Cox, YONAKA) that were underrepresented across the other Rock playlists.

#### 🎤 Pop (~500 unique songs, 10 playlists)
| ID | Title | Tracks | Type |
|---|---|---|---|
| 1036183001 | Pop Essentials | ~80 | ✅ Deezer Pop Editor |
| 8326097522 | 00s Pop | ~80 | ✅ Deezer Pop Editor |
| 8282573142 | 10s Pop | ~100 | ✅ Deezer Pop Editor |
| 1479458365 | Happy Hits | ~70 | ✅ Deezer Pop & Hits Editor |
| 2228601362 | Fresh Pop | ~80 | ✅ Deezer Pop & Hits Editor |
| 1282483245 | Pop All Stars | ~50 | ✅ Deezer Pop & Hits Editor |
| 4888783264 | Pop Rewind | ~80 | ✅ Deezer Pop Editor |
| 1977689462 | 00s Party Hits | ~80 | ✅ Deezer Pop Editor |
| 5311155022 | Top Hits 2012 | ~60 | ✅ Deezer Best Of |
| 5339620562 | Top Hits 2010 | ~60 | ✅ Deezer Best Of |

#### 🎛️ Electronic (~300 unique songs, 8 playlists)
| ID | Title | Tracks | Type |
|---|---|---|---|
| 3801761042 | Electronic Essentials | ~50 | ✅ Deezer Electronic Editor |
| 1902101402 | Electronic Hits | ~100 | ✅ Deezer Dance & EDM Editor |
| 4613753548 | Dance Essentials | ~80 | ✅ Deezer Dance & EDM Editor |
| 6237312204 | Dance Party Classics | ~70 | ✅ Deezer Dance & EDM Editor |
| 13577379741 | House Party Classics | ~50 | ✅ Deezer Dance & EDM Editor |
| 10578670022 | Techno Essentials | ~50 | ✅ Deezer Dance & EDM Editor |
| 8962764402 | Trip-Hop Essentials | ~70 | ✅ Deezer Electronic Editor |
| 14787069183 | 90er Electronic Essentials | ~98 | ✅ Deezer |

#### 🎷 R&B (~300 unique songs, 10 playlists)
| ID | Title | Tracks | Type |
|---|---|---|---|
| 1314725125 | R&B Essentials | ~52 | ✅ Deezer R&B Editor |
| 1999466402 | R&B Hits | ~50 | ✅ Deezer R&B Editor |
| 2021626162 | 2000s R&B | ~60 | ✅ Deezer R&B Editor |
| 3196481502 | Chill R&B | ~51 | ✅ Deezer R&B Editor |
| 4160013622 | Women of R&B | ~76 | ✅ Deezer R&B Editor |
| 5411628342 | 2010s R&B | ~50 | ✅ Deezer R&B Editor |
| 1699545511 | R&B Rewind | ~50 | ✅ Deezer R&B Editor |
| 5014738124 | 90s R&B | ~50 | ✅ Deezer R&B Editor |
| 8869955482 | Slow Jam Essentials | ~51 | ✅ Deezer R&B Editor |
| 3166040342 | RnB Classics | ~205 | ⚠️ Community |

#### 🌀 Alternative (~1100 unique songs, 11 playlists)
| ID | Title | Tracks | Type |
|---|---|---|---|
| 668126235 | Alternative Essentials | ~50 | ✅ Deezer Alternative Editor |
| 5337198442 | 90s Alternative | ~50 | ✅ Deezer Alternative Editor |
| 7966514882 | alt 50 | ~60 | ✅ Deezer Alternative Editor |
| 1126774471 | Alt Pop | ~100 | ✅ Deezer Alternative Editor |
| 1402845615 | New Alternative | ~150 | ✅ Deezer Alternative Editor |
| 760160361 | Indie Rock Now | ~80 | ✅ Deezer Alternative Editor |
| 8971696142 | Synth Pop Essentials | ~50 | ✅ Deezer Alternative Editor |
| 1306978785 | Hot New Rock | ~170 | ✅ Deezer Rock Editor |
| 127260811 | Alternative Attack | ~523 | ⚠️ Community |
| 13200273483 | 2024 Alternative | ~120 | ✅ Deezer Alternative Editor |
| 14401046561 | 2025 Alternative | ~120 | ✅ Deezer Alternative Editor |

#### 🤘 Heavy Metal (~713 unique songs, 10 playlists)
| ID | Title | Tracks | Type |
|---|---|---|---|
| 2655390504 | Metal Essentials | ~100 | ✅ Deezer Metal Editor |
| 2004964442 | 2000s Metal | ~50 | ✅ Deezer Metal Editor |
| 1045800791 | 2010s Metal | ~50 | ✅ Deezer Metal Editor |
| 13693525421 | 2020s Metal | ~98 | ✅ Deezer Metal Editor |
| 13238303063 | 2024 Metal | ~100 | ✅ Deezer Metal Editor |
| 14512132543 | 2025 Metal | ~100 | ✅ Deezer Metal Editor |
| 1376669717 | Metalcore | ~150 | ✅ Deezer Metal Editor |
| 1367442165 | Nu Metal Essentials | ~50 | ✅ Deezer Metal Editor |
| 1294679255 | 80s Metal | ~50 | ✅ Deezer Metal Editor |
| 1471284255 | 90s Metal | ~50 | ✅ Deezer Metal Editor |

> **Migrated from GENRE_MAP (live chart) on 2026-06-11:** The live Metal chart (genre ID 464) was heavily concentrated on a handful of trending acts (Electric Callboy, Bad Omens, Rammstein ≈ 23% of a 300-track sample). This curated combination reduces max artist share to ~1.4% while preserving strong coverage of modern acts (Sleep Token, Bad Omens, BABYMETAL, Knocked Loose, Jinjer, Deftones).
>
> **80s/90s additions:** Added specifically to boost NWOBHM/classic metal coverage (Iron Maiden, Judas Priest, Saxon, Motörhead, Dio, Megadeth, Anthrax) and 90s metal/groove metal (Pantera, Sepultura, Fear Factory, Type O Negative, Korn). Scorpions are intentionally not force-fitted here — Deezer classifies them under Hard Rock, and they already appear in the Rock pool (see above).

#### 🎵 Indie (~200 unique songs, 4 playlists)
| ID | Title | Tracks | Type |
|---|---|---|---|
| 9372936102 | The Indie Café | ~100 | ✅ Deezer Alternative Editor |
| 754725481 | crush <3 | ~varies | ✅ Deezer |
| 8716319082 | Indie Rock Essentials | ~50 | ✅ Deezer Alternative Editor |
| 10452440062 | Indie Rock Essentials (alt) | ~50 | ✅ Deezer |

#### 🎸 Classic Rock (~200 unique songs, 4 playlists)
| ID | Title | Tracks | Type |
|---|---|---|---|
| 6046721604 | Rock Klassiker | ~varies | ✅ Deezer DE Editor |
| 14233924321 | Classic Rock Greatest Hits 1 | ~varies | ✅ Deezer |
| 1306931615 | Rock Essentials | ~100 | ✅ Deezer Rock Editor |
| 1405240385 | 70s Rock | ~50 | ✅ Deezer Rock Editor |

#### 🌊 New Wave / Post-Punk (~200 unique songs, 5 playlists)
| ID | Title | Tracks | Type |
|---|---|---|---|
| 8515679522 | New Wave Essentials | ~50 | ✅ Deezer Alternative Editor |
| 8700369282 | Post-Punk Essentials | ~50 | ✅ Deezer Alternative Editor |
| 3291146382 | New Wave Classics | ~varies | ✅ Deezer |
| 10082108122 | New Wave – Dark Gothic Post-Punk | ~varies | ✅ Deezer |
| 4055216422 | 80s Oldschool Indie / New Wave | ~varies | ✅ Deezer |

#### 🦇 Goth (~465 unique songs, 5 playlists)
| ID | Title | Tracks | Type |
|---|---|---|---|
| 7615314822 | Essential Goth & Post-Punk | 75 | ⚠️ Community |
| 12920343183 | Gothic rock/Darkwave/Post-punk | 162 | ⚠️ Community |
| 1511408641 | Gothic Rock Top Tracks | 60 | ⚠️ Community |
| 13593501061 | Goth Essentials: Baby Bat Edition | 60 | ⚠️ Community |
| 6727724224 | Gothic Rock Playlist (Dark Wave/Post-Punk/Deathrock) | 197 | ⚠️ Community |

> **Note:** No official Deezer editorial playlists exist for Goth — all five are curated community playlists, hand-vetted for genre purity (sample-checked track lists) and strong coverage of core acts: The Cure, Joy Division, Siouxsie and The Banshees, Bauhaus, The Sisters of Mercy, Killing Joke, Christian Death.

#### 🎤 K-Pop (~347 unique songs, 6 playlists)
| ID | Title | Tracks | Type |
|---|---|---|---|
| 873660353 | K-Pop Essentials | ~80 | ✅ Deezer K-Pop Editor |
| 4096400722 | Top K-Pop | ~50 | ✅ Deezer K-Pop Editor |
| 12244134951 | Fresh K-Pop | ~70 | ✅ Deezer K-Pop Editor |
| 10738561582 | K-Pop 2nd Generation | ~70 | ✅ Deezer K-Pop Editor |
| 11012274682 | K-Pop 3rd Generation | ~70 | ✅ Deezer K-Pop Editor |
| 7483261404 | Women of K-Pop | ~51 | ✅ Deezer K-Pop Editor |

> **Note:** Deezer maintains a dedicated K-Pop Editor with full generational coverage. This combination spans 1st through 5th generation acts (BoA, S.E.S., Wonder Girls → BIGBANG, SHINee, TVXQ → BTS, BLACKPINK, TWICE, MAMAMOO → LE SSERAFIM, NewJeans, aespa → BABYMONSTER, RIIZE, CORTIS).

#### 🧐 Für Kenner / For Connoisseurs (~940 unique songs, 17 playlists)
| ID | Title | Tracks | Focus |
|---|---|---|---|
| 7875469222 | Classic Rock Deep Cuts | ~96 | Rolling Stones, Beatles, Led Zeppelin, Pink Floyd, Black Sabbath, Hendrix |
| 7981359362 | Hidden Gems of Rock | ~28 | Def Leppard, Rush, Journey, Toto, Springsteen |
| 7875539102 | Metal Deep Cuts | ~98 | TOOL, Slayer, Meshuggah, Anthrax, Cradle of Filth |
| 7875467342 | Classic Hip-Hop Deep Cuts | ~98 | JAY-Z, Nas, Outkast, Kanye, Wu-Tang, 2Pac, Dr. Dre |
| 7875544882 | New Wave Deep Cuts | ~98 | Duran Duran, Billy Idol, DEVO, Soft Cell, The Cars, ABC |
| 14663194001 | The Cure: Deep Cuts | ~33 | The Cure |
| 10751473082 | Depeche Mode Deep Cuts | ~64 | Depeche Mode |
| 12754566241 | Post-Punk Deep Cuts | ~98 | Joy Division, New Order, Siouxsie, Gang of Four, Echo & the Bunnymen, Talking Heads |
| 14482486843 | The Smiths singles and b-sides | ~48 | The Smiths |
| 12754554161 | New Order: Deep Cuts | ~20 | New Order |
| 12754478601 | David Bowie: Deep Cuts | ~25 | David Bowie |
| 12754594941 | U2: Deep Cuts | ~26 | U2 |
| 12754576441 | R.E.M.: Deep Cuts | ~30 | R.E.M. |
| 164030071 | Queen Deep Cuts I | ~15 | Queen |
| 8702537662 | Ultimate Prince Deep Cuts | ~83 | Prince |
| 11054623262 | Elton John: Deep Cuts | ~28 | Elton John |
| 15339520123 | Madonna: Deep Cuts | ~55 | Madonna |

> **Concept:** Unlike other genres, "Für Kenner" is not a musical style but a curation concept — deep cuts and lesser-known album tracks from extremely famous artists across Rock, Metal, Hip-Hop, New Wave, and Post-Punk. The goal is recognition of the artist paired with surprise at the unfamiliar song, distinct from the obvious singles/hits most players already know. All playlists were sample-checked for genuine "deep cut" quality (no major singles mixed in) except The Smiths' singles/b-sides compilation, which includes a few well-known tracks alongside genuine rarities. Fleetwood Mac was considered but no clean deep-cuts-only source was found on Deezer, so it was deliberately left out rather than diluting the concept with a single/deep-cut mix.

#### 🇩🇪 NDW (~200 unique songs, 7 playlists)
| ID | Title | Tracks | Type |
|---|---|---|---|
| 6758361584 | Neue Deutsche Welle | ~varies | ✅ Deezer |
| 1230675621 | NDW Hits | ~varies | ✅ Deezer |
| 2734068964 | Neue Deutsche Welle – NDW | ~varies | ✅ Deezer |
| 8937349862 | NDW – Neue Deutsche Welle | ~varies | ✅ Deezer |
| 1106363531 | ULTIMATE 80s NDW | ~varies | ⚠️ Community |
| 15022157843 | NDW SaMu | ~varies | ⚠️ Community |
| 15344382803 | 80er NDW | ~varies | ⚠️ Community |

#### 🎤 Schlager (~200 unique songs, 5 playlists)
| ID | Title | Tracks | Type |
|---|---|---|---|
| 8699026122 | Schlager Super Hits | ~varies | ✅ Deezer DE Editor |
| 2813303064 | Karneval Schlager Party | ~varies | ✅ Deezer |
| 1917690502 | Schlagerparty | ~varies | ✅ Deezer |
| 11354266504 | Schlager Sommer | ~varies | ✅ Deezer DE Editor |
| 12462638963 | Schlager Queens | ~varies | ✅ Deezer DE Editor |

#### 🎵 Deutschpop, Deutschrock, Deutscher Rap, Ballermann, Partyhits
| Genre | IDs | Type |
|---|---|---|
| Deutschpop | 11242422704, 10226082322, 8668716682 | ✅ Deezer DE |
| Deutschrock | 1956739222, 6030118144, 10396822102 | ✅ Deezer DE |
| Deutscher Rap | 10578289242, 146820791, 11533942424, 8871685602, 13378558903 | ✅ Deezer DE |
| Ballermann | 10328601542, 9486947662, 4789726188, 7712049342 | ✅ / ⚠️ mixed |
| Partyhits | 2097558104, 740966875, 11203091824, 8699026122, 1917690502, 10328601542 | ✅ / ⚠️ mixed |

#### 📅 Decades (all curated)
| Decade | IDs | Type |
|---|---|---|
| 50s | 735402575, 4020144442, 11031329462, 3954210902, 9010212882, 5958115324 | ✅ Deezer |
| 60s | 620264073, 1437011185, 8962730322, 14597757781, 8181759022, 3566625202, 11031329462 | ✅ Deezer |
| 70s | 1470022445, 8877326262, 5605928862, 57280214, 1319793647, 7130870324 | ✅ Deezer |
| 80s | 867825522, 1913763402, 11384036324, 6208592984, 8512471762, 8873745702, 8403360702 | ✅ Deezer |
| 90s | 878989033, 3829647662, 8873744282, 8403350722, 2322259622, 8311123682, 8027597282, 1283602355 | ✅ Deezer |
| 2000+ | 248297032, 1977689462, 8777319042, 8951600962, 715215865, 14917741483, 9100953002, 8074581462, 13650084141 | ✅ Deezer |

> **Note on 2000+ (updated):** Completely restructured for better sub-decade balance. Three community/mixed-decade playlists removed (2000s-2010s Party, "20s Hits" community, "Pop & Rock Hits 2020s–80s"). Replaced with 9 official Deezer editorial playlists split across three sub-decades: 00s (Hits, Party Hits, Ballads, Acoustic Hits), 10s (Party Hits, Hits, Ballads, Pop Rock), 20s (Hits). Previously the 2000–2009 era had only one playlist — now has four.

> **Note on 90s (updated):** Two playlists were removed — "Back to the 90 & 2000er" and "Année 1990 & 2000" — because they explicitly included 2000s tracks, causing post-2000 songs to appear when only 90s was selected. Replaced with four clean editorial playlists: 90s Party Hits, 90s Pop, 90s Pop Rock, Zeitreise 90er (all Deezer editors, decade-pure).

> **Note on community playlists:** If a community playlist is no longer available at runtime, the JSONP request returns an empty array and is silently skipped. The remaining playlists fill the pool. No error is shown to the user.

   - If no map matches, it falls back to a standard text search query:
     `https://api.deezer.com/search?q={term}&limit=300`
   - **Top Charts Fallback**: If the total count of deduplicated unique songs is less than the requested `count`, the app automatically queries Deezer's global top charts (`/chart/0/tracks?limit=300`) to fill the remaining slots.

2. **JSONP Fetcher (`fetchDeezerJsonp`)**:
   Deezer allows script-based callbacks by appending `output=jsonp&callback=...` to the URL. The app dynamically appends a `<script>` tag to the document, registers a unique window callback, and resolves the promise when the script executes, bypassing CORS.

3. **Title Sanitization (`cleanSongTitle`)**:
   Before placing songs in the pool, their titles are globally sanitized to strip out cluttering remastered, live, or version suffixes like `(Remastered)`, `(2001 Remaster)`, `[Live]`, or `(Rerecorded)`. This ensures that:
   - Clean titles are shown in the UI.
   - Clean titles are used to generate wrong answers in multiple-choice grids.
   - External queries are clean and match original releases.

4. **Deduplication & Shuffle**:
   Tracks are normalized to an alphanumeric title-artist key to discard duplicates (e.g. from overlapping genre charts). The remaining tracks are shuffled using an unbiased **Fisher-Yates shuffle** algorithm (`shuffleArray`) to ensure a completely uniform distribution, preventing any single selected genre from dominating the final sliced song pool (e.g., 100 songs).

5. **Audio Play (Hörspiel) Filtering**:
   German audio dramas (*Die drei ???*, *Bibi Blocksberg*, *TKKG*, *Benjamin Blümchen*, etc.) frequently flood German Deezer charts. To ensure the trivia pool only contains musical tracks, `filterAndDeduplicate` checks track titles and artist names against a case-insensitive blacklist:
   `die drei ???`, `die drei !!!`, `bibi blocksberg`, `tkkg`, `benjamin blümchen`, `hörspiel`, `folge`, `kapitel`, `teufelsberg`, `weihnachtsspiel`.
   Any matching tracks are discarded immediately.

---

## 2. On-the-Fly Year Lookup

During the transition from the `PASS_DEVICE` screen to the `QUIZ` screen, the application performs an asynchronous fetch using `fetchTrackYear(trackId, title, artist)` to find the original release year:

1. **Primary Year Source: MusicBrainz API**:
   - **Query Formulation**: The query uses the Lucene search syntax to fetch matching recordings. It generates multiple spelling variations (using `generateTitleVariations` to handle straight vs. curly apostrophes and trailing possessive/plural 's') and queries them as strict double-quoted recording phrases joined by `OR`:
     `artist:"${cleanLuceneQuery(cleanArtist)}" AND (recording:"${cleanLuceneQuery(var1)}" OR recording:"${cleanLuceneQuery(var2)}" OR ...)`
     - Grouping spelling variations inside strict double quotes prevents query token-splitting (which causes OR-pollution matching unrelated songs) and guarantees precise matches.
     - A helper `cleanLuceneQuery` strips Lucene special characters (`+ - & | ! ( ) { } [ ] ^ " ~ * ? : \ /`) to prevent 400 Bad Request query parse errors, while preserving apostrophes and dots to avoid zero-result mismatches.
     - A custom `User-Agent` header (`MelodyMatch/1.0.0 ( frank@example.com )`) is sent with the request to comply with MusicBrainz API usage policies and prevent rate limiting.
   - **Original Release Resolution**: Since duplicates and live releases often score higher than the original single, the query is fetched with `limit=100`. The code scans all returned recording records and selects the minimum `first-release-date` year (e.g., 1958 for *Johnny B. Goode*, 1975 for *Bohemian Rhapsody*).
   - If MusicBrainz resolves a year successfully (validated to be between 1900 and current calendar year + 2), it returns it immediately.

2. **Fallback Year Source: iTunes Search API**:
   If the MusicBrainz lookup fails or returns no valid dates, the app falls back to searching iTunes.
   - **Query Formulation**: Combining the cleaned artist name (stripped of features) and the cleaned song title (e.g. `"Journey Don't Stop Believin'"`).
   - **Proxy Strategy with Candidate Filtering**:
     - **Limit Boost**: The app queries up to 10 tracks (`limit=10`) across all cascading proxies:
       - **Local Dev Proxy**: `/api-itunes/search?...` (used in development)
       - **Local PHP Proxy**: `./proxy.php?...` (used in PHP-enabled hosting environments)
       - **AllOrigins Proxy**: `https://api.allorigins.win/raw?url=...` (free CORS proxy fallback)
     - **Candidate Filtering**: To prevent matching compilation/reissue albums that override the original year, the app normalizes and filters returned tracks against the target title (`cleanAndNormalizeTitle(trackName) === targetNorm`).
     - **Earliest Year Extraction**: Extracts the release year for all valid matching candidates and returns the minimum (earliest) year found.
   - **Date Validation & Regex Extraction (`getYearFromString`)**:
     - If the date is valid, it extracts the year using `getFullYear()`.
     - If date parsing fails or is outside the range `[1900, currentYear + 2]`, it runs a fallback regex `\b(19\d\d|20\d\d)\b` to extract any 4-digit year.

3. **Absolute Fallback: Deezer API**:
   If all MusicBrainz and iTunes methods fail, the app queries `https://api.deezer.com/track/{trackId}` and parses `release_date` as a fallback. If this also fails, the current calendar year is returned as a safe default.

---

## 3. Preview URL Refresh

Deezer CDN preview URLs contain signed expiry tokens and become invalid after approximately **1–2 hours**. URLs stored in `localStorage` (Liked Songs) or in session state (Round Replay history) will therefore fail to play after some time — most visibly on iOS Safari, which aborts the request immediately rather than silently failing.

**Solution:** `refreshPreviewUrls(songs: Song[]): Promise<Song[]>` in `src/services/api.ts` re-fetches `https://api.deezer.com/track/{id}` for every song in parallel via JSONP and returns updated `Song` objects with fresh `previewUrl` values. Per-song failures are silently ignored (original URL kept as fallback).

This function is called automatically:
- In `App.tsx` when `playSong` fails with a resource/network error during the QUIZ phase — refreshes the URL on-demand and retries playback immediately. This handles the case where a Deezer CDN URL has expired mid-game without causing any double-play on normal turns.
- In `SetupScreen` when the Liked Songs section is expanded — refreshes all Liked Songs before the user taps any cover
- In `SetupScreen` when the Player modal (`FavoritesModal`) is opened directly — ensures URLs are fresh even if the section was never expanded
- In `RoundReplayModal` on mount — refreshes all songs from the round

---

## 4. Song Background & Genius Lookup
 
To provide background information about tracks without introducing heavy API key setups or CORS issues, MelodyMatch uses two client-side integrations:
 
1. **Wikipedia Summary API**:
   - **Multi-Level Cascading Search**: To maximize the chance of finding relevant background info, the search cascaded across three hierarchical levels:
     1. **Song-Level**: Queries `"{title}" "{artist}"`.
     2. **Album-Level** (if song fails and album name is known): Queries `intitle:"{albumName}" "{artist}"` or fallback search `"{albumName}" "{artist}" album`.
     3. **Artist-Level** (if song and album fail): Queries `intitle:"{artist}"` or fallback search `"{artist}" band OR singer OR musician OR group`.
   - **Language Cascading**: For each search level, the app first queries the active game language subdomain (e.g. `de.wikipedia.org` if German is selected). If no summary is found, it immediately falls back to search the other language subdomain (e.g. `en.wikipedia.org`). This ensures German-specific bands (like NDW artists) return summaries even when the game is played in English.
   - **Disambiguation & Validation**: To prevent matching wrong pages (such as the band *Ideal* redirecting to the philosophy article *Ideal (Philosophie)*), the app checks for disambiguation types and validates page content descriptions.
   - **Badges**: Standardized translated badges identify what type of information is shown: `wikiFallbackSong` ("Song Info"), `wikiFallbackAlbum` ("Album Info"), and `wikiFallbackArtist` ("Artist Bio").
 
2. **Genius lyrics external linking**:
   - Rather than fetching full lyrics via scraping APIs, the app constructs a Genius.com URL client-side:
     `https://genius.com/{artist}-{title}-lyrics`
   - Slashes, spaces, and punctuation marks are stripped and replaced with hyphens to form the canonical slug.
   - **Ampersand & Conjunction Mapping**: To prevent cutting off bands like "Clowns & Helden" or "Klaus & Klaus", the generator does not truncate at `&` or `,`. 
   - **Database Spelling Mismatches**: Since Genius and Deezer metadata spellings can differ, the app incorporates a dictionary mapping known mismatches (e.g., `"Clowns & Helden"` is mapped to `"Clowns und Helden"`, `"Die Doraus Und Die Marinas"` to `"Die Doraus & Die Marinas"`, `"Spliff"` to `"Spliff (DEU)"`, and `"DöF"` to `"DÖF (AUT)"`). For all other artists, `&` is mapped to `"and"` by default, matching Genius's automatic slugifier. This ensures links work regardless of active game language settings.
     > [!WARNING]
     > **Experimental Feature:** These hardcoded database mappings are temporary workarounds for key NDW tracks. Do NOT expand this list as a general design pattern for other metadata discrepancies, as a hardcoded mapping list is not scalable.
