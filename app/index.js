import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../auth/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Toast from 'react-native-toast-message';

export default function Page() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Toast.show({ type: 'info', text1: 'Déconnexion', text2: 'À bientôt !' });
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Ionicons name="cloud-done-outline" size={80} color="#007AFF" />
          <Text style={styles.title}>Web Cloud</Text>
          {user ? (
            <>
              <Text style={styles.subtitle}>Bienvenue sur Web Cloud Ynov,</Text>
              <Text style={styles.userName}>{user.displayName || 'Utilisateur'}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </>
          ) : (
            <Text style={styles.subtitle}>Votre application dématérialisée</Text>
          )}
        </View>

        <View style={styles.buttonContainer}>
          {user ? (
            <>
              <Link href="/profil" asChild>
                <Pressable style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Accéder à mon Profil</Text>
                </Pressable>
              </Link>
              <Pressable style={styles.secondaryButton} onPress={handleLogout}>
                <Text style={styles.secondaryButtonText}>Se Déconnecter</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Link href="/connexion" asChild>
                <Pressable style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Se Connecter</Text>
                </Pressable>
              </Link>
              <Link href="/inscription" asChild>
                <Pressable style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Créer un compte</Text>
                </Pressable>
              </Link>
            </>
          )}
        </View>
      </View>
      
      <Text style={styles.footer}>© 2026 Ynov Web Cloud</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 5,
    textAlign: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    marginTop: 10,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFF',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryButtonText: {
    color: '#1E293B',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    color: '#94A3B8',
    marginBottom: 20,
    fontSize: 12,
  }
});
