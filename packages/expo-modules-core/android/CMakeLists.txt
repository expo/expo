cmake_minimum_required(VERSION 3.16)
set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 20)

project(expo-modules-core)

include(${CMAKE_SOURCE_DIR}/cmake/variables.cmake)
include(${CMAKE_SOURCE_DIR}/cmake/common.cmake)

# defines expo-modules-jsi target
include(${CMAKE_SOURCE_DIR}/cmake/jsi.cmake)

# defines expo-modules-core target
include(${CMAKE_SOURCE_DIR}/cmake/main.cmake)
