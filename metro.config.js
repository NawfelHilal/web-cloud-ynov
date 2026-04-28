const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// On s'assure d'ajouter 'mjs' aux extensions sources
const { transformer, resolver } = config;

config.resolver.sourceExts = [...resolver.sourceExts, 'mjs'];

module.exports = config;
