/* @flow */

import { createRouter } from 'react-navigation';

export default createRouter(
  () => ({
    projects: () => require('../screens/ProjectsScreen').default,
    explore: () => require('../screens/ExploreScreen').default,
    profile: () => require('../screens/ProfileScreen').default,
    search: () => require('../screens/SearchScreen').default,
    modal: () => require('../screens/ModalScreen').default,
    signIn: () => require('../screens/SignInScreen').default,
    signUp: () => require('../screens/SignUpScreen').default,
    qrCode: () => require('../screens/QRCodeScreen').default,
    userSettings: () => require('../screens/UserSettingsScreen').default,
    projectsForUser: () => require('../screens/ProjectsForUserScreen').default,
    rootNavigation: () => require('./RootNavigation').default,
  }),
  { ignoreSerializableWarnings: true }
);
