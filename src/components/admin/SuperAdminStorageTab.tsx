import React from "react";
import { Image, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuperAdminStorageTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Storage Management</h3>
        <Button variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Firebase Storage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Image className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No images stored yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Waste entry images will appear here once employees upload them
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Storage browsing requires Firebase Storage configuration. Images are stored at{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-xs">/waste_images/&#123;employeeId&#125;/&#123;imageId&#125;.jpg</code>
        </p>
      </div>
    </div>
  );
}
