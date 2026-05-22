# 🍳 Student Cook — Livrable 2

> **Sujet choisi : Sujet 4 — Student Cook** (Plateforme de partage de recettes étudiantes)

Projet de groupe réalisé dans le cadre du cours "Dev pour le Cloud" — M2 Ynov.

## 🔗 Lien de l'application (GitHub Pages)
**[https://nawfelhilal.github.io/web-cloud-ynov/](https://nawfelhilal.github.io/web-cloud-ynov/)**

---

## 🎯 Description du sujet

**Student Cook** est une application mobile/web permettant aux étudiants de partager, découvrir et noter des recettes rapides et économiques. Chaque utilisateur peut publier ses recettes avec photos, ingrédients et étapes de préparation, interagir avec celles des autres (favoris, commentaires notés), et recevoir des notifications push lors de nouvelles publications.

---

## ⚙️ Fonctionnalités Livrable 2

### 1. 👤 Profil & Cloud Storage
- Page de profil détaillée (UID, email, providers, date de création)
- Modification du `displayName`
- Upload, mise à jour et affichage de la **photo de profil** (stockée sur Firebase Storage sous `images/{userId}/...`)

### 2. 📋 Flux de recettes & Vue Détaillée (Firestore - Read)
- Page d'accueil listant toutes les recettes en **temps réel** (`onSnapshot`)
- Tri par date décroissante
- Affichage du nom et de la photo de profil de l'auteur sur chaque carte
- Vue détaillée avec bannière, ingrédients, étapes, galerie multi-photos (lightbox)
- Galerie des plats en bas du feed

### 3. ✍️ Création & Interactions (Firestore - Write/Update)
- Formulaire de création : titre, ingrédients, étapes + **upload jusqu'à 5 photos** (obligatoire)
- Édition d'une recette (réservée à l'auteur)
- Suppression d'une recette (réservée à l'auteur)
- **Système de favoris** : ajouter/retirer avec compteur dénormalisé
- **Système de commentaires** avec notation par étoiles (1-5), note moyenne calculée
- Suppression des commentaires réservée à leur auteur

### 4. 🔔 Notifications Push (FCM & Expo)
- Demande de permissions et génération du **token Expo** au login
- Sauvegarde du token dans Firestore (`pushTokens/{userId}`)
- **Broadcast automatique** à tous les utilisateurs lors de la publication d'une nouvelle recette
- ⚠️ Les notifications push fonctionnent uniquement sur **mobile** (Android via EAS). Sur le web, l'API Expo Push n'est pas disponible.

### 5. 🔒 Droits d'auteurs & Sécurité
- Boutons Éditer/Supprimer visibles **uniquement pour l'auteur** de la recette ou du commentaire
- **Firestore Rules** strictes : lecture publique pour les connectés, écriture/suppression réservée au créateur légitime
- **Storage Rules** strictes : lecture publique pour les connectés, écriture réservée au propriétaire du dossier

### 6. 🚀 CI/CD — GitHub Actions
- Déclenchement automatique sur chaque push sur `master`
- Build & déploiement Web → **GitHub Pages**
- Build Android → **EAS (Expo Application Services)**

---

## ✨ Fonctionnalités bonus
- 📷 Galerie multi-photos par recette (jusqu'à 5) avec lightbox plein écran
- ⭐ Notation par étoiles (1-5) sur les commentaires avec moyenne affichée
- 🖼️ Galerie des plats en bas du feed
- 🔄 Pull-to-refresh sur le feed et la vue détaillée
- 🍞 Toast notifications sur toutes les actions utilisateur

---

## 🔐 Authentification Firebase
- Email / Mot de passe
- Téléphone (OTP) — **Test : `+33 1 01 02 03 04` / Code : `123456`**
- GitHub (Popup)
- Facebook (Popup)
- Connexion Anonyme

---

## 🚀 Installation & Lancement

```bash
npm install
npx expo start
```

---

## 🛠 Stack Technique
- **Framework** : React Native + Expo (Expo Router v6)
- **Base de données** : Cloud Firestore (NoSQL)
- **Stockage fichiers** : Firebase Cloud Storage
- **Auth** : Firebase Authentication
- **Notifications** : Expo Notifications + API Expo Push
- **CI/CD** : GitHub Actions → GitHub Pages & EAS
