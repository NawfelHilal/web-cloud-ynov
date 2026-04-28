import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import 'react-native-reanimated';
import { View, StyleSheet } from 'react-native';
import Navbar from '../components/Navbar';

import { useColorScheme } from '../hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="connexion" />
            <Stack.Screen name="inscription" />
            <Stack.Screen name="profil" options={{ headerShown: true, title: "Mon Profil" }} />
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
