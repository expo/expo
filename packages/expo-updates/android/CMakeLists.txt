cmake_minimum_required(VERSION 3.4.1)

project(expo-updates)

set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 20)
set(PACKAGE_NAME "expo-updates")
set(BUILD_DIR ${CMAKE_SOURCE_DIR}/build)

set(SRC_DIR "${CMAKE_SOURCE_DIR}/src/main/cpp")
set(BSDIFF_SRC_DIR "${CMAKE_SOURCE_DIR}/../vendor/bsdiff")

file(GLOB SOURCES "${SRC_DIR}/*.cpp")
file(GLOB BSDIFF_SOURCES "${BSDIFF_SRC_DIR}/*.c")
add_library(
  ${PACKAGE_NAME}
  SHARED
  ${SOURCES}
  ${BSDIFF_SOURCES}
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
  fbjni::fbjni
  android
)
