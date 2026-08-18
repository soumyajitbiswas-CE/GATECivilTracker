import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');

const images = [
    'bg.png',
    'general-aptitude-bg.png',
    'engineering-mathematics-bg.png',
    'structural-engineering-bg.png',
    'geotechnical-engineering-bg.png',
    'water-resources-engineering-bg.png',
    'environmental-engineering-bg.png',
    'transportation-engineering-bg.png',
    'geomatics-engineering-bg.png',
    'construction-materials-bg.png'
];

async function run() {
    console.log('Optimizing images to WebP...');
    for (const img of images) {
        const inputPath = path.join(publicDir, img);
        if (!fs.existsSync(inputPath)) {
            console.log(`Skipping ${img} (not found)`);
            continue;
        }

        const outName = img.replace('.png', '.webp');
        const outputPath = path.join(publicDir, outName);

        const beforeStat = fs.statSync(inputPath);

        // Convert to webp with high quality compression
        await sharp(inputPath)
            .webp({ quality: 82, effort: 6 })
            .toFile(outputPath);

        const afterStat = fs.statSync(outputPath);
        console.log(`${img} (${(beforeStat.size / 1024).toFixed(1)} KB) -> ${outName} (${(afterStat.size / 1024).toFixed(1)} KB) [Saved: ${(100 - (afterStat.size / beforeStat.size) * 100).toFixed(1)}%]`);
    }

    // Optimize logo
    const logoPng = path.join(publicDir, 'favicon-96x96.png');
    if (fs.existsSync(logoPng)) {
        await sharp(logoPng)
            .webp({ quality: 90 })
            .toFile(path.join(publicDir, 'logo.webp'));
        console.log('Created logo.webp');
    }
}

run().catch(console.error);
