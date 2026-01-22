import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import {
  useAllConversations,
  useMessages,
  useSendMessage,
  useChatSubscription,
  useConversationsSubscription,
  useMarkAsRead,
} from '@/hooks/useChat';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const AdminChatPanel = () => {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading: loadingConversations } = useAllConversations();
  const { data: messages = [], isLoading: loadingMessages } = useMessages(selectedConversation);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();

  // Real-time subscriptions
  useChatSubscription(selectedConversation);
  useConversationsSubscription();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark as read
  useEffect(() => {
    if (selectedConversation) {
      markAsRead.mutate(selectedConversation);
    }
  }, [selectedConversation, messages.length]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedConversation) return;

    try {
      await sendMessage.mutateAsync({
        conversationId: selectedConversation,
        content: message.trim(),
      });
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectedConv = conversations.find((c) => c.id === selectedConversation);

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          Live Chat Support
          <Badge variant="outline">{conversations.length} conversations</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex gap-4 overflow-hidden p-4 pt-0">
        {/* Conversations List */}
        <div className="w-1/3 border rounded-lg overflow-hidden flex flex-col">
          <div className="p-2 bg-muted/50 border-b text-sm font-medium">
            All Conversations
          </div>
          <ScrollArea className="flex-1">
            {loadingConversations ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Loading...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No conversations yet
              </div>
            ) : (
              <div className="p-1">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={cn(
                      'w-full p-3 text-left rounded-md transition-colors mb-1',
                      selectedConversation === conv.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    )}
                  >
                    <div className="font-medium text-sm truncate">
                      {conv.profiles?.full_name || 'Unknown User'}
                    </div>
                    <div className={cn(
                      'text-xs truncate',
                      selectedConversation === conv.id
                        ? 'opacity-80'
                        : 'text-muted-foreground'
                    )}>
                      {conv.subject || 'General Inquiry'}
                    </div>
                    <div className={cn(
                      'text-xs mt-1',
                      selectedConversation === conv.id
                        ? 'opacity-70'
                        : 'text-muted-foreground'
                    )}>
                      {format(new Date(conv.updated_at), 'MMM d, h:mm a')}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 border rounded-lg flex flex-col overflow-hidden">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a conversation to start chatting
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-3 border-b bg-muted/30">
                <div className="font-medium">
                  {selectedConv?.profiles?.full_name || 'Unknown User'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedConv?.subject || 'General Inquiry'}
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {loadingMessages ? (
                  <div className="text-center text-muted-foreground">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    No messages yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          'max-w-[80%] p-3 rounded-lg',
                          msg.sender_id === user?.id
                            ? 'ml-auto bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <span className="text-xs opacity-70 mt-1 block">
                          {format(new Date(msg.created_at), 'h:mm a')}
                        </span>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your reply..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!message.trim() || sendMessage.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminChatPanel;
