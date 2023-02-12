cmake_minimum_required(VERSION 3.4.1)

project(expo-modules-core)

set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 17)
set(PACKAGE_NAME "expo-modules-core")
set(BUILD_DIR ${CMAKE_SOURCE_DIR}/build)
set(ignoreMe "${PROJECT_BUILD_DIR} ${REACT_ANDROID_BUILD_DIR} ${REACT_ANDROID_DIR} ${HERMES_HEADER_DIR} ${BOOST_VERSION}")

string(APPEND CMAKE_CXX_FLAGS " -DREACT_NATIVE_TARGET_VERSION=${REACT_NATIVE_TARGET_VERSION}")

if (${NATIVE_DEBUG})
    set(CMAKE_C_FLAGS_DEBUG "${CMAKE_C_FLAGS_DEBUG} -g")
    set(CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG} -g")
endif ()

set(SRC_DIR ${CMAKE_SOURCE_DIR}/src)
set(COMMON_DIR ${CMAKE_SOURCE_DIR}/../common/cpp)
file(GLOB sources_android "${SRC_DIR}/main/cpp/*.cpp")
file(GLOB sources_android_types "${SRC_DIR}/main/cpp/types/*.cpp")
file(GLOB sources_android_javaclasses "${SRC_DIR}/main/cpp/javaclasses/*.cpp")
file(GLOB common_sources "${COMMON_DIR}/*.cpp")

# shared

macro(createVarAsBoolToInt name value)
  if(${value})
    set(${name} "1")
  else()
    set(${name} "0")
  endif()
endmacro()

add_library(CommonSettings INTERFACE)

add_library(
        ${PACKAGE_NAME}
        SHARED
        ${common_sources}
        ${sources_android}
        ${sources_android_types}
        ${sources_android_javaclasses}
)

if(IS_NEW_ARCHITECTURE_ENABLED)
  add_subdirectory("${SRC_DIR}/fabric")
  set(NEW_ARCHITECTURE_DEPENDENCIES "fabric")
  set(NEW_ARCHITECTURE_COMPILE_OPTIONS -DIS_NEW_ARCHITECTURE_ENABLED=1 -DRN_FABRIC_ENABLED=1)
else()
  set(NEW_ARCHITECTURE_DEPENDENCIES "")
  set(NEW_ARCHITECTURE_COMPILE_OPTIONS "")
endif()

createVarAsBoolToInt("USE_HERMES_INT" ${USE_HERMES})
createVarAsBoolToInt("UNIT_TEST_INT" ${UNIT_TEST})

target_compile_options(CommonSettings INTERFACE
  -O2
  -frtti
  -fexceptions
  -Wall
  -fstack-protector-all
  -DUSE_HERMES=${USE_HERMES_INT}
  -DUNIT_TEST=${UNIT_TEST_INT}
  ${NEW_ARCHITECTURE_COMPILE_OPTIONS}
)

# Extracted AAR: ${BUILD_DIR}/react-native-0*/jni/${ANDROID_ABI}
file(GLOB LIBRN_DIR "${REACT_NATIVE_SO_DIR}/${ANDROID_ABI}")
if (NOT LIBRN_DIR)
    # If /${ANDROID_ABI} dir not found, then ${REACT_NATIVE_SO_DIR} is probably:
    # ReactAndroid/build/react-ndk/exported
    file(GLOB LIBRN_DIR "${REACT_NATIVE_SO_DIR}")
endif ()

# tests

if(${UNIT_TEST})
  if(${USE_HERMES})
    set(JSEXECUTOR_LIB ReactAndroid::hermes_executor)
  else()
    set(JSEXECUTOR_LIB ReactAndroid::jscexecutor)
  endif()
else()
  set(JSEXECUTOR_LIB "")
endif()

# find libraries

find_library(LOG_LIB log)

find_package(ReactAndroid REQUIRED CONFIG)

find_package(fbjni REQUIRED CONFIG)

# includes

get_target_property(INCLUDE_reactnativejni
        ReactAndroid::reactnativejni
        INTERFACE_INCLUDE_DIRECTORIES)
target_include_directories(
        ${PACKAGE_NAME}
        PRIVATE
        ${INCLUDE_reactnativejni}/react

        # header only imports from turbomodule, e.g. CallInvokerHolder.h
        "${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni/react/turbomodule"
        "${COMMON_DIR}"
        "${SRC_DIR}/fabric"
)

# linking

include("${REACT_NATIVE_DIR}/ReactAndroid/cmake-utils/folly-flags.cmake")

target_compile_options(
        ${PACKAGE_NAME}
        PRIVATE
        ${folly_FLAGS}
)

target_link_libraries(
        ${PACKAGE_NAME}
        CommonSettings
        ${LOG_LIB}
        fbjni::fbjni
        ReactAndroid::jsi
        ReactAndroid::reactnativejni
        ReactAndroid::folly_runtime
        ReactAndroid::react_nativemodule_core
        android
        ${JSEXECUTOR_LIB}
        ${NEW_ARCHITECTURE_DEPENDENCIES}
)
