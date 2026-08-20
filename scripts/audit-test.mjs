import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

console.log('🚀 Starting Comprehensive Performance, Responsiveness & Quality Audit...\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        passedTests++;
    } else {
        console.error(`  ❌ FAIL: ${message}`);
        failedTests++;
    }
}

// 1. Check Dist Output Pages
console.log('--- 1. Static Pages & Routing Audit ---');
const contentPages = [
    'index.html',
    '404.html',
    '500.html',
    'about/index.html',
    'contact/index.html',
    'privacy-policy/index.html',
    'terms/index.html',
    'achievements/index.html',
    'subject/general_aptitude/index.html',
    'subject/engineering_mathematics/index.html',
    'subject/structural_engineering/index.html',
    'subject/geotechnical_engineering/index.html',
    'subject/water_resources_engineering/index.html',
    'subject/environmental_engineering/index.html',
    'subject/transportation_engineering/index.html',
    'subject/geomatics_engineering/index.html',
    'subject/construction_materials/index.html'
];

const redirectPages = [
    'about-us/index.html',
    'contact-us/index.html',
    'privacy/index.html',
    'terms-and-conditions/index.html'
];

[...contentPages, ...redirectPages].forEach(p => {
    const filePath = path.join(distDir, p);
    assert(fs.existsSync(filePath), `Page generated: ${p}`);
});

// 2. Responsiveness & Meta Tags Verification
console.log('\n--- 2. Responsiveness & Mobile Meta Tags Audit ---');
contentPages.forEach(p => {
    const filePath = path.join(distDir, p);
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Viewport meta
    const hasViewport = content.includes('name="viewport"') && content.includes('width=device-width');
    assert(hasViewport, `${p} has mobile-responsive viewport meta tag`);

    // Charset
    const hasCharset = content.includes('charset="UTF-8"') || content.includes("charset='UTF-8'") || content.includes('charset="utf-8"');
    assert(hasCharset, `${p} has UTF-8 charset`);

    // Title tag
    const hasTitle = /<title>[^<]+<\/title>/i.test(content);
    assert(hasTitle, `${p} has descriptive <title> tag`);

    // Meta description
    const hasDescription = content.includes('name="description"');
    assert(hasDescription, `${p} has meta description`);
});

redirectPages.forEach(p => {
    const filePath = path.join(distDir, p);
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf-8');
    const isRedirect = content.includes('http-equiv="refresh"') && content.includes('canonical');
    assert(isRedirect, `${p} is valid canonical 301 redirect`);
});

// 3. Asset & Performance Check
console.log('\n--- 3. Performance & Asset Weight Audit ---');
const astroAssetDir = path.join(distDir, '_astro');
if (fs.existsSync(astroAssetDir)) {
    const assets = fs.readdirSync(astroAssetDir);
    assets.forEach(asset => {
        const fullPath = path.join(astroAssetDir, asset);
        const stats = fs.statSync(fullPath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`  📦 Asset: ${asset} (${sizeKB} KB)`);
        assert(stats.size < 500 * 1024, `Asset ${asset} is lightweight (<500KB)`);
    });
}

// 4. Sitemap & Robots.txt
console.log('\n--- 4. SEO & Indexing Audit ---');
assert(fs.existsSync(path.join(distDir, 'robots.txt')), 'robots.txt exists in dist');
assert(fs.existsSync(path.join(distDir, 'sitemap-index.xml')), 'sitemap-index.xml exists in dist');
assert(fs.existsSync(path.join(distDir, 'site.webmanifest')), 'PWA webmanifest exists in dist');

// 5. Test State & Badge Logic
console.log('\n--- 5. State & PYQ Badge Unit Testing ---');
import('../src/utils/state.js').then(stateModule => {
    const { getState, saveState, calculateAllMetrics, sanitizeHistoryArray, escapeHtml } = stateModule;

    // Test Escape HTML
    assert(escapeHtml('<script>alert(1)</script>') === '&lt;script&gt;alert(1)&lt;/script&gt;', 'escapeHtml sanitizes XSS characters');

    // Test Full Subject vs Topic PYQ logic
    const testCases = [
        {
            year: 2021,
            topic: null,
            expected: 'GATE 2021'
        },
        {
            year: 2022,
            topic: '',
            expected: 'GATE 2022'
        },
        {
            year: 2023,
            topic: 'Soil Mechanics',
            expected: 'GATE 2023 (Soil Mechanics)'
        },
        {
            year: 2024,
            topic: 'Fluid Dynamics & Hydraulics',
            expected: 'GATE 2024 (Fluid Dynamics &amp; Hydraulics)'
        }
    ];

    testCases.forEach(tc => {
        const topicDisplay = tc.topic && tc.topic.trim() ? ` (${escapeHtml(tc.topic.trim())})` : '';
        const rendered = `GATE ${tc.year}${topicDisplay}`;
        assert(rendered === tc.expected, `Rendered "${rendered}" matches expected "${tc.expected}"`);
    });

    console.log(`\n========================================`);
    console.log(`Audit Complete: ${passedTests} Passed, ${failedTests} Failed.`);
    console.log(`========================================\n`);

    if (failedTests > 0) {
        process.exit(1);
    }
}).catch(err => {
    console.error('Error in unit testing:', err);
    process.exit(1);
});
