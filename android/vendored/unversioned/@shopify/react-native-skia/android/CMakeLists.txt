project(RNSkia)
cmake_minimum_required(VERSION 3.4.1)

if(${BUILD_TYPE} STREQUAL "debug")
    set (CMAKE_BUILD_TYPE Debug)
    message("-- Building with Debug Symbols")
endif()

set (CMAKE_VERBOSE_MAKEFILE ON)
set (CMAKE_CXX_STANDARD 17)
set (CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -DSK_GL -DSK_BUILD_FOR_ANDROID -DFOLLY_NO_CONFIG=1 -DFOLLY_HAVE_CLOCK_GETTIME=1 -DFOLLY_HAVE_MEMRCHR=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_MOBILE=1 -DON_ANDROID -DONANDROID")

set (PACKAGE_NAME "reactskia")
set (SKIA_LIB "skia")
set (SKIA_SVG_LIB "svg")
set (SKIA_SKSHAPER_LIB "skshaper")

set(build_DIR ${CMAKE_SOURCE_DIR}/build)
file(GLOB LIBRN_DIR "${PREBUILT_DIR}/${ANDROID_ABI}")
file(GLOB libfbjni_link_DIRS "${build_DIR}/fbjni*.aar/jni/${ANDROID_ABI}")
file(GLOB libfbjni_include_DIRS "${build_DIR}/fbjni-*-headers.jar/")

link_directories(../libs/android/${ANDROID_ABI}/)

if(${REACT_NATIVE_VERSION} LESS 66)
        file(
                TO_CMAKE_PATH 
                "${NODE_MODULES_DIR}/react-native/ReactCommon/jsi/jsi/jsi.cpp"
                INCLUDE_JSI_CPP
        )
endif()

add_library(
        ${PACKAGE_NAME}
        SHARED
        "${PROJECT_SOURCE_DIR}/cpp/jni/JniLoad.cpp"
        "${PROJECT_SOURCE_DIR}/cpp/jni/JniSkiaManager.cpp"

        "${PROJECT_SOURCE_DIR}/cpp/jni/JniPlatformContext.cpp"
        "${PROJECT_SOURCE_DIR}/cpp/rnskia-android/RNSkOpenGLCanvasProvider.cpp"
        "${PROJECT_SOURCE_DIR}/cpp/rnskia-android/SkiaOpenGLRenderer.cpp"

        "${PROJECT_SOURCE_DIR}/../cpp/jsi/JsiHostObject.cpp"

        "${PROJECT_SOURCE_DIR}/../cpp/rnskia/RNSkManager.cpp"
        "${PROJECT_SOURCE_DIR}/../cpp/rnskia/RNSkJsView.cpp"
        "${PROJECT_SOURCE_DIR}/../cpp/rnskia/RNSkDispatchQueue.cpp"

        "${PROJECT_SOURCE_DIR}/../cpp/api/third_party/CSSColorParser.cpp"
        
)

target_include_directories(
        ${PACKAGE_NAME}
        PRIVATE

        "${NODE_MODULES_DIR}/react-native/ReactCommon/callinvoker"
        "${NODE_MODULES_DIR}/react-native/ReactCommon/jsi"
        "${NODE_MODULES_DIR}/react-native/ReactCommon"
        "${NODE_MODULES_DIR}/react-native/ReactCommon/react/nativemodule/core"
        "${NODE_MODULES_DIR}/react-native/ReactAndroid/src/main/java/com/facebook/react/turbomodule/core/jni"

        ${PROJECT_SOURCE_DIR}/../cpp/skia/include/config/
        ${PROJECT_SOURCE_DIR}/../cpp/skia/include/core/
        ${PROJECT_SOURCE_DIR}/../cpp/skia/include/effects/
        ${PROJECT_SOURCE_DIR}/../cpp/skia/include/utils/
        ${PROJECT_SOURCE_DIR}/../cpp/skia/include/pathops/
        ${PROJECT_SOURCE_DIR}/../cpp/skia/modules/
        ${PROJECT_SOURCE_DIR}/../cpp/skia/include/
        ${PROJECT_SOURCE_DIR}/../cpp/skia

        ${PROJECT_SOURCE_DIR}/../cpp/api
        ${PROJECT_SOURCE_DIR}/../cpp/jsi
        ${PROJECT_SOURCE_DIR}/cpp/jni/include
        ${PROJECT_SOURCE_DIR}/cpp/rnskia-android
        ${PROJECT_SOURCE_DIR}/../cpp/rnskia
        ${PROJECT_SOURCE_DIR}/../cpp/rnskia/values
        ${PROJECT_SOURCE_DIR}/../cpp/utils  

        ${libfbjni_include_DIRS}
)

# Import prebuilt SKIA libraries
set (SKIA_LIBS_PATH "${CMAKE_CURRENT_SOURCE_DIR}/../../../../common/libs/${ANDROID_ABI}")
add_library(skia STATIC IMPORTED)
set_property(TARGET skia PROPERTY IMPORTED_LOCATION "${SKIA_LIBS_PATH}/libskia.a")

add_library(svg STATIC IMPORTED)
set_property(TARGET svg PROPERTY IMPORTED_LOCATION "${SKIA_LIBS_PATH}/libsvg.a")

add_library(skshaper STATIC IMPORTED)
set_property(TARGET skshaper PROPERTY IMPORTED_LOCATION "${SKIA_LIBS_PATH}/libskshaper.a")


find_library(
        LOG_LIB
        log
)

find_library(
         JSI_LIB
         jsi
         PATHS ${LIBRN_DIR}
         NO_CMAKE_FIND_ROOT_PATH
 )
 if(${REACT_NATIVE_VERSION} LESS 66)
         # JSI lib didn't exist on RN 0.65 and before. Simply omit it.
         set (JSI_LIB "")
 else()
         # RN 0.66 distributes libjsi.so, can be used instead of compiling jsi.cpp manually.
         find_library(
                 JSI_LIB
                 jsi
                 PATHS ${LIBRN_DIR}
                 NO_CMAKE_FIND_ROOT_PATH
         )
 endif()

find_library(
        REACT_LIB
        react_nativemodule_core
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)

find_library(
        FBJNI_LIBRARY 
        fbjni 
        PATHS ${libfbjni_link_DIRS}
        NO_CMAKE_FIND_ROOT_PATH
)

find_library(
        TURBOMODULES_LIB
        turbomodulejsijni
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)

# Link
target_link_libraries(
        ${PACKAGE_NAME}
        ${LOG_LIB}
        ${FBJNI_LIBRARY}
        ${REACT_LIB}
        ${JSI_LIB}
        ${TURBOMODULES_LIB}
        ${SKIA_SVG_LIB}
        ${SKIA_SKSHAPER_LIB}
        ${SKIA_LIB}
        -ljnigraphics
        -lGLESv2
        -lEGL
        -landroid
    )