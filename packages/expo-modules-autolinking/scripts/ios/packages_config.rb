require 'singleton'
require_relative './cocoapods/precompiled_modules'

module Expo
  # This class is used to store the configuration of the packages that are being used in the project.
  # It is a singleton class, so it can be accessed from anywhere in the project.
  class PackagesConfig
    include Singleton

    attr_accessor :coreFeatures

    def initialize
      @coreFeatures = []
    end

    # Tries to link with prebuilt framework found in the `.xcframeworks` folder.
    # Delegates to PrecompiledModules for the actual implementation.
    #
    # @param spec [Pod::Spec] The podspec of the package to link.
    # @return [Boolean] true if a prebuilt framework was linked, false otherwise
    #
    # @see Expo::PrecompiledModules.try_link_with_prebuilt_xcframework
    #
    def try_link_with_prebuilt_xcframework(spec)
      Expo::PrecompiledModules.try_link_with_prebuilt_xcframework(spec)
    end

  end
end
