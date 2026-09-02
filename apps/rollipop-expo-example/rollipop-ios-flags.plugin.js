/**
 * rollipop-ios-flags plugin
 *
 * Injects the iOS linker / build settings required for rollipop + Expo Router
 * Fabric support (root cause #8): with the new architecture, `RNScreens` Fabric
 * components (RNSSafeAreaView) and React Native's `DebuggingOverlay` are
 * dead-stripped / not registered unless:
 *   - RCT_REMOVE_LEGACY_ARCH = 0   (keep legacy-arch components like DebuggingOverlay)
 *   - DEAD_CODE_STRIPPING = NO    (don't strip unused ObjC metadata)
 *   - RNScreens is force-loaded    (so its Fabric classes are present at runtime)
 *
 * Implemented as a config plugin via `@expo/config-plugins` `withPodfile` so the
 * flags survive `expo prebuild` (which otherwise regenerates the Podfile and
 * wipes manual edits). config-plugins is resolved from the monorepo workspace.
 *
 * @param {object} config Expo config
 * @returns {object} mutated config
 */
const { withPodfile } = require('../../packages/@expo/config-plugins/build');

const INJECT = `
  # [rollipop] ios fabric linker flags (root cause #8)
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['RCT_REMOVE_LEGACY_ARCH'] = '0'
      config.build_settings['DEAD_CODE_STRIPPING'] = 'NO'
    end
    if target.name == 'RNScreens'
      target.build_configurations.each do |config|
        base = config.build_settings['OTHER_LDFLAGS'] || '-ObjC'
        base = base.to_s
        unless base.include?('force_load')
          config.build_settings['OTHER_LDFLAGS'] = base + ' -force_load "$(BUILT_PRODUCTS_DIR)/RNScreens/libRNScreens.a"'
        end
      end
    end
  end
`;

module.exports = function withRollipopIosFlags(config) {
  return withPodfile(config, (cfg) => {
    const { modResults } = cfg;
    if (modResults.contents.includes('# [rollipop]')) {
      return cfg;
    }
    modResults.contents = modResults.contents.replace(
      /post_install do \|installer\|\n/,
      `post_install do |installer|\n${INJECT}`
    );
    return cfg;
  });
};
