//  priority_class.hpp  --------------------------------------------------------------//

//  Copyright 2016 Klemens D. Morgenstern
//  Copyright 2016 Andrey Semashev

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt

#ifndef BOOST_DETAIL_WINAPI_PRIORITY_CLASS_HPP_
#define BOOST_DETAIL_WINAPI_PRIORITY_CLASS_HPP_

#include <boost/detail/winapi/basic_types.hpp>
#include <boost/predef/platform.h>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

#if BOOST_PLAT_WINDOWS_DESKTOP

#if !defined( BOOST_USE_WINDOWS_H )
extern "C" {

BOOST_SYMBOL_IMPORT boost::detail::winapi::DWORD_ WINAPI
GetPriorityClass(boost::detail::winapi::HANDLE_ hProcess);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
SetPriorityClass(
    boost::detail::winapi::HANDLE_ hProcess,
    boost::detail::winapi::DWORD_ dwPriorityClass);

} // extern "C"
#endif //defined BOOST_WINDOWS_H

namespace boost {
namespace detail {
namespace winapi {

#if defined(BOOST_USE_WINDOWS_H)

const DWORD_ NORMAL_PRIORITY_CLASS_            = NORMAL_PRIORITY_CLASS;
const DWORD_ IDLE_PRIORITY_CLASS_              = IDLE_PRIORITY_CLASS;
const DWORD_ HIGH_PRIORITY_CLASS_              = HIGH_PRIORITY_CLASS;
const DWORD_ REALTIME_PRIORITY_CLASS_          = REALTIME_PRIORITY_CLASS;
const DWORD_ BELOW_NORMAL_PRIORITY_CLASS_      = BELOW_NORMAL_PRIORITY_CLASS;
const DWORD_ ABOVE_NORMAL_PRIORITY_CLASS_      = ABOVE_NORMAL_PRIORITY_CLASS;

#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6
const DWORD_ PROCESS_MODE_BACKGROUND_BEGIN_    = PROCESS_MODE_BACKGROUND_BEGIN;
const DWORD_ PROCESS_MODE_BACKGROUND_END_      = PROCESS_MODE_BACKGROUND_END;
#endif

#else // defined( BOOST_USE_WINDOWS_H )

const DWORD_ NORMAL_PRIORITY_CLASS_            = 0x20;
const DWORD_ IDLE_PRIORITY_CLASS_              = 0x40;
const DWORD_ HIGH_PRIORITY_CLASS_              = 0x80;
const DWORD_ REALTIME_PRIORITY_CLASS_          = 0x100;
const DWORD_ BELOW_NORMAL_PRIORITY_CLASS_      = 0x4000;
const DWORD_ ABOVE_NORMAL_PRIORITY_CLASS_      = 0x8000;

#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6
const DWORD_ PROCESS_MODE_BACKGROUND_BEGIN_    = 0x100000;
const DWORD_ PROCESS_MODE_BACKGROUND_END_      = 0x200000;
#endif

#endif // defined( BOOST_USE_WINDOWS_H )

using ::GetPriorityClass;
using ::SetPriorityClass;

}
}
}

#endif // BOOST_PLAT_WINDOWS_DESKTOP

#endif // BOOST_DETAIL_WINAPI_PRIORITY_CLASS_HPP_
