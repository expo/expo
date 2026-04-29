# expo-brownfield: ObjC symbol mangling shim.
#
# Replaces the third-party `cocoapods-mangle` gem. Invoked from a Podfile's
# `post_install` block when `multipleFrameworks: true` is set on the
# expo-brownfield plugin config. The Ruby side is intentionally minimal — it
# gathers the install context, short-circuits when nothing has changed, and
# otherwise spawns the bundled Node worker that does the heavy lifting
# (xcodebuild + nm + xcconfig generation/patching).

require 'json'
require 'digest'
require 'fileutils'
require 'shellwords'

module ExpoBrownfield
  module Mangle
    NAME = 'expo-brownfield-mangle'.freeze
    VERSION = '1'.freeze
    MANGLED_SPECS_CHECKSUM_KEY = 'MANGLED_SPECS_CHECKSUM'.freeze

    # Public entry point.
    #
    # @param [Pod::Installer] installer
    #        The installer passed into the Podfile's `post_install do |installer|` block.
    # @param [Hash] options
    # @option options [Array<String>] :targets
    #         Names of user targets whose dependency graph should be mangled.
    #         When empty/nil all umbrella targets are included.
    # @option options [String] :mangle_prefix
    #         Prefix to prepend to mangled symbols. Defaults to `<ProjectName>_`.
    # @option options [String] :xcconfig_path
    #         Override path for the generated mangling xcconfig. Defaults to
    #         `<sandbox>/Target Support Files/expo-brownfield-mangle.xcconfig`.
    def self.run!(installer, options = {})
      Pod::UI.titled_section 'Updating expo-brownfield mangling' do
        targets = filter_umbrella_targets(installer, options[:targets])
        if targets.empty?
          Pod::UI.message '- No matching targets to mangle, skipping'
          next
        end

        prefix = options[:mangle_prefix] || default_mangle_prefix(installer, targets)
        xcconfig_path = options[:xcconfig_path] || default_xcconfig_path(installer)
        checksum = specs_checksum(targets)

        if up_to_date?(xcconfig_path, checksum)
          Pod::UI.message '- Mangling config already up to date'
          next
        end

        context = {
          podsProjectPath: installer.pods_project.path.to_s,
          podTargetLabels: targets.flat_map { |t| t.pod_targets.map(&:label) }.uniq,
          podXcconfigPaths: pod_xcconfig_paths(installer),
          manglePrefix: prefix,
          xcconfigPath: xcconfig_path,
          specsChecksum: checksum,
        }

        run_worker!(context)
      end
    end

    # @api private
    def self.filter_umbrella_targets(installer, target_names)
      all = installer.aggregate_targets
      return all if target_names.nil? || target_names.empty?
      all.select do |agg|
        names = agg.user_targets.map(&:name)
        (target_names & names).any?
      end
    end

    # @api private
    def self.default_mangle_prefix(installer, targets)
      project_path = targets.first.user_project.path
      project_name = File.basename(project_path, '.xcodeproj')
      "#{project_name.tr(' ', '_')}_"
    rescue StandardError
      'ExpoBrownfield_'
    end

    # @api private
    def self.default_xcconfig_path(installer)
      File.join(installer.sandbox.target_support_files_root, "#{NAME}.xcconfig")
    end

    # @api private
    def self.pod_xcconfig_paths(installer)
      paths = []
      installer.pods_project.targets.each do |target|
        target.build_configurations.each do |config|
          ref = config.base_configuration_reference
          next if ref.nil?
          paths << ref.real_path.to_s
        end
      end
      paths.uniq
    end

    # @api private
    def self.specs_checksum(targets)
      specs = targets.flat_map { |t| t.pod_targets.flat_map(&:specs) }.uniq
      specs_summary = specs.map(&:checksum).join(',')
      Digest::SHA1.hexdigest("#{NAME}=#{VERSION},#{specs_summary}")
    end

    # @api private
    def self.up_to_date?(xcconfig_path, expected_checksum)
      return false unless File.exist?(xcconfig_path)
      contents = File.read(xcconfig_path)
      match = contents.match(/^#{MANGLED_SPECS_CHECKSUM_KEY}\s*=\s*(\S+)/)
      match && match[1] == expected_checksum
    end

    # @api private
    def self.run_worker!(context)
      worker_args = locate_worker
      json = context.to_json

      command = [*worker_args, 'mangle', '--context-json', json]
      Pod::UI.message '- Running expo-brownfield mangle worker'
      ok = system(*command)
      raise "expo-brownfield mangle worker failed (exit=#{$?.exitstatus})" unless ok
    end

    # Locate the brownfield CLI entry point. Prefer `node <pkg>/bin/cli.js`
    # over `npx` to avoid surprise upgrades and to work reliably in offline
    # CI environments.
    #
    # @api private
    def self.locate_worker
      package_json_path = `node --print "require.resolve('expo-brownfield/package.json')" 2>/dev/null`.strip
      raise 'expo-brownfield package not found in node_modules. Install it with `npx expo install expo-brownfield`.' if package_json_path.empty?
      cli = File.join(File.dirname(package_json_path), 'bin', 'cli.js')
      raise "expo-brownfield CLI not found at #{cli}" unless File.exist?(cli)
      ['node', cli]
    end
  end
end
