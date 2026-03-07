require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

rust_targets = {
  'arm64' => 'aarch64-apple-ios',
  'x86_64' => 'x86_64-apple-ios',
  'arm64-sim' => 'aarch64-apple-ios-sim',
}

Pod::Spec.new do |s|
  s.name           = 'expo-rust-jsi'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage'] || 'https://github.com/nicolo-ribaudo/expo'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = [
    'ios/**/*.{swift,h,m,mm}',
    'cpp/**/*.{h,cpp}',
  ]

  # cxx-generated headers are under target/<target>/release/build/expo-rust-jsi-*/out/cxxbridge/
  # We add a wildcard search path so the compiler can find rust/cxx.h and the bridge header.
  s.pod_target_xcconfig = {
    'HEADER_SEARCH_PATHS' => [
      '"${PODS_ROOT}/Headers/Public/React-jsi"',
      '"${PODS_TARGET_SRCROOT}/target/*/release/build/expo-rust-jsi-*/out/cxxbridge/include"',
      '"${PODS_TARGET_SRCROOT}/target/*/release/build/expo-rust-jsi-*/out/cxxbridge/crate"',
    ].join(' '),
    'OTHER_LDFLAGS' => '-lresolv',
    'SWIFT_OBJC_BRIDGING_HEADER' => '${PODS_TARGET_SRCROOT}/ios/ExpoRustJsi-Bridging-Header.h',
  }

  # Build Rust library as part of the pod install
  s.script_phase = {
    name: 'Build Rust Library',
    script: <<~SCRIPT,
      set -e
      cd "${PODS_TARGET_SRCROOT}"

      # Determine target based on platform
      if [ "${PLATFORM_NAME}" = "iphonesimulator" ]; then
        if [ "${ARCHS}" = "arm64" ]; then
          RUST_TARGET="aarch64-apple-ios-sim"
        else
          RUST_TARGET="x86_64-apple-ios"
        fi
      else
        RUST_TARGET="aarch64-apple-ios"
      fi

      # Build Rust library
      cargo build --release --target "${RUST_TARGET}" --lib

      # Copy to expected location
      mkdir -p "${BUILT_PRODUCTS_DIR}"
      cp "target/${RUST_TARGET}/release/libexpo_rust_jsi.a" "${BUILT_PRODUCTS_DIR}/"
    SCRIPT
    execution_position: :before_compile,
  }

  s.vendored_libraries = 'target/*/release/libexpo_rust_jsi.a'
end
