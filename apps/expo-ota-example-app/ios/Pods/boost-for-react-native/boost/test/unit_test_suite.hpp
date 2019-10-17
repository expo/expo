//  (C) Copyright Gennadiy Rozental 2001.
//  Distributed under the Boost Software License, Version 1.0.
//  (See accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org/libs/test for the library home page.
//
/// @file
/// @brief Defines Unit Test Framework public API
// ***************************************************************************

#ifndef BOOST_TEST_UNIT_TEST_SUITE_HPP_071894GER
#define BOOST_TEST_UNIT_TEST_SUITE_HPP_071894GER

// Boost.Test
#include <boost/test/framework.hpp>
#include <boost/test/tree/auto_registration.hpp>
#include <boost/test/tree/test_case_template.hpp>
#include <boost/test/tree/global_fixture.hpp>


#include <boost/test/detail/suppress_warnings.hpp>


#include <boost/test/detail/pp_variadic.hpp>



//____________________________________________________________________________//

// ************************************************************************** //
// **************    Non-auto (explicit) test case interface   ************** //
// ************************************************************************** //

#define BOOST_TEST_CASE( test_function )                                   \
boost::unit_test::make_test_case( boost::function<void ()>(test_function), \
                                  BOOST_TEST_STRINGIZE( test_function ),   \
                                  __FILE__, __LINE__ )
#define BOOST_CLASS_TEST_CASE( test_function, tc_instance )                \
boost::unit_test::make_test_case( (test_function),                         \
                                  BOOST_TEST_STRINGIZE( test_function ),   \
                                  __FILE__, __LINE__, tc_instance )

// ************************************************************************** //
// **************               BOOST_TEST_SUITE               ************** //
// ************************************************************************** //

#define BOOST_TEST_SUITE( testsuite_name ) \
( new boost::unit_test::test_suite( testsuite_name, __FILE__, __LINE__ ) )

// ************************************************************************** //
// **************             BOOST_AUTO_TEST_SUITE            ************** //
// ************************************************************************** //

#define BOOST_AUTO_TEST_SUITE_WITH_DECOR( suite_name, decorators )      \
namespace suite_name {                                                  \
BOOST_AUTO_TU_REGISTRAR( suite_name )(                                  \
    BOOST_STRINGIZE( suite_name ),                                      \
    __FILE__, __LINE__,                                                 \
    decorators );                                                       \
/**/

#define BOOST_AUTO_TEST_SUITE_NO_DECOR( suite_name )                    \
    BOOST_AUTO_TEST_SUITE_WITH_DECOR(                                   \
        suite_name,                                                     \
        boost::unit_test::decorator::collector::instance() )            \
/**/

#if BOOST_PP_VARIADICS
#define BOOST_AUTO_TEST_SUITE( ... )                                    \
    BOOST_TEST_INVOKE_IF_N_ARGS( 1,                                     \
        BOOST_AUTO_TEST_SUITE_NO_DECOR,                                 \
        BOOST_AUTO_TEST_SUITE_WITH_DECOR,                               \
        __VA_ARGS__)                                                    \
/**/

#else /* BOOST_PP_VARIADICS */

#define BOOST_AUTO_TEST_SUITE( suite_name )                             \
    BOOST_AUTO_TEST_SUITE_NO_DECOR( suite_name )                        \
/**/


#endif /* BOOST_PP_VARIADICS */

// ************************************************************************** //
// **************            BOOST_FIXTURE_TEST_SUITE          ************** //
// ************************************************************************** //

#define BOOST_FIXTURE_TEST_SUITE_WITH_DECOR(suite_name, F, decorators)  \
    BOOST_AUTO_TEST_SUITE_WITH_DECOR( suite_name, decorators )          \
typedef F BOOST_AUTO_TEST_CASE_FIXTURE;                                 \
/**/

#define BOOST_FIXTURE_TEST_SUITE_NO_DECOR( suite_name, F )              \
    BOOST_AUTO_TEST_SUITE_NO_DECOR( suite_name )                        \
typedef F BOOST_AUTO_TEST_CASE_FIXTURE;                                 \
/**/

#if BOOST_PP_VARIADICS

#define BOOST_FIXTURE_TEST_SUITE( ... )                                 \
    BOOST_TEST_INVOKE_IF_N_ARGS( 2,                                     \
        BOOST_FIXTURE_TEST_SUITE_NO_DECOR,                              \
        BOOST_FIXTURE_TEST_SUITE_WITH_DECOR,                            \
        __VA_ARGS__)                                                    \
/**/

#else /* BOOST_PP_VARIADICS */

#define BOOST_FIXTURE_TEST_SUITE( suite_name, F  )                      \
   BOOST_FIXTURE_TEST_SUITE_NO_DECOR( suite_name, F )                   \
/**/


#endif /* BOOST_PP_VARIADICS */


// ************************************************************************** //
// **************           BOOST_AUTO_TEST_SUITE_END          ************** //
// ************************************************************************** //

#define BOOST_AUTO_TEST_SUITE_END()                                     \
BOOST_AUTO_TU_REGISTRAR( BOOST_JOIN( end_suite, __LINE__ ) )( 1 );      \
}                                                                       \
/**/

