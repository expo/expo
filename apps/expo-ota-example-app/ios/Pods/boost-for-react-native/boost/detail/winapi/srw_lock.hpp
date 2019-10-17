//  srw_lock.hpp  --------------------------------------------------------------//

//  Copyright 2010 Vicente J. Botet Escriba
//  Copyright 2015 Andrey Semashev

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt


#ifndef BOOST_DETAIL_WINAPI_SRW_LOCK_HPP
#define BOOST_DETAIL_WINAPI_SRW_LOCK_HPP

#include <boost/detail/winapi/config.hpp>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

#if BOOST_USE_WINAPI_VERSION < BOOST_WINAPI_VERSION_WIN6 \
    || (defined(_MSC_VER) && _MSC_VER < 1600)
// Windows SDK 6.0A, which is used by MSVC 9, does not have TryAcquireSRWLock* neither in headers nor in .lib files,
// although the functions are present in later SDKs since Windows API version 6.
#define BOOST_WINAPI_NO_TRY_ACQUIRE_SRWLOCK
#endif

#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6

#include <boost/detail/winapi/basic_types.hpp>

#if !defined( BOOST_USE_WINDOWS_H )
extern "C" {
struct _RTL_SRWLOCK;

BOOST_SYMBOL_IMPORT boost::detail::winapi::VOID_ WINAPI
InitializeSRWLock(::_RTL_SRWLOCK* SRWLock);

BOOST_SYMBOL_IMPORT boost::detail::winapi::VOID_ WINAPI
ReleaseSRWLockExclusive(::_RTL_SRWLOCK* SRWLock);

BOOST_SYMBOL_IMPORT boost::detail::winapi::VOID_ WINAPI
ReleaseSRWLockShared(::_RTL_SRWLOCK* SRWLock);

BOOST_SYMBOL_IMPORT boost::detail::winapi::VOID_ WINAPI
AcquireSRWLockExclusive(::_RTL_SRWLOCK* SRWLock);

BOOST_SYMBOL_IMPORT boost::detail::winapi::VOID_ WINAPI
AcquireSRWLockShared(::_RTL_SRWLOCK* SRWLock);

#if !defined( BOOST_WINAPI_NO_TRY_ACQUIRE_SRWLOCK )
BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOLEAN_ WINAPI
TryAcquireSRWLockExclusive(::_RTL_SRWLOCK* SRWLock);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOLEAN_ WINAPI
TryAcquireSRWLockShared(::_RTL_SRWLOCK* SRWLock);
#endif
}
#endif

namespace boost {
namespace detail {
namespace winapi {

typedef struct BOOST_DETAIL_WINAPI_MAY_ALIAS _RTL_SRWLOCK {
    PVOID_ Ptr;
} SRWLOCK_, *PSRWLOCK_;

#if defined( BOOST_USE_WINDOWS_H )
#define BOOST_DETAIL_WINAPI_SRWLOCK_INIT SRWLOCK_INIT
#else
#define BOOST_DETAIL_WINAPI_SRWLOCK_INIT {0}
#endif

BOOST_FORCEINLINE VOID_ InitializeSRWLock(PSRWLOCK_ SRWLock)
{
    ::InitializeSRWLock(reinterpret_cast< ::_RTL_SRWLOCK* >(SRWLock));
}

BOOST_FORCEINLINE VOID_ ReleaseSRWLockExclusive(PSRWLOCK_ SRWLock)
{
    ::ReleaseSRWLockExclusive(reinterpret_cast< ::_RTL_SRWLOCK* >(SRWLock));
}

BOOST_FORCEINLINE VOID_ ReleaseSRWLockShared(PSRWLOCK_ SRWLock)
{
    ::ReleaseSRWLockShared(reinterpret_cast< ::_RTL_SRWLOCK* >(SRWLock));
}

BOOST_FORCEINLINE VOID_ AcquireSRWLockExclusive(PSRWLOCK_ SRWLock)
{
    ::AcquireSRWLockExclusive(reinterpret_cast< ::_RTL_SRWLOCK* >(SRWLock));
}

BOOST_FORCEINLINE VOID_ AcquireSRWLockShared(PSRWLOCK_ SRWLock)
{
    ::AcquireSRWLockShared(reinterpret_cast< ::_RTL_SRWLOCK* >(SRWLock));
}

#if !defined( BOOST_WINAPI_NO_TRY_ACQUIRE_SRWLOCK )
BOOST_FORCEINLINE BOOLEAN_ TryAcquireSRWLockExclusive(PSRWLOCK_ SRWLock)
{
    return ::TryAcquireSRWLockExclusive(reinterpret_cast< ::_RTL_SRWLOCK* >(SRWLock));
}

BOOST_FORCEINLINE BOOLEAN_ TryAcquireSRWLockShared(PSRWLOCK_ SRWLock)
{
    return ::TryAcquireSRWLockShared(reinterpret_cast< ::_RTL_SRWLOCK* >(SRWLock));
}
#endif

}
}
}

#endif // BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6

#endif // BOOST_DETAIL_WINAPI_SRW_LOCK_HPP
