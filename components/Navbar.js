import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Accueil', path: '/', icon: 'home-outline', activeIcon: 'home' },
    { name: 'Connexion', path: '/connexion', icon: 'log-in-outline', activeIcon: 'log-in' },
    { name: 'Profil', path: '/profil', icon: 'person-outline', activeIcon: 'person' },
  ];

  return (
    <View style={styles.container}>
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link key={item.path} href={item.path} asChild>
            <Pressable style={styles.navItem}>
              <Ionicons 
                name={isActive ? item.activeIcon : item.icon} 
                size={24} 
                color={isActive ? '#007AFF' : '#64748B'} 
              />
              <Text style={[styles.navText, isActive && styles.activeNavText]}>
                {item.name}
              </Text>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: 25,
    paddingTop: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  activeNavText: {
    color: '#007AFF',
    fontWeight: '700',
  },
});
