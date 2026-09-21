#!/bin/bash

# Kullanıcıdan commit mesajı al, mesaj yazılmazsa varsayılan metni kullan
COMMIT_MSG=${1:-"Makam ve Kontrol için otomatik toplu güncelleme"}

echo "------------------------------------------------"
echo "------------------------------------------------"
echo "1. KAYNAK KODLAR THA-MAKAM REPOSUNA GÖNDERİLİYOR"
echo "------------------------------------------------"
cp README-makam.md README.md
git add .
git commit -m "$COMMIT_MSG (Makam)"
git push origin main

echo ""
echo "------------------------------------------------"
echo "2. KAYNAK KODLAR THA-KONTROL REPOSUNA GÖNDERİLİYOR"
echo "------------------------------------------------"
cp README-kontrol.md README.md
git add README.md
git commit -m "$COMMIT_MSG (Kontrol)"
# 'kontrol' adında bir uzak bağlantı (remote) olup olmadığını kontrol et, yoksa ekle
if ! git remote | grep -q "kontrol"; then
  git remote add kontrol https://github.com/cbstkgm/tha-kontrol.git
fi
git push kontrol main

echo ""
echo "------------------------------------------------"
echo "4. tha-makam İÇİN SİTE DERLENİYOR (BUILD) VE YAYINLANIYOR"
echo "------------------------------------------------"
npm run build:makam
npx gh-pages -d dist -r https://github.com/cbstkgm/tha-makam.git

echo ""
echo "------------------------------------------------"
echo "5. tha-kontrol İÇİN SİTE DERLENİYOR (BUILD) VE YAYINLANIYOR"
echo "------------------------------------------------"
npm run build:kontrol
npx gh-pages -d dist -r https://github.com/cbstkgm/tha-kontrol.git

echo ""
echo "================================================"
echo "✅ İŞLEM BAŞARIYLA TAMAMLANDI! Her iki repo da güncellendi."
echo "================================================"
