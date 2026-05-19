import { db, auth } from '../auth/firebaseConfig';
import {
  doc, setDoc, deleteDoc, getDoc, increment, updateDoc, serverTimestamp,
} from 'firebase/firestore';

/**
 * Bascule le favori d'une recette pour l'utilisateur courant.
 * @param {string} recipeId
 * @returns {Promise<boolean>} true si ajouté, false si retiré
 */
export async function toggleFavorite(recipeId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Vous devez être connecté.');

  const favRef = doc(db, 'recipes', recipeId, 'favorites', user.uid);
  const snap = await getDoc(favRef);

  if (snap.exists()) {
    await deleteDoc(favRef);
    await updateDoc(doc(db, 'recipes', recipeId), { favoriteCount: increment(-1) });
    return false;
  } else {
    await setDoc(favRef, { userId: user.uid, createdAt: serverTimestamp() });
    await updateDoc(doc(db, 'recipes', recipeId), { favoriteCount: increment(1) });
    return true;
  }
}

/**
 * Vérifie si l'utilisateur courant a mis cette recette en favori.
 * @param {string} recipeId
 * @returns {Promise<boolean>}
 */
export async function checkFavorite(recipeId) {
  const user = auth.currentUser;
  if (!user) return false;
  const favRef = doc(db, 'recipes', recipeId, 'favorites', user.uid);
  const snap = await getDoc(favRef);
  return snap.exists();
}
