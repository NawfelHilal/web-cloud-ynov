import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const auth = getAuth();

export const setupRecaptcha = (containerId) => {
  if (typeof window !== 'undefined') {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
    }
    
    // Nettoyage manuel du conteneur pour éviter l'erreur de rendu multiple
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '<div id="recaptcha-inner"></div>';
      // On utilise le nouvel id interne pour le rendu
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-inner', {
        'size': 'invisible'
      });
    } else {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        'size': 'invisible'
      });
    }
    
    return window.recaptchaVerifier;
  }
};

export const sendOtp = (phoneNumber, appVerifier) => {
  return signInWithPhoneNumber(auth, phoneNumber, appVerifier);
};

export const confirmOtp = (confirmationResult, code) => {
  return confirmationResult.confirm(code);
};
