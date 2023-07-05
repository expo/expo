#[[
cd build
cmake -Bbuild/win64 -H. -G "Visual Studio 15 2017 Win64"
cmake -Bbuild/win32 -H. -G "Visual Studio 15 2017"
cmake -Bbuild/mac -H. -G "Xcode"
cmake -Bbuild/linux -H.

cmake --build build/win64 --config Release
]]

# Version of SVGNativeViewerLib based on semver (major-, minor-, patch-release)
set(VERSION "0.9.0")

cmake_minimum_required(VERSION 3.11.0)
if (CMAKE_VERSION VERSION_GREATER "3.15")
    cmake_policy(SET CMP0091 NEW)
endif()

set(CMAKE_MODULE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/cmake")
project(SVGNativeViewer)
enable_language(CXX)
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_VISIBILITY_PRESET hidden)

if("${CMAKE_CXX_COMPILER_ID}" STREQUAL "GNU")
    if (CMAKE_CXX_COMPILER_VERSION VERSION_LESS 4.8.1)
        message(FATAL_ERROR "Minimum supported GCC version: 4.8.1. Currently used version: ${CMAKE_CXX_COMPILER_VERSION}")
    endif()
endif()
message(STATUS "CMAKE_VERSION: ${CMAKE_VERSION}")
message(STATUS "CMAKE_GENERATOR: ${CMAKE_GENERATOR}")
message(STATUS "CMAKE_SYSTEM_NAME: ${CMAKE_SYSTEM_NAME}")
message(STATUS "CMAKE_BUILD_TYPE: ${CMAKE_BUILD_TYPE}")
message(STATUS "CMAKE_CXX_COMPILER: ${CMAKE_CXX_COMPILER}")
message(STATUS "CMAKE_CXX_COMPILER_VERSION: ${CMAKE_CXX_COMPILER_VERSION}")

################################
# CMake Arguments
################################
include(CMakeDependentOption)

option(LIB_ONLY "Create a project for library only" OFF)
option(SHARED "Make library dynamic")
option(PLATFORM_XML "Uses the XML parser provided by the platform" OFF)

option(TEXT "Enable Text port for testing" ON)
option(CG "Enable CoreGraphics/Quartz2D port")
option(SKIA "Enable Skia port")
option(GDIPLUS "Enable GDI+ port")
option(D2D "Enable Direct2D port")
option(STYLE "Enable deprecated CSS Styling support")
option(CAIRO "Enable Cairo port")
option(TESTING "Enable automated testing using Google Tests" ON)

CMAKE_DEPENDENT_OPTION(USE_SHARED "Dynamic library" TRUE "SHARED" FALSE)
CMAKE_DEPENDENT_OPTION(USE_PLATFORM_XML "Platform XML parser" TRUE "PLATFORM_XML" FALSE)

CMAKE_DEPENDENT_OPTION(USE_TEXT "Text port for testing" TRUE "TEXT" FALSE)
CMAKE_DEPENDENT_OPTION(USE_CG "CoreGraphics needs to be enabled and run on macOS/iOS" TRUE "APPLE;CG" FALSE)
CMAKE_DEPENDENT_OPTION(USE_SKIA "Skia" TRUE "SKIA" FALSE)
CMAKE_DEPENDENT_OPTION(USE_GDIPLUS "GDI+ port" TRUE "MSVC;GDIPLUS" FALSE)
CMAKE_DEPENDENT_OPTION(USE_D2D "Direct2D port" TRUE "MSVC;D2D" FALSE)
CMAKE_DEPENDENT_OPTION(USE_CAIRO "Cairo" TRUE "CAIRO" FALSE)

CMAKE_DEPENDENT_OPTION(USE_TEXT_EXAMPLE "Text port for testing" TRUE "NOT LIB_ONLY;TEXT" FALSE)
CMAKE_DEPENDENT_OPTION(USE_C_EXAMPLE "C Wrapper port for demonstration" TRUE "NOT LIB_ONLY;TEXT" FALSE)
CMAKE_DEPENDENT_OPTION(USE_CG_EXAMPLE "CoreGraphics needs to be enabled and run on macOS/iOS" TRUE "NOT LIB_ONLY;USE_CG" FALSE)
CMAKE_DEPENDENT_OPTION(USE_SKIA_EXAMPLE "Skia" TRUE "NOT LIB_ONLY;SKIA" FALSE)
CMAKE_DEPENDENT_OPTION(USE_GDIPLUS_EXAMPLE "GDI+ example app" TRUE "NOT LIB_ONLY;GDIPLUS" FALSE)
CMAKE_DEPENDENT_OPTION(USE_D2D_EXAMPLE "Direct2D example app" TRUE "NOT LIB_ONLY;D2D" FALSE)
CMAKE_DEPENDENT_OPTION(USE_CAIRO_EXAMPLE "Cairo example" TRUE "NOT LIB_ONLY;CAIRO" FALSE)

