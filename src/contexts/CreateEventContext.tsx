import React, { createContext, useContext, useState } from 'react';

interface CreateEventContextType {
  showCreateEvent: boolean;
  setShowCreateEvent: (show: boolean) => void;
}

const CreateEventContext = createContext<CreateEventContextType | undefined>(undefined);

export function CreateEventProvider({ children }: { children: React.ReactNode }) {
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  return (
    <CreateEventContext.Provider value={{ showCreateEvent, setShowCreateEvent }}>
      {children}
    </CreateEventContext.Provider>
  );
}

export function useCreateEvent() {
  const context = useContext(CreateEventContext);
  if (context === undefined) {
    throw new Error('useCreateEvent must be used within a CreateEventProvider');
  }
  return context;
}
