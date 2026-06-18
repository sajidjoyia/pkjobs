import { ReactNode, lazy, Suspense } from "react";
import Header from "./Header";
import Footer from "./Footer";
import MobileBottomNav from "./MobileBottomNav";
import GlobalSeoHead from "@/components/seo/GlobalSeoHead";
import NewsBar from "@/components/NewsBar";
import SessionExpiredBanner from "@/components/SessionExpiredBanner";
import { useAuth } from "@/hooks/useAuth";

const ChatWidget = lazy(() => import("@/components/chat/ChatWidget"));

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <GlobalSeoHead />
      <SessionExpiredBanner />
      <NewsBar />
      <Header />
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
