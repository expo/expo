set(main_dir "${ANDROID_SRC_DIR}/cpp-api")
file(GLOB cpp_api "${main_dir}/*.cpp")

add_library(
  expo-modules-cpp-api
  STATIC
  ${cpp_api}
)

use_expo_common(expo-modules-cpp-api)

target_include_directories(
  expo-modules-cpp-api
  PUBLIC
  "${main_dir}"
)

target_link_libraries(
  expo-modules-cpp-api
  PRIVATE
  expo-modules-common
)
