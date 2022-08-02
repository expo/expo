# Copyright 2018-present 650 Industries. All rights reserved.

include(Android-prebuilt.cmake)

add_library(fabric STATIC
  "../../ios/Fabric/ExpoViewComponentDescriptor.cpp"
  "../../ios/Fabric/ExpoViewEventEmitter.cpp"
  "../../ios/Fabric/ExpoViewProps.cpp"
  "../../ios/Fabric/ExpoViewShadowNode.cpp"
  "../../ios/Fabric/ExpoViewState.cpp"
)

target_include_directories(fabric PRIVATE
  "${REACT_NATIVE_DIR}/ReactCommon"
)

target_link_libraries(fabric
  folly_runtime
  glog
  jsi
  react_render_graphics
  rrc_view
  yoga
)
