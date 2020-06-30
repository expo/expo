//  get_process_times.hpp  --------------------------------------------------------------//

//  Copyright 2010 Vicente J. Botet Escriba

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt


#ifndef BOOST_DETAIL_WINAPI_GET_PROCESS_TIMES_HPP
#define BOOST_DETAIL_WINAPI_GET_PROCESS_TIMES_HPP

#include <boost/detail/winapi/config.hpp>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

// Windows CE does not define GetProcessTimes
#if !defined( UNDER_CE )

#include <boost/detail/winapi/basic_types.hpp>
#include <boost/detail/winapi/time.hpp>

#if !defined( BOOST_USE_WINDOWS_H )
extern "C" {
BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
GetProcessTimes(
    boost::detail::winapi::HANDLE_ hProcess,
    ::_FILETIME* lpCreationTime,
    ::_FILETIME* lpExitTime,
    ::_FILETIME* lpKernelTime,
    ::_FILETIME* lpUserTime);
}
#endif

namespace boost {
namespace detail {
namespace winapi {

BOOST_FORCEINLINE BOOL_ GetProcessTimes(
    HANDLE_ hProcess,
    LPFILETIME_ lpCreationTime,
    LPFILETIME_ lpExitTime,
    LPFILETIME_ lpKernelTime,
    LPFILETIME_ lpUserTime)
{
    return ::GetProcessTimes(
        hProcess,
        reinterpret_cast< ::_FILETIME* >(lpCreationTime),
        reinterpret_cast< ::_FILETIME* >(lpExitTime),
        reinterpret_cast< ::_FILETIME* >(lpKernelTime),
        reinterpret_cast< ::_FILETIME* >(lpUserTime));
}

}
}
}

#endif // !defined( UNDER_CE )
#endif // BOOST_DETAIL_WINAPI_GET_PROCESS_TIMES_HPP
