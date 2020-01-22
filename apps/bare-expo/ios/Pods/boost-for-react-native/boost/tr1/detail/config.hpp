//  (C) Copyright John Maddock 2005-7.
//  Use, modification and distribution are subject to the
//  Boost Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_TR1_DETAIL_CONFIG_HPP_INCLUDED
#  define BOOST_TR1_DETAIL_CONFIG_HPP_INCLUDED

#include <cstddef>

#if (defined(__GNUC__) && !(defined(linux) || defined(__linux) || defined(__linux__))) \
   || (!defined(__FreeBSD__) && defined(__GNUC__)) \
   || (!defined(_AIX) && defined(__IBMCPP__)  && (__IBMCPP__ >= 800)) 
   // Disable use of #include_next on Linux as typically we are installed in a 
   // directory that is searched *after* the std lib include path.
#if !defined(BOOST_HAS_INCLUDE_NEXT)
#  define BOOST_HAS_INCLUDE_NEXT
#endif
// Need to find out if we're using GLIBC:
#ifdef BOOST_TR1_UTILITY_INCLUDED
// Oops we're in a recursive include path!!
// Need to include utility, or some std lib header,
// but *not* via <utility> or <boost/config/no_tr1/utility.hpp>
#  ifndef BOOST_TR1_NO_RECURSION
#     define BOOST_TR1_NO_RECURSION
#     define BOOST_TR1_NO_CONFIG_RECURSION
#  endif
#  if defined(BOOST_HAS_INCLUDE_NEXT) && !defined(BOOST_TR1_DISABLE_INCLUDE_NEXT)
#     include_next <utility>
#  else
#     include BOOST_TR1_STD_HEADER(utility)
#  endif
#  ifdef BOOST_TR1_NO_CONFIG_RECURSION
#     undef BOOST_TR1_NO_CONFIG_RECURSION
#     undef BOOST_TR1_NO_RECURSION
#  endif
#else
#include <boost/config/no_tr1/utility.hpp>
#endif
#endif

#if defined(__GLIBCXX__) && !defined(BOOST_TR1_PATH)
#  define BOOST_TR1_PATH(name) tr1/name
#endif
#if !defined(BOOST_TR1_PATH)
#  define BOOST_TR1_PATH(name) name
#endif

#define BOOST_TR1_HEADER(name) <BOOST_TR1_PATH(name)>

// Can't use BOOST_WORKAROUND here, it leads to recursive includes:
#if (defined(__BORLANDC__) && (__BORLANDC__ <= 0x600))
#  define BOOST_TR1_USE_OLD_TUPLE
#endif

#ifdef __IBMCPP_TR1__
   // turn on support for everything:
#  define BOOST_HAS_TR1
#endif

#ifdef __GXX_EXPERIMENTAL_CXX0X__
#  define BOOST_HAS_TR1_COMPLEX_OVERLOADS
#  define BOOST_HAS_TR1_COMPLEX_INVERSE_TRIG
#endif

#ifdef BOOST_HAS_TR1
   // turn on support for everything:
#  define BOOST_HAS_TR1_ARRAY
#  define BOOST_HAS_TR1_COMPLEX_OVERLOADS
#  define BOOST_HAS_TR1_COMPLEX_INVERSE_TRIG
#  define BOOST_HAS_TR1_REFERENCE_WRAPPER
#  define BOOST_HAS_TR1_RESULT_OF
#  define BOOST_HAS_TR1_MEM_FN
#  define BOOST_HAS_TR1_BIND
#  define BOOST_HAS_TR1_FUNCTION
#  define BOOST_HAS_TR1_HASH
#  define BOOST_HAS_TR1_SHARED_PTR
#  define BOOST_HAS_TR1_RANDOM
#  define BOOST_HAS_TR1_REGEX
#  define BOOST_HAS_TR1_TUPLE
#  define BOOST_HAS_TR1_TYPE_TRAITS
#  define BOOST_HAS_TR1_UTILITY
#  define BOOST_HAS_TR1_UNORDERED_MAP
#  define BOOST_HAS_TR1_UNORDERED_SET
#  define BOOST_HAS_TR1_CMATH

