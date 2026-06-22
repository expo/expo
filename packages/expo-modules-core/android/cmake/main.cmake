file(
  GLOB
  common_sources
  "${COMMON_DIR}/*.cpp"
  "${COMMON_DIR}/fabric/*.cpp"
)

set(main_dir ${ANDROID_SRC_DIR}/main/cpp)
file(
  GLOB
  sources_android
  "${main_dir}/*.cpp"
  "${main_dir}/types/*.cpp"
  "${main_dir}/javaclasses/*.cpp"
  "${main_dir}/decorators/*.cpp"
  "${main_dir}/installers/*.cpp"
  "${main_dir}/fabric/*.cpp"
)

add_library(
  expo-modules-core
  SHARED
  ${common_sources}
  ${sources_android}
  ${fabric_andorid_sources}
)

use_expo_common(expo-modules-core)

target_include_directories(
  expo-modules-core
  PRIVATE
  ${REACT_NATIVE_INTERFACE_INCLUDE_DIRECTORIES}/react
  ${REACT_NATIVE_INTERFACE_INCLUDE_DIRECTORIES}/react/fabric
  # header only imports from jni, e.g. react/turbomodule/CallInvokerHolder.h
  "${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni"
  "${ANDROID_SRC_DIR}/fabric"
  "${COMMON_DIR}"
  "${COMMON_DIR}/fabric"
)

target_link_libraries(
  expo-modules-core
  PRIVATE
  ${LOG_LIB}
  android
  ${JSEXECUTOR_LIB}
  ${NEW_ARCHITECTURE_DEPENDENCIES}
  expo-modules-jsi
)
