import { db } from '../auth/firebaseConfig';
import { collection, getDocs, getDoc, doc, query, orderBy } from 'firebase/firestore';

/**
 * Récupère toutes les recettes triées par date décroissante.
 */
export async function getRecipes() {
  const q = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Récupère une recette par son ID.
 */
export async function getRecipe(recipeId) {
  const snap = await getDoc(doc(db, 'recipes', recipeId));
  if (!snap.exists()) throw new Error('Recette introuvable.');
  return { id: snap.id, ...snap.data() };
}

/**
 * Récupère les commentaires/avis d'une recette.
 */
export async function getRecipeComments(recipeId) {
  const q = query(
    collection(db, 'recipes', recipeId, 'comments'),
    orderBy('createdAt', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}
