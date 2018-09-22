//  system.hpp  --------------------------------------------------------------//

//  Copyright 2010 Vicente J. Botet Escriba
//  Copyright (c) Microsoft Corporation 2014
//  Copyright 2015 Andrey Semashev

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt


#ifndef BOOST_DETAIL_WINAPI_SYSTEM_HPP
#define BOOST_DETAIL_WINAPI_SYSTEM_HPP

#include <boost/detail/winapi/basic_types.hpp>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

#if defined(BOOST_MSVC)
#pragma warning(push)
// nonstandard extension used : nameless struct/union
#pragma warning(disable: 4201)
#endif

#if !defined( BOOST_USE_WINDOWS_H )
extern "C" {
struct _SYSTEM_INFO;

BOOST_SYMBOL_IMPORT boost::detail::winapi::VOID_ WINAPI
GetSystemInfo(::_SYSTEM_INFO* lpSystemInfo);

#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WINXP
BOOST_SYMBOL_IMPORT boost::detail::winapi::VOID_ WINAPI
GetNativeSystemInfo(::_SYSTEM_INFO* lpSystemInfo);
#endif
}
#endif

namespace boost {
namespace detail {
namespace winapi {

typedef struct BOOST_DETAIL_WINAPI_MAY_ALIAS _SYSTEM_INFO {
    union {
        DWORD_ dwOemId;
        struct {
            WORD_ wProcessorArchitecture;
            WORD_ wReserved;
        } DUMMYSTRUCTNAME;
    } DUMMYUNIONNAME;
    DWORD_ dwPageSize;
    LPVOID_ lpMinimumApplicationAddress;
    LPVOID_ lpMaximumApplicationAddress;
    DWORD_PTR_ dwActiveProcessorMask;
    DWORD_ dwNumberOfProcessors;
    DWORD_ dwProcessorType;
    DWORD_ dwAllocationGranularity;
    WORD_ wProcessorLevel;
    WORD_ wProcessorRevision;
} SYSTEM_INFO_, *LPSYSTEM_INFO_;

BOOST_FORCEINLINE VOID_ GetSystemInfo(LPSYSTEM_INFO_ lpSystemInfo)
{
    ::GetSystemInfo(reinterpret_cast< ::_SYSTEM_INFO* >(lpSystemInfo));
}

#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WINXP
BOOST_FORCEINLINE VOID_ GetNativeSystemInfo(LPSYSTEM_INFO_ lpSystemInfo)
{
    ::GetNativeSystemInfo(reinterpret_cast< ::_SYSTEM_INFO* >(lpSystemInfo));
}
#endif

}
}
}

#if defined(BOOST_MSVC)
#pragma warning(pop)
#endif

#endif // BOOST_DETAIL_WINAPI_SYSTEM_HPP
