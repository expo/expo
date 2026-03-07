use std::env;
use std::path::PathBuf;

fn main() {
    let mut build = cxx_build::bridge("src/bridge.rs");
    build
        .file("cpp/jsi_shim.cpp")
        .flag_if_supported("-std=c++20")
        .include("cpp");

    // When building outside of React Native (tests, CI), use standalone stubs.
    // The real JSI headers are provided by CMake/CocoaPods at actual build time.
    let jsi_include = env::var("JSI_INCLUDE_PATH").ok().map(PathBuf::from);
    if let Some(ref path) = jsi_include {
        build.include(path);
    } else {
        build.define("EXPO_RUST_JSI_STANDALONE", None);
    }

    build.compile("expo_rust_jsi_bridge");

    println!("cargo:rerun-if-changed=src/bridge.rs");
    println!("cargo:rerun-if-changed=cpp/jsi_shim.h");
    println!("cargo:rerun-if-changed=cpp/jsi_shim.cpp");
    println!("cargo:rerun-if-changed=cpp/jsi_types.h");
}
