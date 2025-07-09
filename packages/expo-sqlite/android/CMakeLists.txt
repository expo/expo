cmake_minimum_required(VERSION 3.4.1)

project(expo-sqlite)

set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 20)
set(PACKAGE_NAME "expo-sqlite")
set(BUILD_DIR ${CMAKE_SOURCE_DIR}/build)

set(SRC_DIR "${CMAKE_SOURCE_DIR}/src/main/cpp")

separate_arguments(SQLITE_BUILDFLAGS)
add_compile_options(
  ${SQLITE_BUILDFLAGS}
)

if(${USE_LIBSQL})
  file(GLOB SOURCES "${SRC_DIR}/libsql/*.cpp")
  add_library(
    ${PACKAGE_NAME}
    SHARED
    ${SOURCES}
  )
  target_include_directories(
    ${PACKAGE_NAME}
    PRIVATE
    "${CMAKE_SOURCE_DIR}/libsql"
  )
  find_library(
    LIBSQL_LIB
    sql_experimental
    PATHS "${CMAKE_SOURCE_DIR}/libsql/${ANDROID_ABI}"
    NO_CMAKE_FIND_ROOT_PATH
  )
else()
  file(GLOB SOURCES "${SRC_DIR}/*.cpp")
  add_library(
    ${PACKAGE_NAME}
    SHARED
    ${SOURCES}
    "${SQLITE3_SRC_DIR}/sqlite3.c"
  )
  target_include_directories(
    ${PACKAGE_NAME}
    PRIVATE
    ${SRC_DIR}
    "${SQLITE3_SRC_DIR}"
  )
  set(LIBSQL_LIB "")
endif()

find_library(LOG_LIB log)
find_package(fbjni REQUIRED CONFIG)
if(${USE_SQLCIPHER})
  find_package(openssl REQUIRED CONFIG)
  set(OPENSSL_CRYPTO_LIB "openssl::crypto")
else()
  set(OPENSSL_CRYPTO_LIB "")
endif()

target_link_libraries(
  ${PACKAGE_NAME}
  ${LOG_LIB}
  ${OPENSSL_CRYPTO_LIB}
  ${LIBSQL_LIB}
  fbjni::fbjni
  android
)
