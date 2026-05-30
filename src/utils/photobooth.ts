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
  { id: 1, title: "📸 Capek Proker" },
  { id: 2, title: "💻 Anak Warnet" },
  { id: 3, title: "😭 Air Mata HIMA" },
  { id: 4, title: "🧥 Tuker Jaket" },
  { id: 5, title: "✌️ Peace & Blink" },
  { id: 6, title: "👀 Eye Contact" },
  { id: 7, title: "⛺ Sekre Vibes" },
  { id: 8, title: "🤫 Tahan Tawa" },
  { id: 9, title: "🤝 Solidarity Stack" },
  { id: 10, title: "🎉 Happiness Overload" },
];

// Helper to load image safely and return HTMLImageElement
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn("Failed to load image, using fallback:", src);
      // Create a fallback 300x300 canvas image to prevent crashing
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 375;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#151522";
        ctx.fillRect(0, 0, 300, 375);
        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 280, 355);

        ctx.fillStyle = "#6E6E80";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Gagal Memuat Foto", 150, 180);
        ctx.font = "10px monospace";
        ctx.fillText("CORS / File Tidak Ditemukan", 150, 205);
      }
      const dummyImg = new Image();
      dummyImg.onload = () => resolve(dummyImg);
      dummyImg.src = canvas.toDataURL("image/jpeg");
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
  maxLines: number = 3,
): number => {
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  let linesCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      linesCount++;
      if (linesCount >= maxLines) {
        ctx.fillText(line.trim() + "...", x, currentY);
        return currentY + lineHeight;
      }
      ctx.fillText(line, x, currentY);
      line = words[n] + " ";
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
  const link = document.createElement("a");
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
  r: number,
) => {
  if (typeof ctx.roundRect === "function") {
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
const drawStamp = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
) => {
  ctx.save();
  ctx.strokeStyle = "rgba(244, 63, 94, 0.75)"; // retro rose red
  ctx.lineWidth = Math.max(1.5, radius * 0.06);

  // Outer circular border
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Inner circular border
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.84, 0, Math.PI * 2);
  ctx.stroke();

  // Inner decorative text and lines
  ctx.fillStyle = "rgba(244, 63, 94, 0.75)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.15); // Authentic retro stamp tilt
  
  const fontSize1 = Math.max(7, Math.round(radius * 0.28));
  const fontSize2 = Math.max(5, Math.round(radius * 0.22));

  ctx.font = `bold ${fontSize1}px monospace`;
  ctx.fillText("APPROVED", 0, -radius * 0.12);
  ctx.font = `bold ${fontSize2}px sans-serif`;
  ctx.fillText("HIMA TRPL", 0, radius * 0.22);
  ctx.restore();

  ctx.restore();
};

// Helper to draw realistic barcode at the bottom
const drawBarcode = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  let currentX = x;
  const barcodePattern = [
    2, 1, 3, 1, 2, 4, 1, 2, 3, 2, 1, 2, 2, 1, 3, 1, 2, 1, 4, 2, 1, 3,
  ];

  let i = 0;
  while (currentX < x + width) {
    const barWidth = barcodePattern[i % barcodePattern.length];
    const isBlack = i % 2 === 0;
    if (isBlack) {
      ctx.fillRect(currentX, y, barWidth, height);
    }
    currentX += barWidth + 1;
    i++;
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.font = "7px monospace";
  ctx.textAlign = "left";
  ctx.fillText("TRPL-BONDING-2026", x, y + height + 9);
  ctx.restore();
};

