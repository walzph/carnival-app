/*
  # Initial Schema for Carnival Event Planner

  1. New Tables
    - `events`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `date` (timestamptz)
      - `location` (text)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamptz)
    
    - `invitations`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references events)
      - `email` (text)
      - `status` (enum: pending, accepted, declined)
      - `created_at` (timestamptz)
    
    - `spotify_tracks`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references events)
      - `track_url` (text)
      - `submitted_by` (uuid, references auth.users)
      - `votes` (int)
      - `created_at` (timestamptz)
    
    - `costume_submissions`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references events)
      - `user_id` (uuid, references auth.users)
      - `image_url` (text)
      - `title` (text)
      - `votes` (int)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create custom types
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined');

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  date timestamptz NOT NULL,
  location text NOT NULL,
  created_by uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  status invitation_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Create spotify_tracks table
CREATE TABLE IF NOT EXISTS spotify_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events ON DELETE CASCADE NOT NULL,
  track_url text NOT NULL,
  submitted_by uuid REFERENCES auth.users NOT NULL,
  votes int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create costume_submissions table
CREATE TABLE IF NOT EXISTS costume_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  image_url text NOT NULL,
  title text NOT NULL,
  votes int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE spotify_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE costume_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
CREATE POLICY "Users can view events they created or are invited to" ON events
  FOR SELECT USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM invitations 
      WHERE event_id = events.id 
      AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can create events" ON events
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- RLS Policies for invitations
CREATE POLICY "Event creators can manage invitations" ON invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE id = invitations.event_id 
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Users can view their own invitations" ON invitations
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- RLS Policies for spotify_tracks
CREATE POLICY "Users can submit and vote on tracks for events they're invited to" ON spotify_tracks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM invitations 
      WHERE event_id = spotify_tracks.event_id 
      AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND status = 'accepted'
    )
  );

-- RLS Policies for costume_submissions
CREATE POLICY "Users can submit and vote on costumes for events they're invited to" ON costume_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM invitations 
      WHERE event_id = costume_submissions.event_id 
      AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND status = 'accepted'
    )
  );