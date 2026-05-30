// Strip Foto and Collage Canvas Generator Utilities
// Renders high-quality themed images client-side for downloads

export interface PhotoSubmission {
  playerName: string;
  challengeId: number;
  photoUrl: string;
  answer: string;
  detectedPlayers?: string[];
}

export interface ChallengeInfo {
  id: number;
  title: string;
  description: string;
  question: string;
}

const DEFAULT_CHALLENGES = [
  { id: 1, title: '📸 Capek Proker' },
  { id: 2, title: '💻 Anak Warnet' },
  { id: 3, title: '😭 Air Mata HIMA' },
  { id: 4, title: '🧥 Tuker Jaket' },
  { id: 5, title: '✌️ Peace & Blink' },
  { id: 6, title: '👀 Eye Contact' },
  { id: 7, title: '⛺ Sekre Vibes' },
  { id: 8, title: '🤫 Tahan Tawa' },
  { id: 9, title: '🤝 Solidarity Stack' },
  { id: 10, title: '🎉 Happiness Overload' }
];

// Helper to load image safely and return HTMLImageElement
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn('Failed to load image, using fallback:', src);
      // Create a fallback 300x300 canvas image to prevent crashing
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 375;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#151522';
        ctx.fillRect(0, 0, 300, 375);
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 280, 355);
        
        ctx.fillStyle = '#6E6E80';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Gagal Memuat Foto', 150, 180);
        ctx.font = '10px monospace';
        ctx.fillText('CORS / File Tidak Ditemukan', 150, 205);
      }
      const dummyImg = new Image();
      dummyImg.onload = () => resolve(dummyImg);
      dummyImg.src = canvas.toDataURL('image/jpeg');
    };
    img.src = src;
  });
};

// Word wrap helper for canvas text drawing
const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number = 3
): number => {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  let linesCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    
    if (testWidth > maxWidth && n > 0) {
      linesCount++;
      if (linesCount >= maxLines) {
        ctx.fillText(line.trim() + '...', x, currentY);
        return currentY + lineHeight;
      }
      ctx.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
  return currentY + lineHeight;
};

// Trigger browser download of data URI
const triggerDownload = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Helper to draw rounded rectangle with fallback compatibility
const drawRoundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
};

// Helper to draw vintage circular "HIMA TRPL APPROVED" stamp
const drawStamp = (ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) => {
  ctx.save();
  ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)'; // retro rose red
  ctx.lineWidth = 2;
  
  // Outer circular border
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  
  // Inner circular border
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 5, 0, Math.PI * 2);
  ctx.stroke();
  
  // Inner decorative text and lines
  ctx.fillStyle = 'rgba(244, 63, 94, 0.7)';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.15); // Authentic retro stamp tilt
  ctx.font = 'bold 9px monospace';
  ctx.fillText('APPROVED', 0, -4);
  ctx.font = '7px sans-serif';
  ctx.fillText('HIMA TRPL', 0, 7);
  ctx.restore();
  
  ctx.restore();
};

// Helper to draw realistic barcode at the bottom
const drawBarcode = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  let currentX = x;
  const barcodePattern = [2, 1, 3, 1, 2, 4, 1, 2, 3, 2, 1, 2, 2, 1, 3, 1, 2, 1, 4, 2, 1, 3];
  
  let i = 0;
  while (currentX < x + width) {
    const barWidth = barcodePattern[i % barcodePattern.length];
    const isBlack = (i % 2 === 0);
    if (isBlack) {
      ctx.fillRect(currentX, y, barWidth, height);
    }
    currentX += barWidth + 1;
    i++;
  }
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = '7px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('TRPL-BONDING-2026', x, y + height + 9);
  ctx.restore();
};