// Helper to draw semi-transparent glassy washi tape
const drawTape = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  angle: number,
) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Semi-transparent color blend
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
  ctx.lineWidth = 1;

  // Draw base tape body
  ctx.fillRect(-width / 2, -height / 2, width, height);

  // Shiny glass refraction gradient
  const grad = ctx.createLinearGradient(
    -width / 2,
    -height / 2,
    width / 2,
    height / 2,
  );
  grad.addColorStop(0, "rgba(255, 255, 255, 0.18)");
  grad.addColorStop(0.5, "rgba(255, 255, 255, 0.04)");
  grad.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(-width / 2, -height / 2, width, height);

  // Draw detailed jagged/torn edges
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
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
const drawChallengeBadge = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
) => {
  ctx.save();
  ctx.font = "bold 9px monospace";
  const textWidth = ctx.measureText(text.toUpperCase()).width;
  const paddingH = 10;
  const badgeWidth = textWidth + paddingH * 2;
  const badgeHeight = 20;

  // Pill container
  ctx.fillStyle = "rgba(139, 92, 246, 0.15)"; // violet opacity
  ctx.strokeStyle = "rgba(139, 92, 246, 0.6)"; // violet border
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  drawRoundRect(ctx, x, y - badgeHeight / 2, badgeWidth, badgeHeight, 10);
  ctx.fill();
  ctx.stroke();

  // Text
  ctx.fillStyle = "#C084FC";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text.toUpperCase(), x + badgeWidth / 2, y + 0.5);

  ctx.restore();
};

/**
 * Downloads a single Polaroid themed photo
 */
export const downloadSinglePolaroid = async (
  sub: PhotoSubmission,
  challengeTitle?: string,
) => {
  const canvas = document.createElement("canvas");
  const width = 600;
  const height = 900;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 1. Draw Background Space
  ctx.fillStyle = "#08080C";
  ctx.fillRect(0, 0, width, height);

  // Subtle radial gradient center glow
  const bgGlow = ctx.createRadialGradient(
    width / 2,
    height / 2,
    50,
    width / 2,
    height / 2,
    600,
  );
  bgGlow.addColorStop(0, "rgba(99, 102, 241, 0.08)"); // indigo glow
  bgGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = bgGlow;
  ctx.fillRect(0, 0, width, height);

  // Draw futuristic grid lines
  ctx.strokeStyle = "rgba(99, 102, 241, 0.025)";
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
  ctx.shadowColor = "rgba(139, 92, 246, 0.4)";
  ctx.shadowBlur = 12;
  ctx.strokeStyle = "rgba(139, 92, 246, 0.2)";
  ctx.lineWidth = 1;
  ctx.strokeRect(10, 10, width - 20, height - 20);
  ctx.restore();

  // 2. Draw Polaroid Card frame (lighter charcoal board)
  ctx.fillStyle = "#12121A";
  ctx.beginPath();
  drawRoundRect(ctx, 30, 30, width - 60, height - 80, 20);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  drawRoundRect(ctx, 31, 31, width - 62, height - 82, 19);
  ctx.stroke();

  // Draw cyber crop brackets in 4 corners of the card
  ctx.strokeStyle = "rgba(99, 102, 241, 0.4)";
  ctx.lineWidth = 2;
  const cSize = 10;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(42 + cSize, 42);
  ctx.lineTo(42, 42);
  ctx.lineTo(42, 42 + cSize);
  ctx.stroke();
  // Top-right
  ctx.beginPath();
  ctx.moveTo(width - 42 - cSize, 42);
  ctx.lineTo(width - 42, 42);
  ctx.lineTo(width - 42, 42 + cSize);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(42 + cSize, height - 62);
  ctx.lineTo(42, height - 62);
  ctx.lineTo(42, height - 62 - cSize);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(width - 42 - cSize, height - 62);
  ctx.lineTo(width - 42, height - 62);
  ctx.lineTo(width - 42, height - 62 - cSize);
  ctx.stroke();

  // 3. Draw The Main Photo slot (with white photo boundary frame)
  const px = 50;
  const py = 50;
  const photoW = 500;
  const photoH = 510;

  // Thin clean borders around photo container
  ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
  ctx.lineWidth = 6;
  ctx.strokeRect(px - 3, py - 3, photoW + 6, photoH + 6);

  ctx.fillStyle = "#08080C";
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
  let sx = 0,
    sy = 0,
    sw = img.width,
    sh = img.height;
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
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 2;
  ctx.strokeRect(px, py, photoW, photoH);

  // 4. Draw transparent tape at the top middle of photo
  drawTape(ctx, width / 2, 50, 110, 18, -0.03);

  // 5. Draw Footer elements (Typography & Ornaments)
  const title = challengeTitle || `Tantangan #${sub.challengeId}`;

  // Challenge capsule badge
  drawChallengeBadge(ctx, title, 60, 600);

  // Player Name
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold italic 28px Georgia, serif";
  ctx.fillText(sub.playerName, 60, 650);

  // Tagged partners if any
  if (sub.detectedPlayers && sub.detectedPlayers.length > 1) {
    const tags = sub.detectedPlayers
      .filter((p) => p !== sub.playerName)
      .join(", ");
    if (tags) {
      ctx.fillStyle = "#818CF8"; // indigo-400
      ctx.font = "italic 11px sans-serif";
      ctx.fillText(`with: ${tags}`, 60, 678);
    }
  }

  // Draw HIMA TRPL approved stamp seal (enlarged for better legibility)
  drawStamp(ctx, 455, 620, 48);

  // Decorative divider line (dashed)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
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
  ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  drawRoundRect(ctx, 60, quoteBoxY, width - 120, quoteBoxH, 10);
  ctx.fill();
  ctx.stroke();

  // Quote symbols
  ctx.fillStyle = "rgba(139, 92, 246, 0.15)";
  ctx.font = "italic bold 48px Georgia, serif";
  ctx.fillText("“", 72, quoteBoxY + 38);

  // Quote text wrapped inside quote box
  ctx.fillStyle = "#CBD5E1";
  ctx.font = "italic 13px Georgia, serif";
  wrapText(ctx, `"${sub.answer}"`, 105, quoteBoxY + 28, width - 180, 18, 2);

  // 6. Draw Barcode at the bottom
  drawBarcode(ctx, 60, 810, 110, 15);

  // Brand Name & HIMA TRPL signature
  ctx.fillStyle = "#E2E8F0";
  ctx.font = "italic bold 16px Georgia, serif";
  ctx.textAlign = "right";
  ctx.fillText("titik.temu", width - 60, 822);

  ctx.fillStyle = "#475569";
  ctx.font = "9px monospace";
  ctx.fillText("HIMA TRPL BONDING 2026", width - 60, 836);

  // Reset text align
  ctx.textAlign = "left";

  // 7. Save and trigger download
  const filename = `polaroid_${sub.playerName.replace(/\s+/g, "_")}_challenge_${sub.challengeId}.png`;
  triggerDownload(canvas.toDataURL("image/png"), filename);
};

