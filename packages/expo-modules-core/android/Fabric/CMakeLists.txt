# Copyright 2018-present 650 Industries. All rights reserved.

include(Android-prebuilt.cmake)

file(GLOB SOURCES "*.cpp")

add_library(fabric STATIC
  ${SOURCES}
  "../../common/cpp/fabric/ExpoViewComponentDescriptor.cpp"
  "../../common/cpp/fabric/ExpoViewProps.cpp"
  "../../common/cpp/fabric/ExpoViewShadowNode.cpp"
)

target_compile_options(fabric PRIVATE
  "-std=c++17"
)

target_include_directories(fabric PRIVATE
  "${REACT_NATIVE_DIR}/ReactCommon"
  "../../common/cpp/fabric"
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
