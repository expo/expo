if (${CMAKE_BUILD_TYPE} MATCHES "Debug")
  set(EXPO_PREBUILT_VARIANT "debug")
else ()
  set(EXPO_PREBUILT_VARIANT "release")
endif ()

set(EXPO_PREBUILT_ABI_DIR "${EXPO_PREBUILT_NATIVE_LIBS_DIR}/${EXPO_PREBUILT_VARIANT}/${ANDROID_ABI}")

# expo-modules-jsi
set(EXPO_PREBUILT_JSI_SO "${EXPO_PREBUILT_ABI_DIR}/libexpo-modules-jsi.so")
if (EXISTS "${EXPO_PREBUILT_JSI_SO}")
  add_library(expo-modules-jsi SHARED IMPORTED)
  set_target_properties(
    expo-modules-jsi
    PROPERTIES
    IMPORTED_LOCATION "${EXPO_PREBUILT_JSI_SO}"
    INTERFACE_INCLUDE_DIRECTORIES "${COMMON_DIR}/JSI;${ANDROID_SRC_DIR}/jsi"
  )
  set(EXPO_JSI_PREBUILT TRUE)
  message(STATUS "[expo-modules-core] Using prebuilt libexpo-modules-jsi.so (${EXPO_PREBUILT_VARIANT}/${ANDROID_ABI})")
endif ()

# expo-modules-core
set(EXPO_PREBUILT_CORE_SO "${EXPO_PREBUILT_ABI_DIR}/libexpo-modules-core.so")
if (EXISTS "${EXPO_PREBUILT_CORE_SO}")
  add_library(expo-modules-core SHARED IMPORTED)
  set_target_properties(
    expo-modules-core
    PROPERTIES
    IMPORTED_LOCATION "${EXPO_PREBUILT_CORE_SO}"
  )
  set(EXPO_CORE_PREBUILT TRUE)
  message(STATUS "[expo-modules-core] Using prebuilt libexpo-modules-core.so (${EXPO_PREBUILT_VARIANT}/${ANDROID_ABI})")
endif ()
