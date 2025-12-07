# Foto Diashow App

Eine statische Web-App zum Erstellen von Foto-Diashows mit Kamera-Integration.

## Features

- 📷 **Kamera-Integration**: Mehrere Fotos aufnehmen und lokal speichern
- 🎯 **Auswahl-Modus**: Fotos durch Wischen, Pfeiltasten oder Neigungssensor auswählen
- 📍 **Standort-Erkennung**: Automatische Ermittlung des Aufnahmeorts
- 🖼️ **Diashow-Viewer**: Vollbild-Diashow der erstellten Alben
- 📱 **Responsive Design**: Funktioniert auf Desktop (Chrome) und Mobile (iPhone/Android)

## Verwendung

### 1. Fotos aufnehmen
- Auf der Startseite auf das "+" Symbol klicken
- Kamera öffnet sich (Berechtigung erforderlich)
- Mehrere Fotos aufnehmen
- Mit dem ✓ Button die Session beenden

### 2. Fotos auswählen
- Jedes Foto wird nacheinander angezeigt
- **Links wischen/Pfeiltaste links**: Foto verwerfen
- **Rechts wischen/Pfeiltaste rechts**: Foto beibehalten
- **Neigungssensor**: Gerät nach links/rechts neigen

### 3. Album erstellen
- Übersicht der ausgewählten Fotos erscheint
- "Album erstellen" klicken
- Namen eingeben (Standort wird automatisch angezeigt)
- Album wird auf der Startseite erstellt

### 4. Diashow ansehen
- Auf ein Album auf der Startseite klicken
- Diashow startet
- Navigation mit Pfeiltasten oder Wischen

## Technische Details

- **Lokale Speicherung**: Alle Daten werden im Browser-LocalStorage gespeichert
- **Keine Server-Anbindung**: Funktioniert komplett offline
- **Browser-Kompatibilität**: Chrome, Safari (iOS), Chrome (Android)

## Hinweise

- Für Kamera-Zugriff ist HTTPS oder localhost erforderlich
- Standort-Erkennung benötigt Browser-Berechtigung
- Neigungssensor funktioniert nur auf unterstützten Geräten

