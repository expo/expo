cmake_minimum_required(VERSION 3.4.1)

project(expo-sqlite)

set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 17)
set(PACKAGE_NAME "expo-sqlite")
set(BUILD_DIR ${CMAKE_SOURCE_DIR}/build)

set(SRC_DIR "${CMAKE_SOURCE_DIR}/src/main/cpp")
file(GLOB SOURCES "${SRC_DIR}/*.cpp")

add_library(
  ${PACKAGE_NAME}
  SHARED
  ${SOURCES}
  "${CMAKE_SOURCE_DIR}/../vendor/sqlite3.c"
)

target_include_directories(
  ${PACKAGE_NAME}
  PRIVATE
  ${SRC_DIR}
  "${CMAKE_SOURCE_DIR}/../vendor"
)

find_library(LOG_LIB log)
find_package(fbjni REQUIRED CONFIG)

target_link_libraries(
  ${PACKAGE_NAME}
  ${LOG_LIB}
  fbjni::fbjni
  android
)
