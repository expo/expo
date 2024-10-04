/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/renderer/core/ABI49_0_0RawPropsPrimitives.h>

// We need to use clang pragmas inside of a macro below,
// so we need to pull out the "if" statement here.
#if __clang__
#define CLANG_PRAGMA(s) _Pragma(s)
#else
#define CLANG_PRAGMA(s)
#endif

// Get hash at compile-time. sizeof(str) - 1 == strlen
#define CONSTEXPR_RAW_PROPS_KEY_HASH(s)                   \
  ([]() constexpr->RawPropsPropNameHash {                 \
    CLANG_PRAGMA("clang diagnostic push")                 \
    CLANG_PRAGMA("clang diagnostic ignored \"-Wshadow\"") \
    return folly::hash::fnv32_buf(s, sizeof(s) - 1);      \
    CLANG_PRAGMA("clang diagnostic pop")                  \
  }())

#define RAW_PROPS_KEY_HASH(s) folly::hash::fnv32_buf(s, std::strlen(s))

// Convenience for building setProps switch statements.
// This injects `fromRawValue` into source; each file that uses
// this macro must import the proper, respective headers required.
#define RAW_SET_PROP_SWITCH_CASE(field, jsPropName)      \
  case CONSTEXPR_RAW_PROPS_KEY_HASH(jsPropName):         \
    fromRawValue(context, value, field, defaults.field); \
    return;

// Convenience for building setProps switch statements where the field name is
// the same as the string identifier
#define RAW_SET_PROP_SWITCH_CASE_BASIC(field) \
  RAW_SET_PROP_SWITCH_CASE(field, #field)

#define CASE_STATEMENT_SET_FIELD_VALUE_INDEXED(         \
    struct, field, fieldNameString, value)              \
  case CONSTEXPR_RAW_PROPS_KEY_HASH(fieldNameString): { \
    if (!value.hasValue()) {                            \
      decltype(struct) defaultValues{};                 \
      struct.field = defaultValues.field;               \
      return;                                           \
    }                                                   \
    fromRawValue(context, value, struct.field);         \
    return;                                             \
  }

#define SET_CASCADED_RECTANGLE_CORNERS(struct, prefix, suffix, rawValue) \
  CASE_STATEMENT_SET_FIELD_VALUE_INDEXED(                                \
      struct, topLeft, prefix "TopLeft" suffix, rawValue)                \
  CASE_STATEMENT_SET_FIELD_VALUE_INDEXED(                                \
      struct, topRight, prefix "TopRight" suffix, rawValue)              \
  CASE_STATEMENT_SET_FIELD_VALUE_INDEXED(                                \
      struct, bottomLeft, prefix "BottomLeft" suffix, rawValue)          \
  CASE_STATEMENT_SET_FIELD_VALUE_INDEXED(                                \
      struct, bottomRight, prefix "BottomRight" suffix, rawValue)        \
  CASE_STATEMENT_SET_FIELD_VALUE_INDEXED(                                \
      struct, topStart, prefix "TopStart" suffix, rawValue)              \
  CASE_STATEMENT_SET_FIELD_VALUE_INDEXED(                                \
      struct, topEnd, prefix "TopEnd" suffix, rawValue)                  \
  CASE_STATEMENT_SET_FIELD_VALUE_INDEXED(                                \
      struct, bottomStart, prefix "BottomStart" suffix, rawValue)        \
  CASE_STATEMENT_SET_FIELD_VALUE_INDEXED(                                \
      struct, bottomEnd, prefix "BottomEnd" suffix, rawValue)            \
  CASE_STATEMENT_SET_FIELD_VALUE_INDEXED(                                \
      struct, all, prefix "" suffix, rawValue)                           \
  CASE_STATEMENT_SET_FIELD_VALUE_INDEXED(                                \
      struct, endEnd, prefix "EndEnd" suffix, rawValue)                  \
  CASE_STATEMENT_SET_FIELD_VALUE_INDEXED(                                \
      struct, endStart, prefix "EndStart" suffix, rawValue)              \
  CASE_STATEMENT_SET_FIELD_VALUE_INDEXED(                                \
      struct, startEnd, prefix "StartEnd" suffix, rawValue)              \
  CASE_STATEMENT_SET_FIELD_VALUE_INDEXED(                                \
      struct, startStart, prefix "StartStart" suffix, rawValue)

#define SET_CASCADED_RECTANGLE_EDGES(struct, prefix, suffix, rawValue) \
  CASE_STATEMENT_SET_FIELD_VALUE_INDEXED(                              \
      struct, left, prefix "Left" suffix, rawValue)                    \
  CASE_STATEMENT_SET_FIELD_VALUE_INDEXED(                              \
      struct, right, prefix "Right" suffix, rawValue)                  \
  CASE_STATEMENT_SET_FIELD_VALUE_INDEXED(                              \
      struct, top, prefix "Top" suffix, rawValue)                      \
  CASE_STATEMENT_SET_FIELD_VALUE_INDEXED(                              \
      struct, bottom, prefix "Bottom" suffix, rawValue)                \
  CASE_STATEMENT_SET_FIELD_VALUE_INDEXED(                              \
      struct, start, prefix "Start" suffix, rawValue)                  \
  CASE_STATEMENT_SET_FIELD_VALUE_INDEXED(                              \
      struct, end, prefix "End" suffix, rawValue)                      \
  CASE_STATEMENT_SET_FIELD_VALUE_INDEXED(                              \
      struct, horizontal, prefix "Horizontal" suffix, rawValue)        \
  CASE_STATEMENT_SET_FIELD_VALUE_INDEXED(                              \
      struct, vertical, prefix "Vertical" suffix, rawValue)            \
  CASE_STATEMENT_SET_FIELD_VALUE_INDEXED(                              \
      struct, all, prefix "" suffix, rawValue)                         \
  CASE_STATEMENT_SET_FIELD_VALUE_INDEXED(                              \
      struct, block, prefix "Block" suffix, rawValue)                  \
  CASE_STATEMENT_SET_FIELD_VALUE_INDEXED(                              \
      struct, blockEnd, prefix "BlockEnd" suffix, rawValue)            \
  CASE_STATEMENT_SET_FIELD_VALUE_INDEXED(                              \
      struct, blockStart, prefix "BlockStart" suffix, rawValue)

// Rebuild a type that contains multiple fields from a single field value
#define REBUILD_FIELD_SWITCH_CASE(                  \
    defaults, rawValue, property, field, fieldName) \
  case CONSTEXPR_RAW_PROPS_KEY_HASH(fieldName): {   \
    if ((rawValue).hasValue()) {                    \
      decltype((defaults).field) res;               \
      fromRawValue(context, rawValue, res);         \
      (property).field = res;                       \
    } else {                                        \
      (property).field = (defaults).field;          \
    }                                               \
    return;                                         \
  }