// ************************************************************************** //
// **************    BOOST_AUTO_TEST_CASE_EXPECTED_FAILURES    ************** //
// ************************************************************************** //

/// @deprecated use decorator instead
#define BOOST_AUTO_TEST_CASE_EXPECTED_FAILURES( test_name, n )          \
BOOST_TEST_DECORATOR( * boost::unit_test::expected_failures( n ) )      \
/**/

// ************************************************************************** //
// **************            BOOST_FIXTURE_TEST_CASE           ************** //
// ************************************************************************** //

#define BOOST_FIXTURE_TEST_CASE_WITH_DECOR( test_name, F, decorators )  \
struct test_name : public F { void test_method(); };                    \
                                                                        \
static void BOOST_AUTO_TC_INVOKER( test_name )()                        \
{                                                                       \
    BOOST_TEST_CHECKPOINT('"' << #test_name << "\" fixture entry.");    \
    test_name t;                                                        \
    BOOST_TEST_CHECKPOINT('"' << #test_name << "\" entry.");            \
    t.test_method();                                                    \
    BOOST_TEST_CHECKPOINT('"' << #test_name << "\" exit.");             \
}                                                                       \
                                                                        \
struct BOOST_AUTO_TC_UNIQUE_ID( test_name ) {};                         \
                                                                        \
BOOST_AUTO_TU_REGISTRAR( test_name )(                                   \
    boost::unit_test::make_test_case(                                   \
        &BOOST_AUTO_TC_INVOKER( test_name ),                            \
        #test_name, __FILE__, __LINE__ ),                               \
        decorators );                                                   \
                                                                        \
void test_name::test_method()                                           \
/**/

#define BOOST_FIXTURE_TEST_CASE_NO_DECOR( test_name, F )                \
BOOST_FIXTURE_TEST_CASE_WITH_DECOR( test_name, F,                       \
    boost::unit_test::decorator::collector::instance() )                \
/**/

#if BOOST_PP_VARIADICS

#define BOOST_FIXTURE_TEST_CASE( ... )                                  \
    BOOST_TEST_INVOKE_IF_N_ARGS( 2,                                     \
        BOOST_FIXTURE_TEST_CASE_NO_DECOR,                               \
        BOOST_FIXTURE_TEST_CASE_WITH_DECOR,                             \
         __VA_ARGS__)                                                   \
/**/

#else /* BOOST_PP_VARIADICS */

#define BOOST_FIXTURE_TEST_CASE( test_name, F )                         \
     BOOST_FIXTURE_TEST_CASE_NO_DECOR(test_name, F)                     \
/**/


#endif /* BOOST_PP_VARIADICS */

// ************************************************************************** //
// **************             BOOST_AUTO_TEST_CASE             ************** //
// ************************************************************************** //

#define BOOST_AUTO_TEST_CASE_NO_DECOR( test_name )                      \
    BOOST_FIXTURE_TEST_CASE_NO_DECOR( test_name,                        \
        BOOST_AUTO_TEST_CASE_FIXTURE )                                  \
/**/

#define BOOST_AUTO_TEST_CASE_WITH_DECOR( test_name, decorators )        \
    BOOST_FIXTURE_TEST_CASE_WITH_DECOR( test_name,                      \
        BOOST_AUTO_TEST_CASE_FIXTURE, decorators )                      \
/**/

#if BOOST_PP_VARIADICS

#define BOOST_AUTO_TEST_CASE( ... )                                     \
    BOOST_TEST_INVOKE_IF_N_ARGS( 1,                                     \
        BOOST_AUTO_TEST_CASE_NO_DECOR,                                  \
        BOOST_AUTO_TEST_CASE_WITH_DECOR,                                \
         __VA_ARGS__)                                                   \
/**/

#else /* BOOST_PP_VARIADICS */

#define BOOST_AUTO_TEST_CASE( test_name )                               \
    BOOST_AUTO_TEST_CASE_NO_DECOR( test_name )                          \
/**/


#endif /* BOOST_PP_VARIADICS */

// ************************************************************************** //
// **************       BOOST_FIXTURE_TEST_CASE_TEMPLATE       ************** //
// ************************************************************************** //

#define BOOST_FIXTURE_TEST_CASE_TEMPLATE( test_name, type_name, TL, F ) \
template<typename type_name>                                            \
struct test_name : public F                                             \
{ void test_method(); };                                                \
                                                                        \
struct BOOST_AUTO_TC_INVOKER( test_name ) {                             \
    template<typename TestType>                                         \
    static void run( boost::type<TestType>* = 0 )                       \
    {                                                                   \
        BOOST_TEST_CHECKPOINT('"' << #test_name <<"\" fixture entry."); \
        test_name<TestType> t;                                          \
        BOOST_TEST_CHECKPOINT('"' << #test_name << "\" entry.");        \
        t.test_method();                                                \
        BOOST_TEST_CHECKPOINT('"' << #test_name << "\" exit.");         \
    }                                                                   \
};                                                                      \
                                                                        \
BOOST_AUTO_TU_REGISTRAR( test_name )(                                   \
    boost::unit_test::ut_detail::template_test_case_gen<                \
        BOOST_AUTO_TC_INVOKER( test_name ),TL >(                        \
          BOOST_STRINGIZE( test_name ), __FILE__, __LINE__ ),           \
    boost::unit_test::decorator::collector::instance() );               \
                                                                        \
template<typename type_name>                                            \
void test_name<type_name>::test_method()                                \
/**/

// ************************************************************************** //
// **************        BOOST_AUTO_TEST_CASE_TEMPLATE         ************** //
// ************************************************************************** //

#define BOOST_AUTO_TEST_CASE_TEMPLATE( test_name, type_name, TL )       \
BOOST_FIXTURE_TEST_CASE_TEMPLATE( test_name, type_name, TL,             \
    BOOST_AUTO_TEST_CASE_FIXTURE )                                      \
/**/

// ************************************************************************** //
// **************           BOOST_TEST_CASE_TEMPLATE           ************** //
// ************************************************************************** //

#define BOOST_TEST_CASE_TEMPLATE( name, typelist )                      \
    boost::unit_test::ut_detail::template_test_case_gen<name,typelist>( \
        BOOST_TEST_STRINGIZE( name ), __FILE__, __LINE__ )              \
/**/

// ************************************************************************** //
// **************      BOOST_TEST_CASE_TEMPLATE_FUNCTION       ************** //
// ************************************************************************** //

#define BOOST_TEST_CASE_TEMPLATE_FUNCTION( name, type_name )            \
template<typename type_name>                                            \
void BOOST_JOIN( name, _impl )( boost::type<type_name>* );              \
                                                                        \
struct name {                                                           \
    template<typename TestType>                                         \
    static void run( boost::type<TestType>* frwrd = 0 )                 \
    {                                                                   \
       BOOST_JOIN( name, _impl )( frwrd );                              \
    }                                                                   \
};                                                                      \
                                                                        \
template<typename type_name>                                            \
void BOOST_JOIN( name, _impl )( boost::type<type_name>* )               \
/**/

// ************************************************************************** //
// **************              BOOST_GLOBAL_FIXTURE            ************** //
// ************************************************************************** //

#define BOOST_GLOBAL_FIXTURE( F ) \
static boost::unit_test::ut_detail::global_fixture_impl<F> BOOST_JOIN( gf_, F ) \
/**/

// ************************************************************************** //
// **************             BOOST_TEST_DECORATOR             ************** //
// ************************************************************************** //

#define BOOST_TEST_DECORATOR( D )                                       \
static boost::unit_test::decorator::collector const&                    \
BOOST_JOIN(decorator_collector,__LINE__) = D;                           \
/**/

// ************************************************************************** //
// **************         BOOST_AUTO_TEST_CASE_FIXTURE         ************** //
// ************************************************************************** //

namespace boost { namespace unit_test { namespace ut_detail {

struct nil_t {};

} // namespace ut_detail
} // unit_test
} // namespace boost

// Intentionally is in global namespace, so that FIXTURE_TEST_SUITE can reset it in user code.
typedef ::boost::unit_test::ut_detail::nil_t BOOST_AUTO_TEST_CASE_FIXTURE;

// ************************************************************************** //
// **************   Auto registration facility helper macros   ************** //
// ************************************************************************** //

#define BOOST_AUTO_TU_REGISTRAR( test_name )                    \
static boost::unit_test::ut_detail::auto_test_unit_registrar    \
BOOST_JOIN( BOOST_JOIN( test_name, _registrar ), __LINE__ )     \
/**/
#define BOOST_AUTO_TC_INVOKER( test_name )      BOOST_JOIN( test_name, _invoker )
#define BOOST_AUTO_TC_UNIQUE_ID( test_name )    BOOST_JOIN( test_name, _id )

// ************************************************************************** //
// **************                BOOST_TEST_MAIN               ************** //
// ************************************************************************** //

#if defined(BOOST_TEST_MAIN)

#ifdef BOOST_TEST_ALTERNATIVE_INIT_API
bool init_unit_test()                   {
#else
::boost::unit_test::test_suite*
init_unit_test_suite( int, char* [] )   {
#endif

#ifdef BOOST_TEST_MODULE
    using namespace ::boost::unit_test;
    assign_op( framework::master_test_suite().p_name.value, BOOST_TEST_STRINGIZE( BOOST_TEST_MODULE ).trim( "\"" ), 0 );

#endif

#ifdef BOOST_TEST_ALTERNATIVE_INIT_API
    return true;
}
#else
    return 0;
}
#endif

#endif

//____________________________________________________________________________//

#include <boost/test/detail/enable_warnings.hpp>


#endif // BOOST_TEST_UNIT_TEST_SUITE_HPP_071894GER

