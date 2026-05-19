import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebaseConfig";

/**
 * Uploade une image vers Firebase Storage à partir d'une URI locale
 * (fournie par expo-image-picker) et retourne l'URL publique du fichier.
 *
 * @param {string} uri   - URI locale de l'image (ex: file://...)
 * @param {string} name  - Nom du fichier à stocker (ex: "profile_uid123.jpg")
 * @returns {Promise<string>} URL de téléchargement publique
 */
export const uploadToFirebase = async (uri, name) => {
  // expo-image-picker renvoie une URI, pas un File → on la convertit en Blob
  const fetchResponse = await fetch(uri);
  const theBlob = await fetchResponse.blob();

  // Référence dans le bucket : dossier "images/"
  const imageRef = ref(storage, `images/${name}`);

  // Upload bytes par bytes
  const snapshot = await uploadBytes(imageRef, theBlob);

  // Récupère l'URL publique du fichier uploadé
  const downloadUrl = await getDownloadURL(snapshot.ref);

  return downloadUrl;
};
