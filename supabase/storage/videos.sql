-- Create videos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  false,
  104857600, -- 100MB
  ARRAY['video/mp4', 'video/quicktime', 'video/x-m4v']
);

-- Storage policies for videos bucket

-- Users can upload their own videos
CREATE POLICY "Users can upload own videos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

-- Users can view their own videos
CREATE POLICY "Users can view own videos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

-- Users can delete their own videos
CREATE POLICY "Users can delete own videos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = (SELECT auth.uid())::text
);
