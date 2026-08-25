import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ClubSettings } from '../types';
import { hexToRgb } from '../utils/colorExtractor';

const defaultSettings: ClubSettings = {
  appName: 'TITANES VOLEY CLUB',
  slogan: 'Plataforma Oficial y Formativa de Voleibol',
  description: 'Plataforma exclusiva para miembros del club. Accede a rutinas de entrenamiento, galerías de partidos, seguimiento de jugadores y contenido premium.',
  logoUrl: '',
  primaryColor: '#2563eb', // Royal Blue default
  primaryRgb: '37, 99, 235',
  accentColor: '#f59e0b',  // Amber default
  accentRgb: '245, 158, 11',
  themeMode: 'dark',
  heroTitle: 'Pasión, Disciplina y Victoria',
  heroSubtitle: 'Entrenamientos de alto rendimiento, análisis técnico de jugadas y seguimiento integral de nuestros deportistas.',
  heroBgUrl: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=2607&auto=format&fit=crop',
  ctaButtonText: 'Acceso a Miembros',
  showAnnouncement: true,
  announcementText: '🔥 ¡Temporada 2026 Abierta! Consulta los horarios de entrenamiento y cuotas en el panel.',
  statsChampionships: '15+',
  statsAthletes: '120',
  statsCategories: '8',
  statsFoundedYear: '2010',
  contactPhone: '+51 987 654 321',
  contactEmail: 'contacto@titanesvoley.com',
  contactLocation: 'Polideportivo Central, Cancha Principal',
  socialInstagram: 'https://instagram.com',
  socialFacebook: 'https://facebook.com',
  autoColorExtracted: true
};

export function useSettings(): ClubSettings {
  const [settings, setSettings] = useState<ClubSettings>(defaultSettings);
  
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        let primaryColor = data.primaryColor || defaultSettings.primaryColor;
        let primaryRgb = data.primaryRgb;
        if (!primaryRgb && primaryColor) {
          const rgbObj = hexToRgb(primaryColor);
          primaryRgb = `${rgbObj.r}, ${rgbObj.g}, ${rgbObj.b}`;
        }

        let accentColor = data.accentColor || defaultSettings.accentColor;
        let accentRgb = data.accentRgb;
        if (!accentRgb && accentColor) {
          const rgbObj = hexToRgb(accentColor);
          accentRgb = `${rgbObj.r}, ${rgbObj.g}, ${rgbObj.b}`;
        }

        const merged: ClubSettings = {
          ...defaultSettings,
          ...data,
          primaryColor,
          primaryRgb,
          accentColor,
          accentRgb
        };

        setSettings(merged);
        
        if (merged.appName) {
          document.title = merged.appName;
        }
        
        if (merged.logoUrl) {
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = merged.logoUrl;
        }

        // Apply CSS custom properties dynamically to :root
        const root = document.documentElement;
        if (primaryColor) {
          root.style.setProperty('--club-primary', primaryColor);
          root.style.setProperty('--club-primary-rgb', primaryRgb || '37, 99, 235');
        }
        if (accentColor) {
          root.style.setProperty('--club-accent', accentColor);
          root.style.setProperty('--club-accent-rgb', accentRgb || '245, 158, 11');
        }
      }
    }, (error) => {
      console.warn("Firestore listener error (settings):", error);
    });
    return unsub;
  }, []);

  return settings;
}

