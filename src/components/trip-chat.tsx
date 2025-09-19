
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface TripChatProps {
  tripId: string;
  userRole: 'passenger' | 'driver';
  currentUserName: string;
  otherUserName: string;
}

export default function TripChat({ tripId, userRole, currentUserName, otherUserName }: TripChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setCurrentUserId(user.id);
        }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!tripId || !currentUserId) return;

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('trip_id', tripId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error fetching messages:", error);
            toast({ title: "Error", description: "No se pudieron cargar los mensajes.", variant: 'destructive'});
        } else {
            setMessages(data);
        }
        setLoading(false);
    };

    fetchMessages();

    const channel = supabase.channel(`trip-chat-${tripId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `trip_id=eq.${tripId}` }, payload => {
        setMessages(currentMessages => [...currentMessages, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, currentUserId, toast]);
  
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
    if (newMessage.trim() === '' || !currentUserId || isSending) return;

    setIsSending(true);

    try {
      const { error } = await supabase.from('messages').insert({
        trip_id: tripId,
        sender_id: currentUserId,
        sender_name: currentUserName,
        text: newMessage,
      });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message: ", error);
      toast({ title: "Error", description: "No se pudo enviar el mensaje.", variant: 'destructive'});
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
              const isCurrentUser = msg.sender_id === currentUserId;
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
                         {getInitials(msg.sender_name || otherUserName)}
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
                         {getInitials(msg.sender_name || currentUserName)}
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
