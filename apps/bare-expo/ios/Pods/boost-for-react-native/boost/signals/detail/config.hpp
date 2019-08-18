/*
 *
 * Copyright (c) 1998-2002
 * John Maddock
 *
 * Copyright (c) 2003-2004
 * Douglas Gregor
 *
 * Distributed under the Boost Software License, Version 1.0. (See
 * accompanying file LICENSE_1_0.txt or copy at
 * http://www.boost.org/LICENSE_1_0.txt)
 *
 */

#ifndef BOOST_SIGNALS_CONFIG_HPP
#define BOOST_SIGNALS_CONFIG_HPP

#include <boost/config.hpp>

#ifdef BOOST_HAS_DECLSPEC
#  if defined(BOOST_ALL_DYN_LINK) || defined(BOOST_SIGNALS_DYN_LINK)
#    ifdef BOOST_SIGNALS_SOURCE
#      define BOOST_SIGNALS_DECL __declspec(dllexport)
#    else
#      define BOOST_SIGNALS_DECL __declspec(dllimport)
#    endif  // BOOST_SIGNALS_SOURCE
#  endif  // DYN_LINK
#endif  // BOOST_HAS_DECLSPEC

#ifndef BOOST_SIGNALS_DECL
#  define BOOST_SIGNALS_DECL
#endif

// Setup autolinking
#if !defined(BOOST_SIGNALS_SOURCE) && !defined(BOOST_ALL_NO_LIB) && !defined(BOOST_SIGNALS_NO_LIB)
#  define BOOST_LIB_NAME boost_signals

#  if defined(BOOST_ALL_DYN_LINK) || defined(BOOST_SIGNALS_DYN_LINK)
#    define BOOST_DYN_LINK
#  endif

#  include <boost/config/auto_link.hpp>
#endif // autolinking on

#endif // BOOST_SIGNALS_CONFIG_HPP









