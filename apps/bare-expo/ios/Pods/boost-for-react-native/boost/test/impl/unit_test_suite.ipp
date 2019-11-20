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
//  Description : privides core implementation for Unit Test Framework.
//                Extensions can be provided in separate files
// ***************************************************************************

#ifndef BOOST_TEST_UNIT_TEST_SUITE_IPP_012205GER
#define BOOST_TEST_UNIT_TEST_SUITE_IPP_012205GER

// Boost.Test
#include <boost/detail/workaround.hpp>
#include <boost/test/unit_test_suite_impl.hpp>
#include <boost/test/framework.hpp>
#include <boost/test/utils/foreach.hpp>
#include <boost/test/results_collector.hpp>
#include <boost/test/detail/unit_test_parameters.hpp>

// Boost
#include <boost/timer.hpp>

// STL
#include <algorithm>
#include <vector>

#include <boost/test/detail/suppress_warnings.hpp>

#if BOOST_WORKAROUND(__BORLANDC__, < 0x600) && \
    BOOST_WORKAROUND(_STLPORT_VERSION, <= 0x450) \
    /**/
    using std::rand; // rand is in std and random_shuffle is in _STL
#endif

//____________________________________________________________________________//

namespace boost {

namespace unit_test {

// ************************************************************************** //
// **************                   test_unit                  ************** //
// ************************************************************************** //

test_unit::test_unit( const_string name, test_unit_type t )
: p_type( t )
, p_type_name( t == tut_case ? "case" : "suite" )
, p_id( INV_TEST_UNIT_ID )
, p_name( std::string( name.begin(), name.size() ) )
, p_enabled( true )
{
}

//____________________________________________________________________________//

test_unit::~test_unit()
{
    framework::deregister_test_unit( this );
}

//____________________________________________________________________________//

void
test_unit::depends_on( test_unit* tu )
{
    m_dependencies.push_back( tu->p_id );
}

//____________________________________________________________________________//

bool
test_unit::check_dependencies() const
{
    BOOST_TEST_FOREACH( test_unit_id, tu_id, m_dependencies ) {
        if( !unit_test::results_collector.results( tu_id ).passed() )
            return false;
    }

    return true;
}

//____________________________________________________________________________//

void
test_unit::increase_exp_fail( unsigned num )
{
    p_expected_failures.value += num;

    if( p_parent_id != 0 )
        framework::get<test_suite>( p_parent_id ).increase_exp_fail( num );
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************                   test_case                  ************** //
// ************************************************************************** //

test_case::test_case( const_string name, callback0<> const& test_func )
: test_unit( name, static_cast<test_unit_type>(type) )
, m_test_func( test_func )
{
     // !! weirdest MSVC BUG; try to remove this statement; looks like it eats first token of next statement   
#if BOOST_WORKAROUND(BOOST_MSVC,<1300)   
     0;   
#endif 
    framework::register_test_unit( this );
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************                  test_suite                  ************** //
// ************************************************************************** //

//____________________________________________________________________________//

test_suite::test_suite( const_string name )
: test_unit( name, static_cast<test_unit_type>(type) )
{
    framework::register_test_unit( this );
}

//____________________________________________________________________________//

void
test_suite::add( test_unit* tu, counter_t expected_failures, unsigned timeout )
{
    if( timeout != 0 )
        tu->p_timeout.value = timeout;

    m_members.push_back( tu->p_id );
    tu->p_parent_id.value = p_id;

    if( tu->p_expected_failures )
        increase_exp_fail( tu->p_expected_failures );

    if( expected_failures )
        tu->increase_exp_fail( expected_failures );
}

//____________________________________________________________________________//

void
test_suite::add( test_unit_generator const& gen, unsigned timeout )
{
    test_unit* tu;
    while((tu = gen.next(), tu))
        add( tu, 0, timeout );
}

//____________________________________________________________________________//

void
test_suite::remove( test_unit_id id )
{
    std::vector<test_unit_id>::iterator it = std::find( m_members.begin(), m_members.end(), id );

    if( it != m_members.end() )
        m_members.erase( it );
}

//____________________________________________________________________________//

test_unit_id
test_suite::get( const_string tu_name ) const
{
    BOOST_TEST_FOREACH( test_unit_id, id, m_members ) {
        if( tu_name == framework::get( id, ut_detail::test_id_2_unit_type( id ) ).p_name.get() )
            return id;
    }

    return INV_TEST_UNIT_ID;
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************               traverse_test_tree             ************** //
// ************************************************************************** //

void
traverse_test_tree( test_case const& tc, test_tree_visitor& V )
{
    if( tc.p_enabled )
    V.visit( tc );
}

//____________________________________________________________________________//

void
traverse_test_tree( test_suite const& suite, test_tree_visitor& V )
{
    if( !suite.p_enabled || !V.test_suite_start( suite ) )
        return;

    try {
        if( runtime_config::random_seed() == 0 ) {
            BOOST_TEST_FOREACH( test_unit_id, id, suite.m_members )
                traverse_test_tree( id, V );
        }
        else {
            std::vector<test_unit_id> members( suite.m_members );
            std::random_shuffle( members.begin(), members.end() );
            BOOST_TEST_FOREACH( test_unit_id, id, members )
                traverse_test_tree( id, V );
        }
        
    } catch( test_being_aborted const& ) {
        V.test_suite_finish( suite );
        framework::test_unit_aborted( suite );

        throw;
    }

    V.test_suite_finish( suite );
}

//____________________________________________________________________________//

void
traverse_test_tree( test_unit_id id, test_tree_visitor& V )
{
    if( ut_detail::test_id_2_unit_type( id ) == tut_case )
        traverse_test_tree( framework::get<test_case>( id ), V );
    else
        traverse_test_tree( framework::get<test_suite>( id ), V );
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************                test_case_counter             ************** //
// ************************************************************************** //

void
test_case_counter::visit( test_case const& tc )
{
    if( tc.p_enabled )
        ++p_count.value;
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************               object generators              ************** //
// ************************************************************************** //

namespace ut_detail {

std::string
normalize_test_case_name( const_string name )
{
    return ( name[0] == '&'
                ? std::string( name.begin()+1, name.size()-1 )
                : std::string( name.begin(), name.size() ) );
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************           auto_test_unit_registrar           ************** //
// ************************************************************************** //

auto_test_unit_registrar::auto_test_unit_registrar( test_case* tc, counter_t exp_fail )
{
    curr_ts_store().back()->add( tc, exp_fail );
}

//____________________________________________________________________________//

auto_test_unit_registrar::auto_test_unit_registrar( const_string ts_name )
{
    test_unit_id id = curr_ts_store().back()->get( ts_name );

    test_suite* ts;

    if( id != INV_TEST_UNIT_ID ) {
        ts = &framework::get<test_suite>( id ); // !! test for invalid tu type
        BOOST_ASSERT( ts->p_parent_id == curr_ts_store().back()->p_id );
    }
    else {
        ts = new test_suite( ts_name );
        curr_ts_store().back()->add( ts );
    }

    curr_ts_store().push_back( ts );
}

//____________________________________________________________________________//

auto_test_unit_registrar::auto_test_unit_registrar( test_unit_generator const& tc_gen )
{
    curr_ts_store().back()->add( tc_gen );
}

//____________________________________________________________________________//

auto_test_unit_registrar::auto_test_unit_registrar( int )
{
    if( curr_ts_store().size() == 0 )
        return; // report error?

    curr_ts_store().pop_back();
}

//____________________________________________________________________________//

std::list<test_suite*>&
auto_test_unit_registrar::curr_ts_store()
{
    static std::list<test_suite*> inst( 1, &framework::master_test_suite() );
    return inst;
}

//____________________________________________________________________________//

} // namespace ut_detail

// ************************************************************************** //
// **************                global_fixture                ************** //
// ************************************************************************** //

global_fixture::global_fixture()
{
    framework::register_observer( *this );
} 

//____________________________________________________________________________//

} // namespace unit_test

} // namespace boost

//____________________________________________________________________________//

#include <boost/test/detail/enable_warnings.hpp>

#endif // BOOST_TEST_UNIT_TEST_SUITE_IPP_012205GER
