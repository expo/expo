cmake_minimum_required(VERSION 3.16)

project(expo-widgets)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(ReactAndroid REQUIRED CONFIG)
find_package(hermes-engine REQUIRED CONFIG)
find_library(LOG_LIB log)

add_library(
  expo-widgets
  SHARED
  src/main/cpp/WidgetsHermesRuntime.cpp
)

target_link_libraries(
  expo-widgets
  ReactAndroid::jsi
  hermes-engine::hermesvm
  ${LOG_LIB}
)
