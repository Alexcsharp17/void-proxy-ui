import React from 'react';
import { LegalLayout } from '../components/LegalLayout';
import { Shield, Database, Settings, Lock, UserCheck, Mail, FileEdit } from 'lucide-react';

const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
  <section className="mb-10 last:mb-0">
    <h2 className="flex items-center gap-3 text-xl font-headline font-bold text-text-primary mb-4">
      <Icon className="w-5 h-5 text-accent-primary shrink-0" />
      {title}
    </h2>
    <div className="space-y-3">{children}</div>
  </section>
);

const List = ({ items }: { items: string[] }) => (
  <ul className="list-disc pl-5 space-y-1.5 text-sm md:text-base">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="Last updated: December 2026">
      <Section icon={Shield} title="Introduction">
        <p>
          At Void Proxy, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our proxy platform.
        </p>
        <p>
          By using our services, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.
        </p>
      </Section>

      <Section icon={Database} title="Information We Collect">
        <h3 className="text-base font-semibold text-text-primary mt-4 mb-2">Personal Information</h3>
        <List items={[
          'Name and contact information (email address)',
          'Account credentials and authentication data',
          'Payment information and billing details',
          'Profile information and preferences',
        ]} />
        <h3 className="text-base font-semibold text-text-primary mt-6 mb-2">Usage Information</h3>
        <List items={[
          'Platform usage statistics and analytics',
          'Device information and browser data',
          'IP address and location data',
          'Proxy usage and session data (with your permission)',
        ]} />
      </Section>

      <Section icon={Settings} title="How We Use Your Information">
        <List items={[
          'To provide and maintain our services',
          'To process payments and manage your account',
          'To communicate with you about our services',
          'To improve our platform and develop new features',
          'To ensure security and prevent fraud',
          'To comply with legal obligations',
        ]} />
      </Section>

      <Section icon={Lock} title="Data Security">
        <p>
          We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
        </p>
        <List items={[
          'End-to-end encryption for sensitive data',
          'Regular security audits and assessments',
          'Secure data storage and transmission protocols',
          'Access controls and authentication systems',
        ]} />
      </Section>

      <Section icon={UserCheck} title="Your Rights">
        <p>You have the following rights regarding your personal information:</p>
        <List items={[
          'Right to access your personal data',
          'Right to rectify inaccurate information',
          'Right to erase your personal data',
          'Right to restrict processing of your data',
          'Right to data portability',
          'Right to object to processing',
        ]} />
      </Section>

      <Section icon={Mail} title="Contact Us">
        <p>If you have any questions about this Privacy Policy or our data practices, please contact us:</p>
        <div className="mt-3 p-4 rounded-xl bg-bg-main/50 border border-border-main">
          <a href="mailto:void.panel.team+support@gmail.com" className="text-accent-primary hover:underline font-medium">
            void.panel.team+support@gmail.com
          </a>
        </div>
      </Section>

      <Section icon={FileEdit} title="Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. You are advised to review this Privacy Policy periodically for any changes.
        </p>
      </Section>
    </LegalLayout>
  );
}
