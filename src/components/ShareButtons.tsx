import { Facebook, Twitter, Share2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareButtonsProps {
  title: string;
  url?: string;
  description?: string;
  /**
   * Optional alternative URL to hand to Facebook's sharer. Use this when
   * you have a crawler-friendly endpoint (e.g. an edge function that
   * serves OG meta on first scrape) — humans following the share link
   * will be auto-redirected to the canonical page.
   */
  facebookUrl?: string;
}

const ShareButtons = ({ title, url, description, facebookUrl }: ShareButtonsProps) => {
  const shareUrl = url || window.location.href;
  const shareText = description
    ? `${title} - ${description}`
    : `Check out this job: ${title}`;

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);

  const handleWhatsAppShare = () => {
    window.open(
      `https://wa.me/?text=${encodedText}%0A%0A${encodedUrl}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleFacebookShare = () => {
    const fbTarget = encodeURIComponent(facebookUrl || shareUrl);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${fbTarget}&quote=${encodedText}`,
      "_blank",
      "noopener,noreferrer,width=600,height=400"
    );
  };

  const handleTwitterShare = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      "_blank",
      "noopener,noreferrer,width=600,height=400"
    );
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-muted-foreground">Share this job</p>
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={handleWhatsAppShare}
          className="gap-2 hover:bg-[#25D366]/10 hover:text-[#25D366] hover:border-[#25D366]/50"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleFacebookShare}
          className="gap-2 hover:bg-[#1877F2]/10 hover:text-[#1877F2] hover:border-[#1877F2]/50"
        >
          <Facebook className="h-4 w-4" />
          Facebook
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleTwitterShare}
          className="gap-2 hover:bg-foreground/10 hover:border-foreground/50"
        >
          <Twitter className="h-4 w-4" />
          X / Twitter
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="gap-2"
        >
          <Share2 className="h-4 w-4" />
          Copy Link
        </Button>
      </div>
    </div>
  );
};

export default ShareButtons;
