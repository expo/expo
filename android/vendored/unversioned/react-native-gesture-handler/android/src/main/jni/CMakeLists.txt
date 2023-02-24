project(GestureHandler)
cmake_minimum_required(VERSION 3.9.0)

set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 17)

set(REACT_ANDROID_DIR "${REACT_NATIVE_DIR}/ReactAndroid")

include(${REACT_ANDROID_DIR}/cmake-utils/folly-flags.cmake)
add_compile_options(${folly_FLAGS})

add_library(gesturehandler
  SHARED
  cpp-adapter.cpp
)

find_package(ReactAndroid REQUIRED CONFIG)

target_link_libraries(
  gesturehandler
  ReactAndroid::react_render_core
  ReactAndroid::react_render_uimanager
  ReactAndroid::jsi
  ReactAndroid::react_nativemodule_core
)
