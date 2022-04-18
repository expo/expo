Pod::Spec.new do |s|
  s.name         = "Nimble"
  s.version      = "9.2.1"
  s.summary      = "A Matcher Framework for Swift and Objective-C"
  s.description  = <<-DESC
                   Use Nimble to express the expected outcomes of Swift or Objective-C expressions. Inspired by Cedar.
                   DESC
  s.homepage     = "https://github.com/Quick/Nimble"
  s.license      = { :type => "Apache 2.0", :file => "LICENSE" }
  s.author       = "Quick Contributors"
  s.ios.deployment_target = "9.0"
  s.osx.deployment_target = "10.10"
  s.tvos.deployment_target = "9.0"
  s.source       = { :git => "https://github.com/Quick/Nimble.git",
                     :tag => "v#{s.version}" }

  s.source_files = [
    "Sources/**/*.{swift,h,m,c}",
    "Carthage/Checkouts/CwlCatchException/Sources/**/*.{swift,h,m,c}",
    "Carthage/Checkouts/CwlPreconditionTesting/Sources/**/*.{swift,h,m,c}",
  ]

  s.osx.exclude_files = [
    "Carthage/Checkouts/CwlPreconditionTesting/Sources/CwlPosixPreconditionTesting/CwlCatchBadInstructionPosix.swift",
  ]
  s.ios.exclude_files = [
    "Carthage/Checkouts/CwlPreconditionTesting/Sources/CwlPosixPreconditionTesting/CwlCatchBadInstructionPosix.swift",
  ]
  s.tvos.exclude_files = [
    "Carthage/Checkouts/CwlPreconditionTesting/Sources/CwlMachBadInstructionHandler/include/CwlMachBadInstructionHandler.h",
    "Carthage/Checkouts/CwlPreconditionTesting/Sources/CwlPreconditionTesting/CwlCatchBadInstruction.swift",
    "Carthage/Checkouts/CwlPreconditionTesting/Sources/CwlPreconditionTesting/CwlBadInstructionException.swift",
    "Carthage/Checkouts/CwlPreconditionTesting/Sources/CwlPreconditionTesting/CwlDarwinDefinitions.swift",
    "Carthage/Checkouts/CwlCatchException/Sources/CwlCatchException/CwlCatchException.swift",
    "Carthage/Checkouts/CwlCatchException/Sources/CwlCatchExceptionSupport/CwlCatchException.m",
    "Carthage/Checkouts/CwlCatchException/Sources/CwlCatchExceptionSupport/include/CwlCatchException.h",
  ]

  s.exclude_files = "Sources/Nimble/Adapters/NonObjectiveC/*.swift"
  s.header_dir = "Nimble"
  s.weak_framework = "XCTest"
  s.requires_arc = true
  s.compiler_flags = '-DPRODUCT_NAME=Nimble/Nimble'
  s.pod_target_xcconfig = {
    'APPLICATION_EXTENSION_API_ONLY' => 'YES',
    'DEFINES_MODULE' => 'YES',
    'ENABLE_BITCODE' => 'NO',
    'ENABLE_TESTING_SEARCH_PATHS' => 'YES',
    'OTHER_LDFLAGS' => '$(inherited) -weak-lXCTestSwiftSupport -Xlinker -no_application_extension',
    'OTHER_SWIFT_FLAGS' => '$(inherited) -suppress-warnings',
  }

  s.cocoapods_version = '>= 1.4.0'
  if s.respond_to?(:swift_versions) then
    s.swift_versions = ['5.0']
  else
    s.swift_version = '5.0'
  end
end