find_package(PkgConfig)

################################
# setting for Skia
################################
if(SKIA)
    set(CMAKE_CXX_STANDARD 14)
    include(FindSkia)
    if (NOT SKIA_AVAILABLE)
        message(FATAL_ERROR "Fatal error: Skia port is requested, but no usable Skia library was found.")
    endif()
endif()

################################
# setting for Cairo
################################
if(CAIRO)
    # cmake wants to have full pathname of libcairo, instead of compiler flags.
    # thus FindCairo.cmake works better than pkg_check_modules(CAIRO cairo)
    include(FindCairo)
    if(NOT CAIRO_FOUND)
        message(FATAL_ERROR "Fatal error: Cairo port is requested, but CAIRO developers' files are missing.")
    else()
       # FindJPEG.cmake does not use pkg-config, we do as FindCairo.cmake.
       pkg_check_modules(PC_JPEG libjpeg)
       if (PC_JPEG_FOUND)
           FIND_PATH(JPEG_INCLUDE_DIRS NAMES jpeglib.h HINTS ${PC_JPEG_INCLUDEDIR})
           FIND_LIBRARY(JPEG_LIBRARY NAMES jpeg HINTS ${PC_JPEG_LIBDIR})
       else()
           include(FindJPEG)
       endif()
       if (NOT PC_JPEG_FOUND AND NOT JPEG_FOUND)
           message(FATAL_ERROR "Fatal error: Cairo port requires LIBJPEG developers' files.")
       endif()
    endif()
endif()

################################
# Other Attributes
################################
if(EXISTS "${CMAKE_TOOLCHAIN_FILE}")
    # do not apply any global settings if the toolchain
    # is being configured externally
elseif(MSVC)
    #add_definitions(/FI"${CMAKE_CURRENT_SOURCE_DIR}/public/include/CloudAI/ai/ASConfig.h")
    # Visual Studio pedantic build settings
    # warning C4512: assignment operator could not be generated
    # warning C4316: object allocated on the heap may not be aligned
    # set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /W4 /WX /wd4512 /wd4316")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /Zp8")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /we4302 /we4189")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /wd4290 /wd4335 /wd4355 /wd4814 /wd4091 /TP")
    if (NOT USE_SKIA)
        set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /std:c++11")
    endif()
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /Zc:sizedDealloc-")

    if (DEFINED WIN32_OBJECT_TYPE)
        if (CMAKE_VERSION VERSION_LESS "3.15")
            message(STATUS "CMake is too old (< 3.15), maybe output project file has wrong switch in /MT or /MD.")
            set(CMAKE_C_FLAGS_DEBUG "${CMAKE_C_FLAGS_DEBUG} ${WIN32_OBJECT_TYPE}d")
            set(CMAKE_C_FLAGS_RELEASE "${CMAKE_C_FLAGS_RELEASE} ${WIN32_OBJECT_TYPE}")
            set(CMAKE_C_FLAGS_RELWITHDEBINFO "${CMAKE_C_FLAGS_RELEASE} ${WIN32_OBJECT_TYPE}")
            set(CMAKE_C_FLAGS_MINSIZEREL "${CMAKE_C_FLAGS_RELEASE} ${WIN32_OBJECT_TYPE}")
        elseif(WIN32_OBJECT_TYPE STREQUAL "/MT")
            set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
        elseif(WIN32_OBJECT_TYPE STREQUAL "/MD")
            set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>DLL")
        endif()
    endif()
elseif(APPLE)
    # GCC or Clang
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -stdlib=libc++")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -pedantic -Wextra")
else()
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -pedantic -Wextra")
endif()
message(STATUS "CMAKE_CXX_STANDARD: ${CMAKE_CXX_STANDARD}")

