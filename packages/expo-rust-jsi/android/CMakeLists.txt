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

add_library(expo-rust-jsi SHARED
    "${CPP_DIR}/jsi_shim.cpp"
    "src/main/cpp/jni_entry.cpp"
)

target_include_directories(expo-rust-jsi PRIVATE
    "${CPP_DIR}"
    "${CMAKE_CURRENT_SOURCE_DIR}/../src"  # For cxx-generated headers
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
