import React from 'react';
import { LegalLayout } from '../components/LegalLayout';
import { Cookie, List, BarChart3, Sliders, Megaphone, Settings, Clock, AlertCircle, FileEdit, Mail } from 'lucide-react';

const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
  <section className="mb-10 last:mb-0">
    <h2 className="flex items-center gap-3 text-xl font-headline font-bold text-text-primary mb-4">
      <Icon className="w-5 h-5 text-accent-primary shrink-0" />
      {title}
    </h2>
    <div className="space-y-3">{children}</div>
  </section>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="list-disc pl-5 space-y-1.5 text-sm md:text-base">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);

export default function CookiesPage() {
  return (
    <LegalLayout title="Cookie Policy" lastUpdated="Last updated: December 2026">
      <Section icon={Cookie} title="What Are Cookies">
        <p>
          Cookies are small text files that are stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and enabling certain functionality.
        </p>
        <p>
          This Cookie Policy explains how Void Proxy uses cookies and similar technologies on our platform and how you can control them.
        </p>
      </Section>

      <Section icon={List} title="Types of Cookies We Use">
        <h3 className="text-base font-semibold text-text-primary mt-4 mb-2">Essential Cookies</h3>
        <p>
          These cookies are necessary for the website to function properly. They enable basic functions like page navigation, access to secure areas, and authentication.
        </p>
        <BulletList items={[
          'Session management cookies',
          'Authentication cookies',
          'Security cookies',
          'Load balancing cookies',
        ]} />

        <h3 className="text-base font-semibold text-text-primary mt-6 mb-2">Performance Cookies</h3>
        <p>
          These cookies collect information about how visitors use our website, helping us improve performance and user experience.
        </p>
        <BulletList items={[
          'Analytics cookies (e.g. Google Analytics)',
          'Performance monitoring cookies',
          'Error tracking cookies',
        ]} />

        <h3 className="text-base font-semibold text-text-primary mt-6 mb-2">Functional Cookies</h3>
        <p>
          These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings.
        </p>
        <BulletList items={[
          'Language preference cookies',
          'Theme and display settings',
          'User interface preferences',
        ]} />

        <h3 className="text-base font-semibold text-text-primary mt-6 mb-2">Marketing Cookies</h3>
        <p>
          These cookies are used to track visitors across websites to display relevant and engaging advertisements.
        </p>
        <BulletList items={[
          'Advertising cookies',
          'Social media cookies',
          'Retargeting cookies',
        ]} />
      </Section>

      <Section icon={BarChart3} title="How We Use Cookies">
        <BulletList items={[
          'To ensure our website functions properly',
          'To remember your login status and preferences',
          'To analyze website traffic and usage patterns',
          'To improve our services and user experience',
          'To provide personalized content and features',
          'To detect and prevent fraud and security threats',
        ]} />
      </Section>

      <Section icon={Sliders} title="Third-Party Cookies">
        <p>We may use third-party services that set their own cookies. These include:</p>
        <BulletList items={[
          'Google Analytics: For website analytics and performance monitoring',
          'Social Media Platforms: For social sharing and integration features',
          'Payment Processors: For secure payment processing',
          'Customer Support: For live chat and support functionality',
        ]} />
        <p>
          These third parties have their own privacy policies and cookie practices. We recommend reviewing their policies for more information.
        </p>
      </Section>

      <Section icon={Settings} title="Managing Your Cookie Preferences">
        <p>You have several options for managing cookies:</p>
        <h3 className="text-base font-semibold text-text-primary mt-4 mb-2">Browser Settings</h3>
        <p>
          Most web browsers allow you to control cookies through their settings. You can:
        </p>
        <BulletList items={[
          'Block all cookies',
          'Block third-party cookies only',
          'Delete existing cookies',
          'Set up notifications for new cookies',
        ]} />
        <h3 className="text-base font-semibold text-text-primary mt-6 mb-2">Our Cookie Policy</h3>
        <p>
          This Cookie Policy is linked from the footer on every page. For technical control of cookies, use your browser settings above; for questions, contact us using the details at the end of this page.
        </p>
      </Section>

      <Section icon={Clock} title="Cookie Duration">
        <p>Cookies have different lifespans:</p>
        <BulletList items={[
          'Session Cookies: Deleted when you close your browser',
          'Persistent Cookies: Remain on your device for a set period',
          'First-Party Cookies: Set by our website directly',
          'Third-Party Cookies: Set by external services',
        ]} />
      </Section>

      <Section icon={AlertCircle} title="Impact of Disabling Cookies">
        <p>If you disable cookies, some features of our website may not function properly:</p>
        <BulletList items={[
          'You may need to log in repeatedly',
          'Your preferences may not be saved',
          'Some interactive features may not work',
          'Personalized content may not be available',
        ]} />
      </Section>

      <Section icon={FileEdit} title="Updates to This Policy">
        <p>
          We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons.
        </p>
        <p>
          We will notify you of any material changes by posting the updated policy on our website and updating the &quot;Last updated&quot; date.
        </p>
      </Section>

      <Section icon={Mail} title="Contact Us">
        <p>If you have any questions about our use of cookies, please contact us:</p>
        <div className="mt-3 p-4 rounded-xl bg-bg-main/50 border border-border-main">
          <a href="mailto:void.panel.team+support@gmail.com" className="text-accent-primary hover:underline font-medium">
            void.panel.team+support@gmail.com
          </a>
        </div>
      </Section>
    </LegalLayout>
  );
}
