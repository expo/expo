file(
  GLOB
  common_sources
  "${COMMON_DIR}/*.cpp"
  "${COMMON_DIR}/fabric/*.cpp"
)

add_library(
  expo-modules-common
  STATIC
  ${common_sources}
)

use_expo_common(expo-modules-common)

target_include_directories(
  expo-modules-common
  PUBLIC
  "${COMMON_DIR}"
  "${COMMON_DIR}/fabric"
)

target_link_libraries(
  expo-modules-common
  PUBLIC
  expo-modules-jsi
)
