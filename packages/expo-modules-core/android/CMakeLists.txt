cmake_minimum_required(VERSION 3.4.1)

set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_ANDROID_STL_TYPE c++_shared)
set(CMAKE_CXX_STANDARD 17)
set(PACKAGE_NAME "expo-modules-core")
set(BUILD_DIR ${CMAKE_SOURCE_DIR}/build)

if (${NATIVE_DEBUG})
    set(CMAKE_C_FLAGS_DEBUG "${CMAKE_C_FLAGS_DEBUG} -g")
    set(CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG} -g")
endif ()

set(SRC_DIR ${CMAKE_SOURCE_DIR}/src)
file(GLOB sources_android "${SRC_DIR}/main/cpp/*.cpp")

# shared

add_library(
        ${PACKAGE_NAME}
        SHARED
        ${sources_android}
)

# Extracted AAR: ${BUILD_DIR}/react-native-0*/jni/${ANDROID_ABI}
file(GLOB LIBRN_DIR "${REACT_NATIVE_SO_DIR}/${ANDROID_ABI}")
if (NOT LIBRN_DIR)
    # If /${ANDROID_ABI} dir not found, then ${REACT_NATIVE_SO_DIR} is probably:
    # ReactAndroid/build/react-ndk/exported
    file(GLOB LIBRN_DIR "${REACT_NATIVE_SO_DIR}")
endif ()

file(GLOB libfbjni_include_DIRS "${BUILD_DIR}/fbjni-*-headers.jar/")
file(GLOB HERMES_SO_DIR "${BUILD_DIR}/third-party-ndk/hermes/jni/${ANDROID_ABI}")

# includes

target_include_directories(
        ${PACKAGE_NAME}
        PRIVATE
        "${REACT_NATIVE_DIR}/React"
        "${REACT_NATIVE_DIR}/React/Base"
        "${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni"
        "${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni/react"
        "${REACT_NATIVE_DIR}/ReactAndroid/src/main/java/com/facebook/react/turbomodule/core/jni"
        "${REACT_NATIVE_DIR}/ReactCommon"
        "${REACT_NATIVE_DIR}/ReactCommon/react/nativemodule/core"
        "${REACT_NATIVE_DIR}/ReactCommon/callinvoker"
        "${REACT_NATIVE_DIR}/ReactCommon/jsi"
        "${HERMES_HEADER_DIR}"
        "${BUILD_DIR}/third-party-ndk/boost/boost_${BOOST_VERSION}"
        "${BUILD_DIR}/third-party-ndk/double-conversion"
        "${BUILD_DIR}/third-party-ndk/folly"
        ${libfbjni_include_DIRS}
)

# find libraries

find_library(LOG_LIB log)

if(${REACT_NATIVE_TARGET_VERSION} LESS 69)
    find_library(
        FOLLY_LIB
        folly_json
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
    )
else()
    find_library(
        FOLLY_LIB
        folly_runtime
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
    )
endif()

find_library(
        FBJNI_LIB
        fbjni
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)

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

find_library(
        REACT_NATIVE_MODULES_CORE
        react_nativemodule_core
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)

find_library(
        HERMES_LIB
        hermes
        PATHS ${HERMES_SO_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)

find_library(
        JSEXECUTOR_LIB
        jscexecutor
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)

#reactnativejni

# linking

target_compile_options(
        ${PACKAGE_NAME}
        PRIVATE -DFOLLY_NO_CONFIG=1
        -DFOLLY_HAVE_CLOCK_GETTIME=1
        -DFOLLY_HAVE_MEMRCHR=1
        -DFOLLY_USE_LIBCPP=1
        -DFOLLY_MOBILE=1
        -DFOR_HERMES=${FOR_HERMES}
        -O2
        -frtti
        -fexceptions
        -Wall
        -fstack-protector-all
)

if (${FOR_HERMES})
    target_link_libraries(
            ${PACKAGE_NAME}
            ${LOG_LIB}
            ${FBJNI_LIB}
            ${JSI_LIB}
            ${HERMES_LIB}
            ${REACT_NATIVE_JNI_LIB}
            ${FOLLY_LIB}
            ${REACT_NATIVE_MODULES_CORE}
            android
    )
else ()
    target_link_libraries(
            ${PACKAGE_NAME}
            ${LOG_LIB}
            ${FBJNI_LIB}
            ${JSI_LIB}
            ${JSEXECUTOR_LIB}
            ${REACT_NATIVE_JNI_LIB}
            ${FOLLY_LIB}
            ${REACT_NATIVE_MODULES_CORE}
            android
    )
endif ()

