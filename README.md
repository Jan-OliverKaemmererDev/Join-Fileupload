# Join - File Upload

Willkommen beim "Join" Projekt! Dieses Repository beinhaltet eine erweiterte Version der Join-App, welche um fortgeschrittene Datei-Upload-Funktionalitäten und Gastnutzer-Verwaltung erweitert wurde.

## ⚠️ Wichtiger Hinweis für Gast-Nutzer (Guest Login)
Wenn du dich als **Gast** ("Guest Login") in der App anmeldest, bitten wir dich, dich **am Ende deiner Sitzung über den "Log out" Button abzumelden**. 
**Warum?** 
Beim Ausloggen greift ein Skript (`scripts/account-overlay.js` und `scripts/auth.js`), welches sicherstellt, dass dein temporärer, anonymer Benutzeraccount mitsamt aller zugehörigen Testdaten (wie Tasks und Kontakte) vollständig und sauber aus unserer Firebase-Datenbank gelöscht wird.

---

## 📂 Datei-Upload in der App

Diese App bietet umfassende Möglichkeiten, Bilddateien hochzuladen. Hier ist im Detail erklärt, wie dies funktioniert, wo es möglich ist und was im Hintergrund passiert.

### Wo können Dateien hochgeladen werden?
1. **Profilbild Upload:** Im Account-Overlay kannst du durch Klick auf das Kamera-Icon dein Profilbild ändern.
2. **Task-Anhänge (Attachments):** Beim Erstellen eines neuen Tasks (`addtask.html`) oder beim Bearbeiten eines Tasks auf dem Board (`board.html`).

### Wie können Dateien hochgeladen werden?
- **Profilbild:** Klicke einfach auf das Kamera-Icon. Daraufhin öffnet sich ein nativer Datei-Browser (versteckter File-Input). Nach der Auswahl kannst du das Bild innerhalb des Avatars verschieben (Panning/Cropping), um den gewünschten Bildausschnitt festzulegen.
- **Task-Anhänge:** Hier hast du zwei Möglichkeiten: Entweder per **Drag & Drop** in die dafür vorgesehene Upload-Area ziehen, oder per Klick auf die Upload-Schaltfläche den Datei-Browser öffnen.

### Was ist erlaubt?
- **Erlaubte Dateiformate:** Ausschließlich **JPEG** (`image/jpeg`) und **PNG** (`image/png`).
- **Maximale Dateigröße:** Dateien dürfen initial maximal **2 MB** groß sein.

### Was passiert im Hintergrund?
Wir legen großen Wert auf Sicherheit und Performance. Beim Upload greifen verschiedene Sicherheits- und Optimierungsmechanismen:
1. **Validierung der Magic Bytes:** Es wird nicht nur auf die Dateiendung geprüft, sondern das Skript liest die ersten Bytes (Magic Bytes) der Datei aus, um sicherzustellen, dass es sich wirklich um ein echtes JPEG oder PNG Bild handelt.
2. **Client-seitige Komprimierung:** Bevor die Daten an Firebase gesendet werden, komprimiert das Skript die Bilder im Browser über ein Canvas-Element. 
   - Für **Task-Anhänge** wird ein Originalbild (max. 800x800px, 60% Qualität) und ein Thumbnail (max. 200x200px, 70% Qualität) erzeugt.
   - Für **Profilbilder** wird ebenfalls ein großes und ein kleines Bild (Thumbnail) generiert.
3. **Base64-Konvertierung:** Die komprimierten Bild-Blobs werden in Base64-Strings umgewandelt. Das resultierende Bild darf nach der Komprimierung **1 MB** nicht überschreiten.
4. **Speicherung in Firebase Firestore:** Anstatt den Storage-Dienst zu nutzen, werden die Base64-Strings als direkte Properties des jeweiligen Dokuments (User oder Task) in der Firestore Database abgelegt.

### Wichtige Pfade und Dateien für den Datei-Upload
- **`scripts/file-upload-utils.js`:** Enthält die zentralen Utility-Funktionen (Magic Byte Validierung, Canvas-Komprimierung, Base64-Konvertierung).
- **`scripts/file-upload.js`:** Beinhaltet die Logik für das Profilbild (versteckter Filepicker, Drag/Panning Logik des Bildes).
- **`scripts/addtask-attachments.js`:** Steuert die Drag & Drop Upload-Area in den Tasks, das Rendern der Thumbnails und das Hinzufügen/Entfernen von Task-Anhängen.
- **`scripts/auth.js` / `scripts/account-overlay.js`:** Verantwortlich für das Löschen der Nutzerdaten beim Logout eines Gastes.
- **`addtask.html` & `board.html`:** Die HTML-Templates, die die Upload-Bereiche beinhalten.
