//  thread.hpp  --------------------------------------------------------------//

//  Copyright 2010 Vicente J. Botet Escriba
//  Copyright 2015 Andrey Semashev

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt


#ifndef BOOST_DETAIL_WINAPI_THREAD_HPP
#define BOOST_DETAIL_WINAPI_THREAD_HPP

#include <boost/detail/winapi/basic_types.hpp>
#include <boost/detail/winapi/get_current_thread.hpp>
#include <boost/detail/winapi/get_current_thread_id.hpp>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

#if !defined( BOOST_USE_WINDOWS_H )
extern "C" {
BOOST_SYMBOL_IMPORT boost::detail::winapi::DWORD_ WINAPI
SleepEx(
    boost::detail::winapi::DWORD_ dwMilliseconds,
    boost::detail::winapi::BOOL_ bAlertable);
BOOST_SYMBOL_IMPORT boost::detail::winapi::VOID_ WINAPI Sleep(boost::detail::winapi::DWORD_ dwMilliseconds);
BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI SwitchToThread(BOOST_DETAIL_WINAPI_VOID);
}
#endif

namespace boost {
namespace detail {
namespace winapi {
using ::SleepEx;
using ::Sleep;
using ::SwitchToThread;
}
}
}

#endif // BOOST_DETAIL_WINAPI_THREAD_HPP
