//  environment.hpp  --------------------------------------------------------------//

//  Copyright 2016 Klemens D. Morgenstern

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt

#ifndef BOOST_DETAIL_WINAPI_ENVIRONMENT_HPP_
#define BOOST_DETAIL_WINAPI_ENVIRONMENT_HPP_

#include <boost/detail/winapi/basic_types.hpp>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

#if !defined( BOOST_USE_WINDOWS_H )
extern "C" {
#if !defined( BOOST_NO_ANSI_APIS )
BOOST_SYMBOL_IMPORT boost::detail::winapi::LPSTR_ WINAPI GetEnvironmentStringsA();
BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI FreeEnvironmentStringsA(boost::detail::winapi::LPSTR_);

BOOST_SYMBOL_IMPORT boost::detail::winapi::DWORD_ WINAPI GetEnvironmentVariableA(
    boost::detail::winapi::LPCSTR_ lpName,
    boost::detail::winapi::LPSTR_ lpBuffer,
    boost::detail::winapi::DWORD_ nSize
);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI SetEnvironmentVariableA(
    boost::detail::winapi::LPCSTR_ lpName,
    boost::detail::winapi::LPCSTR_ lpValue
);
#endif // !defined( BOOST_NO_ANSI_APIS )

BOOST_SYMBOL_IMPORT boost::detail::winapi::LPWSTR_ WINAPI GetEnvironmentStringsW();
BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI FreeEnvironmentStringsW(boost::detail::winapi::LPWSTR_);

BOOST_SYMBOL_IMPORT boost::detail::winapi::DWORD_ WINAPI GetEnvironmentVariableW(
    boost::detail::winapi::LPCWSTR_ lpName,
    boost::detail::winapi::LPWSTR_ lpBuffer,
    boost::detail::winapi::DWORD_ nSize
);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI SetEnvironmentVariableW(
    boost::detail::winapi::LPCWSTR_ lpName,
    boost::detail::winapi::LPCWSTR_ lpValue
);
} // extern "C"
#endif // !defined( BOOST_USE_WINDOWS_H )

namespace boost { namespace detail { namespace winapi {

#if !defined( BOOST_NO_ANSI_APIS )
using ::GetEnvironmentStringsA;
using ::FreeEnvironmentStringsA;
using ::GetEnvironmentVariableA;
using ::SetEnvironmentVariableA;
#endif // !defined( BOOST_NO_ANSI_APIS )

using ::GetEnvironmentStringsW;
using ::FreeEnvironmentStringsW;
using ::GetEnvironmentVariableW;
using ::SetEnvironmentVariableW;

template< typename Char >
Char* get_environment_strings();

#if !defined( BOOST_NO_ANSI_APIS )

template< >
BOOST_FORCEINLINE char* get_environment_strings< char >()
{
    return GetEnvironmentStringsA();
}

BOOST_FORCEINLINE BOOL_ free_environment_strings(boost::detail::winapi::LPSTR_ p)
{
    return FreeEnvironmentStringsA(p);
}

BOOST_FORCEINLINE DWORD_ get_environment_variable(LPCSTR_ name, LPSTR_ buffer, DWORD_ size)
{
    return GetEnvironmentVariableA(name, buffer, size);
}

BOOST_FORCEINLINE BOOL_ set_environment_variable(LPCSTR_ name, LPCSTR_ value)
{
    return SetEnvironmentVariableA(name, value);
}

#endif // !defined( BOOST_NO_ANSI_APIS )

template< >
BOOST_FORCEINLINE wchar_t* get_environment_strings< wchar_t >()
{
    return GetEnvironmentStringsW();
}

BOOST_FORCEINLINE BOOL_ free_environment_strings(boost::detail::winapi::LPWSTR_ p)
{
    return FreeEnvironmentStringsW(p);
}

BOOST_FORCEINLINE DWORD_ get_environment_variable(LPCWSTR_ name, LPWSTR_ buffer, DWORD_ size)
{
    return GetEnvironmentVariableW(name, buffer, size);
}

BOOST_FORCEINLINE BOOL_ set_environment_variable(LPCWSTR_ name, LPCWSTR_ value)
{
    return SetEnvironmentVariableW(name, value);
}

} // namespace winapi
} // namespace detail
} // namespace boost

#endif // BOOST_DETAIL_WINAPI_ENVIRONMENT_HPP_
