project(Reanimated)
cmake_minimum_required(VERSION 3.8)

set (CMAKE_VERBOSE_MAKEFILE ON)
set (CMAKE_CXX_STANDARD 17)
set (DEFAULT_FLAGS "-DFOLLY_NO_CONFIG=1 -DFOLLY_HAVE_CLOCK_GETTIME=1 -DFOLLY_HAVE_MEMRCHR=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_MOBILE=1 -DFOLLY_HAVE_RECVMMSG=1 -DFOLLY_HAVE_PTHREAD=1 -DANDROID -DREACT_NATIVE_MINOR_VERSION=${REACT_NATIVE_MINOR_VERSION} -fexceptions -fno-omit-frame-pointer -frtti -Wno-sign-compare -std=c++17 -Wall -Werror")
if(${IS_NEW_ARCHITECTURE_ENABLED})
    set (ALL_FLAGS "${DEFAULT_FLAGS} -DRCT_NEW_ARCH_ENABLED")
else()
    set (ALL_FLAGS ${DEFAULT_FLAGS})
endif()
if(${CMAKE_BUILD_TYPE} STREQUAL "Debug" AND NOT ${REANIMATED_PACKAGE_BUILD} STREQUAL "1")
    set (ALL_FLAGS "${ALL_FLAGS} -DDEBUG")
endif()
set (CMAKE_CXX_FLAGS ${ALL_FLAGS})

if(${CMAKE_BUILD_TYPE} STREQUAL "Debug" AND NOT ${REANIMATED_PACKAGE_BUILD} STREQUAL "1")
    set(CMAKE_C_FLAGS_DEBUG "${CMAKE_C_FLAGS_DEBUG} -g")
    set(CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG} -g")
endif()

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON CACHE INTERNAL "")

set (PACKAGE_NAME "reanimated")
set (BUILD_DIR ${CMAKE_SOURCE_DIR}/build)
set (SRC_DIR ${CMAKE_SOURCE_DIR}/src)

set (COMMON_SRC_DIR "${CMAKE_SOURCE_DIR}/../Common")
if(${IS_NEW_ARCHITECTURE_ENABLED})
    if(${CLIENT_SIDE_BUILD})
        set (RN_SO_DIR "${CMAKE_SOURCE_DIR}/../../../android/app/build/react-ndk/exported")
        set (FBJNI_HEADERS_DIR "${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni/first-party/fbjni/headers")
    else()
        # Reanimated Playground app
        set (RN_SO_DIR "${CMAKE_SOURCE_DIR}/../${PLAYGROUND_APP_NAME}/android/app/build/react-ndk/exported")
        set (FBJNI_HEADERS_DIR "${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni/first-party/fbjni/headers")

    endif()
else()
    set (RN_SO_DIR ${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni/first-party/react/jni)
    set (FBJNI_HEADERS_DIR "${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni/first-party/fbjni/headers")
endif()

file (GLOB LIBRN_DIR "${RN_SO_DIR}/${ANDROID_ABI}")

file(GLOB_RECURSE SOURCES_COMMON CONFIGURE_DEPENDS "${COMMON_SRC_DIR}/cpp/**.cpp")
file(GLOB_RECURSE SOURCES_ANDROID CONFIGURE_DEPENDS "${SRC_DIR}/main/cpp/**.cpp")

if(${REACT_NATIVE_MINOR_VERSION} LESS 66)
        set (
                INCLUDE_JSI_CPP
                "${REACT_NATIVE_DIR}/ReactCommon/jsi/jsi/jsi.cpp"
        )
        set (
                INCLUDE_JSIDYNAMIC_CPP
                "${REACT_NATIVE_DIR}/ReactCommon/jsi/jsi/JSIDynamic.cpp"
        )
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

file (GLOB LIBFBJNI_INCLUDE_DIR ${FBJNI_HEADERS_DIR})

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
        "${REACT_NATIVE_DIR}/ReactCommon/react/renderer/graphics/platform/cxx"
        "${REACT_NATIVE_DIR}/ReactCommon/runtimeexecutor"
        "${REACT_NATIVE_DIR}/ReactCommon/turbomodule/core"
        "${REACT_NATIVE_DIR}/ReactCommon/turbomodule"
        "${REACT_NATIVE_DIR}/ReactCommon/yoga"
        "${COMMON_SRC_DIR}/cpp/Tools"
        "${COMMON_SRC_DIR}/cpp/SpecTools"
        "${COMMON_SRC_DIR}/cpp/NativeModules"
        "${COMMON_SRC_DIR}/cpp/SharedItems"
        "${COMMON_SRC_DIR}/cpp/Registries"
        "${COMMON_SRC_DIR}/cpp/LayoutAnimations"
        "${COMMON_SRC_DIR}/cpp/AnimatedSensor"
        "${COMMON_SRC_DIR}/cpp/Fabric"
        "${COMMON_SRC_DIR}/cpp/hidden_headers"
        "${SRC_DIR}/main/cpp"
)

find_library(
        LOG_LIB
        log
)
find_library(
        REACT_NATIVE_JNI_LIB
        reactnativejni
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)
find_library(
        GLOG_LIB
        glog
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)
find_library(
        FBJNI_LIB
        fbjni
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)

if(${REACT_NATIVE_MINOR_VERSION} LESS 69)
    find_library(
            FOLLY_LIB
            folly_json
            PATHS ${LIBRN_DIR}
            NO_CMAKE_FIND_ROOT_PATH
    )
