project(GestureHandler)
cmake_minimum_required(VERSION 3.9.0)

set(CMAKE_VERBOSE_MAKEFILE ON)
if(${REACT_NATIVE_MINOR_VERSION} GREATER_EQUAL 73)
    set(CMAKE_CXX_STANDARD 20)
else()
    set(CMAKE_CXX_STANDARD 17)
endif()

set(PACKAGE_NAME "gesturehandler")
set(REACT_ANDROID_DIR "${REACT_NATIVE_DIR}/ReactAndroid")

include(${REACT_ANDROID_DIR}/cmake-utils/folly-flags.cmake)
add_compile_options(${folly_FLAGS})

add_library(${PACKAGE_NAME}
  SHARED
  cpp-adapter.cpp
)

target_include_directories(
  ${PACKAGE_NAME}
  PRIVATE
  "${REACT_NATIVE_DIR}/ReactCommon"
)

find_package(ReactAndroid REQUIRED CONFIG)

target_link_libraries(
  gesturehandler
  ReactAndroid::react_render_core
  ReactAndroid::react_render_uimanager
  ReactAndroid::react_render_graphics
  ReactAndroid::jsi
  ReactAndroid::react_nativemodule_core
)
