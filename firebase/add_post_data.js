import { db, auth } from '../auth/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Ajoute un post au blog dans la collection "posts" de Firestore.
 * @param {string} title - Titre du post
 * @param {string} content - Contenu du post
 * @returns {Promise<string>} - L'ID du document créé
 */
export async function addPost(title, content) {
  const user = auth.currentUser;
  if (!user) throw new Error('Vous devez être connecté pour publier un article.');

  const docRef = await addDoc(collection(db, 'posts'), {
    title,
    content,
    authorName: user.displayName || user.email,
    authorId: user.uid,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}
