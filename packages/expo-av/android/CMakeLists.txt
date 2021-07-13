cmake_minimum_required(VERSION 3.4.1)

# CMakeLists.txt forked from VisionCamera

set (CMAKE_VERBOSE_MAKEFILE ON)
set (CMAKE_CXX_STANDARD 14)

set (PACKAGE_NAME "EXAV")
set (BUILD_DIR ${CMAKE_SOURCE_DIR}/build)

# shared

add_library(
        ${PACKAGE_NAME}
        SHARED
        src/main/cpp/JMediaPlayerData.cpp
        src/main/cpp/JAVManager.cpp
)

file(GLOB libfbjni_link_DIRS "${BUILD_DIR}/fbjni*.aar/jni/${ANDROID_ABI}")
file(GLOB libfbjni_include_DIRS "${BUILD_DIR}/fbjni-*-headers.jar/")

# includes

target_include_directories(
        ${PACKAGE_NAME}
        PRIVATE
        "${NODE_MODULES_DIR}/react-native/React"
        "${NODE_MODULES_DIR}/react-native/React/Base"
        "${NODE_MODULES_DIR}/react-native/ReactAndroid/src/main/jni"
        "${NODE_MODULES_DIR}/react-native/ReactAndroid/src/main/java/com/facebook/react/turbomodule/core/jni"
        "${NODE_MODULES_DIR}/react-native/ReactCommon"
        "${NODE_MODULES_DIR}/react-native/ReactCommon/callinvoker"
        "${NODE_MODULES_DIR}/react-native/ReactCommon/jsi"
        ${libfbjni_include_DIRS}
)

# find libraries

find_library(LOG_LIB log)
find_library(FBJNI_LIBRARY fbjni PATHS ${libfbjni_link_DIRS} NO_CMAKE_FIND_ROOT_PATH)

# linking

target_link_libraries(
        ${PACKAGE_NAME}
        ${LOG_LIB}
        ${FBJNI_LIBRARY}
        android
)
