-- Database Schema for HIMA bonding multiplayer game (PostgreSQL / Supabase)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ROOMS TABLE
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pin VARCHAR(4) UNIQUE NOT NULL,
    current_challenge_index INT DEFAULT 0, -- 0: waiting, 1-10: active challenges, 11: climax gallery
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. PLAYERS TABLE
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT unique_room_player_name UNIQUE(room_id, name)
);

-- 3. CHALLENGES TABLE (Static reference seeded into DB)
CREATE TABLE IF NOT EXISTS challenges (
    id INT PRIMARY KEY, -- 1 to 10
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    deep_question TEXT NOT NULL
);

-- 4. SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    challenge_id INT REFERENCES challenges(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL, -- URL pointing to Nextcloud or Supabase Storage
    answer TEXT NOT NULL, -- Text input answering the deep question
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT unique_player_challenge UNIQUE(player_id, challenge_id)
);

-- Indexing for fast lookups
CREATE INDEX IF NOT EXISTS idx_submissions_room ON submissions(room_id);
CREATE INDEX IF NOT EXISTS idx_players_room ON players(room_id);

-- SEEDING CHALLENGES
INSERT INTO challenges (id, title, description, deep_question) VALUES
(1, 'Capek Proker', 'Foto muka paling "capek ngerjain proker" bareng kating (kakak tingkat).', 'Jujur, apa satu hal yang bikin kamu merasa sungkan buat ngobrol sama kating/adik tingkat?'),
(2, 'Anak Warnet', 'Pose ala "anak warnet" bareng divisi yang paling jarang kamu ajak ngobrol.', 'First impression kamu ke divisi mereka vs realitanya gimana?'),
(3, 'Air Mata HIMA', 'Selfie pura-pura menangis sambil meluk Ketua HIMA atau BPH.', 'Kalau kamu jadi Ketua HIMA sehari, beban apa yang menurutmu paling berat dipikul dia?'),
(4, 'Tuker Jaket', 'Foto tukeran gaya/jaket himpunan sama temen beda angkatan.', 'Momen apa yang bikin kamu sempet ngerasa "Ah, gue pengen mundur aja dari proker ini"?'),
(5, 'Peace & Blink', 'Pose peace (✌️) sambil merem bareng partner divisimu.', 'Apa satu hal kecil dari partner kamu yang diam-diam kamu apresiasi banget?'),
(6, 'Eye Contact', 'Selfie setengah muka (mata ke atas) bareng anak divisi Humas/Komed.', 'Pesan apa yang selama ini pengen kamu sampein ke forum tapi selalu tertahan?'),
(7, 'Sekre Vibes', 'Gaya andalan pas lagi nongkrong di sekre, bareng 3 orang random.', 'Menurutmu, ruang sekre kita udah jadi "rumah" yang nyaman belum? Keapa?'),
(8, 'Tahan Tawa', 'Foto nahan tawa saling tatap 5 detik sama orang yang beda angkatan.', 'Hal paling konyol/lucu apa yang pernah kamu alami selama ada di HIMA?'),
(9, 'Solidarity Stack', 'Foto tangan tos bertumpuk (kayak tim olahraga sebelum tanding).', 'Harapan paling jujur buat HIMA TRPL ke depannya apa?'),
(10, 'Happiness Overload', 'Foto gaya bebas (paling lepas/bahagia) sekelompok besar.', 'Setelah ngelewatin sesi ini, masih ngerasa ada "gap" nggak di antara kita?')
ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    deep_question = EXCLUDED.deep_question;
