import { db, auth, storage } from '../auth/firebaseConfig';
import { doc, getDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';

/**
 * Deletes a recipe and all its sub-collections (comments, favorites).
 * Only the recipe's author can delete it.
 * @param {string} recipeId
 */
export async function deleteRecipe(recipeId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Non authentifié');

  const recipeRef = doc(db, 'recipes', recipeId);
  const recipeSnap = await getDoc(recipeRef);
  if (!recipeSnap.exists()) throw new Error('Recette introuvable');

  const recipe = recipeSnap.data();
  if (recipe.authorId !== user.uid) throw new Error('Non autorisé : vous n\'êtes pas l\'auteur.');

  // Delete all photos from Firebase Storage (best-effort)
  if (recipe.photos?.length) {
    await Promise.allSettled(
      recipe.photos.map(async (url) => {
        try {
          // Extract path from URL for deletion
          const storageRef = ref(storage, url);
          await deleteObject(storageRef);
        } catch (_) {
          // Ignore storage errors (file may not exist)
        }
      })
    );
  }

  // Delete comments subcollection
  const commentsSnap = await getDocs(collection(db, 'recipes', recipeId, 'comments'));
  await Promise.allSettled(commentsSnap.docs.map((d) => deleteDoc(d.ref)));

  // Delete favorites subcollection
  const favsSnap = await getDocs(collection(db, 'recipes', recipeId, 'favorites'));
  await Promise.allSettled(favsSnap.docs.map((d) => deleteDoc(d.ref)));

  // Finally delete the recipe document
  await deleteDoc(recipeRef);
}
