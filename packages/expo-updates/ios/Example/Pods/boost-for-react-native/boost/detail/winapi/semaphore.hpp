//  semaphore.hpp  --------------------------------------------------------------//

//  Copyright 2010 Vicente J. Botet Escriba
//  Copyright 2015 Andrey Semashev

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt


#ifndef BOOST_DETAIL_WINAPI_SEMAPHORE_HPP
#define BOOST_DETAIL_WINAPI_SEMAPHORE_HPP

#include <boost/detail/winapi/basic_types.hpp>
#include <boost/predef/platform.h>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

#if !defined( BOOST_USE_WINDOWS_H )
extern "C" {
#if !defined( BOOST_NO_ANSI_APIS )
#if !defined( BOOST_PLAT_WINDOWS_RUNTIME_AVALIABLE )
BOOST_SYMBOL_IMPORT boost::detail::winapi::HANDLE_ WINAPI
CreateSemaphoreA(
    ::_SECURITY_ATTRIBUTES* lpSemaphoreAttributes,
    boost::detail::winapi::LONG_ lInitialCount,
    boost::detail::winapi::LONG_ lMaximumCount,
    boost::detail::winapi::LPCSTR_ lpName);
#endif

#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6
BOOST_SYMBOL_IMPORT boost::detail::winapi::HANDLE_ WINAPI
CreateSemaphoreExA(
    ::_SECURITY_ATTRIBUTES* lpSemaphoreAttributes,
    boost::detail::winapi::LONG_ lInitialCount,
    boost::detail::winapi::LONG_ lMaximumCount,
    boost::detail::winapi::LPCSTR_ lpName,
    boost::detail::winapi::DWORD_ dwFlags,
    boost::detail::winapi::DWORD_ dwDesiredAccess);
#endif

BOOST_SYMBOL_IMPORT boost::detail::winapi::HANDLE_ WINAPI
OpenSemaphoreA(
    boost::detail::winapi::DWORD_ dwDesiredAccess,
    boost::detail::winapi::BOOL_ bInheritHandle,
    boost::detail::winapi::LPCSTR_ lpName);
#endif

BOOST_SYMBOL_IMPORT boost::detail::winapi::HANDLE_ WINAPI
CreateSemaphoreW(
    ::_SECURITY_ATTRIBUTES* lpSemaphoreAttributes,
    boost::detail::winapi::LONG_ lInitialCount,
    boost::detail::winapi::LONG_ lMaximumCount,
    boost::detail::winapi::LPCWSTR_ lpName);

#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6
BOOST_SYMBOL_IMPORT boost::detail::winapi::HANDLE_ WINAPI
CreateSemaphoreExW(
    ::_SECURITY_ATTRIBUTES* lpSemaphoreAttributes,
    boost::detail::winapi::LONG_ lInitialCount,
    boost::detail::winapi::LONG_ lMaximumCount,
    boost::detail::winapi::LPCWSTR_ lpName,
    boost::detail::winapi::DWORD_ dwFlags,
    boost::detail::winapi::DWORD_ dwDesiredAccess);
#endif

BOOST_SYMBOL_IMPORT boost::detail::winapi::HANDLE_ WINAPI
OpenSemaphoreW(
    boost::detail::winapi::DWORD_ dwDesiredAccess,
    boost::detail::winapi::BOOL_ bInheritHandle,
    boost::detail::winapi::LPCWSTR_ lpName);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
ReleaseSemaphore(
    boost::detail::winapi::HANDLE_ hSemaphore,
    boost::detail::winapi::LONG_ lReleaseCount,
    boost::detail::winapi::LPLONG_ lpPreviousCount);
}
#endif

