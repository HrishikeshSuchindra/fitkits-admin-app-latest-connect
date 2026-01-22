import { ArrowLeft, Search, BookOpen, MessageCircle, FileQuestion, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

const faqCategories = [
  {
    icon: BookOpen,
    title: 'Getting Started',
    description: 'Learn the basics of managing venues',
    articles: 12,
  },
  {
    icon: MessageCircle,
    title: 'Bookings & Payments',
    description: 'Handle reservations and transactions',
    articles: 8,
  },
  {
    icon: FileQuestion,
    title: 'Troubleshooting',
    description: 'Common issues and solutions',
    articles: 15,
  },
];

const popularArticles = [
  'How to add a new venue?',
  'Managing booking conflicts',
  'Setting up pricing rules',
  'Understanding analytics dashboard',
  'Configuring slot blocks',
];

export default function HelpCentre() {
  const [searchQuery, setSearchQuery] = useState('');

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
          <h1 className="font-semibold text-foreground">Help Centre</h1>
        </div>
      </header>

      <div className="mobile-padding py-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Categories */}
        <div className="space-y-3">
          <h2 className="font-semibold text-foreground">Browse by Category</h2>
          <div className="space-y-3">
            {faqCategories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.title}
                  className="w-full card-elevated p-4 flex items-center gap-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground">{category.title}</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                    <p className="text-xs text-primary mt-1">{category.articles} articles</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Popular Articles */}
        <div className="space-y-3">
          <h2 className="font-semibold text-foreground">Popular Articles</h2>
          <div className="card-elevated divide-y divide-border">
            {popularArticles.map((article) => (
              <button
                key={article}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm text-foreground">{article}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="card-elevated p-4 text-center space-y-3">
          <p className="text-sm text-muted-foreground">Can't find what you're looking for?</p>
          <Link to="/contact">
            <Button variant="outline" className="w-full">
              Contact Support
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
