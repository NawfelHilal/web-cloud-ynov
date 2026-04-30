import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, Pressable, SafeAreaView, ActivityIndicator, ScrollView } from "react-native";
import { signup } from "../auth/signup_password";
import { signinWithGithub } from "../auth/github_signin_popup";
import { signInWithFacebook } from "../auth/auth_facebook_signin_popup";
import { loginAnonymously } from "../auth/auth_anonymous";
import { setupRecaptcha, sendOtp, confirmOtp } from "../auth/auth_phone";
import { Link, router } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

export default function Inscription() {
  const [name, onChangeName] = useState("");
  const [email, onChangeEmail] = useState("");
  const [password, onChangePassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  const validateEmail = (email) => {
    return String(email).toLowerCase().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const isPhoneValid = (number) => {
    const phoneRegex = /^\+33\s?[1-9](\s?\d{2}){4}$/;
    return phoneRegex.test(number);
  };

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Toast.show({ type: 'error', text1: 'Champs requis', text2: 'Veuillez remplir tous les champs' });
      return;
    }
    setLoading(true);
    try {
      await signup(email, password, name);
      Toast.show({ type: 'success', text1: 'Bienvenue !', text2: 'Votre compte a été créé' });
      router.replace('/profil');
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      const appVerifier = setupRecaptcha('recaptcha-container-signup');
      const result = await sendOtp(phoneNumber, appVerifier);
      setVerificationId(result);
      Toast.show({ type: 'success', text1: 'OTP Envoyé' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      await confirmOtp(verificationId, otp);
      Toast.show({ type: 'success', text1: 'Vérifié' });
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
          <View id="recaptcha-container-signup"></View>
        </View>

        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>Commencez votre aventure cloud dès maintenant</Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          {!showPhoneInput ? (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Nom complet" onChangeText={onChangeName} value={name} />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Email" onChangeText={onChangeEmail} value={email} autoCapitalize="none" />
              </View>
              {email.length > 0 && !validateEmail(email) && <Text style={styles.errorText}>Format d'email invalide</Text>}

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Mot de passe" onChangeText={onChangePassword} value={password} secureTextEntry />
              </View>
              {password.length > 0 && password.length < 6 && <Text style={styles.errorText}>Minimum 6 caractères</Text>}

              <Pressable 
                style={[styles.button, (!name.trim() || !validateEmail(email) || password.length < 6 || loading) && styles.buttonDisabled]} 
                onPress={handleSignup}
                disabled={!name.trim() || !validateEmail(email) || password.length < 6 || loading}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>S'inscrire</Text>}
              </Pressable>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="+33 1 01 02 03 04" onChangeText={setPhoneNumber} value={phoneNumber} keyboardType="phone-pad" />
              </View>
              {phoneNumber.length > 0 && !isPhoneValid(phoneNumber) && <Text style={styles.errorText}>Format attendu : +33 1 01 02 03 04</Text>}

              {!verificationId ? (
                <Pressable 
                  style={[styles.button, (!isPhoneValid(phoneNumber) || loading) && styles.buttonDisabled]} 
                  onPress={handleSendOtp}
                  disabled={!isPhoneValid(phoneNumber) || loading}
                >
                  <Text style={styles.buttonText}>Envoyer le code</Text>
                </Pressable>
              ) : (
                <>
                  <View style={styles.inputContainer}>
                    <TextInput style={styles.input} placeholder="Code OTP" onChangeText={setOtp} value={otp} keyboardType="number-pad" />
                  </View>
                  <Pressable style={styles.button} onPress={handleVerifyOtp}><Text style={styles.buttonText}>Vérifier</Text></Pressable>
                </>
              )}
            </View>
          )}

          <View style={styles.divider}>
            <View style={styles.line} /><Text style={styles.dividerText}>OU</Text><View style={styles.line} />
          </View>

          <View style={styles.socialGrid}>
            <Pressable style={styles.githubButton} onPress={async () => { await signinWithGithub(); router.replace('/profil'); }}>
              <Ionicons name="logo-github" size={20} color="#FFF" />
            </Pressable>
            <Pressable style={styles.facebookButton} onPress={async () => { await signInWithFacebook(); router.replace('/profil'); }}>
              <Ionicons name="logo-facebook" size={20} color="#FFF" />
            </Pressable>
            <Pressable style={styles.phoneButton} onPress={() => setShowPhoneInput(!showPhoneInput)}>
              <Ionicons name={showPhoneInput ? "mail-outline" : "call-outline"} size={20} color="#FFF" />
            </Pressable>
            <Pressable style={styles.anonymousButton} onPress={async () => { await loginAnonymously(); router.replace('/profil'); }}>
              <Ionicons name="eye-off-outline" size={20} color="#FFF" />
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Déjà un compte ? </Text>
            <Link href="/connexion" asChild><Pressable><Text style={styles.linkText}>Se connecter</Text></Pressable></Link>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flex: 1, padding: 24 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  title: { fontSize: 28, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748B', marginBottom: 32 },
  form: { gap: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, paddingHorizontal: 16, height: 56 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#1E293B', fontSize: 16 },
  button: { backgroundColor: '#007AFF', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  buttonDisabled: { backgroundColor: '#94A3B8' },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
  line: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { color: '#64748B', paddingHorizontal: 10, fontSize: 14, fontWeight: '600' },
  socialGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  githubButton: { flex: 1, backgroundColor: '#1E293B', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  facebookButton: { flex: 1, backgroundColor: '#1877F2', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  phoneButton: { flex: 1, backgroundColor: '#10B981', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  anonymousButton: { flex: 1, backgroundColor: '#64748B', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40, marginBottom: 20 },
  footerText: { color: '#64748B', fontSize: 15 },
  linkText: { color: '#007AFF', fontSize: 15, fontWeight: '700' },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: -8, marginLeft: 4 },
});
