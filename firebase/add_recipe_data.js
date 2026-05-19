import { db, auth, storage } from '../auth/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sendBroadcastNotification } from './push_notifications';

/**
 * Upload une photo de recette vers Firebase Storage.
 * @param {string} uri - URI locale de l'image
 * @returns {Promise<string>} URL de téléchargement publique
 */
export async function uploadRecipePhoto(uri) {
  const user = auth.currentUser;
  if (!user) throw new Error('Non authentifié');

  const response = await fetch(uri);
  const blob = await response.blob();
  const fileName = `recipes/${user.uid}/${Date.now()}.jpg`;
  const storageRef = ref(storage, fileName);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

/**
 * Crée une recette dans la collection "recipes".
 * @param {{ title, ingredients, steps, photoURIs: string[] }} data
 * @returns {Promise<string>} ID du document créé
 */
export async function addRecipe({ title, ingredients, steps, photoURIs }) {
  const user = auth.currentUser;
  if (!user) throw new Error('Vous devez être connecté pour publier une recette.');

  // Upload toutes les photos en parallèle
  const photoURLs = await Promise.all(photoURIs.map((uri) => uploadRecipePhoto(uri)));

  const docRef = await addDoc(collection(db, 'recipes'), {
    title,
    ingredients,
    steps,
    photoURL: photoURLs[0] || null,        // photo principale (rétro-compat)
    photos: photoURLs,                      // toutes les photos
    authorName: user.displayName || user.email,
    authorId: user.uid,
    authorPhotoURL: user.photoURL || null,  // photo de profil de l'auteur
    createdAt: serverTimestamp(),
    favoriteCount: 0,
    commentCount: 0,
  });

  // Notify all users about the new recipe (best-effort)
  try {
    await sendBroadcastNotification({
      title: '🍽️ Nouvelle recette publiée !',
      body: `${user.displayName || 'Un cuisinier'} vient de partager "${title}"`,
      data: { recipeId: docRef.id },
    });
  } catch (_) {
    // Ne pas bloquer la publication si les notifications échouent
  }

  return docRef.id;
}
