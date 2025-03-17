-- Create players table for poker tournament app
CREATE TABLE public.players (
  id TEXT PRIMARY KEY,
  tournamentId TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  tableNumber INTEGER NOT NULL,
  seatNumber INTEGER NOT NULL,
  chips INTEGER NOT NULL,
  status TEXT NOT NULL,
  finishPosition INTEGER,
  rebuys INTEGER NOT NULL DEFAULT 0,
  addOns INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read players
CREATE POLICY "Allow anyone to read players" 
  ON public.players
  FOR SELECT 
  USING (true);

-- Create policy to allow insert of players
CREATE POLICY "Allow insert of players" 
  ON public.players
  FOR INSERT 
  WITH CHECK (true);

-- Create policy to allow update of players
CREATE POLICY "Allow anyone to update players" 
  ON public.players
  FOR UPDATE 
  USING (true);

-- Create policy to allow delete of players
CREATE POLICY "Allow anyone to delete players" 
  ON public.players
  FOR DELETE 
  USING (true);

-- Create index for performance
CREATE INDEX players_tournament_idx ON public.players(tournamentId);

-- Add realtime replication
ALTER TABLE public.players REPLICA IDENTITY FULL; 