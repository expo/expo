project(GestureHandler)
cmake_minimum_required(VERSION 3.9.0)

set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_FLAGS "-DFOLLY_NO_CONFIG=1 -DFOLLY_HAVE_CLOCK_GETTIME=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_MOBILE=1 -DFOLLY_HAVE_RECVMMSG=1 -DFOLLY_HAVE_PTHREAD=1")

add_library(gesturehandler
  SHARED
  cpp-adapter.cpp
)

set(REACT_ANDROID_DIR "${REACT_NATIVE_DIR}/ReactAndroid")
set(REACT_COMMON_DIR "${REACT_NATIVE_DIR}/ReactCommon")
set(REACT_NDK_EXPORT_DIR "${APP_BUILD_DIR}/react-ndk/exported")

# copied from react-native/ReactAndroid/cmake-utils/Android-prebuilt.cmake

## jsi
add_library(jsi SHARED IMPORTED GLOBAL)
set_target_properties(jsi
        PROPERTIES
        IMPORTED_LOCATION
        ${REACT_NDK_EXPORT_DIR}/${ANDROID_ABI}/libjsi.so)
target_include_directories(jsi INTERFACE ${REACT_COMMON_DIR}/jsi)

## react_render_core
add_library(react_render_core SHARED IMPORTED GLOBAL)
set_target_properties(react_render_core
        PROPERTIES
        IMPORTED_LOCATION
        ${REACT_NDK_EXPORT_DIR}/${ANDROID_ABI}/libreact_render_core.so)
target_include_directories(react_render_core
        INTERFACE
        ${REACT_COMMON_DIR}
        ${REACT_COMMON_DIR}/react/renderer/core)

## react_render_uimanager
add_library(react_render_uimanager SHARED IMPORTED GLOBAL)
set_target_properties(react_render_uimanager
        PROPERTIES
        IMPORTED_LOCATION
        ${REACT_NDK_EXPORT_DIR}/${ANDROID_ABI}/libreact_render_uimanager.so)
target_include_directories(react_render_uimanager INTERFACE ${REACT_COMMON_DIR}/react/renderer/uimanager)

target_include_directories(
  gesturehandler
  PRIVATE
  "${REACT_ANDROID_DIR}/build/third-party-ndk/boost/boost_1_76_0"
  "${REACT_ANDROID_DIR}/build/third-party-ndk/double-conversion"
  "${REACT_ANDROID_DIR}/build/third-party-ndk/folly"
)

target_link_libraries(
  gesturehandler
  jsi
  react_render_uimanager
  react_render_core
)
