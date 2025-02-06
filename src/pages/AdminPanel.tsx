import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Users, Music, Shirt, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCreateEvent } from '../contexts/CreateEventContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import CreateEventModal from '../components/CreateEventModal';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  created_at: string;
}

export default function AdminPanel() {
  const [events, setEvents] = useState<Event[]>([]);
  const { user } = useAuth();
  const { showCreateEvent, setShowCreateEvent } = useCreateEvent();
  const navigate = useNavigate();

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      toast.error('Error loading events');
    }
  }

  async function deleteEvent(eventId: string) {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast.success('Event deleted successfully');
      setEvents(events.filter(event => event.id !== eventId));
    } catch (error) {
      toast.error('Error deleting event');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Your Carnival Events</h1>
        <button
          onClick={() => setShowCreateEvent(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          New Event
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="bg-white/10 backdrop-blur-lg rounded-lg p-6 space-y-4"
          >
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold text-white">{event.title}</h3>
              <button
                onClick={() => deleteEvent(event.id)}
                className="text-white/60 hover:text-red-400 transition-colors"
                title="Delete event"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
            <p className="text-white/80">{event.description}</p>
            <div className="flex items-center gap-2 text-white/80">
              <Calendar className="h-5 w-5" />
              {format(new Date(event.date), 'PPp')}
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Users className="h-5 w-5" />
              {event.location}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/invite/${event.id}`)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Users className="h-4 w-4" />
                Invites
              </button>
              <button
                onClick={() => navigate(`/music/${event.id}`)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
              >
                <Music className="h-4 w-4" />
                Music
              </button>
              <button
                onClick={() => navigate(`/costumes/${event.id}`)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Shirt className="h-4 w-4" />
                Costumes
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreateEvent && (
        <CreateEventModal 
          onClose={() => setShowCreateEvent(false)}
          onEventCreated={loadEvents}
        />
      )}
    </div>
  );
}
