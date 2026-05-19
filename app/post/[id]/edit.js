import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, SafeAreaView,
  Pressable, ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Image, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../../auth/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { uploadRecipePhoto } from '../../../firebase/add_recipe_data';
import Toast from 'react-native-toast-message';

export default function EditRecipePage() {
  const { id } = useLocalSearchParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [existingPhotos, setExistingPhotos] = useState([]);   // URLs déjà sur Storage
  const [newPhotoUris, setNewPhotoUris] = useState([]);        // nouvelles photos locales
  const [ingredients, setIngredients] = useState(['']);
  const [steps, setSteps] = useState(['']);

  // Auth guard + load recipe
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.replace('/connexion'); return; }
      setUser(u);

      const snap = await getDoc(doc(db, 'recipes', id));
      if (!snap.exists() || snap.data().authorId !== u.uid) {
        Toast.show({ type: 'error', text1: 'Non autorisé' });
        router.back();
        return;
      }
      const data = snap.data();
      setTitle(data.title || '');
      setExistingPhotos(data.photos || (data.photoURL ? [data.photoURL] : []));
      setIngredients(data.ingredients?.length ? data.ingredients : ['']);
      setSteps(data.steps?.length ? data.steps : ['']);
      setLoading(false);
    });
    return unsub;
  }, [id]);

  // --- Photos existantes ---
  const removeExistingPhoto = (i) => {
    setExistingPhotos((prev) => prev.filter((_, idx) => idx !== i));
  };

  // --- Nouvelles photos ---
  const pickPhoto = async () => {
    const total = existingPhotos.length + newPhotoUris.length;
    if (total >= 5) {
      Toast.show({ type: 'info', text1: 'Maximum atteint', text2: 'Vous pouvez avoir jusqu\'à 5 photos.' });
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', "L'accès à la galerie est nécessaire.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setNewPhotoUris((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removeNewPhoto = (i) => {
    setNewPhotoUris((prev) => prev.filter((_, idx) => idx !== i));
  };

  // --- Ingrédients ---
  const updateIngredient = (text, i) => {
    const arr = [...ingredients]; arr[i] = text; setIngredients(arr);
  };
  const addIngredient = () => setIngredients([...ingredients, '']);
  const removeIngredient = (i) => {
    if (ingredients.length === 1) return;
    setIngredients(ingredients.filter((_, idx) => idx !== i));
  };

  // --- Étapes ---
  const updateStep = (text, i) => {
    const arr = [...steps]; arr[i] = text; setSteps(arr);
  };
  const addStep = () => setSteps([...steps, '']);
  const removeStep = (i) => {
    if (steps.length === 1) return;
    setSteps(steps.filter((_, idx) => idx !== i));
  };

  // --- Enregistrer ---
  const handleSave = async () => {
    if (!title.trim()) {
      Toast.show({ type: 'error', text1: 'Titre requis' });
      return;
    }
    const cleanIngredients = ingredients.filter((s) => s.trim());
    const cleanSteps = steps.filter((s) => s.trim());
    if (cleanIngredients.length === 0) {
      Toast.show({ type: 'error', text1: 'Ingrédients requis' });
      return;
    }
    if (cleanSteps.length === 0) {
      Toast.show({ type: 'error', text1: 'Étapes requises' });
      return;
    }

    setSaving(true);
    try {
      // Upload nouvelles photos
      const newURLs = await Promise.all(newPhotoUris.map((uri) => uploadRecipePhoto(uri)));
      const allPhotos = [...existingPhotos, ...newURLs];

      if (allPhotos.length === 0) {
        Toast.show({ type: 'error', text1: 'Photo requise', text2: 'La recette doit avoir au moins une photo.' });
        setSaving(false);
        return;
      }

      await updateDoc(doc(db, 'recipes', id), {
        title: title.trim(),
        ingredients: cleanIngredients,
        steps: cleanSteps,
        photos: allPhotos,
        photoURL: allPhotos[0],
        updatedAt: serverTimestamp(),
      });

      Toast.show({ type: 'success', text1: '✅ Recette mise à jour !' });
      router.back();
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: e.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#F97316" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const totalPhotos = existingPhotos.length + newPhotoUris.length;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1C1917" />
          </Pressable>
          <Text style={styles.headerTitle}>Modifier la recette</Text>
          <Pressable
            onPress={handleSave}
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color="#FFF" />
              : <Text style={styles.saveBtnText}>Enregistrer</Text>
            }
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>

          {/* Section photos */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionLabel}>📸 Photos du plat</Text>
              <Text style={styles.sectionHint}>{totalPhotos}/5</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosRow}>
              {/* Photos existantes */}
              {existingPhotos.map((url, i) => (
                <View key={`existing-${i}`} style={styles.photoThumbWrapper}>
                  <Image source={{ uri: url }} style={styles.photoThumb} />
                  {i === 0 && (
                    <View style={styles.mainBadge}>
                      <Text style={styles.mainBadgeText}>Principal</Text>
                    </View>
                  )}
                  <Pressable onPress={() => removeExistingPhoto(i)} style={styles.removePhotoBtn}>
                    <Ionicons name="close-circle" size={22} color="#F43F5E" />
                  </Pressable>
                </View>
              ))}

              {/* Nouvelles photos */}
              {newPhotoUris.map((uri, i) => (
                <View key={`new-${i}`} style={styles.photoThumbWrapper}>
                  <Image source={{ uri }} style={styles.photoThumb} />
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>Nouveau</Text>
                  </View>
                  <Pressable onPress={() => removeNewPhoto(i)} style={styles.removePhotoBtn}>
                    <Ionicons name="close-circle" size={22} color="#F43F5E" />
                  </Pressable>
                </View>
              ))}

              {/* Bouton d'ajout */}
              {totalPhotos < 5 && (
                <Pressable onPress={pickPhoto} style={styles.addPhotoBtn}>
                  <Ionicons name="camera-outline" size={32} color="#F97316" />
                  <Text style={styles.addPhotoBtnText}>Ajouter</Text>
                </Pressable>
              )}
            </ScrollView>
          </View>

          {/* Titre */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>🍽️ Nom de la recette</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Ex: Pâtes carbonara étudiante..."
              placeholderTextColor="#A8A29E"
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />
          </View>

          {/* Ingrédients */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>🛒 Ingrédients</Text>
            {ingredients.map((ing, i) => (
              <View key={i} style={styles.listRow}>
                <View style={styles.listBullet}>
                  <Text style={styles.listBulletText}>·</Text>
                </View>
                <TextInput
                  style={styles.listInput}
                  placeholder={`Ingrédient ${i + 1}...`}
                  placeholderTextColor="#A8A29E"
                  value={ing}
                  onChangeText={(t) => updateIngredient(t, i)}
                />
                <Pressable onPress={() => removeIngredient(i)} style={styles.removeBtn}>
                  <Ionicons name="remove-circle-outline" size={22} color="#F43F5E" />
                </Pressable>
              </View>
            ))}
            <Pressable onPress={addIngredient} style={styles.addRow}>
              <Ionicons name="add-circle-outline" size={22} color="#F97316" />
              <Text style={styles.addRowText}>Ajouter un ingrédient</Text>
            </Pressable>
          </View>

          {/* Étapes */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>📋 Étapes de préparation</Text>
            {steps.map((step, i) => (
              <View key={i} style={styles.listRow}>
                <View style={[styles.listBullet, styles.stepBullet]}>
                  <Text style={styles.stepBulletText}>{i + 1}</Text>
                </View>
                <TextInput
                  style={[styles.listInput, styles.stepInput]}
                  placeholder={`Étape ${i + 1}...`}
                  placeholderTextColor="#A8A29E"
                  value={step}
                  onChangeText={(t) => updateStep(t, i)}
                  multiline
                />
                <Pressable onPress={() => removeStep(i)} style={styles.removeBtn}>
                  <Ionicons name="remove-circle-outline" size={22} color="#F43F5E" />
                </Pressable>
              </View>
            ))}
            <Pressable onPress={addStep} style={styles.addRow}>
              <Ionicons name="add-circle-outline" size={22} color="#F97316" />
              <Text style={styles.addRowText}>Ajouter une étape</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#FDE8D8',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1C1917' },
  saveBtn: {
    backgroundColor: '#F97316', paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 20, minWidth: 110, alignItems: 'center',
    shadowColor: '#F97316', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  form: { padding: 16, gap: 12, paddingBottom: 48 },
  section: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16,
    gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: '#1C1917' },
  sectionHint: { fontSize: 13, color: '#A8763E', fontWeight: '600' },
  photosRow: { flexDirection: 'row', gap: 10, paddingVertical: 4, paddingRight: 4 },
  photoThumbWrapper: {
    width: 110, height: 110, borderRadius: 12,
    overflow: 'hidden', position: 'relative',
  },
  photoThumb: { width: '100%', height: '100%' },
  mainBadge: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: '#F97316', paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 8,
  },
  mainBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  newBadge: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: '#10B981', paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 8,
  },
  newBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  removePhotoBtn: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: '#FFF', borderRadius: 12,
  },
  addPhotoBtn: {
    width: 110, height: 110, borderRadius: 12,
    borderWidth: 2, borderColor: '#FDE8D8', borderStyle: 'dashed',
    backgroundColor: '#FFF8F5',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  addPhotoBtnText: { fontSize: 12, color: '#F97316', fontWeight: '600', textAlign: 'center' },
  titleInput: {
    borderWidth: 1, borderColor: '#FDE8D8', borderRadius: 12,
    padding: 13, fontSize: 17, fontWeight: '600', color: '#1C1917',
    backgroundColor: '#FFF8F5',
  },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  listBullet: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#FEF3E8', alignItems: 'center', justifyContent: 'center',
  },
  listBulletText: { fontSize: 20, color: '#F97316', lineHeight: 24 },
  stepBullet: { backgroundColor: '#F97316' },
  stepBulletText: { fontSize: 12, fontWeight: '800', color: '#FFF' },
  listInput: {
    flex: 1, borderWidth: 1, borderColor: '#FDE8D8', borderRadius: 10,
    padding: 10, fontSize: 14, color: '#1C1917', backgroundColor: '#FFF8F5',
  },
  stepInput: { minHeight: 44, textAlignVertical: 'top' },
  removeBtn: { padding: 4 },
  addRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8, paddingHorizontal: 4,
  },
  addRowText: { fontSize: 14, color: '#F97316', fontWeight: '600' },
});
