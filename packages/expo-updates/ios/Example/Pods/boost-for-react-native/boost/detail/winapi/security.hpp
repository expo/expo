//  security.hpp  --------------------------------------------------------------//

//  Copyright 2010 Vicente J. Botet Escriba
//  Copyright 2015 Andrey Semashev

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt


#ifndef BOOST_DETAIL_WINAPI_SECURITY_HPP
#define BOOST_DETAIL_WINAPI_SECURITY_HPP

#include <boost/detail/winapi/basic_types.hpp>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

#if !defined( BOOST_USE_WINDOWS_H )
extern "C" {
struct _ACL;
struct _SECURITY_DESCRIPTOR;
#if defined( BOOST_WINAPI_IS_MINGW )
typedef _SECURITY_DESCRIPTOR *PSECURITY_DESCRIPTOR;
#else
typedef boost::detail::winapi::PVOID_ PSECURITY_DESCRIPTOR;
#endif

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
InitializeSecurityDescriptor(
    PSECURITY_DESCRIPTOR pSecurityDescriptor,
    boost::detail::winapi::DWORD_ dwRevision);
BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI
SetSecurityDescriptorDacl(
    PSECURITY_DESCRIPTOR pSecurityDescriptor,
    boost::detail::winapi::BOOL_ bDaclPresent,
    ::_ACL* pDacl,
    boost::detail::winapi::BOOL_ bDaclDefaulted);
}
#endif

namespace boost {
namespace detail {
namespace winapi {

typedef PVOID_ PSID_;
typedef WORD_ SECURITY_DESCRIPTOR_CONTROL_, *PSECURITY_DESCRIPTOR_CONTROL_;

typedef struct BOOST_DETAIL_WINAPI_MAY_ALIAS _ACL {
    BYTE_ AclRevision;
    BYTE_ Sbz1;
    WORD_ AclSize;
    WORD_ AceCount;
    WORD_ Sbz2;
} ACL_, *PACL_;

typedef struct BOOST_DETAIL_WINAPI_MAY_ALIAS _SECURITY_DESCRIPTOR {
    BYTE_ Revision;
    BYTE_ Sbz1;
    SECURITY_DESCRIPTOR_CONTROL_ Control;
    PSID_ Owner;
    PSID_ Group;
    PACL_ Sacl;
    PACL_ Dacl;
} SECURITY_DESCRIPTOR_, *PISECURITY_DESCRIPTOR_;

typedef ::PSECURITY_DESCRIPTOR PSECURITY_DESCRIPTOR_;

using ::InitializeSecurityDescriptor;

BOOST_FORCEINLINE BOOL_ SetSecurityDescriptorDacl(PSECURITY_DESCRIPTOR_ pSecurityDescriptor, BOOL_ bDaclPresent, PACL_ pDacl, BOOL_ bDaclDefaulted)
{
    return ::SetSecurityDescriptorDacl(pSecurityDescriptor, bDaclPresent, reinterpret_cast< ::_ACL* >(pDacl), bDaclDefaulted);
}

}
}
}

#endif // BOOST_DETAIL_WINAPI_SECURITY_HPP
