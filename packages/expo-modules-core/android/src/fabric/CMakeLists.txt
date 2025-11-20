# Copyright 2018-present 650 Industries. All rights reserved.

set(common_fabric_dir ${COMMON_DIR}/fabric)
file(GLOB sources "*.cpp")
file(GLOB common_fabric_sources "${common_fabric_dir}/*.cpp")

add_library(
  fabric 
  STATIC
  ${common_fabric_sources}
  ${sources}
)

target_include_directories(
  fabric 
  PRIVATE
  "${common_fabric_dir}"
  "${REACT_NATIVE_INTERFACE_INCLUDE_DIRECTORIES}/react/fabric"
)

use_expo_common(fabric)
