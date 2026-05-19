import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, SafeAreaView,
  Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../../auth/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { addComment } from '../../../firebase/add_comment_data';
import Toast from 'react-native-toast-message';

export default function NewReviewPage() {
  const { id } = useLocalSearchParams();
  const [user, setUser] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecking(false);
      if (!u) router.replace('/connexion');
    });
    return unsub;
  }, []);

  const handleSubmit = async () => {
    if (!content.trim()) {
      Toast.show({ type: 'error', text1: 'Avis vide', text2: 'Écrivez votre avis sur la recette.' });
      return;
    }
    setLoading(true);
    try {
      await addComment(id, content.trim());
      Toast.show({ type: 'success', text1: '✅ Avis publié !', text2: 'Merci pour votre retour !' });
      router.replace(`/post/${id}`);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: e.message });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#6366F1" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} id="btn-back-review">
            <Ionicons name="arrow-back" size={24} color="#1C1917" />
          </Pressable>
          <Text style={styles.headerTitle}>Donner mon avis</Text>
          <Pressable
            id="btn-submit-review"
            onPress={handleSubmit}
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator size="small" color="#FFF" />
              : <Text style={styles.submitBtnText}>Publier</Text>
            }
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.form}>
          {/* Auteur */}
          <View style={styles.authorBadge}>
            <Ionicons name="person-circle-outline" size={20} color="#6366F1" />
            <Text style={styles.authorText}>
              {user?.displayName || user?.email || 'Anonyme'}
            </Text>
          </View>

          {/* Suggestions */}
          <View style={styles.suggestionsBox}>
            <Text style={styles.suggestionsTitle}>💡 Idées pour votre avis :</Text>
            <Text style={styles.suggestionsText}>
              • Avez-vous testé la recette ?{'\n'}
              • Qu'est-ce que vous avez changé ?{'\n'}
              • Proposez une variante d'ingrédient !
            </Text>
          </View>

          <Text style={styles.label}>Votre avis</Text>
          <TextInput
            id="input-review-content"
            style={styles.reviewInput}
            placeholder="Cette recette était délicieuse ! J'ai remplacé les pâtes par du riz..."
            placeholderTextColor="#A8A29E"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            autoFocus
          />
          <Text style={styles.charCount}>{content.length} caractères</Text>
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
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1C1917' },
  submitBtn: {
    backgroundColor: '#6366F1', paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 20, minWidth: 80, alignItems: 'center',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  form: { padding: 20, gap: 14, paddingBottom: 48 },
  authorBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 9,
    borderRadius: 12, alignSelf: 'flex-start',
  },
  authorText: { fontSize: 13, color: '#6366F1', fontWeight: '700' },
  suggestionsBox: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 16,
    borderLeftWidth: 4, borderLeftColor: '#F97316',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  suggestionsTitle: { fontSize: 14, fontWeight: '700', color: '#1C1917', marginBottom: 8 },
  suggestionsText: { fontSize: 13, color: '#78716C', lineHeight: 22 },
  label: { fontSize: 14, fontWeight: '700', color: '#44403C' },
  reviewInput: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#FDE8D8', borderRadius: 14,
    padding: 14, fontSize: 15, color: '#1C1917', minHeight: 180, lineHeight: 24,
  },
  charCount: { textAlign: 'right', fontSize: 12, color: '#A8A29E' },
});
