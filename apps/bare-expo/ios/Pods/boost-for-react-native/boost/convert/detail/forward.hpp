// Copyright (c) 2009-2016 Vladimir Batov.
// Use, modification and distribution are subject to the Boost Software License,
// Version 1.0. See http://www.boost.org/LICENSE_1_0.txt.

#ifndef BOOST_CONVERT_FORWARD_HPP
#define BOOST_CONVERT_FORWARD_HPP

#if defined(_MSC_VER)
#   pragma warning(disable: 4244)
#   pragma warning(disable: 4224)
#   pragma warning(disable: 4996)
#   pragma warning(disable: 4180) // qualifier applied to function type has no meaning
#   pragma warning(disable: 4100) // unreferenced formal parameter
#   pragma warning(disable: 4146) // unary minus operator applied to unsigned type

#if _MSC_VER < 1900 /* MSVC-14 defines real snprintf()... just about time! */
#   define snprintf _snprintf
#endif

#endif

#include <boost/config.hpp>
#include <boost/version.hpp>
#include <boost/optional.hpp>

#if defined(BOOST_NO_CXX11_VARIADIC_TEMPLATES) || defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
#undef BOOST_CONVERT_CXX11
#else
#define BOOST_CONVERT_CXX11
#endif

#if defined(BOOST_INTEL) && (BOOST_INTEL <= 1200) /* Intel 12.0 and lower have broken SFINAE */
#   define BOOST_CONVERT_INTEL_SFINAE_BROKEN
#endif

#if defined(BOOST_MSVC) && (BOOST_MSVC < 1800) /* MSVC-11 and lower have broken SFINAE */
#   define BOOST_CONVERT_MSVC_SFINAE_BROKEN
#endif

#endif // BOOST_CONVERT_FORWARD_HPP
