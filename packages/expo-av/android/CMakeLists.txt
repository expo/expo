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
)

# includes

target_include_directories(
        ${PACKAGE_NAME}
        PRIVATE
        "${NODE_MODULES_DIR}/react-native/ReactCommon"
        "${NODE_MODULES_DIR}/react-native/ReactCommon/callinvoker"
        "${NODE_MODULES_DIR}/react-native/ReactCommon/jsi"
)

# find libraries

find_package(fbjni REQUIRED CONFIG) # installed through gradle 4.x.x prefabs
find_library(LOG_LIB log)

# linking

target_link_libraries(
        ${PACKAGE_NAME}
        ${LOG_LIB}
        fbjni::fbjni
        android
)
