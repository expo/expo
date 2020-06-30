//  crypt.hpp  --------------------------------------------------------------//

//  Copyright 2014 Antony Polukhin
//  Copyright 2015 Andrey Semashev

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt


#ifndef BOOST_DETAIL_WINAPI_CRYPT_HPP
#define BOOST_DETAIL_WINAPI_CRYPT_HPP

#include <boost/detail/winapi/basic_types.hpp>
#include <boost/detail/winapi/detail/cast_ptr.hpp>
#if defined( BOOST_USE_WINDOWS_H )
// This header is not always included as part of windows.h
#include <wincrypt.h>
#endif

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

#if !defined( BOOST_USE_WINDOWS_H )
namespace boost { namespace detail { namespace winapi {
typedef ULONG_PTR_ HCRYPTPROV_;
}}}

// Some versions of MinGW (including the latest ones) contain buggy declarations of CryptEnumProvidersA and CryptEnumProvidersW.
// We cannot detect those broken versions, and we can't include the system header because it's incomplete.
// So below we duplicate the broken declarations here and work around the problem with cast_ptr. These declarations
// will have to be removed when MinGW is fixed.

extern "C" {
#if !defined( BOOST_NO_ANSI_APIS )
#if !defined( BOOST_WINAPI_IS_MINGW ) || !defined( UNICODE )
BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
CryptEnumProvidersA(
    boost::detail::winapi::DWORD_ dwIndex,
    boost::detail::winapi::DWORD_ *pdwReserved,
    boost::detail::winapi::DWORD_ dwFlags,
    boost::detail::winapi::DWORD_ *pdwProvType,
    boost::detail::winapi::LPSTR_ szProvName,
    boost::detail::winapi::DWORD_ *pcbProvName);
#else
// Broken declaration in MinGW
BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
CryptEnumProvidersA(
    boost::detail::winapi::DWORD_ dwIndex,
    boost::detail::winapi::DWORD_ *pdwReserved,
    boost::detail::winapi::DWORD_ dwFlags,
    boost::detail::winapi::DWORD_ *pdwProvType,
    boost::detail::winapi::LPWSTR_ szProvName,
    boost::detail::winapi::DWORD_ *pcbProvName);
#endif

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
CryptAcquireContextA(
    boost::detail::winapi::HCRYPTPROV_ *phProv,
    boost::detail::winapi::LPCSTR_ pszContainer,
    boost::detail::winapi::LPCSTR_ pszProvider,
    boost::detail::winapi::DWORD_ dwProvType,
    boost::detail::winapi::DWORD_ dwFlags);
#endif // !defined( BOOST_NO_ANSI_APIS )

#if !defined( BOOST_WINAPI_IS_MINGW ) || defined( UNICODE )
BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
CryptEnumProvidersW(
    boost::detail::winapi::DWORD_ dwIndex,
    boost::detail::winapi::DWORD_ *pdwReserved,
    boost::detail::winapi::DWORD_ dwFlags,
    boost::detail::winapi::DWORD_ *pdwProvType,
    boost::detail::winapi::LPWSTR_ szProvName,
    boost::detail::winapi::DWORD_ *pcbProvName);
#else
// Broken declaration in MinGW
BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
CryptEnumProvidersW(
    boost::detail::winapi::DWORD_ dwIndex,
    boost::detail::winapi::DWORD_ *pdwReserved,
    boost::detail::winapi::DWORD_ dwFlags,
    boost::detail::winapi::DWORD_ *pdwProvType,
    boost::detail::winapi::LPSTR_ szProvName,
    boost::detail::winapi::DWORD_ *pcbProvName);
#endif

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
CryptAcquireContextW(
    boost::detail::winapi::HCRYPTPROV_ *phProv,
    boost::detail::winapi::LPCWSTR_ szContainer,
    boost::detail::winapi::LPCWSTR_ szProvider,
    boost::detail::winapi::DWORD_ dwProvType,
    boost::detail::winapi::DWORD_ dwFlags);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
CryptGenRandom(
    boost::detail::winapi::HCRYPTPROV_ hProv,
    boost::detail::winapi::DWORD_ dwLen,
    boost::detail::winapi::BYTE_ *pbBuffer);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
CryptReleaseContext(
    boost::detail::winapi::HCRYPTPROV_ hProv,
    boost::detail::winapi::DWORD_ dwFlags);
}
#endif // !defined( BOOST_USE_WINDOWS_H )

