cmake_minimum_required(VERSION 3.16)
project(expo_rust_jsi_cpp_tests CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_compile_definitions(EXPO_RUST_JSI_STANDALONE)

add_executable(cpp_native_tests
    cpp_native_tests.cpp
)

target_include_directories(cpp_native_tests PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/..
)

# Threads for concurrent HandleTable test
find_package(Threads REQUIRED)
target_link_libraries(cpp_native_tests Threads::Threads)
