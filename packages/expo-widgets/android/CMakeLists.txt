cmake_minimum_required(VERSION 3.16)

project(expo-widgets)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(
  folly_FLAGS
  -DFOLLY_NO_CONFIG=1
  -DFOLLY_HAVE_CLOCK_GETTIME=1
  -DFOLLY_USE_LIBCPP=1
  -DFOLLY_CFG_NO_COROUTINES=1
  -DFOLLY_MOBILE=1
  -DFOLLY_HAVE_RECVMMSG=1
  -DFOLLY_HAVE_PTHREAD=1
  -DFOLLY_HAVE_XSI_STRERROR_R=1
)

find_package(ReactAndroid REQUIRED CONFIG)
find_package(fbjni REQUIRED CONFIG)
find_package(hermes-engine REQUIRED CONFIG)
find_library(LOG_LIB log)

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
)

target_link_libraries(
  expo-widgets
  ReactAndroid::jsi
  ReactAndroid::reactnative
  fbjni::fbjni
  hermes-engine::hermesvm
  ${LOG_LIB}
)
