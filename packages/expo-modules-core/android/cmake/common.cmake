add_library(EXPO_COMMON INTERFACE)

target_precompile_headers(
  EXPO_COMMON
  INTERFACE
  ${CMAKE_SOURCE_DIR}/src/main/cpp/ExpoHeader.pch
)

target_compile_options(
  EXPO_COMMON
  INTERFACE
  --std=c++20
  ${OPTIMIZATION_FLAGS}
  -frtti
  -fexceptions
  -Wall
  -fstack-protector-all
  -DUSE_HERMES=${USE_HERMES_INT}
  -DUNIT_TEST=${UNIT_TEST_INT}
  -DIS_NEW_ARCHITECTURE_ENABLED=1
  -DRN_FABRIC_ENABLED=1
  -DRN_SERIALIZABLE_STATE=1
  ${folly_FLAGS}
  ${ADDITIONAL_CXX_FLAGS}
)

# Drop the timestamp embedded in the .pch so it stays bit-for-bit stable across
# rebuilds. Without this, the PCH timestamp changes every build and ccache can't reuse it.
target_compile_options(
  EXPO_COMMON
  INTERFACE
  "$<$<COMPILE_LANGUAGE:CXX>:-Xclang;-fno-pch-timestamp>"
)

target_link_libraries(
  EXPO_COMMON
  INTERFACE
  ReactAndroid::jsi
  fbjni::fbjni
  ReactAndroid::reactnative
)

function(use_expo_common target_name)
  target_link_libraries(${target_name} PRIVATE EXPO_COMMON)
endfunction()
