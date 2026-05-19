import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  Pressable, ActivityIndicator, ImageBackground, RefreshControl, Image, Alert,
} from 'react-native';
import { useLocalSearchParams, router, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../../auth/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { toggleFavorite, checkFavorite } from '../../../firebase/toggle_favorite';
import { deleteRecipe } from '../../../firebase/delete_recipe';
import { deleteComment } from '../../../firebase/delete_comment';
import Toast from 'react-native-toast-message';

export default function RecipeDetailPage() {
  const { id } = useLocalSearchParams();
  const [user, setUser] = useState(null);
  const [recipe, setRecipe] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [deletingRecipe, setDeletingRecipe] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u && id) {
        const fav = await checkFavorite(id);
        setIsFav(fav);
      } else {
        setIsFav(false);
      }
    });
    return unsub;
  }, [id]);

  // Recette en temps réel
  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, 'recipes', id), (snap) => {
      if (snap.exists()) setRecipe({ id: snap.id, ...snap.data() });
      else setRecipe(null);
      setLoading(false);
    }, (e) => { console.error(e); setLoading(false); });
    return unsub;
  }, [id]);

  // Commentaires en temps réel
  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, 'recipes', id, 'comments'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setRefreshing(false);
    });
    return unsub;
  }, [id]);

  const onRefresh = () => setRefreshing(true);

  const handleToggleFavorite = async () => {
    if (!user) {
      Toast.show({ type: 'info', text1: 'Connexion requise', text2: 'Connectez-vous pour ajouter aux favoris.' });
      return;
    }
    setFavLoading(true);
    try {
      const nowFav = await toggleFavorite(id);
      setIsFav(nowFav);
      Toast.show({
        type: 'success',
        text1: nowFav ? '❤️ Ajouté aux favoris !' : '💔 Retiré des favoris',
        text2: nowFav ? 'Recette sauvegardée dans votre carnet.' : '',
      });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: e.message });
    } finally {
      setFavLoading(false);
    }
  };

  const handleDeleteRecipe = () => {
    Alert.alert(
      'Supprimer la recette',
      'Cette action est irréversible. Voulez-vous vraiment supprimer cette recette ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setDeletingRecipe(true);
            try {
              await deleteRecipe(id);
              Toast.show({ type: 'success', text1: 'Recette supprimée' });
              router.replace('/blog');
            } catch (e) {
              Toast.show({ type: 'error', text1: 'Erreur', text2: e.message });
              setDeletingRecipe(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteComment = (commentId) => {
    Alert.alert(
      'Supprimer le commentaire',
      'Voulez-vous vraiment supprimer cet avis ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setDeletingCommentId(commentId);
            try {
              await deleteComment(id, commentId);
              Toast.show({ type: 'success', text1: 'Avis supprimé' });
            } catch (e) {
              Toast.show({ type: 'error', text1: 'Erreur', text2: e.message });
            } finally {
              setDeletingCommentId(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#F97316" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundEmoji}>🔍</Text>
          <Text style={styles.notFoundText}>Recette introuvable</Text>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Retour</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = user && recipe.authorId === user.uid;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header flottant */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn} id="btn-back-recipe">
          <Ionicons name="arrow-back" size={22} color="#1C1917" />
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable
            id="btn-favorite"
            onPress={handleToggleFavorite}
            style={[styles.favBtn, isFav && styles.favBtnActive]}
            disabled={favLoading}
          >
            {favLoading
              ? <ActivityIndicator size="small" color={isFav ? '#FFF' : '#F43F5E'} />
              : <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={20} color={isFav ? '#FFF' : '#F43F5E'} />
            }
            <Text style={[styles.favBtnText, isFav && styles.favBtnTextActive]}>
              {recipe.favoriteCount || 0}
            </Text>
          </Pressable>

          {/* Bouton avis (utilisateur connecté uniquement) */}
          {user && (
            <Link href={`/post/${id}/new-comment`} asChild>
              <Pressable style={styles.commentBtn} id="btn-add-review">
                <Ionicons name="chatbubble-outline" size={18} color="#FFF" />
                <Text style={styles.commentBtnText}>Avis</Text>
              </Pressable>
            </Link>
          )}

          {/* Boutons éditer / supprimer (propriétaire uniquement) */}
          {isOwner && (
            <>
              <Link href={`/post/${id}/edit`} asChild>
                <Pressable style={styles.editBtn} id="btn-edit-recipe">
                  <Ionicons name="create-outline" size={18} color="#FFF" />
                </Pressable>
              </Link>
              <Pressable
                id="btn-delete-recipe"
                onPress={handleDeleteRecipe}
                style={styles.deleteBtn}
                disabled={deletingRecipe}
              >
                {deletingRecipe
                  ? <ActivityIndicator size="small" color="#FFF" />
                  : <Ionicons name="trash-outline" size={18} color="#FFF" />
                }
              </Pressable>
            </>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
      >
        {/* Hero photo avec titre superposé */}
        {recipe.photoURL ? (
          <ImageBackground
            source={{ uri: recipe.photoURL }}
            style={styles.heroImage}
            resizeMode="cover"
          >
            <View style={styles.heroOverlayTop} />
            <View style={styles.heroOverlayBottom}>
              <View style={styles.heroStats}>
                <View style={styles.heroStatChip}>
                  <Ionicons name="heart" size={14} color="#FFF" />
                  <Text style={styles.heroStatText}>{recipe.favoriteCount || 0}</Text>
                </View>
                <View style={styles.heroStatChip}>
                  <Ionicons name="chatbubble" size={14} color="#FFF" />
                  <Text style={styles.heroStatText}>{recipe.commentCount || 0} avis</Text>
                </View>
              </View>
              <Text style={styles.heroTitle}>{recipe.title}</Text>
              <View style={styles.heroAuthorRow}>
                {recipe.authorPhotoURL ? (
                  <Image source={{ uri: recipe.authorPhotoURL }} style={styles.heroAvatarPhoto} />
                ) : (
                  <View style={styles.heroAvatar}>
                    <Text style={styles.heroAvatarLetter}>
                      {(recipe.authorName || 'A')[0].toUpperCase()}
                    </Text>
                  </View>
                )}
                <View>
                  <Text style={styles.heroAuthorName}>Par {recipe.authorName}</Text>
                  <Text style={styles.heroDate}>{formatDate(recipe.createdAt)}</Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]}>
            <Ionicons name="restaurant-outline" size={72} color="#F97316" />
            <View style={styles.heroOverlayBottom}>
              <Text style={styles.heroTitle}>{recipe.title}</Text>
            </View>
          </View>
        )}

        {/* Galerie des photos supplémentaires */}
        {recipe.photos?.length > 1 && (
          <View style={styles.photoGallery}>
            <View style={styles.photoGalleryHeader}>
              <Ionicons name="images-outline" size={16} color="#78716C" />
              <Text style={styles.photoGalleryLabel}>
                {recipe.photos.length} photos · Faites défiler
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoGalleryScroll}
            >
              {recipe.photos.map((url, i) => (
                <View key={i} style={styles.photoGalleryItem}>
                  <Image source={{ uri: url }} style={styles.photoGalleryImg} resizeMode="cover" />
                  {i === 0 && (
                    <View style={styles.mainBadge}>
                      <Text style={styles.mainBadgeText}>Principale</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.content}>

          {/* Ingrédients */}
          {recipe.ingredients?.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🛒 Ingrédients</Text>
              {recipe.ingredients.map((ing, i) => (
                <View key={i} style={styles.ingredientRow}>
                  <View style={styles.ingredientDot} />
                  <Text style={styles.ingredientText}>{ing}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Étapes */}
          {recipe.steps?.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📋 Préparation</Text>
              {recipe.steps.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Avis / commentaires */}
          <View style={styles.commentsSection}>
            <View style={styles.commentsTitleRow}>
              <Ionicons name="chatbubbles-outline" size={20} color="#1C1917" />
              <Text style={styles.commentsTitle}>
                {comments.length} avis
              </Text>
            </View>

            {!user && (
              <View style={styles.loginPrompt}>
                <Ionicons name="lock-closed-outline" size={16} color="#78716C" />
                <Text style={styles.loginPromptText}>
                  <Link href="/connexion" style={styles.loginLink}>Connectez-vous</Link>
                  {' '}pour donner votre avis
                </Text>
              </View>
            )}

            {comments.length === 0 ? (
              <View style={styles.noComments}>
                <Text style={styles.noCommentsEmoji}>💬</Text>
                <Text style={styles.noCommentsText}>Soyez le premier à tester cette recette !</Text>
              </View>
            ) : (
              comments.map((c) => (
                <View key={c.id} style={styles.commentCard}>
                  <View style={styles.commentHeader}>
                    {c.authorPhotoURL ? (
                      <Image source={{ uri: c.authorPhotoURL }} style={styles.commentAvatarPhoto} />
                    ) : (
                      <View style={styles.commentAvatar}>
                        <Text style={styles.commentAvatarLetter}>
                          {(c.authorName || 'A')[0].toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.commentAuthor}>{c.authorName}</Text>
                      <Text style={styles.commentDate}>{formatDate(c.createdAt)}</Text>
                    </View>
                    {/* Supprimer son propre commentaire */}
                    {user && c.authorId === user.uid && (
                      <Pressable
                        onPress={() => handleDeleteComment(c.id)}
                        style={styles.deleteCommentBtn}
                        disabled={deletingCommentId === c.id}
                      >
                        {deletingCommentId === c.id
                          ? <ActivityIndicator size="small" color="#EF4444" />
                          : <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        }
                      </Pressable>
                    )}
                  </View>
                  <Text style={styles.commentContent}>{c.content}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5' },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  favBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#F43F5E',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  favBtnActive: { backgroundColor: '#F43F5E', borderColor: '#F43F5E' },
  favBtnText: { fontSize: 14, fontWeight: '700', color: '#F43F5E' },
  favBtnTextActive: { color: '#FFF' },
  commentBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#6366F1',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  commentBtnText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
  editBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F97316',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#F97316', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#EF4444', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  // Hero
  heroImage: { width: '100%', height: 420 },
  heroPlaceholder: { backgroundColor: '#FFF3E8', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  heroOverlayTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  heroOverlayBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: 24, paddingTop: 80,
    backgroundColor: 'rgba(0,0,0,0.58)',
    gap: 10,
  },
  heroStats: { flexDirection: 'row', gap: 10 },
  heroStatChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  heroStatText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  heroTitle: { fontSize: 28, fontWeight: '900', color: '#FFF', lineHeight: 36, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  heroAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  heroAvatarPhoto: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  heroAvatarLetter: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  heroAuthorName: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.95)' },
  heroDate: { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  // Content cards
  content: { padding: 16, gap: 16 },
  card: {
    backgroundColor: '#FFF', borderRadius: 18, padding: 18,
    gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#1C1917', marginBottom: 4 },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ingredientDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F97316' },
  ingredientText: { fontSize: 15, color: '#44403C', lineHeight: 24, flex: 1 },
  stepRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNumber: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center',
    marginTop: 2, flexShrink: 0,
  },
  stepNumberText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  stepText: { fontSize: 15, color: '#44403C', lineHeight: 24, flex: 1 },
  // Comments
  commentsSection: { gap: 12 },
  commentsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentsTitle: { fontSize: 18, fontWeight: '800', color: '#1C1917' },
  loginPrompt: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFF', padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#FDE8D8',
  },
  loginPromptText: { fontSize: 14, color: '#78716C' },
  loginLink: { color: '#F97316', fontWeight: '700' },
  noComments: { alignItems: 'center', padding: 24, gap: 8, backgroundColor: '#FFF', borderRadius: 16 },
  noCommentsEmoji: { fontSize: 40 },
  noCommentsText: { fontSize: 14, color: '#A8A29E', textAlign: 'center' },
  commentCard: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  commentAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center',
  },
  commentAvatarPhoto: {
    width: 36, height: 36, borderRadius: 18,
  },
  commentAvatarLetter: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: '#1C1917' },
  commentDate: { fontSize: 11, color: '#A8763E', marginTop: 1 },
  commentContent: { fontSize: 14, color: '#44403C', lineHeight: 22 },
  deleteCommentBtn: { padding: 6 },
  // Not found
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  notFoundEmoji: { fontSize: 64 },
  notFoundText: { fontSize: 16, color: '#78716C' },
  backButton: {
    backgroundColor: '#F97316', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
  },
  backButtonText: { color: '#FFF', fontWeight: '700' },
  // Photo gallery
  photoGallery: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FEF3E8',
  },
  photoGalleryHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, marginBottom: 10,
  },
  photoGalleryLabel: { fontSize: 13, color: '#78716C', fontWeight: '600' },
  photoGalleryScroll: { paddingHorizontal: 16, gap: 10 },
  photoGalleryItem: {
    width: 140, height: 105, borderRadius: 12,
    overflow: 'hidden', position: 'relative',
  },
  photoGalleryImg: { width: '100%', height: '100%' },
  mainBadge: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: '#F97316', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8,
  },
  mainBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
});
