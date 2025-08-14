if (process.env.EXPO_OS !== 'web') {
  const { installGlobal } = require('../build/WebStorage');
  installGlobal();
}
