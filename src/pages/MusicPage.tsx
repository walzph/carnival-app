import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Music, ThumbsUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Event {
  id: string;
  title: string;
}

interface Track {
  id: string;
  track_url: string;
  votes: number;
  submitted_by: string;
  created_at: string;
}

function getSpotifyTrackId(url: string): string | null {
  try {
    // Handle different Spotify URL formats
    const patterns = [
      /spotify:track:([a-zA-Z0-9]+)/, // Spotify URI
      /open\.spotify\.com\/track\/([a-zA-Z0-9]+)/, // Web URL
      /spotify\.com\/track\/([a-zA-Z0-9]+)/, // Alternative web URL
      /([a-zA-Z0-9]{22})/ // Direct track ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

export default function MusicPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [newTrackUrl, setNewTrackUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadEventAndTracks();
  }, [eventId]);

  async function loadEventAndTracks() {
    try {
      const [eventData, tracksData] = await Promise.all([
        supabase.from('events').select('id, title').eq('id', eventId).single(),
        supabase.from('spotify_tracks').select('*').eq('event_id', eventId),
      ]);

      if (eventData.error) throw eventData.error;
      if (tracksData.error) throw tracksData.error;

      setEvent(eventData.data);
      setTracks(tracksData.data || []);
    } catch (error) {
      toast.error('Error loading music data');
    }
  }

  async function submitTrack(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const trackId = getSpotifyTrackId(newTrackUrl);
    if (!trackId) {
      setError('Please enter a valid Spotify track URL or ID');
      return;
    }

    try {
      const { error } = await supabase.from('spotify_tracks').insert([
        {
          event_id: eventId,
          track_url: `https://open.spotify.com/track/${trackId}`,
          submitted_by: user?.id,
        },
      ]);

      if (error) throw error;

      toast.success('Track submitted successfully!');
      setNewTrackUrl('');
      loadEventAndTracks();
    } catch (error) {
      toast.error('Error submitting track');
    }
  }

  async function voteForTrack(trackId: string) {
    try {
      const { error } = await supabase
        .from('spotify_tracks')
        .update({ votes: tracks.find((t) => t.id === trackId)!.votes + 1 })
        .eq('id', trackId);

      if (error) throw error;

      loadEventAndTracks();
    } catch (error) {
      toast.error('Error voting for track');
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
          Music for {event.title}
        </h1>
      </div>

      <form onSubmit={submitTrack} className="space-y-2">
        <div className="flex gap-4">
          <input
            type="text"
            required
            value={newTrackUrl}
            onChange={(e) => setNewTrackUrl(e.target.value)}
            placeholder="Paste Spotify track URL or ID"
            className="flex-1 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
          />
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Music className="h-5 w-5" />
            Add Track
          </button>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <p className="text-white/60 text-sm">
          You can paste a Spotify track URL or just the track ID (e.g., 11dFghVXANMlKmJXsNCbNl)
        </p>
      </form>

      <div className="grid gap-6">
        {tracks
          .sort((a, b) => b.votes - a.votes)
          .map((track) => {
            const trackId = getSpotifyTrackId(track.track_url);
            return (
              <div
                key={track.id}
                className="bg-white/10 backdrop-blur-lg rounded-lg p-4 space-y-4"
              >
                {trackId ? (
                  <iframe
                    style={{ borderRadius: '12px' }}
                    src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`}
                    width="100%"
                    height="152"
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="rounded-lg"
                  />
                ) : (
                  <div className="text-red-400">Invalid Spotify URL</div>
                )}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-white/60">
                    Added {new Date(track.created_at).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => voteForTrack(track.id)}
                    className="flex items-center gap-2 px-3 py-1 bg-purple-600/50 text-white rounded-lg hover:bg-purple-700"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    {track.votes}
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
