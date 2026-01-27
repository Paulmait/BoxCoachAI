#!/usr/bin/env node
/**
 * Asset Generator for Boxing Coach AI
 * Generates app icons and splash screens that meet App Store guidelines
 *
 * Requirements:
 * - iOS App Icon: 1024x1024 PNG without alpha channel
 * - Android Adaptive Icon: 1024x1024 PNG (foreground layer)
 * - Splash Screen: 2732x2732 PNG for largest iPad
 *
 * Colors based on theme:
 * - Primary: #EF4444 (red)
 * - Background: #0A0A0F (dark)
 * - Accent: #F59E0B (amber)
 */

const fs = require('fs');
const path = require('path');

// Simple PNG generator using raw bytes
// Creates a solid color PNG with optional centered icon shape

function createPNG(width, height, bgColor, iconColor = null, iconType = null) {
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk (image header)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = createChunk('IHDR', ihdrData);

  // Parse colors
  const bg = parseColor(bgColor);
  const icon = iconColor ? parseColor(iconColor) : null;

  // Create image data
  const rawData = Buffer.alloc(height * (1 + width * 3)); // filter byte + RGB per pixel

  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const iconRadius = Math.floor(Math.min(width, height) * 0.35);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 3);
    rawData[rowOffset] = 0; // filter type: none

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;

      let color = bg;

      // Draw icon shape if specified
      if (icon && iconType) {
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (iconType === 'circle' && dist < iconRadius) {
          color = icon;
        } else if (iconType === 'boxing-glove') {
          // Simplified boxing glove shape (rounded rectangle with punch area)
          const gloveWidth = iconRadius * 1.4;
          const gloveHeight = iconRadius * 1.2;
          const wristWidth = iconRadius * 0.5;
          const wristHeight = iconRadius * 0.6;

          // Main glove body (rounded)
          if (Math.abs(dx) < gloveWidth && dy > -gloveHeight * 0.3 && dy < gloveHeight * 0.7) {
            const cornerRadius = gloveWidth * 0.4;
            const inCorner = (Math.abs(dx) > gloveWidth - cornerRadius &&
                            (dy < -gloveHeight * 0.3 + cornerRadius || dy > gloveHeight * 0.7 - cornerRadius));
            if (!inCorner || dist < iconRadius * 1.2) {
              color = icon;
            }
          }
          // Wrist area
          if (Math.abs(dx) < wristWidth && dy > gloveHeight * 0.5 && dy < gloveHeight * 0.5 + wristHeight) {
            color = icon;
          }
        }
      }

      rawData[pixelOffset] = color.r;
      rawData[pixelOffset + 1] = color.g;
      rawData[pixelOffset + 2] = color.b;
    }
  }

  // Compress using zlib (deflate)
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idat = createChunk('IDAT', compressed);

  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcInput);

  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = getCrcTable();

  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }

  return (crc ^ 0xFFFFFFFF) >>> 0;
}

let crcTable = null;
function getCrcTable() {
  if (crcTable) return crcTable;

  crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xEDB88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    crcTable[n] = c >>> 0;
  }
  return crcTable;
}

function parseColor(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

// Generate assets
const assetsDir = path.join(__dirname, '..', 'assets');

console.log('Generating Boxing Coach AI assets...\n');

// App Icon (1024x1024) - iOS requires no alpha
console.log('Creating icon.png (1024x1024)...');
const icon = createPNG(1024, 1024, '#0A0A0F', '#EF4444', 'boxing-glove');
fs.writeFileSync(path.join(assetsDir, 'icon.png'), icon);
console.log('  ✓ icon.png created');

// Adaptive Icon (1024x1024) - Android foreground
console.log('Creating adaptive-icon.png (1024x1024)...');
const adaptiveIcon = createPNG(1024, 1024, '#0A0A0F', '#EF4444', 'boxing-glove');
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), adaptiveIcon);
console.log('  ✓ adaptive-icon.png created');

// Splash Screen (2732x2732) - largest iPad size
console.log('Creating splash.png (2732x2732)...');
const splash = createPNG(2732, 2732, '#0A0A0F', '#EF4444', 'boxing-glove');
fs.writeFileSync(path.join(assetsDir, 'splash.png'), splash);
console.log('  ✓ splash.png created');

// Favicon (32x32) for web
console.log('Creating favicon.png (32x32)...');
const favicon = createPNG(32, 32, '#0A0A0F', '#EF4444', 'circle');
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), favicon);
console.log('  ✓ favicon.png created');

console.log('\n✓ All assets generated successfully!');
console.log('\nAsset locations:');
console.log(`  ${path.join(assetsDir, 'icon.png')}`);
console.log(`  ${path.join(assetsDir, 'adaptive-icon.png')}`);
console.log(`  ${path.join(assetsDir, 'splash.png')}`);
console.log(`  ${path.join(assetsDir, 'favicon.png')}`);
console.log('\nNote: Replace these placeholder assets with your actual branded images.');
console.log('Requirements:');
console.log('  - icon.png: 1024x1024, no transparency (App Store requirement)');
console.log('  - splash.png: 2732x2732 for iPad Pro support');
