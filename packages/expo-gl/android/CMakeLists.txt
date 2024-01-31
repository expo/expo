cmake_minimum_required(VERSION 3.4.1)

project(expo-gl)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 20)

set(PACKAGE_NAME "expo-gl")
set(BUILD_DIR ${CMAKE_SOURCE_DIR}/build)
set(COMMON_DIR ${CMAKE_SOURCE_DIR}/../common)

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
    ${COMMON_DIR}/EXWebGLMethods.h
    ${COMMON_DIR}/EXWebGLRenderer.cpp
    ${COMMON_DIR}/EXWebGLRenderer.h
    ${COMMON_DIR}/EXTypedArrayApi.cpp
    ${COMMON_DIR}/EXTypedArrayApi.h
    ./src/main/cpp/EXGLJniApi.cpp)

target_include_directories(
    ${PACKAGE_NAME} PRIVATE "${COMMON_DIR}")

find_package(ReactAndroid REQUIRED CONFIG)

find_library(LOG_LIB log)
find_library(GLES_LIB GLESv3)

target_compile_options(
    ${PACKAGE_NAME}
    PRIVATE -O2
            -fexceptions
            -frtti
            -Wall
            -Wextra
            -Wno-unused-parameter
            -Wshorten-64-to-32
            -Wstrict-prototypes)
target_link_libraries(${PACKAGE_NAME} ReactAndroid::jsi ${LOG_LIB} ${GLES_LIB} android)
