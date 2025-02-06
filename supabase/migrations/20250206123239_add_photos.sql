-- Create event_photos table
CREATE TABLE IF NOT EXISTS public.event_photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  image_url text NOT NULL,
  caption text,
  likes integer DEFAULT 0 NOT NULL
);

-- Enable RLS
ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;

-- Policies for event_photos
CREATE POLICY "Event creators and invitees can view photos" ON public.event_photos
  FOR SELECT USING (
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

CREATE POLICY "Event creators and invitees can add photos" ON public.event_photos
  FOR INSERT WITH CHECK (
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

CREATE POLICY "Users can update likes on photos" ON public.event_photos
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS event_photos_event_id_idx ON public.event_photos(event_id);
