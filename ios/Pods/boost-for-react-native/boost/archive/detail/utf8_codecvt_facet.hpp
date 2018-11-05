// Copyright (c) 2001 Ronald Garcia, Indiana University (garcia@osl.iu.edu)
// Andrew Lumsdaine, Indiana University (lums@osl.iu.edu).
// Distributed under the Boost Software License, Version 1.0. (See
// accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_ARCHIVE_DETAIL_UTF8_CODECVT_FACET_HPP
#define BOOST_ARCHIVE_DETAIL_UTF8_CODECVT_FACET_HPP

#include <boost/config.hpp>

// std::codecvt_utf8 doesn't seem to work for msvc
// versions prior to MSVC 14.0

#if defined(_MSC_VER) && _MSC_VER < 1900 \
||  defined( BOOST_NO_CXX11_HDR_CODECVT )
    #include <boost/archive/detail/decl.hpp>
    #define BOOST_UTF8_BEGIN_NAMESPACE \
         namespace boost { namespace archive { namespace detail {
    #define BOOST_UTF8_DECL BOOST_ARCHIVE_DECL
    #define BOOST_UTF8_END_NAMESPACE }}}

    #include <boost/detail/utf8_codecvt_facet.hpp>

    #undef BOOST_UTF8_END_NAMESPACE
    #undef BOOST_UTF8_DECL
    #undef BOOST_UTF8_BEGIN_NAMESPACE
#else
    #include <codecvt>
    namespace boost { namespace archive { namespace detail {
        typedef std::codecvt_utf8<wchar_t> utf8_codecvt_facet;
    } } }
#endif // BOOST_NO_CXX11_HDR_CODECVT
#endif // BOOST_ARCHIVE_DETAIL_UTF8_CODECVT_FACET_HPP
