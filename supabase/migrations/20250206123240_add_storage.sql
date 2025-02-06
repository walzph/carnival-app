-- Enable storage for event photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-photos', 'event-photos', true);

-- Storage policy to allow authenticated uploads
CREATE POLICY "Authenticated users can upload event photos" ON storage.objects
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    bucket_id = 'event-photos'
  );

-- Storage policy to allow public viewing of photos
CREATE POLICY "Anyone can view event photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'event-photos'
  );
