/*
 * Copyright 2017 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SKSL_STRING
#define SKSL_STRING

#include "include/core/SkTypes.h"
#include "include/private/SkSLDefines.h"

#include <stdarg.h>
#include <string>
#include <string_view>

namespace SkSL {

bool stod(std::string_view s, SKSL_FLOAT* value);
bool stoi(std::string_view s, SKSL_INT* value);

namespace String {

std::string printf(const char* fmt, ...) SK_PRINTF_LIKE(1, 2);
void appendf(std::string* str, const char* fmt, ...) SK_PRINTF_LIKE(2, 3);
void vappendf(std::string* str, const char* fmt, va_list va) SK_PRINTF_LIKE(2, 0);

}  // namespace String
}  // namespace SkSL

namespace skstd {

// We use a custom to_string(float|double) which ignores locale settings and writes `1.0` instead
// of `1.00000`.
std::string to_string(float value);
std::string to_string(double value);

}  // namespace skstd

#endif
