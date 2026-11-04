// scripts/zip_release.cjs
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const za = path.join(process.cwd(), 'node_modules', '7zip-bin', 'win', 'x64', '7za.exe');
const releaseDir = path.join(process.cwd(), 'release');

console.log('--- COMPRESSION DES PACKAGES DE DISTRIBUTION MONRESTO PRO ---');

const x64Dir = path.join(releaseDir, 'win-unpacked');
const x64Zip = path.join(releaseDir, 'MonResto-Pro-Win10-Win11-x64.zip');

if (fs.existsSync(x64Dir)) {
  console.log('1. Compression x64 (Windows 10 & 11)...');
  execSync(`"${za}" a -tzip -mx=5 "${x64Zip}" "${x64Dir}\\*"`, { stdio: 'inherit' });
  console.log('✅ Archive x64 prête :', (fs.statSync(x64Zip).size / (1024 * 1024)).toFixed(1), 'MB');
}

const ia32Dir = path.join(releaseDir, 'win-ia32-unpacked');
const ia32Zip = path.join(releaseDir, 'MonResto-Pro-Win7-ia32.zip');

if (fs.existsSync(ia32Dir)) {
  console.log('2. Compression ia32 (Windows 7 SP1 POS)...');
  execSync(`"${za}" a -tzip -mx=5 "${ia32Zip}" "${ia32Dir}\\*"`, { stdio: 'inherit' });
  console.log('✅ Archive ia32 prête :', (fs.statSync(ia32Zip).size / (1024 * 1024)).toFixed(1), 'MB');
}

console.log('--- TOUS LES EXÉCUTABLES ET PACKAGES SONT PRÊTS ---');
