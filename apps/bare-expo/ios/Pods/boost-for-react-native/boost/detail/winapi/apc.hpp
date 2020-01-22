//  apc.hpp  --------------------------------------------------------------//

//  Copyright 2010 Vicente J. Botet Escriba
//  Copyright 2015 Andrey Semashev

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt


#ifndef BOOST_DETAIL_WINAPI_APC_HPP
#define BOOST_DETAIL_WINAPI_APC_HPP

#include <boost/detail/winapi/config.hpp>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_NT4

#include <boost/detail/winapi/basic_types.hpp>

#if !defined( BOOST_USE_WINDOWS_H )
extern "C" {
typedef boost::detail::winapi::VOID_
(NTAPI *PAPCFUNC)(boost::detail::winapi::ULONG_PTR_ Parameter);

BOOST_SYMBOL_IMPORT boost::detail::winapi::DWORD_ WINAPI
QueueUserAPC(
    PAPCFUNC pfnAPC,
    boost::detail::winapi::HANDLE_ hThread,
    boost::detail::winapi::ULONG_PTR_ dwData);
}
#endif

namespace boost {
namespace detail {
namespace winapi {
typedef ::PAPCFUNC PAPCFUNC_;
using ::QueueUserAPC;
}
}
}

#endif // BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_NT4

#endif // BOOST_DETAIL_WINAPI_APC_HPP
