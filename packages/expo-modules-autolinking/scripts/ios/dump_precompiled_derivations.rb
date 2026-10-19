#!/usr/bin/env ruby
# Dumps the precompiled-modules derivations without running `pod install`.
# Usage: ruby dump_precompiled_derivations.rb <app-ios-dir> <output.json>
# Equivalent to EXPO_PRECOMPILED_DUMP=<output> pod install in <app-ios-dir>.

require 'json'

# Minimal stubs for the CocoaPods surface the scan code touches.
module Pod
  module UI
    def self.puts(*args); end

    def self.info(*args); end

    def self.warn(*args)
      Kernel.warn(*args)
    end
  end
end

class String
  %w[blue yellow green red cyan magenta].each do |color|
    define_method(color) { self } unless method_defined?(color)
  end
end

require_relative 'precompiled_modules'

app_ios_dir, output_path = ARGV
unless app_ios_dir && output_path && File.directory?(app_ios_dir)
  abort "Usage: ruby #{File.basename(__FILE__)} <app-ios-dir> <output.json>"
end

output_path = File.expand_path(output_path)
Dir.chdir(app_ios_dir) do
  Expo::PrecompiledModules.dump_derivations(output_path)
end
puts "Wrote derivations dump to #{output_path}"
