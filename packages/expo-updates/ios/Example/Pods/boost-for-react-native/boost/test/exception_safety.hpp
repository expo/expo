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
//  Description : Facilities to perform exception safety tests
// ***************************************************************************

#ifndef BOOST_TEST_EXCEPTION_SAFETY_HPP_111705GER
#define BOOST_TEST_EXCEPTION_SAFETY_HPP_111705GER

// Boost.Test
#include <boost/test/detail/config.hpp>

#include <boost/test/utils/callback.hpp>
#include <boost/test/utils/basic_cstring/basic_cstring.hpp>

// STL
#include <memory>

#include <boost/test/detail/suppress_warnings.hpp>

//____________________________________________________________________________//

// ************************************************************************** //
// **************          BOOST_TEST_EXCEPTION_SAFETY         ************** //
// ************************************************************************** //

#define BOOST_TEST_EXCEPTION_SAFETY( test_name )                        \
struct test_name : public BOOST_AUTO_TEST_CASE_FIXTURE                  \
{ void test_method(); };                                                \
                                                                        \
static void BOOST_AUTO_TC_INVOKER( test_name )()                        \
{                                                                       \
    test_name t;                                                        \
    ::boost::itest::exception_safety(                                   \
        boost::bind( &test_name::test_method, t ),                      \
        BOOST_STRINGIZE(test_name) );                                   \
}                                                                       \
                                                                        \
struct BOOST_AUTO_TC_UNIQUE_ID( test_name ) {};                         \
                                                                        \
BOOST_AUTO_TU_REGISTRAR( test_name )(                                   \
    boost::unit_test::make_test_case(                                   \
        &BOOST_AUTO_TC_INVOKER( test_name ), #test_name ),              \
    boost::unit_test::ut_detail::auto_tc_exp_fail<                      \
        BOOST_AUTO_TC_UNIQUE_ID( test_name )>::instance()->value() );   \
                                                                        \
void test_name::test_method()                                           \
/**/

namespace boost {

namespace itest {

// ************************************************************************** //
// **************             exception safety test            ************** //
// ************************************************************************** //

void    BOOST_TEST_DECL exception_safety( unit_test::callback0<> const& F, 
                                          unit_test::const_string test_name = "" );

} // namespace itest

} // namespace boost

// ************************************************************************** //
// **************     global operator new/delete overloads     ************** //
// ************************************************************************** //

#ifndef BOOST_ITEST_NO_NEW_OVERLOADS

#include <boost/test/interaction_based.hpp>

# ifdef BOOST_NO_STDC_NAMESPACE
namespace std { using ::isprint; using ::malloc; using ::free; }
# endif

inline void*
operator new( std::size_t s ) throw(std::bad_alloc)
{
    void* res = std::malloc(s ? s : 1);

    if( res )
        ::boost::itest::manager::instance().allocated( 0, 0, res, s );
    else
        throw std::bad_alloc();

    return res;
}

//____________________________________________________________________________//

inline void*
operator new( std::size_t s, std::nothrow_t const& ) throw()
{
    void* res = std::malloc(s ? s : 1);

    if( res )
        ::boost::itest::manager::instance().allocated( 0, 0, res, s );

    return res;
}

//____________________________________________________________________________//

inline void*
operator new[]( std::size_t s ) throw(std::bad_alloc)
{
    void* res = std::malloc(s ? s : 1);

    if( res )
        ::boost::itest::manager::instance().allocated( 0, 0, res, s );
    else
        throw std::bad_alloc();

    return res;
}

//____________________________________________________________________________//

inline void*
operator new[]( std::size_t s, std::nothrow_t const& ) throw()
{
    void* res = std::malloc(s ? s : 1);

    if( res )
        ::boost::itest::manager::instance().allocated( 0, 0, res, s );

    return res;
}

//____________________________________________________________________________//

inline void
operator delete( void* p ) throw()
{
    ::boost::itest::manager::instance().freed( p );

    std::free( p );
}

//____________________________________________________________________________//

inline void
operator delete( void* p, std::nothrow_t const& ) throw()
{
    ::boost::itest::manager::instance().freed( p );

    std::free( p );
}

//____________________________________________________________________________//

inline void
operator delete[]( void* p ) throw()
{
    ::boost::itest::manager::instance().freed( p );

    std::free( p );
}

//____________________________________________________________________________//

inline void
operator delete[]( void* p, std::nothrow_t const& ) throw()
{
    ::boost::itest::manager::instance().freed( p );

    std::free( p );
}

//____________________________________________________________________________//

#endif // BOOST_ITEST_NO_NEW_OVERLOADS

//____________________________________________________________________________//

#include <boost/test/detail/enable_warnings.hpp>

#endif // BOOST_TEST_EXCEPTION_SAFETY_HPP_111705GER
