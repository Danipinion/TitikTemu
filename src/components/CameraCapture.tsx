import React, { useRef, useState, useEffect } from 'react';

interface CameraCaptureProps {
  onCapture: (file: File, previewUrl: string) => void;
  onReset?: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onReset }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize camera stream
  const startCamera = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Clean up previous stream if any
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      // Constraints prioritizing front camera
      const constraints = {
        video: {
          facingMode: 'user', // Defaults to front camera
          width: { ideal: 1080 },
          height: { ideal: 1350 }, // Social media aspect ratio (4:5) is great for journal vibes
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Wait for video metadata to load before playing
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((err) => {
            console.error('Video play error:', err);
          });
          setIsLoading(false);
        };
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setError(
        'Aduh, gak bisa akses kamera depan kamu. Coba cek izin permissions browser ya!'
      );
      setIsLoading(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      // Clean up camera stream when component unmounts
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use actual video source dimensions to capture full quality
    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;

    // Draw the current video frame onto canvas
    // Mirror horizontally for front-facing camera intuitive snapshot
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, width, height);
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform

    // Convert canvas image to Data URL for preview
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPreview(dataUrl);

    // Convert to file blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `challenge_capture_${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        onCapture(file, dataUrl);
      }
    }, 'image/jpeg', 0.85);

    // Turn off camera stream to save battery and resource
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleRetake = () => {
    setPreview(null);
    if (onReset) onReset();
    startCamera();
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Polaroid/Journal Frame Container */}
      <div className="relative w-full max-w-sm aspect-[4/5] bg-zinc-900 border border-white/10 rounded-2xl p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-md overflow-hidden flex flex-col justify-between">
        
        {/* Camera Viewport / Captured Image */}
        <div className="relative w-full flex-grow bg-black rounded-lg overflow-hidden border border-white/5 flex items-center justify-center">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 gap-3">
              {/* Spinner */}
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-mono tracking-wider animate-pulse">MEMBUKA KAMERA...</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-rose-300">
              <span className="text-3xl mb-2">📸💔</span>
              <p className="text-xs font-sans font-medium">{error}</p>
              <button 
                onClick={startCamera}
                className="mt-4 px-4 py-2 bg-indigo-600/30 border border-indigo-400/40 rounded-lg text-xs font-mono hover:bg-indigo-600/50 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* Canvas for rendering snapshot */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Live Viewfinder */}
          {!preview && !error && (
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
          )}

          {/* Snapshotted Preview */}
          {preview && (
            <img
              src={preview}
              alt="Challenge snapshot preview"
              className="w-full h-full object-cover"
            />
          )}

          {/* Subtly animated scanline / journal noise overlay */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.5))] mix-blend-overlay opacity-80" />
        </div>

        {/* Caption placeholder styled like a hand-written note */}
        <div className="mt-3 text-center py-2">
          <p className="text-xs font-mono text-zinc-400 tracking-wider">
            {preview ? '✨ MANTAP! TINGGAL JAWAB PERTANYAAN' : '📸 AMBIL FOTO KAMU SEKARANG'}
          </p>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="mt-6 flex justify-center gap-4 w-full max-w-sm">
        {!preview ? (
          <button
            onClick={handleCapture}
            disabled={isLoading || !!error}
            className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm rounded-xl border border-indigo-400/30 shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all transform active:scale-95"
          >
            <span className="text-base">📷</span> Ambil Foto
          </button>
        ) : (
          <button
            onClick={handleRetake}
            className="flex items-center justify-center gap-2 w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-sm rounded-xl border border-zinc-700 transition-all transform active:scale-95"
          >
            <span>🔄</span> Foto Ulang
          </button>
        )}
      </div>
    </div>
  );
};
