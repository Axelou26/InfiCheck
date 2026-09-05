const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Assets : base BDPM (.db) + wa-sqlite (.wasm) pour le web
for (const ext of ['db', 'wasm']) {
  if (!config.resolver.assetExts.includes(ext)) {
    config.resolver.assetExts.push(ext);
  }
}

// Requis pour résoudre correctement les exports de expo-sqlite (web)
config.resolver.unstable_enablePackageExports = true;

// Headers SharedArrayBuffer (expo-sqlite web)
const previousEnhanceMiddleware = config.server?.enhanceMiddleware;
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    const base = previousEnhanceMiddleware
      ? previousEnhanceMiddleware(middleware, server)
      : middleware;
    return (req, res, next) => {
      res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      return base(req, res, next);
    };
  },
};

module.exports = config;
