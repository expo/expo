//  dll.hpp  --------------------------------------------------------------//

//  Copyright 2010 Vicente J. Botet Escriba
//  Copyright 2014 Renato Tegon Forti, Antony Polukhin
//  Copyright 2015 Andrey Semashev
//  Copyright 2015 Antony Polukhin

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt


#ifndef BOOST_DETAIL_WINAPI_DLL_HPP
#define BOOST_DETAIL_WINAPI_DLL_HPP

#include <boost/detail/winapi/basic_types.hpp>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

#if !defined( BOOST_USE_WINDOWS_H )
extern "C" {
namespace boost { namespace detail { namespace winapi {
#ifdef _WIN64
typedef INT_PTR_ (WINAPI *FARPROC_)();
typedef INT_PTR_ (WINAPI *NEARPROC_)();
typedef INT_PTR_ (WINAPI *PROC_)();
#else
typedef int (WINAPI *FARPROC_)();
typedef int (WINAPI *NEARPROC_)();
typedef int (WINAPI *PROC_)();
#endif // _WIN64
}}} // namespace boost::detail::winapi

#if !defined( BOOST_NO_ANSI_APIS )
BOOST_SYMBOL_IMPORT boost::detail::winapi::HMODULE_ WINAPI
LoadLibraryA(boost::detail::winapi::LPCSTR_ lpFileName);

BOOST_SYMBOL_IMPORT boost::detail::winapi::HMODULE_ WINAPI
LoadLibraryExA(
    boost::detail::winapi::LPCSTR_ lpFileName,
    boost::detail::winapi::HANDLE_ hFile,
    boost::detail::winapi::DWORD_ dwFlags
);

BOOST_SYMBOL_IMPORT boost::detail::winapi::HMODULE_ WINAPI
GetModuleHandleA(boost::detail::winapi::LPCSTR_ lpFileName);

BOOST_SYMBOL_IMPORT boost::detail::winapi::DWORD_ WINAPI
GetModuleFileNameA(
    boost::detail::winapi::HMODULE_ hModule,
    boost::detail::winapi::LPSTR_ lpFilename,
    boost::detail::winapi::DWORD_ nSize
);
#endif

BOOST_SYMBOL_IMPORT boost::detail::winapi::HMODULE_ WINAPI
LoadLibraryW(boost::detail::winapi::LPCWSTR_ lpFileName);

BOOST_SYMBOL_IMPORT boost::detail::winapi::HMODULE_ WINAPI
LoadLibraryExW(
    boost::detail::winapi::LPCWSTR_ lpFileName,
    boost::detail::winapi::HANDLE_ hFile,
    boost::detail::winapi::DWORD_ dwFlags
);

BOOST_SYMBOL_IMPORT boost::detail::winapi::HMODULE_ WINAPI
GetModuleHandleW(boost::detail::winapi::LPCWSTR_ lpFileName);

BOOST_SYMBOL_IMPORT boost::detail::winapi::DWORD_ WINAPI
GetModuleFileNameW(
    boost::detail::winapi::HMODULE_ hModule,
    boost::detail::winapi::LPWSTR_ lpFilename,
    boost::detail::winapi::DWORD_ nSize
);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
FreeLibrary(boost::detail::winapi::HMODULE_ hModule);

#if !defined( UNDER_CE )
BOOST_SYMBOL_IMPORT boost::detail::winapi::FARPROC_ WINAPI
GetProcAddress(boost::detail::winapi::HMODULE_ hModule, boost::detail::winapi::LPCSTR_ lpProcName);
#else
// On Windows CE there are two functions: GetProcAddressA (since Windows CE 3.0) and GetProcAddressW.
// GetProcAddress is a macro that is _always_ defined to GetProcAddressW.
BOOST_SYMBOL_IMPORT boost::detail::winapi::FARPROC_ WINAPI
GetProcAddressA(boost::detail::winapi::HMODULE_ hModule, boost::detail::winapi::LPCSTR_ lpProcName);
BOOST_SYMBOL_IMPORT boost::detail::winapi::FARPROC_ WINAPI
GetProcAddressW(boost::detail::winapi::HMODULE_ hModule, boost::detail::winapi::LPCWSTR_ lpProcName);
#endif

struct _MEMORY_BASIC_INFORMATION;

#if !defined( BOOST_WINAPI_IS_MINGW )
BOOST_SYMBOL_IMPORT boost::detail::winapi::SIZE_T_ WINAPI
VirtualQuery(
    boost::detail::winapi::LPCVOID_ lpAddress,
    ::_MEMORY_BASIC_INFORMATION* lpBuffer,
    boost::detail::winapi::ULONG_PTR_ dwLength
);
#else // !defined( BOOST_WINAPI_IS_MINGW )
BOOST_SYMBOL_IMPORT boost::detail::winapi::DWORD_ WINAPI
VirtualQuery(
    boost::detail::winapi::LPCVOID_ lpAddress,
    ::_MEMORY_BASIC_INFORMATION* lpBuffer,
    boost::detail::winapi::DWORD_ dwLength
);
#endif // !defined( BOOST_WINAPI_IS_MINGW )
} // extern "C"
#endif // #if !defined( BOOST_USE_WINDOWS_H )

