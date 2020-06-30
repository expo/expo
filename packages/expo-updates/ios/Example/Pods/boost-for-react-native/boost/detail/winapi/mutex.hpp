//  mutex.hpp  --------------------------------------------------------------//

//  Copyright 2010 Vicente J. Botet Escriba
//  Copyright 2015 Andrey Semashev

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt


#ifndef BOOST_DETAIL_WINAPI_MUTEX_HPP
#define BOOST_DETAIL_WINAPI_MUTEX_HPP

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
CreateMutexA(
    ::_SECURITY_ATTRIBUTES* lpMutexAttributes,
    boost::detail::winapi::BOOL_ bInitialOwner,
    boost::detail::winapi::LPCSTR_ lpName);
#endif

#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6
BOOST_SYMBOL_IMPORT boost::detail::winapi::HANDLE_ WINAPI
CreateMutexExA(
    ::_SECURITY_ATTRIBUTES* lpMutexAttributes,
    boost::detail::winapi::LPCSTR_ lpName,
    boost::detail::winapi::DWORD_ dwFlags,
    boost::detail::winapi::DWORD_ dwDesiredAccess);
#endif

BOOST_SYMBOL_IMPORT boost::detail::winapi::HANDLE_ WINAPI
OpenMutexA(
    boost::detail::winapi::DWORD_ dwDesiredAccess,
    boost::detail::winapi::BOOL_ bInheritHandle,
    boost::detail::winapi::LPCSTR_ lpName);
#endif

#if !defined( BOOST_PLAT_WINDOWS_RUNTIME_AVALIABLE )
BOOST_SYMBOL_IMPORT boost::detail::winapi::HANDLE_ WINAPI
CreateMutexW(
    ::_SECURITY_ATTRIBUTES* lpMutexAttributes,
    boost::detail::winapi::BOOL_ bInitialOwner,
    boost::detail::winapi::LPCWSTR_ lpName);
#endif

#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6
BOOST_SYMBOL_IMPORT boost::detail::winapi::HANDLE_ WINAPI
CreateMutexExW(
    ::_SECURITY_ATTRIBUTES* lpMutexAttributes,
    boost::detail::winapi::LPCWSTR_ lpName,
    boost::detail::winapi::DWORD_ dwFlags,
    boost::detail::winapi::DWORD_ dwDesiredAccess);
#endif

BOOST_SYMBOL_IMPORT boost::detail::winapi::HANDLE_ WINAPI
OpenMutexW(
    boost::detail::winapi::DWORD_ dwDesiredAccess,
    boost::detail::winapi::BOOL_ bInheritHandle,
    boost::detail::winapi::LPCWSTR_ lpName);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
ReleaseMutex(boost::detail::winapi::HANDLE_ hMutex);
}
#endif

