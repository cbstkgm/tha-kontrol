#!/bin/bash

# Kullanıcıdan commit mesajı al, mesaj yazılmazsa varsayılan metni kullan
COMMIT_MSG=${1:-"Makam ve Kontrol için otomatik toplu güncelleme"}

echo "------------------------------------------------"
echo "1. KAYNAK KODLAR KAYDEDILIYOR (Commit)"
echo "------------------------------------------------"
git add .
git commit -m "$COMMIT_MSG"

echo ""
echo "------------------------------------------------"
echo "2. KAYNAK KODLAR tha-makam REPOSUNA GÖNDERİLİYOR"
echo "------------------------------------------------"
git push origin main

echo ""
echo "------------------------------------------------"
echo "3. KAYNAK KODLAR tha-kontrol REPOSUNA GÖNDERİLİYOR"
echo "------------------------------------------------"
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
