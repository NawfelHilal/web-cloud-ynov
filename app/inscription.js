import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, Pressable, SafeAreaView, ActivityIndicator } from "react-native";
import { signup } from "../auth_signup_password";
import { Link, router } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

export default function Inscription() {
  const [email, onChangeEmail] = useState("");
  const [password, onChangePassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Validation de l'email
  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const handleSignup = async () => {
    // 1. Validation des champs vides
    if (!email || !password) {
      Toast.show({ type: 'error', text1: 'Champs requis', text2: 'Veuillez remplir tous les champs' });
      return;
    }

    // 2. Validation du format email
    if (!validateEmail(email)) {
      Toast.show({ type: 'error', text1: 'Email invalide', text2: 'Veuillez entrer une adresse email valide' });
      return;
    }

    // 3. Validation de la longueur du mot de passe
    if (password.length < 6) {
      Toast.show({ type: 'error', text1: 'Mot de passe court', text2: 'Minimum 6 caractères requis' });
      return;
    }
    
    setLoading(true);
    try {
      await signup(email, password);
      Toast.show({ type: 'success', text1: 'Bienvenue !', text2: 'Votre compte a été créé avec succès' });
      router.replace('/profil');
    } catch (error) {
      let message = "Une erreur est survenue lors de l'inscription.";
      if (error.code === 'auth/email-already-in-use') message = "Cet email est déjà utilisé.";
      if (error.code === 'auth/invalid-email') message = "L'adresse email n'est pas valide.";
      
      Toast.show({ type: 'error', text1: 'Échec de l\'inscription', text2: message });
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </Pressable>

        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>Commencez votre aventure cloud dès maintenant</Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#94A3B8"
              onChangeText={onChangeEmail}
              value={email}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor="#94A3B8"
              onChangeText={onChangePassword}
              value={password}
              secureTextEntry={true}
            />
          </View>

          <Pressable 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>S'inscrire</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Déjà un compte ? </Text>
          <Link href="/connexion" asChild>
            <Pressable>
              <Text style={styles.linkText}>Se connecter</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flex: 1, padding: 24 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginBottom: 40, borderWidth: 1, borderColor: '#E2E8F0' },
  title: { fontSize: 28, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748B', marginBottom: 32 },
  form: { gap: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, paddingHorizontal: 16, height: 56 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#1E293B', fontSize: 16 },
  button: { backgroundColor: '#007AFF', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 16, shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  buttonDisabled: { backgroundColor: '#94A3B8' },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  footerText: { color: '#64748B', fontSize: 15 },
  linkText: { color: '#007AFF', fontSize: 15, fontWeight: '700' },
});
