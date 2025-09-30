import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      return; // Already installed
    }

    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      
      // Show prompt after a delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS, show manual install instructions
    if (iOS && !isStandalone) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Error during installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show if already dismissed in this session
  if (sessionStorage.getItem('pwa-prompt-dismissed')) {
    return null;
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="bg-gradient-to-r from-primary to-primary-glow rounded-xl shadow-lg border border-white/20 backdrop-blur-sm p-4">
        <div className="flex items-start gap-3">
          <div className="bg-white/20 rounded-full p-2 flex-shrink-0">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          
          <div className="flex-1 text-white">
            <h3 className="font-semibold text-sm mb-1">
              Install EcoShift
            </h3>
            
            {isIOS ? (
              <p className="text-xs opacity-90 mb-3">
                Tap the share button and select "Add to Home Screen" to install this app.
              </p>
            ) : (
              <p className="text-xs opacity-90 mb-3">
                Install our app for the best experience with offline access.
              </p>
            )}
            
            <div className="flex gap-2">
              {isInstallable && !isIOS && (
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="bg-white text-primary hover:bg-white/90 text-xs px-3 py-1 h-7"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Install
                </Button>
              )}
              
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 text-xs px-3 py-1 h-7"
              >
                Later
              </Button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;