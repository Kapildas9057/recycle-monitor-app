import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { LeaderboardEntry } from "@/types";

interface LeaderboardTabProps {
  leaderboardData: LeaderboardEntry[];
}

export default function LeaderboardTab({ leaderboardData }: LeaderboardTabProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return "🥇 Champion";
      case 2: return "🥈 Runner-up";
      case 3: return "🥉 Third Place";
      default: return `#${rank}`;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-semibold text-foreground mb-2">
          Employee Leaderboard
        </h2>
        <p className="text-muted-foreground">
          Top performing employees based on total waste collected
        </p>
      </div>

      {/* Top 3 Podium */}
      {leaderboardData.length >= 3 && (
        <Card className="shadow-eco border-card-border bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Top Performers
            </CardTitle>
            <CardDescription>This month's waste collection champions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {leaderboardData.slice(0, 3).map((entry, index) => (
                <div 
                  key={entry.employee_id}
                  className={`text-center p-4 rounded-lg ${
                    index === 0 ? 'bg-gradient-to-b from-yellow-50 to-yellow-100 border-2 border-yellow-200' :
                    index === 1 ? 'bg-gradient-to-b from-gray-50 to-gray-100 border-2 border-gray-200' :
                    'bg-gradient-to-b from-amber-50 to-amber-100 border-2 border-amber-200'
                  }`}
                >
                  <div className="flex justify-center mb-2">
                    {getRankIcon(entry.rank)}
                  </div>
                  <Avatar className="mx-auto mb-2 w-12 h-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(entry.employeeName)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-sm text-foreground mb-1">
                    {entry.employeeName}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    ID: {entry.employee_id}
                  </p>
                  <div className="text-lg font-bold text-primary">
                    {entry.totalWaste.toFixed(1)} kg
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Leaderboard */}
      <Card className="shadow-card border-card-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Complete Rankings
          </CardTitle>
          <CardDescription>
            All employees ranked by total waste collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboardData.map((entry) => (
              <div 
                key={entry.employee_id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                  entry.rank <= 3 ? 'bg-accent/50 border-primary/20' : 'bg-card border-card-border'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8">
                    {getRankIcon(entry.rank)}
                  </div>
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {getInitials(entry.employeeName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {entry.employeeName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Employee ID: {entry.employee_id}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">
                      {entry.totalWaste.toFixed(1)} kg
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total collected
                    </div>
                  </div>
                  {entry.rank <= 3 && (
                    <Badge variant="secondary" className="ml-2">
                      {getRankBadge(entry.rank)}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}