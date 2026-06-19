set(main_dir ${ANDROID_SRC_DIR}/main/cpp)

file(
  GLOB
  worklets_sources
  "${main_dir}/worklets/*.cpp"
)

add_library(
  expo-modules-worklets
  SHARED
  ${worklets_sources}
)

use_expo_common(expo-modules-worklets)

target_include_directories(
  expo-modules-worklets
  PRIVATE
  ${REACT_NATIVE_INTERFACE_INCLUDE_DIRECTORIES}/react
  ${REACT_NATIVE_INTERFACE_INCLUDE_DIRECTORIES}/react/fabric
  # header only imports from jni, e.g. react/turbomodule/CallInvokerHolder.h
  "${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni"
  "${REACT_NATIVE_DIR}/ReactCommon"
  "${REACT_NATIVE_DIR}/ReactCommon/jsiexecutor"
  "${ANDROID_SRC_DIR}/fabric"
  "${COMMON_DIR}"
  "${COMMON_DIR}/fabric"
  "${REACT_NATIVE_WORKLETS_DIR}/Common/cpp"
  "${REACT_NATIVE_WORKLETS_DIR}/android/src/main/cpp"
)

target_link_libraries(
  expo-modules-worklets
  PRIVATE
  ${LOG_LIB}
  android
  ${JSEXECUTOR_LIB}
  ${NEW_ARCHITECTURE_DEPENDENCIES}
  expo-modules-jsi
  expo-modules-core
)

find_package(react-native-worklets CONFIG QUIET)
if (react-native-worklets_FOUND)
  target_link_libraries(
    expo-modules-worklets
    PRIVATE
    react-native-worklets::worklets
  )
else ()
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
    expo-modules-worklets
    PRIVATE
    worklets
  )
endif ()
