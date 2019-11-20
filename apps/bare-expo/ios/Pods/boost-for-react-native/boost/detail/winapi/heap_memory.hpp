//  heap_memory.hpp  --------------------------------------------------------------//

//  Copyright 2010 Vicente J. Botet Escriba
//  Copyright 2015 Andrey Semashev

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt


#ifndef BOOST_DETAIL_WINAPI_HEAP_MEMORY_HPP
#define BOOST_DETAIL_WINAPI_HEAP_MEMORY_HPP

#include <boost/detail/winapi/basic_types.hpp>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

#if !defined( BOOST_USE_WINDOWS_H )
#undef HeapAlloc
extern "C" {
BOOST_SYMBOL_IMPORT boost::detail::winapi::HANDLE_ WINAPI
GetProcessHeap(BOOST_DETAIL_WINAPI_VOID);

BOOST_SYMBOL_IMPORT boost::detail::winapi::DWORD_ WINAPI
GetProcessHeaps(boost::detail::winapi::DWORD_ NumberOfHeaps, boost::detail::winapi::PHANDLE_ ProcessHeaps);

BOOST_SYMBOL_IMPORT boost::detail::winapi::HANDLE_ WINAPI
HeapCreate(
    boost::detail::winapi::DWORD_ flOptions,
    boost::detail::winapi::SIZE_T_ dwInitialSize,
    boost::detail::winapi::SIZE_T_ dwMaximumSize);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
HeapDestroy(boost::detail::winapi::HANDLE_ hHeap);

BOOST_SYMBOL_IMPORT boost::detail::winapi::LPVOID_ WINAPI
HeapAlloc(
    boost::detail::winapi::HANDLE_ hHeap,
    boost::detail::winapi::DWORD_ dwFlags,
    boost::detail::winapi::SIZE_T_ dwBytes);

BOOST_SYMBOL_IMPORT boost::detail::winapi::LPVOID_ WINAPI
HeapReAlloc(
    boost::detail::winapi::HANDLE_ hHeap,
    boost::detail::winapi::DWORD_ dwFlags,
    boost::detail::winapi::LPVOID_ lpMem,
    boost::detail::winapi::SIZE_T_ dwBytes);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
HeapFree(
    boost::detail::winapi::HANDLE_ hHeap,
    boost::detail::winapi::DWORD_ dwFlags,
    boost::detail::winapi::LPVOID_ lpMem);
}
#endif

namespace boost {
namespace detail {
namespace winapi {
using ::GetProcessHeap;
using ::GetProcessHeaps;
using ::HeapCreate;
using ::HeapDestroy;
using ::HeapAlloc;
using ::HeapReAlloc;
using ::HeapFree;
}
}
}

#endif // BOOST_DETAIL_WINAPI_HEAP_MEMORY_HPP
