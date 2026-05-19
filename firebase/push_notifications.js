import { db, auth } from '../auth/firebaseConfig';
import { collection, doc, setDoc, getDocs, serverTimestamp } from 'firebase/firestore';

/**
 * Saves the Expo push token for the current user to Firestore.
 * @param {string} token - Expo push token
 */
export async function savePushToken(token) {
  const user = auth.currentUser;
  if (!user || !token) return;

  await setDoc(doc(db, 'pushTokens', user.uid), {
    token,
    userId: user.uid,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Fetches all push tokens from Firestore and sends a broadcast notification
 * via the Expo push notification service.
 * @param {{ title: string, body: string, data?: object }} options
 */
export async function sendBroadcastNotification({ title, body, data = {} }) {
  const snapshot = await getDocs(collection(db, 'pushTokens'));
  const tokens = snapshot.docs.map((d) => d.data().token).filter(Boolean);

  if (tokens.length === 0) return;

  // Expo Push API accepts batches of up to 100 messages
  const messages = tokens.map((token) => ({
    to: token,
    title,
    body,
    data,
    sound: 'default',
  }));

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(messages),
  });
}
