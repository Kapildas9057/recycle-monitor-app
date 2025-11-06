import React, { useState, useEffect } from "react";
import { Image, Trash2, RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { storage } from "@/integrations/firebase/client";
import { ref, listAll, getDownloadURL, deleteObject, getMetadata } from "firebase/storage";

interface StorageFile {
  name: string;
  path: string;
  url: string;
  size: number;
  uploadedAt: string;
}

export default function SuperAdminStorageTab() {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const storageRef = ref(storage, 'waste_images');
      const result = await listAll(storageRef);
      
      const filePromises = result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        const metadata = await getMetadata(itemRef);
        return {
          name: itemRef.name,
          path: itemRef.fullPath,
          url,
          size: metadata.size,
          uploadedAt: metadata.timeCreated,
        };
      });

      const loadedFiles = await Promise.all(filePromises);
      setFiles(loadedFiles);
    } catch (error) {
      console.error("Failed to load storage files:", error);
      toast.error("Failed to load storage files");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (filePath: string, fileName: string) => {
    if (!confirm(`Delete ${fileName}?`)) return;

    try {
      const fileRef = ref(storage, filePath);
      await deleteObject(fileRef);
      toast.success("File deleted successfully");
      loadFiles();
    } catch (error) {
      console.error("Failed to delete file:", error);
      toast.error("Failed to delete file");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Storage Management</h3>
        <Button onClick={loadFiles} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            Firebase Storage ({files.length} files)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="text-center py-12">
              <Image className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No images stored yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Waste entry images will appear here once employees upload them
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file) => (
                <div key={file.path} className="border border-border rounded-lg p-4 space-y-3">
                  <img 
                    src={file.url} 
                    alt={file.name}
                    className="w-full h-48 object-cover rounded-md"
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(file.url, '_blank')}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFile(file.path, file.name)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Images are stored at{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-xs">/waste_images/&#123;employeeId&#125;/&#123;imageId&#125;.jpg</code>
        </p>
      </div>
    </div>
  );
}
