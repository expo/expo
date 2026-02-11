macro(createVarAsBoolToInt name value)
  if (${value})
    set(${name} "1")
  else ()
    set(${name} "0")
  endif ()
endmacro()

createVarAsBoolToInt(USE_HERMES_INT ${USE_HERMES})
createVarAsBoolToInt(UNIT_TEST_INT ${UNIT_TEST})

set(ANDROID_SRC_DIR ${CMAKE_SOURCE_DIR}/src)
set(COMMON_DIR ${CMAKE_SOURCE_DIR}/../common/cpp)

include("${REACT_NATIVE_DIR}/ReactAndroid/cmake-utils/folly-flags.cmake")

find_package(ReactAndroid REQUIRED CONFIG)
find_package(fbjni REQUIRED CONFIG)
find_library(LOG_LIB log)

get_target_property(
  REACT_NATIVE_INTERFACE_INCLUDE_DIRECTORIES
  ReactAndroid::reactnative
  INTERFACE_INCLUDE_DIRECTORIES
)

set(ADDITIONAL_CXX_FLAGS -DREACT_NATIVE_TARGET_VERSION=${REACT_NATIVE_TARGET_VERSION})
# REACT_NATIVE_MINOR_VERSION is used by worklets headers
set(ADDITIONAL_CXX_FLAGS ${ADDITIONAL_CXX_FLAGS} -DREACT_NATIVE_MINOR_VERSION=${REACT_NATIVE_TARGET_VERSION})

set(OPTIMIZATION_FLAGS "-O2")
if (${NATIVE_DEBUG})
  set(ADDITIONAL_CXX_FLAGS "${ADDITIONAL_CXX_FLAGS} -g")
  set(OPTIMIZATION_FLAGS "-O0")
endif ()

if (${UNIT_TEST})
  if (${USE_HERMES})
    find_package(hermes-engine REQUIRED CONFIG)
    set(JSEXECUTOR_LIB hermes-engine::hermesvm)
  else ()
    set(JSEXECUTOR_LIB ReactAndroid::jscexecutor)
  endif ()
else ()
  set(JSEXECUTOR_LIB "")
endif ()

if (REACT_NATIVE_WORKLETS_DIR)
  set(WORKLETS_INTEGRATION_COMPILE_OPTIONS "-DWORKLETS_ENABLED=1")
else ()
  set(WORKLETS_INTEGRATION_COMPILE_OPTIONS "")
endif ()
