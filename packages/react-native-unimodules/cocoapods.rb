require File.join(File.dirname(`node --print "require.resolve('expo/package.json')"`), "scripts/autolinking")
require 'colored2'

def use_unimodules!(custom_options = {})
  puts '⚠️ ' << 'react-native-unimodules'.green.bold << ' is deprecated in favor of '.yellow.bold << 'expo'.green.bold
  puts '⚠️ Follow this guide to migrate: '.yellow.bold << 'https://expo.fyi/expo-modules-migration'.blue.bold
  puts

  root_package_json = JSON.parse(File.read(find_project_package_json_path))
  json_options = root_package_json.fetch('react-native-unimodules', {}).fetch('ios', {}).transform_keys(&:to_sym)

  options = {
    modules_paths: ['../node_modules'],
    target: 'react-native',
    exclude: [],
    tests: [],
    flags: {}
  }.deep_merge(json_options).deep_merge(custom_options)

  use_expo_modules!(options)
end

def find_project_package_json_path
  stdout, _stderr, _status = Open3.capture3('node -e "const findUp = require(\'find-up\'); console.log(findUp.sync(\'package.json\'));"')
  stdout.strip!
end
