# Copyright 2018-present 650 Industries. All rights reserved.

set(COMMON_FABRIC_DIR ${COMMON_DIR}/fabric)
file(GLOB SOURCES "*.cpp")
file(GLOB COMMON_FABRIC_SOURCES "${COMMON_FABRIC_DIR}/*.cpp")

add_library(fabric STATIC
  ${COMMON_FABRIC_SOURCES}
  ${SOURCES}
)

include("${REACT_NATIVE_DIR}/ReactAndroid/cmake-utils/folly-flags.cmake")

target_compile_options(fabric PRIVATE
  "-std=c++20"
  ${folly_FLAGS}
)

find_package(ReactAndroid REQUIRED CONFIG)

find_package(fbjni REQUIRED CONFIG)

if (ReactAndroid_VERSION_MINOR GREATER_EQUAL 76)
  get_target_property(INCLUDE_fabricjni
        ReactAndroid::reactnative
        INTERFACE_INCLUDE_DIRECTORIES)
else()
  get_target_property(INCLUDE_fabricjni
        ReactAndroid::fabricjni
        INTERFACE_INCLUDE_DIRECTORIES)
endif()

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

if (ReactAndroid_VERSION_MINOR GREATER_EQUAL 76)
   target_link_libraries(fabric ReactAndroid::reactnative)
else()
  target_link_libraries(fabric
    ReactAndroid::fabricjni
    ReactAndroid::folly_runtime
    ReactAndroid::glog
    ReactAndroid::react_debug
    ReactAndroid::react_render_componentregistry
    ReactAndroid::react_render_core
    ReactAndroid::react_render_debug
    ReactAndroid::react_render_graphics
    ReactAndroid::react_render_mapbuffer
    ReactAndroid::react_utils
    ReactAndroid::rrc_view
    ReactAndroid::runtimeexecutor
    ReactAndroid::yoga
  )
endif()
