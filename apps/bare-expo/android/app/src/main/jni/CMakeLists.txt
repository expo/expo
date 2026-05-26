cmake_minimum_required(VERSION 3.16)

project(appmodules)

include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)

set(PCH_HEADER "${CMAKE_CURRENT_SOURCE_DIR}/pch.h")

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

  target_compile_options(${target} PRIVATE
    "$<$<COMPILE_LANGUAGE:CXX>:-fno-pch-timestamp>"
  )

  target_precompile_headers(${target} PRIVATE
    "$<$<COMPILE_LANGUAGE:CXX>:${PCH_HEADER}>"
  )
endfunction()

if (DEFINED AUTOLINKED_LIBRARIES)
  foreach (lib IN LISTS AUTOLINKED_LIBRARIES)
    add_pch_if_eligible(${lib})
  endforeach ()
endif ()
