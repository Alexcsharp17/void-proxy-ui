import React from 'react';
import { Link } from 'react-router-dom';
import { Send, Mail, Share2 } from 'lucide-react';

const COPYRIGHT_YEAR = 2026;
const TELEGRAM_URL = 'https://t.me/void_smm_bot';
const SUPPORT_EMAIL = 'void.panel.team+support@gmail.com';

const headingClass = 'font-label text-text-primary text-xs uppercase tracking-widest mb-3';
const linkClass = 'text-sm text-text-secondary hover:text-accent-primary block py-0.5';

export default function Footer() {
  return (
    <footer className="bg-bg-main py-10 border-t border-border-main">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1 flex items-center">
            <Link to="/" className="block w-full">
              <img src="/void.svg" alt="Void Proxy" className="h-10 w-full object-contain object-center" />
            </Link>
          </div>

          {/* Nav — якоря как в навбаре */}
          <div>
            <h5 className={headingClass}>Nav</h5>
            <a href="#pricing" className={linkClass}>Pricing</a>
            <a href="#faq" className={linkClass}>FAQ</a>
            <a href="#features" className={linkClass}>Features</a>
          </div>

          {/* Legal */}
          <div>
            <h5 className={headingClass}>Legal</h5>
            <Link to="/privacy" className={linkClass}>Privacy Policy</Link>
            <Link to="/cookies" className={linkClass}>Cookie Policy</Link>
            <Link to="/terms" className={linkClass}>Terms of Service</Link>
          </div>

          {/* Contact */}
          <div>
            <h5 className={headingClass}>Contact</h5>
            <button
              type="button"
              onClick={() => navigator.share?.({ url: window.location.href, title: 'Void Proxy' })}
              className={`p-0 text-left ${linkClass}`}
              aria-label="Share"
            >
              <Share2 className="w-4 h-4 inline-block align-middle" />
              <span className="ml-1.5 align-middle">Share</span>
            </button>
            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 ${linkClass}`}>
              <Send className="w-4 h-4 shrink-0" /> Telegram
            </a>
            <a href={`mailto:${SUPPORT_EMAIL}`} className={`flex items-center gap-1.5 ${linkClass}`}>
              <Mail className="w-4 h-4 shrink-0" /> Email
            </a>
          </div>
        </div>
        <p className="text-[10px] text-text-muted text-center mt-6 pt-4 border-t border-border-main">
          © {COPYRIGHT_YEAR} Void Proxy. Premium Cyberpunk Proxy Solutions.
        </p>
      </div>
    </footer>
  );
}
