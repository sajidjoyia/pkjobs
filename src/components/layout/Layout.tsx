import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import ChatWidget from "@/components/chat/ChatWidget";
import GlobalSeoHead from "@/components/seo/GlobalSeoHead";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <GlobalSeoHead />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatWidget />
    </div>
  );
};

export default Layout;
