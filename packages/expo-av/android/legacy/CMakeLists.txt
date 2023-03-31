# Remove this legacy folder when we drop SDK 47
cmake_minimum_required(VERSION 3.4.1)

project(expo-av)

set (CMAKE_VERBOSE_MAKEFILE ON)
set (CMAKE_CXX_STANDARD 14)

set (PACKAGE_NAME "expo-av")
set (BUILD_DIR ${CMAKE_SOURCE_DIR}/../build)
set (SRC_DIR ${CMAKE_SOURCE_DIR}/../src)

# shared

add_library(
        ${PACKAGE_NAME}
        SHARED
        ${SRC_DIR}/main/cpp/EXAV.cpp
        ${SRC_DIR}/main/cpp/JPlayerData.cpp
        ${SRC_DIR}/main/cpp/JAVManager.cpp
)

# Extracted AAR: ${BUILD_DIR}/react-native-0*/jni/${ANDROID_ABI}
file(GLOB LIBRN_DIR "${RN_SO_DIR}/${ANDROID_ABI}")
if (NOT LIBRN_DIR)
    # If /${ANDROID_ABI} dir not found, then ${RN_SO_DIR} is probably:
    # ReactAndroid/build/react-ndk/exported
    file(GLOB LIBRN_DIR "${RN_SO_DIR}")
endif()

# includes

target_include_directories(
        ${PACKAGE_NAME}
        PRIVATE
        "${REACT_NATIVE_DIR}/React"
        "${REACT_NATIVE_DIR}/React/Base"
        "${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni"
        "${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni/react/turbomodule"
        "${REACT_NATIVE_DIR}/ReactAndroid/src/main/java/com/facebook/react/turbomodule/core/jni"
        "${REACT_NATIVE_DIR}/ReactCommon"
        "${REACT_NATIVE_DIR}/ReactCommon/callinvoker"
        "${REACT_NATIVE_DIR}/ReactCommon/jsi"
)

# find libraries

find_library(LOG_LIB log)

find_package(fbjni REQUIRED CONFIG)

find_library(
        JSI_LIB
        jsi
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)

find_library(
        REACT_NATIVE_JNI_LIB
        reactnativejni
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)


# linking

target_link_libraries(
        ${PACKAGE_NAME}
        ${LOG_LIB}
        fbjni::fbjni
        ${JSI_LIB}
        ${REACT_NATIVE_JNI_LIB}
        android
)
