import { getAuth, signInAnonymously } from "firebase/auth";

const auth = getAuth();

export const loginAnonymously = () => {
  return signInAnonymously(auth)
    .then((result) => {
      console.log("Anonymous signin success");
      return result.user;
    })
    .catch((error) => {
      console.log(error);
      throw error;
    });
};
