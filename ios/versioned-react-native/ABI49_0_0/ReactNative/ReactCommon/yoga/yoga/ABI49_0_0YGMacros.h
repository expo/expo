/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef __cplusplus
#define ABI49_0_0YG_EXTERN_C_BEGIN extern "C" {
#define ABI49_0_0YG_EXTERN_C_END }
#else
#define ABI49_0_0YG_EXTERN_C_BEGIN
#define ABI49_0_0YG_EXTERN_C_END
#endif

#ifdef _WINDLL
#define WIN_EXPORT __declspec(dllexport)
#else
#define WIN_EXPORT
#endif

#ifndef YOGA_EXPORT
#ifdef _MSC_VER
#define YOGA_EXPORT
#else
#define YOGA_EXPORT __attribute__((visibility("default")))
#endif
#endif

#ifdef NS_ENUM
// Cannot use NSInteger as NSInteger has a different size than int (which is the
// default type of a enum). Therefor when linking the Yoga C library into obj-c
// the header is a missmatch for the Yoga ABI.
#define ABI49_0_0YG_ENUM_BEGIN(name) NS_ENUM(int, name)
#define ABI49_0_0YG_ENUM_END(name)
#else
#define ABI49_0_0YG_ENUM_BEGIN(name) enum name
#define ABI49_0_0YG_ENUM_END(name) name
#endif

#ifdef __cplusplus
namespace ABI49_0_0facebook {
namespace yoga {
namespace enums {

template <typename T>
constexpr int count(); // can't use `= delete` due to a defect in clang < 3.9

namespace detail {
template <int... xs>
constexpr int n() {
  return sizeof...(xs);
}
} // namespace detail

} // namespace enums
} // namespace yoga
} // namespace ABI49_0_0facebook
#endif

#define ABI49_0_0YG_ENUM_DECL(NAME, ...)                               \
  typedef ABI49_0_0YG_ENUM_BEGIN(NAME){__VA_ARGS__} ABI49_0_0YG_ENUM_END(NAME); \
  WIN_EXPORT const char* NAME##ToString(NAME);

#ifdef __cplusplus
#define ABI49_0_0YG_ENUM_SEQ_DECL(NAME, ...)  \
  ABI49_0_0YG_ENUM_DECL(NAME, __VA_ARGS__)    \
  ABI49_0_0YG_EXTERN_C_END                    \
  namespace ABI49_0_0facebook {               \
  namespace yoga {                   \
  namespace enums {                  \
  template <>                        \
  constexpr int count<NAME>() {      \
    return detail::n<__VA_ARGS__>(); \
  }                                  \
  }                                  \
  }                                  \
  }                                  \
  ABI49_0_0YG_EXTERN_C_BEGIN
#else
#define ABI49_0_0YG_ENUM_SEQ_DECL ABI49_0_0YG_ENUM_DECL
#endif

#ifdef __GNUC__
#define ABI49_0_0YG_DEPRECATED __attribute__((deprecated))
#elif defined(_MSC_VER)
#define ABI49_0_0YG_DEPRECATED __declspec(deprecated)
#elif __cplusplus >= 201402L
#if defined(__has_cpp_attribute)
#if __has_cpp_attribute(deprecated)
#define ABI49_0_0YG_DEPRECATED [[deprecated]]
#endif
#endif
#endif
