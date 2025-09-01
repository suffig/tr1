-- Enhanced Database Schema for FIFA Tracker v1
-- Based on tracker_full_v1 requirements

-- 1. Players table
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  team VARCHAR(50) NOT NULL DEFAULT 'AEK',
  position VARCHAR(10),
  goals INTEGER DEFAULT 0,
  value DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Matches table (enhanced with JSON fields for goal scorers)
CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  teama VARCHAR(50) NOT NULL DEFAULT 'AEK',
  teamb VARCHAR(50) NOT NULL DEFAULT 'Real',
  goalsa INTEGER DEFAULT 0,
  goalsb INTEGER DEFAULT 0,
  goalslista JSONB DEFAULT '[]',
  goalslistb JSONB DEFAULT '[]',
  yellowa INTEGER DEFAULT 0,
  reda INTEGER DEFAULT 0,
  yellowb INTEGER DEFAULT 0,
  redb INTEGER DEFAULT 0,
  manofthematch VARCHAR(100),
  prizeaek INTEGER DEFAULT 0,
  prizereal INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  type VARCHAR(50) NOT NULL,
  team VARCHAR(50) NOT NULL,
  amount INTEGER NOT NULL,
  info TEXT,
  match_id INTEGER REFERENCES matches(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Finances table
CREATE TABLE IF NOT EXISTS finances (
  id SERIAL PRIMARY KEY,
  team VARCHAR(50) NOT NULL UNIQUE,
  balance INTEGER DEFAULT 0,
  debt INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Bans table
CREATE TABLE IF NOT EXISTS bans (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  team VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL,
  totalgames INTEGER DEFAULT 1,
  matchesserved INTEGER DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Player of the match statistics
CREATE TABLE IF NOT EXISTS spieler_des_spiels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  team VARCHAR(50) NOT NULL,
  count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(name, team)
);

-- Insert default finance records if they don't exist
INSERT INTO finances (team, balance, debt) 
VALUES 
  ('AEK', 0, 0),
  ('Real', 0, 0)
ON CONFLICT (team) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_team ON players(team);
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(date);
CREATE INDEX IF NOT EXISTS idx_transactions_team ON transactions(team);
CREATE INDEX IF NOT EXISTS idx_transactions_match_id ON transactions(match_id);
CREATE INDEX IF NOT EXISTS idx_bans_player_id ON bans(player_id);
CREATE INDEX IF NOT EXISTS idx_finances_team ON finances(team);

-- Row Level Security (RLS) policies
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE spieler_des_spiels ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY IF NOT EXISTS "Enable all for authenticated users" ON players 
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Enable all for authenticated users" ON matches 
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Enable all for authenticated users" ON transactions 
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Enable all for authenticated users" ON finances 
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Enable all for authenticated users" ON bans 
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Enable all for authenticated users" ON spieler_des_spiels 
  FOR ALL USING (auth.role() = 'authenticated');