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

  // 1. Draw Background
  // Deep dark theme to match "titik.temu" style
  ctx.fillStyle = '#0D0D12';
  ctx.fillRect(0, 0, width, height);

  // Decorative subtle inner frame
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  // 2. Draw Polaroid Card frame (lighter dark gray)
  ctx.fillStyle = '#161622';
  ctx.beginPath();
  ctx.roundRect(30, 30, width - 60, height - 80, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)'; // indigo accent border
  ctx.lineWidth = 2;
  ctx.stroke();

  // 3. Draw The Main Photo
  const photoWidth = width - 100; // 500px
  const photoHeight = 550; // ratio approx 4:4.4, close to 4:5
  const px = 50;
  const py = 50;

  // Draw photo container background
  ctx.fillStyle = '#08080C';
  ctx.beginPath();
  ctx.roundRect(px, py, photoWidth, photoHeight, 8);
  ctx.fill();

  const img = await loadImage(sub.photoUrl);
  ctx.save();
  // Clip to image container with rounded corners
  ctx.beginPath();
  ctx.roundRect(px, py, photoWidth, photoHeight, 8);
  ctx.clip();

  // Draw image with cover aspect ratio
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

  // 4. Draw Neon tape overlay at the top middle of the photo
  ctx.fillStyle = 'rgba(244, 63, 94, 0.15)'; // soft rose glass tape
  ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
  ctx.lineWidth = 1;
  ctx.save();
  ctx.translate(width / 2, 40);
  ctx.rotate(-0.05); // slight angle
  ctx.fillRect(-60, -10, 120, 20);
  ctx.strokeRect(-60, -10, 120, 20);
  ctx.restore();

  // 5. Draw Footer Text (Polaroid bottom area)
  // Challenge Name / Title
  const title = challengeTitle || `Tantangan #${sub.challengeId}`;
  ctx.fillStyle = '#94A3B8'; // gray-400
  ctx.font = 'bold 12px monospace';
  ctx.fillText(title.toUpperCase(), 60, 640);

  // Player Name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'italic italic bold 28px Georgia, serif';
  ctx.fillText(sub.playerName, 60, 680);

  // Tagged partners if any
  if (sub.detectedPlayers && sub.detectedPlayers.length > 1) {
    const tags = sub.detectedPlayers.filter(p => p !== sub.playerName).join(', ');
    if (tags) {
      ctx.fillStyle = '#818CF8'; // indigo-400
      ctx.font = '11px sans-serif';
      ctx.fillText(`bersama: ${tags}`, 60, 705);
    }
  }

  // Divider line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, 725);
  ctx.lineTo(width - 60, 725);
  ctx.stroke();

  // Deep answer text (with wrapping)
  ctx.fillStyle = '#E2E8F0'; // gray-200
  ctx.font = 'italic 15px Georgia, serif';
  wrapText(ctx, `"${sub.answer}"`, 60, 755, width - 120, 22, 4);

  // Logo Brand printed at bottom right
  ctx.fillStyle = '#818CF8';
  ctx.font = 'italic bold 18px Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText('titik.temu', width - 60, 845);

  ctx.fillStyle = '#475569';
  ctx.font = '9px monospace';
  ctx.fillText('HIMA TRPL BONDING 2026', width - 60, 860);

  // Reset text align
  ctx.textAlign = 'left';

  // 6. Download file
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
