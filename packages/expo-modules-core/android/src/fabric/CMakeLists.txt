# Copyright 2018-present 650 Industries. All rights reserved.

set(COMMON_FABRIC_DIR ${COMMON_DIR}/fabric)
file(GLOB SOURCES "*.cpp")
file(GLOB COMMON_FABRIC_SOURCES "${COMMON_FABRIC_DIR}/*.cpp")

add_library(fabric STATIC
  ${COMMON_FABRIC_SOURCES}
  ${SOURCES}
)

target_precompile_headers(fabric PRIVATE ${SRC_DIR}/main/cpp/ExpoHeader.pch)

include("${REACT_NATIVE_DIR}/ReactAndroid/cmake-utils/folly-flags.cmake")

target_compile_options(fabric PRIVATE
  "-std=c++20"
  ${folly_FLAGS}
)

find_package(ReactAndroid REQUIRED CONFIG)

find_package(fbjni REQUIRED CONFIG)

get_target_property(INCLUDE_fabricjni
  ReactAndroid::reactnative
  INTERFACE_INCLUDE_DIRECTORIES
)

target_include_directories(fabric PRIVATE
  "${REACT_NATIVE_DIR}/ReactCommon"
  "${COMMON_FABRIC_DIR}"
  "${INCLUDE_fabricjni}/react/fabric"
)

target_link_libraries(fabric
  CommonSettings
  fbjni::fbjni
  ReactAndroid::jsi
)

target_link_libraries(fabric ReactAndroid::reactnative)
