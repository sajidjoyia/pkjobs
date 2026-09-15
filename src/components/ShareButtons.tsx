import { Facebook, Twitter, Share2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareDetail {
  label: string;
  value: string;
}

interface ShareButtonsProps {
  title: string;
  /** Canonical page URL (used as a fallback). */
  url?: string;
  description?: string;
  /**
   * Crawler-friendly URL that serves Open Graph meta on the first scrape
   * (an edge function that redirects humans to the canonical page). Used for
   * every share target so WhatsApp / Facebook / X always show the rich card.
   */
  previewUrl?: string;
  /** Extra key/value lines included in the WhatsApp message body. */
  details?: ShareDetail[];
}

const ShareButtons = ({ title, url, description, previewUrl, details }: ShareButtonsProps) => {
  const canonicalUrl = url || window.location.href;
  const shareUrl = previewUrl || canonicalUrl;

  const detailLines = (details || [])
    .filter((d) => d.value)
    .map((d) => `${d.label}: ${d.value}`)
    .join("\n");

  const whatsappText = [
    `*${title}*`,
    detailLines,
    description && !detailLines ? description : "",
  ]
    .filter(Boolean)
    .join("\n");

  const shortText = description ? `${title} - ${description}` : title;

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedShort = encodeURIComponent(shortText);

  const handleWhatsAppShare = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(whatsappText)}%0A%0A${encodedUrl}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleFacebookShare = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedShort}`,
      "_blank",
      "noopener,noreferrer,width=600,height=400"
    );
  };

  const handleTwitterShare = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodedShort}&url=${encodedUrl}`,
      "_blank",
      "noopener,noreferrer,width=600,height=400"
    );
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied — paste it anywhere to show the job preview");
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
