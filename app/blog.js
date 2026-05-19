import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  Pressable, ActivityIndicator, Image, RefreshControl, ScrollView, Dimensions, Alert,
} from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../auth/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

export default function RecipesPage() {
  const [user, setUser] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setRecipes(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
      setRefreshing(false);
    }, (e) => {
      console.error(e);
      setLoading(false);
    });
    return unsub;
  }, []);

  const onRefresh = () => setRefreshing(true);

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const renderRecipe = ({ item }) => (
    <Link href={`/post/${item.id}`} asChild>
      <Pressable style={styles.card}>
        {/* Photo */}
        {item.photoURL ? (
          <Image source={{ uri: item.photoURL }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Ionicons name="restaurant-outline" size={48} color="#F97316" />
          </View>
        )}

        {/* Badge auteur */}
        <View style={styles.authorBadge}>
          {item.authorPhotoURL ? (
            <Image source={{ uri: item.authorPhotoURL }} style={styles.authorAvatarPhoto} />
          ) : (
            <View style={styles.authorAvatar}>
              <Text style={styles.avatarLetter}>
                {(item.authorName || 'A')[0].toUpperCase()}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.authorName}>{item.authorName}</Text>
            <Text style={styles.postDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>

        {/* Titre */}
        <Text style={styles.cardTitle}>{item.title}</Text>

        {/* Aperçu ingrédients */}
        {item.ingredients?.length > 0 && (
          <Text style={styles.ingredientsPreview} numberOfLines={1}>
            🥗 {item.ingredients.slice(0, 3).join(' · ')}
            {item.ingredients.length > 3 ? ` +${item.ingredients.length - 3}` : ''}
          </Text>
        )}

        {/* Footer stats */}
        <View style={styles.cardFooter}>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Ionicons name="heart-outline" size={15} color="#F43F5E" />
              <Text style={styles.statText}>{item.favoriteCount || 0}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="chatbubble-outline" size={15} color="#64748B" />
              <Text style={styles.statText}>{item.commentCount || 0}</Text>
            </View>
          </View>
          <Text style={styles.seeMore}>Voir la recette →</Text>
        </View>
      </Pressable>
    </Link>
  );

  const withPhotos = recipes.filter((r) => r.photoURL);
  const COLS = 3;
  const PHOTO_SIZE = (Dimensions.get('window').width - 32 - (COLS - 1) * 4) / COLS;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerEmoji}>👨‍🍳</Text>
          <View>
            <Text style={styles.headerTitle}>Student Cook</Text>
            <Text style={styles.headerSub}>Recettes rapides & éco</Text>
          </View>
        </View>
        {user && (
          <Link href="/new-post" asChild>
            <Pressable style={styles.newBtn} id="btn-new-recipe">
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.newBtnText}>Recette</Text>
            </Pressable>
          </Link>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#F97316" style={styles.loader} />
      ) : recipes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🍳</Text>
          <Text style={styles.emptyTitle}>Aucune recette pour l'instant</Text>
          <Text style={styles.emptyText}>Soyez le premier à partager votre recette !</Text>
          {user && (
            <Link href="/new-post" asChild>
              <Pressable style={styles.emptyBtn}>
                <Text style={styles.emptyBtnText}>Partager une recette</Text>
              </Pressable>
            </Link>
          )}
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          renderItem={renderRecipe}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
          ListFooterComponent={
            withPhotos.length > 0 ? (
              <View style={styles.gallerySection}>
                {/* Titre section */}
                <View style={styles.gallerySectionHeader}>
                  <Ionicons name="images-outline" size={20} color="#1C1917" />
                  <Text style={styles.gallerySectionTitle}>Galerie des plats</Text>
                  <Text style={styles.gallerySectionCount}>{withPhotos.length} photos</Text>
                </View>

                {/* Grille de photos */}
                <View style={styles.photoGrid}>
                  {withPhotos.map((item) => (
                    <Link key={item.id} href={`/post/${item.id}`} asChild>
                      <Pressable style={{ ...styles.photoCell, width: PHOTO_SIZE, height: PHOTO_SIZE }}>
                        <Image
                          source={{ uri: item.photoURL }}
                          style={styles.photoThumb}
                          resizeMode="cover"
                        />
                        {/* Overlay avec titre au survol */}
                        <View style={styles.photoCellOverlay}>
                          <Text style={styles.photoCellTitle} numberOfLines={2}>
                            {item.title}
                          </Text>
                        </View>
                      </Pressable>
                    </Link>
                  ))}
                </View>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE8D8',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerEmoji: { fontSize: 34 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1C1917' },
  headerSub: { fontSize: 12, color: '#A8763E', fontWeight: '500' },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F97316',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    gap: 4,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  newBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  loader: { marginTop: 60 },
  list: { padding: 16, gap: 18, paddingBottom: 24 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  cardImage: { width: '100%', height: 200 },
  cardImagePlaceholder: {
    backgroundColor: '#FFF3E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  authorAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center',
  },
  authorAvatarPhoto: {
    width: 32, height: 32, borderRadius: 16,
  },
  avatarLetter: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  authorName: { fontSize: 13, fontWeight: '600', color: '#1C1917' },
  postDate: { fontSize: 11, color: '#A8763E' },
  cardTitle: {
    fontSize: 19, fontWeight: '800', color: '#1C1917',
    paddingHorizontal: 16, marginTop: 4, lineHeight: 26,
  },
  ingredientsPreview: {
    fontSize: 13, color: '#78716C',
    paddingHorizontal: 16, marginTop: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#FEF3E8',
  },
  stats: { flexDirection: 'row', gap: 14 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { fontSize: 14, color: '#78716C', fontWeight: '600' },
  seeMore: { fontSize: 14, color: '#F97316', fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1C1917', textAlign: 'center' },
  emptyText: { fontSize: 14, color: '#78716C', textAlign: 'center' },
  emptyBtn: {
    backgroundColor: '#F97316', paddingHorizontal: 24, paddingVertical: 13,
    borderRadius: 14, marginTop: 8,
    shadowColor: '#F97316', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  emptyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  // --- Galerie ---
  gallerySection: {
    marginTop: 8,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  gallerySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  gallerySectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C1917',
    flex: 1,
  },
  gallerySectionCount: {
    fontSize: 13,
    color: '#A8763E',
    fontWeight: '600',
    backgroundColor: '#FFF3E8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  photoCell: {
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  photoCellOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.52)',
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  photoCellTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
    lineHeight: 13,
  },
});
