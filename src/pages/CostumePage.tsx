import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, ThumbsUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Event {
  id: string;
  title: string;
}

interface Costume {
  id: string;
  image_url: string;
  title: string;
  votes: number;
  user_id: string;
  created_at: string;
}

export default function CostumePage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [costumes, setCostumes] = useState<Costume[]>([]);
  const [newCostume, setNewCostume] = useState({
    title: '',
    image_url: '',
  });

  useEffect(() => {
    loadEventAndCostumes();
  }, [eventId]);

  async function loadEventAndCostumes() {
    try {
      const [eventData, costumesData] = await Promise.all([
        supabase.from('events').select('id, title').eq('id', eventId).single(),
        supabase.from('costume_submissions').select('*').eq('event_id', eventId),
      ]);

      if (eventData.error) throw eventData.error;
      if (costumesData.error) throw costumesData.error;

      setEvent(eventData.data);
      setCostumes(costumesData.data || []);
    } catch (error) {
      toast.error('Error loading costume data');
    }
  }

  async function submitCostume(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { error } = await supabase.from('costume_submissions').insert([
        {
          event_id: eventId,
          user_id: user?.id,
          ...newCostume,
        },
      ]);

      if (error) throw error;

      toast.success('Costume submitted successfully!');
      setNewCostume({ title: '', image_url: '' });
      loadEventAndCostumes();
    } catch (error) {
      toast.error('Error submitting costume');
    }
  }

  async function voteForCostume(costumeId: string) {
    try {
      const { error } = await supabase
        .from('costume_submissions')
        .update({ votes: costumes.find((c) => c.id === costumeId)!.votes + 1 })
        .eq('id', costumeId);

      if (error) throw error;

      loadEventAndCostumes();
    } catch (error) {
      toast.error('Error voting for costume');
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
          Costumes for {event.title}
        </h1>
      </div>

      <form onSubmit={submitCostume} className="space-y-4">
        <input
          type="text"
          required
          value={newCostume.title}
          onChange={(e) => setNewCostume({ ...newCostume, title: e.target.value })}
          placeholder="Costume title"
          className="w-full rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
        />
        <input
          type="url"
          required
          value={newCostume.image_url}
          onChange={(e) => setNewCostume({ ...newCostume, image_url: e.target.value })}
          placeholder="Image URL"
          className="w-full rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
        />
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Upload className="h-5 w-5" />
          Submit Costume
        </button>
      </form>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {costumes
          .sort((a, b) => b.votes - a.votes)
          .map((costume) => (
            <div
              key={costume.id}
              className="bg-white/10 backdrop-blur-lg rounded-lg overflow-hidden"
            >
              <img
                src={costume.image_url}
                alt={costume.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-bold text-white">{costume.title}</h3>
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-white/60">
                    Submitted {new Date(costume.created_at).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => voteForCostume(costume.id)}
                    className="flex items-center gap-2 px-3 py-1 bg-purple-600/50 text-white rounded-lg hover:bg-purple-600"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    {costume.votes}
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}