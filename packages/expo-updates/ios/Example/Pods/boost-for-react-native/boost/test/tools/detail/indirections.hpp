//  (C) Copyright Gennadiy Rozental 2001.
//  Distributed under the Boost Software License, Version 1.0.
//  (See accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org/libs/test for the library home page.
//
//  File        : $RCSfile$
//
//  Version     : $Revision: 74248 $
//
//  Description : inidiration interfaces to support manipulators and message output
// ***************************************************************************

#ifndef BOOST_TEST_TOOLS_DETAIL_INDIRECTIONS_HPP_112812GER
#define BOOST_TEST_TOOLS_DETAIL_INDIRECTIONS_HPP_112812GER

// Boost.Test
#include <boost/test/tools/detail/fwd.hpp>

#include <boost/test/tools/assertion_result.hpp>

#include <boost/test/detail/suppress_warnings.hpp>

//____________________________________________________________________________//

namespace boost {
namespace test_tools {
namespace tt_detail {

// ************************************************************************** //
// **************        assertion_evaluate indirection        ************** //
// ************************************************************************** //

template<typename E>
struct assertion_evaluate_t {
    assertion_evaluate_t( E const& e ) : m_e( e ) {}
    operator assertion_result() { return m_e.evaluate( true ); }

    E const& m_e;
};

//____________________________________________________________________________//

template<typename E>
inline assertion_evaluate_t<E>
assertion_evaluate( E const& e ) { return assertion_evaluate_t<E>( e ); }

//____________________________________________________________________________//

template<typename E, typename T>
inline assertion_evaluate_t<E>
operator<<( assertion_evaluate_t<E> const& ae, T const& ) { return ae; }

//____________________________________________________________________________//

// ************************************************************************** //
// **************          assertion_text indirection          ************** //
// ************************************************************************** //

template<typename T>
inline unit_test::lazy_ostream const&
assertion_text( unit_test::lazy_ostream const& /*et*/, T const& m ) { return m; }

//____________________________________________________________________________//

inline unit_test::lazy_ostream const&
assertion_text( unit_test::lazy_ostream const& et, int ) { return et; }

//____________________________________________________________________________//

// ************************************************************************** //
// **************        assertion_evaluate indirection        ************** //
// ************************************************************************** //

struct assertion_type {
    operator check_type() { return CHECK_MSG; }
};

//____________________________________________________________________________//

template<typename T>
inline assertion_type
operator<<( assertion_type const& at, T const& ) { return at; }

//____________________________________________________________________________//

} // namespace tt_detail
} // namespace test_tools
} // namespace boost

#include <boost/test/detail/enable_warnings.hpp>

#endif // BOOST_TEST_TOOLS_DETAIL_INDIRECTIONS_HPP_112812GER
