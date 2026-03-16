import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Footer from './Footer';

interface LegalLayoutProps {
  title: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

export function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen selection:bg-accent-primary/30 selection:text-bg-main bg-bg-main">
      <nav className="sticky top-0 z-50 bg-bg-main/80 backdrop-blur-md border-b border-border-main">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 text-text-secondary hover:text-text-primary transition-colors">
            <img src="/void.svg" alt="Void Proxy" className="h-7 w-auto" />
            <span className="text-sm font-medium hidden sm:inline">Void Proxy</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-accent-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Home
            </Link>
            <Link to="/#pricing" className="text-sm font-medium text-text-secondary hover:text-accent-primary transition-colors">
              Pricing
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <header className="text-center mb-10 md:mb-14">
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-text-primary mb-2 tracking-tight">
            {title}
          </h1>
          {lastUpdated && (
            <p className="text-sm text-text-muted font-label uppercase tracking-wider">
              {lastUpdated}
            </p>
          )}
        </header>

        <article className="glass-card rounded-2xl border border-border-main p-6 md:p-10 text-text-secondary leading-relaxed">
          {children}
        </article>
      </main>

      <footer className="mt-20">
        <Footer />
      </footer>
    </div>
  );
}
