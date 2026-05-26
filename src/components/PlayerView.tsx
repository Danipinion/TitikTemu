import React, { useState } from 'react';
import { CameraCapture } from './CameraCapture';
import { useWebsocket } from '../hooks/useWebsocket';

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

export const PlayerView: React.FC = () => {
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [activeChallengeIndex, setActiveChallengeIndex] = useState(0); // 0 = Waiting Lobby

  // Player state within the active challenge
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [deepAnswer, setDeepAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedCurrent, setHasSubmittedCurrent] = useState(false);

  // Initialize Websocket hook
  const { isConnected, error: wsError, sendSubmission } = useWebsocket({
    pin,
    name,
    role: 'player',
    onChallengeChanged: (newIndex) => {
      setActiveChallengeIndex((prevIndex) => {
        // Only wipe progress if the host actually changed the challenge index
        if (prevIndex !== newIndex) {
          setCapturedFile(null);
          setCapturedPreview(null);
          setDeepAnswer('');
          setHasSubmittedCurrent(false);
        }
        return newIndex;
      });
    }
  });

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 4 && name.trim()) {
      setIsJoined(true);
    }
  };

  const handleCapture = (file: File, previewUrl: string) => {
    setCapturedFile(file);
    setCapturedPreview(previewUrl);
  };

  const handleSubmit = async () => {
    if (!capturedFile || !deepAnswer.trim()) return;

    setIsSubmitting(true);
    try {
      // Simulate file upload (Nextcloud API or Supabase Storage)
      // In production, you would perform:
      // const { data, error } = await supabase.storage.from('photos').upload(`${pin}/${name}_ch${activeChallengeIndex}.jpg`, capturedFile);
      // const photoUrl = supabase.storage.from('photos').getPublicUrl(data.path).data.publicUrl;
      
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const simulatedPhotoUrl = capturedPreview || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e';

      // Send via WebSocket to sync Host board instantly
      sendSubmission(activeChallengeIndex, simulatedPhotoUrl, deepAnswer);
      
      setHasSubmittedCurrent(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <form onSubmit={handleJoin} className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
            <div>
              <label className="block text-[11px] font-mono tracking-widest text-zinc-400 uppercase mb-2">
                Room PIN (4 Digit)
              </label>
              <input
                type="text"
                maxLength={4}
                required
                placeholder="0000"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-[#16161F]/60 border border-white/10 rounded-xl px-4 py-3.5 text-center text-2xl font-mono tracking-widest text-white focus:outline-none focus:border-violet-500 transition-colors"
              />
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
          {/* Floating reflective disk representing 'lobby waiting' */}
          <div className="relative w-40 h-40 rounded-full bg-gradient-to-tr from-violet-950/40 via-indigo-900/40 to-rose-950/40 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex items-center justify-center mb-8 animate-[pulse_3s_infinite]">
            <div className="w-32 h-32 rounded-full border border-white/5 bg-[#0D0D11] flex flex-col items-center justify-center p-4">
              <span className="text-4xl animate-bounce">☕</span>
            </div>
            {/* Spinning orbit */}
            <div className="absolute inset-0 rounded-full border-t border-indigo-500/40 animate-spin" />
          </div>

          <h2 className="text-2xl font-serif text-white italic mb-2">Halo, {name}!</h2>
          <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">
            Kamu udah masuk di Room <span className="font-mono text-violet-400 font-bold bg-violet-950/40 px-2 py-0.5 rounded border border-violet-800/30">{pin}</span>.
          </p>
          <div className="mt-6 px-4 py-2 rounded-full bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-xs font-mono animate-pulse flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Connected, waiting for Host
          </div>
        </div>

        <div className="text-center py-4">
          <p className="text-[10px] font-mono text-zinc-600">
            {isConnected ? 'Sync Active' : 'Connecting to websocket...'}
          </p>
        </div>
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
          <div className="w-48 bg-zinc-900 border border-white/10 rounded-xl p-3 shadow-2xl transform rotate-[-2deg] mb-6">
            <div className="w-full aspect-[4/5] bg-black rounded overflow-hidden">
              {capturedPreview && (
                <img src={capturedPreview} alt="Captured" className="w-full h-full object-cover grayscale brightness-90 opacity-70" />
              )}
            </div>
            <div className="mt-2 text-left">
              <p className="text-[9px] font-serif italic text-zinc-500">"{deepAnswer.substring(0, 35)}..."</p>
            </div>
          </div>

          <h2 className="text-xl font-serif text-white italic mb-2">Jawaban Tersimpan.</h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-xs">
            Makasih udah jujur ya. Duduk santai dulu sambil nunggu kawan-kawan yang lain selesai submit.
          </p>
          <div className="mt-6 px-4 py-2 rounded-full bg-zinc-800/40 border border-zinc-700/40 text-zinc-400 text-[11px] font-mono animate-pulse">
            Menunggu Host menaikkan slide...
          </div>
        </div>

        <div className="text-center py-4">
          <p className="text-[10px] font-mono text-zinc-600">Bonding TRPL • Sesi {activeChallengeIndex}/10</p>
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
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">TANTANGAN</span>
          <h2 className="text-sm font-serif italic text-white">{currentChallenge?.title || `Stage ${activeChallengeIndex}`}</h2>
        </div>
        <div className="px-2.5 py-1 bg-zinc-900 border border-white/10 rounded-lg text-xs font-mono text-zinc-400">
          {activeChallengeIndex} / 10
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex-grow flex flex-col space-y-5 max-w-sm mx-auto w-full pb-8">
        
        {/* Instruction Polaroid Card */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl">
          <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">Misi Kamera</span>
          <p className="mt-1 text-sm text-zinc-200 leading-relaxed font-sans font-medium">
            {currentChallenge?.description}
          </p>
        </div>

        {/* Live Camera Viewfinder */}
        <CameraCapture onCapture={handleCapture} onReset={() => setCapturedFile(null)} />

        {/* Deep Question Form */}
        {capturedFile && (
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl space-y-4 animate-[fadeIn_0.5s_ease-out]">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-rose-300 uppercase">Pertanyaan Mendalam</span>
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
              disabled={isSubmitting || !deepAnswer.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-violet-600 hover:from-rose-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl border border-rose-400/20 shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Mengupload Foto Himpunan...
                </>
              ) : (
                'Kirim Jawaban & Selesaikan Misi'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
