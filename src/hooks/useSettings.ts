import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useSettings() {
  const [settings, setSettings] = useState({ 
    appName: 'TITANES VOLEY CLUB', 
    logoUrl: '' 
  });
  
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({
          appName: data.appName || 'TITANES VOLEY CLUB',
          logoUrl: data.logoUrl || ''
        });
        
        if (data.appName) {
          document.title = data.appName;
        }
        
        if (data.logoUrl) {
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = data.logoUrl;
        }
      }
    }, (error) => {
      console.warn("Firestore listener error (settings):", error);
    });
    return unsub;
  }, []);

  return settings;
}
