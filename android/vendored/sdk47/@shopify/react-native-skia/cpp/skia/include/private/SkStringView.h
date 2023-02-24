/*
 * Copyright 2021 Google LLC.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkStringView_DEFINED
#define SkStringView_DEFINED

#include <string.h>
#include <string_view>

namespace skstd {

// C++20 additions
inline constexpr bool starts_with(std::string_view str, std::string_view prefix) {
    if (prefix.length() > str.length()) {
        return false;
    }
    return prefix.length() == 0 || !memcmp(str.data(), prefix.data(), prefix.length());
}

inline constexpr bool starts_with(std::string_view str, std::string_view::value_type c) {
    return !str.empty() && str.front() == c;
}

inline constexpr bool ends_with(std::string_view str, std::string_view suffix) {
    if (suffix.length() > str.length()) {
        return false;
    }
    return suffix.length() == 0 || !memcmp(str.data() + str.length() - suffix.length(),
                                           suffix.data(), suffix.length());
}

inline constexpr bool ends_with(std::string_view str, std::string_view::value_type c) {
    return !str.empty() && str.back() == c;
}

// C++23 additions
inline constexpr bool contains(std::string_view str, std::string_view needle) {
    return str.find(needle) != std::string_view::npos;
}

}  // namespace skstd

#endif
