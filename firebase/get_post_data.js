import { db } from '../auth/firebaseConfig';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';

/**
 * Récupère tous les posts du blog triés par date décroissante.
 * @returns {Promise<Array>}
 */
export async function getPosts() {
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Récupère un post unique par son ID.
 * @param {string} postId
 * @returns {Promise<Object>}
 */
export async function getPost(postId) {
  const snap = await getDoc(doc(db, 'posts', postId));
  if (!snap.exists()) throw new Error('Post introuvable.');
  return { id: snap.id, ...snap.data() };
}

/**
 * Récupère les commentaires d'un post triés par date croissante.
 * @param {string} postId
 * @returns {Promise<Array>}
 */
export async function getComments(postId) {
  const q = query(
    collection(db, 'posts', postId, 'comments'),
    orderBy('createdAt', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}
