import React, { useState, useEffect } from "react";
import { CameraCapture } from "./CameraCapture";
import { useWebsocket } from "../hooks/useWebsocket";
import {
  downloadSinglePolaroid,
  downloadPhotoStrip,
} from "../utils/photobooth";

const CHALLENGES = [
  {
    id: 1,
    title: "📸 Capek Proker",
    description:
      'Foto muka paling "capek ngerjain proker" bareng kating (kakak tingkat).',
    question:
      "Jujur, apa satu hal yang bikin kamu merasa sungkan buat ngobrol sama kating/adik tingkat?",
  },
  {
    id: 2,
    title: "💻 Anak Warnet",
    description:
      'Pose ala "anak warnet" bareng divisi yang paling jarang kamu ajak ngobrol.',
    question: "First impression kamu ke divisi mereka vs realitanya gimana?",
  },
  {
    id: 3,
    title: "😭 Air Mata HIMA",
    description: "Selfie pura-pura menangis sambil meluk Ketua HIMA atau BPH.",
    question:
      "Kalau kamu jadi Ketua HIMA sehari, beban apa yang menurutmu paling berat dipikul dia?",
  },
  {
    id: 4,
    title: "🧥 Tuker Jaket",
    description: "Foto tukeran gaya/jaket himpunan sama temen beda angkatan.",
    question:
      'Momen apa yang bikin kamu sempet ngerasa "Ah, gue pengen mundur aja dari proker ini"?',
  },
  {
    id: 5,
    title: "✌️ Peace & Blink",
    description: "Pose peace (✌️) sambil merem bareng partner divisimu.",
    question:
      "Apa satu hal kecil dari partner kamu yang diam-diam kamu apresiasi banget?",
  },
  {
    id: 6,
    title: "👀 Eye Contact",
    description:
      "Selfie setengah muka (mata ke atas) bareng anak divisi Humas/Komed.",
    question:
      "Pesan apa yang selama ini pengen kamu sampein ke forum tapi selalu tertahan?",
  },
  {
    id: 7,
    title: "⛺ Sekre Vibes",
    description:
      "Gaya andalan pas lagi nongkrong di sekre, bareng 3 orang random.",
    question:
      'Menurutmu, ruang sekre kita udah jadi "rumah" yang nyaman belum? Kenapa?',
  },
  {
    id: 8,
    title: "🤫 Tahan Tawa",
    description:
      "Foto nahan tawa saling tatap 5 detik sama orang yang beda angkatan.",
    question:
      "Hal paling konyol/lucu apa yang pernah kamu alami selama ada di HIMA?",
  },
  {
    id: 9,
    title: "🤝 Solidarity Stack",
    description:
      "Foto tangan tos bertumpuk (kayak tim olahraga sebelum tanding).",
    question: "Harapan paling jujur buat HIMA TRPL ke depannya apa?",
  },
  {
    id: 10,
    title: "🎉 Happiness Overload",
    description: "Foto gaya bebas (paling lepas/bahagia) sekelompok besar.",
    question:
      'Setelah ngelewatin sesi ini, masih ngerasa ada "gap" nggak di antara kita?',
  },
];

