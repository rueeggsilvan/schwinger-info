-- Migration to add audit fields and unique constraint to bewertungen

-- Add new audit columns
ALTER TABLE public.bewertungen
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users (id) DEFAULT auth.uid(),
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users (id),
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT timezone('utc', now()),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Add unique constraint on schwinger_id
ALTER TABLE public.bewertungen
  ADD CONSTRAINT bewertungen_schwinger_id_unique UNIQUE (schwinger_id);

-- Trigger function to set updated_at and updated_by on update
CREATE OR REPLACE FUNCTION public.set_bewertungen_update_audit()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := timezone('utc', now());
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function before update
DROP TRIGGER IF EXISTS bewertungen_update_audit_trigger ON public.bewertungen;
CREATE TRIGGER bewertungen_update_audit_trigger
BEFORE UPDATE ON public.bewertungen
FOR EACH ROW EXECUTE PROCEDURE public.set_bewertungen_update_audit();

-- Ensure row level security is enabled
ALTER TABLE public.bewertungen ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to update their own rows
CREATE POLICY "Authenticated users can update bewertungen" ON public.bewertungen
FOR UPDATE USING (auth.role() = 'authenticated');
