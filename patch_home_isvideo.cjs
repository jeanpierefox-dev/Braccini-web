const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

content = content.replace(
    "const isVideo = (url?: string) => url && (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com') || url.match(/\\.(mp4|webm|ogg)$/i));",
    "const isVideo = (url?: string): boolean => !!(url && (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com') || url.match(/\\.(mp4|webm|ogg)$/i)));"
);

fs.writeFileSync('src/pages/Home.tsx', content);
