require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

# Following the example of react-native-firebase
# https://github.com/invertase/react-native-firebase/blob/bf5271ef46b534d3363206f816d114f9ac5c59ee/packages/app/RNFBApp.podspec#L5-L10

stripe_version = '~> 14.0.1'
using_custom_stripe_version = defined? $StripeVersion
if using_custom_stripe_version
  stripe_version = $StripeVersion
  Pod::UI.puts "expo-payments-stripe: Using user specified Stripe version '#{$stripe_version}'"
end


Pod::Spec.new do |s|
  s.name           = 'EXPaymentsStripe'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '10.0'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.source_files   = 'EXPaymentsStripe/**/*.{h,m,mm}'
  s.preserve_paths = 'EXPaymentsStripe/**/*.{h,m,mm}'
  s.requires_arc   = true

  s.dependency 'UMCore'
  s.dependency 'Stripe', stripe_version

end
