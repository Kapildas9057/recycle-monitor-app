import { useState } from "react";
import { User, Lock, UserCheck } from "lucide-react";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { EcoButton } from "@/components/ui/eco-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import type { AuthCredentials } from "@/types";

interface LoginFormProps {
  onLogin: (credentials: AuthCredentials) => Promise<void>;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [userType, setUserType] = useState<'employee' | 'admin'>('employee');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !password) {
      toast.error("Missing Information", { description: "Please enter both ID and password" });
      return;
    }

    setIsLoading(true);
    try {
      await onLogin({ id, password, userType });
    } catch (error) {
      toast.error("Login Failed", { description: "Invalid credentials. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-eco border-card-border">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-eco rounded-xl flex items-center justify-center">
            <UserCheck className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-display text-foreground">Welcome to EcoShift</CardTitle>
            <CardDescription className="text-muted-foreground">
              Professional waste management system
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={userType} onValueChange={(value) => setUserType(value as 'employee' | 'admin')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="employee">Employee</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <TabsContent value="employee" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Employee ID</label>
                  <InputWithIcon
                    icon={<User className="w-4 h-4" />}
                    placeholder="Enter your employee ID"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    required
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="admin" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Admin ID</label>
                  <InputWithIcon
                    icon={<User className="w-4 h-4" />}
                    placeholder="Enter your admin ID"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    required
                  />
                </div>
              </TabsContent>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <InputWithIcon
                  icon={<Lock className="w-4 h-4" />}
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <EcoButton 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </EcoButton>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}