namespace boost {
namespace detail {
namespace winapi {

typedef struct BOOST_DETAIL_WINAPI_MAY_ALIAS MEMORY_BASIC_INFORMATION_ {
    PVOID_  BaseAddress;
    PVOID_  AllocationBase;
    DWORD_  AllocationProtect;
    SIZE_T_ RegionSize;
    DWORD_  State;
    DWORD_  Protect;
    DWORD_  Type;
} *PMEMORY_BASIC_INFORMATION_;

#if defined( BOOST_USE_WINDOWS_H )
typedef ::FARPROC FARPROC_;
typedef ::NEARPROC NEARPROC_;
typedef ::PROC PROC_;

const DWORD_ DONT_RESOLVE_DLL_REFERENCES_           = DONT_RESOLVE_DLL_REFERENCES;
const DWORD_ LOAD_WITH_ALTERED_SEARCH_PATH_         = LOAD_WITH_ALTERED_SEARCH_PATH;
#else // defined( BOOST_USE_WINDOWS_H )
const DWORD_ DONT_RESOLVE_DLL_REFERENCES_           = 0x00000001;
const DWORD_ LOAD_WITH_ALTERED_SEARCH_PATH_         = 0x00000008;
#endif // defined( BOOST_USE_WINDOWS_H )

// This one is not defined by MinGW
const DWORD_ LOAD_IGNORE_CODE_AUTHZ_LEVEL_          = 0x00000010;

#if !defined( BOOST_NO_ANSI_APIS )
using ::LoadLibraryA;
using ::LoadLibraryExA;
using ::GetModuleHandleA;
using ::GetModuleFileNameA;
#endif // !defined( BOOST_NO_ANSI_APIS )
using ::LoadLibraryW;
using ::LoadLibraryExW;
using ::GetModuleHandleW;
using ::GetModuleFileNameW;
using ::FreeLibrary;

#if !defined( UNDER_CE )
// For backward compatibility, don't use directly. Use get_proc_address instead.
using ::GetProcAddress;
#else
using ::GetProcAddressA;
using ::GetProcAddressW;
#endif

BOOST_FORCEINLINE FARPROC_ get_proc_address(HMODULE_ hModule, LPCSTR_ lpProcName)
{
#if !defined( UNDER_CE )
    return ::GetProcAddress(hModule, lpProcName);
#else
    return ::GetProcAddressA(hModule, lpProcName);
#endif
}

BOOST_FORCEINLINE SIZE_T_ VirtualQuery(LPCVOID_ lpAddress, MEMORY_BASIC_INFORMATION_* lpBuffer, ULONG_PTR_ dwLength)
{
    return ::VirtualQuery(lpAddress, reinterpret_cast< ::_MEMORY_BASIC_INFORMATION* >(lpBuffer), dwLength);
}

#if !defined( BOOST_NO_ANSI_APIS )
BOOST_FORCEINLINE HMODULE_ load_library(LPCSTR_ lpFileName)
{
    return ::LoadLibraryA(lpFileName);
}

BOOST_FORCEINLINE HMODULE_ load_library_ex(LPCSTR_ lpFileName, HANDLE_ hFile, DWORD_ dwFlags)
{
    return ::LoadLibraryExA(lpFileName, hFile, dwFlags);
}

BOOST_FORCEINLINE HMODULE_ get_module_handle(LPCSTR_ lpFileName)
{
    return ::GetModuleHandleA(lpFileName);
}

BOOST_FORCEINLINE DWORD_ get_module_file_name(HMODULE_ hModule, LPSTR_ lpFilename, DWORD_ nSize)
{
    return ::GetModuleFileNameA(hModule, lpFilename, nSize);
}
#endif // #if !defined( BOOST_NO_ANSI_APIS )

BOOST_FORCEINLINE HMODULE_ load_library(LPCWSTR_ lpFileName)
{
    return ::LoadLibraryW(lpFileName);
}

BOOST_FORCEINLINE HMODULE_ load_library_ex(LPCWSTR_ lpFileName, HANDLE_ hFile, DWORD_ dwFlags)
{
    return ::LoadLibraryExW(lpFileName, hFile, dwFlags);
}

BOOST_FORCEINLINE HMODULE_ get_module_handle(LPCWSTR_ lpFileName)
{
    return ::GetModuleHandleW(lpFileName);
}

BOOST_FORCEINLINE DWORD_ get_module_file_name(HMODULE_ hModule, LPWSTR_ lpFilename, DWORD_ nSize)
{
    return ::GetModuleFileNameW(hModule, lpFilename, nSize);
}

} // namespace winapi
} // namespace detail
} // namespace boost

#endif // BOOST_DETAIL_WINAPI_DLL_HPP
