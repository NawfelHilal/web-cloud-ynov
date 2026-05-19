import { getAuth, updateProfile } from "firebase/auth";
import { auth } from "./firebaseConfig";

/**
 * Met à jour la photoURL de l'utilisateur connecté.
 *
 * @param {string} downloadUrl - URL publique de la nouvelle photo de profil
 * @returns {Promise<boolean>} true si succès, false sinon
 */
export const updateUserPhotoUrl = async (downloadUrl) => {
  try {
    await updateProfile(auth.currentUser, { photoURL: downloadUrl });
    return true;
  } catch (e) {
    console.error("Erreur updateUserPhotoUrl:", e);
    return false;
  }
};
