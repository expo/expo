cmake_minimum_required(VERSION 3.16)
set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 20)

project(expo-modules-core)

include(${CMAKE_SOURCE_DIR}/cmake/variables.cmake)
include(${CMAKE_SOURCE_DIR}/cmake/common.cmake)

file(GLOB sources_android "${SRC_DIR}/main/cpp/*.cpp")
file(GLOB sources_android_types "${SRC_DIR}/main/cpp/types/*.cpp")
file(GLOB sources_android_javaclasses "${SRC_DIR}/main/cpp/javaclasses/*.cpp")
file(GLOB sources_android_decorators "${SRC_DIR}/main/cpp/decorators/*.cpp")
file(GLOB sources_android_worklets "${SRC_DIR}/main/cpp/worklets/*.cpp")
file(GLOB common_sources "${COMMON_DIR}/*.cpp")
file(GLOB common_sources_jsi "${COMMON_DIR}/JSI/*.cpp")
file(GLOB fabric_andorid_sources "${SRC_DIR}/fabric/*.cpp")
file(GLOB common_fabric_sources "${COMMON_DIR}/fabric/*.cpp")

# shared

add_library(
  expo-modules-core
  SHARED
  ${common_sources}
  ${common_sources_jsi}
  ${sources_android}
  ${sources_android_types}
  ${sources_android_javaclasses}
  ${sources_android_decorators}
  ${sources_android_worklets}
  ${fabric_andorid_sources}
  ${common_fabric_sources}
)

use_expo_common(expo-modules-core)

target_include_directories(
  expo-modules-core
  PRIVATE
  ${REACT_NATIVE_INTERFACE_INCLUDE_DIRECTORIES}/react
  ${REACT_NATIVE_INTERFACE_INCLUDE_DIRECTORIES}/react/fabric
  # header only imports from turbomodule, e.g. CallInvokerHolder.h
  "${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni/react/turbomodule"
  "${SRC_DIR}/fabric"
  "${COMMON_DIR}"
  "${COMMON_DIR}/JSI"
  "${COMMON_DIR}/fabric"
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
endif()

target_link_libraries(
  expo-modules-core
  PRIVATE
  ${LOG_LIB}
  android
  ${JSEXECUTOR_LIB}
  ${NEW_ARCHITECTURE_DEPENDENCIES}
)

if (REACT_NATIVE_WORKLETS_DIR)
  add_library(worklets SHARED IMPORTED)

  if(${CMAKE_BUILD_TYPE} MATCHES "Debug")
    set(BUILD_TYPE "debug")
  else()
    set(BUILD_TYPE "release")
  endif()

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
endif()