// Helper to draw semi-transparent glassy washi tape
const drawTape = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, angle: number) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  
  // Semi-transparent color blend
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 1;
  
  // Draw base tape body
  ctx.fillRect(-width / 2, -height / 2, width, height);
  
  // Shiny glass refraction gradient
  const grad = ctx.createLinearGradient(-width / 2, -height / 2, width / 2, height / 2);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
  grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.04)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(-width / 2, -height / 2, width, height);
  
  // Draw detailed jagged/torn edges
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  
  // Left side torn effect
  let currY = -height / 2;
  ctx.moveTo(-width / 2, currY);
  while (currY < height / 2) {
    currY += 3;
    const offset = Math.sin(currY * 1.5) * 1.5;
    ctx.lineTo(-width / 2 + offset, currY);
  }
  
  // Bottom border
  ctx.lineTo(width / 2, height / 2);
  
  // Right side torn effect
  currY = height / 2;
  while (currY > -height / 2) {
    currY -= 3;
    const offset = Math.cos(currY * 1.5) * 1.5;
    ctx.lineTo(width / 2 + offset, currY);
  }
  
  // Top border
  ctx.closePath();
  ctx.stroke();
  
  ctx.restore();
};

// Helper to draw glowing Challenge Badge pill
const drawChallengeBadge = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number) => {
  ctx.save();
  ctx.font = 'bold 9px monospace';
  const textWidth = ctx.measureText(text.toUpperCase()).width;
  const paddingH = 10;
  const badgeWidth = textWidth + paddingH * 2;
  const badgeHeight = 20;
  
  // Pill container
  ctx.fillStyle = 'rgba(139, 92, 246, 0.15)'; // violet opacity
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.6)'; // violet border
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  drawRoundRect(ctx, x, y - badgeHeight / 2, badgeWidth, badgeHeight, 10);
  ctx.fill();
  ctx.stroke();
  
  // Text
  ctx.fillStyle = '#C084FC';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), x + badgeWidth / 2, y + 0.5);
  
  ctx.restore();
};

/**
 * Downloads a single Polaroid themed photo
 */
