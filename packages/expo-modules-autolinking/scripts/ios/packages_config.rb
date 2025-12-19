require 'singleton'

module Expo
  # This class is used to store the configuration of the packages that are being used in the project.
  # It is a singleton class, so it can be accessed from anywhere in the project.
  class PackagesConfig
    include Singleton

    attr_accessor :coreFeatures
    attr_accessor :already_linked

    def initialize
      @coreFeatures = []
    end

    # Tries to link with prebuilt framework found in the `.xcframeworks` folder.
    # Returns false if no prebuilt framework is found for any of the packages.
    # Arguments:
    #  spec: Pod::Spec - The podspec of the package to link.
    #
    #  Examples:
    #  try_link_with_prebuilt_xcframework(spec) - Looks for the prebuilt framework in `.xcframeworks/debug/PackageName.xcframework`
    #
    def try_link_with_prebuilt_xcframework(spec)
      # TODO: Fix the debug/release builds selection
      # TODO: Add support for selecting wether symbol bundles should be included
      # TODO: Add support for configuring which packages that should be used as prebuilt frameworks, typically used when you patch
      # a specific package and want to build it from source (See how Android is doing this)
      should_use_prebuilt = ENV['EXPO_USE_PRECOMPILED_MODULES'] == '1'
      if (should_use_prebuilt)
        xcframework_path = ".xcframeworks/debug/#{spec.name}.xcframework"
        framework_exists = File.exist?("#{xcframework_path}")
        Pod::UI.info "#{"[Expo-precompiled]:".blue} 📦 #{spec.name.green} #{!framework_exists ? "(❌ Build from source: framework not found #{xcframework_path})" : ""}"
        if framework_exists
          spec.vendored_frameworks = xcframework_path
          return true
        end

      end
      return false
    end
  end
end
