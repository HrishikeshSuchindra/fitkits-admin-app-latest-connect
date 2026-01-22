import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const sections = [
  {
    title: '1. Information We Collect',
    content: `We collect information you provide directly to us, such as when you create an account, 
    make a booking, or contact us for support. This may include your name, email address, phone number, 
    and payment information.`,
  },
  {
    title: '2. How We Use Your Information',
    content: `We use the information we collect to provide, maintain, and improve our services, 
    process transactions, send you technical notices and support messages, and respond to your 
    comments and questions.`,
  },
  {
    title: '3. Information Sharing',
    content: `We do not share your personal information with third parties except as described in 
    this policy. We may share information with venue owners when you make a booking, and with 
    service providers who assist in our operations.`,
  },
  {
    title: '4. Data Security',
    content: `We take reasonable measures to help protect your personal information from loss, 
    theft, misuse, unauthorized access, disclosure, alteration, and destruction. All data is 
    encrypted in transit and at rest.`,
  },
  {
    title: '5. Your Rights',
    content: `You have the right to access, update, or delete your personal information at any time. 
    You can manage your account settings or contact us for assistance with any data-related requests.`,
  },
  {
    title: '6. Cookies and Tracking',
    content: `We use cookies and similar technologies to collect information about your browsing 
    activities and to personalize your experience. You can control cookies through your browser settings.`,
  },
  {
    title: '7. Changes to This Policy',
    content: `We may update this privacy policy from time to time. We will notify you of any changes 
    by posting the new policy on this page and updating the effective date.`,
  },
  {
    title: '8. Contact Us',
    content: `If you have any questions about this Privacy Policy, please contact us at 
    privacy@fitkits.app or through our Contact Us page.`,
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="mobile-container pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border safe-top">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold text-foreground">Privacy Policy</h1>
        </div>
      </header>

      <div className="mobile-padding py-6 space-y-6">
        {/* Last Updated */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Last updated: January 2026</p>
        </div>

        {/* Introduction */}
        <div className="card-elevated p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            At FitKits, we take your privacy seriously. This Privacy Policy explains how we collect, 
            use, disclose, and safeguard your information when you use our mobile application and services.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.title} className="space-y-2">
              <h2 className="font-semibold text-foreground">{section.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
