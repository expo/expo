//  file_mapping.hpp  --------------------------------------------------------------//

//  Copyright 2010 Vicente J. Botet Escriba
//  Copyright 2015 Andrey Semashev
//  Copyright 2016 Jorge Lodos

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt


#ifndef BOOST_DETAIL_WINAPI_FILE_MAPPING_HPP
#define BOOST_DETAIL_WINAPI_FILE_MAPPING_HPP

#include <boost/detail/winapi/basic_types.hpp>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

#if !defined( BOOST_USE_WINDOWS_H )
extern "C" {
#if !defined( BOOST_NO_ANSI_APIS )
BOOST_SYMBOL_IMPORT boost::detail::winapi::HANDLE_ WINAPI
CreateFileMappingA(
    boost::detail::winapi::HANDLE_ hFile,
    ::_SECURITY_ATTRIBUTES* lpFileMappingAttributes,
    boost::detail::winapi::DWORD_ flProtect,
    boost::detail::winapi::DWORD_ dwMaximumSizeHigh,
    boost::detail::winapi::DWORD_ dwMaximumSizeLow,
    boost::detail::winapi::LPCSTR_ lpName);

BOOST_SYMBOL_IMPORT boost::detail::winapi::HANDLE_ WINAPI
OpenFileMappingA(
    boost::detail::winapi::DWORD_ dwDesiredAccess,
    boost::detail::winapi::BOOL_ bInheritHandle,
    boost::detail::winapi::LPCSTR_ lpName);
#endif

BOOST_SYMBOL_IMPORT boost::detail::winapi::HANDLE_ WINAPI
CreateFileMappingW(
    boost::detail::winapi::HANDLE_ hFile,
    ::_SECURITY_ATTRIBUTES* lpFileMappingAttributes,
    boost::detail::winapi::DWORD_ flProtect,
    boost::detail::winapi::DWORD_ dwMaximumSizeHigh,
    boost::detail::winapi::DWORD_ dwMaximumSizeLow,
    boost::detail::winapi::LPCWSTR_ lpName);

BOOST_SYMBOL_IMPORT boost::detail::winapi::HANDLE_ WINAPI
OpenFileMappingW(
    boost::detail::winapi::DWORD_ dwDesiredAccess,
    boost::detail::winapi::BOOL_ bInheritHandle,
    boost::detail::winapi::LPCWSTR_ lpName);

BOOST_SYMBOL_IMPORT boost::detail::winapi::LPVOID_ WINAPI
MapViewOfFile(
    boost::detail::winapi::HANDLE_ hFileMappingObject,
    boost::detail::winapi::DWORD_ dwDesiredAccess,
    boost::detail::winapi::DWORD_ dwFileOffsetHigh,
    boost::detail::winapi::DWORD_ dwFileOffsetLow,
    boost::detail::winapi::SIZE_T_ dwNumberOfBytesToMap);

BOOST_SYMBOL_IMPORT boost::detail::winapi::LPVOID_ WINAPI
MapViewOfFileEx(
    boost::detail::winapi::HANDLE_ hFileMappingObject,
    boost::detail::winapi::DWORD_ dwDesiredAccess,
    boost::detail::winapi::DWORD_ dwFileOffsetHigh,
    boost::detail::winapi::DWORD_ dwFileOffsetLow,
    boost::detail::winapi::SIZE_T_ dwNumberOfBytesToMap,
    boost::detail::winapi::LPVOID_ lpBaseAddress);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
FlushViewOfFile(
    boost::detail::winapi::LPCVOID_ lpBaseAddress,
    boost::detail::winapi::SIZE_T_ dwNumberOfBytesToFlush);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
UnmapViewOfFile(boost::detail::winapi::LPCVOID_ lpBaseAddress);
}
#endif

