import { TrendingUp, Calendar, CalendarDays, CalendarRange, Leaf, Recycle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SummaryData, WasteEntry } from "@/types";

interface SummaryTabProps {
  summaryData: SummaryData;
  wasteEntries?: WasteEntry[];
}

export default function SummaryTab({ summaryData, wasteEntries = [] }: SummaryTabProps) {
  // Calculate approved waste for environmental impact
  const approvedWasteKg = wasteEntries
    .filter(entry => entry.status === 'approved')
    .reduce((sum, entry) => sum + (entry.amount || 0), 0);
  
  const co2Avoided = approvedWasteKg * 0.5;

  const summaryCards = [
    {
      title: "Today",
      value: summaryData.today,
      icon: Calendar,
      description: "Waste collected today",
      color: "text-primary",
    },
    {
      title: "This Week",
      value: summaryData.thisWeek,
      icon: CalendarDays,
      description: "Waste collected this week",
      color: "text-success",
    },
    {
      title: "This Month",
      value: summaryData.thisMonth,
      icon: CalendarRange,
      description: "Waste collected this month",
      color: "text-blue-500",
    },
    {
      title: "This Year",
      value: summaryData.thisYear,
      icon: TrendingUp,
      description: "Total waste collected this year",
      color: "text-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-semibold text-foreground mb-2">
          Waste Collection Summary
        </h2>
        <p className="text-muted-foreground">
          Overview of waste collection across different time periods
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card) => (
          <Card key={card.title} className="shadow-card border-card-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display font-bold text-foreground">
                {card.value.toFixed(1)} kg
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Environmental Impact Section */}
      <Card className="shadow-card border-primary/20 bg-gradient-to-r from-primary/5 via-background to-accent/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <Leaf className="w-4 h-4 text-primary" />
            </div>
            <CardTitle className="text-base font-display text-foreground">
              Environmental Impact
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <Recycle className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Waste Diverted from Landfill</p>
                <p className="text-lg font-semibold text-foreground">
                  {approvedWasteKg.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">kg</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-accent/5 rounded-lg border border-accent/10">
              <Leaf className="w-5 h-5 text-accent shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Estimated CO₂ Emissions Avoided</p>
                <p className="text-lg font-semibold text-foreground">
                  {co2Avoided.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">kg CO₂e</span>
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground/70 mt-3 italic">
            Estimation based on standard municipal solid waste emission factors. Values shown are indicative for pilot use.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-card border-card-border">
        <CardHeader>
          <CardTitle className="text-lg font-display">Collection Trends</CardTitle>
          <CardDescription>
            Waste collection performance across time periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <span className="text-sm font-medium text-foreground">Weekly Average</span>
              <span className="text-sm font-semibold text-primary">
                {(summaryData.thisWeek / 7).toFixed(1)} kg/day
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <span className="text-sm font-medium text-foreground">Monthly Average</span>
              <span className="text-sm font-semibold text-success">
                {(summaryData.thisMonth / 30).toFixed(1)} kg/day
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <span className="text-sm font-medium text-foreground">Yearly Progress</span>
              <span className="text-sm font-semibold text-blue-500">
                {summaryData.thisYear.toFixed(1)} kg total
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}