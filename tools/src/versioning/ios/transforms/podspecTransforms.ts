import { TransformPipeline } from '.';

export function podspecTransforms(versionName: string): TransformPipeline {
  return {
    transforms: [
      // Common transforms
      {
        // Transforms some podspec fields by adding versionName at the beginning
        replace: /\.(name|header_dir|module_name)(\s*=\s*["'])([^"']+)(["'])/g,
        with: `.$1$2${versionName}$3$4`,
      },
      {
        // Prefixes dependencies listed in the podspecs
        replace:
          /(\.dependency\s+["'])(Yoga|React\-|ReactCommon|RCT|FB|hermes-engine)(?!-Folly)([^"']*["'])/g,
        with: `$1${versionName}$2$3`,
      },
      {
        // Removes source conditional, but not the `source = {}` in hermes-engine.podspec
        replace: /source\s*\=\s*\{ [.\S\s]+?end/g,
        with: '',
      },
      {
        // Points spec source at correct directory
        replace: /(\.source\s*\=\s*)\S+\n/g,
        with: '$1{ :path => "." }\n',
      },

      // React-Core & ReactCommon
      {
        // Fixes header_subspecs for RCTBlobHeaders
        paths: 'React-Core.podspec',
        replace: /\{(RCTBlobManager),(RCTFileReaderModule)\}/g,
        with: `{${versionName}$1,${versionName}$2}`,
      },
      {
        // Prefixes conflicting AccessibilityResources
        paths: 'React-Core.podspec',
        replace: /"AccessibilityResources"/g,
        with: `"${versionName}AccessibilityResources"`,
      },
      {
        // DEFINES_MODULE for swift integration
        // Learn more: `packages/expo-modules-autolinking/scripts/ios/cocoapods/sandbox.rb`
        paths: 'ReactCommon.podspec',
        replace: /("USE_HEADERMAP" => "YES",)/g,
        with: '$1 "DEFINES_MODULE" => "YES",',
      },
      {
        // Fixes HEADER_SEARCH_PATHS
        paths: ['React-Core.podspec', 'ReactCommon.podspec'],
        replace:
          /(Headers\/Private\/|Headers\/Public\/|_BUILD_DIR\)\/)(React-Core|React-bridging|React-hermes|hermes-engine)/g,
        with: `$1${versionName}$2`,
      },

      // React-bridging
      {
        paths: 'React-bridging.podspec',
        replace: /\bheader_mappings_dir\s*=\s*"."/,
        with: 'header_mappings_dir    = "react/bridging"',
      },

      // React-cxxreact
      {
        // Fixes excluding SampleCxxModule.* files
        paths: 'React-cxxreact.podspec',
        replace: /\.exclude_files(\s*=\s*["'])(SampleCxxModule\.\*)(["'])/g,
        with: `.exclude_files$1${versionName}$2$3`,
      },

      // Yoga
      {
        // Unprefixes inner directory for source_files
        paths: 'Yoga.podspec',
        replace: /\{(Yoga),(YGEnums),(YGMacros),(YGNode),(YGStyle),(YGValue)\}/g,
        with: `{${versionName}$1,${versionName}$2,${versionName}$3,${versionName}$4,${versionName}$5,${versionName}$6}`,
      },

      // FBReactNativeSpec
      {
        // Remove codegen from build phase script
        paths: 'FBReactNativeSpec.podspec',
        replace: /\n  use_react_native_codegen!\((.|\n)+?\n  }\)\n/gm,
        with: '',
      },

      // hermes
      {
        paths: 'hermes-engine.podspec',
        replace: /\b(hermes\.xcframework)/g,
        with: `${versionName}$1`,
      },
      {
        paths: 'hermes-engine.podspec',
        replace:
          '  source[:http] = "https://github.com/facebook/react-native/releases/download/v#{version}/hermes-runtime-darwin-v#{version}.tar.gz"',
        with: `\
  if File.exists?(File.join(__dir__, "destroot"))
    source[:path] = '.'
  else
    source[:http] = 'https://github.com/expo/react-native/releases/download/sdk-${versionName
      .replace('ABI', '')
      .replace(/_/g, '.')}/${versionName}hermes.tar.gz'
  end`,
      },
    ],
  };
}