namespace boost {
namespace detail {
namespace winapi {

#if defined( BOOST_USE_WINDOWS_H )

const DWORD_ SEC_FILE_ = SEC_FILE;
const DWORD_ SEC_IMAGE_ = SEC_IMAGE;
const DWORD_ SEC_RESERVE_ = SEC_RESERVE;
const DWORD_ SEC_COMMIT_ = SEC_COMMIT;
const DWORD_ SEC_NOCACHE_ = SEC_NOCACHE;

// These permission flags are undocumented and some of them are equivalent to the FILE_MAP_* flags.
// SECTION_QUERY enables NtQuerySection.
// http://undocumented.ntinternals.net/index.html?page=UserMode%2FUndocumented%20Functions%2FNT%20Objects%2FSection%2FNtQuerySection.html
const DWORD_ SECTION_QUERY_ = SECTION_QUERY;
const DWORD_ SECTION_MAP_WRITE_ = SECTION_MAP_WRITE;
const DWORD_ SECTION_MAP_READ_ = SECTION_MAP_READ;
const DWORD_ SECTION_MAP_EXECUTE_ = SECTION_MAP_EXECUTE;
const DWORD_ SECTION_EXTEND_SIZE_ = SECTION_EXTEND_SIZE;
const DWORD_ SECTION_ALL_ACCESS_ = SECTION_ALL_ACCESS;

const DWORD_ FILE_MAP_COPY_ = FILE_MAP_COPY;
const DWORD_ FILE_MAP_WRITE_ = FILE_MAP_WRITE;
const DWORD_ FILE_MAP_READ_ = FILE_MAP_READ;
const DWORD_ FILE_MAP_ALL_ACCESS_ = FILE_MAP_ALL_ACCESS;

#else // defined( BOOST_USE_WINDOWS_H )

const DWORD_ SEC_FILE_ = 0x800000;
const DWORD_ SEC_IMAGE_ = 0x1000000;
const DWORD_ SEC_RESERVE_ = 0x4000000;
const DWORD_ SEC_COMMIT_ = 0x8000000;
const DWORD_ SEC_NOCACHE_ = 0x10000000;

// These permission flags are undocumented and some of them are equivalent to the FILE_MAP_* flags.
// SECTION_QUERY enables NtQuerySection.
// http://undocumented.ntinternals.net/index.html?page=UserMode%2FUndocumented%20Functions%2FNT%20Objects%2FSection%2FNtQuerySection.html
const DWORD_ SECTION_QUERY_ = 0x00000001;
const DWORD_ SECTION_MAP_WRITE_ = 0x00000002;
const DWORD_ SECTION_MAP_READ_ = 0x00000004;
const DWORD_ SECTION_MAP_EXECUTE_ = 0x00000008;
const DWORD_ SECTION_EXTEND_SIZE_ = 0x00000010;
const DWORD_ SECTION_ALL_ACCESS_ = 0x000F001F; // STANDARD_RIGHTS_REQUIRED | SECTION_*

const DWORD_ FILE_MAP_COPY_ = SECTION_QUERY_;
const DWORD_ FILE_MAP_WRITE_ = SECTION_MAP_WRITE_;
const DWORD_ FILE_MAP_READ_ = SECTION_MAP_READ_;
const DWORD_ FILE_MAP_ALL_ACCESS_ = SECTION_ALL_ACCESS_;

#endif // defined( BOOST_USE_WINDOWS_H )

// These constants are not defined in Windows SDK up until the one shipped with MSVC 8 and MinGW (as of 2016-02-14)
const DWORD_ SECTION_MAP_EXECUTE_EXPLICIT_ = 0x00000020; // not included in SECTION_ALL_ACCESS
const DWORD_ FILE_MAP_EXECUTE_ = SECTION_MAP_EXECUTE_EXPLICIT_; // not included in FILE_MAP_ALL_ACCESS

// These constants are not defined in Windows SDK up until 6.0A and MinGW (as of 2016-02-14)
const DWORD_ SEC_PROTECTED_IMAGE_ = 0x2000000;
const DWORD_ SEC_WRITECOMBINE_ = 0x40000000;
const DWORD_ SEC_LARGE_PAGES_ = 0x80000000;
const DWORD_ SEC_IMAGE_NO_EXECUTE_ = (SEC_IMAGE_ | SEC_NOCACHE_);

#if !defined( BOOST_NO_ANSI_APIS )
using ::OpenFileMappingA;
#endif
using ::OpenFileMappingW;
using ::MapViewOfFile;
using ::MapViewOfFileEx;
using ::FlushViewOfFile;
using ::UnmapViewOfFile;

#if !defined( BOOST_NO_ANSI_APIS )
BOOST_FORCEINLINE HANDLE_ CreateFileMappingA(
    HANDLE_ hFile,
    SECURITY_ATTRIBUTES_* lpFileMappingAttributes,
    DWORD_ flProtect,
    DWORD_ dwMaximumSizeHigh,
    DWORD_ dwMaximumSizeLow,
    LPCSTR_ lpName)
{
    return ::CreateFileMappingA(
        hFile,
        reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpFileMappingAttributes),
        flProtect,
        dwMaximumSizeHigh,
        dwMaximumSizeLow,
        lpName);
}
#endif

BOOST_FORCEINLINE HANDLE_ CreateFileMappingW(
    HANDLE_ hFile,
    SECURITY_ATTRIBUTES_* lpFileMappingAttributes,
    DWORD_ flProtect,
    DWORD_ dwMaximumSizeHigh,
    DWORD_ dwMaximumSizeLow,
    LPCWSTR_ lpName)
{
    return ::CreateFileMappingW(
        hFile,
        reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpFileMappingAttributes),
        flProtect,
        dwMaximumSizeHigh,
        dwMaximumSizeLow,
        lpName);
}

#if !defined( BOOST_NO_ANSI_APIS )
BOOST_FORCEINLINE HANDLE_ create_file_mapping(
    HANDLE_ hFile,
    SECURITY_ATTRIBUTES_* lpFileMappingAttributes,
    DWORD_ flProtect,
    DWORD_ dwMaximumSizeHigh,
    DWORD_ dwMaximumSizeLow,
    LPCSTR_ lpName)
{
    return ::CreateFileMappingA(
        hFile,
        reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpFileMappingAttributes),
        flProtect,
        dwMaximumSizeHigh,
        dwMaximumSizeLow,
        lpName);
}

BOOST_FORCEINLINE HANDLE_ open_file_mapping(DWORD_ dwDesiredAccess, BOOL_ bInheritHandle, LPCSTR_ lpName)
{
    return ::OpenFileMappingA(dwDesiredAccess, bInheritHandle, lpName);
}
#endif

BOOST_FORCEINLINE HANDLE_ create_file_mapping(
    HANDLE_ hFile,
    SECURITY_ATTRIBUTES_* lpFileMappingAttributes,
    DWORD_ flProtect,
    DWORD_ dwMaximumSizeHigh,
    DWORD_ dwMaximumSizeLow,
    LPCWSTR_ lpName)
{
    return ::CreateFileMappingW(
        hFile,
        reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpFileMappingAttributes),
        flProtect,
        dwMaximumSizeHigh,
        dwMaximumSizeLow,
        lpName);
}

BOOST_FORCEINLINE HANDLE_ open_file_mapping(DWORD_ dwDesiredAccess, BOOL_ bInheritHandle, LPCWSTR_ lpName)
{
    return ::OpenFileMappingW(dwDesiredAccess, bInheritHandle, lpName);
}

}
}
}

#endif // BOOST_DETAIL_WINAPI_FILE_MAPPING_HPP
