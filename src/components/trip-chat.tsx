
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, DocumentData } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface TripChatProps {
  tripId: string;
  userRole: 'passenger' | 'driver';
  currentUserName: string;
  otherUserName: string;
}

export default function TripChat({ tripId, userRole, currentUserName, otherUserName }: TripChatProps) {
  const [messages, setMessages] = useState<DocumentData[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!tripId || !currentUser) return;

    const messagesQuery = query(
      collection(db, 'trips', tripId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(messagesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching chat messages: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tripId, currentUser]);
  
  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollViewport) {
            setTimeout(() => {
                scrollViewport.scrollTop = scrollViewport.scrollHeight;
            }, 100);
        }
    }
  }, [messages]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !currentUser || isSending) return;

    setIsSending(true);

    try {
      await addDoc(collection(db, 'trips', tripId, 'messages'), {
        text: newMessage,
        senderId: currentUser.uid,
        senderName: currentUserName,
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message: ", error);
      // Maybe add a toast here in a future iteration
    } finally {
      setIsSending(false);
    }
  };
  
  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-grow bg-muted/50 my-4 rounded-lg p-4" ref={scrollAreaRef}>
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-muted-foreground">Inicia la conversación.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isCurrentUser = msg.senderId === currentUser?.uid;
              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex items-end gap-2',
                    isCurrentUser ? 'justify-end' : 'justify-start'
                  )}
                >
                  {!isCurrentUser && (
                     <Avatar className="h-8 w-8">
                       <AvatarFallback className="bg-primary/20 text-primary font-bold">
                         {getInitials(msg.senderName || otherUserName)}
                       </AvatarFallback>
                     </Avatar>
                  )}
                  <div
                    className={cn(
                      'max-w-[75%] rounded-lg px-3 py-2 text-sm break-words',
                      isCurrentUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card shadow-sm'
                    )}
                  >
                    <p>{msg.text}</p>
                  </div>
                   {isCurrentUser && (
                     <Avatar className="h-8 w-8">
                       <AvatarFallback className="bg-accent text-accent-foreground font-bold">
                         {getInitials(msg.senderName || currentUserName)}
                       </AvatarFallback>
                     </Avatar>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1"
          disabled={isSending}
        />
        <Button type="submit" disabled={isSending || newMessage.trim() === ''}>
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
