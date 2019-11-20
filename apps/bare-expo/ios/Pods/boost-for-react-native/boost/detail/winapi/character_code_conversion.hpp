//  character_code_conversion.hpp  --------------------------------------------------------------//

//  Copyright 2016 Andrey Semashev

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt


#ifndef BOOST_DETAIL_WINAPI_CHARACTER_CODE_CONVERSION_HPP
#define BOOST_DETAIL_WINAPI_CHARACTER_CODE_CONVERSION_HPP

#include <boost/detail/winapi/basic_types.hpp>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

#if !defined( BOOST_USE_WINDOWS_H )
extern "C" {

BOOST_SYMBOL_IMPORT int WINAPI
MultiByteToWideChar(
    boost::detail::winapi::UINT_ CodePage,
    boost::detail::winapi::DWORD_ dwFlags,
    boost::detail::winapi::LPCSTR_ lpMultiByteStr,
    int cbMultiByte,
    boost::detail::winapi::LPWSTR_ lpWideCharStr,
    int cchWideChar);

BOOST_SYMBOL_IMPORT int WINAPI
WideCharToMultiByte(
    boost::detail::winapi::UINT_ CodePage,
    boost::detail::winapi::DWORD_ dwFlags,
    boost::detail::winapi::LPCWSTR_ lpWideCharStr,
    int cchWideChar,
    boost::detail::winapi::LPSTR_ lpMultiByteStr,
    int cbMultiByte,
    boost::detail::winapi::LPCSTR_ lpDefaultChar,
    boost::detail::winapi::LPBOOL_ lpUsedDefaultChar);

} // extern "C"
#endif // #if !defined( BOOST_USE_WINDOWS_H )

namespace boost {
namespace detail {
namespace winapi {

#if defined( BOOST_USE_WINDOWS_H )

const UINT_ CP_ACP_ = CP_ACP;
const UINT_ CP_OEMCP_ = CP_OEMCP;
const UINT_ CP_MACCP_ = CP_MACCP;
const UINT_ CP_THREAD_ACP_ = CP_THREAD_ACP;
const UINT_ CP_SYMBOL_ = CP_SYMBOL;
const UINT_ CP_UTF7_ = CP_UTF7;
const UINT_ CP_UTF8_ = CP_UTF8;

const DWORD_ MB_PRECOMPOSED_ = MB_PRECOMPOSED;
const DWORD_ MB_COMPOSITE_ = MB_COMPOSITE;
const DWORD_ MB_USEGLYPHCHARS_ = MB_USEGLYPHCHARS;
const DWORD_ MB_ERR_INVALID_CHARS_ = MB_ERR_INVALID_CHARS;

const DWORD_ WC_COMPOSITECHECK_ = WC_COMPOSITECHECK;
const DWORD_ WC_DISCARDNS_ = WC_DISCARDNS;
const DWORD_ WC_SEPCHARS_ = WC_SEPCHARS;
const DWORD_ WC_DEFAULTCHAR_ = WC_DEFAULTCHAR;
#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN2K
const DWORD_ WC_NO_BEST_FIT_CHARS_ = WC_NO_BEST_FIT_CHARS;
#endif

#else // defined( BOOST_USE_WINDOWS_H )

const UINT_ CP_ACP_ = 0u;
const UINT_ CP_OEMCP_ = 1u;
const UINT_ CP_MACCP_ = 2u;
const UINT_ CP_THREAD_ACP_ = 3u;
const UINT_ CP_SYMBOL_ = 42u;
const UINT_ CP_UTF7_ = 65000u;
const UINT_ CP_UTF8_ = 65001u;

const DWORD_ MB_PRECOMPOSED_ = 0x00000001;
const DWORD_ MB_COMPOSITE_ = 0x00000002;
const DWORD_ MB_USEGLYPHCHARS_ = 0x00000004;
const DWORD_ MB_ERR_INVALID_CHARS_ = 0x00000008;

const DWORD_ WC_COMPOSITECHECK_ = 0x00000200;
const DWORD_ WC_DISCARDNS_ = 0x00000010;
const DWORD_ WC_SEPCHARS_ = 0x00000020;
const DWORD_ WC_DEFAULTCHAR_ = 0x00000040;
#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN2K
const DWORD_ WC_NO_BEST_FIT_CHARS_ = 0x00000400;
#endif

#endif // defined( BOOST_USE_WINDOWS_H )

#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6
// This constant is not present in MinGW
const DWORD_ WC_ERR_INVALID_CHARS_ = 0x00000080;
#endif

using ::MultiByteToWideChar;
using ::WideCharToMultiByte;

} // namespace winapi
} // namespace detail
} // namespace boost

#endif // BOOST_DETAIL_WINAPI_CHARACTER_CODE_CONVERSION_HPP
