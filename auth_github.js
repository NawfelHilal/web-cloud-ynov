import { getAuth, signInWithPopup, GithubAuthProvider } from "firebase/auth";
import "./firebaseConfig";

const auth = getAuth();
const provider = new GithubAuthProvider();

export const signInWithGithub = () => {
  return signInWithPopup(auth, provider)
    .then((result) => {
      // Connexion réussie
      const user = result.user;
      console.log("Connecté avec GitHub:", user);
      return user;
    })
    .catch((error) => {
      console.log("Erreur GitHub:", error);
      throw error;
    });
};
