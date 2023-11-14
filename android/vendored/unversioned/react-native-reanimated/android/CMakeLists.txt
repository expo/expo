project(Reanimated)
cmake_minimum_required(VERSION 3.8)

set (CMAKE_VERBOSE_MAKEFILE ON)
if(${REACT_NATIVE_MINOR_VERSION} GREATER_EQUAL 73)
    set (CMAKE_CXX_STANDARD 20)
else()
    set (CMAKE_CXX_STANDARD 17)
endif()

# default CMAKE_CXX_FLAGS: "-g -DANDROID -fdata-sections -ffunction-sections -funwind-tables -fstack-protector-strong -no-canonical-prefixes -D_FORTIFY_SOURCE=2 -Wformat -Werror=format-security -fstack-protector-all"

if(${REACT_NATIVE_MINOR_VERSION} GREATER_EQUAL 71)
    include("${REACT_NATIVE_DIR}/ReactAndroid/cmake-utils/folly-flags.cmake")
    add_compile_options(${folly_FLAGS})
else()
    set(folly_FLAGS "-DFOLLY_NO_CONFIG=1 -DFOLLY_HAVE_CLOCK_GETTIME=1 -DFOLLY_HAVE_MEMRCHR=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_MOBILE=1 -DFOLLY_HAVE_RECVMMSG=1 -DFOLLY_HAVE_PTHREAD=1")
    string(APPEND CMAKE_CXX_FLAGS " ${folly_FLAGS}")
endif()

string(APPEND CMAKE_CXX_FLAGS " -DREACT_NATIVE_MINOR_VERSION=${REACT_NATIVE_MINOR_VERSION} -DREANIMATED_VERSION=${REANIMATED_VERSION} -DHERMES_ENABLE_DEBUGGER=${HERMES_ENABLE_DEBUGGER}")

string(APPEND CMAKE_CXX_FLAGS " -fexceptions -fno-omit-frame-pointer -frtti -fstack-protector-all -std=c++${CMAKE_CXX_STANDARD} -Wall -Werror")

if(${IS_NEW_ARCHITECTURE_ENABLED})
    string(APPEND CMAKE_CXX_FLAGS " -DRCT_NEW_ARCH_ENABLED")
endif()

if(${IS_REANIMATED_EXAMPLE_APP})
    string(APPEND CMAKE_CXX_FLAGS " -DIS_REANIMATED_EXAMPLE_APP")
endif()

if(NOT ${CMAKE_BUILD_TYPE} MATCHES "Debug")
    string(APPEND CMAKE_CXX_FLAGS " -DNDEBUG")
endif()

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON CACHE INTERNAL "")

set (PACKAGE_NAME "reanimated")
set (BUILD_DIR ${CMAKE_SOURCE_DIR}/build)
set (SRC_DIR ${CMAKE_SOURCE_DIR}/src)
set (COMMON_SRC_DIR "${CMAKE_SOURCE_DIR}/../Common")

file(GLOB_RECURSE SOURCES_COMMON CONFIGURE_DEPENDS "${COMMON_SRC_DIR}/cpp/**.cpp")
file(GLOB_RECURSE SOURCES_ANDROID CONFIGURE_DEPENDS "${SRC_DIR}/main/cpp/**.cpp")

if(${REACT_NATIVE_MINOR_VERSION} GREATER_EQUAL 71)
    # Consume shared libraries and headers from prefabs
    find_package(fbjni REQUIRED CONFIG)
    find_package(ReactAndroid REQUIRED CONFIG)
    if(${JS_RUNTIME} STREQUAL "hermes")
        find_package(hermes-engine REQUIRED CONFIG)
    endif()
else()
    # Consume shared libraries from found .so files
    if(${IS_NEW_ARCHITECTURE_ENABLED})
        message(FATAL_ERROR "not supported")
    else()
        set (RN_SO_DIR "${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni/first-party/react/jni")
        set (FBJNI_HEADERS_DIR "${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni/first-party/fbjni/headers")
    endif()
    file (GLOB LIBRN_DIR "${RN_SO_DIR}/${ANDROID_ABI}")
endif()

add_library(
        ${PACKAGE_NAME}
        SHARED
        ${SOURCES_COMMON}
        ${SOURCES_ANDROID}
        ${INCLUDE_JSI_CPP}
        ${INCLUDE_JSIDYNAMIC_CPP}
)

# includes

target_include_directories(
        ${PACKAGE_NAME}
        PRIVATE
        "${COMMON_SRC_DIR}/cpp/AnimatedSensor"
        "${COMMON_SRC_DIR}/cpp/Fabric"
        "${COMMON_SRC_DIR}/cpp/hidden_headers"
        "${COMMON_SRC_DIR}/cpp/LayoutAnimations"
        "${COMMON_SRC_DIR}/cpp/NativeModules"
        "${COMMON_SRC_DIR}/cpp/ReanimatedRuntime"
        "${COMMON_SRC_DIR}/cpp/Registries"
        "${COMMON_SRC_DIR}/cpp/SharedItems"
        "${COMMON_SRC_DIR}/cpp/Tools"
        "${SRC_DIR}/main/cpp"
)

