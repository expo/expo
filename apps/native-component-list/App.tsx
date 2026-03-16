// =====================================================
// App.tsx - Point d'entrée principal de l'application Bulonet
// Auteur : Équipe Bulonet
// Date : 2025
// =====================================================

import { ThemeProvider } from 'ThemeProvider'; // Fournisseur de thème personnalisé
import * as SplashScreen from 'expo-splash-screen'; // Gestion de l'écran de démarrage
import * as React from 'react';
import { Platform, StatusBar, View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Importations des modules avancés
import { AuthProvider } from './src/contexts/AuthContext'; // Contexte d'authentification
import { NotificationService } from './src/services/NotificationService'; // Service de notifications push
import { AnalyticsService } from './src/services/AnalyticsService'; // Service d'analytics
import { NetworkProvider } from './src/contexts/NetworkContext'; // Contexte réseau
import { ErrorBoundary } from './src/components/ErrorBoundary'; // Gestionnaire d'erreurs global
import { initI18n } from './src/i18n'; // Configuration de l'internationalisation
import { useStore } from './src/store'; // Store global (Zustand)

// Navigation
import RootNavigation from './src/navigation/RootNavigation';

// Utilitaire de chargement des assets
import loadAssetsAsync from './src/utilities/loadAssetsAsync';

// Configuration du deep linking (si nécessaire)
import { linking } from './src/navigation/linking';

// ⏳ Empêche l'écran de splash de se cacher automatiquement tant qu'on n'a pas fini
SplashScreen.preventAutoHideAsync();

// ------------------------------------------------------------------
// Hook personnalisé : useSplashScreen
// Gère le chargement asynchrone et la gestion des erreurs
// Retourne un booléen indiquant si le chargement est terminé
// ------------------------------------------------------------------
function useSplashScreen(loadingFunction: () => Promise<void>) {
  const [isLoadingCompleted, setLoadingComplete] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    async function loadAsync() {
      try {
        // Appel de la fonction de chargement passée en paramètre
        await loadingFunction();
      } catch (error) {
        // Envoyer l'erreur à un service de reporting (Sentry, etc.)
        console.error('❌ Erreur lors du chargement initial :', error);
        // On peut décider de continuer ou d'afficher un écran d'erreur
      } finally {
        if (isMounted) {
          setLoadingComplete(true);
          // Cacher l'écran de splash
          await SplashScreen.hideAsync();
        }
      }
    }

    loadAsync();

    return () => {
      isMounted = false;
    };
  }, []); // Exécuté une seule fois au montage

  return isLoadingCompleted;
}

// ------------------------------------------------------------------
// Hook personnalisé : useAppInitialization
// Regroupe toutes les tâches d'initialisation (assets, auth, etc.)
// ------------------------------------------------------------------
async function initializeApp() {
  // 1️⃣ Chargement des assets (polices, images, etc.)
  await loadAssetsAsync();

  // 2️⃣ Initialisation de l'internationalisation (i18n)
  await initI18n();

  // 3️⃣ Configuration des notifications push (si permissions accordées)
  if (Platform.OS !== 'web') {
    await NotificationService.configure();
  }

  // 4️⃣ Initialisation des analytics (exemple : Firebase)
  if (__DEV__) {
    console.log('📊 Analytics désactivé en développement');
  } else {
    await AnalyticsService.initialize();
  }

  // 5️⃣ Autres initialisations éventuelles...
  // - Mise à jour OTA : expo-updates
  // - Récupération du profil utilisateur depuis le stockage
  // - etc.
}

// ------------------------------------------------------------------
// Composant principal App
// ------------------------------------------------------------------
export default function App() {
  // Hook pour le splash screen (lance l'initialisation)
  const isLoadingCompleted = useSplashScreen(initializeApp);

  // Récupération d'une variable d'état depuis le store global (Zustand)
  // Exemple : thème sombre ou clair
  const { themeMode } = useStore();

  // Effet pour appliquer le thème système si nécessaire (dépend du store)
  React.useEffect(() => {
    // Logique pour réagir au changement de thème (ex: StatusBar)
    StatusBar.setBarStyle(themeMode === 'dark' ? 'light-content' : 'dark-content');
  }, [themeMode]);

  // Si le chargement n'est pas terminé, on ne rend rien (splash screen visible)
  if (!isLoadingCompleted) {
    return null;
  }

  // Structure de l'application avec tous les providers
  return (
    <ErrorBoundary>
      {/* Gestion des erreurs globales */}
      <SafeAreaProvider>
        {/* Fournisseur de zone sécurisée (notch, etc.) */}
        <NetworkProvider>
          {/* Contexte réseau (connectivité) */}
          <AuthProvider>
            {/* Contexte d'authentification */}
            <ThemeProvider>
              {/* Contexte de thème (clair/sombre) */}
              {/* La navigation racine, avec support du deep linking */}
              <RootNavigation linking={linking} />
            </ThemeProvider>
          </AuthProvider>
        </NetworkProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
  }
