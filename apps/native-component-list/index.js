// =====================================================
// index.ts - Point d'entrée principal de l'application Bulonet (Expo)
// Auteur : Équipe Bulonet
// Date : 2025
// =====================================================

// 📦 Import nécessaire pour le fonctionnement de Metro (hot reload, debugging)
import '@expo/metro-runtime';

// 🎯 Import de la fonction d'enregistrement du composant racine fournie par Expo
import { registerRootComponent } from 'expo';

// 📱 Import du composant principal de l'application (défini dans App.tsx)
import App from './App';

// ------------------------------------------------------------------
// 1️⃣ Configuration globale des erreurs non rattrapées
// ------------------------------------------------------------------
if (!__DEV__) {
  // En production, on peut rediriger les erreurs vers un service externe (Sentry, Bugsnag, etc.)
  const originalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    // Ici, on pourrait appeler Sentry.captureException(error)
    // Exemple : if (Sentry) Sentry.captureException(error);
    console.error('❌ Erreur globale capturée (production) :', error);

    // On appelle le gestionnaire d'origine pour ne pas casser le comportement par défaut
    originalHandler(error, isFatal);
  });
} else {
  // En développement, on laisse le comportement par défaut (afficher les erreurs dans la console)
  console.log('🐞 Mode développement : gestion des erreurs standard');
}

// ------------------------------------------------------------------
// 2️⃣ Vérification des variables d'environnement critiques (optionnel)
// ------------------------------------------------------------------
if (__DEV__) {
  const requiredEnvVars = ['EXPO_PUBLIC_API_URL']; // Liste des variables requises
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );
  if (missingVars.length > 0) {
    console.warn(
      `⚠️ Variables d'environnement manquantes : ${missingVars.join(', ')}`
    );
  }
}

// ------------------------------------------------------------------
// 3️⃣ Initialisation d'outils de monitoring (exemple avec Sentry)
//    On importe et initialise Sentry uniquement si la DSN est fournie
// ------------------------------------------------------------------
// Note : pour utiliser Sentry, il faut installer @sentry/react-native
// et configurer les variables d'environnement.
if (process.env.EXPO_PUBLIC_SENTRY_DSN && !__DEV__) {
  // On utilise un import dynamique pour ne pas ralentir le démarrage
  import('@sentry/react-native')
    .then((Sentry) => {
      Sentry.init({
        dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
        environment: __DEV__ ? 'development' : 'production',
      });
      console.log('📡 Sentry initialisé avec succès');
    })
    .catch((err) => {
      console.warn('⚠️ Échec de l’initialisation de Sentry :', err);
    });
}

// ------------------------------------------------------------------
// 4️⃣ Mesure du temps de démarrage (performance)
//    On utilise le marqueur de performance natif si disponible
// ------------------------------------------------------------------
if (!__DEV__ && 'performance' in global && 'mark' in performance) {
  performance.mark('app-start');
  // On pourrait envoyer cette métrique à un service d'analytics après le chargement
}

// ------------------------------------------------------------------
// 5️⃣ Enregistrement du composant racine
//    registerRootComponent s'occupe d'appeler AppRegistry.registerComponent
//    et de configurer l'environnement (Expo Go ou build natif)
// ------------------------------------------------------------------
registerRootComponent(App);

// 🎉 L'application est maintenant prête à démarrer
