require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name                = "ReactABI14_0_0"
  s.version             = "0.41.2"
  s.summary             = package['description']
  s.description         = <<-DESC
                            React Native apps are built using the React JS
                            framework, and render directly to native UIKit
                            elements using a fully asynchronous architecture.
                            There is no browser and no HTML. We have picked what
                            we think is the best set of features from these and
                            other technologies to build what we hope to become
                            the best product development framework available,
                            with an emphasis on iteration speed, developer
                            delight, continuity of technology, and absolutely
                            beautiful and fast products with no compromises in
                            quality or capability.
                         DESC
  s.homepage            = "http://facebook.github.io/react-native/"
  s.license             = package['license']
  s.author              = "Facebook"
  s.source              = { :path => "." }
  s.default_subspec     = 'Core'
  s.requires_arc        = true
  s.platform            = :ios, "8.0"
  s.pod_target_xcconfig = { "CLANG_CXX_LANGUAGE_STANDARD" => "c++14" }
  s.header_dir          = 'React'
  s.preserve_paths      = "cli.js", "Libraries/**/*.js", "lint", "linter.js", "node_modules", "package.json", "packager", "PATENTS", "react-native-cli"

  s.subspec 'Core' do |ss|
    ss.dependency      'ReactABI14_0_0/ABI14_0_0yoga'
    ss.dependency      'ReactABI14_0_0/cxxReactABI14_0_0'
    ss.source_files  = "React/**/*.{c,h,m,mm,S}"
    ss.exclude_files = "**/__tests__/*", "IntegrationTests/*", "React/**/ABI14_0_0RCTTVView.*", "ReactCommon/ABI14_0_0yoga/*"
    ss.frameworks    = "JavaScriptCore"
    ss.libraries     = "stdc++"
  end

    s.subspec 'Exponent' do |ss|
    ss.dependency         'ReactABI14_0_0/Core'
    ss.source_files     = "Exponent/**/*.{h,m}"
    end

  s.subspec 'tvOS' do |ss|
    ss.dependency       'ReactABI14_0_0/Core'
    ss.source_files   = "React/**/ABI14_0_0RCTTVView.{h, m}"
  end

  s.subspec 'ABI14_0_0jschelpers' do |ss|
    ss.source_files = 'ReactCommon/ABI14_0_0jschelpers/{ABI14_0_0JavaScriptCore,ABI14_0_0JSCWrapper}.{cpp,h}'
    ss.header_dir   = 'ABI14_0_0jschelpers'
  end

  s.subspec 'cxxReactABI14_0_0' do |ss|
    ss.dependency     'ReactABI14_0_0/ABI14_0_0jschelpers'
    ss.source_files = 'ReactCommon/cxxReactABI14_0_0/{ABI14_0_0JSBundleType,ABI14_0_0oss-compat-util}.{cpp,h}'
    ss.header_dir   = 'cxxReactABI14_0_0'
  end

  s.subspec 'ABI14_0_0yoga' do |ss|
    ss.source_files = 'ReactCommon/ABI14_0_0yoga/**/*.{c,h}'
    ss.header_dir   = 'ABI14_0_0yoga'
  end

  s.subspec 'ART' do |ss|
    ss.dependency       'ReactABI14_0_0/Core'
    ss.source_files   = "Libraries/ART/**/*.{h,m}"
    ss.preserve_paths = "Libraries/ART/**/*.js"
  end

  s.subspec 'RCTActionSheet' do |ss|
    ss.dependency       'ReactABI14_0_0/Core'
    ss.source_files   = "Libraries/ActionSheetIOS/*.{h,m}"
    ss.preserve_paths = "Libraries/ActionSheetIOS/*.js"
  end

  s.subspec 'RCTAdSupport' do |ss|
    ss.dependency       'ReactABI14_0_0/Core'
    ss.source_files   = "Libraries/AdSupport/*.{h,m}"
    ss.preserve_paths = "Libraries/AdSupport/*.js"
  end

  s.subspec 'RCTAnimation' do |ss|
    ss.dependency       'ReactABI14_0_0/Core'
    ss.source_files   = "Libraries/NativeAnimation/{Drivers/*,Nodes/*,*}.{h,m}"
  end

  s.subspec 'RCTCameraRoll' do |ss|
    ss.dependency       'ReactABI14_0_0/Core'
    ss.dependency       'ReactABI14_0_0/RCTImage'
    ss.source_files   = "Libraries/CameraRoll/*.{h,m}"
    ss.preserve_paths = "Libraries/CameraRoll/*.js"
  end

  s.subspec 'RCTGeolocation' do |ss|
    ss.dependency       'ReactABI14_0_0/Core'
    ss.source_files   = "Libraries/Geolocation/*.{h,m}"
    ss.preserve_paths = "Libraries/Geolocation/*.js"
  end

  s.subspec 'RCTImage' do |ss|
    ss.dependency       'ReactABI14_0_0/Core'
    ss.dependency       'ReactABI14_0_0/RCTNetwork'
    ss.source_files   = "Libraries/Image/*.{h,m}"
    ss.preserve_paths = "Libraries/Image/*.js"
  end

  s.subspec 'RCTNetwork' do |ss|
    ss.dependency       'ReactABI14_0_0/Core'
    ss.source_files   = "Libraries/Network/*.{h,m,mm}"
    ss.preserve_paths = "Libraries/Network/*.js"
  end

  s.subspec 'RCTPushNotification' do |ss|
    ss.dependency       'ReactABI14_0_0/Core'
    ss.source_files   = "Libraries/PushNotificationIOS/*.{h,m}"
    ss.preserve_paths = "Libraries/PushNotificationIOS/*.js"
  end

  s.subspec 'RCTSettings' do |ss|
    ss.dependency       'ReactABI14_0_0/Core'
    ss.source_files   = "Libraries/Settings/*.{h,m}"
    ss.preserve_paths = "Libraries/Settings/*.js"
  end

  s.subspec 'RCTText' do |ss|
    ss.dependency       'ReactABI14_0_0/Core'
    ss.source_files   = "Libraries/Text/*.{h,m}"
    ss.preserve_paths = "Libraries/Text/*.js"
  end

  s.subspec 'RCTVibration' do |ss|
    ss.dependency       'ReactABI14_0_0/Core'
    ss.source_files   = "Libraries/Vibration/*.{h,m}"
    ss.preserve_paths = "Libraries/Vibration/*.js"
  end

  s.subspec 'RCTWebSocket' do |ss|
    ss.dependency       'ReactABI14_0_0/Core'
    ss.source_files   = "Libraries/WebSocket/*.{h,m}"
    ss.preserve_paths = "Libraries/WebSocket/*.js"
  end

  s.subspec 'RCTLinkingIOS' do |ss|
    ss.dependency       'ReactABI14_0_0/Core'
    ss.source_files   = "Libraries/LinkingIOS/*.{h,m}"
  end

  s.subspec 'RCTTest' do |ss|
    ss.dependency       'ReactABI14_0_0/Core'
    ss.source_files   = "Libraries/RCTTest/**/*.{h,m}"
    ss.preserve_paths = "Libraries/RCTTest/**/*.js"
    ss.frameworks     = "XCTest"
  end
end
