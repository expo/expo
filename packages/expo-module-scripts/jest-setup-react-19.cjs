// This is a temporary workaround for `react-test-renderer@19+`.
// The renderer is deprecated, but there is no replacement for React Native yet.
// Setting this global property disables the deprecation warning, and changes RTR to legacy mode.
// See: https://discord.com/channels/514829729862516747/514832743654228009/1266527040480477274
globalThis.IS_REACT_NATIVE_TEST_ENVIRONMENT = true;
