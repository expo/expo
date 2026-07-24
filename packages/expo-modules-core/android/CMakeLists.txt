cmake_minimum_required(VERSION 3.16)
set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 20)

project(expo-modules-core)

include(${CMAKE_SOURCE_DIR}/cmake/variables.cmake)
include(${CMAKE_SOURCE_DIR}/cmake/common.cmake)

# When prebuilt artifacts are shipped in the package, imports expo-modules-jsi / expo-modules-core
# as IMPORTED targets (and sets EXPO_JSI_PREBUILT / EXPO_CORE_PREBUILT) so they are not recompiled.
if (EXPO_PREBUILT_NATIVE_LIBS_DIR)
  include(${CMAKE_SOURCE_DIR}/cmake/prebuilt.cmake)
endif ()

# defines expo-modules-jsi target, unless it was imported from a prebuilt artifact above
if (NOT EXPO_JSI_PREBUILT)
  include(${CMAKE_SOURCE_DIR}/cmake/jsi.cmake)
endif ()

# defines expo-modules-core target, unless it was imported from a prebuilt artifact above
if (NOT EXPO_CORE_PREBUILT)
  include(${CMAKE_SOURCE_DIR}/cmake/main.cmake)
endif ()

# defines expo-modules-worklets target (worklets integration), only when react-native-worklets is installed
if (REACT_NATIVE_WORKLETS_DIR)
  include(${CMAKE_SOURCE_DIR}/cmake/worklets.cmake)
endif ()
