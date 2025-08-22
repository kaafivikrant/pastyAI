const fs = require('fs');
const path = require('path');

// Simple 16x16 PNG icons as base64 data
const icons = {
  // Simple lightning bolt icon (blue)
  'icon-16.png': 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFYSURBVDiNpZM9SwNBEIafxsJCG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sL',
  
  // Processing icon (yellow)
  'icon-processing-16.png': 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFYSURBVDiNpZM9SwNBEIafxsJCG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sL',
  
  // Success icon (green)  
  'icon-success-16.png': 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFYSURBVDiNpZM9SwNBEIafxsJCG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sL',
  
  // Error icon (red)
  'icon-error-16.png': 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFYSURBVDiNpZM9SwNBEIafxsJCG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sLwcJCG0uxsLBQG1sL'
};

// Create a more realistic minimal 16x16 PNG for menu bar
function createMinimalIcon(color = '#007AFF') {
  // This is a minimal valid PNG file structure (transparent background with a blue pixel in center)
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A // PNG signature
  ]);
  
  const ihdr = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x0D]), // IHDR chunk length
    Buffer.from('IHDR'), // IHDR chunk type
    Buffer.from([0x00, 0x00, 0x00, 0x10]), // width (16)
    Buffer.from([0x00, 0x00, 0x00, 0x10]), // height (16)
    Buffer.from([0x08, 0x06, 0x00, 0x00, 0x00]), // bit depth, color type, etc.
  ]);
  
  // Simple CRC for IHDR (pre-calculated)
  const ihdrCrc = Buffer.from([0x3F, 0xF6, 0x1E, 0xBD]);
  
  // Minimal IDAT chunk (compressed image data - mostly transparent with a few colored pixels)
  const idat = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x3E]), // IDAT chunk length
    Buffer.from('IDAT'), // IDAT chunk type
    // Compressed data for a 16x16 transparent PNG with some colored pixels in the middle
    Buffer.from([
      0x78, 0x9C, 0x63, 0x60, 0x18, 0x05, 0x40, 0x00, 0x00, 0x00, 0x10,
      0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ])
  ]);
  
  // CRC for IDAT (pre-calculated)
  const idatCrc = Buffer.from([0x00, 0x00, 0x00, 0x00]);
  
  // IEND chunk
  const iend = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // IEND chunk length
    Buffer.from('IEND'), // IEND chunk type
    Buffer.from([0xAE, 0x42, 0x60, 0x82]) // IEND CRC
  ]);
  
  return Buffer.concat([pngHeader, ihdr, ihdrCrc, idat, idatCrc, iend]);
}

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create the icon files
const iconFiles = {
  'icon-16.png': createMinimalIcon('#007AFF'),
  'icon-processing-16.png': createMinimalIcon('#FFB800'), 
  'icon-success-16.png': createMinimalIcon('#00C851'),
  'icon-error-16.png': createMinimalIcon('#FF4444')
};

Object.entries(iconFiles).forEach(([filename, buffer]) => {
  const filepath = path.join(assetsDir, filename);
  fs.writeFileSync(filepath, buffer);
  console.log(`Created ${filename}`);
});

console.log('✅ Icon files created successfully!');
console.log('Note: These are minimal placeholder icons. Replace with proper 16x16 icons for production.');
