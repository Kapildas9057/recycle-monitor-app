import { TrendingUp, Calendar, CalendarDays, CalendarRange } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SummaryData } from "@/types";

interface SummaryTabProps {
  summaryData: SummaryData;
}

export default function SummaryTab({ summaryData }: SummaryTabProps) {
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