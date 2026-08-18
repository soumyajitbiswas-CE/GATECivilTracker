import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const iconsDir = path.resolve('public', 'achievements', 'icons_final');

async function optimizeAchievementIcons() {
    console.log('Optimizing achievement icons in:', iconsDir);
    if (!fs.existsSync(iconsDir)) {
        console.error('Icons directory not found:', iconsDir);
        return;
    }

    const files = fs.readdirSync(iconsDir);
    const pngFiles = files.filter(f => f.endsWith('.png') && !f.includes('-lg'));

    console.log(`Found ${pngFiles.length} PNG icons to optimize.`);

    let totalOriginalBytes = 0;
    let totalWebpBytes = 0;
    let totalLgWebpBytes = 0;

    for (const pngFile of pngFiles) {
        const inputPath = path.join(iconsDir, pngFile);
        const baseName = pngFile.replace('.png', '');
        const cardWebpPath = path.join(iconsDir, `${baseName}.webp`);
        const lgWebpPath = path.join(iconsDir, `${baseName}-lg.webp`);

        const origSize = fs.statSync(inputPath).size;
        totalOriginalBytes += origSize;

        // 1. Grid card icon: 160x160 (retina for 80x80 card icon)
        await sharp(inputPath)
            .resize(160, 160, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .webp({ quality: 85, effort: 6 })
            .toFile(cardWebpPath);

        // 2. Large modal icon: 320x320 (retina for 128x128 popup icon)
        await sharp(inputPath)
            .resize(320, 320, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .webp({ quality: 90, effort: 6 })
            .toFile(lgWebpPath);

        const cardWebpSize = fs.statSync(cardWebpPath).size;
        const lgWebpSize = fs.statSync(lgWebpPath).size;
        totalWebpBytes += cardWebpSize;
        totalLgWebpBytes += lgWebpSize;
    }

    console.log(`\nOptimization Complete!`);
    console.log(`Original PNG payload: ${(totalOriginalBytes / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`Grid WebP payload (160x160): ${(totalWebpBytes / 1024).toFixed(1)} KB (avg ${(totalWebpBytes / pngFiles.length / 1024).toFixed(1)} KB/icon)`);
    console.log(`Modal WebP payload (320x320): ${(totalLgWebpBytes / 1024).toFixed(1)} KB (avg ${(totalLgWebpBytes / pngFiles.length / 1024).toFixed(1)} KB/icon)`);
    console.log(`Total savings: ${(100 - (totalWebpBytes / totalOriginalBytes) * 100).toFixed(1)}% on grid cards!`);
}

optimizeAchievementIcons().catch(console.error);
