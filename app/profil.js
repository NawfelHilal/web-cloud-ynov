import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../auth/firebaseConfig';
import { uploadToFirebase } from '../auth/storage_upload_file';
import { updateUserPhotoUrl } from '../auth/auth_update_photo_url';
import Toast from 'react-native-toast-message';

// Map provider ID to readable label + color + icon
const PROVIDER_META = {
  'password':    { label: 'Email / Mot de passe', color: '#007AFF', icon: 'mail'          },
  'google.com':  { label: 'Google',               color: '#EA4335', icon: 'logo-google'   },
  'github.com':  { label: 'GitHub',               color: '#1E293B', icon: 'logo-github'   },
  'facebook.com':{ label: 'Facebook',             color: '#1877F2', icon: 'logo-facebook' },
  'phone':       { label: 'Téléphone (OTP)',       color: '#10B981', icon: 'call'          },
  'anonymous':   { label: 'Anonyme',              color: '#64748B', icon: 'eye-off'       },
};

export default function Profil() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Photo upload state
  const [localImageUri, setLocalImageUri] = useState(null); // URI choisie avant upload
  const [uploading, setUploading]         = useState(false);

  // Edit form state
  const [editMode, setEditMode]           = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPhotoURL, setNewPhotoURL]     = useState('');
  const [updating, setUpdating]           = useState(false);

  // ── onAuthStateChanged : guard + init ───────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        router.replace('/connexion');
      } else {
        setUser(firebaseUser);
        setNewDisplayName(firebaseUser.displayName || '');
        setNewPhotoURL(firebaseUser.photoURL || '');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ── Logout ───────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await auth.signOut();
      Toast.show({ type: 'info', text1: 'Déconnexion', text2: 'À bientôt !' });
      router.replace('/connexion');
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: e.message });
    }
  };

  // ── pickImage : ouvre le sélecteur de photos ─────────────────────────────────
  const pickImage = async () => {
    // Demande la permission d'accéder à la galerie
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'error', text1: 'Permission refusée', text2: "L'accès à la galerie est nécessaire." });
      return;
    }

    // Ouvre le sélecteur
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],      // crop carré pour la photo de profil
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setLocalImageUri(uri); // Affiche la nouvelle image en aperçu

      // Lance l'upload vers Firebase Storage
      await handleUploadPhoto(uri);
    }
  };

  // ── handleUploadPhoto : upload + updateProfile ────────────────────────────────
  const handleUploadPhoto = async (uri) => {
    setUploading(true);
    try {
      // Nom unique basé sur l'UID + timestamp
      const fileName = `profile_${auth.currentUser.uid}_${Date.now()}.jpg`;

      // 1. Upload vers Firebase Storage et récupération de l'URL
      const downloadUrl = await uploadToFirebase(uri, fileName);

      // 2. Mise à jour de auth.currentUser.photoURL
      const success = await updateUserPhotoUrl(downloadUrl);

      if (success) {
        // Refresh l'état local
        setUser({ ...auth.currentUser });
        setNewPhotoURL(downloadUrl);
        Toast.show({ type: 'success', text1: 'Photo mise à jour !', text2: 'Votre photo de profil a été sauvegardée.' });
      } else {
        Toast.show({ type: 'error', text1: 'Erreur', text2: "Impossible de mettre à jour la photo." });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Erreur upload', text2: e.message });
      setLocalImageUri(null); // reset aperçu en cas d'erreur
    } finally {
      setUploading(false);
    }
  };

  // ── updateProfile (displayName + photoURL manuelle) ───────────────────────────
  const handleUpdateProfile = async () => {
    if (!newDisplayName.trim()) {
      Toast.show({ type: 'error', text1: 'Champ requis', text2: 'Le nom ne peut pas être vide.' });
      return;
    }
    setUpdating(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: newDisplayName.trim(),
        photoURL: newPhotoURL.trim() || null,
      });
      setUser({ ...auth.currentUser });
      setEditMode(false);
      Toast.show({ type: 'success', text1: 'Profil mis à jour !', text2: 'Vos informations ont été sauvegardées.' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: error.message });
    } finally {
      setUpdating(false);
    }
  };

  // ── Loading / guard ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement du profil…</Text>
      </SafeAreaView>
    );
  }

  if (!user) return null;

  // ── Provider info ────────────────────────────────────────────────────────────
  const providers = user.providerData && user.providerData.length > 0
    ? user.providerData
    : user.isAnonymous
      ? [{ providerId: 'anonymous', uid: user.uid, displayName: null, email: null, photoURL: null }]
      : [];

  // Photo à afficher : aperçu local (en cours d'upload) > photoURL Firebase > initiale
  const displayedPhoto = localImageUri || user.photoURL || null;
  const avatarLetter   = (user.displayName || user.email || '?')[0].toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mon Profil</Text>
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Déco</Text>
          </Pressable>
        </View>

        {/* ── Avatar cliquable + nom + email ─────────────────────────────────── */}
        <View style={styles.profileCard}>
          {/* Pressable sur l'avatar pour changer la photo */}
          <Pressable onPress={pickImage} style={styles.avatarWrapper} disabled={uploading}>
            {displayedPhoto ? (
              <Image source={{ uri: displayedPhoto }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarLetter}>{avatarLetter}</Text>
              </View>
            )}
            {/* Badge caméra sur l'avatar */}
            <View style={styles.cameraBadge}>
              {uploading
                ? <ActivityIndicator size="small" color="#FFF" />
                : <Ionicons name="camera" size={14} color="#FFF" />
              }
            </View>
          </Pressable>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.displayName || 'Utilisateur'}</Text>
            <Text style={styles.profileEmail}>
              {user.email || (user.isAnonymous ? 'Connexion anonyme' : 'Email non renseigné')}
            </Text>
            {user.emailVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
                <Text style={styles.verifiedText}>Email vérifié</Text>
              </View>
            )}
            <Pressable onPress={pickImage} disabled={uploading}>
              <Text style={styles.changePhotoText}>
                {uploading ? 'Upload en cours…' : 'Changer la photo'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ── Informations du compte ──────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations du compte</Text>
          <InfoRow icon="finger-print-outline" label="UID Firebase" value={user.uid} mono />
          <InfoRow icon="mail-outline" label="Email" value={user.email || '—'} />
          <InfoRow
            icon="shield-checkmark-outline"
            label="Email vérifié"
            value={user.emailVerified ? 'Oui' : 'Non'}
            valueColor={user.emailVerified ? '#22C55E' : '#EF4444'}
          />
          <InfoRow
            icon="eye-off-outline"
            label="Compte anonyme"
            value={user.isAnonymous ? 'Oui' : 'Non'}
          />
          {user.metadata?.creationTime && (
            <InfoRow
              icon="calendar-outline"
              label="Créé le"
              value={new Date(user.metadata.creationTime).toLocaleDateString('fr-FR', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            />
          )}
          {user.metadata?.lastSignInTime && (
            <InfoRow
              icon="time-outline"
              label="Dernière connexion"
              value={new Date(user.metadata.lastSignInTime).toLocaleDateString('fr-FR', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            />
          )}
        </View>

        {/* ── Providers ──────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Méthode(s) de connexion</Text>
          {providers.map((profile, idx) => {
            const meta = PROVIDER_META[profile.providerId] || { label: profile.providerId, color: '#64748B', icon: 'key-outline' };
            return (
              <View key={idx} style={styles.providerCard}>
                <View style={[styles.providerIcon, { backgroundColor: meta.color + '20' }]}>
                  <Ionicons name={meta.icon} size={20} color={meta.color} />
                </View>
                <View style={styles.providerInfo}>
                  <Text style={styles.providerLabel}>{meta.label}</Text>
                  {profile.uid        && <Text style={styles.providerDetail}>UID: {profile.uid}</Text>}
                  {profile.displayName && <Text style={styles.providerDetail}>Nom: {profile.displayName}</Text>}
                  {profile.email      && <Text style={styles.providerDetail}>Email: {profile.email}</Text>}
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Formulaire de mise à jour (displayName + photoURL manuelle) ─────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Modifier le profil</Text>
            <Pressable
              onPress={() => {
                setEditMode(!editMode);
                if (editMode) {
                  setNewDisplayName(user.displayName || '');
                  setNewPhotoURL(user.photoURL || '');
                }
              }}
              style={[styles.editToggle, editMode && styles.editToggleActive]}
            >
              <Ionicons name={editMode ? 'close' : 'pencil'} size={16} color={editMode ? '#EF4444' : '#007AFF'} />
              <Text style={[styles.editToggleText, editMode && { color: '#EF4444' }]}>
                {editMode ? 'Annuler' : 'Modifier'}
              </Text>
            </Pressable>
          </View>

          {editMode ? (
            <View style={styles.editForm}>

              {/* ── Bouton import galerie ── */}
              <Text style={styles.inputLabel}>Photo de profil</Text>
              <Pressable
                style={[styles.pickImageButton, uploading && styles.buttonDisabled]}
                onPress={pickImage}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <ActivityIndicator color="#007AFF" size="small" />
                    <Text style={styles.pickImageText}>Upload en cours…</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={22} color="#007AFF" />
                    <Text style={styles.pickImageText}>Importer depuis la galerie</Text>
                  </>
                )}
              </Pressable>

              {/* Aperçu de la photo actuelle / nouvellement choisie */}
              {(localImageUri || newPhotoURL.trim().length > 0) && (
                <View style={styles.previewContainer}>
                  <Image
                    source={{ uri: localImageUri || newPhotoURL.trim() }}
                    style={styles.previewImage}
                    onError={() => Toast.show({ type: 'error', text1: 'Image invalide' })}
                  />
                </View>
              )}

              <Text style={[styles.inputLabel, { marginTop: 8 }]}>Nom affiché</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Votre nom complet"
                  placeholderTextColor="#94A3B8"
                  value={newDisplayName}
                  onChangeText={setNewDisplayName}
                />
              </View>

              <Pressable
                style={[styles.saveButton, updating && styles.buttonDisabled]}
                onPress={handleUpdateProfile}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.saveButtonText}>Enregistrer les modifications</Text>
                  </>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.editPlaceholder}>
              <Ionicons name="create-outline" size={28} color="#94A3B8" />
              <Text style={styles.editPlaceholderText}>
                Cliquez sur « Modifier » pour changer votre nom ou importer une photo depuis votre galerie.
              </Text>
            </View>
          )}
        </View>

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <Link href="/" asChild>
          <Pressable style={styles.homeButton}>
            <Ionicons name="home-outline" size={18} color="#94A3B8" style={{ marginRight: 6 }} />
            <Text style={styles.homeButtonText}>Retour à l'accueil</Text>
          </Pressable>
        </Link>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── InfoRow component ──────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, mono = false, valueColor }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconContainer}>
        <Ionicons name={icon} size={16} color="#007AFF" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text
          style={[styles.infoValue, mono && styles.infoValueMono, valueColor && { color: valueColor }]}
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', gap: 16 },
  loadingText: { color: '#64748B', fontSize: 15 },
  content: { padding: 20, paddingBottom: 48 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#1E293B' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: '#FEE2E2' },
  logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 13 },

  // Profile card
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },

  // Avatar
  avatarWrapper: { position: 'relative', marginRight: 0 },
  avatarContainer: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: '#007AFF' },
  avatarLetter: { fontSize: 28, fontWeight: '800', color: '#FFF' },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },

  // Profile info
  profileInfo: { marginLeft: 16, flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  profileEmail: { fontSize: 13, color: '#64748B', marginTop: 2 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  verifiedText: { fontSize: 12, color: '#22C55E', fontWeight: '600' },
  changePhotoText: { fontSize: 12, color: '#007AFF', fontWeight: '600', marginTop: 6 },

  // Sections
  section: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 12 },

  // Info rows
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  infoIconContainer: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 14, color: '#1E293B', fontWeight: '500', marginTop: 1 },
  infoValueMono: { fontFamily: 'monospace', fontSize: 12, color: '#475569' },

  // Provider cards
  providerCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  providerIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  providerInfo: { flex: 1 },
  providerLabel: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  providerDetail: { fontSize: 12, color: '#64748B', marginTop: 1 },

  // Edit toggle
  editToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#EFF6FF' },
  editToggleActive: { backgroundColor: '#FEE2E2' },
  editToggleText: { fontSize: 13, fontWeight: '700', color: '#007AFF' },

  // Edit form
  editForm: { gap: 12 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 14, height: 52 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#1E293B', fontSize: 15 },
  previewContainer: { alignItems: 'center', gap: 8 },
  previewImage: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#007AFF' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#007AFF', height: 52, borderRadius: 14, marginTop: 4, shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },
  buttonDisabled: { backgroundColor: '#94A3B8' },
  saveButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  editPlaceholder: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24, gap: 10 },
  editPlaceholderText: { color: '#94A3B8', fontSize: 14, textAlign: 'center', lineHeight: 20 },

  // Image picker button
  pickImageButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderRadius: 14, borderWidth: 2, borderColor: '#007AFF', borderStyle: 'dashed', backgroundColor: '#EFF6FF' },
  pickImageText: { color: '#007AFF', fontSize: 15, fontWeight: '700' },

  // Footer
  homeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, marginTop: 4 },
  homeButtonText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
});
