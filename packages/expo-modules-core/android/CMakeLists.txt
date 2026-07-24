cmake_minimum_required(VERSION 3.16)
set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 20)

project(expo-modules-core)

include(${CMAKE_SOURCE_DIR}/cmake/variables.cmake)
include(${CMAKE_SOURCE_DIR}/cmake/common.cmake)

# defines expo-modules-jsi target
include(${CMAKE_SOURCE_DIR}/cmake/jsi.cmake)

# defines expo-modules-common
include(${CMAKE_SOURCE_DIR}/cmake/common_source.cmake)

# defines expo-modules-cpp-api target
include(${CMAKE_SOURCE_DIR}/cmake/cpp_api.cmake)

# defines expo-modules-core target
include(${CMAKE_SOURCE_DIR}/cmake/main.cmake)

# defines expo-modules-worklets target (worklets integration), only when react-native-worklets is installed
if (REACT_NATIVE_WORKLETS_DIR)
  include(${CMAKE_SOURCE_DIR}/cmake/worklets.cmake)
endif ()
