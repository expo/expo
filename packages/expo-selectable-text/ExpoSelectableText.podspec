require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoSelectableText'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: 'https://github.com/expo/expo.git' }

  s.source_files = 'ios/**/*.{h,mm}', 'common/cpp/**/*.{h,cpp}'
  s.pod_target_xcconfig = {
    'HEADER_SEARCH_PATHS' => '"$(PODS_TARGET_SRCROOT)/common/cpp"',
  }

  install_modules_dependencies(s)

  if ENV['USE_FRAMEWORKS'] != nil
    add_dependency(s, 'React-FabricComponents', :additional_framework_paths => [
      'react/renderer/textlayoutmanager/platform/ios',
      'react/renderer/components/text/platform/cxx',
    ])
  end
end
