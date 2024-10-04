# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Default versions of Flipper and related dependencies.
# Update this map to bump the dependencies.
$flipper_default_versions = {
    'Flipper' => '0.125.0',
    'Flipper-Boost-iOSX' => '1.76.0.1.11',
    'Flipper-DoubleConversion' => '3.2.0.1',
    'Flipper-Fmt' => '7.1.7',
    'Flipper-Folly' => '2.6.10',
    'Flipper-Glog' => '0.5.0.5',
    'Flipper-PeerTalk' => '0.0.4',
    'Flipper-RSocket' => '1.4.3',
    'OpenSSL-Universal' => '1.1.1100',
}

# This function installs the `React-Core/DevSupport` subpods
# when the dependencies are installed for a non production app.
#
# @parameter production: a boolean that indicates whether we are in production or not.
# @parameter pathToReactNative: the path to the React Native installation
def install_flipper_dependencies(pathToReactNative)
    pod 'ABI48_0_0React-Core/DevSupport', :path => "#{pathToReactNative}/", :project_name => 'ABI48_0_0'
end


# This function installs all the dependencies required by flipper.
#
# @parameter versions: a dictionary to specify a version of a dependencies. Default versions will be used if not specified
# @parameter configurations: an array of configurations to install the flipper dependencies. Defaults to ['Debug'].
def use_flipper_pods(versions = {}, configurations: ['Debug'])
    versions['Flipper'] ||= $flipper_default_versions['Flipper']
    versions['Flipper-Boost-iOSX'] ||= $flipper_default_versions['Flipper-Boost-iOSX']
    versions['Flipper-DoubleConversion'] ||= $flipper_default_versions['Flipper-DoubleConversion']
    versions['Flipper-Fmt'] ||= $flipper_default_versions['Flipper-Fmt']
    versions['Flipper-Folly'] ||= $flipper_default_versions['Flipper-Folly']
    versions['Flipper-Glog'] ||= $flipper_default_versions['Flipper-Glog']
    versions['Flipper-PeerTalk'] ||= $flipper_default_versions['Flipper-PeerTalk']
    versions['Flipper-RSocket'] ||= $flipper_default_versions['Flipper-RSocket']
    versions['OpenSSL-Universal'] ||= $flipper_default_versions['OpenSSL-Universal']
    pod 'ABI48_0_0FlipperKit', versions['Flipper'], :configurations => configurations
    pod 'ABI48_0_0FlipperKit/FlipperKitLayoutPlugin', versions['Flipper'], :configurations => configurations
    pod 'ABI48_0_0FlipperKit/SKIOSNetworkPlugin', versions['Flipper'], :configurations => configurations
    pod 'ABI48_0_0FlipperKit/FlipperKitUserDefaultsPlugin', versions['Flipper'], :configurations => configurations
    pod 'ABI48_0_0FlipperKit/FlipperKitReactPlugin', versions['Flipper'], :configurations => configurations
    # List all transitive dependencies for FlipperKit pods
    # to avoid them being linked in Release builds
    pod 'ABI48_0_0Flipper', versions['Flipper'], :configurations => configurations
    pod 'ABI48_0_0Flipper-Boost-iOSX', versions['Flipper-Boost-iOSX'], :configurations => configurations
    pod 'ABI48_0_0Flipper-DoubleConversion', versions['Flipper-DoubleConversion'], :configurations => configurations
    pod 'ABI48_0_0Flipper-Fmt', versions['Flipper-Fmt'], :configurations => configurations
    pod 'ABI48_0_0Flipper-Folly', versions['Flipper-Folly'], :configurations => configurations
    pod 'ABI48_0_0Flipper-Glog', versions['Flipper-Glog'], :configurations => configurations
    pod 'ABI48_0_0Flipper-PeerTalk', versions['Flipper-PeerTalk'], :configurations => configurations
    pod 'ABI48_0_0Flipper-RSocket', versions['Flipper-RSocket'], :configurations => configurations
    pod 'ABI48_0_0FlipperKit/Core', versions['Flipper'], :configurations => configurations
    pod 'ABI48_0_0FlipperKit/CppBridge', versions['Flipper'], :configurations => configurations
    pod 'ABI48_0_0FlipperKit/FBCxxFollyDynamicConvert', versions['Flipper'], :configurations => configurations
    pod 'ABI48_0_0FlipperKit/FBDefines', versions['Flipper'], :configurations => configurations
    pod 'ABI48_0_0FlipperKit/FKPortForwarding', versions['Flipper'], :configurations => configurations
    pod 'ABI48_0_0FlipperKit/FlipperKitHighlightOverlay', versions['Flipper'], :configurations => configurations
    pod 'ABI48_0_0FlipperKit/FlipperKitLayoutTextSearchable', versions['Flipper'], :configurations => configurations
    pod 'ABI48_0_0FlipperKit/FlipperKitNetworkPlugin', versions['Flipper'], :configurations => configurations
    pod 'ABI48_0_0OpenSSL-Universal', versions['OpenSSL-Universal'], :configurations => configurations
end

# Applies some changes to some pods of the project:
# * it sets the Swift version for Yoga kit to 4.1
# * it sets the sonar-kit flag to React-Core pod
#
# @parameter installer: the installer object used to install the pods.
def flipper_post_install(installer)
    installer.pods_project.targets.each do |target|
        if target.name == 'YogaKit'
            target.build_configurations.each do |config|
                config.build_settings['SWIFT_VERSION'] = '4.1'
            end
        end

        # Enable flipper for React-Core Debug configuration
        if target.name == 'React-Core'
            target.build_configurations.each do |config|
                if config.debug?
                    config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = ['$(inherited)', 'FB_SONARKIT_ENABLED=1']
                end
            end
        end
    end
end

class FlipperConfiguration
    attr_reader :flipper_enabled
    attr_reader :configurations
    attr_reader :versions

    def initialize(flipper_enabled, configurations, versions)
        @flipper_enabled = flipper_enabled
        @configurations = configurations
        @versions = versions
    end

    def self.enabled(configurations = ["Debug"], versions = {})
        FlipperConfiguration.new(true, configurations, versions)
    end

    def self.disabled
        FlipperConfiguration.new(false, [], {})
    end

    def == (other)
        return @flipper_enabled == other.flipper_enabled &&
            @configurations == other.configurations &&
            @versions == other.versions
    end
end
