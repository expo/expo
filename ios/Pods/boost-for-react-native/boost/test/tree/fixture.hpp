//  (C) Copyright Gennadiy Rozental 2001.
//  Distributed under the Boost Software License, Version 1.0.
//  (See accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org/libs/test for the library home page.
//
//  File        : $RCSfile$
//
//  Version     : $Revision: 74640 $
//
//  Description : defines fixture interface and object makers
// ***************************************************************************

#ifndef BOOST_TEST_TREE_FIXTURE_HPP_100311GER
#define BOOST_TEST_TREE_FIXTURE_HPP_100311GER

// Boost.Test
#include <boost/test/detail/config.hpp>

// Boost
#include <boost/shared_ptr.hpp>
#include <boost/scoped_ptr.hpp>
#include <boost/function/function0.hpp>

#include <boost/test/detail/suppress_warnings.hpp>

//____________________________________________________________________________//

namespace boost {
namespace unit_test {

// ************************************************************************** //
// **************               test_unit_fixture              ************** //
// ************************************************************************** //

class BOOST_TEST_DECL test_unit_fixture {
public:
    virtual ~test_unit_fixture() {}

    // Fixture interface
    virtual void    setup() = 0;
    virtual void    teardown() = 0;
};

typedef shared_ptr<test_unit_fixture> test_unit_fixture_ptr;

// ************************************************************************** //
// **************              class_based_fixture             ************** //
// ************************************************************************** //

template<typename F, typename Arg=void>
class class_based_fixture : public test_unit_fixture {
public:
    // Constructor
    explicit class_based_fixture( Arg const& arg ) : m_inst(), m_arg( arg ) {}

private:
    // Fixture interface
    virtual void    setup()         { m_inst.reset( new F( m_arg ) ); }
    virtual void    teardown()      { m_inst.reset(); }

    // Data members
    scoped_ptr<F>   m_inst;
    Arg             m_arg;
};

//____________________________________________________________________________//

template<typename F>
class class_based_fixture<F,void> : public test_unit_fixture {
public:
    // Constructor
    class_based_fixture() : m_inst( 0 ) {}

private:
    // Fixture interface
    virtual void    setup()         { m_inst.reset( new F ); }
    virtual void    teardown()      { m_inst.reset(); }

    // Data members
    scoped_ptr<F>   m_inst;
};

//____________________________________________________________________________//

// ************************************************************************** //
// **************            function_based_fixture            ************** //
// ************************************************************************** //

class function_based_fixture : public test_unit_fixture {
public:
    // Constructor
    function_based_fixture( boost::function<void ()> const& setup_, boost::function<void ()> const& teardown_ )
    : m_setup( setup_ )
    , m_teardown( teardown_ )
    {
    }

private:
    // Fixture interface
    virtual void                setup()     { if( m_setup ) m_setup(); }
    virtual void                teardown()  { if( m_teardown ) m_teardown(); }

    // Data members
    boost::function<void ()>    m_setup;
    boost::function<void ()>    m_teardown;
};

} // namespace unit_test
} // namespace boost

#include <boost/test/detail/enable_warnings.hpp>

#endif // BOOST_TEST_TREE_FIXTURE_HPP_100311GER

