cmake_minimum_required(VERSION 3.4.1)

project(expo-updates)

set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 20)
set(PACKAGE_NAME "expo-updates")
set(BUILD_DIR ${CMAKE_SOURCE_DIR}/build)

set(SRC_DIR "${CMAKE_SOURCE_DIR}/src/main/cpp")
set(BSDIFF_SRC_DIR "${CMAKE_SOURCE_DIR}/../vendor/bspatch")
set(BZIP2_SRC_DIR "${SRC_DIR}/third-party/bzip2")

file(GLOB SOURCES "${SRC_DIR}/*.cpp")
file(GLOB BSDIFF_SOURCES "${BSDIFF_SRC_DIR}/*.c")
file(GLOB BZIP2_SOURCES "${BZIP2_SRC_DIR}/*.c")

add_library(
  ${PACKAGE_NAME}
  SHARED
  ${SOURCES}
  ${BSDIFF_SOURCES}
)

add_library(
  bzip2
  STATIC
  ${BZIP2_SOURCES}
)

target_include_directories(
  bzip2
  PUBLIC
  "${BZIP2_SRC_DIR}"
)

target_include_directories(
  ${PACKAGE_NAME}
  PRIVATE
  ${SRC_DIR}
  "${BSDIFF_SRC_DIR}"
)

find_library(LOG_LIB log)
find_package(fbjni REQUIRED CONFIG)

target_link_libraries(
  ${PACKAGE_NAME}
  ${LOG_LIB}
  bzip2
  fbjni::fbjni
  android
)
