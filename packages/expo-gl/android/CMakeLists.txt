cmake_minimum_required(VERSION 3.4.1)

project(expo-gl)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 20)

set(PACKAGE_NAME "expo-gl")
set(BUILD_DIR ${CMAKE_SOURCE_DIR}/build)
set(COMMON_DIR ${CMAKE_SOURCE_DIR}/../common)

include("${EXPO_MODULES_CORE_CMAKE_DIR}/pch-ccache.cmake" OPTIONAL RESULT_VARIABLE PCH_CCACHE)

find_package(ReactAndroid REQUIRED CONFIG)

find_library(LOG_LIB log)
find_library(GLES_LIB GLESv3)

add_library(${PACKAGE_NAME}-common INTERFACE)
target_include_directories(${PACKAGE_NAME}-common INTERFACE "${COMMON_DIR}")
target_compile_options(
    ${PACKAGE_NAME}-common
    INTERFACE -O2
              -fexceptions
              -frtti
              -Wall
              -Wextra
              -Wno-unused-parameter
              -Wshorten-64-to-32
              -Wstrict-prototypes
              # Stop clang from writing a timestamp into the .pch, so that ccache can reuse it.
              "$<$<COMPILE_LANGUAGE:CXX>:-Xclang;-fno-pch-timestamp>")
target_link_libraries(${PACKAGE_NAME}-common INTERFACE ReactAndroid::jsi)

# Builds the PCH that expo-gl reuses. Nothing links this library.
add_library(${PACKAGE_NAME}-pch STATIC EXCLUDE_FROM_ALL ./src/main/cpp/EXGLPchOwner.cpp)
target_link_libraries(${PACKAGE_NAME}-pch PRIVATE ${PACKAGE_NAME}-common)

if (PCH_CCACHE)
  target_precompile_headers(${PACKAGE_NAME}-pch PRIVATE "<pch.h>")
else ()
  target_precompile_headers(${PACKAGE_NAME}-pch PRIVATE "${COMMON_DIR}/pch.h")
endif ()

add_library(
    ${PACKAGE_NAME} SHARED
    ${COMMON_DIR}/EXGLNativeApi.cpp
    ${COMMON_DIR}/EXGLNativeApi.h
    ${COMMON_DIR}/EXGLImageUtils.cpp
    ${COMMON_DIR}/EXGLImageUtils.h
    ${COMMON_DIR}/EXGLNativeContext.cpp
    ${COMMON_DIR}/EXGLNativeContext.h
    ${COMMON_DIR}/EXGLContextManager.cpp
    ${COMMON_DIR}/EXGLContextManager.h
    ${COMMON_DIR}/EXWebGLMethods.cpp
    ${COMMON_DIR}/EXWebGLMethodsTextures.cpp
    ${COMMON_DIR}/EXWebGLMethodsDraw.cpp
    ${COMMON_DIR}/EXWebGLMethods.h
    ${COMMON_DIR}/EXWebGLRenderer.cpp
    ${COMMON_DIR}/EXWebGLRenderer.h
    ${COMMON_DIR}/EXTypedArrayApi.cpp
    ${COMMON_DIR}/EXTypedArrayApi.h
    ./src/main/cpp/EXGLJniApi.cpp)

target_link_libraries(${PACKAGE_NAME} ${PACKAGE_NAME}-common ${LOG_LIB} ${GLES_LIB} android)
target_precompile_headers(${PACKAGE_NAME} REUSE_FROM ${PACKAGE_NAME}-pch)

if (PCH_CCACHE)
  pch_ccache_owner(${PACKAGE_NAME}-pch)
  pch_ccache_consumer(${PACKAGE_NAME} ${PACKAGE_NAME}-pch)
endif ()