set(dll_version)
if(WIN32)
    set(dll_version ${dll_version} src/win/version.rc)

    string(REPLACE "." "," VER_FILEVERSION ${VERSION})

    add_definitions(-DVER_FILEVERSION=${VER_FILEVERSION})
    add_definitions(-DVER_FILEVERSION_STR="${VERSION}")
    add_definitions(-DVER_PRODUCTVERSION=${VER_FILEVERSION})
    add_definitions(-DVER_PRODUCTVERSION_STR="${VERSION}")

endif()

if(STYLE)
    # Enable CSS style support. This feature is deprecated and will get removed.
    add_definitions(-DSTYLE_SUPPORT)
endif()
# Expose CMake definitions as preprocessor macros
if(USE_CAIRO)
    add_definitions(-DUSE_CAIRO)
endif()
if(USE_CG)
    add_definitions(-DUSE_CG)
endif()
if(USE_GDIPLUS)
    add_definitions(-DUSE_GDIPLUS)
endif()
if(USE_D2D)
    add_definitions(-DUSE_D2D)
endif()
if (USE_SKIA)
    add_definitions(-DUSE_SKIA)
endif()
if(USE_TEXT)
    add_definitions(-DUSE_TEXT)
endif()


##############################
# Demo/Testing applications
##############################
if(USE_TEXT_EXAMPLE)
    add_subdirectory(example/testText)
endif()
if(USE_CG_EXAMPLE)
    add_subdirectory(example/testCocoaCG)
endif()
if (USE_SKIA_EXAMPLE)
    add_subdirectory(example/testSkia)
endif()
if (USE_GDIPLUS_EXAMPLE)
    add_subdirectory(example/testGDIPlus)
endif()
if (USE_D2D_EXAMPLE)
    add_subdirectory(example/testD2D)
endif()
if (USE_C_EXAMPLE)
    add_subdirectory(example/testC)
endif()
if (USE_CAIRO_EXAMPLE)
    add_subdirectory(example/testCairo)
endif()

##############################
# CPP and Headers for Library
##############################
file(GLOB gl_public
    include/SVGDocument.h
    include/SVGNativeCWrapper.h
    include/SVGRenderer.h
    include/Rect.h
)
file(GLOB gl_source
    src/Constants.h
    src/SVGDocumentImpl.h
    src/SVGDocumentImpl.cpp
    src/SVGDocument.cpp
    src/Rect.cpp
    src/SVGRenderer.cpp
    src/Interval.h
    src/Interval.cpp
    src/SVGNativeCWrapper.cpp
    src/SVGParserArcToCurve.cpp
    src/SVGStringParser.h
    src/SVGStringParser.cpp
)

set(gl_deprecated_styling)
if(STYLE)
file(GLOB gl_deprecated_styling
    src/DeprecatedSVGDocumentImpl.cpp
)
endif()

