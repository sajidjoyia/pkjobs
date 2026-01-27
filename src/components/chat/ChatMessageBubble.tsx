import { FileText, Image, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

interface ChatMessageBubbleProps {
  content: string;
  timestamp: string;
  isOwn: boolean;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
}

const ChatMessageBubble = ({
  content,
  timestamp,
  isOwn,
  attachmentUrl,
  attachmentName,
  attachmentType,
}: ChatMessageBubbleProps) => {
  const isImage = attachmentType?.startsWith('image/');
  const isPdf = attachmentType === 'application/pdf';

  const handleDownload = () => {
    if (attachmentUrl) {
      window.open(attachmentUrl, '_blank');
    }
  };

  return (
    <div
      className={cn(
        'max-w-[80%] p-3 rounded-lg',
        isOwn
          ? 'ml-auto bg-primary text-primary-foreground'
          : 'bg-muted'
      )}
    >
      {/* Attachment */}
      {attachmentUrl && (
        <div className="mb-2">
          {isImage ? (
            <a href={attachmentUrl} target="_blank" rel="noopener noreferrer">
              <img
                src={attachmentUrl}
                alt={attachmentName || 'Attachment'}
                className="max-w-full rounded-md max-h-48 object-cover"
              />
            </a>
          ) : isPdf ? (
            <div 
              className={cn(
                "flex items-center gap-2 p-2 rounded-md cursor-pointer",
                isOwn ? "bg-primary-foreground/10" : "bg-background"
              )}
              onClick={handleDownload}
            >
              <FileText className="h-8 w-8 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachmentName}</p>
                <p className={cn(
                  "text-xs",
                  isOwn ? "opacity-70" : "text-muted-foreground"
                )}>
                  PDF Document
                </p>
              </div>
              <Download className="h-4 w-4 flex-shrink-0" />
            </div>
          ) : (
            <a 
              href={attachmentUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-2 p-2 rounded-md",
                isOwn ? "bg-primary-foreground/10" : "bg-background"
              )}
            >
              <FileText className="h-4 w-4" />
              <span className="text-sm truncate">{attachmentName}</span>
            </a>
          )}
        </div>
      )}
      
      {/* Message Content */}
      {content && !content.startsWith('Sent a file:') && (
        <p className="text-sm">{content}</p>
      )}
      
      {/* Timestamp */}
      <span className="text-xs opacity-70 mt-1 block">
        {format(new Date(timestamp), 'h:mm a')}
      </span>
    </div>
  );
};

export default ChatMessageBubble;
