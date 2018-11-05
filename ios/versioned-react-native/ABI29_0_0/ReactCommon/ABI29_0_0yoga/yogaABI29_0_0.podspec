package = JSON.parse(File.read(File.expand_path('../../package.json', __dir__)))
version = package['version']

Pod::Spec.new do |spec|
  spec.name = 'yogaABI29_0_0'
  spec.version = "#{version}.React"
  spec.license =  { :type => 'MIT' }
  spec.homepage = 'https://facebook.github.io/ABI29_0_0yoga/'
  spec.documentation_url = 'https://facebook.github.io/ABI29_0_0yoga/docs/api/c/'

  spec.summary = 'Yoga is a cross-platform layout engine which implements Flexbox.'
  spec.description = 'Yoga is a cross-platform layout engine enabling maximum collaboration within your team by implementing an API many designers are familiar with, and opening it up to developers across different platforms.'

  spec.authors = 'Facebook'
  spec.source = { :path => "." }

  spec.module_name = spec.header_dir = 'ABI29_0_0yoga'
  spec.requires_arc = false
  spec.compiler_flags = [
      '-fno-omit-frame-pointer',
      '-fexceptions',
      '-Wall',
      '-Werror',
      '-std=c++1y',
      '-fPIC'
  ]

  # Pinning to the same version as React.podspec.
  spec.platforms = { :ios => "8.0", :tvos => "9.2" }

  # Set this environment variable when not using the `:path` option to install the pod.
  # E.g. when publishing this spec to a spec repo.
  source_files = 'yoga/**/*.{cpp,h}'
  source_files = File.join('ReactCommon/ABI29_0_0yoga', source_files) if ENV['INSTALL_YOGA_WITHOUT_PATH_OPTION']
  spec.source_files = source_files
end
