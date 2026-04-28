import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const auth = getAuth();

export const setupRecaptcha = (containerId) => {
  if (typeof window !== 'undefined') {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      'size': 'invisible',
      'callback': (response) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });
    return window.recaptchaVerifier;
  }
};

export const sendOtp = (phoneNumber, appVerifier) => {
  return signInWithPhoneNumber(auth, phoneNumber, appVerifier);
};

export const confirmOtp = (confirmationResult, code) => {
  return confirmationResult.confirm(code);
};
