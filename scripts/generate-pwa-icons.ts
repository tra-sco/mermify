import sharp from 'sharp';
import path from 'path';

const svgPath = path.resolve('public/favicon.svg');
const publicDir = path.resolve('public');

async function generateIcons() {
  console.log('Generating PWA icons...');
  
  // Standard 192x192
  await sharp(svgPath)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated pwa-192x192.png');

  // Standard 512x512
  await sharp(svgPath)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated pwa-512x512.png');

  // Maskable icon 512x512 (with #0f172a background and padding)
  const iconBuffer = await sharp(svgPath)
    .resize(360, 360) // Safe zone padding
    .toBuffer();
  
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a
    }
  })
    .composite([{ input: iconBuffer, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'maskable-icon-512x512.png'));
  console.log('Generated maskable-icon-512x512.png');
}

generateIcons().catch(err => {
  console.error('Error generating PWA icons:', err);
  process.exit(1);
});
