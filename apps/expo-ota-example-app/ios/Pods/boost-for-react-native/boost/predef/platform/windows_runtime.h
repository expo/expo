/*
Copyright (c) Microsoft Corporation 2014
Copyright Rene Rivera 2015
Distributed under the Boost Software License, Version 1.0.
(See accompanying file LICENSE_1_0.txt or copy at
http://www.boost.org/LICENSE_1_0.txt)
*/

#ifndef BOOST_PREDEF_PLAT_WINDOWS_RUNTIME_H
#define BOOST_PREDEF_PLAT_WINDOWS_RUNTIME_H

#include <boost/predef/version_number.h>
#include <boost/predef/make.h>
#include <boost/predef/os/windows.h>

/*`
[heading `BOOST_PLAT_WINDOWS_RUNTIME`]

[table
    [[__predef_symbol__] [__predef_version__]]

    [[`WINAPI_FAMILY == WINAPI_FAMILY_APP`] [__predef_detection__]]
    [[`WINAPI_FAMILY == WINAPI_FAMILY_PHONE_APP`] [__predef_detection__]]
    ]
 */

#define BOOST_PLAT_WINDOWS_RUNTIME BOOST_VERSION_NUMBER_NOT_AVAILABLE

#if BOOST_OS_WINDOWS && defined(WINAPI_FAMILY) && \
    ( WINAPI_FAMILY == WINAPI_FAMILY_APP || WINAPI_FAMILY == WINAPI_FAMILY_PHONE_APP )
#   undef BOOST_PLAT_WINDOWS_RUNTIME
#   define BOOST_PLAT_WINDOWS_RUNTIME BOOST_VERSION_NUMBER_AVAILABLE
#endif
 
#if BOOST_PLAT_WINDOWS_RUNTIME
#   define BOOST_PLAT_WINDOWS_RUNTIME_AVAILABLE
#   include <boost/predef/detail/platform_detected.h>
#endif

#define BOOST_PLAT_WINDOWS_RUNTIME_NAME "Windows Runtime"

#endif

#include <boost/predef/detail/test.h>
BOOST_PREDEF_DECLARE_TEST(BOOST_PLAT_WINDOWS_RUNTIME,BOOST_PLAT_WINDOWS_RUNTIME_NAME)
