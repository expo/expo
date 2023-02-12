export const PodfileBasic = `
require_relative '../node_modules/react-native/scripts/react_native_pods'
require_relative '../node_modules/react-native-unimodules/cocoapods.rb'
require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'

platform :ios, '11.0'

target 'myapp' do
  use_unimodules!
  config = use_native_modules!

  use_react_native!(:path => config["reactNativePath"])

  # Uncomment the code below to enable Flipper.
  #
  # You should not install Flipper in CI environments when creating release
  # builds, this will lead to significantly slower build times.
  #
  # Note that if you have use_frameworks! enabled, Flipper will not work.
  #
  #  use_flipper!
  #  post_install do |installer|
  #    flipper_post_install(installer)
  #  end
end
`;