namespace boost {
namespace detail {
namespace winapi {

#if !defined( BOOST_NO_ANSI_APIS )
using ::OpenSemaphoreA;
#endif
using ::OpenSemaphoreW;
using ::ReleaseSemaphore;

#if defined( BOOST_USE_WINDOWS_H )

const DWORD_ SEMAPHORE_ALL_ACCESS_ = SEMAPHORE_ALL_ACCESS;
const DWORD_ SEMAPHORE_MODIFY_STATE_ = SEMAPHORE_MODIFY_STATE;

#else // defined( BOOST_USE_WINDOWS_H )

const DWORD_ SEMAPHORE_ALL_ACCESS_ = 0x001F0003;
const DWORD_ SEMAPHORE_MODIFY_STATE_ = 0x00000002;

#endif // defined( BOOST_USE_WINDOWS_H )

// Undocumented and not present in Windows SDK. Enables NtQuerySemaphore.
// http://undocumented.ntinternals.net/index.html?page=UserMode%2FUndocumented%20Functions%2FNT%20Objects%2FEvent%2FNtQueryEvent.html
const DWORD_ SEMAPHORE_QUERY_STATE_ = 0x00000001;

const DWORD_ semaphore_all_access = SEMAPHORE_ALL_ACCESS_;
const DWORD_ semaphore_modify_state = SEMAPHORE_MODIFY_STATE_;


#if !defined( BOOST_NO_ANSI_APIS )
BOOST_FORCEINLINE HANDLE_ CreateSemaphoreA(SECURITY_ATTRIBUTES_* lpSemaphoreAttributes, LONG_ lInitialCount, LONG_ lMaximumCount, LPCSTR_ lpName)
{
#if BOOST_PLAT_WINDOWS_RUNTIME && BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6
    return ::CreateSemaphoreExA(reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpSemaphoreAttributes), lInitialCount, lMaximumCount, lpName, 0, semaphore_all_access);
#else
    return ::CreateSemaphoreA(reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpSemaphoreAttributes), lInitialCount, lMaximumCount, lpName);
#endif
}

#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6
BOOST_FORCEINLINE HANDLE_ CreateSemaphoreExA(SECURITY_ATTRIBUTES_* lpSemaphoreAttributes, LONG_ lInitialCount, LONG_ lMaximumCount, LPCSTR_ lpName, DWORD_ dwFlags, DWORD_ dwDesiredAccess)
{
    return ::CreateSemaphoreExA(reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpSemaphoreAttributes), lInitialCount, lMaximumCount, lpName, dwFlags, dwDesiredAccess);
}
#endif
#endif

BOOST_FORCEINLINE HANDLE_ CreateSemaphoreW(SECURITY_ATTRIBUTES_* lpSemaphoreAttributes, LONG_ lInitialCount, LONG_ lMaximumCount, LPCWSTR_ lpName)
{
#if BOOST_PLAT_WINDOWS_RUNTIME && BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6
    return ::CreateSemaphoreExW(reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpSemaphoreAttributes), lInitialCount, lMaximumCount, lpName, 0, semaphore_all_access);
#else
    return ::CreateSemaphoreW(reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpSemaphoreAttributes), lInitialCount, lMaximumCount, lpName);
#endif
}

#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6
BOOST_FORCEINLINE HANDLE_ CreateSemaphoreExW(SECURITY_ATTRIBUTES_* lpSemaphoreAttributes, LONG_ lInitialCount, LONG_ lMaximumCount, LPCWSTR_ lpName, DWORD_ dwFlags, DWORD_ dwDesiredAccess)
{
    return ::CreateSemaphoreExW(reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpSemaphoreAttributes), lInitialCount, lMaximumCount, lpName, dwFlags, dwDesiredAccess);
}
#endif

#if !defined( BOOST_NO_ANSI_APIS )
BOOST_FORCEINLINE HANDLE_ create_semaphore(SECURITY_ATTRIBUTES_* lpSemaphoreAttributes, LONG_ lInitialCount, LONG_ lMaximumCount, LPCSTR_ lpName)
{
    return winapi::CreateSemaphoreA(lpSemaphoreAttributes, lInitialCount, lMaximumCount, lpName);
}

BOOST_FORCEINLINE HANDLE_ open_semaphore(DWORD_ dwDesiredAccess, BOOL_ bInheritHandle, LPCSTR_ lpName)
{
    return ::OpenSemaphoreA(dwDesiredAccess, bInheritHandle, lpName);
}
#endif

BOOST_FORCEINLINE HANDLE_ create_semaphore(SECURITY_ATTRIBUTES_* lpSemaphoreAttributes, LONG_ lInitialCount, LONG_ lMaximumCount, LPCWSTR_ lpName)
{
    return winapi::CreateSemaphoreW(lpSemaphoreAttributes, lInitialCount, lMaximumCount, lpName);
}

BOOST_FORCEINLINE HANDLE_ open_semaphore(DWORD_ dwDesiredAccess, BOOL_ bInheritHandle, LPCWSTR_ lpName)
{
    return ::OpenSemaphoreW(dwDesiredAccess, bInheritHandle, lpName);
}

BOOST_FORCEINLINE HANDLE_ create_anonymous_semaphore(SECURITY_ATTRIBUTES_* lpSemaphoreAttributes, LONG_ lInitialCount, LONG_ lMaximumCount)
{
    return winapi::CreateSemaphoreW(lpSemaphoreAttributes, lInitialCount, lMaximumCount, 0);
}

}
}
}

#endif // BOOST_DETAIL_WINAPI_SEMAPHORE_HPP