namespace boost {
namespace detail {
namespace winapi {

#if defined( BOOST_USE_WINDOWS_H )

typedef ::HCRYPTPROV HCRYPTPROV_;

const DWORD_ PROV_RSA_FULL_         = PROV_RSA_FULL;

const DWORD_ CRYPT_VERIFYCONTEXT_   = CRYPT_VERIFYCONTEXT;
const DWORD_ CRYPT_NEWKEYSET_       = CRYPT_NEWKEYSET;
const DWORD_ CRYPT_DELETEKEYSET_    = CRYPT_DELETEKEYSET;
const DWORD_ CRYPT_MACHINE_KEYSET_  = CRYPT_MACHINE_KEYSET;
const DWORD_ CRYPT_SILENT_          = CRYPT_SILENT;

#else

const DWORD_ PROV_RSA_FULL_         = 1;

const DWORD_ CRYPT_VERIFYCONTEXT_   = 0xF0000000;
const DWORD_ CRYPT_NEWKEYSET_       = 8;
const DWORD_ CRYPT_DELETEKEYSET_    = 16;
const DWORD_ CRYPT_MACHINE_KEYSET_  = 32;
const DWORD_ CRYPT_SILENT_          = 64;

#endif

#if !defined( BOOST_NO_ANSI_APIS )
using ::CryptEnumProvidersA;
using ::CryptAcquireContextA;
#endif
using ::CryptEnumProvidersW;
using ::CryptAcquireContextW;
using ::CryptGenRandom;
using ::CryptReleaseContext;

#if !defined( BOOST_NO_ANSI_APIS )
BOOST_FORCEINLINE BOOL_ crypt_enum_providers(
    DWORD_ dwIndex,
    DWORD_ *pdwReserved,
    DWORD_ dwFlags,
    DWORD_ *pdwProvType,
    LPSTR_ szProvName,
    DWORD_ *pcbProvName)
{
    return ::CryptEnumProvidersA(dwIndex, pdwReserved, dwFlags, pdwProvType, winapi::detail::cast_ptr(szProvName), pcbProvName);
}

BOOST_FORCEINLINE BOOL_ crypt_acquire_context(
    HCRYPTPROV_ *phProv,
    LPCSTR_ pszContainer,
    LPCSTR_ pszProvider,
    DWORD_ dwProvType,
    DWORD_ dwFlags)
{
    return ::CryptAcquireContextA(phProv, pszContainer, pszProvider, dwProvType, dwFlags);
}
#endif

BOOST_FORCEINLINE BOOL_ crypt_enum_providers(
    DWORD_ dwIndex,
    DWORD_ *pdwReserved,
    DWORD_ dwFlags,
    DWORD_ *pdwProvType,
    LPWSTR_ szProvName,
    DWORD_ *pcbProvName)
{
    return ::CryptEnumProvidersW(dwIndex, pdwReserved, dwFlags, pdwProvType, winapi::detail::cast_ptr(szProvName), pcbProvName);
}

BOOST_FORCEINLINE BOOL_ crypt_acquire_context(
    HCRYPTPROV_ *phProv,
    LPCWSTR_ szContainer,
    LPCWSTR_ szProvider,
    DWORD_ dwProvType,
    DWORD_ dwFlags)
{
    return ::CryptAcquireContextW(phProv, szContainer, szProvider, dwProvType, dwFlags);
}

}
}
}

#endif // BOOST_DETAIL_WINAPI_CRYPT_HPP
