cmake_minimum_required(VERSION 3.16)

project(appmodules)

include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)

set(PCH_HEADER "${CMAKE_CURRENT_SOURCE_DIR}/pch.h")

add_library(appmodules_pch STATIC EXCLUDE_FROM_ALL "${CMAKE_CURRENT_SOURCE_DIR}/appmodules_pch_owner.cpp")

# Apply the exact same compile options codegen targets get from RN's
target_compile_reactnative_options(appmodules_pch PRIVATE)

# Link dependencies needed by our PCH header
target_link_libraries(appmodules_pch PRIVATE common_flags reactnative jsi folly_runtime fbjni)

# Stop Clang from embedding a build timestamp in the .pch. Without this the PCH
# is non-reproducible across builds, so ccache can't reuse it and dependent
# translation units reject a restored PCH as "modified since built".
target_compile_options(appmodules_pch PRIVATE
  "$<$<COMPILE_LANGUAGE:CXX>:-Xclang;-fno-pch-timestamp>"
)

target_precompile_headers(appmodules_pch PRIVATE
  "$<$<COMPILE_LANGUAGE:CXX>:${PCH_HEADER}>"
)

function(add_pch_if_eligible target)
  if (NOT TARGET ${target})
    return()
  endif ()

  get_target_property(is_imported ${target} IMPORTED)
  if (is_imported)
    return()
  endif ()

  get_target_property(target_type ${target} TYPE)
  if (target_type STREQUAL "INTERFACE_LIBRARY")
    return()
  endif ()

  # Keep the flag consistent with the PCH owner - see the note above.
  target_compile_options(${target} PRIVATE
    "$<$<COMPILE_LANGUAGE:CXX>:-Xclang;-fno-pch-timestamp>"
  )

  target_precompile_headers(${target} REUSE_FROM appmodules_pch)
endfunction()

if (DEFINED AUTOLINKED_LIBRARIES)
  foreach (lib IN LISTS AUTOLINKED_LIBRARIES)
    add_pch_if_eligible(${lib})
  endforeach ()
endif ()