if(${REACT_NATIVE_MINOR_VERSION} GREATER_EQUAL 71)
    target_include_directories(
        ${PACKAGE_NAME}
        PRIVATE
        "${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni/react/turbomodule"
        "${REACT_NATIVE_DIR}/ReactCommon"
        "${REACT_NATIVE_DIR}/ReactCommon/callinvoker"
        "${REACT_NATIVE_DIR}/ReactCommon/react/renderer/graphics/platform/cxx"
        "${REACT_NATIVE_DIR}/ReactCommon/runtimeexecutor"
        "${REACT_NATIVE_DIR}/ReactCommon/yoga"
    )
else()
    file(GLOB LIBFBJNI_INCLUDE_DIR ${FBJNI_HEADERS_DIR})
    target_include_directories(
        ${PACKAGE_NAME}
        PRIVATE
        "${LIBFBJNI_INCLUDE_DIR}"
        "${BUILD_DIR}/third-party-ndk/boost/boost_${BOOST_VERSION}"
        "${BUILD_DIR}/third-party-ndk/double-conversion"
        "${BUILD_DIR}/third-party-ndk/folly"
        "${BUILD_DIR}/third-party-ndk/glog/exported"
        "${REACT_NATIVE_DIR}/React"
        "${REACT_NATIVE_DIR}/React/Base"
        "${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni"
        "${REACT_NATIVE_DIR}/ReactAndroid/src/main/java/com/facebook/react/turbomodule/core/jni"
        "${REACT_NATIVE_DIR}/ReactAndroid/src/main/java/com/facebook/react/fabric/jni"
        "${REACT_NATIVE_DIR}/ReactCommon"
        "${REACT_NATIVE_DIR}/ReactCommon/callinvoker"
        "${REACT_NATIVE_DIR}/ReactCommon/jsi"
        "${REACT_NATIVE_DIR}/ReactCommon/hermes"
        "${REACT_NATIVE_DIR}/ReactCommon/react/renderer/graphics/platform/cxx"
        "${REACT_NATIVE_DIR}/ReactCommon/runtimeexecutor"
        "${REACT_NATIVE_DIR}/ReactCommon/turbomodule/core"
        "${REACT_NATIVE_DIR}/ReactCommon/turbomodule"
        "${REACT_NATIVE_DIR}/ReactCommon/yoga"
    )
endif()

# build shared lib

set_target_properties(${PACKAGE_NAME} PROPERTIES LINKER_LANGUAGE CXX)

target_link_libraries(
    ${PACKAGE_NAME}
    log
    android
)

if(${REACT_NATIVE_MINOR_VERSION} GREATER_EQUAL 71)
    target_link_libraries(
        ${PACKAGE_NAME}
        ReactAndroid::folly_runtime
        ReactAndroid::glog
        ReactAndroid::jsi
        ReactAndroid::reactnativejni
        fbjni::fbjni
    )
else()
    find_library(
        JSI_LIB
        jsi
        PATHS ${LIBRN_DIR}
        NO_DEFAULT_PATH
        NO_CMAKE_FIND_ROOT_PATH
    )
    find_library(
        GLOG_LIB
        glog
        PATHS ${LIBRN_DIR}
        NO_DEFAULT_PATH
        NO_CMAKE_FIND_ROOT_PATH
    )

    find_library(
        FBJNI_LIB
        fbjni
        PATHS ${LIBRN_DIR}
        NO_DEFAULT_PATH
        NO_CMAKE_FIND_ROOT_PATH
    )

    if(${REACT_NATIVE_MINOR_VERSION} LESS 69)
        find_library(
            FOLLY_LIB
            folly_json
            PATHS ${LIBRN_DIR}
            NO_DEFAULT_PATH
            NO_CMAKE_FIND_ROOT_PATH
        )
    else()
        find_library(
            FOLLY_LIB
            folly_runtime
            PATHS ${LIBRN_DIR}
            NO_DEFAULT_PATH
            NO_CMAKE_FIND_ROOT_PATH
        )
    endif()

    find_library(
        REACTNATIVEJNI_LIB
        reactnativejni
        PATHS ${LIBRN_DIR}
        NO_DEFAULT_PATH
        NO_CMAKE_FIND_ROOT_PATH
    )

    target_link_libraries(
        ${PACKAGE_NAME}
        ${JSI_LIB}
        ${GLOG_LIB}
        ${FBJNI_LIB}
        ${FOLLY_LIB}
        ${REACTNATIVEJNI_LIB}
    )
