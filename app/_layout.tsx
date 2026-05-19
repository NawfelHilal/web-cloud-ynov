import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import 'react-native-reanimated';
import { View, StyleSheet, Platform } from 'react-native';
import Navbar from '../components/Navbar';
import { useEffect, useRef } from 'react';
import { auth } from '../auth/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { savePushToken } from '../firebase/push_notifications';

import { useColorScheme } from '../hooks/use-color-scheme';

/**
 * Requests notification permissions and returns the Expo push token.
 * Returns null on web or if permission is denied.
 */
async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    // Dynamic import to avoid web crashes
    const Notifications = await import('expo-notifications');

    Notifications.default.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    const { status: existingStatus } = await Notifications.default.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.default.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    const tokenData = await Notifications.default.getExpoPushTokenAsync({
      projectId: 'd3e6cdae-fc8d-443d-a4af-713cd46fd93e',
    });
    return tokenData.data;
  } catch (_) {
    return null;
  }
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const tokenSaved = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user && !tokenSaved.current) {
        tokenSaved.current = true;
        const token = await registerForPushNotifications();
        if (token) {
          await savePushToken(token).catch(() => {});
        }
      }
      if (!user) {
        tokenSaved.current = false;
      }
    });
    return unsub;
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="connexion" />
            <Stack.Screen name="inscription" />
            <Stack.Screen name="profil" options={{ headerShown: true, title: "Mon Profil" }} />
            <Stack.Screen name="blog" />
            <Stack.Screen name="new-post" />
            <Stack.Screen name="post/[id]/index" />
            <Stack.Screen name="post/[id]/new-comment" />
            <Stack.Screen name="post/[id]/edit" />
          </Stack>
        </View>
        <Navbar />
      </View>
      <StatusBar style="auto" />
      <Toast />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingBottom: 60, // Espace pour la navbar
  },
});
