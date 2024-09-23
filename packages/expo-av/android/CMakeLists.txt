cmake_minimum_required(VERSION 3.4.1)

project(expo-av)

set (CMAKE_VERBOSE_MAKEFILE ON)
set (CMAKE_CXX_STANDARD 20)

set (PACKAGE_NAME "expo-av")
set (BUILD_DIR ${CMAKE_SOURCE_DIR}/build)

# shared

add_library(
        ${PACKAGE_NAME}
        SHARED
        src/main/cpp/EXAV.cpp
        src/main/cpp/JPlayerData.cpp
        src/main/cpp/JAVManager.cpp
)

# includes

target_include_directories(
        ${PACKAGE_NAME}
        PRIVATE
        # header only imports from turbomodule, e.g. CallInvokerHolder.h
        "${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni/react/turbomodule"
        "${REACT_NATIVE_DIR}/ReactCommon/callinvoker"
)

# find libraries

find_library(LOG_LIB log)

find_package(ReactAndroid REQUIRED CONFIG)

find_package(fbjni REQUIRED CONFIG)

# linking

target_link_libraries(
        ${PACKAGE_NAME}
        ${LOG_LIB}
        fbjni::fbjni
        ReactAndroid::jsi
        android
)
if (ReactAndroid_VERSION_MINOR GREATER_EQUAL 76)
  target_link_libraries(
          ${PACKAGE_NAME}
          ReactAndroid::reactnative
  )
else()
  target_link_libraries(
          ${PACKAGE_NAME}
          ReactAndroid::reactnativejni
  )
endif()
