import { ArrowLeft, Target, Users, Award, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const values = [
  {
    icon: Target,
    title: 'Our Mission',
    description: 'To make sports venue management effortless for owners and booking seamless for players.',
  },
  {
    icon: Users,
    title: 'Community First',
    description: 'Building stronger communities through accessible sports and fitness facilities.',
  },
  {
    icon: Award,
    title: 'Excellence',
    description: 'Delivering high-quality solutions that exceed expectations every time.',
  },
  {
    icon: Heart,
    title: 'Passion',
    description: 'Driven by our love for sports and technology to create amazing experiences.',
  },
];

const stats = [
  { value: '500+', label: 'Venues' },
  { value: '50K+', label: 'Bookings' },
  { value: '10K+', label: 'Users' },
  { value: '98%', label: 'Satisfaction' },
];

export default function AboutUs() {
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
          <h1 className="font-semibold text-foreground">About Us</h1>
        </div>
      </header>

      <div className="mobile-padding py-6 space-y-6">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto">
            <span className="text-primary-foreground font-bold text-2xl">FK</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground">FitKits</h2>
          <p className="text-muted-foreground">
            Empowering sports venue owners with smart management tools since 2024.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {stats.map((stat) => (
            <div key={stat.label} className="card-elevated p-3 text-center">
              <p className="text-lg font-bold text-primary">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Values */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Our Values</h3>
          <div className="space-y-3">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div key={value.title} className="card-elevated p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{value.title}</h4>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Story */}
        <div className="card-elevated p-4 space-y-3">
          <h3 className="font-semibold text-foreground">Our Story</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            FitKits was born from a simple observation: managing sports venues shouldn't be complicated. 
            Our founders, passionate about both sports and technology, set out to create a platform that 
            brings together venue owners and sports enthusiasts seamlessly.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Today, we're proud to serve hundreds of venues across the country, helping them grow their 
            business while making it easier for players to find and book their perfect court.
          </p>
        </div>

        {/* Version */}
        <p className="text-center text-xs text-muted-foreground">
          Version 1.0.0 • Made with ❤️ in India
        </p>
      </div>
    </div>
  );
}
