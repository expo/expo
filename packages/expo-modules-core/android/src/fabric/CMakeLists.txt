# Copyright 2018-present 650 Industries. All rights reserved.

include(Android-prebuilt.cmake)

set(COMMON_FABRIC_DIR ${COMMON_DIR}/fabric)
file(GLOB SOURCES "*.cpp")
file(GLOB COMMON_FABRIC_SOURCES "${COMMON_FABRIC_DIR}/*.cpp")

add_library(fabric STATIC
  ${COMMON_FABRIC_SOURCES}
  ${SOURCES}
)

target_compile_options(fabric PRIVATE
  "-std=c++17"
)

target_include_directories(fabric PRIVATE
  "${REACT_NATIVE_DIR}/ReactCommon"
  "${COMMON_FABRIC_DIR}"
)

target_link_libraries(fabric
  CommonSettings
  fabricjni
  fbjni
  folly_runtime
  glog
  jsi
  react_debug
  react_render_componentregistry
  react_render_core
  react_render_debug
  react_render_graphics
  react_render_mapbuffer
  rrc_view
  runtimeexecutor
  yoga
)
