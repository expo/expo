cmake_minimum_required(VERSION 3.13)

project(expo-splash-screen)

set(CMAKE_CXX_STANDARD 20)
set(PACKAGE_NAME "expo-splash-screen")

find_package(fbjni REQUIRED CONFIG)
find_package(ReactAndroid REQUIRED CONFIG)

# The renderer headers must see the same configuration as `libreactnative.so` (for example
# `RN_SERIALIZABLE_STATE`, which changes the layout of `Props`).
include("${REACT_NATIVE_DIR}/ReactAndroid/cmake-utils/folly-flags.cmake")
include("${REACT_NATIVE_DIR}/ReactCommon/cmake-utils/react-native-flags.cmake")

add_library(${PACKAGE_NAME} SHARED src/main/cpp/SplashScreenPrerender.cpp)

target_compile_reactnative_options(${PACKAGE_NAME} PRIVATE)
target_compile_options(${PACKAGE_NAME} PRIVATE ${folly_FLAGS})

target_link_libraries(
  ${PACKAGE_NAME}
  ReactAndroid::reactnative
  ReactAndroid::jsi
  fbjni::fbjni
  android
  log
)
