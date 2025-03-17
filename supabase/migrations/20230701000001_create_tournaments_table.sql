-- Create tournaments table for poker tournament app
CREATE TABLE public.tournaments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  startingChips INTEGER NOT NULL,
  buyIn INTEGER NOT NULL,
  entryFee INTEGER NOT NULL,
  maxRebuys INTEGER NOT NULL,
  rebuyAmount INTEGER NOT NULL,
  rebuyChips INTEGER NOT NULL,
  allowAddOns BOOLEAN NOT NULL,
  addOnAmount INTEGER NOT NULL,
  addOnChips INTEGER NOT NULL,
  nextBreak INTEGER NOT NULL,
  breakLength INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read tournaments
CREATE POLICY "Allow anyone to read tournaments" 
  ON public.tournaments
  FOR SELECT 
  USING (true);

-- Create policy to allow insert of tournaments
CREATE POLICY "Allow insert of tournaments" 
  ON public.tournaments
  FOR INSERT 
  WITH CHECK (true);

-- Create policy to allow update of tournaments
CREATE POLICY "Allow anyone to update tournaments" 
  ON public.tournaments
  FOR UPDATE 
  USING (true);

-- Add realtime replication
ALTER TABLE public.tournaments REPLICA IDENTITY FULL; 