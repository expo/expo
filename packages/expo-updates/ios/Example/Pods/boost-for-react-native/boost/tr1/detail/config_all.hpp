//  (C) Copyright John Maddock 2005.
//  Use, modification and distribution are subject to the
//  Boost Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

/*
 * The gcc include path logic is derived from STLport:
 *
 * Copyright (c) 1994
 * Hewlett-Packard Company
 *
 * Copyright (c) 1996-1999
 * Silicon Graphics Computer Systems, Inc.
 *
 * Copyright (c) 1997
 * Moscow Center for SPARC Technology
 *
 * Copyright (c) 1999-2003
 * Boris Fomitchev
 *
 * This material is provided "as is", with absolutely no warranty expressed
 * or implied. Any use is at your own risk.
 *
 * Permission to use or copy this software for any purpose is hereby granted 
 * without fee, provided the above notices are retained on all copies.
 * Permission to modify the code and to distribute modified code is granted,
 * provided the above notices are retained, and a notice that the code was
 * modified is included with the above copyright notice.
 *
 */

#ifndef BOOST_TR1_DETAIL_CONFIG_ALL_HPP_INCLUDED
#  define BOOST_TR1_DETAIL_CONFIG_ALL_HPP_INCLUDED

//
// IMPORTANT: we must figure out the basics, such as how to
// forward to the real std lib headers *without* including
// boost/config.hpp or any of the std lib headers.  A classic 
// chicken and the egg problem....
//
// Including <cstddef> at least lets us detect STLport:
//
#include <cstddef>

// Including <cstdlib> allows us to use __GLIBCXX__ to
// determine the version of the stdc++ library in use
// under Darwin.
#include <cstdlib>

#  if defined(_RWSTD_VER) && _RWSTD_VER >= 0x04010200
#     if !defined (__SUNPRO_CC) && !defined (__DECCXX)
#        define BOOST_TR1_STD_CHEADER(name) <../include/ansi/name>
#     endif
#  endif

#ifdef __ANDROID__
#  define BOOST_TR1_GCC_INCLUDE_PATH include
#endif


#  if (defined(__SGI_STL_PORT) || defined(_STLPORT_VERSION)) && !defined(__BORLANDC__)
#     ifdef __SUNPRO_CC
         // can't use <../stlport/name> since some compilers put stlport in a different directory:
#        define BOOST_TR1_STD_HEADER(name) <../stlport4/name>
#     elif defined(__PGI)
#        define BOOST_TR1_STD_HEADER(name) <../CC/name>
#     else
#        define BOOST_TR1_STD_HEADER(name) <../stlport/name>
#     endif
#  elif defined(__PATHSCALE__) && (defined(__STD_RWCOMPILER_H__) || defined(_RWSTD_VER))
#     define BOOST_TR1_STD_HEADER(name) <../include/name>

#  elif defined(__SUNPRO_CC) && (defined(__STD_RWCOMPILER_H__) || defined(_RWSTD_VER))
#     define BOOST_TR1_STD_HEADER(name) <../stdcxx4/name>

#  elif defined(__HP_aCC)
      // HP aCC include path:
#     define BOOST_TR1_STD_HEADER(name) <../include_std/name>

#  elif defined(__DECCXX)
#     define BOOST_TR1_STD_HEADER(name) <../cxx/name>

#  elif defined(__BORLANDC__) && __BORLANDC__ >= 0x570
#     define BOOST_TR1_STD_HEADER(name) <../include/dinkumware/name>

#  elif defined(__clang__)
#     define BOOST_TR1_STD_HEADER(name) <../include/name>

#  elif defined(_CRAYC)
#     define BOOST_TR1_STD_HEADER(name) <../include/name>

#  elif defined(__GNUC__)
#    if defined(BOOST_TR1_GCC_INCLUDE_PATH)
#      define BOOST_TR1_STD_HEADER(name) <../BOOST_TR1_GCC_INCLUDE_PATH/name>
#    elif (defined(__FreeBSD__))
#      define BOOST_TR1_STD_HEADER(name) <../__GNUC__.__GNUC_MINOR__/name>
#    else
#      if ( (__GNUC__ == 3) && (defined(__APPLE_CC__) || defined(__CYGWIN__)))
#        define BOOST_TR1_STD_HEADER(name) <../c++/name>
#      elif ((__GLIBCXX__ == 20050421) && defined(__APPLE_CC__))
         // Some Darwin tools fix libstdc++ at 4.0.0 irrespective of the actual
         // compiler version:
#        define BOOST_TR1_STD_HEADER(name) <../4.0.0/name>
         /*
          *  Before version 3.4.0 the 0 patch level was not part of the include path:
          */
#      elif defined (__GNUC_PATCHLEVEL__) && ((__GNUC_PATCHLEVEL__ > 0) || \
                                              (__GNUC__ == 3 && __GNUC_MINOR__ >= 4) || \
                                              (__GNUC__ > 3))
#        define BOOST_TR1_STD_HEADER(name) <../__GNUC__.__GNUC_MINOR__.__GNUC_PATCHLEVEL__/name>
#      else
#        define BOOST_TR1_STD_HEADER(name) <../__GNUC__.__GNUC_MINOR__/name>
#      endif
#    endif

#      if !defined(BOOST_TR1_DISABLE_INCLUDE_NEXT) && !defined(__ICC) \
            && (defined(__FreeBSD__) || defined(linux) || defined(__linux) || defined(__linux__) || defined(__GNU__) || defined(__GLIBC__))
         // Disable use of #include_next on Linux as typically we are installed in a directory that is searched
         // *after* the std lib include path:
#        define BOOST_TR1_DISABLE_INCLUDE_NEXT
#      endif

#  else
#     define BOOST_TR1_STD_HEADER(name) <../include/name>
#  endif

#if !defined(BOOST_TR1_STD_CHEADER)
#  define BOOST_TR1_STD_CHEADER(name) BOOST_TR1_STD_HEADER(name)
#endif

#if defined(__GNUC__) && !defined(BOOST_HAS_INCLUDE_NEXT)
#  define BOOST_HAS_INCLUDE_NEXT
#endif
#ifdef __GXX_EXPERIMENTAL_CXX0X__
#  define BOOST_HAS_CPP_0X
#endif
#if defined(_MSC_VER) && (_MSC_VER >= 1600) && !defined(BOOST_HAS_CPP_0X)
#   define BOOST_HAS_CPP_0X
#endif
//
// We may be in the middle of parsing boost/config.hpp
// when this header is included, so don't rely on config
// stuff in the rest of this header...
//
// Find our actual std lib:
//
#if defined(BOOST_HAS_INCLUDE_NEXT) && !defined(BOOST_TR1_DISABLE_INCLUDE_NEXT)
//
// We don't take this branch if BOOST_TR1_DISABLE_INCLUDE_NEXT
// is defined as we may be installed in 
// /usr/include, in which case #include_next won't work as our
// include path will occur AFTER the regular std lib one :-(
//
#  ifndef BOOST_TR1_NO_RECURSION
#     define BOOST_TR1_NO_RECURSION
#     define BOOST_TR1_NO_CONFIG_ALL_RECURSION
#  endif
#  include_next <utility>
#  ifdef BOOST_TR1_NO_CONFIG_ALL_RECURSION
#     undef BOOST_TR1_NO_CONFIG_ALL_RECURSION
#     undef BOOST_TR1_NO_RECURSION
#  endif
#else
#  include BOOST_TR1_STD_HEADER(utility)
#endif

#include <boost/tr1/detail/config.hpp>

#endif


