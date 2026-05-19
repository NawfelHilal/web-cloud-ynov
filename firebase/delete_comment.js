import { db, auth } from '../auth/firebaseConfig';
import { doc, getDoc, deleteDoc, updateDoc, increment } from 'firebase/firestore';

/**
 * Deletes a comment from a recipe's comments subcollection.
 * Only the comment's author can delete it.
 * @param {string} recipeId
 * @param {string} commentId
 */
export async function deleteComment(recipeId, commentId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Non authentifié');

  const commentRef = doc(db, 'recipes', recipeId, 'comments', commentId);
  const commentSnap = await getDoc(commentRef);
  if (!commentSnap.exists()) throw new Error('Commentaire introuvable');

  const comment = commentSnap.data();
  if (comment.authorId !== user.uid) throw new Error('Non autorisé : vous n\'êtes pas l\'auteur.');

  await deleteDoc(commentRef);

  // Decrement the comment counter on the parent recipe
  await updateDoc(doc(db, 'recipes', recipeId), {
    commentCount: increment(-1),
  });
}
