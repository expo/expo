/*
Copyright (c) Microsoft Corporation 2014
Copyright Rene Rivera 2015
Distributed under the Boost Software License, Version 1.0.
(See accompanying file LICENSE_1_0.txt or copy at
http://www.boost.org/LICENSE_1_0.txt)
*/

#ifndef BOOST_PREDEF_PLAT_WINDOWS_STORE_H
#define BOOST_PREDEF_PLAT_WINDOWS_STORE_H

#include <boost/predef/version_number.h>
#include <boost/predef/make.h>
#include <boost/predef/os/windows.h>

/*`
[heading `BOOST_PLAT_WINDOWS_STORE`]

[table
    [[__predef_symbol__] [__predef_version__]]

    [[`WINAPI_FAMILY == WINAPI_FAMILY_APP`] [__predef_detection__]]
    ]
 */

#define BOOST_PLAT_WINDOWS_STORE BOOST_VERSION_NUMBER_NOT_AVAILABLE

#if BOOST_OS_WINDOWS && defined(WINAPI_FAMILY) && WINAPI_FAMILY == WINAPI_FAMILY_APP
#   undef BOOST_PLAT_WINDOWS_STORE
#   define BOOST_PLAT_WINDOWS_STORE BOOST_VERSION_NUMBER_AVAILABLE
#endif
 
#if BOOST_PLAT_WINDOWS_STORE
#   define BOOST_PLAT_WINDOWS_STORE_AVAILABLE
#   include <boost/predef/detail/platform_detected.h>
#endif

#define BOOST_PLAT_WINDOWS_STORE_NAME "Windows Store"

#endif

#include <boost/predef/detail/test.h>
BOOST_PREDEF_DECLARE_TEST(BOOST_PLAT_WINDOWS_STORE,BOOST_PLAT_WINDOWS_STORE_NAME)
