/**
 * Template SDK version for `create-expo-app` in E2E tests.
 * Pin the SDK version to prevent the latest version breaking snapshots.
 */
export const E2E_TEMPLATE_SDK_VERSION = `sdk-56`;

/**
 * Expected 3rd party modules in templates
 */
export const E2E_EXPECTED_3RD_PARTY_MODULES = [
  // Transitive dependencies of expo-router
  '@react-native-masked-view',
];
