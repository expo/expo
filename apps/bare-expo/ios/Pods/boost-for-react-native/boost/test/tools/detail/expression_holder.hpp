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
//  Description : toolbox implementation details
// ***************************************************************************

#ifndef BOOST_TEST_TOOLS_DETAIL_EXPRESSION_HOLDER_HPP_012705GER
#define BOOST_TEST_TOOLS_DETAIL_EXPRESSION_HOLDER_HPP_012705GER

#ifdef BOOST_NO_CXX11_AUTO_DECLARATIONS

#include <boost/test/detail/suppress_warnings.hpp>

//____________________________________________________________________________//

namespace boost {
namespace test_tools {
namespace tt_detail {

// ************************************************************************** //
// **************         tt_detail::expression_holder         ************** //
// ************************************************************************** //

class expression_holder {
public:
    virtual                     ~expression_holder() {}
    virtual assertion_result    evaluate( bool no_message = false )  const = 0;
};

//____________________________________________________________________________//

template<typename E>
class  expression_holder_t: public expression_holder {
public:
    explicit                    expression_holder_t( E const& e ) : m_expr( e ) {}

private:
    virtual assertion_result    evaluate( bool no_message = false )  const { return m_expr.evaluate( no_message ); }

    E                           m_expr;
};

//____________________________________________________________________________//

template<typename E>
expression_holder_t<E>
hold_expression( E const& e )
{
    return expression_holder_t<E>( e );
}

//____________________________________________________________________________//

} // namespace tt_detail
} // namespace test_tools
} // namespace boost

#include <boost/test/detail/enable_warnings.hpp>

#endif

#endif // BOOST_TEST_TOOLS_DETAIL_EXPRESSION_HOLDER_HPP_012705GER
