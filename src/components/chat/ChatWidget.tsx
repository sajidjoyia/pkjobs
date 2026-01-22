import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import {
  useMyConversations,
  useMessages,
  useCreateConversation,
  useSendMessage,
  useChatSubscription,
  useConversationsSubscription,
  useMarkAsRead,
} from '@/hooks/useChat';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const ChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading: loadingConversations } = useMyConversations();
  const { data: messages = [], isLoading: loadingMessages } = useMessages(selectedConversation);
  const createConversation = useCreateConversation();
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();

  // Real-time subscriptions
  useChatSubscription(selectedConversation);
  useConversationsSubscription();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when viewing conversation
  useEffect(() => {
    if (selectedConversation) {
      markAsRead.mutate(selectedConversation);
    }
  }, [selectedConversation, messages.length]);

  if (!user) return null;

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

  const handleCreateConversation = async () => {
    try {
      const conv = await createConversation.mutateAsync(subject || undefined);
      setSelectedConversation(conv.id);
      setShowNewChat(false);
      setSubject('');
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 h-[500px] bg-background border rounded-lg shadow-xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
            <h3 className="font-semibold">
              {selectedConversation ? 'Chat with Admin' : 'Support Chat'}
            </h3>
            {selectedConversation && (
              <button
                onClick={() => setSelectedConversation(null)}
                className="text-sm opacity-80 hover:opacity-100"
              >
                ← Back to conversations
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {!selectedConversation ? (
              // Conversations List
              <div className="h-full flex flex-col">
                <div className="p-2 border-b">
                  <Button
                    onClick={() => setShowNewChat(true)}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Conversation
                  </Button>
                </div>

                {showNewChat && (
                  <div className="p-3 border-b bg-muted/50">
                    <Input
                      placeholder="Subject (optional)"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="mb-2"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleCreateConversation}>
                        Start Chat
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowNewChat(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <ScrollArea className="flex-1">
                  {loadingConversations ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Loading...
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No conversations yet. Start a new one!
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {conversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedConversation(conv.id)}
                          className="w-full p-3 text-left rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className="font-medium text-sm truncate">
                            {conv.subject || 'General Inquiry'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(conv.updated_at), 'MMM d, h:mm a')}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            ) : (
              // Messages View
              <div className="h-full flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  {loadingMessages ? (
                    <div className="text-center text-muted-foreground">
                      Loading messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-muted-foreground">
                      No messages yet. Say hello!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            'max-w-[80%] p-3 rounded-lg',
                            msg.sender_id === user.id
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

                {/* Message Input */}
                <div className="p-3 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
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
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
