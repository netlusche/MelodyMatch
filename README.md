# MelodyMatch

A fast-paced, interactive, modern local-multiplayer music quiz built with React, Vite, and the iTunes API.

## Features
- **Real iTunes Music**: Plays real song snippets directly from the iTunes Search API using a robust, multi-layer proxy architecture that bypasses CORS and browser tracking/ad-blocker restrictions.
- **Safari Autoplay Unlock**: Centralized web audio registry that unlocks browser-level audio restrictions on the very first user interaction, ensuring previews play seamlessly on iOS Safari.
- **Dynamic Options**: Vast 100-song multiple-choice option arrays guarantee variety across any selected round length.
- **Flawless Integrity**: Deep RegExp string cross-referencing algorithms explicitly obliterate duplicate tracks natively hidden across different iTunes compilation records.
- **Regions**: Deeply localized (EN/DE) setup and fully localized native API queries, injecting region-specific genres (e.g., *Schlager*, *Neue Deutsche Welle*, *Ballermann*) directly into German clients.
- **Aesthetic**: Gorgeous glowing glassmorphic components and `canvas-confetti` fireworks engine for a premium presentation.

## Usage

### Local Development
```bash
npm install
npm run dev
```
*(Runs a dev server with a built-in proxy mapping `/api-itunes` to `https://itunes.apple.com` to prevent CORS issues.)*

### Production Build & Deployment
```bash
npm run build
```
The compiled files are generated in the `dist/` directory. Due to CORS constraints and iOS Safari security policies blocking JSONP script execution, API queries must be proxied. Choose one of the following deployment options:

1. **PHP Web Hosting (Strato, IONOS, cPanel, etc.)**:
   Upload the entire contents of the `dist/` folder. The app will automatically use the included `proxy.php` to fetch iTunes data server-side.
2. **Netlify**:
   Deploy the project repository. The included `public/_redirects` file automatically maps the API route `/api-itunes/*` to the iTunes API.
3. **Vercel**:
   Deploy the project repository. The included `vercel.json` file configures the rewrite proxy automatically.
4. **Nginx / Apache (Static without PHP)**:
   Configure a reverse proxy on your server:
   * **Nginx**:
     ```nginx
     location /api-itunes/ {
         proxy_pass https://itunes.apple.com/;
         proxy_ssl_server_name on;
     }
     ```
   * **Apache (`.htaccess`)**:
     ```apache
     RewriteEngine On
     RewriteRule ^api-itunes/(.*) https://itunes.apple.com/$1 [P,L]
     ```

## License
Released gracefully under the GPL-3.0 License.