export const PlayerView: React.FC = () => {
  const [pin, setPin] = useState(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("pin");
      return p && p.length === 4 && /^\d+$/.test(p) ? p : "";
    }
    return "";
  });
  const isPinPrefilled =
    typeof window !== "undefined" &&
    (() => {
      const p = new URLSearchParams(window.location.search).get("pin");
      return !!(p && p.length === 4 && /^\d+$/.test(p));
    })();
  const [name, setName] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [activeChallengeIndex, setActiveChallengeIndex] = useState(0); // 0 = Waiting Lobby

  // Face Registration states
  const [registeredFace, setRegisteredFace] = useState<string | null>(null);
  const [showFaceRegister, setShowFaceRegister] = useState(false);

  // Player state within the active challenge
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [deepAnswer, setDeepAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedCurrent, setHasSubmittedCurrent] = useState(false);

  // Face verification / AI matching states
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanCompleted, setScanCompleted] = useState(false);

  // Gallery submissions from climax state
  const [gallerySubmissions, setGallerySubmissions] = useState<any[]>([]);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);

  // Initialize Websocket hook
  const { isConnected, sendSubmission, playersList } = useWebsocket({
    pin: isJoined ? pin : "",
    name,
    role: "player",
    identityPhoto: registeredFace || "",
    onChallengeChanged: (newIndex, subs) => {
      if (subs) {
        setGallerySubmissions(subs);
      } else if (newIndex === 0) {
        setGallerySubmissions([]);
      }
      setActiveChallengeIndex((prevIndex) => {
        // Only wipe progress if the host actually changed the challenge index
        if (prevIndex !== newIndex) {
          setCapturedFile(null);
          setCapturedPreview(null);
          setDeepAnswer("");
          setHasSubmittedCurrent(false);
          setSelectedPartners([]);
          setScanCompleted(false);
        }
        return newIndex;
      });
    },
  });

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 4 && name.trim()) {
      setShowFaceRegister(true);
    }
  };

  const handleCapture = (_file: File, previewUrl: string) => {
    setCapturedFile(_file);
    setCapturedPreview(previewUrl);
  };

  // Run mock AI face scanning on challenge capture
  useEffect(() => {
    if (capturedFile && !scanCompleted) {
      setIsScanning(true);
      const timer = setTimeout(() => {
        setIsScanning(false);
        setScanCompleted(true);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [capturedFile, scanCompleted]);

  const handleSubmit = async () => {
    if (!capturedFile || !deepAnswer.trim() || selectedPartners.length === 0)
      return;

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const simulatedPhotoUrl =
        capturedPreview ||
        "https://images.unsplash.com/photo-1543002588-bfa74002ed7e";

      // Send via WebSocket to sync Host board instantly
      sendSubmission(activeChallengeIndex, simulatedPhotoUrl, deepAnswer, [
        name,
        ...selectedPartners,
      ]);

      setHasSubmittedCurrent(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rendering screen 1b: Face Registration selfie
  if (showFaceRegister) {
    return (
      <div className="min-h-screen bg-[#0D0D11] text-zinc-100 flex flex-col justify-between p-6 font-sans relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[60%] rounded-full bg-violet-900/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[50%] rounded-full bg-rose-900/10 blur-[100px]" />

        <div className="w-full flex-grow flex flex-col justify-center max-w-sm mx-auto space-y-6 z-10">
          <div className="text-center">
            <span className="text-[10px] font-mono text-violet-400 tracking-widest uppercase">
              TAHAP REGISTRASI WAJAH
            </span>
            <h2 className="text-2xl font-serif text-white italic mt-1">
              Daftarkan Wajahmu
            </h2>
            <p className="text-xs text-zinc-400 mt-2 max-w-xs mx-auto leading-relaxed">
              Ambil selfie mandiri untuk mendaftarkan wajah unikmu di sistem AI
              TitikTemu sebelum mulai bonding.
            </p>
          </div>

          {!registeredFace ? (
            <div className="space-y-4">
              <CameraCapture
                onCapture={(_file, previewUrl) => {
                  setRegisteredFace(previewUrl);
                }}
              />
            </div>
          ) : (
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-6 text-center space-y-6 animate-[fadeIn_0.4s_ease-out] shadow-2xl">
              <div className="w-40 h-40 mx-auto rounded-full overflow-hidden border-2 border-emerald-500/50 relative shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <img
                  src={registeredFace}
                  alt="Registered Selfie"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-emerald-950/20 flex items-center justify-center">
                  <span className="text-4xl text-emerald-400 animate-pulse">
                    ✓
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">
                  VERIFIKASI WAJAH BERHASIL
                </span>
                <p className="text-xs font-sans text-zinc-300">
                  Model AI berhasil meregistrasi wajah {name}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setRegisteredFace(null)}
                  className="flex-1 py-3 bg-zinc-900 border border-white/10 text-zinc-400 font-semibold text-xs rounded-xl hover:bg-zinc-800 transition-colors"
                >
                  Ulangi Foto
                </button>
                <button
                  onClick={() => {
                    setIsJoined(true);
                    setShowFaceRegister(false);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all"
                >
                  Masuk Sesi Bonding
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center py-4 z-10">
          <p className="text-[10px] font-mono text-zinc-600">
            TitikTemu • HIMA TRPL 2026
          </p>
        </div>
      </div>
    );
  }

  // Rendering screen 1: Join Lobby Form
  if (!isJoined) {
    return (
      <div className="min-h-screen bg-[#0D0D11] text-zinc-100 flex flex-col justify-between p-6 font-sans relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[60%] rounded-full bg-violet-900/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[50%] rounded-full bg-rose-900/10 blur-[100px]" />

        <div className="w-full flex-grow flex flex-col justify-center max-w-sm mx-auto">
          {/* Logo Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-serif tracking-tight text-white mb-2 italic">
              titik.temu
            </h1>
            <p className="text-xs font-mono text-zinc-500 tracking-widest uppercase">
              HIMA TRPL Bonding Event
            </p>
          </div>

          {/* Join Panel Card */}
          <form
            onSubmit={handleJoin}
            className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6"
          >
            <div>
              <label className="block text-[11px] font-mono tracking-widest text-zinc-400 uppercase mb-2">
                Room PIN (4 Digit)
              </label>
              {isPinPrefilled ? (
                <div className="w-full bg-violet-950/20 border border-violet-500/30 rounded-xl px-4 py-3.5 text-center text-2xl font-mono tracking-widest text-violet-300 flex items-center justify-center gap-2 select-none">
                  <span>🔒</span> {pin}
                </div>
              ) : (
                <input
                  type="text"
                  maxLength={4}
                  required
                  placeholder="0000"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-[#16161F]/60 border border-white/10 rounded-xl px-4 py-3.5 text-center text-2xl font-mono tracking-widest text-white focus:outline-none focus:border-violet-500 transition-colors"
                />
              )}
            </div>

            <div>
              <label className="block text-[11px] font-mono tracking-widest text-zinc-400 uppercase mb-2">
                Nama Panggilan
              </label>
              <input
                type="text"
                required
                placeholder="Robby"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#16161F]/60 border border-white/10 rounded-xl px-4 py-3.5 text-zinc-200 focus:outline-none focus:border-violet-500 transition-colors placeholder:text-zinc-600 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={pin.length < 4 || !name.trim()}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm rounded-xl border border-indigo-400/30 shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all active:scale-[0.98]"
            >
              Masuk Kamar
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center py-4">
          <p className="text-[10px] font-mono text-zinc-600">
            TitikTemu • HIMA TRPL 2026
          </p>
        </div>
      </div>
    );
  }

  // Rendering screen 2: Connected but Host has not started (Stage = 0)
  if (activeChallengeIndex === 0) {
    return (
      <div className="min-h-screen bg-[#0D0D11] text-zinc-100 flex flex-col justify-between p-6 font-sans relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] rounded-full bg-violet-900/10 blur-[80px]" />

        <div className="w-full flex-grow flex flex-col justify-center items-center text-center max-w-sm mx-auto">
          {/* Floating reflective disk */}
          <div className="relative w-36 h-36 rounded-full bg-gradient-to-tr from-violet-950/40 via-indigo-900/40 to-rose-950/40 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex items-center justify-center mb-6 animate-[pulse_3s_infinite]">
            <div className="w-28 h-28 rounded-full border border-white/5 bg-[#0D0D11] flex flex-col items-center justify-center p-4">
              {registeredFace ? (
                <img
                  src={registeredFace}
                  alt="My profile selfie"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-4xl animate-bounce">☕</span>
              )}
            </div>
            <div className="absolute inset-0 rounded-full border-t border-indigo-500/40 animate-spin" />
          </div>

          <h2 className="text-2xl font-serif text-white italic mb-1">
            Halo, {name}!
          </h2>
          <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
            Kamu berhasil terdaftar di Room{" "}
            <span className="font-mono text-violet-400 font-bold bg-violet-950/40 px-2 py-0.5 rounded border border-violet-800/30">
              {pin}
            </span>
            .
          </p>

          <div className="mt-4 px-4 py-2 rounded-full bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono animate-pulse flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>{" "}
            Terhubung, Menunggu Host Memulai...
          </div>

          {/* List of other connected players in lobby */}
          <div className="mt-8 w-full">
            <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-3 text-left">
              Teman Himpunan di Lobby ({playersList.length})
            </span>
            {playersList.length <= 1 ? (
              <p className="text-xs font-serif text-zinc-600 italic text-left">
                Belum ada orang lain yang bergabung...
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-3 bg-white/5 border border-white/5 rounded-2xl p-4">
                {playersList
                  .filter((p) => p.name !== name)
                  .map((player, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center space-y-1 animate-[fadeIn_0.3s_ease-out]"
                    >
                      <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-zinc-900 relative">
                        {player.identityPhoto ? (
                          <img
                            src={player.identityPhoto}
                            alt={player.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] text-zinc-600 flex items-center justify-center h-full font-mono uppercase">
                            {player.name.slice(0, 2)}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-mono text-zinc-400 truncate max-w-full text-center">
                        {player.name}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="text-center py-4">
          <p className="text-[10px] font-mono text-zinc-600">
            {isConnected ? "Sync Active" : "Connecting to websocket..."}
          </p>
        </div>
      </div>
    );
  }

  // Rendering screen 3a: Climax Gallery (activeChallengeIndex === 11)
  if (activeChallengeIndex === 11) {
    const personalizedSubmissions = gallerySubmissions.filter((sub) => {
      const targetName = name.trim().toLowerCase();
      const isOwner = sub.playerName.trim().toLowerCase() === targetName;
      const isTagged =
        sub.detectedPlayers &&
        sub.detectedPlayers.some(
          (p: string) => p.trim().toLowerCase() === targetName,
        );
      return isOwner || isTagged;
    });

    return (
      <div className="min-h-screen bg-[#08080C] text-zinc-100 flex flex-col p-6 font-sans relative overflow-x-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[60%] rounded-full bg-violet-900/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[50%] rounded-full bg-rose-900/10 blur-[100px] pointer-events-none" />

        <div className="w-full max-w-sm mx-auto flex-grow flex flex-col space-y-6 z-10 py-6">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-mono text-indigo-400 tracking-widest uppercase">
              GALERI KEBERSAMAAN KAMU
            </span>
            <h2 className="text-2xl font-serif text-white italic">
              Memory Diary {name} ✨
            </h2>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
              Berikut adalah momen keseruan yang melibatkan kamu.
            </p>
          </div>

          {personalizedSubmissions.length > 0 && (
            <button
              onClick={() =>
                downloadPhotoStrip(name, personalizedSubmissions, CHALLENGES)
              }
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all flex items-center justify-center gap-2 transform active:scale-95"
            >
              <span className="text-sm">🎞️</span> Unduh Strip Foto Saya
            </button>
          )}

          {/* Personalized Masonry/Grid of Polaroids */}
          {personalizedSubmissions.length === 0 ? (
            <div className="flex-grow flex flex-col justify-center items-center text-center p-8 border border-dashed border-white/10 rounded-3xl bg-zinc-900/5 my-auto">
              <span className="text-5xl mb-4 animate-pulse">🖼️</span>
              <h2 className="text-base font-serif italic text-zinc-400">
                Belum ada momen kamu.
              </h2>
              <p className="text-xs text-zinc-500 max-w-xs mt-1 leading-relaxed">
                Kamu belum mengirim foto atau ditag oleh kawanmu. Tetap pantau
                layar Host untuk melihat seluruh karya kelompok!
              </p>
            </div>
          ) : (
            <div className="space-y-6 overflow-y-auto max-h-[70vh] p-1 pb-10">
              {personalizedSubmissions.map((sub, idx) => {
                const challengeTitle =
                  CHALLENGES[sub.challengeId - 1]?.title || "Tantangan";
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedSub(sub)}
                    className="bg-[#12121A]/85 border border-white/5 hover:border-violet-500/40 rounded-2xl p-4 shadow-xl hover:shadow-[0_12px_40px_rgba(139,92,246,0.22)] transition-all duration-300 flex flex-col justify-between group relative overflow-hidden cursor-pointer"
                  >
                    {/* Visual Polaroid Tape */}
                    <div className="absolute top-[16px] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-4 bg-white/10 border-l border-r border-dashed border-white/20 backdrop-blur-[2px] rotate-[-2deg] z-10 pointer-events-none shadow-[0_1px_3px_rgba(0,0,0,0.1)]" />

                    {/* Corner crop brackets */}
                    <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-violet-500/30 pointer-events-none" />
                    <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-violet-500/30 pointer-events-none" />
                    <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-violet-500/30 pointer-events-none" />
                    <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-violet-500/30 pointer-events-none" />

                    {/* Photo frame wrapper */}
                    <div className="p-1 bg-[#09090D] border border-white/5 rounded-xl aspect-[4/5] relative overflow-hidden group-hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-shadow duration-300">
                      <img
                        src={sub.photoUrl}
                        alt="Polaroid"
                        className="w-full h-full object-cover rounded-lg"
                      />

                      {/* Face recognition tags overlay */}
                      {sub.detectedPlayers &&
                        sub.detectedPlayers.length > 0 && (
                          <div className="absolute bottom-2 left-2 right-2 px-1.5 py-0.5 bg-indigo-950/80 backdrop-blur-md rounded text-[8px] font-mono text-indigo-300 border border-indigo-500/20 truncate">
                            👥 {sub.detectedPlayers.join(", ")}
                          </div>
                        )}
                    </div>

                    {/* Card metadata & text */}
                    <div className="mt-4 space-y-3">
                      {/* Challenge capsule & stamp */}
                      <div className="flex justify-between items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-violet-950/40 border border-violet-500/30 text-violet-300 rounded-full text-[8px] font-mono tracking-wider font-semibold uppercase truncate max-w-[130px]">
                          {challengeTitle}
                        </span>
                        
                        {/* Approved Stamp */}
                        <div className="w-7 h-7 rounded-full border border-dashed border-rose-500/40 flex items-center justify-center text-[5px] font-mono text-rose-400 rotate-[-12deg] bg-rose-950/5 flex-shrink-0">
                          APPROVED
                        </div>
                      </div>

                      {/* Player name */}
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="text-xs font-serif italic text-white font-bold truncate">
                          {sub.playerName}
                        </span>
                      </div>

                      {/* Answer section */}
                      <div className="flex justify-between items-start gap-2 border-t border-white/5 pt-2.5">
                        <p className="text-[11px] font-sans text-zinc-300 italic leading-relaxed line-clamp-2 flex-grow">
                          "{sub.answer}"
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadSinglePolaroid(sub, challengeTitle);
                          }}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-colors flex-shrink-0"
                          title="Download Polaroid"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.5"
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Barcode & Brand footer */}
                      <div className="flex justify-between items-center pt-1 border-t border-white/5 opacity-50">
                        {/* CSS Barcode */}
                        <div className="flex items-center gap-[1px]">
                          <div className="w-[1.5px] h-2.5 bg-white"></div>
                          <div className="w-[1px] h-2.5 bg-white"></div>
                          <div className="w-[2.5px] h-2.5 bg-white"></div>
                          <div className="w-[1px] h-2.5 bg-white"></div>
                          <div className="w-[1.5px] h-2.5 bg-white"></div>
                          <div className="w-[3px] h-2.5 bg-white"></div>
                          <div className="w-[1px] h-2.5 bg-white"></div>
                        </div>
                        <span className="text-[8px] font-serif italic text-zinc-500">
                          titik.temu
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Polaroid detail modal */}
        {selectedSub && (
          <div
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-6"
            onClick={() => setSelectedSub(null)}
          >
            <div
              className="max-w-sm w-full bg-[#12121A] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Visual Polaroid Tape */}
              <div className="absolute top-[22px] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-28 h-5 bg-white/10 border-l border-r border-dashed border-white/20 backdrop-blur-[2px] rotate-[-2deg] z-10 pointer-events-none shadow-[0_1px_3px_rgba(0,0,0,0.15)]" />

              {/* Corner crop brackets */}
              <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-violet-500/35 pointer-events-none" />
              <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-violet-500/35 pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-violet-500/35 pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-violet-500/35 pointer-events-none" />

              <button
                onClick={() => setSelectedSub(null)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white font-mono text-[10px] tracking-wider z-20"
              >
                ✕ Tutup
              </button>

              {/* Photo frame wrapper */}
              <div className="p-1 bg-[#09090D] border border-white/5 rounded-2xl aspect-[4/5] relative overflow-hidden shadow-inner mt-4">
                <img
                  src={selectedSub.photoUrl}
                  alt="Detail"
                  className="w-full h-full object-cover rounded-xl"
                />
                
                {/* Face recognition tags overlay inside photo */}
                {selectedSub.detectedPlayers &&
                  selectedSub.detectedPlayers.length > 0 && (
                    <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1">
                      {selectedSub.detectedPlayers.map(
                        (pn: string, pidx: number) => (
                          <span
                            key={pidx}
                            className="px-2 py-0.5 bg-emerald-950/85 border border-emerald-500/25 backdrop-blur-md rounded-md text-[8px] font-mono text-emerald-300"
                          >
                            ✓ {pn}
                          </span>
                        ),
                      )}
                    </div>
                  )}
              </div>

              {/* Card metadata & details */}
              <div className="space-y-4">
                {/* Challenge title & Approved stamp */}
                <div className="flex justify-between items-center">
                  <span className="px-3 py-1 bg-violet-950/50 border border-violet-500/35 text-violet-300 rounded-full text-[9px] font-mono tracking-widest font-bold uppercase truncate max-w-[170px]">
                    {CHALLENGES[selectedSub.challengeId - 1]?.title || "TANTANGAN"}
                  </span>
                  
                  {/* Approved stamp */}
                  <div className="w-9 h-9 rounded-full border-2 border-dashed border-rose-500/50 flex flex-col items-center justify-center text-[6px] font-mono text-rose-400 rotate-[-12deg] bg-rose-950/10 font-bold">
                    <span>TRPL</span>
                    <span className="text-[5px]">APPROVED</span>
                  </div>
                </div>

                {/* Player details */}
                <div>
                  <span className="text-[8px] font-mono text-indigo-400 tracking-widest uppercase">
                    OLEH
                  </span>
                  <h3 className="text-xl font-serif text-white italic font-bold">
                    {selectedSub.playerName}
                  </h3>
                </div>

                {/* Answer box */}
                <div className="relative bg-[#181825] border border-white/5 rounded-2xl p-4 shadow-inner">
                  <span className="absolute top-1 left-2 text-violet-500/20 font-serif italic text-4xl select-none">“</span>
                  <p className="text-xs font-sans text-zinc-300 leading-relaxed italic relative pl-4">
                    "{selectedSub.answer}"
                  </p>
                </div>

                {/* Barcode & Brand footer */}
                <div className="flex justify-between items-end pt-2 border-t border-white/5">
                  <div className="space-y-1">
                    {/* CSS Barcode */}
                    <div className="flex items-center gap-[1px] opacity-60">
                      <div className="w-[2px] h-3.5 bg-white"></div>
                      <div className="w-[1px] h-3.5 bg-white"></div>
                      <div className="w-[3px] h-3.5 bg-white"></div>
                      <div className="w-[1px] h-3.5 bg-white"></div>
                      <div className="w-[2px] h-3.5 bg-white"></div>
                      <div className="w-[4px] h-3.5 bg-white"></div>
                      <div className="w-[1px] h-3.5 bg-white"></div>
                      <div className="w-[2px] h-3.5 bg-white"></div>
                    </div>
                    <span className="block text-[7px] font-mono text-zinc-500 uppercase tracking-widest">
                      TRPL-BONDING-2026
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="block text-sm font-serif italic font-bold text-white leading-none">
                      titik.temu
                    </span>
                    <span className="text-[8px] font-mono text-zinc-500">
                      BONDING SOUVENIR
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const chal = CHALLENGES[selectedSub.challengeId - 1];
                    downloadSinglePolaroid(
                      selectedSub,
                      chal ? chal.title : undefined,
                    );
                  }}
                  className="w-full mt-3 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Unduh Polaroid
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Rendering screen 3: Player has submitted and is waiting for next round
  if (hasSubmittedCurrent) {
    return (
      <div className="min-h-screen bg-[#0D0D11] text-zinc-100 flex flex-col justify-between p-6 font-sans relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] rounded-full bg-rose-900/10 blur-[80px]" />

        <div className="w-full flex-grow flex flex-col justify-center items-center text-center max-w-sm mx-auto">
          {/* Polaroid Mini Preview */}
          <div className="w-48 bg-[#12121A] border border-white/5 rounded-xl p-3.5 shadow-2xl transform rotate-[-2deg] mb-6 relative overflow-hidden">
            {/* Visual Polaroid Tape */}
            <div className="absolute top-[12px] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-3 bg-white/10 border-l border-r border-dashed border-white/20 backdrop-blur-[2px] rotate-[-2deg] z-10 pointer-events-none" />

            {/* Corner crop brackets */}
            <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 border-t border-l border-violet-500/30 pointer-events-none" />
            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 border-t border-r border-violet-500/30 pointer-events-none" />
            <div className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 border-b border-l border-violet-500/30 pointer-events-none" />
            <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 border-b border-r border-violet-500/30 pointer-events-none" />

            {/* Photo frame wrapper */}
            <div className="p-0.5 bg-[#09090D] border border-white/5 rounded-lg aspect-[4/5] relative overflow-hidden">
              {capturedPreview && (
                <img
                  src={capturedPreview}
                  alt="Captured"
                  className="w-full h-full object-cover rounded"
                />
              )}
            </div>
            
            <div className="mt-3 space-y-2 text-left">
              <div className="flex justify-between items-center gap-1">
                <span className="text-[7px] font-mono text-zinc-500 uppercase truncate max-w-[80px]">
                  TANTANGAN #{activeChallengeIndex}
                </span>
                {/* Approved Stamp */}
                <div className="px-1 py-0.2 bg-rose-950/40 border border-dashed border-rose-500/30 rounded text-[5px] font-mono text-rose-400 rotate-[-4deg]">
                  OK
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-1 border-t border-white/5 opacity-55">
                {/* CSS Barcode */}
                <div className="flex items-center gap-[0.5px]">
                  <div className="w-[1px] h-2 bg-white"></div>
                  <div className="w-[0.5px] h-2 bg-white"></div>
                  <div className="w-[1.5px] h-2 bg-white"></div>
                  <div className="w-[0.5px] h-2 bg-white"></div>
                  <div className="w-[1px] h-2 bg-white"></div>
                </div>
                <span className="text-[7px] font-serif italic text-zinc-600">
                  titik.temu
                </span>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-serif text-white italic mb-2">
            Jawaban Tersimpan.
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-xs">
            Makasih udah jujur ya. Duduk santai dulu sambil nunggu kawan-kawan
            yang lain selesai submit.
          </p>
          <div className="mt-6 px-4 py-2 rounded-full bg-zinc-800/40 border border-zinc-700/40 text-zinc-400 text-[11px] font-mono animate-pulse">
            Menunggu Host menaikkan slide...
          </div>
        </div>

        <div className="text-center py-4">
          <p className="text-[10px] font-mono text-zinc-600">
            Bonding TRPL • Sesi {activeChallengeIndex}/10
          </p>
        </div>
      </div>
    );
  }

  // Active Challenge (1 - 10)
  const currentChallenge = CHALLENGES[activeChallengeIndex - 1];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-zinc-100 flex flex-col p-4 font-sans relative overflow-x-hidden">
      {/* Background soft lighting */}
      <div className="absolute top-[10%] right-[-20%] w-[80%] h-[40%] rounded-full bg-indigo-900/5 blur-[100px]" />

      {/* Header bar */}
      <div className="flex justify-between items-center py-3 border-b border-white/5 mb-4">
        <div>
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
            TANTANGAN
          </span>
          <h2 className="text-sm font-serif italic text-white">
            {currentChallenge?.title || `Stage ${activeChallengeIndex}`}
          </h2>
        </div>
        <div className="px-2.5 py-1 bg-zinc-900 border border-white/10 rounded-lg text-xs font-mono text-zinc-400">
          {activeChallengeIndex} / 10
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex-grow flex flex-col space-y-5 max-w-sm mx-auto w-full pb-8">
        {/* Instruction Polaroid Card */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl">
          <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
            Misi Kamera
          </span>
          <p className="mt-1 text-sm text-zinc-200 leading-relaxed font-sans font-medium">
            {currentChallenge?.description}
          </p>
        </div>

        {/* Live Camera Viewfinder with scanning overlay */}
        <div className="relative">
          <CameraCapture
            onCapture={handleCapture}
            onReset={() => {
              setCapturedFile(null);
              setCapturedPreview(null);
              setScanCompleted(false);
              setSelectedPartners([]);
            }}
          >
            {/* Simulated green face bounding boxes overlay */}
            {scanCompleted && (
              <div className="absolute inset-0 pointer-events-none z-10">
                {/* Box 1: The Player themselves (Centered) */}
                <div className="absolute top-[20%] left-[34%] w-[32%] h-[38%] border-2 border-emerald-400 rounded-2xl shadow-[0_0_15px_rgba(52,211,153,0.5)] animate-[pulse_2s_infinite]">
                  <span className="absolute -top-6 left-0 bg-emerald-500 text-white font-mono text-[8px] font-bold px-1.5 py-0.5 rounded uppercase whitespace-nowrap">
                    {name} (99% Match)
                  </span>
                </div>

                {/* Box 2: The selected partner (Side) */}
                {selectedPartners.length > 0 && (
                  <div className="absolute top-[28%] left-[6%] w-[28%] h-[34%] border-2 border-indigo-400 rounded-2xl shadow-[0_0_15px_rgba(129,140,248,0.5)]">
                    <span className="absolute -top-6 left-0 bg-indigo-500 text-white font-mono text-[8px] font-bold px-1.5 py-0.5 rounded uppercase max-w-[100px] truncate">
                      {selectedPartners[0]} (92% Match)
                    </span>
                  </div>
                )}
              </div>
            )}
          </CameraCapture>

          {/* AI scanning overlay */}
          {isScanning && capturedPreview && (
            <div className="absolute inset-0 bg-[#0A0A0F]/90 rounded-2xl flex flex-col items-center justify-center p-4 z-20 overflow-hidden border border-white/10 animate-[fadeIn_0.2s_ease-out]">
              <div className="w-full flex-grow bg-zinc-950 rounded-xl relative overflow-hidden flex items-center justify-center">
                <img
                  src={capturedPreview}
                  alt="Scan preview"
                  className="w-full h-full object-cover opacity-45 grayscale"
                />
                {/* Glowing Laser Scan line */}
                <div className="absolute left-0 right-0 h-1 bg-rose-500 shadow-[0_0_15px_#f43f5e] top-0 animate-[scan_1.8s_infinite_ease-in-out]" />
              </div>
              <div className="mt-4 text-center space-y-1.5">
                <span className="text-[10px] font-mono tracking-widest text-rose-400 uppercase animate-pulse">
                  🤖 ANALYZING FACES...
                </span>
                <p className="text-[10px] font-sans text-zinc-400">
                  Model AI sedang mendeteksi jumlah wajah...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Deep Question and Partner verification Form */}
        {capturedFile && scanCompleted && (
          <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
            {/* Checklist of partners in the room */}
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
              <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
                Verifikasi Partner Foto (Minimal 1)
              </span>
              <p className="text-[11px] text-zinc-400 leading-normal">
                Siapa kawan HIMA TRPL yang berfoto bersamamu dalam misi ini?
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {playersList
                  .filter((p) => p.name !== name)
                  .map((p, idx) => {
                    const isSelected = selectedPartners.includes(p.name);
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedPartners((prev) =>
                              prev.filter((n) => n !== p.name),
                            );
                          } else {
                            setSelectedPartners((prev) => [...prev, p.name]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.15)]"
                            : "bg-[#12121A]/60 border-white/5 text-zinc-400 hover:border-white/10"
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                          {p.identityPhoto ? (
                            <img
                              src={p.identityPhoto}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="bg-zinc-800 text-[6px] text-zinc-500 h-full w-full flex items-center justify-center font-mono">
                              P
                            </span>
                          )}
                        </span>
                        {p.name}
                      </button>
                    );
                  })}

                {/* Failsafe Demo Partner button if testing alone */}
                {playersList.length <= 1 && (
                  <button
                    onClick={() => {
                      const demoName = "Bagas (Demo)";
                      if (selectedPartners.includes(demoName)) {
                        setSelectedPartners([]);
                      } else {
                        setSelectedPartners([demoName]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                      selectedPartners.includes("Bagas (Demo)")
                        ? "bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.15)]"
                        : "bg-[#12121A]/60 border-white/5 text-zinc-400 hover:border-white/10"
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full overflow-hidden border border-white/10 flex items-center justify-center bg-zinc-800 text-[8px] flex-shrink-0 text-zinc-400">
                      🤖
                    </span>
                    Bagas (Demo AI)
                  </button>
                )}
              </div>

              {/* Status Warning / Success */}
              {selectedPartners.length === 0 ? (
                <div className="p-2.5 bg-rose-950/20 border border-rose-500/20 rounded-xl text-rose-400 text-[10px] font-mono">
                  ⚠️ Deteksi AI: Hanya 1 orang ditemukan (Minimal wajib 2
                  orang). Submisi ditolak.
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-emerald-400 text-[10px] font-mono">
                  ✅ Deteksi AI: Terdeteksi 2 wajah! Verifikasi Berhasil.
                </div>
              )}
            </div>

            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-rose-300 uppercase">
                  Pertanyaan Mendalam
                </span>
                <p className="mt-1.5 text-xs text-rose-100 font-serif italic leading-relaxed">
                  "{currentChallenge?.question}"
                </p>
              </div>

              <textarea
                required
                rows={3}
                value={deepAnswer}
                onChange={(e) => setDeepAnswer(e.target.value)}
                placeholder="Tuliskan jawaban paling jujur dari hatimu di sini..."
                className="w-full bg-[#12121A]/60 border border-white/10 focus:border-rose-400/40 rounded-xl p-3 text-sm text-zinc-200 focus:outline-none transition-colors placeholder:text-zinc-600 resize-none font-sans"
              />

              <button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  !deepAnswer.trim() ||
                  selectedPartners.length === 0
                }
                className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-violet-600 hover:from-rose-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl border border-rose-400/20 shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Mengupload Foto Himpunan...
                  </>
                ) : (
                  "Kirim Jawaban & Selesaikan Misi"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
