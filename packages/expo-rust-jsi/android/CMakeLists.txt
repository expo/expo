cmake_minimum_required(VERSION 3.13.0)
project(expo-rust-jsi)

set(CMAKE_CXX_STANDARD 20)

# --- Rust library ---
# The Rust static library is built by Gradle's cargo task before CMake runs.
# It produces libexpo_rust_jsi.a for the target architecture.
set(RUST_LIB_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../target/${ANDROID_ABI}")
set(RUST_LIB "${RUST_LIB_DIR}/libexpo_rust_jsi.a")

# Import the pre-built Rust static library
add_library(expo_rust_jsi_static STATIC IMPORTED)
set_target_properties(expo_rust_jsi_static PROPERTIES
    IMPORTED_LOCATION "${RUST_LIB}"
)

# --- C++ shim layer ---
set(CPP_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../cpp")
set(RUST_TARGET_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../target")

# Find the cxx-generated header directory.
# cargo build puts cxx bridge headers under target/<profile>/build/expo-rust-jsi-*/out/cxxbridge/
# We glob for it since the hash in the directory name varies.
file(GLOB CXX_BRIDGE_DIRS "${RUST_TARGET_DIR}/*/build/expo-rust-jsi-*/out/cxxbridge")
# Also check the target-specific build dirs
file(GLOB CXX_BRIDGE_DIRS_TARGET "${RUST_TARGET_DIR}/*/*/build/expo-rust-jsi-*/out/cxxbridge")
list(APPEND CXX_BRIDGE_DIRS ${CXX_BRIDGE_DIRS_TARGET})

# Pick the first match (there should be only one per build)
set(CXX_INCLUDE_DIR "")
set(CXX_CRATE_DIR "")
foreach(dir ${CXX_BRIDGE_DIRS})
    if(EXISTS "${dir}/include" AND EXISTS "${dir}/crate")
        set(CXX_INCLUDE_DIR "${dir}/include")
        set(CXX_CRATE_DIR "${dir}/crate")
        break()
    endif()
endforeach()

add_library(expo-rust-jsi SHARED
    "${CPP_DIR}/jsi_shim.cpp"
    "src/main/cpp/jni_entry.cpp"
)

target_include_directories(expo-rust-jsi PRIVATE
    "${CPP_DIR}"
    "${CXX_INCLUDE_DIR}"   # rust/cxx.h
    "${CXX_CRATE_DIR}"     # expo-rust-jsi/src/bridge.rs.h
)

# Find React Native packages
find_package(ReactAndroid REQUIRED CONFIG)
find_package(fbjni REQUIRED CONFIG)

target_link_libraries(expo-rust-jsi
    expo_rust_jsi_static
    fbjni::fbjni
    ReactAndroid::jsi
    ReactAndroid::reactnative
    android
    log
)

target_compile_options(expo-rust-jsi PRIVATE
    -Wall
    -Werror
    -fexceptions
)
