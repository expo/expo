# Run as custom command
if(CMAKE_SCRIPT_MODE_FILE)
  set(target_option)
  if(COMPILER_TARGET)
    set(target_option "--target=${COMPILER_TARGET}")
  endif()

  execute_process(
    COMMAND "${COMPILER}" ${target_option} -module-file-info "${PCH}"
    OUTPUT_VARIABLE info
    RESULT_VARIABLE result
  )

  if(NOT result EQUAL 0)
    # Hash the .pch itself, which is what ccache does without a .sum. The build stays correct, but
    # checkouts at different paths don't share the results of the users of this PCH.
    message(WARNING "`${COMPILER} -module-file-info ${PCH}` failed, so ccache can't share the results "
      "of the users of this PCH between checkouts at different paths.")
    file(SHA256 "${PCH}" digest)
    file(WRITE "${PCH}.sum" "${digest}\n")
    return()
  endif()

  # Remove `ShowColors` and `PCH_CCACHE_BUILD_DIR` 
  string(REGEX REPLACE "PCH_CCACHE_BUILD_DIR=[^\n]*|ShowColors: [^\n]*" "" info "${info}")

  # Get all input files
  string(REGEX MATCHALL "Input file: [^\n]*" input_files "${info}")
  foreach(input_file IN LISTS input_files)
    string(REGEX REPLACE "^Input file: | \\[[A-Za-z, ]+\\]$" "" path "${input_file}")
    if(EXISTS "${path}")
      file(SHA256 "${path}" digest)
      string(APPEND info "${digest}\n")
    endif()
  endforeach()

  # Remove base dir
  if(BASE_DIR)
    string(REGEX REPLACE "(.)/+$" "\\1" base_dir "${BASE_DIR}")
    string(REGEX REPLACE "([][+.*()^$?|\\\\])" "\\\\\\1" base_dir_regex "${base_dir}")
    # The directory itself or a path in it, followed by a space, a quote or a line break. A directory whose
    # name only starts with the same text doesn't match.
    string(REGEX MATCHALL "${base_dir_regex}(/[^ '\n]*)?[ '\n]" paths "${info}")
    list(REMOVE_DUPLICATES paths)
    foreach(path IN LISTS paths)
      string(REGEX REPLACE "[ '\n]$" "" path "${path}")
      file(RELATIVE_PATH relative_path "${BUILD_DIR}" "${path}")
      string(REGEX REPLACE "([][+.*()^$?|\\\\])" "\\\\\\1" path_regex "${path}")
      string(REGEX REPLACE "${path_regex}([ '\n])" "${relative_path}\\1" info "${info}")
    endforeach()
  endif()

  string(SHA256 digest "${info}")
  file(WRITE "${PCH}.sum" "${digest}\n")
  return()
endif()

set(PCH_CCACHE_FILE "${CMAKE_CURRENT_LIST_FILE}")

# Find ccache program if it's used by the target
function(_pch_ccache_program target out_var)
  get_target_property(launcher ${target} CXX_COMPILER_LAUNCHER)
  get_property(global_rule GLOBAL PROPERTY RULE_LAUNCH_COMPILE)
  get_property(directory_rule DIRECTORY PROPERTY RULE_LAUNCH_COMPILE)
  separate_arguments(rules UNIX_COMMAND "${global_rule} ${directory_rule}")
  get_filename_component(compiler "${CMAKE_CXX_COMPILER}" REALPATH)
  foreach(program IN LISTS launcher rules compiler)
    get_filename_component(name "${program}" NAME_WE)
    if(name STREQUAL "ccache")
      find_program(PCH_CCACHE_PROGRAM NAMES "${program}")
      set(${out_var} "${PCH_CCACHE_PROGRAM}" PARENT_SCOPE)
      return()
    endif()
  endforeach()
  set(${out_var} "" PARENT_SCOPE)
endfunction()

function(pch_ccache_owner owner)
  # CMake's location of the PCH for the Ninja and Makefile generators.
  set(pch_dir "${CMAKE_CURRENT_BINARY_DIR}/CMakeFiles/${owner}.dir")
  set(pch "${pch_dir}/cmake_pch.hxx.pch")

  # Used by the custom command
  set_property(SOURCE "${pch_dir}/cmake_pch.hxx.cxx" APPEND PROPERTY
    COMPILE_DEFINITIONS "PCH_CCACHE_BUILD_DIR=${CMAKE_CURRENT_BINARY_DIR}"
  )

  set(pch_external_checksum "")
  set(base_dir "")
  _pch_ccache_program(${owner} ccache)
  if(NOT ccache AND "$ENV{EXPO_FORCE_PCH_CCACHE_SUM}")
    # ccache runs through a wrapper, so take its configuration from the ccache on PATH
    find_program(PCH_CCACHE_PATH_PROGRAM ccache)
    set(ccache "${PCH_CCACHE_PATH_PROGRAM}")
  endif()
  if(ccache)
    foreach(option IN ITEMS pch_external_checksum base_dir)
      execute_process(
        COMMAND "${ccache}" --get-config ${option}
        OUTPUT_VARIABLE ${option}
        OUTPUT_STRIP_TRAILING_WHITESPACE
        ERROR_QUIET
      )
    endforeach()
  endif()

  if("$ENV{EXPO_FORCE_PCH_CCACHE_SUM}")
    set(pch_external_checksum "true")
  endif()

  if(NOT pch_external_checksum STREQUAL "true")
    # Remove the .sum of an earlier configuration: it can belong to an older PCH, and ccache would hash it
    # if `pch_external_checksum` is enabled later.
    file(REMOVE "${pch}.sum")
    return()
  endif()

  add_custom_command(
    OUTPUT "${pch}.sum"
    COMMAND "${CMAKE_COMMAND}"
      "-DCOMPILER=${CMAKE_CXX_COMPILER}"
      "-DCOMPILER_TARGET=${CMAKE_CXX_COMPILER_TARGET}"
      "-DPCH=${pch}"
      "-DBASE_DIR=${base_dir}"
      "-DBUILD_DIR=${CMAKE_BINARY_DIR}"
      -P "${PCH_CCACHE_FILE}"
    DEPENDS "${pch}" "${PCH_CCACHE_FILE}"
    COMMENT "Writing the ccache checksum of the ${owner} PCH"
    VERBATIM
  )
  add_custom_target(${owner}-pch-ccache-sum DEPENDS "${pch}.sum")
endfunction()

function(pch_ccache_consumer consumer owner)
  # ccache reads the .sum when it compiles a source of <consumer>, so it must be written before.
  if(TARGET ${owner}-pch-ccache-sum)
    add_dependencies(${consumer} ${owner}-pch-ccache-sum)
  endif()
endfunction()