export const downloadSinglePolaroid = async (
  sub: PhotoSubmission,
  challengeTitle?: string
) => {
  const canvas = document.createElement('canvas');
  const width = 600;
  const height = 900;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Draw Background Space
  ctx.fillStyle = '#08080C';
  ctx.fillRect(0, 0, width, height);

  // Subtle radial gradient center glow
  const bgGlow = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, 600);
  bgGlow.addColorStop(0, 'rgba(99, 102, 241, 0.08)'); // indigo glow
  bgGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = bgGlow;
  ctx.fillRect(0, 0, width, height);

  // Draw futuristic grid lines
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.025)';
  ctx.lineWidth = 1;
  const gridSpacing = 25;
  for (let gx = 0; gx < width; gx += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, height);
    ctx.stroke();
  }
  for (let gy = 0; gy < height; gy += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(width, gy);
    ctx.stroke();
  }

  // Glowing Outer Neon Double Frame
  ctx.save();
  ctx.shadowColor = 'rgba(139, 92, 246, 0.4)';
  ctx.shadowBlur = 12;
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(10, 10, width - 20, height - 20);
  ctx.restore();

  // 2. Draw Polaroid Card frame (lighter charcoal board)
  ctx.fillStyle = '#12121A';
  ctx.beginPath();
  drawRoundRect(ctx, 30, 30, width - 60, height - 80, 20);
  ctx.fill();
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  drawRoundRect(ctx, 31, 31, width - 62, height - 82, 19);
  ctx.stroke();

  // Draw cyber crop brackets in 4 corners of the card
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
  ctx.lineWidth = 2;
  const cSize = 10;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(42 + cSize, 42); ctx.lineTo(42, 42); ctx.lineTo(42, 42 + cSize);
  ctx.stroke();
  // Top-right
  ctx.beginPath();
  ctx.moveTo(width - 42 - cSize, 42); ctx.lineTo(width - 42, 42); ctx.lineTo(width - 42, 42 + cSize);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(42 + cSize, height - 62); ctx.lineTo(42, height - 62); ctx.lineTo(42, height - 62 - cSize);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(width - 42 - cSize, height - 62); ctx.lineTo(width - 42, height - 62); ctx.lineTo(width - 42, height - 62 - cSize);
  ctx.stroke();

  // 3. Draw The Main Photo slot (with white photo boundary frame)
  const px = 50;
  const py = 50;
  const photoW = 500;
  const photoH = 510;

  // Thin clean borders around photo container
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 6;
  ctx.strokeRect(px - 3, py - 3, photoW + 6, photoH + 6);

  ctx.fillStyle = '#08080C';
  ctx.fillRect(px, py, photoW, photoH);

  // Draw captured image
  const img = await loadImage(sub.photoUrl);
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, photoW, photoH);
  ctx.clip();

  // Fit cover ratio
  const imgRatio = img.width / img.height;
  const destRatio = photoW / photoH;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (imgRatio > destRatio) {
    sw = img.height * destRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / destRatio;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, px, py, photoW, photoH);
  ctx.restore();

  // Outline of photo slot
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(px, py, photoW, photoH);

  // 4. Draw transparent tape at the top middle of photo
  drawTape(ctx, width / 2, 50, 110, 18, -0.03);

  // 5. Draw Footer elements (Typography & Ornaments)
  const title = challengeTitle || `Tantangan #${sub.challengeId}`;
  
  // Challenge capsule badge
  drawChallengeBadge(ctx, title, 60, 600);

  // Player Name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold italic 28px Georgia, serif';
  ctx.fillText(sub.playerName, 60, 650);

  // Tagged partners if any
  if (sub.detectedPlayers && sub.detectedPlayers.length > 1) {
    const tags = sub.detectedPlayers.filter(p => p !== sub.playerName).join(', ');
    if (tags) {
      ctx.fillStyle = '#818CF8'; // indigo-400
      ctx.font = 'italic 11px sans-serif';
      ctx.fillText(`with: ${tags}`, 60, 678);
    }
  }

  // Draw HIMA TRPL approved stamp seal
  drawStamp(ctx, 475, 630, 32);

  // Decorative divider line (dashed)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(60, 698);
  ctx.lineTo(width - 60, 698);
  ctx.stroke();
  ctx.setLineDash([]); // Reset line dash

  // Deep answer quote block
  const quoteBoxY = 712;
  const quoteBoxH = 78;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  drawRoundRect(ctx, 60, quoteBoxY, width - 120, quoteBoxH, 10);
  ctx.fill();
  ctx.stroke();

  // Quote symbols
  ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
  ctx.font = 'italic bold 48px Georgia, serif';
  ctx.fillText('“', 72, quoteBoxY + 38);

  // Quote text wrapped inside quote box
  ctx.fillStyle = '#CBD5E1';
  ctx.font = 'italic 13px Georgia, serif';
  wrapText(ctx, `"${sub.answer}"`, 105, quoteBoxY + 28, width - 180, 18, 2);

  // 6. Draw Barcode at the bottom
  drawBarcode(ctx, 60, 810, 110, 15);

  // Brand Name & HIMA TRPL signature
  ctx.fillStyle = '#E2E8F0';
  ctx.font = 'italic bold 16px Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText('titik.temu', width - 60, 822);

  ctx.fillStyle = '#475569';
  ctx.font = '9px monospace';
  ctx.fillText('HIMA TRPL BONDING 2026', width - 60, 836);

  // Reset text align
  ctx.textAlign = 'left';

  // 7. Save and trigger download
  const filename = `polaroid_${sub.playerName.replace(/\s+/g, '_')}_challenge_${sub.challengeId}.png`;
  triggerDownload(canvas.toDataURL('image/png'), filename);
};

/**
 * Downloads a vertical photo strip for a single player (collages their photos)
 */
