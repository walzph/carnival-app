import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Event {
  id: string;
  title: string;
}

interface Invitation {
  id: string;
  email: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export default function InvitePage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    loadEventAndInvitations();
  }, [eventId]);

  async function loadEventAndInvitations() {
    try {
      const [eventData, invitationsData] = await Promise.all([
        supabase.from('events').select('id, title').eq('id', eventId).single(),
        supabase.from('invitations').select('*').eq('event_id', eventId),
      ]);

      if (eventData.error) throw eventData.error;
      if (invitationsData.error) throw invitationsData.error;

      setEvent(eventData.data);
      setInvitations(invitationsData.data || []);
    } catch (error) {
      toast.error('Error loading event data');
    }
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { error } = await supabase.from('invitations').insert([
        {
          event_id: eventId,
          email: newEmail,
        },
      ]);

      if (error) throw error;

      toast.success('Invitation sent successfully!');
      setNewEmail('');
      loadEventAndInvitations();
    } catch (error) {
      toast.error('Error sending invitation');
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
          Invitations for {event.title}
        </h1>
      </div>

      <form onSubmit={sendInvite} className="flex gap-4">
        <input
          type="email"
          required
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Enter email address"
          className="flex-1 rounded-lg bg-white/10 border-white/20 text-white placeholder-white/50"
        />
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Mail className="h-5 w-5" />
          Send Invite
        </button>
      </form>

      <div className="bg-white/10 backdrop-blur-lg rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/20">
              <th className="px-6 py-3 text-left text-sm font-medium text-white">Email</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-white">Status</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-white">Sent At</th>
            </tr>
          </thead>
          <tbody>
            {invitations.map((invitation) => (
              <tr key={invitation.id} className="border-b border-white/10">
                <td className="px-6 py-4 text-sm text-white">{invitation.email}</td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      invitation.status === 'accepted'
                        ? 'bg-green-100 text-green-800'
                        : invitation.status === 'declined'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {invitation.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-white">
                  {new Date(invitation.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}