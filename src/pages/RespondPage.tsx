import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
}

interface Invitation {
  id: string;
  event_id: string;
  status: 'pending' | 'accepted' | 'declined';
}

export default function RespondPage() {
  const { inviteId } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [responded, setResponded] = useState(false);

  useEffect(() => {
    loadInvitationAndEvent();
  }, [inviteId]);

  async function loadInvitationAndEvent() {
    try {
      const { data: invitation, error: inviteError } = await supabase
        .from('invitations')
        .select('*, events(*)')
        .eq('id', inviteId)
        .single();

      if (inviteError) throw inviteError;
      if (!invitation) throw new Error('Invitation not found');

      setInvitation(invitation);
      setEvent(invitation.events);
      setResponded(invitation.status !== 'pending');
    } catch (error) {
      toast.error('Error loading invitation');
    }
  }

  async function respond(status: 'accepted' | 'declined') {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status })
        .eq('id', inviteId);

      if (error) throw error;

      setResponded(true);
      toast.success(`You have ${status} the invitation`);
    } catch (error) {
      toast.error('Error updating response');
    }
  }

  if (!event || !invitation) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-white text-xl">Loading invitation...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">{event.title}</h1>
        <p className="text-white/80 mb-6">{event.description}</p>
        
        <div className="space-y-4 mb-8">
          <div className="text-white">
            <div className="font-medium">When</div>
            <div>{new Date(event.date).toLocaleString()}</div>
          </div>
          <div className="text-white">
            <div className="font-medium">Where</div>
            <div>{event.location}</div>
          </div>
        </div>

        {responded ? (
          <div className="text-white text-xl">
            You have {invitation.status} this invitation
          </div>
        ) : (
          <div className="flex justify-center gap-4">
            <button
              onClick={() => respond('accepted')}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Check className="h-5 w-5" />
              Accept
            </button>
            <button
              onClick={() => respond('declined')}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <X className="h-5 w-5" />
              Decline
            </button>
          </div>
        )}
      </div>
    </div>
  );
}