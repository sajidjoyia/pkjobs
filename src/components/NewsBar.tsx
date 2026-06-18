import { useState } from "react";
import { Megaphone } from "lucide-react";
import { useActiveNews } from "@/hooks/useNewsItems";
import { useSeoSettings } from "@/hooks/useSeoSettings";

const NewsBar = () => {
  const { data: news = [] } = useActiveNews();
  const { data: settings } = useSeoSettings();
  const [paused, setPaused] = useState(false);

  if (!news.length) return null;

  const speed = (settings as any)?.news_scroll_speed_seconds || 40;

  return (
    <div
      className="w-full bg-primary/10 dark:bg-primary/20 border-b border-primary/20 overflow-hidden relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container flex items-center gap-3 h-9">
        <div className="flex items-center gap-1.5 text-primary font-semibold text-xs uppercase tracking-wide shrink-0 z-10 bg-background/80 dark:bg-background/60 backdrop-blur-sm px-2 rounded">
          <Megaphone className="h-3.5 w-3.5" />
          <span>News</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div
            className="flex whitespace-nowrap"
            style={{
              animation: `news-marquee ${speed}s linear infinite`,
              animationPlayState: paused ? "paused" : "running",
            }}
          >
            {[...news, ...news].map((item, idx) => {
              const content = (
                <span className="inline-flex items-center gap-2 text-sm text-foreground/90">
                  <span>{item.title}</span>
                  <span className="text-primary">•</span>
                </span>
              );
              return item.url ? (
                <a
                  key={`${item.id}-${idx}`}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 hover:text-primary transition-colors"
                >
                  {content}
                </a>
              ) : (
                <span key={`${item.id}-${idx}`} className="px-4">
                  {content}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsBar;
