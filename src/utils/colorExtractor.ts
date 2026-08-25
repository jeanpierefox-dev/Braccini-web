/**
 * Color extraction utility for dynamically generating club themes based on uploaded logos.
 */

export interface ExtractedColors {
  primary: string;       // #hex
  primaryRgb: string;    // 'r, g, b'
  accent: string;        // #hex
  accentRgb: string;     // 'r, g, b'
  darkTone: string;      // #hex
  lightTone: string;     // #hex
  palette: string[];     // Array of dominant hex colors
}

// Convert RGB to HEX
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Convert HEX to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

// Calculate color saturation and lightness in HSL
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Adjust lightness of a hex color
export function adjustLightness(hex: string, amountPercent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const hsl = rgbToHsl(r, g, b);
  const newL = Math.max(0, Math.min(100, hsl.l + amountPercent)) / 100;
  const s = hsl.s / 100;
  const h = hsl.h / 360;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  const q = newL < 0.5 ? newL * (1 + s) : newL + s - newL * s;
  const p = 2 * newL - q;
  const newR = Math.round(hue2rgb(p, q, h + 1/3) * 255);
  const newG = Math.round(hue2rgb(p, q, h) * 255);
  const newB = Math.round(hue2rgb(p, q, h - 1/3) * 255);

  return rgbToHex(newR, newG, newB);
}

/**
 * Extracts dominant vibrant colors from an image url/base64
 */
export function extractColorsFromImage(imageSrc: string): Promise<ExtractedColors> {
  return new Promise((resolve) => {
    // Default fallback in case image fails to load
    const fallback: ExtractedColors = {
      primary: '#2563eb', // Royal Blue
      primaryRgb: '37, 99, 235',
      accent: '#f59e0b',  // Amber/Gold
      accentRgb: '245, 158, 11',
      darkTone: '#0f172a',
      lightTone: '#60a5fa',
      palette: ['#2563eb', '#f59e0b', '#dc2626', '#10b981', '#8b5cf6']
    };

    if (!imageSrc) {
      resolve(fallback);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(fallback);
          return;
        }

        const size = 64; // Sample resolution
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size).data;
        const colorBuckets = new Map<string, { r: number; g: number; b: number; count: number; score: number }>();

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          // Skip transparent or near-invisible pixels
          if (a < 128) continue;

          // Skip pure white or pure black backgrounds commonly found in logos
          const isNearWhite = r > 240 && g > 240 && b > 240;
          const isNearBlack = r < 18 && g < 18 && b < 18;

          const hsl = rgbToHsl(r, g, b);
          
          // Quantize RGB to group similar shades (step of 24)
          const qr = Math.round(r / 24) * 24;
          const qg = Math.round(g / 24) * 24;
          const qb = Math.round(b / 24) * 24;
          const key = `${qr},${qg},${qb}`;

          // Weight score: high saturation & moderate lightness gets priority for sport branding
          let saturationBonus = hsl.s * 1.5;
          if (isNearWhite || isNearBlack) {
            saturationBonus = 0.1;
          }
          if (hsl.l < 12 || hsl.l > 90) {
            saturationBonus *= 0.2;
          }

          if (colorBuckets.has(key)) {
            const bucket = colorBuckets.get(key)!;
            bucket.count += 1;
            bucket.score += saturationBonus;
          } else {
            colorBuckets.set(key, {
              r: qr,
              g: qg,
              b: qb,
              count: 1,
              score: saturationBonus
            });
          }
        }

        if (colorBuckets.size === 0) {
          resolve(fallback);
          return;
        }

        // Sort by score (vibrancy + frequency)
        const sorted = Array.from(colorBuckets.values()).sort((a, b) => b.score - a.score);

        const palette: string[] = [];
        for (const bucket of sorted) {
          const hex = rgbToHex(bucket.r, bucket.g, bucket.b);
          if (!palette.includes(hex)) {
            palette.push(hex);
          }
          if (palette.length >= 6) break;
        }

        const primaryHex = palette[0] || '#2563eb';
        const primaryRgbObj = hexToRgb(primaryHex);
        
        // Find distinct accent color with different hue
        let accentHex = palette[1];
        if (!accentHex || accentHex === primaryHex) {
          // Compute harmonious accent
          const primaryHsl = rgbToHsl(primaryRgbObj.r, primaryRgbObj.g, primaryRgbObj.b);
          const accentHue = (primaryHsl.h + 180) % 360; // Complementary
          accentHex = '#f59e0b';
        }
        const accentRgbObj = hexToRgb(accentHex);

        const darkTone = adjustLightness(primaryHex, -35);
        const lightTone = adjustLightness(primaryHex, 20);

        resolve({
          primary: primaryHex,
          primaryRgb: `${primaryRgbObj.r}, ${primaryRgbObj.g}, ${primaryRgbObj.b}`,
          accent: accentHex,
          accentRgb: `${accentRgbObj.r}, ${accentRgbObj.g}, ${accentRgbObj.b}`,
          darkTone,
          lightTone,
          palette: palette.length > 0 ? palette : fallback.palette
        });
      } catch (err) {
        console.warn("Could not extract colors from logo:", err);
        resolve(fallback);
      }
    };

    img.onerror = () => {
      resolve(fallback);
    };

    img.src = imageSrc;
  });
}