/**
 * Downloads a vertical photo strip for a single player (collages their photos)
 */
export const downloadPhotoStrip = async (
  playerName: string,
  playerSubmissions: PhotoSubmission[],
  challengesList?: ChallengeInfo[],
) => {
  const subs = [...playerSubmissions].sort(
    (a, b) => a.challengeId - b.challengeId,
  );

  if (subs.length === 0) {
    alert("Belum ada foto dari kamu untuk dijadikan strip foto.");
    return;
  }

  const chunkSize = 3;
  const totalStrips = Math.ceil(subs.length / chunkSize);

  for (let sIdx = 0; sIdx < totalStrips; sIdx++) {
    const chunkSubs = subs.slice(sIdx * chunkSize, (sIdx + 1) * chunkSize);
    const photoCount = chunkSubs.length;

    const canvas = document.createElement("canvas");
    const width = 420;

    // Dynamic height based on photo count:
    // Header: 80px
    // Each photo section: 290px (250px photo + 40px gap/caption)
    // Footer: 130px
    const headerHeight = 80;
    const photoSectionHeight = 290;
    const footerHeight = 130;
    const height = headerHeight + photoCount * photoSectionHeight + footerHeight;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    // 1. Draw Background
    ctx.fillStyle = "#08080C"; // Very dark/black
    ctx.fillRect(0, 0, width, height);

    // Styled frame border
    ctx.strokeStyle = "#1E1E2F";
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, width - 12, height - 12);

    // Gradient thin inner border
    ctx.strokeStyle = "rgba(139, 92, 246, 0.3)"; // violet-500/30
    ctx.lineWidth = 1;
    ctx.strokeRect(14, 14, width - 28, height - 28);

    // Draw background confetti & sparkle elements on strip
    const confettiColors = ["#8B5CF6", "#EC4899", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];
    for (let ci = 0; ci < 35; ci++) {
      const cx = 20 + Math.random() * (width - 40);
      const cy = Math.random() * height;
      
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.random() * Math.PI);
      ctx.fillStyle = confettiColors[ci % confettiColors.length];
      ctx.globalAlpha = 0.12 + Math.random() * 0.28;
      
      const shape = Math.floor(Math.random() * 3);
      if (shape === 0) {
        ctx.fillRect(-2.5, -2.5, 5, 5);
      } else if (shape === 1) {
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.lineWidth = 1;
        ctx.strokeStyle = confettiColors[ci % confettiColors.length];
        ctx.beginPath();
        ctx.moveTo(-3, 0); ctx.lineTo(3, 0);
        ctx.moveTo(0, -3); ctx.lineTo(0, 3);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Draw Header
    ctx.fillStyle = "#818CF8";
    ctx.font = "italic bold 22px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("titik.temu", width / 2, 45);

    ctx.fillStyle = "#475569";
    ctx.font = "9px monospace";
    const titleSuffix = sIdx > 0 ? `   ${sIdx + 1}` : "";
    ctx.fillText(`M E M O R Y   D I A R Y${titleSuffix}`, width / 2, 60);

    // 3. Draw Photos
    const photoWidth = 360;
    const photoHeight = 250;
    const px = (width - photoWidth) / 2; // 30px padding

    const challenges = challengesList || DEFAULT_CHALLENGES;

    for (let i = 0; i < photoCount; i++) {
      const sub = chunkSubs[i];
      const py = headerHeight + i * photoSectionHeight;

      // Photo Box Background
      ctx.fillStyle = "#12121A";
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
      let sx = 0,
        sy = 0,
        sw = img.width,
        sh = img.height;
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
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 2;
      ctx.strokeRect(px, py, photoWidth, photoHeight);

      // Draw absolute index sticker in the corner
      const absoluteIndex = sIdx * chunkSize + i + 1;
      ctx.fillStyle = "rgba(99, 102, 241, 0.85)";
      ctx.fillRect(px + 10, py + 10, 24, 24);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${absoluteIndex}`, px + 22, py + 22);
      ctx.textBaseline = "alphabetic"; // reset

      // Draw challenge mini caption under this photo
      const chal = challenges.find((c) => c.id === sub.challengeId);
      const caption = chal ? chal.title : `Tantangan ${sub.challengeId}`;

      ctx.fillStyle = "#64748B"; // gray-500
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(caption.toUpperCase(), px + 4, py + photoHeight + 18);
    }

    // Draw floating emoji stickers on strip (premium theme match)
    const stripStickers = [
      { emoji: "✨", x: 60, y: 40, size: 24, angle: -0.15 },
      { emoji: "📸", x: width - 60, y: 45, size: 22, angle: 0.2 },
      { emoji: "💖", x: 45, y: height - 60, size: 20, angle: -0.3 },
      { emoji: "🥳", x: width - 50, y: height - 55, size: 22, angle: 0.15 },
      { emoji: "🌟", x: 38, y: height / 2 - 80, size: 22, angle: 0.25 },
      { emoji: "🔥", x: width - 38, y: height / 2 + 60, size: 20, angle: -0.2 }
    ];

    stripStickers.forEach(stk => {
      if (stk.y < height) {
        ctx.save();
        ctx.translate(stk.x, stk.y);
        ctx.rotate(stk.angle);
        
        ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;

        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(0, 0, stk.size * 0.72, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        ctx.strokeStyle = "rgba(139, 92, 246, 0.25)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, stk.size * 0.65, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = `${stk.size}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(stk.emoji, 0, 1);
        
        ctx.restore();
      }
    });

    // 4. Draw Footer
    const fy = height - footerHeight;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, fy + 15);
    ctx.lineTo(width - 30, fy + 15);
    ctx.stroke();

    // Strip branding info
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "italic italic bold 24px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("titik.temu", width / 2, fy + 55);

    ctx.fillStyle = "#A1A1AA";
    ctx.font = "11px sans-serif";
    ctx.fillText(`Strip Foto untuk: ${playerName}`, width / 2, fy + 78);

    ctx.fillStyle = "#52525B";
    ctx.font = "9px monospace";
    ctx.fillText("HIMA TRPL BONDING EVENT • 2026", width / 2, fy + 98);

    // Download
    const filenameSuffix = sIdx > 0 ? `_${sIdx + 1}` : "";
    const filename = `strip_foto_${playerName.replace(/\s+/g, "_")}${filenameSuffix}.png`;
    triggerDownload(canvas.toDataURL("image/png"), filename);
  }
};

