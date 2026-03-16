import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { setLocale } from '../store/slices/appSlice';
import { updateLanguage } from '../i18n/config';
import type { RootState } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Users,
  ArrowRight,
  Globe,
  Lock,
  LayoutDashboard,
  Terminal,
  Search,
  ShoppingBag,
  Share2,
  CheckCircle2,
  Bug,
  Menu,
  X,
  Languages,
  ChevronDown,
  Coins,
} from 'lucide-react';
import { RotatingGlobe } from '../components/RotatingGlobe';
import { LiveRequests } from '../components/LiveRequests';
import Footer from '../components/Footer';
import { PricingSection } from '../components/PricingSection';

const FAQ_KEYS = [
  'whatAreProxies',
  'trafficExpire',
  'stickySessions',
  'howToStart',
  'paymentMethods',
  'contactSupport',
  'api',
] as const;

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.1 } },
  viewport: { once: true },
};

export default function LandingPage() {
  const { t } = useTranslation('app');
  const dispatch = useDispatch();
  const locale = useSelector((s: RootState) => s.app.locale);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const localeLabels: Record<'en' | 'ru', string> = { en: t('header.english'), ru: t('header.russian') };

  return (
    <div className="min-h-screen selection:bg-accent-primary/30 selection:text-bg-main bg-bg-main">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-bg-main/80 backdrop-blur-md border-b border-border-main">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <a href="#" aria-label="Void Proxy home">
              <img src="/void.svg" alt="Void Proxy" className="h-8 w-auto shrink-0" />
            </a>
            <div className="hidden lg:flex items-center gap-8">
              <a href="#pricing" className="text-sm font-medium text-text-secondary hover:text-accent-primary transition-colors">
                Pricing
              </a>
              <a href="#faq" className="text-sm font-medium text-text-secondary hover:text-accent-primary transition-colors">
                FAQ
              </a>
              <a href="#features" className="text-sm font-medium text-text-secondary hover:text-accent-primary transition-colors">
                Features
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative" ref={langRef}>
              <button
                type="button"
                onClick={() => setLangOpen((o) => !o)}
                className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-bg-panel/50"
                aria-label={localeLabels[locale]}
                title={localeLabels[locale]}
              >
                <Languages className="w-5 h-5" />
              </button>
              {langOpen && (
                <div className="absolute top-full right-0 mt-1 py-1 min-w-[6rem] rounded-xl bg-bg-panel border border-border-main shadow-lg z-50">
                  {(['en', 'ru'] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => {
                        dispatch(setLocale(l));
                        updateLanguage(l);
                        setLangOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest transition-colors ${locale === l ? 'text-accent-primary bg-accent-primary/10' : 'text-text-secondary hover:bg-bg-input hover:text-text-primary'}`}
                    >
                      {localeLabels[l]}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link
              to="/login"
              className="hidden md:block px-6 py-2.5 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="px-4 md:px-6 py-2 md:py-2.5 text-xs md:text-sm font-bold bg-accent-primary text-bg-main rounded-lg md:rounded-xl hover:brightness-110 transition-all shadow-lg shadow-accent-primary/20"
            >
              Get Started
            </Link>
            <button
              type="button"
              className="lg:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-bg-main border-b border-border-main overflow-hidden"
            >
              <div className="px-6 py-8 space-y-4">
                <a href="#pricing" className="block text-lg font-medium text-text-primary" onClick={() => setIsMenuOpen(false)}>Pricing</a>
                <a href="#faq" className="block text-lg font-medium text-text-primary" onClick={() => setIsMenuOpen(false)}>FAQ</a>
                <a href="#features" className="block text-lg font-medium text-text-primary" onClick={() => setIsMenuOpen(false)}>Features</a>
                <div className="pt-6 border-t border-border-main">
                  <Link to="/register" className="block w-full py-4 bg-accent-primary text-bg-main font-bold rounded-xl text-center">
                    Get Started
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden pt-4 md:pt-6 pb-24">
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="lg:hidden text-center mb-6">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-3xl font-headline font-bold text-text-primary leading-[1.15] mb-3 tracking-tight"
            >
              The proxy network built for the <span className="text-accent-primary text-glow">fearless.</span>
            </motion.h1>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-4">
              <p className="text-sm text-text-secondary leading-snug">
                Premium proxies with 100+ countries, unlimited bandwidth, and full customization.
              </p>
            </motion.div>
            <div className="flex flex-col gap-2 max-w-xs mx-auto">
              <Link
                to="/register"
                className="px-6 py-2.5 text-sm font-bold bg-accent-primary text-bg-main rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-accent-primary/20"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#pricing"
                className="px-6 py-2.5 text-sm font-bold bg-bg-panel/50 backdrop-blur border border-border-main text-text-primary rounded-xl hover:bg-bg-panel transition-all text-center"
              >
                View Pricing
              </a>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl overflow-hidden border border-border-main shadow-2xl relative min-h-[320px] sm:min-h-[380px] lg:min-h-[700px] flex flex-col bg-bg-main"
          >
            <div className="scanline absolute inset-0 z-10 pointer-events-none" />
            <div className="relative z-20 p-3 sm:p-4 md:p-8 flex flex-col h-full flex-grow">
              {/* Console Header */}
              <div className="flex items-center justify-between mb-4 md:mb-12 border-b border-border-main pb-3 md:pb-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/40" />
                  <div className="w-3 h-3 rounded-full bg-accent-secondary/40" />
                  <div className="w-3 h-3 rounded-full bg-accent-primary/40" />
                  <span className="hidden md:inline text-[10px] font-mono text-text-muted ml-2">global-proxy-network</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-bg-panel/50 border border-border-main">
                  <span className="w-2 h-2 rounded-full bg-accent-secondary animate-pulse" />
                  <span className="text-[10px] font-label uppercase tracking-widest text-text-secondary">LIVE</span>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row items-center justify-between gap-4 md:gap-8 flex-grow">
                <div className="hidden lg:block lg:flex-1 z-30">
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-5xl lg:text-7xl font-headline font-bold text-text-primary leading-[1.1] mb-8 tracking-tight"
                  >
                    The proxy network built for the <span className="text-accent-primary text-glow">fearless.</span>
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-lg lg:text-xl text-text-secondary mb-12 max-w-2xl leading-relaxed"
                  >
                    Premium proxies with 100+ countries, unlimited bandwidth, and full customization. Perfect for automation, scraping & multi-account workflows.
                  </motion.p>
                  <div className="flex flex-wrap gap-4">
                    <Link
                      to="/register"
                      className="px-8 py-4 bg-accent-primary text-bg-main font-bold rounded-xl flex items-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-accent-primary/20"
                    >
                      Get Started
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                    <a
                      href="#pricing"
                      className="px-8 py-4 bg-bg-panel/50 backdrop-blur border border-border-main text-text-primary font-bold rounded-xl hover:bg-bg-panel transition-all"
                    >
                      View Pricing
                    </a>
                  </div>
                </div>

                <div className="w-full lg:flex-1 flex justify-center lg:justify-end relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-accent-primary/5 blur-[120px] rounded-full" />
                  <RotatingGlobe />
                </div>
              </div>

              <div className="mt-4 md:mt-12">
                <LiveRequests />
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Features Bento Grid */}
      <section id="features" className="py-24 bg-bg-section-alt">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...fadeIn} className="text-center mb-16">
            <h2 className="text-3xl font-headline font-bold text-text-primary mb-4">Engineered for Stealth</h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Our infrastructure is built on Tier-1 backbone providers ensuring maximum uptime and protocol flexibility.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
          >
            <FeatureCard
              icon={<Globe className="w-6 h-6 md:w-8 md:h-8 text-accent-primary" />}
              title="Global Residential"
              description="16M+ real user devices across every major city."
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6 md:w-8 md:h-8 text-accent-violet" />}
              title="Blazing Fast"
              description="Response times under 100ms with optimized routing."
            />
            <FeatureCard
              icon={<Lock className="w-6 h-6 md:w-8 md:h-8 text-accent-primary" />}
              title="E2E Encrypted"
              description="Military-grade encryption for all data transit."
            />
            <FeatureCard
              icon={<Coins className="w-6 h-6 md:w-8 md:h-8 text-accent-violet" />}
              title="Crypto Payments"
              description="Pay anonymously with BTC, ETH, SOL, or USDC."
            />
            <FeatureCard
              icon={<LayoutDashboard className="w-6 h-6 md:w-8 md:h-8 text-accent-primary" />}
              title="Live Dashboard"
              description="Real-time usage tracking and session management."
            />
            <FeatureCard
              icon={<Terminal className="w-6 h-6 md:w-8 md:h-8 text-accent-violet" />}
              title="Developer API"
              description="REST API for seamless integration into your stacks."
            />
          </motion.div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="applications" className="py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div {...fadeIn} className="mb-16">
            <span className="font-label text-accent-primary text-xs tracking-widest uppercase mb-4 block">Applications</span>
            <h2 className="text-4xl font-headline font-bold text-text-primary">Built for real-world applications.</h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8"
          >
            <UseCaseCard icon={<Users />} title="Multi-Accounting" description="Manage thousands of accounts without detection." />
            <UseCaseCard icon={<Search />} title="Web Scraping" description="Extract data at scale with zero rate-limiting." />
            <UseCaseCard icon={<ShoppingBag />} title="Retail Bots" description="Secure the latest drops with high-speed nodes." />
            <UseCaseCard icon={<Share2 />} title="Social Media" description="Scale your presence using residential identity." />
            <UseCaseCard icon={<CheckCircle2 />} title="Ad Verification" description="Verify local ad placements globally with precision." />
            <UseCaseCard icon={<Bug />} title="Automation" description="Test applications from various geo-locations." />
          </motion.div>
        </div>
      </section>

      <PricingSection />

      {/* CTA Section */}
      <section id="cta" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            {...fadeIn}
            className="glass-card p-8 lg:p-24 rounded-3xl border border-border-main relative overflow-hidden"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-accent-primary/5 blur-[120px]" />
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl lg:text-6xl font-headline font-bold text-text-primary mb-6 tracking-tight">
                Ready to disappear?
              </h2>
              <p className="text-lg lg:text-xl text-text-secondary mb-12 leading-relaxed">
                Join thousands of users who trust Void Proxy. Start browsing anonymously in minutes.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  to="/register"
                  className="px-10 py-4 bg-accent-primary text-bg-main font-bold rounded-xl flex items-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-accent-primary/20 group inline-flex"
                >
                  Create free account
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#pricing"
                  className="px-10 py-4 bg-bg-panel/50 backdrop-blur border border-border-main text-text-primary font-bold rounded-xl hover:bg-bg-panel transition-all inline-flex"
                >
                  View Pricing
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-bg-section-alt border-t border-border-main/50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...fadeIn} className="text-center mb-16">
            <h2 className="text-4xl font-headline font-bold text-text-primary mb-4">{t('support.faqTitle')}</h2>
            <p className="text-text-secondary text-base md:text-lg max-w-2xl mx-auto">{t('support.faqSubtitle')}</p>
          </motion.div>
          <div className="max-w-4xl mx-auto divide-y divide-border-main rounded-2xl border border-border-main bg-bg-main overflow-hidden">
            {FAQ_KEYS.map((key, index) => {
              const isOpen = openFaqIndex === index;
              const question = t(`support.faq.${key}.question`);
              const answer = t(`support.faq.${key}.answer`);
              return (
                <div key={key}>
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between gap-6 px-6 py-5 text-left hover:bg-bg-panel/50 transition-colors"
                  >
                    <span className="text-lg font-medium text-text-primary">{question}</span>
                    <ChevronDown className={`h-6 w-6 shrink-0 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-0">
                      <p className="text-base text-text-secondary leading-relaxed">{answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      variants={fadeIn}
      className="p-4 md:p-8 rounded-xl bg-bg-main border border-border-main hover:border-accent-primary/30 transition-all group h-full"
    >
      <div className="mb-3 md:mb-6">{icon}</div>
      <h3 className="text-sm md:text-xl font-bold text-text-primary mb-1 md:mb-3">{title}</h3>
      <p className="text-[10px] md:text-sm text-text-secondary leading-relaxed line-clamp-3">{description}</p>
    </motion.div>
  );
}

function UseCaseCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      variants={fadeIn}
      className="glass-card p-0.5 md:p-1 rounded-2xl group cursor-default transition-all duration-300 hover:-translate-y-2 h-full"
    >
      <div className="p-4 md:p-8 rounded-[14px] bg-bg-panel/50 h-full">
        <div className="text-2xl md:text-4xl mb-3 md:mb-6 opacity-40 text-accent-violet">
          {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6 md:w-10 md:h-10' })}
        </div>
        <h4 className="text-sm md:text-lg font-bold text-text-primary mb-1 md:mb-3">{title}</h4>
        <p className="text-text-secondary text-[10px] md:text-sm leading-relaxed line-clamp-3">{description}</p>
      </div>
    </motion.div>
  );
}
