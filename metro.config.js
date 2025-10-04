const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(process.cwd());

// Add support for additional file extensions
config.resolver.assetExts.push(
  // Add any additional asset extensions here
);

// Add support for additional source extensions
config.resolver.sourceExts.push(
  'jsx',
  'js',
  'ts',
  'tsx',
  'json'
);

module.exports = config;