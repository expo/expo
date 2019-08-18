//  handle_info.hpp  --------------------------------------------------------------//

//  Copyright 2016 Klemens D. Morgenstern

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt

#ifndef BOOST_DETAIL_HANDLE_INFO_HPP_
#define BOOST_DETAIL_HANDLE_INFO_HPP_

#include <boost/detail/winapi/basic_types.hpp>
#include <boost/predef/platform.h>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

#if BOOST_PLAT_WINDOWS_DESKTOP

#if !defined( BOOST_USE_WINDOWS_H )
extern "C" {

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
GetHandleInformation(
        boost::detail::winapi::HANDLE_ hObject,
        boost::detail::winapi::LPDWORD_ lpdwFlags);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
SetHandleInformation(
        boost::detail::winapi::HANDLE_ hObject,
        boost::detail::winapi::DWORD_ dwMask,
        boost::detail::winapi::DWORD_ dwFlags);

} // extern "C"
#endif

namespace boost {
namespace detail {
namespace winapi {

using ::GetHandleInformation;
using ::SetHandleInformation;

#if defined( BOOST_USE_WINDOWS_H )

const DWORD_ HANDLE_FLAG_INHERIT_            = HANDLE_FLAG_INHERIT;
const DWORD_ HANDLE_FLAG_PROTECT_FROM_CLOSE_ = HANDLE_FLAG_PROTECT_FROM_CLOSE;

#else

const DWORD_ HANDLE_FLAG_INHERIT_            = 0x1;
const DWORD_ HANDLE_FLAG_PROTECT_FROM_CLOSE_ = 0x2;

#endif

}
}
}

#endif // BOOST_PLAT_WINDOWS_DESKTOP

#endif // BOOST_DETAIL_HANDLE_INFO_HPP_
