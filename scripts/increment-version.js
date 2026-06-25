const fs = require('fs');
const { execSync } = require('child_process');

const appJsonPath = './app.json';

try {
  // 1. Wczytanie pliku app.json
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

  // 2. Pobranie obecnej wersji (np. "1.0.0")
  const currentVersion = appJson.expo.version || "1.0.0";
  let versionParts = currentVersion.split('.').map(Number);

  // 3. Zwiększenie ostatniej cyfry (Patch)
  versionParts[2] += 1;
  const newVersion = versionParts.join('.');

  // 4. Aktualizacja obiektu i zapis do pliku
  appJson.expo.version = newVersion;
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');

  // 5. BARDZO WAŻNE: Dodanie zmienionego pliku app.json do aktualnego commita
  execSync(`git add ${appJsonPath}`);

  console.log(`\n🚀 [Wersjonowanie] Pomyślnie zaktualizowano wersję z ${currentVersion} do ${newVersion}\n`);
} catch (error) {
  console.error('\n❌ [Wersjonowanie] Błąd podczas aktualizacji wersji:', error.message, '\n');
  process.exit(1); // Zatrzymuje commita w razie błędu
}