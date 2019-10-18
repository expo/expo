//  (C) Copyright Gennadiy Rozental 2005-2008.
//  Distributed under the Boost Software License, Version 1.0.
//  (See accompanying file LICENSE_1_0.txt or copy at 
//  http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org/libs/test for the library home page.
//
//  File        : $RCSfile$
//
//  Version     : $Revision$
//
//  Description : optional internal tracing
// ***************************************************************************

#ifndef BOOST_RT_TRACE_HPP_062604GER
#define BOOST_RT_TRACE_HPP_062604GER

// Boost.Runtime.Parameter
#include <boost/test/utils/runtime/config.hpp>

#ifdef BOOST_RT_PARAM_DEBUG

#include <iostream>

#  define BOOST_RT_PARAM_TRACE( str ) std::cerr << str << std::endl
#else
#  define BOOST_RT_PARAM_TRACE( str )
#endif

#endif // BOOST_RT_TRACE_HPP_062604GER
