/*
Copyright Rene Rivera 2013
Distributed under the Boost Software License, Version 1.0.
(See accompanying file LICENSE_1_0.txt or copy at
http://www.boost.org/LICENSE_1_0.txt)
*/

#ifndef BOOST_PREDEF_DETAIL_ENDIAN_COMPAT_H
#define BOOST_PREDEF_DETAIL_ENDIAN_COMPAT_H

#include <boost/predef/other/endian.h>

#if BOOST_ENDIAN_BIG_BYTE
#   define BOOST_BIG_ENDIAN
#   define BOOST_BYTE_ORDER 4321
#endif
#if BOOST_ENDIAN_LITTLE_BYTE
#   define BOOST_LITTLE_ENDIAN
#   define BOOST_BYTE_ORDER 1234
#endif
#if BOOST_ENDIAN_LITTLE_WORD
#   define BOOST_PDP_ENDIAN
#   define BOOST_BYTE_ORDER 2134
#endif

#endif