endif()

if(${JS_RUNTIME} STREQUAL "hermes")
    string(APPEND CMAKE_CXX_FLAGS " -DJS_RUNTIME_HERMES=1")
    if(${REACT_NATIVE_MINOR_VERSION} GREATER_EQUAL 71)
        # From prefab from module `com.facebook.react:hermes-android`
        set(HERMES_LIB hermes-engine::libhermes)
    elseif(${REACT_NATIVE_MINOR_VERSION} GREATER_EQUAL 69)
        # Bundled Hermes from module `com.facebook.react:hermes-engine` or project `:ReactAndroid:hermes-engine`
        target_include_directories(
            ${PACKAGE_NAME}
            PRIVATE
            "${JS_RUNTIME_DIR}/API"
            "${JS_RUNTIME_DIR}/public"
        )
        set(HERMES_LIB "${BUILD_DIR}/third-party-ndk/hermes/jni/${ANDROID_ABI}/libhermes.so")
    else()
        # From `hermes-engine` npm package
        target_include_directories(
            ${PACKAGE_NAME}
            PRIVATE
            "${JS_RUNTIME_DIR}/android/include"
        )
        set(HERMES_LIB "${BUILD_DIR}/third-party-ndk/hermes/jni/${ANDROID_ABI}/libhermes.so")
    endif()
    target_link_libraries(
        ${PACKAGE_NAME}
        ${HERMES_LIB}
    )
    if (${HERMES_ENABLE_DEBUGGER})
        if(${REACT_NATIVE_MINOR_VERSION} GREATER_EQUAL 71)
            set(HERMES_EXECUTOR_LIB ReactAndroid::hermes_executor)
        else()
            find_library(
                HERMES_EXECUTOR_LIB
                hermes-executor-debug
                PATHS ${LIBRN_DIR}
                NO_DEFAULT_PATH
                NO_CMAKE_FIND_ROOT_PATH
            )
        endif()
        if(${REACT_NATIVE_MINOR_VERSION} LESS_EQUAL 67)
            find_library(
                    HERMES_INSPECTOR_LIB
                    hermes-inspector
                    PATHS ${LIBRN_DIR}
                    NO_DEFAULT_PATH
                    NO_CMAKE_FIND_ROOT_PATH
            )
            target_link_libraries(
                    ${PACKAGE_NAME}
                    ${HERMES_INSPECTOR_LIB}
            )
        endif()
        target_link_libraries(
                ${PACKAGE_NAME}
                ${HERMES_EXECUTOR_LIB}
        )
    endif()
elseif(${JS_RUNTIME} STREQUAL "v8")
    string(APPEND CMAKE_CXX_FLAGS " -DJS_RUNTIME_V8=1")
    target_include_directories(
            ${PACKAGE_NAME}
            PRIVATE
            "${JS_RUNTIME_DIR}/src"
    )
    file (GLOB V8_SO_DIR "${JS_RUNTIME_DIR}/android/build/intermediates/library_jni/*/jni/${ANDROID_ABI}")
    find_library(
            V8EXECUTOR_LIB
            v8executor
            PATHS ${V8_SO_DIR}
            NO_DEFAULT_PATH
            NO_CMAKE_FIND_ROOT_PATH
    )
    target_link_libraries(
            ${PACKAGE_NAME}
            ${V8EXECUTOR_LIB}
    )
elseif(${JS_RUNTIME} STREQUAL "jsc")
    string(APPEND CMAKE_CXX_FLAGS " -DJS_RUNTIME_JSC=1")
    if(${REACT_NATIVE_MINOR_VERSION} GREATER_EQUAL 71)
        set(JSEXECUTOR_LIB ReactAndroid::jscexecutor)
    else()
        find_library(
            JSEXECUTOR_LIB
            jscexecutor
            PATHS ${LIBRN_DIR}
            NO_DEFAULT_PATH
            NO_CMAKE_FIND_ROOT_PATH
        )
    endif()
    target_link_libraries(${PACKAGE_NAME} ${JSEXECUTOR_LIB})
else()
    message(FATAL_ERROR "Unknown JS runtime ${JS_RUNTIME}.")
endif()

if(${IS_NEW_ARCHITECTURE_ENABLED})
    target_link_libraries(
        ${PACKAGE_NAME}
        ReactAndroid::fabricjni
        ReactAndroid::react_debug
        ReactAndroid::react_render_core
        ReactAndroid::react_render_mounting
        ReactAndroid::react_render_scheduler
        ReactAndroid::react_render_uimanager
        ReactAndroid::rrc_view
    )
endif()

# Resolves "CMake Warning: Manually-specified variables were not used by the project"
# when any of the following variables is not used in some build configuration.
set (ignoreMe "${JS_RUNTIME_DIR}")
set (ignoreMe "${BOOST_VERSION}")
