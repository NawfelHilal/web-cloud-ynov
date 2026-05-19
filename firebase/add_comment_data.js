import { db, auth } from '../auth/firebaseConfig';
import { collection, addDoc, serverTimestamp, doc, increment, updateDoc } from 'firebase/firestore';

/**
 * Ajoute un avis/commentaire dans la sous-collection "comments" d'une recette.
 * @param {string} recipeId - L'ID de la recette
 * @param {string} content - Le texte de l'avis
 * @param {number} rating - Note de 1 à 5 (0 = pas de note)
 */
export async function addComment(recipeId, content, rating = 0) {
  const user = auth.currentUser;
  if (!user) throw new Error('Vous devez être connecté pour commenter.');

  await addDoc(collection(db, 'recipes', recipeId, 'comments'), {
    content,
    rating: rating > 0 ? rating : null,
    authorName: user.displayName || user.email,
    authorId: user.uid,
    authorPhotoURL: user.photoURL || null,
    createdAt: serverTimestamp(),
  });

  // Incrémente le compteur de commentaires sur la recette parente
  await updateDoc(doc(db, 'recipes', recipeId), {
    commentCount: increment(1),
  });
}
