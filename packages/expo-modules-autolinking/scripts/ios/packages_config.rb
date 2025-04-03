require 'singleton'

module Expo
  # This class is used to store the configuration of the packages that are being used in the project.
  # It is a singleton class, so it can be accessed from anywhere in the project.
  class PackagesConfig
    include Singleton
    
    attr_accessor :coreFeatures
    
    def initialize
      @coreFeatures = []
    end
  end
end
