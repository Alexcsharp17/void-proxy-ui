import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { ArrowRight, ChevronDown, Menu, X, Zap, Database } from 'lucide-react';
import Footer from '../components/Footer';

const FAQ_KEYS = [
  'whatAreProxies',
  'trafficExpire',
  'stickySessions',
  'howToStart',
  'paymentMethods',
  'contactSupport',
  'api',
] as const;

export default function PricingPage() {
  const { t } = useTranslation('app');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-bg-main text-text-primary selection:bg-accent-primary/30">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-bg-main/80 backdrop-blur-md border-b border-border-main">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/void.svg" alt="Void Proxy" className="h-8 w-auto shrink-0" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium text-text-secondary hover:text-accent-primary transition-colors">
              Home
            </Link>
            <span className="text-sm font-medium text-accent-primary">Pricing</span>
            <Link to="/login" className="text-sm font-medium text-text-secondary hover:text-accent-primary transition-colors">
              Sign in
            </Link>
            <Link
              to="/register"
              className="px-4 py-2.5 text-sm font-bold bg-accent-primary text-bg-main rounded-xl hover:brightness-110 transition-all"
            >
              Get Started
            </Link>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <Link to="/register" className="px-4 py-2 text-sm font-bold bg-accent-primary text-bg-main rounded-lg">
              Get Started
            </Link>
            <button
              type="button"
              className="p-2 text-text-secondary hover:text-text-primary"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden border-t border-border-main px-4 py-4 space-y-3">
            <Link to="/" className="block text-text-primary font-medium" onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link to="/login" className="block text-text-secondary" onClick={() => setIsMenuOpen(false)}>Sign in</Link>
            <Link to="/register" className="block text-accent-primary font-medium" onClick={() => setIsMenuOpen(false)}>Get Started</Link>
          </div>
        )}
      </nav>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-12 md:py-20">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 md:mb-20"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
            {t('plans.title')}
          </h1>
          <p className="text-text-secondary max-w-xl mx-auto">
            {t('plans.subtitle')}
          </p>
        </motion.section>

        {/* Two pricing cards (products section) */}
        <section id="products" className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20 md:mb-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border-main bg-bg-panel p-6 md:p-8 flex flex-col"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-accent-primary" />
              </div>
              <h2 className="text-xl font-bold text-text-primary">Pay per GB</h2>
            </div>
            <p className="text-sm text-text-secondary mb-6 flex-1">
              {t('plans.proxyPlansDesc')}
            </p>
            <ul className="space-y-2 mb-8 text-sm text-text-secondary">
              {(['cleanIp', 'payPerTraffic', 'rotation', 'scraping'] as const).map((key) => (
                <li key={key} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-primary shrink-0" />
                  {t(`plans.featuresGb.${key}`)}
                </li>
              ))}
            </ul>
            <Link
              to="/register"
              className="w-full py-3.5 rounded-xl bg-accent-primary text-bg-main font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-border-main bg-bg-panel p-6 md:p-8 flex flex-col"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent-secondary/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-accent-secondary" />
              </div>
              <h2 className="text-xl font-bold text-text-primary">Unlimited</h2>
            </div>
            <p className="text-sm text-text-secondary mb-6 flex-1">
              {t('plans.proxyPlansDesc')}
            </p>
            <ul className="space-y-2 mb-8 text-sm text-text-secondary">
              {(['cleanIp', 'fixedSpeed', 'smm', 'tasks24'] as const).map((key) => (
                <li key={key} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-secondary shrink-0" />
                  {t(`plans.featuresUnlimited.${key}`)}
                </li>
              ))}
            </ul>
            <Link
              to="/register"
              className="w-full py-3.5 rounded-xl bg-accent-primary text-bg-main font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </section>

        {/* FAQ */}
        <motion.section
          id="faq"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="pt-8 border-t border-border-main"
        >
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            {t('support.faqTitle')}
          </h2>
          <p className="text-text-secondary text-sm mb-8">
            {t('support.faqSubtitle')}
          </p>
          <div className="divide-y divide-border-main/50 rounded-xl border border-border-main bg-bg-panel overflow-hidden">
            {FAQ_KEYS.map((key, index) => {
              const isOpen = openFaqIndex === index;
              const question = t(`support.faq.${key}.question`);
              const answer = t(`support.faq.${key}.answer`);
              return (
                <div key={key}>
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-bg-main/50 transition-colors"
                  >
                    <span className="font-medium text-text-primary">{question}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-0">
                      <p className="text-sm text-text-muted leading-relaxed">{answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.section>

        <div className="mt-12 text-center">
          <Link
            to="/"
            className="text-sm text-text-secondary hover:text-accent-primary transition-colors inline-flex items-center gap-1.5"
          >
            ← Back to homepage
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