/**
 * Downloads a complete collage of all submissions in a beautiful grid (Host side)
 */
/**
 * Downloads a complete collage of all submissions in a beautiful grid (Host side)
 */
export const downloadGroupCollage = async (
  allSubmissions: PhotoSubmission[],
  _challengesList?: ChallengeInfo[],
) => {
  if (allSubmissions.length === 0) {
    alert("Belum ada foto terkumpul untuk dijadikan kolase kelompok.");
    return;
  }

  const chunkSize = 8;
  const totalCollages = Math.ceil(allSubmissions.length / chunkSize);

  for (let cIdx = 0; cIdx < totalCollages; cIdx++) {
    const chunkSubmissions = allSubmissions.slice(cIdx * chunkSize, (cIdx + 1) * chunkSize);
    const count = chunkSubmissions.length;

    // Calculate dynamic grid dimensions (Max columns = 4 since max count is 8)
    const cols = count <= 2 ? count : count <= 6 ? 3 : 4;
    const rows = Math.ceil(count / cols);

    const canvasWidth = 1400;
    const gap = 28;

    // Header height: 170px
    // Footer height: 130px
    const headerHeight = 170;
    const footerHeight = 130;

    // Compute cell width and cell height (4:3 aspect ratio for clean landscape photos)
    // X boundaries: from 80 to canvasWidth - 80 (width = 1240)
    const gridWidthLimit = canvasWidth - 160;
    const cellWidth = (gridWidthLimit - (cols - 1) * gap) / cols;
    const cellHeight = cellWidth * 0.75;

    const gridHeight = rows * cellHeight + (rows - 1) * gap;
    const canvasHeight = headerHeight + gridHeight + footerHeight;

    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    // 1. Draw Background
    // Neon radial glow simulation
    const grad = ctx.createRadialGradient(
      canvasWidth / 2,
      canvasHeight / 2,
      200,
      canvasWidth / 2,
      canvasHeight / 2,
      canvasHeight,
    );
    grad.addColorStop(0, "#0F0E17"); // slightly lighter center
    grad.addColorStop(1, "#050508"); // dark edges
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Simple clean separator lines for film negative boundary
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 0);
    ctx.lineTo(50, canvasHeight);
    ctx.moveTo(canvasWidth - 50, 0);
    ctx.lineTo(canvasWidth - 50, canvasHeight);
    ctx.stroke();

    // Draw background confetti & sparkle elements
    const confettiColors = ["#8B5CF6", "#EC4899", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];
    for (let ci = 0; ci < 100; ci++) {
      const cx = 60 + Math.random() * (canvasWidth - 120);
      const cy = Math.random() * canvasHeight;
      
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.random() * Math.PI);
      ctx.fillStyle = confettiColors[ci % confettiColors.length];
      ctx.globalAlpha = 0.15 + Math.random() * 0.35; // subtle background layer
      
      const shape = Math.floor(Math.random() * 3);
      if (shape === 0) {
        // Small rectangle
        ctx.fillRect(-3, -3, 6, 6);
      } else if (shape === 1) {
        // Tiny circle
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Sparkle star (cross)
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = confettiColors[ci % confettiColors.length];
        ctx.beginPath();
        ctx.moveTo(-4, 0); ctx.lineTo(4, 0);
        ctx.moveTo(0, -4); ctx.lineTo(0, 4);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Draw Film Sprockets on Left and Right borders (real photobooth film negative feel)
    ctx.save();
    ctx.fillStyle = "#060608"; // darker sidebar
    ctx.fillRect(0, 0, 50, canvasHeight);
    ctx.fillRect(canvasWidth - 50, 0, 50, canvasHeight);

    ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
    ctx.fillRect(0, 0, 50, canvasHeight);
    ctx.fillRect(canvasWidth - 50, 0, 50, canvasHeight);

    ctx.fillStyle = "#08080C"; // cut out appearance
    const sprocketH = 16;
    const sprocketW = 8;
    const sprocketGap = 35;
    for (let sy = 15; sy < canvasHeight - 15; sy += sprocketGap) {
      ctx.beginPath();
      drawRoundRect(ctx, 21, sy, sprocketW, sprocketH, 3);
      ctx.fill();

      ctx.beginPath();
      drawRoundRect(ctx, canvasWidth - 29, sy, sprocketW, sprocketH, 3);
      ctx.fill();
    }
    ctx.restore();

    // 3. Draw Header Branding
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "italic bold 42px Georgia, serif";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(139, 92, 246, 0.4)";
    ctx.shadowBlur = 12;
    ctx.fillText("titik.temu", canvasWidth / 2, 70);
    ctx.shadowBlur = 0; // reset shadow

    // Header pill badge
    ctx.font = "bold 9px monospace";
    const badgeTextSuffix = cIdx > 0 ? `   ${cIdx + 1}` : "";
    const badgeText = `KOLABORASI HIMA TRPL 2026 • PHOTOBOOTH BOARD${badgeTextSuffix}`;
    const badgeW = ctx.measureText(badgeText).width + 20;
    ctx.fillStyle = "rgba(139, 92, 246, 0.15)";
    ctx.strokeStyle = "rgba(139, 92, 246, 0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    drawRoundRect(ctx, (canvasWidth - badgeW) / 2, 90, badgeW, 20, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#C084FC";
    ctx.fillText(badgeText, canvasWidth / 2, 103);

    ctx.fillStyle = "#64748B";
    ctx.font = "italic 12px Georgia, serif";
    ctx.fillText(
      '"Melebur Tanpa Jarak - Mengukir Kenangan Bersama dalam Lembaran Potret"',
      canvasWidth / 2,
      138,
    );

    // Thin header-to-grid separator line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, 155);
    ctx.lineTo(canvasWidth - 80, 155);
    ctx.stroke();

    // 4. Draw Grid of Photos (Center aligned)
    const totalGridWidth = cols * cellWidth + (cols - 1) * gap;
    const startX = (canvasWidth - totalGridWidth) / 2;

    for (let idx = 0; idx < count; idx++) {
      const sub = chunkSubmissions[idx];
      const r = Math.floor(idx / cols);
      const c = idx % cols;

      const cx = startX + c * (cellWidth + gap);
      const cy = headerHeight + r * (cellHeight + gap);

      // Draw white photobooth borders around each picture
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      drawRoundRect(ctx, cx - 6, cy - 6, cellWidth + 12, cellHeight + 12, 4);
      ctx.fill();

      // Inside frame shadow/dark boundary
      ctx.fillStyle = "#08080C";
      ctx.fillRect(cx, cy, cellWidth, cellHeight);

      // Draw Image
      const img = await loadImage(sub.photoUrl);
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx, cy, cellWidth, cellHeight);
      ctx.clip();

      // Cover crop center
      const imgRatio = img.width / img.height;
      const destRatio = cellWidth / cellHeight;
      let sx = 0,
        sy = 0,
        sw = img.width,
        sh = img.height;
      if (imgRatio > destRatio) {
        sw = img.height * destRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / destRatio;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, cx, cy, cellWidth, cellHeight);
      ctx.restore();

      // Draw element overlay: random scrapbook accessories (stamps / tape)
      ctx.save();
      // Tape decorations on some photos
      if (idx % 3 === 0) {
        drawTape(ctx, cx + cellWidth / 2, cy - 2, 90, 14, 0.02);
      } else if (idx % 3 === 1) {
        drawTape(ctx, cx + 15, cy + 5, 75, 14, -0.5);
      } else {
        drawTape(ctx, cx + cellWidth - 15, cy + 5, 75, 14, 0.5);
      }

      // Approved stamp overlay on bottom right of some photos (enlarged)
      if (idx % 4 === 1) {
        drawStamp(ctx, cx + cellWidth - 25, cy + cellHeight - 25, 38);
      }

      // Mini barcode label overlay on bottom left of some photos
      if (idx % 4 === 3) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.beginPath();
        drawRoundRect(ctx, cx + 12, cy + cellHeight - 20, 60, 14, 3);
        ctx.fill();
        drawBarcode(ctx, cx + 17, cy + cellHeight - 16, 50, 7);
      }
      ctx.restore();
    }

    // 5. Draw Footer
    const fy = canvasHeight - footerHeight;

    // Thin grid-to-footer separator line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, fy + 10);
    ctx.lineTo(canvasWidth - 80, fy + 10);
    ctx.stroke();

    // Draw brand footer elements
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "italic italic bold 28px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("titik.temu", canvasWidth / 2, fy + 55);

    ctx.fillStyle = "#64748B";
    ctx.font = "bold 9px monospace";
    ctx.fillText(
      "HIMA TRPL BONDING EVENT • MEMORY SOUVENIR BOARD",
      canvasWidth / 2,
      fy + 75,
    );

    // Draw a centered stylish barcode in the footer
    drawBarcode(ctx, (canvasWidth - 140) / 2, fy + 88, 140, 18);

    // Draw premium floating emoji stickers with abstract / varying sizes
    const stickers = [
      { emoji: "✨", x: 200, y: 70, size: 36, angle: -0.2 }, // big sparkle
      { emoji: "🎉", x: 300, y: 120, size: 20, angle: 0.3 }, // small party popper
      { emoji: "📸", x: 1000, y: 80, size: 34, angle: 0.15 }, // big camera
      { emoji: "💖", x: 1150, y: 130, size: 18, angle: -0.4 }, // small heart
      { emoji: "✌️", x: 90, y: 220, size: 32, angle: 0.25 },
      { emoji: "🥳", x: 1110, y: 300, size: 26, angle: -0.15 },
      { emoji: "💻", x: 100, y: canvasHeight - 200, size: 22, angle: -0.2 },
      { emoji: "⛺", x: 1110, y: canvasHeight - 240, size: 30, angle: 0.3 },
      { emoji: "🤝", x: 220, y: canvasHeight - 75, size: 24, angle: -0.1 },
      { emoji: "🚀", x: 960, y: canvasHeight - 65, size: 35, angle: 0.2 },
      { emoji: "🔥", x: 1120, y: canvasHeight / 2, size: 19, angle: 0.1 },
      { emoji: "🌟", x: 80, y: canvasHeight / 2 - 100, size: 38, angle: -0.3 }
    ];

    // Add extra random organic sticker elements with abstract/varied sizes
    const extraEmojis = ["✨", "💖", "🌟", "🎉", "🔥", "👀", "🌸", "⭐"];
    for (let k = 0; k < 8; k++) {
      const rx = 80 + Math.random() * (canvasWidth - 160);
      const ry = 150 + Math.random() * (canvasHeight - 280);
      const rSize = 16 + Math.random() * 22; // 16px to 38px
      const rAngle = (Math.random() - 0.5) * 0.8;
      
      stickers.push({
        emoji: extraEmojis[k % extraEmojis.length],
        x: rx,
        y: ry,
        size: Math.round(rSize),
        angle: rAngle
      });
    }

    stickers.forEach(stk => {
      if (stk.y < canvasHeight) {
        ctx.save();
        ctx.translate(stk.x, stk.y);
        ctx.rotate(stk.angle);
        
        // Shadow for sticker depth
        ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 3;

        // Draw a solid white rounded outline/cutout for sticker effect
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(0, 0, stk.size * 0.72, 0, Math.PI * 2);
        ctx.fill();

        // Reset shadow for emoji drawing so text shadow doesn't look weird
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Draw thin inner boundary on the sticker cutout
        ctx.strokeStyle = "rgba(139, 92, 246, 0.25)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, stk.size * 0.65, 0, Math.PI * 2);
        ctx.stroke();

        // Draw emoji
        ctx.font = `${stk.size}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(stk.emoji, 0, 1.5);
        
        ctx.restore();
      }
    });

    // Trigger download for this chunk/part
    const filenameSuffix = cIdx > 0 ? `_${cIdx + 1}` : "";
    const filename = `titiktemu_himpunan_board_${Date.now()}${filenameSuffix}.png`;
    triggerDownload(canvas.toDataURL("image/png"), filename);
  }
};
