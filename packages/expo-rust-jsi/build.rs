fn main() {
    cxx_build::bridge("src/bridge.rs")
        .file("cpp/jsi_shim.cpp")
        .flag_if_supported("-std=c++20")
        .include("cpp")
        // These paths are resolved at actual build time by CMake/CocoaPods
        // which provide the correct include paths for the target platform
        .compile("expo_rust_jsi_bridge");

    println!("cargo:rerun-if-changed=src/bridge.rs");
    println!("cargo:rerun-if-changed=cpp/jsi_shim.h");
    println!("cargo:rerun-if-changed=cpp/jsi_shim.cpp");
}
