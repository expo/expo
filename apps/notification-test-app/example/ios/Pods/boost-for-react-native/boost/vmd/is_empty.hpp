
//  (C) Copyright Edward Diener 2011-2015
//  Use, modification and distribution are subject to the Boost Software License,
//  Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt).

#if !defined(BOOST_VMD_IS_EMPTY_HPP)
#define BOOST_VMD_IS_EMPTY_HPP

#include <boost/vmd/detail/setup.hpp>

#if BOOST_PP_VARIADICS

#include <boost/preprocessor/punctuation/is_begin_parens.hpp>
#include <boost/vmd/detail/is_empty.hpp>

/*

  The succeeding comments in this file are in doxygen format.

*/

/** \file
*/

/** \def BOOST_VMD_IS_EMPTY(...)

    \brief Tests whether its input is empty or not.

    The macro checks to see if the input is empty or not.
    It returns 1 if the input is empty, else returns 0.
    
    The macro is a variadic macro taking any input.
    For the VC++8 compiler (VS2005) the macro takes a single parameter of input to check.
    
    The macro is not perfect, and can not be so. The problem
    area is if the input to be checked is a function-like
    macro name, in which case either a compiler error can result
    or a false result can occur.
    
    This macro is a replacement, using variadic macro support,
    for the undocumented macro BOOST_PP_IS_EMPTY in the Boost
    PP library. The code is taken from a posting by Paul Mensonides
    of a variadic version for BOOST_PP_IS_EMPTY, and changed 
    in order to also support VC++.
    
    .... = variadic input, for VC++8 this must be a single parameter

    returns = 1 if the input is empty, 0 if it is not
    
    It is recommended to append BOOST_PP_EMPTY() to whatever input
    is being tested in order to avoid possible warning messages 
    from some compilers about no parameters being passed to the macro
    when the input is truly empty.
    
*/

#if BOOST_VMD_MSVC_V8

#define BOOST_VMD_IS_EMPTY(sequence) \
    BOOST_VMD_DETAIL_IS_EMPTY_IIF \
      ( \
      BOOST_PP_IS_BEGIN_PARENS \
        ( \
        sequence \
        ) \
      ) \
      ( \
      BOOST_VMD_DETAIL_IS_EMPTY_GEN_ZERO, \
      BOOST_VMD_DETAIL_IS_EMPTY_PROCESS \
      ) \
    (sequence) \
/**/

#else

#define BOOST_VMD_IS_EMPTY(...) \
    BOOST_VMD_DETAIL_IS_EMPTY_IIF \
      ( \
      BOOST_PP_IS_BEGIN_PARENS \
        ( \
        __VA_ARGS__ \
        ) \
      ) \
      ( \
      BOOST_VMD_DETAIL_IS_EMPTY_GEN_ZERO, \
      BOOST_VMD_DETAIL_IS_EMPTY_PROCESS \
      ) \
    (__VA_ARGS__) \
/**/

#endif /* BOOST_VMD_MSVC_V8 */

#endif /* BOOST_PP_VARIADICS */
#endif /* BOOST_VMD_IS_EMPTY_HPP */
