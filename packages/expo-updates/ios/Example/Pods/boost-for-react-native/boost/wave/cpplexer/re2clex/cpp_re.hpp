/*=============================================================================
    Boost.Wave: A Standard compliant C++ preprocessor library

    Re2C based C++ lexer
    
    http://www.boost.org/

    Copyright (c) 2001-2012 Hartmut Kaiser. Distributed under the Boost
    Software License, Version 1.0. (See accompanying file
    LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
=============================================================================*/

#if !defined(CPP_RE_HPP_B76C4F5E_63E9_4B8A_9975_EC32FA6BF027_INCLUDED)
#define CPP_RE_HPP_B76C4F5E_63E9_4B8A_9975_EC32FA6BF027_INCLUDED

#include <boost/wave/wave_config.hpp>
#include <boost/wave/token_ids.hpp>

// this must occur after all of the includes and before any code appears
#ifdef BOOST_HAS_ABI_HEADERS
#include BOOST_ABI_PREFIX
#endif

// suppress warnings about dependent classes not being exported from the dll
#ifdef BOOST_MSVC
#pragma warning(push)
#pragma warning(disable : 4251 4231 4660)
#endif

///////////////////////////////////////////////////////////////////////////////
namespace boost {
namespace wave {
namespace cpplexer {
namespace re2clex {

struct Scanner; 

///////////////////////////////////////////////////////////////////////////////
//  The scanner function to call whenever a new token is requested
BOOST_WAVE_DECL boost::wave::token_id scan(Scanner *s);

///////////////////////////////////////////////////////////////////////////////
}   // namespace re2clex
}   // namespace cpplexer
}   // namespace wave
}   // namespace boost

#ifdef BOOST_MSVC
#pragma warning(pop)
#endif

// the suffix header occurs after all of the code
#ifdef BOOST_HAS_ABI_HEADERS
#include BOOST_ABI_SUFFIX
#endif

#endif // !defined(CPP_RE_HPP_B76C4F5E_63E9_4B8A_9975_EC32FA6BF027_INCLUDED)
