import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, Pressable, SafeAreaView, ActivityIndicator, ScrollView } from "react-native";
import { signin } from "../auth/signin_password";
import { signinWithGithub } from "../auth/github_signin_popup";
import { signInWithFacebook } from "../auth/auth_facebook_signin_popup";
import { loginAnonymously } from "../auth/auth_anonymous";
import { setupRecaptcha, sendOtp, confirmOtp } from "../auth/auth_phone";
import { Link, router } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

export default function Connexion() {
  const [email, onChangeEmail] = useState("");
  const [password, onChangePassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({ type: 'error', text1: 'Champs requis', text2: 'Veuillez remplir tous les champs' });
      return;
    }
    
    setLoading(true);
    try {
      await signin(email, password);
      Toast.show({ type: 'success', text1: 'Content de vous revoir !', text2: 'Connexion réussie' });
      router.replace('/profil');
    } catch (error) {
      let message = "Email ou mot de passe incorrect.";
      if (error.code === 'auth/user-not-found') message = "Aucun compte trouvé avec cet email.";
      if (error.code === 'auth/wrong-password') message = "Mot de passe incorrect.";
      
      Toast.show({ type: 'error', text1: 'Échec de connexion', text2: message });
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setLoading(true);
    try {
      await loginAnonymously();
      Toast.show({ type: 'success', text1: 'Mode Anonyme', text2: 'Connexion réussie' });
      router.replace('/profil');
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phoneNumber) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Entrez un numéro' });
      return;
    }
    setLoading(true);
    try {
      const appVerifier = setupRecaptcha('recaptcha-container');
      const result = await sendOtp(phoneNumber, appVerifier);
      setVerificationId(result);
      Toast.show({ type: 'success', text1: 'OTP Envoyé', text2: 'Vérifiez vos messages' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Erreur OTP', text2: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return;
    setLoading(true);
    try {
      await confirmOtp(verificationId, otp);
      Toast.show({ type: 'success', text1: 'Vérifié', text2: 'Connexion réussie' });
      router.replace('/profil');
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Code invalide' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </Pressable>
          <View id="recaptcha-container"></View>
        </View>

        <Text style={styles.title}>Bon retour !</Text>
        <Text style={styles.subtitle}>Connectez-vous pour accéder à votre espace cloud</Text>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.form}>
            {!showPhoneInput ? (
              <>
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
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.buttonText}>Se connecter</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={20} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="+33 6 12 34 56 78"
                    placeholderTextColor="#94A3B8"
                    onChangeText={setPhoneNumber}
                    value={phoneNumber}
                    keyboardType="phone-pad"
                  />
                </View>

                {!verificationId ? (
                  <Pressable style={styles.button} onPress={handleSendOtp}>
                    <Text style={styles.buttonText}>Envoyer le code</Text>
                  </Pressable>
                ) : (
                  <>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="Code OTP"
                        placeholderTextColor="#94A3B8"
                        onChangeText={setOtp}
                        value={otp}
                        keyboardType="number-pad"
                      />
                    </View>
                    <Pressable style={styles.button} onPress={handleVerifyOtp}>
                      <Text style={styles.buttonText}>Vérifier le code</Text>
                    </Pressable>
                  </>
                )}
              </>
            )}

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.socialGrid}>
              <Pressable 
                style={styles.githubButton} 
                onPress={async () => {
                  try {
                    await signinWithGithub();
                    router.replace('/profil');
                  } catch (e) {
                    Toast.show({ type: 'error', text1: 'Erreur GitHub', text2: e.message });
                  }
                }}
              >
                <Ionicons name="logo-github" size={20} color="#FFF" />
              </Pressable>

              <Pressable 
                style={styles.facebookButton} 
                onPress={async () => {
                  try {
                    await signInWithFacebook();
                    router.replace('/profil');
                  } catch (e) {
                    Toast.show({ type: 'error', text1: 'Erreur Facebook', text2: e.message });
                  }
                }}
              >
                <Ionicons name="logo-facebook" size={20} color="#FFF" />
              </Pressable>

              <Pressable 
                style={styles.phoneButton} 
                onPress={() => setShowPhoneInput(!showPhoneInput)}
              >
                <Ionicons name={showPhoneInput ? "mail-outline" : "call-outline"} size={20} color="#FFF" />
              </Pressable>

              <Pressable 
                style={styles.anonymousButton} 
                onPress={handleAnonymousLogin}
              >
                <Ionicons name="eye-off-outline" size={20} color="#FFF" />
              </Pressable>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Pas encore de compte ? </Text>
            <Link href="/inscription" asChild>
              <Pressable>
                <Text style={styles.linkText}>Créer un compte</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flex: 1, padding: 24 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  title: { fontSize: 28, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748B', marginBottom: 32 },
  form: { gap: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, paddingHorizontal: 16, height: 56 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#1E293B', fontSize: 16 },
  button: { backgroundColor: '#007AFF', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 16, shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  buttonDisabled: { backgroundColor: '#94A3B8' },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    color: '#64748B',
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  footerText: { color: '#64748B', fontSize: 15 },
  linkText: { color: '#007AFF', fontSize: 15, fontWeight: '700' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  socialGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  phoneButton: {
    flex: 1,
    backgroundColor: '#10B981',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  anonymousButton: {
    flex: 1,
    backgroundColor: '#64748B',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  githubButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facebookButton: {
    flex: 1,
    backgroundColor: '#1877F2',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
