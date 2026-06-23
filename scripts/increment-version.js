const fs = require('fs');
const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));

// Dzielimy wersję na tablicę [major, minor, patch]
let [major, minor, patch] = appJson.expo.version.split('.').map(Number);

// Inkrementujemy patch (np. 1.0.0 -> 1.0.1)
patch += 1;

const newVersion = `${major}.${minor}.${patch}`;
appJson.expo.version = newVersion;

fs.writeFileSync('app.json', JSON.stringify(appJson, null, 2));
console.log(`Wersja aplikacji zaktualizowana do: ${newVersion}`);