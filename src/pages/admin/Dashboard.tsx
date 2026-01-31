import { useQuery } from '@tanstack/react-query';
import { edgeFunctionApi } from '@/lib/edgeFunctionApi';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  MapPin, 
  TrendingUp, 
  TrendingDown,
  ChevronDown,
  CalendarDays
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

function KPICard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  iconBg,
  loading 
}: { 
  title: string; 
  value: string; 
  change?: number; 
  icon: React.ElementType;
  iconBg: string;
  loading?: boolean;
}) {
  const isPositive = change && change > 0;
  
  if (loading) {
    return (
      <Card className="card-elevated">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-14" />
            </div>
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elevated">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="metric-label">{title}</p>
            <p className="metric-value mt-1">{value}</p>
            {change !== undefined && (
              <div className={isPositive ? 'growth-positive' : 'growth-negative'}>
                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{Math.abs(change).toFixed(1)}%</span>
              </div>
            )}
          </div>
          <div className={`icon-container ${iconBg}`}>
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => edgeFunctionApi.getAnalytics('overview', '30d'),
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['analytics', 'revenue'],
    queryFn: () => edgeFunctionApi.getAnalytics('revenue', '30d'),
  });

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['analytics', 'bookings'],
    queryFn: () => edgeFunctionApi.getAnalytics('bookings', '30d'),
  });

  const stats = overview?.overview;

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}k`;
    }
    return `₹${amount}`;
  };

  return (
    <AdminLayout title="Business Insights">
      <div className="space-y-6">
        {/* Date Range Selector */}
        <Card className="card-elevated">
          <CardContent className="p-3">
            <Button variant="ghost" className="w-full justify-between text-foreground">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Last 30 Days</span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </CardContent>
        </Card>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 gap-3">
          <KPICard
            title="Total Revenue"
            value={stats ? formatCurrency(stats.totalRevenue) : '$0'}
            change={stats?.revenueGrowth}
            icon={DollarSign}
            iconBg="bg-success-light"
            loading={overviewLoading}
          />
          <KPICard
            title="Total Bookings"
            value={stats?.totalBookings?.toLocaleString() ?? '0'}
            change={stats?.bookingGrowth}
            icon={Calendar}
            iconBg="bg-primary-light"
            loading={overviewLoading}
          />
          <KPICard
            title="Total Users"
            value={stats?.totalUsers?.toLocaleString() ?? '0'}
            change={stats?.userGrowth}
            icon={Users}
            iconBg="bg-warning-light"
            loading={overviewLoading}
          />
          <KPICard
            title="Active Venues"
            value={stats?.activeVenues?.toLocaleString() ?? '0'}
            icon={MapPin}
            iconBg="bg-accent"
            loading={overviewLoading}
          />
        </div>

        {/* Revenue Chart */}
        <Card className="card-elevated">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-4">Revenue Trend</h3>
            {revenueLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={revenueData?.revenue || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [`$${value}`, 'Revenue']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bookings Chart */}
        <Card className="card-elevated">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-4">Bookings Overview</h3>
            {bookingsLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={bookingsData?.bookings || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [value, 'Bookings']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--primary))" 
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
