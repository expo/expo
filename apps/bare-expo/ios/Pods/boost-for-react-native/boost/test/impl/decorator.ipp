//  (C) Copyright Gennadiy Rozental 2001.
//  Distributed under the Boost Software License, Version 1.0.
//  (See accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org/libs/test for the library home page.
//
//  File        : $RCSfile$
//
//  Version     : $Revision$
//
//  Description : unit test decorators implementation
// ***************************************************************************

#ifndef BOOST_TEST_TREE_DECORATOR_IPP_091911GER
#define BOOST_TEST_TREE_DECORATOR_IPP_091911GER

// Boost.Test
#include <boost/test/tree/decorator.hpp>
#include <boost/test/tree/test_unit.hpp>

#include <boost/test/framework.hpp>
#if BOOST_TEST_SUPPORT_TOKEN_ITERATOR
#include <boost/test/utils/iterator/token_iterator.hpp>
#endif

#include <boost/test/detail/throw_exception.hpp>

#include <boost/test/detail/suppress_warnings.hpp>

//____________________________________________________________________________//

namespace boost {
namespace unit_test {
namespace decorator {

// ************************************************************************** //
// **************             decorator::collector             ************** //
// ************************************************************************** //

collector&
collector::operator*( base const& d )
{
    m_tu_decorators.push_back( d.clone() );

    return *this;
}

//____________________________________________________________________________//

void
collector::store_in( test_unit& tu )
{
    tu.p_decorators.value.insert( tu.p_decorators.value.end(), m_tu_decorators.begin(), m_tu_decorators.end() );
}

//____________________________________________________________________________//

void
collector::reset()
{
    m_tu_decorators.clear();
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************               decorator::base                ************** //
// ************************************************************************** //

collector&
base::operator*() const
{
    return collector::instance() * *this;
}

// ************************************************************************** //
// **************               decorator::label               ************** //
// ************************************************************************** //

void
label::apply( test_unit& tu )
{
    tu.add_label( m_label );
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************         decorator::expected_failures         ************** //
// ************************************************************************** //

void
expected_failures::apply( test_unit& tu )
{
    tu.increase_exp_fail( m_exp_fail );
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************              decorator::timeout              ************** //
// ************************************************************************** //

void
timeout::apply( test_unit& tu )
{
    tu.p_timeout.value = m_timeout;
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************            decorator::description            ************** //
// ************************************************************************** //

void
description::apply( test_unit& tu )
{
    tu.p_description.value += m_description;
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************             decorator::depends_on            ************** //
// ************************************************************************** //

void
depends_on::apply( test_unit& tu )
{
#if !BOOST_TEST_SUPPORT_TOKEN_ITERATOR
    BOOST_TEST_SETUP_ASSERT( false, "depends_on decorator is not supported on this platform" );
#else
    utils::string_token_iterator tit( m_dependency, (utils::dropped_delimeters = "/", utils::kept_delimeters = utils::dt_none) );

    test_unit* dep = &framework::master_test_suite();
    while( tit != utils::string_token_iterator() ) {
        BOOST_TEST_SETUP_ASSERT( dep->p_type == TUT_SUITE, std::string( "incorrect dependency specification " ) + m_dependency );

        test_unit_id next_id = static_cast<test_suite*>(dep)->get( *tit );

        BOOST_TEST_SETUP_ASSERT( next_id != INV_TEST_UNIT_ID,
                                 std::string( "incorrect dependency specification " ) + m_dependency );

        dep = &framework::get( next_id, TUT_ANY );
        ++tit;
    }

    tu.depends_on( dep );
#endif
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************    decorator::enable_if/enabled/disabled     ************** //
// ************************************************************************** //

void
enable_if_impl::apply_impl( test_unit& tu, bool condition )
{
    BOOST_TEST_SETUP_ASSERT(tu.p_default_status == test_unit::RS_INHERIT,
                            "Can't apply multiple enabled/disabled decorators "
                            "to the same test unit " + tu.full_name());

    tu.p_default_status.value = condition ? test_unit::RS_ENABLED : test_unit::RS_DISABLED;
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************              decorator::fixture              ************** //
// ************************************************************************** //

void
fixture_t::apply( test_unit& tu )
{
    tu.p_fixtures.value.push_back( m_impl );
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************            decorator::depends_on             ************** //
// ************************************************************************** //

void
precondition::apply( test_unit& tu )
{
    tu.add_precondition( m_precondition );
}

//____________________________________________________________________________//

} // namespace decorator
} // namespace unit_test
} // namespace boost

#include <boost/test/detail/enable_warnings.hpp>

#endif // BOOST_TEST_TREE_DECORATOR_IPP_091911GER