export const downloadPhotoStrip = async (
  playerName: string,
  playerSubmissions: PhotoSubmission[],
  challengesList?: ChallengeInfo[]
) => {
  const subs = [...playerSubmissions].sort((a, b) => a.challengeId - b.challengeId);
  const photoCount = Math.min(subs.length, 4); // max 4 photos in a strip

  if (photoCount === 0) {
    alert('Belum ada foto dari kamu untuk dijadikan strip foto.');
    return;
  }

  const canvas = document.createElement('canvas');
  const width = 420;
  
  // Dynamic height based on photo count:
  // Header: 80px
  // Each photo section: 300px (270px photo + 30px gap/caption)
  // Footer: 120px
  const headerHeight = 80;
  const photoSectionHeight = 290;
  const footerHeight = 130;
  const height = headerHeight + (photoCount * photoSectionHeight) + footerHeight;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Draw Background
  ctx.fillStyle = '#08080C'; // Very dark/black
  ctx.fillRect(0, 0, width, height);

  // Styled frame border
  ctx.strokeStyle = '#1E1E2F';
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, width - 12, height - 12);

  // Gradient thin inner border
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)'; // violet-500/30
  ctx.lineWidth = 1;
  ctx.strokeRect(14, 14, width - 28, height - 28);

  // 2. Draw Header
  ctx.fillStyle = '#818CF8';
  ctx.font = 'italic bold 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('titik.temu', width / 2, 45);

  ctx.fillStyle = '#475569';
  ctx.font = '9px monospace';
  ctx.fillText('M E M O R Y   D I A R Y', width / 2, 60);

  // 3. Draw Photos
  const photoWidth = 360;
  const photoHeight = 250;
  const px = (width - photoWidth) / 2; // 30px padding

  const challenges = challengesList || DEFAULT_CHALLENGES;

  for (let i = 0; i < photoCount; i++) {
    const sub = subs[i];
    const py = headerHeight + (i * photoSectionHeight);

    // Photo Box Background
    ctx.fillStyle = '#12121A';
    ctx.fillRect(px, py, photoWidth, photoHeight);

    // Draw Image
    const img = await loadImage(sub.photoUrl);
    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, photoWidth, photoHeight);
    ctx.clip();

    // Cover crop
    const imgRatio = img.width / img.height;
    const destRatio = photoWidth / photoHeight;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (imgRatio > destRatio) {
      sw = img.height * destRatio;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / destRatio;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, px, py, photoWidth, photoHeight);
    ctx.restore();

    // Draw photo outline
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, photoWidth, photoHeight);

    // Draw mini index sticker in the corner
    ctx.fillStyle = 'rgba(99, 102, 241, 0.85)';
    ctx.fillRect(px + 10, py + 10, 24, 24);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${i + 1}`, px + 22, py + 22);
    ctx.textBaseline = 'alphabetic'; // reset

    // Draw challenge mini caption under this photo
    const chal = challenges.find(c => c.id === sub.challengeId);
    const caption = chal ? chal.title : `Tantangan ${sub.challengeId}`;
    
    ctx.fillStyle = '#64748B'; // gray-500
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(caption.toUpperCase(), px + 4, py + photoHeight + 18);
  }

  // 4. Draw Footer
  const fy = height - footerHeight;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, fy + 15);
  ctx.lineTo(width - 30, fy + 15);
  ctx.stroke();

  // Strip branding info
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'italic italic bold 24px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('titik.temu', width / 2, fy + 55);

  ctx.fillStyle = '#A1A1AA';
  ctx.font = '11px sans-serif';
  ctx.fillText(`Strip Foto untuk: ${playerName}`, width / 2, fy + 78);

  ctx.fillStyle = '#52525B';
  ctx.font = '9px monospace';
  ctx.fillText('HIMA TRPL BONDING EVENT • 2026', width / 2, fy + 98);

  // Download
  const filename = `strip_foto_${playerName.replace(/\s+/g, '_')}.png`;
  triggerDownload(canvas.toDataURL('image/png'), filename);
};

/**
 * Downloads a complete collage of all submissions in a beautiful grid (Host side)
 */
export const downloadGroupCollage = async (
  allSubmissions: PhotoSubmission[],
  challengesList?: ChallengeInfo[]
) => {
  const count = allSubmissions.length;
  if (count === 0) {
    alert('Belum ada foto terkumpul untuk dijadikan kolase kelompok.');
    return;
  }

  // Calculate dynamic grid dimensions
  // 1-2 photos: 2x1 grid
  // 3-4 photos: 2x2 grid
  // 5-9 photos: 3x3 grid
  // 10-16 photos: 4x4 grid
  // etc.
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);

  const canvasWidth = 1400;
  const padding = 60;
  const gap = 30;

  // Header height: 160px
  // Footer height: 100px
  const headerHeight = 160;
  const footerHeight = 110;

  // Cell width based on columns count
  const cellWidth = (canvasWidth - (padding * 2) - ((cols - 1) * gap)) / cols;
  // Polaroid height ratio is ~1.3 of width to leave text room inside the Polaroid card
  const cellHeight = cellWidth * 1.25;

  const canvasHeight = headerHeight + (rows * cellHeight) + ((rows - 1) * gap) + footerHeight;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Draw Background
  // Neon radial glow simulation
  const grad = ctx.createRadialGradient(
    canvasWidth / 2, canvasHeight / 2, 200, 
    canvasWidth / 2, canvasHeight / 2, canvasHeight
  );
  grad.addColorStop(0, '#0F0E17'); // slightly lighter purple-dark center
  grad.addColorStop(1, '#050508'); // dark edges
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Neon gradient outline
  const strokeGrad = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
  strokeGrad.addColorStop(0, '#8B5CF6'); // violet
  strokeGrad.addColorStop(0.5, '#EC4899'); // pink/rose
  strokeGrad.addColorStop(1, '#6366F1'); // indigo
  ctx.strokeStyle = strokeGrad;
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, canvasWidth - 16, canvasHeight - 16);

  // 2. Draw Header Branding
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'italic bold 42px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('titik.temu', canvasWidth / 2, 70);

  ctx.fillStyle = '#818CF8';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('G A L E R I   K E B E R S A M A N   -   H I M A   T R P L   2 0 2 6', canvasWidth / 2, 95);

  ctx.fillStyle = '#94A3B8';
  ctx.font = 'italic 14px Georgia, serif';
  ctx.fillText(`"Melebur Tanpa Jarak - Terkumpul ${count} Potret Kebersamaan"`, canvasWidth / 2, 122);

  // 3. Draw Grid Cells
  const challenges = challengesList || DEFAULT_CHALLENGES;

  for (let idx = 0; idx < count; idx++) {
    const sub = allSubmissions[idx];
    const r = Math.floor(idx / cols);
    const c = idx % cols;

    const cx = padding + c * (cellWidth + gap);
    const cy = headerHeight + r * (cellHeight + gap);

    // Draw Polaroid Frame
    ctx.fillStyle = '#161622';
    ctx.beginPath();
    ctx.roundRect(cx, cy, cellWidth, cellHeight, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Image slot inside polaroid card (top area of cell)
    const cardPadding = cellWidth * 0.06; // 6% padding
    const imgX = cx + cardPadding;
    const imgY = cy + cardPadding;
    const imgW = cellWidth - (cardPadding * 2);
    const imgH = cellHeight * 0.7; // 70% height of polaroid

    ctx.fillStyle = '#08080C';
    ctx.fillRect(imgX, imgY, imgW, imgH);

    // Draw Image
    const img = await loadImage(sub.photoUrl);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(imgX, imgY, imgW, imgH, 6);
    ctx.clip();

    // Crop center cover
    const imgRatio = img.width / img.height;
    const destRatio = imgW / imgH;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (imgRatio > destRatio) {
      sw = img.height * destRatio;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / destRatio;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, imgX, imgY, imgW, imgH);
    ctx.restore();

    // Draw Polaroid label at bottom of card
    const textY = cy + (cellHeight * 0.81);
    ctx.fillStyle = '#94A3B8';
    
    // Shorten challenge title if column size is too small
    const chal = challenges.find(ch => ch.id === sub.challengeId);
    let chalTitle = chal ? chal.title : `Tantangan ${sub.challengeId}`;
    if (cellWidth < 220) {
      chalTitle = `#${sub.challengeId}`;
    }
    
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(chalTitle.toUpperCase(), imgX, textY);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'italic italic bold 18px Georgia, serif';
    ctx.fillText(sub.playerName, imgX, textY + 22);

    // Draw deep answer quote in card if there's enough space
    if (cellWidth > 220) {
      ctx.fillStyle = '#CBD5E1';
      ctx.font = 'italic 10px Georgia, serif';
      wrapText(ctx, `"${sub.answer}"`, imgX, textY + 38, imgW, 14, 2);
    }
  }

  // 4. Draw Footer
  const fy = canvasHeight - footerHeight;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, fy + 10);
  ctx.lineTo(canvasWidth - padding, fy + 10);
  ctx.stroke();

  ctx.fillStyle = '#A1A1AA';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TitikTemu merupakan project kolaborasi HIMA TRPL untuk merekatkan kebersamaan.', canvasWidth / 2, fy + 45);

  ctx.fillStyle = '#52525B';
  ctx.font = '10px monospace';
  ctx.fillText('© 2026 HIMA TRPL • ALL RIGHTS RESERVED', canvasWidth / 2, fy + 65);

  // Download
  const filename = `titiktemu_family_collage_${Date.now()}.png`;
  triggerDownload(canvas.toDataURL('image/png'), filename);
};
