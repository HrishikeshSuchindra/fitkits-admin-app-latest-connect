import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing or using FitKits, you agree to be bound by these Terms of Service and 
    all applicable laws and regulations. If you do not agree with any of these terms, you are 
    prohibited from using or accessing this service.`,
  },
  {
    title: '2. Use License',
    content: `Permission is granted to temporarily use the FitKits application for personal, 
    non-commercial transitory viewing only. This license does not include modifying or copying 
    the materials, using the materials for any commercial purpose, or attempting to decompile 
    or reverse engineer any software contained in the application.`,
  },
  {
    title: '3. User Accounts',
    content: `You are responsible for maintaining the confidentiality of your account and password 
    and for restricting access to your device. You agree to accept responsibility for all activities 
    that occur under your account or password.`,
  },
  {
    title: '4. Venue Listings',
    content: `Venue owners are responsible for the accuracy of their listings. FitKits does not 
    guarantee the quality, safety, or legality of venues listed. We reserve the right to remove 
    any listing that violates our policies.`,
  },
  {
    title: '5. Bookings and Payments',
    content: `All bookings are subject to availability and venue owner approval. Payments are 
    processed securely through our payment partners. Cancellation and refund policies vary by 
    venue and are displayed before booking confirmation.`,
  },
  {
    title: '6. Prohibited Activities',
    content: `You may not use our service for any illegal purpose, to harass or harm others, 
    to impersonate any person or entity, or to interfere with the proper working of the service. 
    Violation may result in immediate termination of your account.`,
  },
  {
    title: '7. Limitation of Liability',
    content: `FitKits shall not be liable for any indirect, incidental, special, consequential, 
    or punitive damages resulting from your access to or use of, or inability to access or use, 
    the service or any content on the service.`,
  },
  {
    title: '8. Indemnification',
    content: `You agree to indemnify and hold harmless FitKits and its officers, directors, 
    employees, and agents from any claims, damages, losses, liabilities, and expenses arising 
    out of your use of the service or violation of these terms.`,
  },
  {
    title: '9. Governing Law',
    content: `These terms shall be governed by and construed in accordance with the laws of India, 
    without regard to its conflict of law provisions. Any disputes shall be resolved in the courts 
    of Bangalore, Karnataka.`,
  },
  {
    title: '10. Changes to Terms',
    content: `We reserve the right to modify these terms at any time. We will notify users of any 
    material changes by posting the new terms on this page. Your continued use of the service after 
    any such changes constitutes your acceptance of the new terms.`,
  },
];

export default function TermsOfService() {
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
          <h1 className="font-semibold text-foreground">Terms of Service</h1>
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
            Welcome to FitKits. These Terms of Service govern your use of our mobile application 
            and services. Please read these terms carefully before using our platform.
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