#endif

#if defined(__MWERKS__) && (__MWERKS__ >= 0x3205)
//
// Very preliminary MWCW support, may not be right:
//
#  define BOOST_HAS_TR1_SHARED_PTR
#  define BOOST_HAS_TR1_REFERENCE_WRAPPER
#  define BOOST_HAS_TR1_FUNCTION
#  define BOOST_HAS_TR1_TUPLE
#  define BOOST_HAS_TR1_RESULT_OF
#endif

#ifdef BOOST_HAS_GCC_TR1
   // turn on support for everything in gcc 4.0.x:
#  define BOOST_HAS_TR1_ARRAY
#if (__GNUC__ * 100 + __GNUC_MINOR__) >= 403
//#  define BOOST_HAS_TR1_COMPLEX_OVERLOADS
#  define BOOST_HAS_TR1_COMPLEX_INVERSE_TRIG
#endif
#  define BOOST_HAS_TR1_REFERENCE_WRAPPER
#  define BOOST_HAS_TR1_RESULT_OF
#  define BOOST_HAS_TR1_MEM_FN
#  define BOOST_HAS_TR1_BIND
#  define BOOST_HAS_TR1_FUNCTION
#  define BOOST_HAS_TR1_HASH
#  define BOOST_HAS_TR1_SHARED_PTR
#if (__GNUC__ * 100 + __GNUC_MINOR__) >= 403
#  define BOOST_HAS_TR1_RANDOM
//#  define BOOST_HAS_TR1_REGEX
#ifdef _GLIBCXX_USE_C99_MATH_TR1
#  define BOOST_HAS_TR1_CMATH
#endif
#endif
#  define BOOST_HAS_TR1_TUPLE
#  define BOOST_HAS_TR1_TYPE_TRAITS
#  define BOOST_HAS_TR1_UTILITY
#  define BOOST_HAS_TR1_UNORDERED_MAP
#  define BOOST_HAS_TR1_UNORDERED_SET

#endif

#if defined(_MSC_VER) && (_MSC_VER >= 1500) \
   && defined(_MSC_FULL_VER) && \
   !defined(__SGI_STL_PORT) && \
   !defined(_STLPORT_VERSION) && \
   !defined(_RWSTD_VER_STR) && \
   !defined(_RWSTD_VER)
//
// MSVC-9.0 defines a not-quite TR1 conforming hash
// function object in <functional>, so we must define
// this here, in addition the feature pack for VC9
// provides a more or less full TR1 implementation:
//
#  if (defined(_HAS_TR1) && (_HAS_TR1 + 0)) || (_CPPLIB_VER >= 540)
#    define BOOST_HAS_TR1_ARRAY
#    define BOOST_HAS_TR1_REFERENCE_WRAPPER
#    define BOOST_HAS_TR1_RESULT_OF
#    define BOOST_HAS_TR1_MEM_FN
#    define BOOST_HAS_TR1_BIND
#    define BOOST_HAS_TR1_FUNCTION
#    define BOOST_HAS_TR1_HASH
#    define BOOST_HAS_TR1_SHARED_PTR
#    define BOOST_HAS_TR1_RANDOM
#    define BOOST_HAS_TR1_REGEX
#    define BOOST_HAS_TR1_TUPLE
#    define BOOST_HAS_TR1_TYPE_TRAITS
#    define BOOST_HAS_TR1_UTILITY
#    define BOOST_HAS_TR1_UNORDERED_MAP
#    define BOOST_HAS_TR1_UNORDERED_SET
#  else
#    define BOOST_HAS_TR1_HASH
#  endif
#  if _MSC_VER >= 1600
#     define BOOST_HAS_CPP_0X
#  endif
#  if _MSC_VER >= 1700 
#     define BOOST_HAS_TR1_COMPLEX_OVERLOADS 
#  endif 
#endif

#include <boost/config.hpp>

#endif



