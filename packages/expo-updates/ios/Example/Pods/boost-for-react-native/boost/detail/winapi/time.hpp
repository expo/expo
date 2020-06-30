//  time.hpp  --------------------------------------------------------------//

//  Copyright 2010 Vicente J. Botet Escriba
//  Copyright (c) Microsoft Corporation 2014
//  Copyright 2015 Andrey Semashev

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt


#ifndef BOOST_DETAIL_WINAPI_TIME_HPP
#define BOOST_DETAIL_WINAPI_TIME_HPP

#include <boost/detail/winapi/basic_types.hpp>
#include <boost/predef/platform.h>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

#if !defined( BOOST_USE_WINDOWS_H )
extern "C" {
struct _FILETIME;
struct _SYSTEMTIME;

BOOST_SYMBOL_IMPORT boost::detail::winapi::VOID_ WINAPI
GetSystemTime(::_SYSTEMTIME* lpSystemTime);

#ifdef BOOST_HAS_GETSYSTEMTIMEASFILETIME  // Windows CE does not define GetSystemTimeAsFileTime
BOOST_SYMBOL_IMPORT boost::detail::winapi::VOID_ WINAPI
GetSystemTimeAsFileTime(::_FILETIME* lpSystemTimeAsFileTime);
#endif

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
SystemTimeToFileTime(
    const ::_SYSTEMTIME* lpSystemTime,
    ::_FILETIME* lpFileTime);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
FileTimeToSystemTime(
    const ::_FILETIME* lpFileTime,
    ::_SYSTEMTIME* lpSystemTime);

#if BOOST_PLAT_WINDOWS_DESKTOP
BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
FileTimeToLocalFileTime(
    const ::_FILETIME* lpFileTime,
    ::_FILETIME* lpLocalFileTime);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
LocalFileTimeToFileTime(
    const ::_FILETIME* lpLocalFileTime,
    ::_FILETIME* lpFileTime);

BOOST_SYMBOL_IMPORT boost::detail::winapi::DWORD_ WINAPI
GetTickCount(BOOST_DETAIL_WINAPI_VOID);
#endif

#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6
BOOST_SYMBOL_IMPORT boost::detail::winapi::ULONGLONG_ WINAPI
GetTickCount64(BOOST_DETAIL_WINAPI_VOID);
#endif
}
#endif

namespace boost {
namespace detail {
namespace winapi {

typedef struct BOOST_DETAIL_WINAPI_MAY_ALIAS _FILETIME {
    DWORD_ dwLowDateTime;
    DWORD_ dwHighDateTime;
} FILETIME_, *PFILETIME_, *LPFILETIME_;

typedef struct BOOST_DETAIL_WINAPI_MAY_ALIAS _SYSTEMTIME {
    WORD_ wYear;
    WORD_ wMonth;
    WORD_ wDayOfWeek;
    WORD_ wDay;
    WORD_ wHour;
    WORD_ wMinute;
    WORD_ wSecond;
    WORD_ wMilliseconds;
} SYSTEMTIME_, *PSYSTEMTIME_, *LPSYSTEMTIME_;

#if BOOST_PLAT_WINDOWS_DESKTOP
using ::GetTickCount;
#endif
#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6
using ::GetTickCount64;
#endif

BOOST_FORCEINLINE VOID_ GetSystemTime(LPSYSTEMTIME_ lpSystemTime)
{
    ::GetSystemTime(reinterpret_cast< ::_SYSTEMTIME* >(lpSystemTime));
}

#if defined( BOOST_HAS_GETSYSTEMTIMEASFILETIME )
BOOST_FORCEINLINE VOID_ GetSystemTimeAsFileTime(LPFILETIME_ lpSystemTimeAsFileTime)
{
    ::GetSystemTimeAsFileTime(reinterpret_cast< ::_FILETIME* >(lpSystemTimeAsFileTime));
}
#else
// Windows CE does not define GetSystemTimeAsFileTime
BOOST_FORCEINLINE VOID_ GetSystemTimeAsFileTime(FILETIME_* lpFileTime)
{
    boost::detail::winapi::SYSTEMTIME_ st;
    boost::detail::winapi::GetSystemTime(&st);
    boost::detail::winapi::SystemTimeToFileTime(&st, lpFileTime);
}
#endif

BOOST_FORCEINLINE BOOL_ SystemTimeToFileTime(const SYSTEMTIME_* lpSystemTime, FILETIME_* lpFileTime)
{
    return ::SystemTimeToFileTime(reinterpret_cast< const ::_SYSTEMTIME* >(lpSystemTime), reinterpret_cast< ::_FILETIME* >(lpFileTime));
}

BOOST_FORCEINLINE BOOL_ FileTimeToSystemTime(const FILETIME_* lpFileTime, SYSTEMTIME_* lpSystemTime)
{
    return ::FileTimeToSystemTime(reinterpret_cast< const ::_FILETIME* >(lpFileTime), reinterpret_cast< ::_SYSTEMTIME* >(lpSystemTime));
}

#if BOOST_PLAT_WINDOWS_DESKTOP
BOOST_FORCEINLINE BOOL_ FileTimeToLocalFileTime(const FILETIME_* lpFileTime, FILETIME_* lpLocalFileTime)
{
    return ::FileTimeToLocalFileTime(reinterpret_cast< const ::_FILETIME* >(lpFileTime), reinterpret_cast< ::_FILETIME* >(lpLocalFileTime));
}

BOOST_FORCEINLINE BOOL_ LocalFileTimeToFileTime(const FILETIME_* lpLocalFileTime, FILETIME_* lpFileTime)
{
    return ::LocalFileTimeToFileTime(reinterpret_cast< const ::_FILETIME* >(lpLocalFileTime), reinterpret_cast< ::_FILETIME* >(lpFileTime));
}
#endif

}
}
}

#endif // BOOST_DETAIL_WINAPI_TIME_HPP