#####################################################
# Rendering ports, and collect gl_headers to install
#####################################################
file(GLOB gl_headers ${PROJECT_SOURCE_DIR}/include/*.h)

set(text_port)
if(USE_TEXT)
file(GLOB text_port
    src/ports/string/StringSVGRenderer.h
    src/ports/string/StringSVGRenderer.cpp
)
set(gl_headers ${gl_headers} ${PROJECT_SOURCE_DIR}/ports/string/StringSVGRenderer.h)
endif()

set(cg_port)
if(USE_CG)
file(GLOB cg_port
    src/ports/cg/CGSVGRenderer.h
    src/ports/cg/CGSVGRenderer.cpp
    ../third_party/cpp-base64/base64.h
    ../third_party/cpp-base64/base64.cpp
)
set(gl_headers ${gl_headers} ${PROJECT_SOURCE_DIR}/ports/cg/CGSVGRenderer.h)
endif()

set(skia_port)
if (USE_SKIA)
file(GLOB skia_port
    src/ports/skia/SkiaSVGRenderer.h
    src/ports/skia/SkiaSVGRenderer.cpp
    ../third_party/cpp-base64/base64.h
    ../third_party/cpp-base64/base64.cpp
)
set(gl_headers ${gl_headers} ${PROJECT_SOURCE_DIR}/ports/skia/SkiaSVGRenderer.h)
if (NOT MSVC)
    set_source_files_properties(ports/skia/SkiaSVGRenderer.cpp PROPERTIES COMPILE_FLAGS -Wno-pedantic)
endif()
endif()

set(gdiplus_port)
if (USE_GDIPLUS)
file(GLOB gdiplus_port
    src/ports/gdiplus/GDIPlusSVGRenderer.h
    src/ports/gdiplus/GDIPlusSVGRenderer.cpp
    ../third_party/cpp-base64/base64.h
    ../third_party/cpp-base64/base64.cpp
)
set(gl_headers ${gl_headers} ${PROJECT_SOURCE_DIR}/ports/gdiplus/GDIPlusSVGRenderer.h)
endif()

set(d2d_port)
if (USE_D2D)
file(GLOB d2d_port
    src/ports/d2d/D2DSVGRenderer.h
    src/ports/d2d/D2DSVGRenderer.cpp
    ../third_party/cpp-base64/base64.h
    ../third_party/cpp-base64/base64.cpp
)
set(gl_headers ${gl_headers} ${PROJECT_SOURCE_DIR}/ports/d2d/D2DSVGRenderer.h)
endif()

set(cairo_port)
if (USE_CAIRO)
file(GLOB cairo_port
    src/ports/cairo/CairoSVGRenderer.h
    src/ports/cairo/CairoSVGRenderer.cpp
    src/ports/cairo/CairoImageInfo.h
    src/ports/cairo/CairoImageInfo.c
    ../third_party/cpp-base64/base64.h
    ../third_party/cpp-base64/base64.cpp
)
set(gl_headers ${gl_headers} ${PROJECT_SOURCE_DIR}/ports/cairo/CairoSVGRenderer.h)
endif()

##############################
# XML parser
##############################

set(XML_PARSER_SOURCE "src/xml/RapidXMLParser.cpp")
if (USE_PLATFORM_XML)
include(FindEXPAT)
find_package(EXPAT)
if (EXPAT_FOUND)
    set(XML_PARSER_SOURCE "src/xml/ExpatXMLParser.cpp")
else()
find_package(LibXml2)
if (LIBXML2_FOUND)
    set(XML_PARSER_SOURCE "src/xml/LibXMLParser.cpp")
endif(LIBXML2_FOUND)
endif(EXPAT_FOUND)
endif(USE_PLATFORM_XML)

file(GLOB xml_parser
    src/xml/XMLParser.h
    ${XML_PARSER_SOURCE}
)

##############################
# Library settings
##############################
set(svgNative_src
    ${gl_public}
    ${gl_deprecated_styling}
    ${gl_source}
    ${text_port}
    ${cg_port}
    ${skia_port}
    ${gdiplus_port}
    ${d2d_port}
    ${cairo_port}
    ${dll_version}
    ${xml_parser}
)

if (USE_SHARED)
add_definitions(-DBUILDING_DLL)
add_library(SVGNativeViewerLib SHARED ${svgNative_src})
else()
add_library(SVGNativeViewerLib STATIC ${svgNative_src})
endif()

##############################
# Header search paths
##############################
target_include_directories(SVGNativeViewerLib PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}/include")
target_include_directories(SVGNativeViewerLib PRIVATE "${CMAKE_CURRENT_SOURCE_DIR}/src")
if(STYLE)
target_include_directories(SVGNativeViewerLib PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}/../third_party/stylesheet/include")
endif()
if (USE_CG)
target_include_directories(SVGNativeViewerLib PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}/../third_party/cpp-base64")
endif()
if (USE_SKIA)
if (NOT DEFINED SKIA_SOURCE_DIR)
    set(SKIA_SOURCE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../third_party/skia")
endif()
target_include_directories(SVGNativeViewerLib PUBLIC "${SKIA_SOURCE_DIR}")
target_include_directories(SVGNativeViewerLib PUBLIC "${SKIA_SOURCE_DIR}/include/codec")
target_include_directories(SVGNativeViewerLib PUBLIC "${SKIA_SOURCE_DIR}/include/config")
target_include_directories(SVGNativeViewerLib PUBLIC "${SKIA_SOURCE_DIR}/include/core")
target_include_directories(SVGNativeViewerLib PUBLIC "${SKIA_SOURCE_DIR}/include/effects")
target_include_directories(SVGNativeViewerLib PUBLIC "${SKIA_SOURCE_DIR}/include/encode")
target_include_directories(SVGNativeViewerLib PUBLIC "${SKIA_SOURCE_DIR}/include/gpu")
target_include_directories(SVGNativeViewerLib PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}/../third_party/cpp-base64")
endif()
if (USE_GDIPLUS)
target_include_directories(SVGNativeViewerLib PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}/../third_party/cpp-base64")
endif()
if (USE_D2D)
target_include_directories(SVGNativeViewerLib PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}/../third_party/cpp-base64")
endif()
if (USE_CAIRO)
target_include_directories(SVGNativeViewerLib PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}/../third_party/cpp-base64")
target_include_directories(SVGNativeViewerLib PUBLIC "${CAIRO_INCLUDE_DIRS}")
endif()

##############################
# Library search paths
##############################
set(PRIVATE_LIBS)
set(REQUIRES)
set(PRIVATE_REQUIRES)
set(PORTS_INCLUDES)

if(USE_CG)
    target_link_libraries(SVGNativeViewerLib "-framework CoreGraphics")
    target_link_libraries(SVGNativeViewerLib "-framework CoreFoundation")
    set(PRIVATE_LIBS "${PRIVATE_LIBS} -framework CoreGraphics -framework CoreFoundation")
    set(PORTS_INCLUDES "${PORTS_INCLUDES} -I\${includedir}/ports/cg")
endif()

if (USE_SKIA)
    target_link_libraries(SVGNativeViewerLib "${SKIA_LIBRARY_PATH}")
    set(PRIVATE_LIBS "${PRIVATE_LIBS} ${SKIA_LIBRARY_LDFLAGS}")
    set(PORTS_INCLUDES "${PORTS_INCLUDES} -I\${includedir}/ports/skia")
endif()

if (USE_GDIPLUS)
    target_link_libraries(SVGNativeViewerLib "gdiplus.lib")
    set(PRIVATE_LIBS "${PRIVATE_LIBS} gdiplus.lib")
endif()

if (USE_D2D)
    target_link_libraries(SVGNativeViewerLib "d2d1.lib")
    set(PRIVATE_LIBS "${PRIVATE_LIBS} d2d1.lib")
endif()

if (USE_CAIRO)
    target_link_libraries(SVGNativeViewerLib "${CAIRO_LIBRARIES}")
    target_link_libraries(SVGNativeViewerLib "${JPEG_LIBRARY}")
    target_include_directories(SVGNativeViewerLib PUBLIC "${CAIRO_INCLUDE_DIRS}")
    target_include_directories(SVGNativeViewerLib PRIVATE "${JPEG_INCLUDE_DIRS}")
    set(PRIVATE_REQUIRES "${PRIVATE_REQUIRES} cairo")
    set(PORTS_INCLUDES "${PORTS_INCLUDES} -I\${includedir}/ports/cairo")

    # sometimes JPEG is not managed by pkg-config
    if (PC_JPEG_FOUND)
        set(PRIVATE_REQUIRES "${PRIVATE_REQUIRES} libjpeg")
    else()
        get_filename_component(JPEG_LIBRARY_DIR ${JPEG_LIBRARY} DIRECTORY)
        set(PRIVATE_LIBS "${PRIVATE_LIBS} -L${JPEG_LIBRARY_DIR} -ljpeg")
    endif()
endif()

if (EXPAT_FOUND)
    target_link_libraries(SVGNativeViewerLib "${EXPAT_LIBRARIES}")
    target_include_directories(SVGNativeViewerLib PUBLIC  "${EXPAT_INCLUDE_DIRS}")
    if (PC_EXPAT_VERSION) # if expat is managed by pkg-config
        set(PRIVATE_REQUIRES "${PRIVATE_REQUIRES} expat")
    else() # if expat is out of pkg-config
        get_filename_component(EXPAT_LIB_DIR "${EXPAT_LIBRARIES}" DIRECTORY)
        set(PRIVATE_LIBS "${PRIVATE_LIBS} -L${EXPAT_LIB_DIR} -lexpat")
    endif()
endif(EXPAT_FOUND)

if (LIBXML2_FOUND)
    target_link_libraries(SVGNativeViewerLib "${LIBXML2_LIBRARIES}")
    target_include_directories(SVGNativeViewerLib PUBLIC  "${LIBXML2_INCLUDE_DIR}")
    if (PC_LIBXML_VERSION) # if libxml2 is managed by pkg-config
        set(PRIVATE_REQUIRES "${PRIVATE_REQUIRES} libxml-2.0")
    else() # if libxml2 is out of pkg-config
        get_filename_component(LIBXML2_LIB_DIR "${LIBXML2_LIBRARY}" DIRECTORY)
        set(PRIVATE_LIBS "${PRIVATE_LIBS} -L${LIBXML2_LIB_DIR} -lxml2")
    endif()
endif(LIBXML2_FOUND)

# CMake has no additional file to record the dependency for the static library,
# we have to put direct dependencies into pkg-config files.
if (NOT USE_SHARED)
    set(REQUIRES "${PRIVATE_REQUIRES}")
    set(PRIVATE_REQUIRES "")
endif()

set_target_properties(SVGNativeViewerLib PROPERTIES LINKER_LANGUAGE CXX)

# Give system or user provided Boost version precedence 
set(Boost_USE_STATIC_LIBS OFF)
find_package(Boost)
if(NOT Boost_FOUND)
    message(STATUS "Falling back to minimal boost")
    set(BOOST_INCLUDEDIR ${CMAKE_CURRENT_SOURCE_DIR}/../third_party/boost_variant_property_tree/)
    set(BOOST_ROOT ${CMAKE_CURRENT_SOURCE_DIR}/../third_party/boost_variant_property_tree/boost/)
    find_package(Boost)
    if(NOT Boost_FOUND)
        message(FATAL_ERROR "Fatal error: Boost (version >= 1.55) required.")
    endif()
endif()
if(Boost_FOUND)
    target_include_directories(SVGNativeViewerLib PUBLIC ${Boost_INCLUDE_DIRS})
endif()

##############################
# Creating pkg-config file
##############################
include(GNUInstallDirs)

set(BINARY_DIR "${CMAKE_CURRENT_BINARY_DIR}")
set(SOURCE_DIR "${CMAKE_CURRENT_SOURCE_DIR}")
set(CMAKE_INSTALL_PREFIX "${CMAKE_INSTALL_PREFIX}")
set(CMAKE_INSTALL_BINDIR "${CMAKE_INSTALL_BINDIR}")
set(CMAKE_INSTALL_LIBDIR "${CMAKE_INSTALL_LIBDIR}")
set(CMAKE_INSTALL_INCLUDEDIR "${CMAKE_INSTALL_INCLUDEDIR}")
set(PRIVATE_LIBS "${PRIVATE_LIBS}")
set(REQUIRES "${REQUIRES}")
set(PRIVATE_REQUIRES "${PRIVATE_REQUIRES}")
set(PORTS_INCLUDES "${PORTS_INCLUDES}")
set(HEADER_SUBDIR "svgnative")
CONFIGURE_FILE("${CMAKE_CURRENT_SOURCE_DIR}/SVGNativeViewerLib.pc.in"
               "${CMAKE_CURRENT_BINARY_DIR}/SVGNativeViewerLib.pc" @ONLY)
CONFIGURE_FILE("${CMAKE_CURRENT_SOURCE_DIR}/SVGNativeViewerLib-uninstalled.pc.in"
               "${CMAKE_CURRENT_BINARY_DIR}/SVGNativeViewerLib-uninstalled.pc" @ONLY)


################################
# setup Google Test for testing
################################
if (TESTING)
    enable_testing()
    include(FetchContent)
    # FetchContent_Declare(googletest GIT_REPOSITORY https://github.com/google/googletest.git)    
    FetchContent_Declare(googletest URL https://github.com/google/googletest/archive/e2239ee6043f73722e7aa812a459f54a28552929.zip)    
    # For Windows: Prevent overriding the parent project's compiler/linker settings
    set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
    message(STATUS "Fetching Google Test framework for automated testing")
    FetchContent_MakeAvailable(googletest)
    message(STATUS "Successfully fetched Google Test framework")
    add_subdirectory(tests)
endif()

##############################
# Installation
##############################

# library
install(
    TARGETS SVGNativeViewerLib
    EXPORT SVGNativeViewerLib-targets
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
    COMPONENT libraries)

# headers
install(
    FILES ${gl_headers}
    DESTINATION ${CMAKE_INSTALL_INCLUDEDIR}/${HEADER_SUBDIR}
    COMPONENT headers)

# pkg-config file
install(
    FILES ${CMAKE_CURRENT_BINARY_DIR}/SVGNativeViewerLib.pc
    DESTINATION ${CMAKE_INSTALL_LIBDIR}/pkgconfig
    COMPONENT pkgconfig)

