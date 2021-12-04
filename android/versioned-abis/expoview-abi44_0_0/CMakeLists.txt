cmake_minimum_required(VERSION 3.5.1)

set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_FLAGS "-DFOLLY_NO_CONFIG=1 -DFOLLY_HAVE_CLOCK_GETTIME=1 -DFOLLY_HAVE_MEMRCHR=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_MOBILE=1 -DON_ANDROID -DONANDROID -DFOR_HERMES=${FOR_HERMES} -fexceptions -fno-omit-frame-pointer -frtti -Wno-sign-compare")

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON CACHE INTERNAL "")

set(PACKAGE_NAME "reanimated_abi44_0_0")
set(BUILD_DIR ${CMAKE_SOURCE_DIR}/build)
set(NODE_MODULES_DIR "../node_modules")

set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_OUTPUT_DIR}/${ANDROID_ABI})
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_OUTPUT_DIR}/${ANDROID_ABI})

# reanimated_abi44_0_0 shared

file(GLOB sources_tools  "./src/main/Common/cpp/Tools/*.cpp")
file(GLOB sources_native_modules  "./src/main/Common/cpp/NativeModules/*.cpp")
file(GLOB sources_shared_items  "./src/main/Common/cpp/SharedItems/*.cpp")
file(GLOB sources_registries  "./src/main/Common/cpp/Registries/*.cpp")
file(GLOB sources_android  "./src/main/cpp/*.cpp")

if(${REACT_NATIVE_TARGET_VERSION} LESS 64)
    set (JSI_PATH_FOR_RN_LESS_64 ${REACT_NATIVE_PATH}/ReactCommon/jsi/jsi/jsi.cpp)
endif()

add_library(
        ${PACKAGE_NAME}
        SHARED
        ${sources_native_modules}
        ${sources_shared_items}
        ${sources_registries}
        ${sources_android}
        ${source_tools}
        ${JSI_PATH_FOR_RN_LESS_64}
        ${REACT_NATIVE_PATH}/ReactCommon/jsi/jsi/JSIDynamic.cpp
        "./src/main/Common/cpp/Tools/JSIStoreValueUser.cpp"
        "./src/main/Common/cpp/Tools/Mapper.cpp"
        "./src/main/Common/cpp/Tools/RuntimeDecorator.cpp"
        "./src/main/Common/cpp/Tools/Scheduler.cpp"
        "./src/main/Common/cpp/Tools/WorkletEventHandler.cpp"
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
        "${REACT_NATIVE_PATH}/React"
        "${REACT_NATIVE_PATH}/React/Base"
        "${REACT_NATIVE_PATH}/ReactAndroid/src/main/jni"
        "${REACT_NATIVE_PATH}/ReactAndroid/src/main/java/com/facebook/react/turbomodule/core/jni"
        "${REACT_NATIVE_PATH}/ReactCommon"
        "${REACT_NATIVE_PATH}/ReactCommon/callinvoker"
        "${REACT_NATIVE_PATH}/ReactCommon/jsi"
        "${REACT_NATIVE_PATH}/ReactCommon/turbomodule/core"
        "${REACT_NATIVE_PATH}/ReactCommon/turbomodule"
        "${NODE_MODULES_DIR}/hermes-engine/android/include/"
        "./src/main/Common/cpp/headers/Tools"
        "./src/main/Common/cpp/headers/SpecTools"
        "./src/main/Common/cpp/headers/NativeModules"
        "./src/main/Common/cpp/headers/SharedItems"
        "./src/main/Common/cpp/headers/Registries"
        "./src/main/Common/cpp/headers/LayoutAnimations"
        "./src/main/Common/cpp/hidden_headers"
        "./src/main/cpp/headers"
)

# find libraries

file (GLOB LIBRN_DIR "${RN_SO_DIR}/${ANDROID_ABI}")
file (GLOB HERMES_DIR "${BUILD_DIR}/third-party-ndk/hermes/jni/${ANDROID_ABI}")

find_library(
        LOG_LIB
        log
)
find_library(
        FBJNI_LIB
        fbjni
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)
find_library(
        HERMES_LIB
        hermes_abi44_0_0
        PATHS ${HERMES_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)
find_library(
        JSEXECUTOR_LIB
        jscexecutor_abi44_0_0
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)
find_library(
        FOLLY_JSON_LIB
        folly_json_abi44_0_0
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)
find_library(
        REACT_NATIVE_JNI_LIB
        reactnativejni_abi44_0_0
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)
find_library(
        FBJNI_LIBRARY fbjni
        PATHS ${libfbjni_link_DIRS}
        NO_CMAKE_FIND_ROOT_PATH
)
find_library(
        GLOG_LIB 
        glog_abi44_0_0
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)
# build shared lib

set_target_properties(${PACKAGE_NAME} PROPERTIES LINKER_LANGUAGE CXX)

message(STATUS "CMakeLists.txt FOR_HERMES=${FOR_HERMES}")

if(${FOR_HERMES})
    target_link_libraries(
            ${PACKAGE_NAME}
            ${LOG_LIB}
            ${HERMES_LIB}
            ${GLOG_LIB}
            ${FBJNI_LIB}
            ${FOLLY_JSON_LIB}
            ${REACT_NATIVE_JNI_LIB}
            android
    )
else()
    target_link_libraries(
            ${PACKAGE_NAME}
            ${LOG_LIB}
            ${JSEXECUTOR_LIB}
            ${GLOG_LIB}
            ${FBJNI_LIB}
            ${FOLLY_JSON_LIB}
            ${REACT_NATIVE_JNI_LIB}
            android
    )
endif()

if(${REACT_NATIVE_TARGET_VERSION} LESS 64)
    add_library(
            turbomodulejsijni_abi44_0_0
            # Sets the library as a shared library.
            SHARED
            # Provides a relative path to your source file(s).
            ./empty.cpp
    )
endif()
