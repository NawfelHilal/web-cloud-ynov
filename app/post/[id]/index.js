import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  Pressable, ActivityIndicator, Image, RefreshControl,
  Alert, Dimensions, Modal, Platform,
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

const { width: SCREEN_W } = Dimensions.get('window');
const GALLERY_COLS = 4;
const GALLERY_GAP  = 6;
const CELL_SIZE    = (SCREEN_W - 36 - GALLERY_GAP * (GALLERY_COLS - 1)) / GALLERY_COLS;

export default function RecipeDetailPage() {
  const { id } = useLocalSearchParams();
  const [user, setUser]                     = useState(null);
  const [recipe, setRecipe]                 = useState(null);
  const [comments, setComments]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [isFav, setIsFav]                   = useState(false);
  const [favLoading, setFavLoading]         = useState(false);
  const [deletingRecipe, setDeletingRecipe] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  // Lightbox
  const [lightboxUri, setLightboxUri]       = useState(null);

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

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, 'recipes', id), (snap) => {
      if (snap.exists()) setRecipe({ id: snap.id, ...snap.data() });
      else setRecipe(null);
      setLoading(false);
    }, (e) => { console.error(e); setLoading(false); });
    return unsub;
  }, [id]);

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

  const executeDeleteRecipe = async () => {
    setDeletingRecipe(true);
    try {
      await deleteRecipe(id);
      Toast.show({ type: 'success', text1: 'Recette supprimée' });
      router.replace('/blog');
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: e.message });
      setDeletingRecipe(false);
    }
  };

  const handleDeleteRecipe = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Cette action est irréversible. Voulez-vous vraiment supprimer cette recette ?')) {
        executeDeleteRecipe();
      }
    } else {
      Alert.alert(
        'Supprimer la recette',
        'Cette action est irréversible. Voulez-vous vraiment supprimer cette recette ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer', style: 'destructive',
            onPress: executeDeleteRecipe,
          },
        ]
      );
    }
  };

  const executeDeleteComment = async (commentId) => {
    setDeletingCommentId(commentId);
    try {
      await deleteComment(id, commentId);
      Toast.show({ type: 'success', text1: 'Avis supprimé' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: e.message });
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleDeleteComment = (commentId) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Voulez-vous vraiment supprimer cet avis ?')) {
        executeDeleteComment(commentId);
      }
    } else {
      Alert.alert(
        'Supprimer le commentaire',
        'Voulez-vous vraiment supprimer cet avis ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer', style: 'destructive',
            onPress: () => executeDeleteComment(commentId),
          },
        ]
      );
    }
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
  // Toutes les photos : priorité à recipe.photos, fallback sur photoURL seul
  const allPhotos = recipe.photos?.length
    ? recipe.photos
    : recipe.photoURL ? [recipe.photoURL] : [];

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header flottant ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn} id="btn-back-recipe">
          <Ionicons name="arrow-back" size={22} color="#1C1917" />
        </Pressable>

        <View style={styles.headerActions}>
          {/* Favori */}
          <Pressable
            id="btn-favorite"
            onPress={handleToggleFavorite}
            style={[styles.favBtn, isFav && styles.favBtnActive]}
            disabled={favLoading}
          >
            {favLoading
              ? <ActivityIndicator size="small" color={isFav ? '#FFF' : '#F43F5E'} />
              : <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={18} color={isFav ? '#FFF' : '#F43F5E'} />
            }
            <Text style={[styles.favBtnText, isFav && styles.favBtnTextActive]}>
              {recipe.favoriteCount || 0}
            </Text>
          </Pressable>

          {/* Avis */}
          {user && (
            <Link href={`/post/${id}/new-comment`} asChild>
              <Pressable style={styles.commentBtn} id="btn-add-review">
                <Ionicons name="chatbubble-outline" size={16} color="#FFF" />
                <Text style={styles.commentBtnText}>Avis</Text>
              </Pressable>
            </Link>
          )}

          {/* Éditer / Supprimer (propriétaire) */}
          {isOwner && (
            <>
              <Link href={`/post/${id}/edit`} asChild>
                <Pressable style={styles.editBtn} id="btn-edit-recipe">
                  <Ionicons name="create-outline" size={17} color="#FFF" />
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
                  : <Ionicons name="trash-outline" size={17} color="#FFF" />
                }
              </Pressable>
            </>
          )}
        </View>
      </View>

      {/* ── Contenu scrollable ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
      >

        {/* ── 1. BANNIÈRE — image pleine, sans texte dessus ── */}
        {recipe.photoURL ? (
          <Pressable onPress={() => setLightboxUri(recipe.photoURL)} activeOpacity={0.95}>
            <Image
              source={{ uri: recipe.photoURL }}
              style={styles.banner}
              resizeMode="cover"
            />
            {/* Icône zoom discret */}
            <View style={styles.bannerZoomHint}>
              <Ionicons name="expand-outline" size={16} color="#FFF" />
            </View>
          </Pressable>
        ) : (
          <View style={styles.bannerPlaceholder}>
            <Ionicons name="restaurant-outline" size={72} color="#F97316" />
          </View>
        )}

        {/* ── 2. CARTE INFO — titre, auteur, stats ── */}
        <View style={styles.infoCard}>
          <Text style={styles.recipeTitle}>{recipe.title}</Text>

          {/* Auteur */}
          <View style={styles.authorRow}>
            {recipe.authorPhotoURL ? (
              <Image source={{ uri: recipe.authorPhotoURL }} style={styles.authorPhoto} />
            ) : (
              <View style={styles.authorAvatar}>
                <Text style={styles.authorAvatarLetter}>
                  {(recipe.authorName || 'A')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.authorName}>{recipe.authorName}</Text>
              <Text style={styles.recipeDate}>{formatDate(recipe.createdAt)}</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={16} color="#F43F5E" />
              <Text style={styles.statChipText}>{recipe.favoriteCount || 0} favori{recipe.favoriteCount > 1 ? 's' : ''}</Text>
            </View>
            {/* Utilise comments.length (réel) plutôt que le compteur dénormalisé */}
            <View style={styles.statChip}>
              <Ionicons name="chatbubble-outline" size={16} color="#6366F1" />
              <Text style={styles.statChipText}>{comments.length} avis</Text>
            </View>
            {/* Note moyenne (uniquement si au moins un avis noté) */}
            {(() => {
              const rated = comments.filter((c) => c.rating > 0);
              if (rated.length === 0) return null;
              const avg = (rated.reduce((s, c) => s + c.rating, 0) / rated.length).toFixed(1);
              return (
                <View style={[styles.statChip, styles.statChipStar]}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={[styles.statChipText, { color: '#92400E' }]}>{avg}/5</Text>
                </View>
              );
            })()}
            {recipe.ingredients?.length > 0 && (
              <View style={styles.statChip}>
                <Ionicons name="list-outline" size={16} color="#10B981" />
                <Text style={styles.statChipText}>{recipe.ingredients.length} ingr.</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── 3. GALERIE PHOTOS ── */}
        {allPhotos.length > 0 && (
          <View style={styles.card}>
            {/* En-tête */}
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons name="images" size={20} color="#F97316" />
                <Text style={styles.cardTitle}>Galerie</Text>
              </View>
              <View style={styles.photoBadge}>
                <Text style={styles.photoBadgeText}>{allPhotos.length} photo{allPhotos.length > 1 ? 's' : ''}</Text>
              </View>
            </View>

            {/* Grille 2 colonnes */}
            <View style={styles.photoGrid}>
              {allPhotos.map((url, i) => (
                <Pressable
                  key={i}
                  style={styles.photoCell}
                  onPress={() => setLightboxUri(url)}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: url }}
                    style={styles.photoCellImg}
                    resizeMode="cover"
                  />
                  {/* Badge photo principale */}
                  {i === 0 && (
                    <View style={styles.mainBadge}>
                      <Ionicons name="star" size={10} color="#FFF" />
                      <Text style={styles.mainBadgeText}>Principale</Text>
                    </View>
                  )}
                  {/* Icône zoom */}
                  <View style={styles.zoomIcon}>
                    <Ionicons name="expand-outline" size={14} color="#FFF" />
                  </View>
                </Pressable>
              ))}
            </View>

            <Text style={styles.galleryHint}>Appuyez sur une photo pour l'agrandir</Text>
          </View>
        )}

        {/* ── 4. INGRÉDIENTS ── */}
        {recipe.ingredients?.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons name="cart" size={20} color="#F97316" />
                <Text style={styles.cardTitle}>Ingrédients</Text>
              </View>
              <View style={[styles.photoBadge, { backgroundColor: '#FFF3E8' }]}>
                <Text style={[styles.photoBadgeText, { color: '#A8763E' }]}>
                  {recipe.ingredients.length} articles
                </Text>
              </View>
            </View>
            {recipe.ingredients.map((ing, i) => (
              <View key={i} style={styles.ingredientRow}>
                <View style={styles.ingredientDot} />
                <Text style={styles.ingredientText}>{ing}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── 5. ÉTAPES ── */}
        {recipe.steps?.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons name="list" size={20} color="#F97316" />
                <Text style={styles.cardTitle}>Préparation</Text>
              </View>
              <View style={[styles.photoBadge, { backgroundColor: '#F0FDF4' }]}>
                <Text style={[styles.photoBadgeText, { color: '#059669' }]}>
                  {recipe.steps.length} étape{recipe.steps.length > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
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

        {/* ── 6. COMMENTAIRES ── */}
        <View style={[styles.card, { marginBottom: 24 }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="chatbubbles" size={20} color="#6366F1" />
              <Text style={styles.cardTitle}>Avis</Text>
            </View>
            <View style={[styles.photoBadge, { backgroundColor: '#EEF2FF' }]}>
              <Text style={[styles.photoBadgeText, { color: '#6366F1' }]}>
                {comments.length} avis
              </Text>
            </View>
          </View>

          {/* Note moyenne si au moins un avis est noté */}
          {(() => {
            const rated = comments.filter((c) => c.rating > 0);
            if (rated.length === 0) return null;
            const avg  = rated.reduce((s, c) => s + c.rating, 0) / rated.length;
            const full = Math.floor(avg);
            const half = avg - full >= 0.5;
            return (
              <View style={styles.avgRatingRow}>
                <View style={styles.avgRatingStars}>
                  {[1,2,3,4,5].map((n) => (
                    <Ionicons
                      key={n}
                      name={n <= full ? 'star' : (n === full + 1 && half ? 'star-half' : 'star-outline')}
                      size={20}
                      color="#F59E0B"
                    />
                  ))}
                </View>
                <Text style={styles.avgRatingText}>{avg.toFixed(1)}/5</Text>
                <Text style={styles.avgRatingCount}>({rated.length} note{rated.length > 1 ? 's' : ''})</Text>
              </View>
            );
          })()}

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
                    {c.rating > 0 && (
                      <View style={styles.commentStars}>
                        {[1,2,3,4,5].map((n) => (
                          <Ionicons
                            key={n}
                            name={n <= c.rating ? 'star' : 'star-outline'}
                            size={13}
                            color="#F59E0B"
                          />
                        ))}
                      </View>
                    )}
                    <Text style={styles.commentDate}>{formatDate(c.createdAt)}</Text>
                  </View>
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

      </ScrollView>

      {/* ── Lightbox plein écran ── */}
      <Modal
        visible={!!lightboxUri}
        transparent
        animationType="fade"
        onRequestClose={() => setLightboxUri(null)}
      >
        <Pressable style={styles.lightboxBackdrop} onPress={() => setLightboxUri(null)}>
          <Image
            source={{ uri: lightboxUri }}
            style={styles.lightboxImage}
            resizeMode="contain"
          />
          <View style={styles.lightboxClose}>
            <Ionicons name="close" size={26} color="#FFF" />
          </View>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5' },

  // ── Header flottant ──
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 4, elevation: 4,
  },
  headerActions: { flexDirection: 'row', gap: 7, alignItems: 'center' },
  favBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: 18,
    borderWidth: 1.5, borderColor: '#F43F5E',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  favBtnActive: { backgroundColor: '#F43F5E', borderColor: '#F43F5E' },
  favBtnText: { fontSize: 13, fontWeight: '700', color: '#F43F5E' },
  favBtnTextActive: { color: '#FFF' },
  commentBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#6366F1',
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: 18,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  commentBtnText: { color: '#FFF', fontWeight: '600', fontSize: 12 },
  editBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#F97316',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#F97316', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  deleteBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#EF4444', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },

  // ── Bannière ──
  banner: {
    width: '100%',
    height: 300,
  },
  bannerPlaceholder: {
    width: '100%', height: 240,
    backgroundColor: '#FFF3E8',
    alignItems: 'center', justifyContent: 'center',
  },
  bannerZoomHint: {
    position: 'absolute', bottom: 10, right: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 14, padding: 6,
  },

  // ── Carte info ──
  infoCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: -20,          // remonte légèrement sur la bannière
    borderRadius: 20,
    padding: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  recipeTitle: { fontSize: 24, fontWeight: '900', color: '#1C1917', lineHeight: 30 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center',
  },
  authorAvatarLetter: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  authorPhoto: { width: 38, height: 38, borderRadius: 19 },
  authorName: { fontSize: 14, fontWeight: '700', color: '#1C1917' },
  recipeDate: { fontSize: 12, color: '#A8763E', marginTop: 1 },
  statsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  statChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#F8F8F8', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: '#F0F0F0',
  },
  statChipStar: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  statChipText: { fontSize: 13, fontWeight: '600', color: '#44403C' },
  // Note moyenne
  avgRatingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFFBEB', padding: 12, borderRadius: 12,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  avgRatingStars: { flexDirection: 'row', gap: 2 },
  avgRatingText: { fontSize: 15, fontWeight: '800', color: '#92400E' },
  avgRatingCount: { fontSize: 12, color: '#A8763E' },

  // ── Cartes génériques ──
  card: {
    backgroundColor: '#FFF',
    marginHorizontal: 16, marginTop: 14,
    borderRadius: 20, padding: 18,
    gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#1C1917' },
  photoBadge: {
    backgroundColor: '#FFF3E8',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  photoBadgeText: { fontSize: 12, fontWeight: '700', color: '#F97316' },

  // ── Galerie ──
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GALLERY_GAP,
  },
  photoCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  photoCellImg: { width: '100%', height: '100%' },
  mainBadge: {
    position: 'absolute', top: 4, left: 4,
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: '#F97316',
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6,
  },
  mainBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  zoomIcon: {
    position: 'absolute', bottom: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 8, padding: 3,
  },
  galleryHint: {
    fontSize: 12, color: '#A8A29E', textAlign: 'center',
    marginTop: -4,
  },

  // ── Ingrédients ──
  ingredientRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ingredientDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F97316', flexShrink: 0 },
  ingredientText: { fontSize: 15, color: '#44403C', lineHeight: 22, flex: 1 },

  // ── Étapes ──
  stepRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNumber: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center',
    marginTop: 2, flexShrink: 0,
  },
  stepNumberText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  stepText: { fontSize: 15, color: '#44403C', lineHeight: 24, flex: 1 },

  // ── Commentaires ──
  loginPrompt: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFFBEB', padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  loginPromptText: { fontSize: 14, color: '#78716C' },
  loginLink: { color: '#F97316', fontWeight: '700' },
  noComments: { alignItems: 'center', padding: 20, gap: 8 },
  noCommentsEmoji: { fontSize: 36 },
  noCommentsText: { fontSize: 14, color: '#A8A29E', textAlign: 'center' },
  commentCard: {
    backgroundColor: '#F9F9FB', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  commentAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center',
  },
  commentAvatarPhoto: { width: 34, height: 34, borderRadius: 17 },
  commentAvatarLetter: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: '#1C1917' },
  commentStars: { flexDirection: 'row', gap: 1, marginTop: 2 },
  commentDate: { fontSize: 11, color: '#A8763E', marginTop: 2 },
  commentContent: { fontSize: 14, color: '#44403C', lineHeight: 21 },
  deleteCommentBtn: { padding: 6 },

  // ── Not found ──
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  notFoundEmoji: { fontSize: 64 },
  notFoundText: { fontSize: 16, color: '#78716C' },
  backButton: {
    backgroundColor: '#F97316', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
  },
  backButtonText: { color: '#FFF', fontWeight: '700' },

  // ── Lightbox ──
  lightboxBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center', justifyContent: 'center',
  },
  lightboxImage: {
    width: SCREEN_W,
    height: SCREEN_W * 1.2,
  },
  lightboxClose: {
    position: 'absolute', top: 50, right: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, padding: 8,
  },
});
