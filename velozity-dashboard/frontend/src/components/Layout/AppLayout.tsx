import { type ReactNode } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface AppLayoutProps {
  children: ReactNode;
  title: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title={title} />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
