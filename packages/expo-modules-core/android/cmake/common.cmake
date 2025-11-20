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
  ${folly_FLAGS}
  ${ADDITIONAL_CXX_FLAGS}
  ${NEW_ARCHITECTURE_COMPILE_OPTIONS}
)

target_link_libraries(
  EXPO_COMMON 
  INTERFACE
  ReactAndroid::jsi
  fbjni::fbjni
  ReactAndroid::reactnative
)

function (use_expo_common target_name)
  target_link_libraries(${target_name} PRIVATE EXPO_COMMON)
endfunction ()
