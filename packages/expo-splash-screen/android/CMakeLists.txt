cmake_minimum_required(VERSION 3.16)
project(expo-splash-screen)
set(CMAKE_CXX_STANDARD 20)

find_package(fbjni REQUIRED CONFIG)
find_package(ReactAndroid REQUIRED CONFIG)

include("${REACT_NATIVE_DIR}/ReactAndroid/cmake-utils/folly-flags.cmake")
add_compile_options(${folly_FLAGS})
include("${REACT_NATIVE_DIR}/ReactCommon/cmake-utils/react-native-flags.cmake")

add_library(expo-splash-screen SHARED src/main/cpp/SplashScreenPrerender.cpp)
target_compile_reactnative_options(expo-splash-screen PRIVATE)
target_include_directories(expo-splash-screen PRIVATE
  "${REACT_NATIVE_DIR}/ReactCommon"
  "${REACT_NATIVE_DIR}/ReactCommon/yoga"
  "${REACT_NATIVE_DIR}/ReactCommon/react/renderer/graphics/platform/cxx"
)
target_link_libraries(expo-splash-screen
  ReactAndroid::reactnative
  ReactAndroid::jsi
  fbjni::fbjni
  android
  log
)
