cmake_minimum_required(VERSION 3.4.1)

set (CMAKE_VERBOSE_MAKEFILE ON)
set (CMAKE_CXX_STANDARD 14)

set (PACKAGE_NAME "expo-av")
set (BUILD_DIR ${CMAKE_SOURCE_DIR}/build)

# shared

add_library(
        ${PACKAGE_NAME}
        SHARED
        src/main/cpp/EXAV.cpp
        src/main/cpp/JPlayerData.cpp
        src/main/cpp/JAVManager.cpp
        "${REACT_NATIVE_DIR}/ReactCommon/jsi/jsi/jsi.cpp"
)

file(GLOB LIBRN_DIR "${BUILD_DIR}/react-native-0*/jni/${ANDROID_ABI}")
file(GLOB libfbjni_link_DIRS "${BUILD_DIR}/fbjni*.aar/jni/${ANDROID_ABI}")
file(GLOB libfbjni_include_DIRS "${BUILD_DIR}/fbjni-*-headers.jar/")

# includes

target_include_directories(
        ${PACKAGE_NAME}
        PRIVATE
        "${REACT_NATIVE_DIR}/React"
        "${REACT_NATIVE_DIR}/React/Base"
        "${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni"
        "${REACT_NATIVE_DIR}/ReactAndroid/src/main/java/com/facebook/react/turbomodule/core/jni"
        "${REACT_NATIVE_DIR}/ReactCommon"
        "${REACT_NATIVE_DIR}/ReactCommon/callinvoker"
        "${REACT_NATIVE_DIR}/ReactCommon/jsi"
        ${libfbjni_include_DIRS}
)

# find libraries

find_library(LOG_LIB log)
find_library(FBJNI_LIBRARY fbjni PATHS ${libfbjni_link_DIRS} NO_CMAKE_FIND_ROOT_PATH)

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
        ${FBJNI_LIBRARY}
        ${REACT_NATIVE_JNI_LIB}
        android
)
