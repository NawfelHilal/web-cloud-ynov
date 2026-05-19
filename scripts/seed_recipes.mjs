/**
 * Script de seed — crée des recettes de test dans Firestore.
 *
 * Usage :
 *   node --env-file=.env scripts/seed_recipes.mjs
 *
 * Nécessite Node 20+ (flag --env-file natif).
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  Timestamp,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
} from 'firebase/auth';

// ─── Config Firebase depuis les variables d'env ───────────────────────────────
const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId:     process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

if (!firebaseConfig.apiKey) {
  console.error('❌  Variables Firebase non trouvées. Lance : node --env-file=.env scripts/seed_recipes.mjs');
  process.exit(1);
}

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

// ─── Données de test ──────────────────────────────────────────────────────────
// Photos alimentaires réelles via Unsplash Source (service public de test)
const RECIPES = [
  {
    title: 'Pâtes carbonara étudiantes',
    ingredients: [
      '200g de spaghetti',
      '100g de lardons fumés',
      '2 œufs entiers',
      '50g de parmesan râpé',
      'Poivre noir, sel',
    ],
    steps: [
      'Faire cuire les pâtes al dente dans de l\'eau bouillante salée.',
      'Faire revenir les lardons à la poêle sans matière grasse jusqu\'à dorure.',
      'Battre les œufs avec le parmesan et beaucoup de poivre.',
      'Hors du feu, mélanger les pâtes égouttées avec les lardons puis verser la crème d\'œufs.',
      'Remuer vivement pour obtenir une sauce crémeuse. Servir immédiatement.',
    ],
    photoURL: 'https://images.unsplash.com/photo-1588013273468-315fd88ea34c?w=800&q=80',
    photos: ['https://images.unsplash.com/photo-1588013273468-315fd88ea34c?w=800&q=80'],
    authorName: 'Chef Test',
    authorId: 'seed_user_001',
    authorPhotoURL: null,
    favoriteCount: 12,
    commentCount: 3,
  },
  {
    title: 'Riz sauté au thon express',
    ingredients: [
      '200g de riz cuit (restes)',
      '1 boîte de thon en conserve',
      '2 œufs',
      '1 oignon',
      'Sauce soja, huile de sésame',
      'Ciboulette',
    ],
    steps: [
      'Faire chauffer un wok ou une grande poêle à feu vif avec un filet d\'huile.',
      'Faire revenir l\'oignon émincé 2 minutes.',
      'Ajouter le riz froid et faire sauter en remuant constamment pendant 3 minutes.',
      'Pousser le riz sur les bords, casser les œufs au centre et brouiller.',
      'Incorporer le thon égoutté, arroser de sauce soja et d\'huile de sésame.',
      'Ciseler la ciboulette et servir aussitôt.',
    ],
    photoURL: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
    photos: [
      'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
      'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80',
    ],
    authorName: 'Marie D.',
    authorId: 'seed_user_002',
    authorPhotoURL: null,
    favoriteCount: 8,
    commentCount: 1,
  },
  {
    title: 'Crêpes sucrées classiques',
    ingredients: [
      '250g de farine',
      '3 œufs',
      '500ml de lait',
      '30g de beurre fondu',
      '1 pincée de sel',
      '1 cuillère à soupe de sucre',
      'Vanille (optionnel)',
    ],
    steps: [
      'Mélanger la farine, le sucre et le sel dans un saladier.',
      'Creuser un puits et ajouter les œufs battus.',
      'Incorporer progressivement le lait en fouettant pour éviter les grumeaux.',
      'Ajouter le beurre fondu et la vanille. Laisser reposer 30 min.',
      'Faire cuire dans une poêle beurrée à feu moyen, 1 min par côté.',
      'Servir avec Nutella, confiture ou citron/sucre.',
    ],
    photoURL: 'https://images.unsplash.com/photo-1565299543923-37dd37887442?w=800&q=80',
    photos: ['https://images.unsplash.com/photo-1565299543923-37dd37887442?w=800&q=80'],
    authorName: 'Lucas B.',
    authorId: 'seed_user_003',
    authorPhotoURL: null,
    favoriteCount: 24,
    commentCount: 7,
  },
  {
    title: 'Wrap poulet avocat',
    ingredients: [
      '2 tortillas de blé',
      '1 blanc de poulet cuit',
      '1 avocat mûr',
      'Laitue iceberg',
      'Tomates cerises',
      'Sauce yaourt-citron (yaourt + citron + ail)',
      'Sel, poivre, paprika',
    ],
    steps: [
      'Préparer la sauce : mélanger un yaourt nature, le jus d\'un demi-citron, une gousse d\'ail râpée, sel et poivre.',
      'Trancher le poulet en lamelles et assaisonner avec le paprika.',
      'Écraser grossièrement l\'avocat à la fourchette avec un peu de citron.',
      'Réchauffer les tortillas 30 secondes au micro-ondes.',
      'Étaler l\'avocat, puis la sauce, puis garnir avec le poulet, la laitue et les tomates.',
      'Rouler fermement et couper en deux en diagonal.',
    ],
    photoURL: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80',
    photos: [
      'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80',
      'https://images.unsplash.com/photo-1562059390-a761a084768e?w=800&q=80',
    ],
    authorName: 'Sophie L.',
    authorId: 'seed_user_004',
    authorPhotoURL: null,
    favoriteCount: 5,
    commentCount: 2,
  },
  {
    title: 'Soupe de légumes économique',
    ingredients: [
      '2 carottes',
      '2 pommes de terre',
      '1 poireau',
      '1 oignon',
      '1 cube de bouillon de légumes',
      'Sel, poivre, thym',
      'Crème fraîche (facultatif)',
    ],
    steps: [
      'Éplucher et couper tous les légumes en morceaux grossiers.',
      'Faire revenir l\'oignon émincé dans une cocotte avec un filet d\'huile.',
      'Ajouter les légumes, couvrir d\'eau à hauteur et émietter le cube de bouillon.',
      'Porter à ébullition puis laisser mijoter 25 minutes à feu moyen.',
      'Mixer la soupe jusqu\'à obtenir une consistance lisse.',
      'Ajuster l\'assaisonnement et servir avec une cuillère de crème.',
    ],
    photoURL: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
    photos: ['https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80'],
    authorName: 'Alex M.',
    authorId: 'seed_user_005',
    authorPhotoURL: null,
    favoriteCount: 15,
    commentCount: 4,
  },
  {
    title: 'Pancakes banane-avoine (healthy)',
    ingredients: [
      '1 banane bien mûre',
      '2 œufs',
      '4 cuillères à soupe de flocons d\'avoine',
      '1/2 cuillère à café de levure chimique',
      'Cannelle',
      'Miel pour servir',
    ],
    steps: [
      'Écraser la banane en purée dans un bol.',
      'Ajouter les œufs et fouetter.',
      'Incorporer les flocons d\'avoine, la levure et la cannelle.',
      'Chauffer une poêle anti-adhésive légèrement huilée à feu moyen-doux.',
      'Verser des petites louches de pâte et cuire 2 minutes jusqu\'à formation de bulles.',
      'Retourner délicatement et cuire encore 1 minute.',
      'Servir avec un filet de miel.',
    ],
    photoURL: 'https://images.unsplash.com/photo-1554520735-0a6b8b6ce8b7?w=800&q=80',
    photos: ['https://images.unsplash.com/photo-1554520735-0a6b8b6ce8b7?w=800&q=80'],
    authorName: 'Camille R.',
    authorId: 'seed_user_006',
    authorPhotoURL: null,
    favoriteCount: 31,
    commentCount: 9,
  },
];

// ─── Insertion ────────────────────────────────────────────────────────────────
async function seed() {
  // Authentification requise par les règles Firestore
  const email    = process.env.SEED_EMAIL;
  const password = process.env.SEED_PASSWORD;

  if (!email || !password) {
    console.error('❌  Variables manquantes : ajoute SEED_EMAIL et SEED_PASSWORD dans ton .env');
    process.exit(1);
  }

  console.log(`\n🔐  Connexion avec ${email}...`);
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const uid  = cred.user.uid;
  const name = cred.user.displayName || email;
  const photo = cred.user.photoURL || null;
  console.log(`    ✅  Connecté : ${name} (${uid})\n`);

  console.log(`🌱  Insertion de ${RECIPES.length} recettes dans Firestore...\n`);

  for (const [i, recipe] of RECIPES.entries()) {
    // Utilise le vrai compte pour authorId/authorName
    recipe.authorId = uid;
    recipe.authorName = name;
    recipe.authorPhotoURL = photo;
    // Timestamp décalé pour simuler des publications à des jours différents
    const daysAgo = (RECIPES.length - i) * 2;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    const docRef = await addDoc(collection(db, 'recipes'), {
      ...recipe,
      createdAt: Timestamp.fromDate(date),
    });

    console.log(`  ✅  [${i + 1}/${RECIPES.length}] "${recipe.title}" → ${docRef.id}`);
  }

  console.log('\n🎉  Seed terminé ! Lance l\'app pour voir les recettes.\n');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌  Erreur lors du seed :', err.message);
  process.exit(1);
});
