//  timers.hpp  --------------------------------------------------------------//

//  Copyright 2010 Vicente J. Botet Escriba
//  Copyright 2015 Andrey Semashev

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt


#ifndef BOOST_DETAIL_WINAPI_TIMERS_HPP
#define BOOST_DETAIL_WINAPI_TIMERS_HPP

#include <boost/detail/winapi/basic_types.hpp>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

#if !defined( BOOST_USE_WINDOWS_H )
extern "C" {
BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
QueryPerformanceCounter(::_LARGE_INTEGER* lpPerformanceCount);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
QueryPerformanceFrequency(::_LARGE_INTEGER* lpFrequency);
}
#endif


namespace boost {
namespace detail {
namespace winapi {

BOOST_FORCEINLINE BOOL_ QueryPerformanceCounter(LARGE_INTEGER_* lpPerformanceCount)
{
    return ::QueryPerformanceCounter(reinterpret_cast< ::_LARGE_INTEGER* >(lpPerformanceCount));
}

BOOST_FORCEINLINE BOOL_ QueryPerformanceFrequency(LARGE_INTEGER_* lpFrequency)
{
    return ::QueryPerformanceFrequency(reinterpret_cast< ::_LARGE_INTEGER* >(lpFrequency));
}

}
}
}

#endif // BOOST_DETAIL_WINAPI_TIMERS_HPP
