set(main_dir ${ANDROID_SRC_DIR}/main/cpp)

file(
  GLOB
  tests_sources
  "${main_dir}/tests/*.cpp"
)

add_library(
  expo-modules-core-tests
  SHARED
  ${tests_sources}
)

use_expo_common(expo-modules-core-tests)

target_precompile_headers(expo-modules-core-tests REUSE_FROM expo-modules-pch)

target_include_directories(
  expo-modules-core-tests
  PRIVATE
  "${main_dir}"
  # header only imports from jni, e.g. react/turbomodule/CallInvokerHolder.h
  "${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni"
  "${REACT_NATIVE_DIR}/ReactCommon"
  "${COMMON_DIR}/JSI"
)

target_link_libraries(
  expo-modules-core-tests
  PRIVATE
  ${LOG_LIB}
  android
  ${JSEXECUTOR_LIB}
)