namespace boost {
namespace detail {
namespace winapi {

#if !defined( BOOST_NO_ANSI_APIS )
using ::OpenMutexA;
#endif
using ::OpenMutexW;
using ::ReleaseMutex;

#if defined( BOOST_USE_WINDOWS_H )

const DWORD_ MUTEX_ALL_ACCESS_ = MUTEX_ALL_ACCESS;
const DWORD_ MUTEX_MODIFY_STATE_ = MUTEX_MODIFY_STATE;
#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6
const DWORD_ CREATE_MUTEX_INITIAL_OWNER_ = CREATE_MUTEX_INITIAL_OWNER;
#endif

#else // defined( BOOST_USE_WINDOWS_H )

const DWORD_ MUTEX_ALL_ACCESS_ = 0x001F0001;
const DWORD_ MUTEX_MODIFY_STATE_ = 0x00000001;
#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6
const DWORD_ CREATE_MUTEX_INITIAL_OWNER_ = 0x00000001;
#endif

#endif // defined( BOOST_USE_WINDOWS_H )

const DWORD_ mutex_all_access = MUTEX_ALL_ACCESS_;
const DWORD_ mutex_modify_state = MUTEX_MODIFY_STATE_;
#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6
const DWORD_ create_mutex_initial_owner = CREATE_MUTEX_INITIAL_OWNER_;
#endif

#if !defined( BOOST_NO_ANSI_APIS )
BOOST_FORCEINLINE HANDLE_ CreateMutexA(SECURITY_ATTRIBUTES_* lpMutexAttributes, BOOL_ bInitialOwner, LPCSTR_ lpName)
{
#if BOOST_PLAT_WINDOWS_RUNTIME && BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6
    const DWORD_ flags = bInitialOwner ? create_mutex_initial_owner : 0u;
    return ::CreateMutexExA(reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpMutexAttributes), lpName, flags, mutex_all_access);
#else
    return ::CreateMutexA(reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpMutexAttributes), bInitialOwner, lpName);
#endif
}

#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6
BOOST_FORCEINLINE HANDLE_ CreateMutexExA(
    SECURITY_ATTRIBUTES_* lpMutexAttributes,
    LPCSTR_ lpName,
    DWORD_ dwFlags,
    DWORD_ dwDesiredAccess)
{
    return ::CreateMutexExA(reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpMutexAttributes), lpName, dwFlags, dwDesiredAccess);
}
#endif
#endif

BOOST_FORCEINLINE HANDLE_ CreateMutexW(SECURITY_ATTRIBUTES_* lpMutexAttributes, BOOL_ bInitialOwner, LPCWSTR_ lpName)
{
#if BOOST_PLAT_WINDOWS_RUNTIME && BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6
    const DWORD_ flags = bInitialOwner ? create_mutex_initial_owner : 0u;
    return ::CreateMutexExW(reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpMutexAttributes), lpName, flags, mutex_all_access);
#else
    return ::CreateMutexW(reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpMutexAttributes), bInitialOwner, lpName);
#endif
}

#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6
BOOST_FORCEINLINE HANDLE_ CreateMutexExW(
    SECURITY_ATTRIBUTES_* lpMutexAttributes,
    LPCWSTR_ lpName,
    DWORD_ dwFlags,
    DWORD_ dwDesiredAccess)
{
    return ::CreateMutexExW(reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpMutexAttributes), lpName, dwFlags, dwDesiredAccess);
}
#endif

#if !defined( BOOST_NO_ANSI_APIS )
BOOST_FORCEINLINE HANDLE_ create_mutex(SECURITY_ATTRIBUTES_* lpAttributes, BOOL_ bInitialOwner, LPCSTR_ lpName)
{
    return winapi::CreateMutexA(lpAttributes, bInitialOwner, lpName);
}

BOOST_FORCEINLINE HANDLE_ open_mutex(DWORD_ dwDesiredAccess, BOOL_ bInheritHandle, LPCSTR_ lpName)
{
    return ::OpenMutexA(dwDesiredAccess, bInheritHandle, lpName);
}
#endif

BOOST_FORCEINLINE HANDLE_ create_mutex(SECURITY_ATTRIBUTES_* lpAttributes, BOOL_ bInitialOwner, LPCWSTR_ lpName)
{
    return winapi::CreateMutexW(lpAttributes, bInitialOwner, lpName);
}

BOOST_FORCEINLINE HANDLE_ open_mutex(DWORD_ dwDesiredAccess, BOOL_ bInheritHandle, LPCWSTR_ lpName)
{
    return ::OpenMutexW(dwDesiredAccess, bInheritHandle, lpName);
}

BOOST_FORCEINLINE HANDLE_ create_anonymous_mutex(SECURITY_ATTRIBUTES_* lpAttributes, BOOL_ bInitialOwner)
{
    return winapi::CreateMutexW(lpAttributes, bInitialOwner, 0);
}

}
}
}

#endif // BOOST_DETAIL_WINAPI_MUTEX_HPP