else()
    find_library(
            FOLLY_LIB
            folly_runtime
            PATHS ${LIBRN_DIR}
            NO_CMAKE_FIND_ROOT_PATH
    )
endif()

if(${REACT_NATIVE_MINOR_VERSION} LESS 66)
    set (JSI_LIB "")
else()
    find_library(
            JSI_LIB
            jsi
            PATHS ${LIBRN_DIR}
            NO_CMAKE_FIND_ROOT_PATH
    )
endif()

if(${IS_NEW_ARCHITECTURE_ENABLED})
    find_library(
            REACT_RENDER_UIMANAGER
            react_render_uimanager
            PATHS ${LIBRN_DIR}
            NO_CMAKE_FIND_ROOT_PATH
    )
    find_library(
            REACT_RENDER_MOUNTING
            react_render_mounting
            PATHS ${LIBRN_DIR}
            NO_CMAKE_FIND_ROOT_PATH
    )
    find_library(
            REACT_RENDER_COMPONENTREGISTRY
            react_render_componentregistry
            PATHS ${LIBRN_DIR}
            NO_CMAKE_FIND_ROOT_PATH
    )
    find_library(
            REACT_RENDER_CORE
            react_render_core
            PATHS ${LIBRN_DIR}
            NO_CMAKE_FIND_ROOT_PATH
    )
    find_library(
            REACT_DEBUG
            react_debug
            PATHS ${LIBRN_DIR}
            NO_CMAKE_FIND_ROOT_PATH
    )
    find_library(
            REACT_RENDER_DEBUG
            react_render_debug
            PATHS ${LIBRN_DIR}
            NO_CMAKE_FIND_ROOT_PATH
    )
    find_library(
            RRC_ROOT
            rrc_root
            PATHS ${LIBRN_DIR}
            NO_CMAKE_FIND_ROOT_PATH
    )
    find_library(
            RRC_VIEW
            rrc_view
            PATHS ${LIBRN_DIR}
            NO_CMAKE_FIND_ROOT_PATH
    )
    find_library(
            REACT_RENDER_SCHEDULER
            react_render_scheduler
            PATHS ${LIBRN_DIR}
            NO_CMAKE_FIND_ROOT_PATH
    )
    find_library(
            FABRICJNI
            fabricjni
            PATHS ${LIBRN_DIR}
            NO_CMAKE_FIND_ROOT_PATH
    )
endif()

# build shared lib

set_target_properties(${PACKAGE_NAME} PROPERTIES LINKER_LANGUAGE CXX)


target_link_libraries(
        ${PACKAGE_NAME}
        ${LOG_LIB}
        ${JSI_LIB}
        ${GLOG_LIB}
        ${FBJNI_LIB}
        ${FOLLY_LIB}
        ${REACT_NATIVE_JNI_LIB}
        android
)

if(${JS_RUNTIME} STREQUAL "hermes")
    string(APPEND CMAKE_CXX_FLAGS " -DJS_RUNTIME_HERMES=1")
    if(${REACT_NATIVE_MINOR_VERSION} LESS 69)
        # From `hermes-engine` npm package
        target_include_directories(
                ${PACKAGE_NAME}
                PRIVATE
                "${JS_RUNTIME_DIR}/android/include"
        )
    else()
        # Bundled Hermes from module `com.facebook.react:hermes-engine` or project `:ReactAndroid:hermes-engine`
        target_include_directories(
                ${PACKAGE_NAME}
                PRIVATE
                "${JS_RUNTIME_DIR}/API"
                "${JS_RUNTIME_DIR}/public"
        )
    endif()
    target_link_libraries(
            ${PACKAGE_NAME}
            "${BUILD_DIR}/third-party-ndk/hermes/jni/${ANDROID_ABI}/libhermes.so"
    )
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
            NO_CMAKE_FIND_ROOT_PATH
    )
    target_link_libraries(
            ${PACKAGE_NAME}
            ${V8EXECUTOR_LIB}
    )
else()
    string(APPEND CMAKE_CXX_FLAGS " -DJS_RUNTIME_JSC=1")
    find_library(
            JSEXECUTOR_LIB
            jscexecutor
            PATHS ${LIBRN_DIR}
            NO_CMAKE_FIND_ROOT_PATH
    )
    target_link_libraries(
            ${PACKAGE_NAME}
            ${JSEXECUTOR_LIB}
    )
endif()

if(${IS_NEW_ARCHITECTURE_ENABLED})
    target_link_libraries(
            ${PACKAGE_NAME}
            ${REACT_RENDER_UIMANAGER}
            ${REACT_RENDER_MOUNTING}
            ${REACT_RENDER_COMPONENTREGISTRY}
            ${REACT_RENDER_CORE}
            ${REACT_DEBUG}
            ${REACT_RENDER_DEBUG}
            ${RRC_ROOT}
            ${RRC_VIEW}
            ${FABRICJNI}
            ${REACT_RENDER_SCHEDULER}
    )
endif()

if(${REACT_NATIVE_MINOR_VERSION} LESS 64)
    add_library(
            turbomodulejsijni
            # Sets the library as a shared library.
            SHARED
            # Provides a relative path to your source file(s).
            ./empty.cpp
    )
endif()

# Resolves "CMake Warning: Manually-specified variables were not used by the project"
# when any of the following variables is not used in some build configuration.
set (ignoreMe "${CLIENT_SIDE_BUILD}")
set (ignoreMe "${JS_RUNTIME_DIR}")
set (ignoreMe "${PLAYGROUND_APP_NAME}")
set (ignoreMe "${HERMES_ENABLE_DEBUGGER}")
