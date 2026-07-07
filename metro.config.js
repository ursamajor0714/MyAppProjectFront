const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force Metro to prioritize 'browser' and 'require' exports to resolve
// CommonJS versions of libraries (like zustand v5) instead of ESM versions 
// that contain 'import.meta' when building for the web.
config.resolver.unstable_conditionNames = [
  'browser',
  'require',
  'react-native',
];

module.exports = config;
