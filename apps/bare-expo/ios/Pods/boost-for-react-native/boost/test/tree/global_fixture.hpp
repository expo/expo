//  (C) Copyright Gennadiy Rozental 2001.
//  Distributed under the Boost Software License, Version 1.0.
//  (See accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org/libs/test for the library home page.
//
/// @file
/// Defines global_fixture
// ***************************************************************************

#ifndef BOOST_TEST_TREE_GLOBAL_FIXTURE_HPP_091911GER
#define BOOST_TEST_TREE_GLOBAL_FIXTURE_HPP_091911GER

// Boost.Test
#include <boost/test/detail/config.hpp>
#include <boost/test/detail/global_typedef.hpp>

#include <boost/test/tree/observer.hpp>

#include <boost/test/detail/suppress_warnings.hpp>


//____________________________________________________________________________//

namespace boost {
namespace unit_test {

// ************************************************************************** //
// **************                global_fixture                ************** //
// ************************************************************************** //

class BOOST_TEST_DECL global_fixture : public test_observer {
public:
    // Constructor
    global_fixture();
};

//____________________________________________________________________________//

namespace ut_detail {

template<typename F>
struct global_fixture_impl : public global_fixture {
    // Constructor
    global_fixture_impl() : m_fixture( 0 )    {}

    // test observer interface
    virtual void    test_start( counter_t ) { m_fixture = new F; }
    virtual void    test_finish()           { delete m_fixture; m_fixture = 0; }
    virtual void    test_aborted()          { delete m_fixture; m_fixture = 0; }

private:
    // Data members
    F*  m_fixture;
};

} // namespace ut_detail
} // namespace unit_test
} // namespace boost

#include <boost/test/detail/enable_warnings.hpp>

#endif // BOOST_TEST_TREE_GLOBAL_FIXTURE_HPP_091911GER

