import * as fs from 'fs';
import * as path from 'path';

const srcDir = path.resolve('docs/.vitepress/dist');
const destDir = path.resolve('dist/docs');

try {
  if (!fs.existsSync(srcDir)) {
    console.error(`Source directory does not exist: ${srcDir}`);
    process.exit(1);
  }

  // Create destination directory if it doesn't exist
  fs.mkdirSync(destDir, { recursive: true });

  // Copy recursive
  fs.cpSync(srcDir, destDir, { recursive: true });

  console.log(`Successfully copied docs from ${srcDir} to ${destDir}`);

  // GitHub Pages: prevent Jekyll from ignoring _assets/ directories
  const noJekyllPath = path.resolve('dist/.nojekyll');
  fs.writeFileSync(noJekyllPath, '');
  console.log('Created dist/.nojekyll');
} catch (error) {
  console.error('Failed to copy docs to dist:', error);
  process.exit(1);
}
