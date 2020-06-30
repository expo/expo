//  directory_management.hpp  --------------------------------------------------------------//

//  Copyright 2010 Vicente J. Botet Escriba
//  Copyright 2015 Andrey Semashev

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt


#ifndef BOOST_DETAIL_WINAPI_DIRECTORY_MANAGEMENT_HPP
#define BOOST_DETAIL_WINAPI_DIRECTORY_MANAGEMENT_HPP

#include <boost/detail/winapi/basic_types.hpp>
#include <boost/detail/winapi/get_system_directory.hpp>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

#if !defined( BOOST_USE_WINDOWS_H )
extern "C" {
#if !defined( BOOST_NO_ANSI_APIS )
BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
    CreateDirectoryA(boost::detail::winapi::LPCSTR_, ::_SECURITY_ATTRIBUTES*);
BOOST_SYMBOL_IMPORT boost::detail::winapi::DWORD_ WINAPI
    GetTempPathA(boost::detail::winapi::DWORD_ length, boost::detail::winapi::LPSTR_ buffer);
BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
    RemoveDirectoryA(boost::detail::winapi::LPCSTR_);
#endif
BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
    CreateDirectoryW(boost::detail::winapi::LPCWSTR_, ::_SECURITY_ATTRIBUTES*);
BOOST_SYMBOL_IMPORT boost::detail::winapi::DWORD_ WINAPI
    GetTempPathW(boost::detail::winapi::DWORD_ length, boost::detail::winapi::LPWSTR_ buffer);
BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
    RemoveDirectoryW(boost::detail::winapi::LPCWSTR_);
}    
#endif

namespace boost {
namespace detail {
namespace winapi {

#if !defined( BOOST_NO_ANSI_APIS )
using ::GetTempPathA;
using ::RemoveDirectoryA;
#endif
using ::GetTempPathW;
using ::RemoveDirectoryW;

#if !defined( BOOST_NO_ANSI_APIS )
BOOST_FORCEINLINE BOOL_ CreateDirectoryA(LPCSTR_ pPathName, PSECURITY_ATTRIBUTES_ pSecurityAttributes)
{
    return ::CreateDirectoryA(pPathName, reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(pSecurityAttributes));
}
#endif

BOOST_FORCEINLINE BOOL_ CreateDirectoryW(LPCWSTR_ pPathName, PSECURITY_ATTRIBUTES_ pSecurityAttributes)
{
    return ::CreateDirectoryW(pPathName, reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(pSecurityAttributes));
}

#if !defined( BOOST_NO_ANSI_APIS )
BOOST_FORCEINLINE BOOL_ create_directory(LPCSTR_ pPathName, PSECURITY_ATTRIBUTES_ pSecurityAttributes)
{
    return ::CreateDirectoryA(pPathName, reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(pSecurityAttributes));
}
BOOST_FORCEINLINE DWORD_ get_temp_path(DWORD_ length, LPSTR_ buffer)
{
    return ::GetTempPathA(length, buffer);
}
BOOST_FORCEINLINE BOOL_ remove_directory(LPCSTR_ pPathName)
{
    return ::RemoveDirectoryA(pPathName);
}
#endif

BOOST_FORCEINLINE BOOL_ create_directory(LPCWSTR_ pPathName, PSECURITY_ATTRIBUTES_ pSecurityAttributes)
{
    return ::CreateDirectoryW(pPathName, reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(pSecurityAttributes));
}
BOOST_FORCEINLINE DWORD_ get_temp_path(DWORD_ length, LPWSTR_ buffer)
{
    return ::GetTempPathW(length, buffer);
}
BOOST_FORCEINLINE BOOL_ remove_directory(LPCWSTR_ pPathName)
{
    return ::RemoveDirectoryW(pPathName);
}

} // namespace winapi
} // namespace detail
} // namespace boost

#endif // BOOST_DETAIL_WINAPI_DIRECTORY_MANAGEMENT_HPP
