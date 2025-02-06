import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Link, ArrowLeft, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Event {
  id: string;
  title: string;
}

interface Invitation {
  id: string;
  invite_code: string;
  guest_name: string;
  guest_email: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export default function InvitePage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [showNewInviteModal, setShowNewInviteModal] = useState(false);
  const [newInvite, setNewInvite] = useState({
    name: '',
    email: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadEventAndInvitations();
  }, [eventId]);

  async function loadEventAndInvitations() {
    try {
      const [eventData, invitationsData] = await Promise.all([
        supabase.from('events').select('id, title').eq('id', eventId).single(),
        supabase.from('invitations').select('*').eq('event_id', eventId).order('created_at', { ascending: false }),
      ]);

      if (eventData.error) throw eventData.error;
      if (invitationsData.error) throw invitationsData.error;

      setEvent(eventData.data);
      setInvitations(invitationsData.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error loading event data');
    }
  }

  async function createInvite(e: React.FormEvent) {
    e.preventDefault();
    if (isCreating) return;

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('invitations')
        .insert({
          event_id: eventId,
          guest_name: newInvite.name,
          guest_email: newInvite.email,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating invitation:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from invitation creation');
      }

      toast.success('New invitation created!');
      setInvitations([data, ...invitations]);
      setShowNewInviteModal(false);
      setNewInvite({ name: '', email: '' });
      
      // Automatically copy the new invite link
      copyInviteLink(data.invite_code);
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast.error('Error creating invitation');
    } finally {
      setIsCreating(false);
    }
  }

  const copyInviteLink = async (inviteCode: string) => {
    const link = `${window.location.origin}/respond/${inviteCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(inviteCode);
      setTimeout(() => setCopied(null), 2000);
      toast.success('Invite link copied!');
    } catch (error) {
      showInviteLinkModal(inviteCode);
    }
  };

  const showInviteLinkModal = (inviteCode: string) => {
    const link = `${window.location.origin}/respond/${inviteCode}`;
    toast((t) => (
      <div className="p-4">
        <p className="mb-2">Copy this invitation link:</p>
        <div className="bg-gray-100 p-2 rounded-lg font-mono text-sm break-all">
          {link}
        </div>
      </div>
    ), { duration: 10000 });
  };

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

      <button
        onClick={() => setShowNewInviteModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
      >
        <Link className="h-5 w-5" />
        Create New Invite
      </button>

      <div className="bg-white/10 backdrop-blur-lg rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/20">
              <th className="px-6 py-3 text-left text-sm font-medium text-white">Guest</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-white">Email</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-white">Status</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-white">Created At</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invitations.map((invitation) => (
              <tr key={invitation.id} className="border-b border-white/10">
                <td className="px-6 py-4 text-sm text-white">
                  {invitation.guest_name}
                </td>
                <td className="px-6 py-4 text-sm text-white">
                  {invitation.guest_email}
                </td>
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
                <td className="px-6 py-4 text-sm">
                  <button
                    onClick={() => copyInviteLink(invitation.invite_code)}
                    className="text-white hover:text-purple-200"
                  >
                    {copied === invitation.invite_code ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Invite Modal */}
      {showNewInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Create New Invitation</h2>
            <form onSubmit={createInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Guest Name</label>
                <input
                  type="text"
                  required
                  value={newInvite.name}
                  onChange={(e) => setNewInvite({ ...newInvite, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  placeholder="Enter guest name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  required
                  value={newInvite.email}
                  onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  placeholder="Enter email address"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewInviteModal(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
