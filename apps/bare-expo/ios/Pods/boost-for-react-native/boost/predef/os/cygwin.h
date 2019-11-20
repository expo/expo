/*
Copyright Rene Rivera 2008-2015
Distributed under the Boost Software License, Version 1.0.
(See accompanying file LICENSE_1_0.txt or copy at
http://www.boost.org/LICENSE_1_0.txt)
*/

#ifndef BOOST_PREDEF_OS_CYGWIN_H
#define BOOST_PREDEF_OS_CYGWIN_H

#include <boost/predef/version_number.h>
#include <boost/predef/make.h>

/*`
[heading `BOOST_OS_CYGWIN`]

[@http://en.wikipedia.org/wiki/Cygwin Cygwin] evironment.

[table
    [[__predef_symbol__] [__predef_version__]]

    [[`__CYGWIN__`] [__predef_detection__]]
    ]
 */

#define BOOST_OS_CYGWIN BOOST_VERSION_NUMBER_NOT_AVAILABLE

#if !defined(BOOST_PREDEF_DETAIL_OS_DETECTED) && ( \
    defined(__CYGWIN__) \
    )
#   undef BOOST_OS_CYGWIN
#   define BOOST_OS_CYGWIN BOOST_VERSION_NUMBER_AVAILABLE
#endif

#if BOOST_OS_CYGWIN
#   define BOOST_OS_CYGWIN_AVAILABLE
#   include <boost/predef/detail/os_detected.h>
#endif

#define BOOST_OS_CYGWIN_NAME "Cygwin"

#endif

#include <boost/predef/detail/test.h>
BOOST_PREDEF_DECLARE_TEST(BOOST_OS_CYGWIN,BOOST_OS_CYGWIN_NAME)
