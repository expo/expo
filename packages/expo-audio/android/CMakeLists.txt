cmake_minimum_required(VERSION 3.4.1)

project(expo-audio)

set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 20)
set(PACKAGE_NAME "expo-audio")
set(BUILD_DIR ${CMAKE_SOURCE_DIR}/build)

set(SRC_DIR "${CMAKE_SOURCE_DIR}/src/main/cpp")
file(GLOB SOURCES "${SRC_DIR}/*.cpp")

add_library(
    ${PACKAGE_NAME}
    SHARED
    ${SOURCES}
)

target_include_directories(
    ${PACKAGE_NAME}
    PRIVATE
    ${SRC_DIR}
)

find_package(fbjni REQUIRED CONFIG)

target_link_libraries(
  ${PACKAGE_NAME}
  ${LOG_LIB}
  fbjni::fbjni
  android
)
