import React from 'react';
import { LegalLayout } from '../components/LegalLayout';
import {
  FileText,
  Cog,
  User,
  CheckCircle,
  CreditCard,
  Coins,
  Copyright,
  AlertTriangle,
  Ban,
  Mail,
} from 'lucide-react';

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

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="Last updated: December 2026">
      <Section icon={FileText} title="Agreement to Terms">
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your use of the Void Proxy platform and services. By accessing or using our services, you agree to be bound by these Terms.
        </p>
        <p>
          If you do not agree to these Terms, please do not use our services. We reserve the right to modify these Terms at any time, and your continued use of our services constitutes acceptance of any changes.
        </p>
      </Section>

      <Section icon={Cog} title="Service Description">
        <p>Void Proxy provides a comprehensive proxy platform that includes:</p>
        <List items={[
          'Residential and datacenter proxy access',
          'API and dashboard management tools',
          'Usage analytics and reporting',
          'Order management and billing',
          'Multi-region and multi-country support',
        ]} />
      </Section>

      <Section icon={User} title="User Accounts">
        <h3 className="text-base font-semibold text-text-primary mt-4 mb-2">Account Creation</h3>
        <p>
          To use our services, you must create an account and provide accurate, complete information. You are responsible for maintaining the confidentiality of your account credentials.
        </p>
        <h3 className="text-base font-semibold text-text-primary mt-6 mb-2">Account Responsibilities</h3>
        <List items={[
          'You are responsible for all activities under your account',
          'You must notify us immediately of any unauthorized use',
          'You may not share your account with others',
        ]} />
      </Section>

      <Section icon={CheckCircle} title="Acceptable Use Policy">
        <p>You agree to use our services only for lawful purposes and in accordance with these Terms. You may not:</p>
        <List items={[
          'Violate any applicable laws or regulations',
          'Infringe on intellectual property rights',
          'Transmit harmful or malicious content',
          'Attempt to gain unauthorized access to our systems',
          'Use our services for spam or fraudulent activities',
          'Interfere with the proper functioning of our services',
        ]} />
      </Section>

      <Section icon={CreditCard} title="Payment Terms">
        <h3 className="text-base font-semibold text-text-primary mt-4 mb-2">Billing</h3>
        <p>
          Payment is required in advance for all services. All fees are non-refundable unless otherwise specified in our refund policy.
        </p>
        <h3 className="text-base font-semibold text-text-primary mt-6 mb-2">Refunds</h3>
        <p>
          Refunds are provided only in cases of service failure or technical issues on our end. Refund requests must be submitted within 30 days of the original purchase.
        </p>
      </Section>

      <Section icon={Coins} title="Financial Transactions & AML">
        <h3 className="text-base font-semibold text-text-primary mt-4 mb-2">Scope</h3>
        <p>
          The Service may accept payments in fiat or cryptocurrencies. Void Proxy is a non-custodial platform, and all digital assets are sent directly to your wallet. The Service does not hold users&apos; funds.
        </p>
        <h3 className="text-base font-semibold text-text-primary mt-6 mb-2">Risk-Based Approach</h3>
        <p>
          The Service applies a risk-based approach to monitoring transactions, proportionate to its size and stage of development. The focus is on identifying higher-risk activities, such as unusually large payments, repeated transactions inconsistent with normal service usage, or transactions linked to high-risk blockchain indicators.
        </p>
        <h3 className="text-base font-semibold text-text-primary mt-6 mb-2">Actions on Suspicious Activity</h3>
        <p>In case of suspicious activity, the Service reserves the right to:</p>
        <List items={[
          'Suspend or delay service provision',
          'Request additional information',
          'Issue refunds where technically possible',
          'Report activity where legally required',
        ]} />
        <h3 className="text-base font-semibold text-text-primary mt-6 mb-2">Compliance with Applicable Laws</h3>
        <p>
          The Service aims to comply with applicable laws and regulations related to anti-money laundering (AML) and counter-terrorist financing (CTF) to the extent possible given its stage as a startup.
        </p>
      </Section>

      <Section icon={Copyright} title="Intellectual Property">
        <p>
          The Void Proxy platform and all its content, features, and functionality are owned by Void Proxy and are protected by international copyright, trademark, and other intellectual property laws.
        </p>
        <p>
          You may not copy, modify, distribute, sell, or lease any part of our services without our express written permission.
        </p>
      </Section>

      <Section icon={AlertTriangle} title="Limitation of Liability">
        <p>
          To the maximum extent permitted by law, Void Proxy shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or use, arising out of or relating to your use of our services.
        </p>
      </Section>

      <Section icon={Ban} title="Termination">
        <p>
          We may terminate or suspend your account immediately, without prior notice, for any reason, including if you breach these Terms.
        </p>
        <p>
          Upon termination, your right to use our services will cease immediately, and we may delete your account and data.
        </p>
      </Section>

      <Section icon={Mail} title="Contact Information">
        <p>If you have any questions about these Terms of Service, please contact us:</p>
        <div className="mt-3 p-4 rounded-xl bg-bg-main/50 border border-border-main">
          <a href="mailto:void.panel.team+support@gmail.com" className="text-accent-primary hover:underline font-medium">
            void.panel.team+support@gmail.com
          </a>
        </div>
      </Section>
    </LegalLayout>
  );
}
