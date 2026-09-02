add_library(EXPO_COMMON INTERFACE)


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

add_library(
  expo-modules-pch
  STATIC
  EXCLUDE_FROM_ALL
  ${CMAKE_SOURCE_DIR}/src/main/cpp/pch/ExpoHeaderPchOwner.cpp
)

use_expo_common(expo-modules-pch)

# The PCH includes `react/jni/*` headers.
target_include_directories(
  expo-modules-pch
  PRIVATE
  "${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni"
)

target_precompile_headers(
  expo-modules-pch
  PRIVATE
  ${CMAKE_SOURCE_DIR}/src/main/cpp/ExpoHeader.pch
)

# Drop the timestamp embedded in the .pch so it stays bit-for-bit stable across
# rebuilds. Without this, the PCH timestamp changes every build and ccache can't reuse it.
target_compile_options(
  expo-modules-pch
  PRIVATE
  "$<$<COMPILE_LANGUAGE:CXX>:-Xclang;-fno-pch-timestamp>"
)
