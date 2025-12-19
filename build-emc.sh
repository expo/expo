# et analyze-deps packages/expo-modules-core/ios \
#   -S packages/expo-modules-core/common \
#   --output-spm-config packages/expo-modules-core/spm.config.json \
#   --external-deps ReactNativeDependencies,React,Hermes \
#   --exclude Tests \
#   --virtual-targets-scc \
#   --product "ExpoModulesJSI:JSI" \
#   --product "ExpoModulesCore:*" \
#   --merge-swift \
#   --merge-objc

et prebuild-packages \
  --hermes-version 0.14.0 \
  --build-flavor Debug \
  --react-native-tarball-path "/Users/chrfalch/repos/expo/expo/node_modules/react-native/.build/output/xcframeworks/Debug/React.xcframework.tar.gz" \
  --clean-generated  \
  --clean-build \
  expo-modules-core