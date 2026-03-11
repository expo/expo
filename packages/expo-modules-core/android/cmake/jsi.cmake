file(GLOB common_sources_jsi "${COMMON_DIR}/JSI/*.cpp")
file(GLOB android_sources_jsi "${ANDROID_SRC_DIR}/jsi/*.cpp")

add_library(
  expo-modules-jsi
  STATIC
  ${common_sources_jsi}
  ${android_sources_jsi}
)

use_expo_common(expo-modules-jsi)

target_include_directories(
  expo-modules-jsi
  PUBLIC
  "${COMMON_DIR}/JSI"
  "${ANDROID_SRC_DIR}/jsi"
)
