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
  "${main_dir}/worklets/*.cpp"
)

file(GLOB fabric_andorid_sources "${ANDROID_SRC_DIR}/fabric/*.cpp")

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
  # header only imports from turbomodule, e.g. CallInvokerHolder.h
  "${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni/react/turbomodule"
  "${ANDROID_SRC_DIR}/fabric"
  "${COMMON_DIR}"
  "${COMMON_DIR}/fabric"
)

target_compile_options(
  expo-modules-core
  PRIVATE
  ${WORKLETS_INTEGRATION_COMPILE_OPTIONS}
)

if (REACT_NATIVE_WORKLETS_DIR)
  target_include_directories(
    expo-modules-core
    PRIVATE
    "${REACT_NATIVE_DIR}/ReactCommon"
    "${REACT_NATIVE_DIR}/ReactCommon/jsiexecutor"
    "${REACT_NATIVE_WORKLETS_DIR}/Common/cpp"
    "${REACT_NATIVE_WORKLETS_DIR}/android/src/main/cpp"
  )
endif ()

target_link_libraries(
  expo-modules-core
  PRIVATE
  ${LOG_LIB}
  android
  ${JSEXECUTOR_LIB}
  ${NEW_ARCHITECTURE_DEPENDENCIES}
  expo-modules-jsi
)

if (REACT_NATIVE_WORKLETS_DIR)
  add_library(worklets SHARED IMPORTED)

  if (${CMAKE_BUILD_TYPE} MATCHES "Debug")
    set(BUILD_TYPE "debug")
  else ()
    set(BUILD_TYPE "release")
  endif ()

  set_target_properties(
    worklets
    PROPERTIES
    IMPORTED_LOCATION
    "${REACT_NATIVE_WORKLETS_DIR}/android/build/intermediates/cmake/${BUILD_TYPE}/obj/${ANDROID_ABI}/libworklets.so"
  )

  target_link_libraries(
    expo-modules-core
    PRIVATE
    worklets
  )
endif ()
