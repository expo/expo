cmake_minimum_required(VERSION 3.4.1)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 17)

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

# Extracted AAR: ${BUILD_DIR}/react-native-0*/jni/${ANDROID_ABI}
file(GLOB LIBRN_DIR "${RN_SO_DIR}/${ANDROID_ABI}")
if(NOT LIBRN_DIR)
    # If /${ANDROID_ABI} dir not found, then ${RN_SO_DIR} is probably:
    # ReactAndroid/build/react-ndk/exported
    file(GLOB LIBRN_DIR "${RN_SO_DIR}")
endif()

target_include_directories(
    ${PACKAGE_NAME} PRIVATE "${REACT_NATIVE_DIR}/ReactCommon/jsi"
                            "${COMMON_DIR}")

find_library(
    JSI_LIB jsi
    PATHS ${LIBRN_DIR}
    NO_CMAKE_FIND_ROOT_PATH)

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
target_link_libraries(${PACKAGE_NAME} ${JSI_LIB} ${LOG_LIB} ${GLES_LIB} android)
