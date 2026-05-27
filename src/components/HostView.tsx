import React, { useState, useEffect } from 'react';
import { useWebsocket } from '../hooks/useWebsocket';
import type { ConnectedPlayer } from '../hooks/useWebsocket';
import { downloadSinglePolaroid, downloadPhotoboothStrip, downloadGroupCollage } from '../utils/photobooth';

interface Submission {
  playerName: string;
  challengeId: number;
  photoUrl: string;
  answer: string;
  detectedPlayers?: string[];
}

const CHALLENGES = [
  {
    id: 1,
    title: '📸 Capek Proker',
    description: 'Foto muka paling "capek ngerjain proker" bareng kating (kakak tingkat).',
    question: 'Jujur, apa satu hal yang bikin kamu merasa sungkan buat ngobrol sama kating/adik tingkat?'
  },
  {
    id: 2,
    title: '💻 Anak Warnet',
    description: 'Pose ala "anak warnet" bareng divisi yang paling jarang kamu ajak ngobrol.',
    question: 'First impression kamu ke divisi mereka vs realitanya gimana?'
  },
  {
    id: 3,
    title: '😭 Air Mata HIMA',
    description: 'Selfie pura-pura menangis sambil meluk Ketua HIMA atau BPH.',
    question: 'Kalau kamu jadi Ketua HIMA sehari, beban apa yang menurutmu paling berat dipikul dia?'
  },
  {
    id: 4,
    title: '🧥 Tuker Jaket',
    description: 'Foto tukeran gaya/jaket himpunan sama temen beda angkatan.',
    question: 'Momen apa yang bikin kamu sempet ngerasa "Ah, gue pengen mundur aja dari proker ini"?'
  },
  {
    id: 5,
    title: '✌️ Peace & Blink',
    description: 'Pose peace (✌️) sambil merem bareng partner divisimu.',
    question: 'Apa satu hal kecil dari partner kamu yang diam-diam kamu apresiasi banget?'
  },
  {
    id: 6,
    title: '👀 Eye Contact',
    description: 'Selfie setengah muka (mata ke atas) bareng anak divisi Humas/Komed.',
    question: 'Pesan apa yang selama ini pengen kamu sampein ke forum tapi selalu tertahan?'
  },
  {
    id: 7,
    title: '⛺ Sekre Vibes',
    description: 'Gaya andalan pas lagi nongkrong di sekre, bareng 3 orang random.',
    question: 'Menurutmu, ruang sekre kita udah jadi "rumah" yang nyaman belum? Kenapa?'
  },
  {
    id: 8,
    title: '🤫 Tahan Tawa',
    description: 'Foto nahan tawa saling tatap 5 detik sama orang yang beda angkatan.',
    question: 'Hal paling konyol/lucu apa yang pernah kamu alami selama ada di HIMA?'
  },
  {
    id: 9,
    title: '🤝 Solidarity Stack',
    description: 'Foto tangan tos bertumpuk (kayak tim olahraga sebelum tanding).',
    question: 'Harapan paling jujur buat HIMA TRPL ke depannya apa?'
  },
  {
    id: 10,
    title: '🎉 Happiness Overload',
    description: 'Foto gaya bebas (paling lepas/bahagia) sekelompok besar.',
    question: 'Setelah ngelewatin sesi ini, masih ngerasa ada "gap" nggak di antara kita?'
  }
];

