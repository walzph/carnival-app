-- Create custom types
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined');

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  title text NOT NULL,
  description text,
  date timestamptz NOT NULL,
  location text NOT NULL,
  created_by uuid REFERENCES auth.users(id) NOT NULL
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  invite_code text DEFAULT encode(gen_random_bytes(6), 'hex') NOT NULL UNIQUE,
  guest_name text NOT NULL,
  guest_email text NOT NULL,
  status invitation_status DEFAULT 'pending' NOT NULL
);

-- Create spotify_tracks table
CREATE TABLE IF NOT EXISTS public.spotify_tracks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  track_url text NOT NULL,
  submitted_by uuid REFERENCES auth.users(id) NOT NULL,
  votes integer DEFAULT 0 NOT NULL
);

-- Create costume_submissions table
CREATE TABLE IF NOT EXISTS public.costume_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  image_url text NOT NULL,
  title text NOT NULL,
  votes integer DEFAULT 0 NOT NULL
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spotify_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.costume_submissions ENABLE ROW LEVEL SECURITY;

-- Policies for events
CREATE POLICY "Users can view events they created or are invited to" ON public.events
  FOR SELECT USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM public.invitations 
      WHERE event_id = events.id 
      AND guest_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can create events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own events" ON public.events
  FOR DELETE USING (auth.uid() = created_by);

-- Policies for invitations
CREATE POLICY "Event creators can manage invitations" ON public.invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE id = event_id 
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Anyone can view and respond to invitations" ON public.invitations
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update invitation response" ON public.invitations
  FOR UPDATE USING (true)
  WITH CHECK (status IN ('accepted', 'declined'));

-- Policies for spotify_tracks
CREATE POLICY "Event creators and invitees can manage tracks" ON public.spotify_tracks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events e
      LEFT JOIN public.invitations i ON i.event_id = e.id
      WHERE e.id = event_id 
      AND (
        e.created_by = auth.uid() OR
        (i.guest_email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND i.status = 'accepted')
      )
    )
  );

-- Policies for costume_submissions
CREATE POLICY "Event creators and invitees can manage costumes" ON public.costume_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events e
      LEFT JOIN public.invitations i ON i.event_id = e.id
      WHERE e.id = event_id 
      AND (
        e.created_by = auth.uid() OR
        (i.guest_email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND i.status = 'accepted')
      )
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS events_created_by_idx ON public.events(created_by);
CREATE INDEX IF NOT EXISTS invitations_event_id_idx ON public.invitations(event_id);
CREATE INDEX IF NOT EXISTS invitations_invite_code_idx ON public.invitations(invite_code);
CREATE INDEX IF NOT EXISTS spotify_tracks_event_id_idx ON public.spotify_tracks(event_id);
CREATE INDEX IF NOT EXISTS costume_submissions_event_id_idx ON public.costume_submissions(event_id);
