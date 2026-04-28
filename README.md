# Web Cloud - Ynov 🚀

Ce projet est une application React Native (Expo) réalisée dans le cadre du TP "Dev pour le Cloud".

## 🔗 Lien de l'application (GitHub Pages)
**[https://nawfelhilal.github.io/web-cloud-ynov/](https://nawfelhilal.github.io/web-cloud-ynov/)**

## ✨ Fonctionnalités
- **Architecture** : Expo Router v6
- **Authentification Firebase** :
  - Email / Mot de passe (avec Nom complet)
  - Téléphone (OTP)
  - GitHub Popup
  - Facebook Popup
  - Connexion Anonyme
- **UI** : Design premium, Toaster notifications, Navbar globale
- **CI/CD** : Déploiement automatique sur GitHub Pages et build EAS Android via GitHub Actions

## 🚀 Installation & Lancement
1. `npm install`
2. `npx expo start`

## 🛠 CI/CD
Le workflow GitHub Actions se déclenche à chaque push sur `master` :
- Build & Déploiement Web sur GitHub Pages.
- Build Android sur EAS.
