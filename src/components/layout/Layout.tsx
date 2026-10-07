import { ReactNode, lazy, Suspense } from "react";
import Header from "./Header";
import Footer from "./Footer";
import MobileBottomNav from "./MobileBottomNav";
import GlobalSeoHead from "@/components/seo/GlobalSeoHead";
import NewsBar from "@/components/NewsBar";
import SessionExpiredBanner from "@/components/SessionExpiredBanner";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "react-router-dom";

const ChatWidget = lazy(() => import("@/components/chat/ChatWidget"));

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user } = useAuth();
  const isHome = useLocation().pathname === "/";

  return (
    <div className="min-h-screen flex flex-col">
      <GlobalSeoHead
        pageTitle={isHome ? "PakJobs — Government Jobs & Application Assistance in Pakistan" : undefined}
        pageDescription={isHome ? "Find government jobs in Pakistan, check profile-based eligibility, and get expert application assistance. Read the PakJobs guide to documents, fees, alerts and tracking." : undefined}
        pageOgTitle={isHome ? "PakJobs — Government Jobs & Application Assistance in Pakistan" : undefined}
        pageOgDescription={isHome ? "Government job discovery, eligibility matching and expert-assisted applications. Explore the full PakJobs guide, transparent fees and application tracking." : undefined}
        pageOgType={isHome ? "website" : undefined}
        canonicalUrl={isHome ? "https://pkjobs.lovable.app/" : undefined}
      />
      <SessionExpiredBanner />
      <Header />
      <NewsBar />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <div className="hidden md:block">
        <Footer />
      </div>
      <MobileBottomNav />
      {user && (
        <Suspense fallback={null}>
          <ChatWidget />
        </Suspense>
      )}
    </div>
  );
};

export default Layout;
