cmake_minimum_required(VERSION 3.16)

project(expo-widgets)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include("${REACT_NATIVE_DIR}/ReactAndroid/cmake-utils/folly-flags.cmake")

find_package(ReactAndroid REQUIRED CONFIG)
find_package(fbjni REQUIRED CONFIG)
find_package(hermes-engine REQUIRED CONFIG)

add_library(
  expo-widgets
  SHARED
  src/main/cpp/WidgetsHermesRuntime.cpp
)

target_compile_options(
  expo-widgets
  PRIVATE
  ${folly_FLAGS}
  -frtti
  -fexceptions
  --std=c++20
  -O2
  -Wall
  -fstack-protector-all
)

target_link_libraries(
  expo-widgets
  ReactAndroid::jsi
  ReactAndroid::reactnative
  fbjni::fbjni
  hermes-engine::hermesvm
)
