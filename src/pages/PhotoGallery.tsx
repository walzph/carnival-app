import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Heart, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Event {
  id: string;
  title: string;
}

interface Photo {
  id: string;
  image_url: string;
  caption: string;
  likes: number;
  user_id: string;
  created_at: string;
}

export default function PhotoGallery() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadEventAndPhotos();
  }, [eventId]);

  async function loadEventAndPhotos() {
    try {
      const [eventData, photosData] = await Promise.all([
        supabase.from('events').select('id, title').eq('id', eventId).single(),
        supabase.from('event_photos').select('*').eq('event_id', eventId).order('created_at', { ascending: false }),
      ]);

      if (eventData.error) throw eventData.error;
      if (photosData.error) throw photosData.error;

      setEvent(eventData.data);
      setPhotos(photosData.data || []);
    } catch (error) {
      toast.error('Error loading photos');
    }
  }

  async function uploadPhoto(file: File) {
    try {
      setUploading(true);

      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${eventId}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('event-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('event-photos')
        .getPublicUrl(filePath);

      // 3. Create database record
      const { error: dbError } = await supabase.from('event_photos').insert([
        {
          event_id: eventId,
          user_id: user?.id,
          image_url: publicUrl,
          caption: caption,
        },
      ]);

      if (dbError) throw dbError;

      toast.success('Photo uploaded successfully!');
      setCaption('');
      loadEventAndPhotos();
    } catch (error) {
      toast.error('Error uploading photo');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    await uploadPhoto(file);
  }

  async function likePhoto(photoId: string) {
    try {
      const { error } = await supabase
        .from('event_photos')
        .update({ likes: photos.find((p) => p.id === photoId)!.likes + 1 })
        .eq('id', photoId);

      if (error) throw error;

      loadEventAndPhotos();
    } catch (error) {
      toast.error('Error liking photo');
    }
  }

  if (!event) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="text-white hover:text-gray-200"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-3xl font-bold text-white">
          Photos from {event.title}
        </h1>
      </div>

      <div className="space-y-4">
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Add a caption (optional)"
          className="w-full rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
        />
        <div className="flex gap-4">
          <label className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
            <div className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer">
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </div>
          </label>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="bg-white/10 backdrop-blur-lg rounded-lg overflow-hidden"
          >
            <img
              src={photo.image_url}
              alt={photo.caption}
              className="w-full h-64 object-cover"
            />
            <div className="p-4">
              {photo.caption && (
                <p className="text-white mb-4">{photo.caption}</p>
              )}
              <div className="flex justify-between items-center">
                <div className="text-sm text-white/60">
                  {new Date(photo.created_at).toLocaleDateString()}
                </div>
                <button
                  onClick={() => likePhoto(photo.id)}
                  className="flex items-center gap-2 px-3 py-1 bg-purple-600/50 text-white rounded-lg hover:bg-purple-600"
                >
                  <Heart className="h-4 w-4" />
                  {photo.likes}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
