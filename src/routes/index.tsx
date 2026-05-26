import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-[#0D0D11] text-zinc-100 flex flex-col justify-between p-6 font-sans relative overflow-hidden">
      {/* Dynamic background accents */}
      <div className="absolute top-[-30%] left-[-20%] w-[90%] h-[70%] rounded-full bg-violet-900/10 blur-[130px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[60%] rounded-full bg-rose-900/10 blur-[130px]" />

      <div className="w-full flex-grow flex flex-col justify-center max-w-md mx-auto z-10">
        
        {/* Title Group */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-serif tracking-tight text-white mb-3 italic">
            titik.temu
          </h1>
          <p className="text-xs font-mono text-zinc-400 tracking-[0.25em] uppercase">
            HIMA TRPL BONDING EVENT
          </p>
        </div>

        {/* Action Panel */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
          <p className="text-xs font-serif text-zinc-400 leading-relaxed text-center mb-2 italic">
            "Sebuah ruang sederhana untuk menepi sejenak, mengabadikan tawa konyol, dan berbagi cerita terjujur."
          </p>

          <div className="space-y-4">
            <Link
              to="/player"
              className="flex items-center justify-between w-full p-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium rounded-2xl border border-indigo-400/30 shadow-[0_0_20px_rgba(99,102,241,0.25)] transition-all transform active:scale-[0.98]"
            >
              <div className="text-left">
                <span className="block text-sm font-semibold tracking-wide">Masuk sebagai Peserta</span>
                <span className="block text-[10px] text-indigo-200 mt-0.5">Ambil foto & isi pertanyaan di HP kamu</span>
              </div>
              <span className="text-xl">📱 ➔</span>
            </Link>

            <Link
              to="/host"
              className="flex items-center justify-between w-full p-5 bg-zinc-900/80 hover:bg-zinc-800/80 text-zinc-300 font-medium rounded-2xl border border-white/5 transition-all transform active:scale-[0.98]"
            >
              <div className="text-left">
                <span className="block text-sm font-semibold tracking-wide">Buka Layar Host</span>
                <span className="block text-[10px] text-zinc-500 mt-0.5">Kendalikan sesi & tampilkan galeri bersama</span>
              </div>
              <span className="text-lg">💻 ➔</span>
            </Link>
          </div>
        </div>

        {/* Brief Instructions */}
        <div className="mt-8 text-center space-y-1">
          <p className="text-[10px] font-mono text-zinc-500 tracking-wider">
            Pastikan websocket server telah menyala di `ws://localhost:8080`
          </p>
        </div>

      </div>

      {/* Footer copyright */}
      <div className="text-center py-4 z-10 border-t border-white/5">
        <p className="text-[10px] font-mono text-zinc-600">
          TitikTemu • Himpunan Mahasiswa TRPL 2026
        </p>
      </div>
    </div>
  );
}
