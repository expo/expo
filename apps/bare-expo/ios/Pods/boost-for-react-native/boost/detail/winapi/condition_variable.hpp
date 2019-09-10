//  condition_variable.hpp  --------------------------------------------------------------//

//  Copyright 2010 Vicente J. Botet Escriba
//  Copyright 2015 Andrey Semashev

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt


#ifndef BOOST_DETAIL_WINAPI_CONDITION_VARIABLE_HPP
#define BOOST_DETAIL_WINAPI_CONDITION_VARIABLE_HPP

#include <boost/detail/winapi/config.hpp>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6

#include <boost/detail/winapi/basic_types.hpp>

#if !defined( BOOST_USE_WINDOWS_H )
extern "C" {
struct _RTL_CONDITION_VARIABLE;
struct _RTL_CRITICAL_SECTION;
struct _RTL_SRWLOCK;

BOOST_SYMBOL_IMPORT boost::detail::winapi::VOID_ WINAPI
InitializeConditionVariable(::_RTL_CONDITION_VARIABLE* ConditionVariable);

BOOST_SYMBOL_IMPORT boost::detail::winapi::VOID_ WINAPI
WakeConditionVariable(::_RTL_CONDITION_VARIABLE* ConditionVariable);

BOOST_SYMBOL_IMPORT boost::detail::winapi::VOID_ WINAPI
WakeAllConditionVariable(::_RTL_CONDITION_VARIABLE* ConditionVariable);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
SleepConditionVariableCS(
    ::_RTL_CONDITION_VARIABLE* ConditionVariable,
    ::_RTL_CRITICAL_SECTION* CriticalSection,
    boost::detail::winapi::DWORD_ dwMilliseconds);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
SleepConditionVariableSRW(
    ::_RTL_CONDITION_VARIABLE* ConditionVariable,
    ::_RTL_SRWLOCK* SRWLock,
    boost::detail::winapi::DWORD_ dwMilliseconds,
    boost::detail::winapi::ULONG_ Flags);
}
#endif

namespace boost {
namespace detail {
namespace winapi {

typedef struct BOOST_DETAIL_WINAPI_MAY_ALIAS _RTL_CONDITION_VARIABLE {
    PVOID_ Ptr;
} CONDITION_VARIABLE_, *PCONDITION_VARIABLE_;

#if defined( BOOST_USE_WINDOWS_H )
#define BOOST_DETAIL_WINAPI_CONDITION_VARIABLE_INIT CONDITION_VARIABLE_INIT
#else
#define BOOST_DETAIL_WINAPI_CONDITION_VARIABLE {0}
#endif

struct _RTL_CRITICAL_SECTION;
struct _RTL_SRWLOCK;

BOOST_FORCEINLINE VOID_ InitializeConditionVariable(PCONDITION_VARIABLE_ ConditionVariable)
{
    ::InitializeConditionVariable(reinterpret_cast< ::_RTL_CONDITION_VARIABLE* >(ConditionVariable));
}

BOOST_FORCEINLINE VOID_ WakeConditionVariable(PCONDITION_VARIABLE_ ConditionVariable)
{
    ::WakeConditionVariable(reinterpret_cast< ::_RTL_CONDITION_VARIABLE* >(ConditionVariable));
}

BOOST_FORCEINLINE VOID_ WakeAllConditionVariable(PCONDITION_VARIABLE_ ConditionVariable)
{
    ::WakeAllConditionVariable(reinterpret_cast< ::_RTL_CONDITION_VARIABLE* >(ConditionVariable));
}

BOOST_FORCEINLINE BOOL_ SleepConditionVariableCS(
    PCONDITION_VARIABLE_ ConditionVariable,
    _RTL_CRITICAL_SECTION* CriticalSection,
    DWORD_ dwMilliseconds)
{
    return ::SleepConditionVariableCS(
        reinterpret_cast< ::_RTL_CONDITION_VARIABLE* >(ConditionVariable),
        reinterpret_cast< ::_RTL_CRITICAL_SECTION* >(CriticalSection),
        dwMilliseconds);
}

BOOST_FORCEINLINE BOOL_ SleepConditionVariableSRW(
    PCONDITION_VARIABLE_ ConditionVariable,
    _RTL_SRWLOCK* SRWLock,
    DWORD_ dwMilliseconds,
    ULONG_ Flags)
{
    return ::SleepConditionVariableSRW(
        reinterpret_cast< ::_RTL_CONDITION_VARIABLE* >(ConditionVariable),
        reinterpret_cast< ::_RTL_SRWLOCK* >(SRWLock),
        dwMilliseconds,
        Flags);
}

#if defined( BOOST_USE_WINDOWS_H )
const ULONG_ CONDITION_VARIABLE_LOCKMODE_SHARED_ = CONDITION_VARIABLE_LOCKMODE_SHARED;
#else // defined( BOOST_USE_WINDOWS_H )
const ULONG_ CONDITION_VARIABLE_LOCKMODE_SHARED_ = 0x00000001;
#endif // defined( BOOST_USE_WINDOWS_H )

const ULONG_ condition_variable_lockmode_shared = CONDITION_VARIABLE_LOCKMODE_SHARED_;

}
}
}

#endif // BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6

#endif // BOOST_DETAIL_WINAPI_CONDITION_VARIABLE_HPP