export const HostView: React.FC = () => {
  const pin = '4829'; // Predefined or randomly generated room PIN
  const [isCreated, setIsCreated] = useState(false);
  const [players, setPlayers] = useState<ConnectedPlayer[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeStage, setActiveStage] = useState(0); // 0 = Lobby, 1-10 = Game, 11 = Climax
  const [countdown, setCountdown] = useState<number | null>(null);
  
  // Selected submission for reading modal
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

  const { sendNextChallenge } = useWebsocket({
    pin,
    role: 'host',
    onPlayerJoined: (_, list) => {
      setPlayers(list);
    },
    onPlayerLeft: (_, list) => {
      setPlayers(list);
    },
    onSubmissionReceived: (submission) => {
      setSubmissions((prev) => [...prev, submission]);
    }
  });

  const handleStartGame = () => {
    setIsCreated(true);
  };

  const handleNextChallenge = () => {
    const nextStage = activeStage + 1;
    setActiveStage(nextStage);
    sendNextChallenge(nextStage);
  };

  const currentChallenge = activeStage >= 1 && activeStage <= 10 ? CHALLENGES[activeStage - 1] : null;
  const currentSubmissions = submissions.filter((s) => s.challengeId === activeStage);

  // Auto-next countdown when all connected players have submitted their answers
  useEffect(() => {
    if (
      activeStage >= 1 &&
      activeStage <= 10 &&
      players.length > 0 &&
      currentSubmissions.length === players.length
    ) {
      setCountdown(5);
    } else {
      setCountdown(null);
    }
  }, [currentSubmissions.length, players.length, activeStage]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      handleNextChallenge();
      setCountdown(null);
      return;
    }
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);


  // Screen 1: Start Room Configuration
  if (!isCreated) {
    return (
      <div className="min-h-screen bg-[#0D0D11] text-zinc-100 flex flex-col justify-center items-center p-8 relative overflow-hidden">
        <div className="absolute top-[20%] left-[10%] w-[50%] h-[50%] rounded-full bg-violet-900/10 blur-[120px]" />
        
        <div className="max-w-md w-full backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6 text-center z-15">
          <h1 className="text-4xl font-serif italic text-white tracking-wide">titik.temu</h1>
          <p className="text-xs font-mono text-zinc-400 tracking-wider">HIMA TRPL BONDING HOST CONSOLE</p>
          
          <div className="p-4 bg-[#14141E]/80 border border-white/5 rounded-2xl">
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">ROOM PIN GENERATED</span>
            <p className="text-5xl font-mono tracking-wider font-extrabold text-indigo-400 mt-2">{pin}</p>
          </div>

          <div className="text-zinc-400 text-xs leading-relaxed max-w-xs mx-auto">
            Gunakan PIN ini untuk login oleh semua peserta di HP mereka. Pastikan server lokal websocket sudah berjalan.
          </div>

          <button
            onClick={handleStartGame}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-sm rounded-xl border border-indigo-400/20 shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all transform active:scale-95"
          >
            Buka Lobby Sekarang
          </button>
        </div>
      </div>
    );
  }

  // Screen 2: Waiting Lobby (activeStage === 0)
  if (activeStage === 0) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-zinc-100 flex flex-col p-8 font-sans relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] rounded-full bg-indigo-950/15 blur-[120px] pointer-events-none" />

        {/* Top Navbar */}
        <div className="flex justify-between items-center pb-6 border-b border-white/5 mb-8">
          <div>
            <h1 className="text-2xl font-serif italic text-white">titik.temu</h1>
            <p className="text-[10px] font-mono text-zinc-500 tracking-wider">STATUS: WAITING LOBBY</p>
          </div>
          <div className="px-4 py-2 bg-indigo-950/30 border border-indigo-500/20 rounded-xl flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping"></span>
            <span className="text-xs font-mono text-indigo-300">HOST PIN: {pin}</span>
          </div>
        </div>

        {/* Main split lobby panel */}
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Instructions Column */}
          <div className="lg:col-span-1 backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="text-lg font-serif italic text-white">Instruksi Bermain</h2>
              <ul className="space-y-3 text-xs text-zinc-400 leading-relaxed font-sans list-decimal list-inside">
                <li>Minta seluruh mahasiswa HIMA TRPL membuka web di handphone masing-masing.</li>
                <li>Masukkan PIN ruangan: <b className="font-mono text-indigo-300">{pin}</b>.</li>
                <li>Gunakan nama panggilan asli agar fotonya gampang dikenali.</li>
                <li>Setelah semua peserta terhubung, tekan tombol <b>"Mulai Sesi Bonding"</b>.</li>
              </ul>
            </div>

            <div className="pt-6">
              <button
                onClick={handleNextChallenge}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl border border-indigo-400/20 shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all active:scale-[0.98]"
              >
                Mulai Sesi Bonding ({players.length} Peserta)
              </button>
            </div>
          </div>

          {/* Connected players pool column */}
          <div className="lg:col-span-2 backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-mono tracking-wider text-zinc-300 uppercase">Peserta Terkoneksi ({players.length})</h2>
              <span className="text-[10px] font-mono text-zinc-500">Real-time update</span>
            </div>

            {players.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/5 rounded-2xl bg-zinc-900/10">
                <span className="text-4xl animate-bounce mb-3">📱</span>
                <p className="text-sm font-serif italic text-zinc-500">Menunggu kawan-kawan masuk...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto max-h-[50vh] p-1">
                {players.map((p, idx) => (
                  <div
                    key={idx}
                    className="bg-zinc-900 border border-white/10 rounded-2xl p-4 shadow-lg flex flex-col items-center gap-2.5 animate-[fadeIn_0.3s_ease-out]"
                  >
                    <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10 bg-zinc-950 relative">
                      {p.identityPhoto ? (
                        <img src={p.identityPhoto} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl text-zinc-500 h-full w-full flex items-center justify-center font-mono uppercase">
                          {p.name.slice(0,2)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-xs font-semibold text-zinc-200">{p.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Screen 3: Game stages (1 - 10)
  if (activeStage >= 1 && activeStage <= 10) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-zinc-100 flex flex-col p-8 font-sans relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] rounded-full bg-rose-950/10 blur-[120px] pointer-events-none" />

        {/* Top Navbar */}
        <div className="flex justify-between items-center pb-6 border-b border-white/5 mb-8">
          <div>
            <span className="text-[9px] font-mono text-rose-300 tracking-widest uppercase">SESI BONDING TERJALIN</span>
            <h1 className="text-2xl font-serif italic text-white mt-1">
              Tantangan {activeStage} dari 10: {currentChallenge?.title}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {countdown !== null ? (
              <div className="px-4 py-2 bg-rose-950/60 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-mono animate-pulse">
                ⏱️ Auto-Next: {countdown}s
              </div>
            ) : (
              <div className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-xl text-xs font-mono text-zinc-400">
                Submitted: {currentSubmissions.length} / {players.length} Players
              </div>
            )}
            <button
              onClick={handleNextChallenge}
              className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-violet-600 hover:from-rose-500 hover:to-violet-500 text-white font-semibold text-xs rounded-xl border border-rose-400/20 shadow-[0_0_15px_rgba(244,63,94,0.2)] transition-all"
            >
              {activeStage === 10 ? 'Lihat Galeri Kebersamaan ✨' : 'Lanjut Tantangan Berikutnya ➔'}
            </button>
          </div>
        </div>

        {/* Main Grid Content */}
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mission Board card */}
          <div className="lg:col-span-1 backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">PETUNJUK</span>
                <p className="mt-2 text-base text-zinc-300 font-sans font-medium leading-relaxed">
                  {currentChallenge?.description}
                </p>
              </div>

              <div className="p-5 bg-rose-950/20 border border-rose-500/20 rounded-2xl">
                <span className="text-[10px] font-mono tracking-widest text-rose-300 uppercase">DEEP QUESTION FOR THE FORUM</span>
                <p className="mt-2 text-sm text-rose-100 font-serif italic leading-relaxed">
                  "{currentChallenge?.question}"
                </p>
              </div>
            </div>

            <div className="text-zinc-500 text-[10px] font-mono leading-normal pt-4 border-t border-white/5">
              Tekan tombol "Lanjut" di kanan atas jika waktu pengerjaan dirasa cukup, atau semua peserta telah mengirim jawabannya.
            </div>
          </div>

          {/* Submissions Grid feed */}
          <div className="lg:col-span-2 backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-mono tracking-widest text-zinc-300 uppercase">SUBMISSIONS FEED ({currentSubmissions.length})</h2>
              <span className="text-xs text-zinc-500 font-serif italic">Terisi secara real-time dari HP peserta</span>
            </div>

            {currentSubmissions.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/5 rounded-2xl">
                <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs font-mono text-zinc-500 tracking-wider">MENUNGGU SUBMISSI DARI PESERTA...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto max-h-[55vh] p-1">
                {currentSubmissions.map((sub, idx) => (
                  <div
                    key={idx}
                    className="bg-zinc-900 border border-white/5 rounded-xl p-2.5 shadow-xl hover:scale-[1.02] transition-transform duration-300 cursor-pointer flex flex-col justify-between"
                    onClick={() => setSelectedSub(sub)}
                  >
                    <div className="aspect-[4/5] bg-black rounded-lg overflow-hidden relative">
                      <img src={sub.photoUrl} alt="Submission" className="w-full h-full object-cover grayscale brightness-90 hover:grayscale-0 transition-all duration-500" />
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/75 backdrop-blur-md rounded text-[9px] font-mono text-zinc-300">
                        {sub.playerName}
                      </div>

                      {/* Display face detection tags */}
                      {sub.detectedPlayers && sub.detectedPlayers.length > 1 && (
                        <div className="absolute bottom-2 left-2 right-2 px-1.5 py-0.5 bg-indigo-950/80 backdrop-blur-md rounded text-[8px] font-mono text-indigo-300 border border-indigo-500/20 truncate">
                          👥 {sub.detectedPlayers.join(', ')}
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-[10px] font-serif italic text-zinc-400 line-clamp-2">
                      "{sub.answer}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail Modal for reading individual submissions out loud */}
        {selectedSub && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6" onClick={() => setSelectedSub(null)}>
            <div className="max-w-2xl w-full bg-zinc-950 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row gap-6 relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setSelectedSub(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white font-mono text-xs">
                ✕ Tutup
              </button>

              <div className="w-full md:w-1/2 aspect-[4/5] bg-black rounded-2xl overflow-hidden shadow-inner">
                <img src={selectedSub.photoUrl} alt="Detail" className="w-full h-full object-cover" />
              </div>

              <div className="w-full md:w-1/2 flex flex-col justify-between py-2">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-mono text-indigo-400 tracking-wider">OLEH PESERTA</span>
                    <h3 className="text-xl font-serif text-white italic mt-0.5">{selectedSub.playerName}</h3>
                  </div>

                  {/* AI match layout */}
                  {selectedSub.detectedPlayers && selectedSub.detectedPlayers.length > 0 && (
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 tracking-wider">AI FACE DETECTION MATCH ({selectedSub.detectedPlayers.length})</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {selectedSub.detectedPlayers.map((pn, pidx) => (
                          <span key={pidx} className="px-2 py-0.5 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-[10px] font-mono text-emerald-300">
                            ✓ {pn}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] font-mono text-rose-400 tracking-wider">JAWABAN MENDALAM</span>
                    <p className="text-sm font-sans text-zinc-300 leading-relaxed italic mt-1 bg-white/5 border border-white/5 rounded-xl p-4">
                      "{selectedSub.answer}"
                    </p>
                  </div>
                </div>

                <div className="text-[9px] font-mono text-zinc-600">
                  Room: {pin} • Challenge: {activeStage}/10
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Screen 4: Climax Slideshow & Masonry Gallery (activeStage === 11)
  return (
    <div className="min-h-screen bg-[#08080C] text-zinc-100 flex flex-col p-8 font-sans relative overflow-x-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[60%] rounded-full bg-violet-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[50%] rounded-full bg-rose-900/10 blur-[150px] pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center pb-6 border-b border-white/5 mb-8 gap-4">
        <div>
          <span className="text-[10px] font-mono text-indigo-400 tracking-widest uppercase">GALERI KEBERSAMAAN</span>
          <h1 className="text-3xl font-serif italic text-white mt-1">Melebur Tanpa Jarak ✨</h1>
          <p className="text-xs text-zinc-400 mt-1">Berikut adalah semua potret konyol dan curahan hati paling jujur dari teman-teman HIMA TRPL.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto lg:justify-end">
          {submissions.length > 0 && (
            <>
              <button
                onClick={() => downloadGroupCollage(submissions, CHALLENGES)}
                className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all flex items-center gap-1.5 transform active:scale-95"
              >
                <span>🖼️</span> Unduh Kolase Himpunan
              </button>

              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    const playerSubs = submissions.filter(s => s.playerName === val);
                    downloadPhotoboothStrip(val, playerSubs, CHALLENGES);
                    e.target.value = '';
                  }
                }}
                className="px-4 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs font-mono text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                defaultValue=""
              >
                <option value="" disabled>🎞️ Unduh Strip Peserta...</option>
                {Array.from(new Set(submissions.map(s => s.playerName))).map((name, pIdx) => (
                  <option key={pIdx} value={name}>{name}</option>
                ))}
              </select>
            </>
          )}
          <button
            onClick={() => {
              // Reset to Lobby
              setActiveStage(0);
              setSubmissions([]);
              sendNextChallenge(0);
            }}
            className="px-6 py-2.5 bg-zinc-900 border border-white/10 rounded-xl hover:bg-zinc-800 text-xs font-mono text-zinc-300 transition-all"
          >
            Reset Room 🔄
          </button>
        </div>
      </div>

      {/* Beautiful Polaroid Masonry Board */}
      {submissions.length === 0 ? (
        <div className="flex-grow flex flex-col justify-center items-center text-center p-8 border border-dashed border-white/10 rounded-3xl bg-zinc-900/5">
          <span className="text-5xl mb-4">🖼️</span>
          <h2 className="text-xl font-serif italic text-zinc-400">Belum ada foto yang terkumpul.</h2>
          <p className="text-xs text-zinc-600 max-w-sm mt-1">Coba jalankan permainan dan submit foto dari handphone untuk melihat karya di sini.</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-6 space-y-6 [column-fill:_balance] w-full pb-16">
          {submissions.map((sub, idx) => {
            const challengeTitle = CHALLENGES[sub.challengeId - 1]?.title || 'Tantangan';
            return (
              <div
                key={idx}
                onClick={() => setSelectedSub(sub)}
                className="break-inside-avoid bg-zinc-900 border border-white/10 rounded-2xl p-4 shadow-xl hover:shadow-[0_10px_30px_rgba(99,102,241,0.25)] hover:scale-[1.03] transition-all duration-300 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Visual Polaroid Tape Indicator */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-5 bg-white/10 backdrop-blur-md border border-white/20 rotate-[-3deg] z-10 opacity-70 group-hover:opacity-100 transition-opacity" />

                <div className="aspect-[4/5] bg-black rounded-lg overflow-hidden relative">
                  <img src={sub.photoUrl} alt="Polaroid submission" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  
                  {/* Face recognition tags overlay */}
                  {sub.detectedPlayers && sub.detectedPlayers.length > 1 && (
                    <div className="absolute bottom-2 left-2 right-2 px-1.5 py-0.5 bg-indigo-950/80 backdrop-blur-md rounded text-[8px] font-mono text-indigo-300 border border-indigo-500/20 truncate">
                      👥 {sub.detectedPlayers.join(', ')}
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">{challengeTitle}</span>
                    <span className="text-xs font-serif italic text-indigo-300 font-semibold">{sub.playerName}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2 border-t border-white/5 pt-2">
                    <p className="text-xs font-sans text-zinc-300 italic leading-relaxed flex-grow">
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
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reader Modal */}
      {selectedSub && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6" onClick={() => setSelectedSub(null)}>
          <div className="max-w-2xl w-full bg-zinc-950 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row gap-6 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedSub(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white font-mono text-xs">
              ✕ Tutup
            </button>

            <div className="w-full md:w-1/2 aspect-[4/5] bg-black rounded-2xl overflow-hidden shadow-inner">
              <img src={selectedSub.photoUrl} alt="Detail" className="w-full h-full object-cover" />
            </div>

            <div className="w-full md:w-1/2 flex flex-col justify-between py-2">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono text-indigo-400 tracking-wider">KARYA OLEH</span>
                  <h3 className="text-xl font-serif text-white italic mt-0.5">{selectedSub.playerName}</h3>
                </div>

                {/* AI match layout */}
                {selectedSub.detectedPlayers && selectedSub.detectedPlayers.length > 0 && (
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 tracking-wider">AI FACE DETECTION MATCH ({selectedSub.detectedPlayers.length})</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {selectedSub.detectedPlayers.map((pn, pidx) => (
                        <span key={pidx} className="px-2 py-0.5 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-[10px] font-mono text-emerald-300">
                          ✓ {pn}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-[10px] font-mono text-rose-400 tracking-wider">JAWABAN DEEP DI FORUM</span>
                  <p className="text-sm font-sans text-zinc-300 leading-relaxed italic mt-1 bg-white/5 border border-white/5 rounded-xl p-4">
                    "{selectedSub.answer}"
                  </p>
                </div>

                <button
                  onClick={() => {
                    const chal = CHALLENGES[selectedSub.challengeId - 1];
                    downloadSinglePolaroid(selectedSub, chal ? chal.title : undefined);
                  }}
                  className="w-full mt-2 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                  </svg>
                  Unduh Polaroid
                </button>
              </div>

              <div className="text-[9px] font-mono text-zinc-600">
                Bonding Gallery • Room: {pin}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
