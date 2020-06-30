#ifndef BOOST_CORE_NO_EXCEPTIONS_SUPPORT_HPP
#define BOOST_CORE_NO_EXCEPTIONS_SUPPORT_HPP

#if defined(_MSC_VER)
#  pragma once
#endif

//----------------------------------------------------------------------
// (C) Copyright 2004 Pavel Vozenilek.
// Use, modification and distribution is subject to the Boost Software
// License, Version 1.0. (See accompanying file LICENSE_1_0.txt
// or copy at http://www.boost.org/LICENSE_1_0.txt)
//
//
// This file contains helper macros used when exception support may be
// disabled (as indicated by macro BOOST_NO_EXCEPTIONS).
//
// Before picking up these macros you may consider using RAII techniques
// to deal with exceptions - their syntax can be always the same with 
// or without exception support enabled.
//----------------------------------------------------------------------

#include <boost/config.hpp>
#include <boost/detail/workaround.hpp>

#if !(defined BOOST_NO_EXCEPTIONS)
#    define BOOST_TRY { try
#    define BOOST_CATCH(x) catch(x)
#    define BOOST_RETHROW throw;
#    define BOOST_CATCH_END }
#else
#    if BOOST_WORKAROUND(__BORLANDC__, BOOST_TESTED_AT(0x564))
#        define BOOST_TRY { if ("")
#        define BOOST_CATCH(x) else if (!"")
#    else
#        define BOOST_TRY { if (true)
#        define BOOST_CATCH(x) else if (false)
#    endif
#    define BOOST_RETHROW
#    define BOOST_CATCH_END }
#endif


#endif 
