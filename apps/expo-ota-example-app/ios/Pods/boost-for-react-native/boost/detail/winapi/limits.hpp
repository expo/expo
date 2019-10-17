//  limits.hpp  --------------------------------------------------------------//

//  Copyright 2016 Andrey Semashev

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt

#ifndef BOOST_DETAIL_WINAPI_LIMITS_HPP_
#define BOOST_DETAIL_WINAPI_LIMITS_HPP_

#include <boost/detail/winapi/basic_types.hpp>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

namespace boost {
namespace detail {
namespace winapi {

#if defined( BOOST_USE_WINDOWS_H )

const DWORD_ MAX_PATH_ = MAX_PATH;

#else

const DWORD_ MAX_PATH_ = 260;

#endif

#if defined( BOOST_USE_WINDOWS_H ) && !defined( BOOST_WINAPI_IS_MINGW )

const DWORD_ UNICODE_STRING_MAX_BYTES_ = UNICODE_STRING_MAX_BYTES;
const DWORD_ UNICODE_STRING_MAX_CHARS_ = UNICODE_STRING_MAX_CHARS;

#else

const DWORD_ UNICODE_STRING_MAX_BYTES_ = 65534;
const DWORD_ UNICODE_STRING_MAX_CHARS_ = 32767;

#endif

const DWORD_ max_path = MAX_PATH_;
const DWORD_ unicode_string_max_bytes = UNICODE_STRING_MAX_BYTES_;
const DWORD_ unicode_string_max_chars = UNICODE_STRING_MAX_CHARS_;

}
}
}

#endif // BOOST_DETAIL_WINAPI_LIMITS_HPP_
