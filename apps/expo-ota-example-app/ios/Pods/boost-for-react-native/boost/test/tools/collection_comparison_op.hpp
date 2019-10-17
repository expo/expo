//  (C) Copyright Gennadiy Rozental 2001.
//  Distributed under the Boost Software License, Version 1.0.
//  (See accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org/libs/test for the library home page.
//
//!@file
//!@brief Collection comparison with enhanced reporting
// ***************************************************************************

#ifndef BOOST_TEST_TOOLS_COLLECTION_COMPARISON_OP_HPP_050815GER
#define BOOST_TEST_TOOLS_COLLECTION_COMPARISON_OP_HPP_050815GER

// Boost.Test
#include <boost/test/tools/assertion.hpp>

#include <boost/test/utils/is_forward_iterable.hpp>
#include <boost/test/utils/is_cstring.hpp>

// Boost
#include <boost/mpl/bool.hpp>
#include <boost/utility/enable_if.hpp>
#include <boost/type_traits/decay.hpp>

#include <boost/test/detail/suppress_warnings.hpp>

//____________________________________________________________________________//

namespace boost {
namespace test_tools {
namespace assertion {

// ************************************************************************** //
// ************* selectors for specialized comparizon routines ************** //
// ************************************************************************** //

template<typename T>
struct specialized_compare : public mpl::false_ {};

#define BOOST_TEST_SPECIALIZED_COLLECTION_COMPARE(Col)          \
namespace boost { namespace test_tools { namespace assertion {  \
template<>                                                      \
struct specialized_compare<Col> : public mpl::true_ {};         \
}}}                                                             \
/**/

// ************************************************************************** //
// **************            lexicographic_compare             ************** //
// ************************************************************************** //

namespace op {

template <typename OP, bool can_be_equal, bool prefer_shorter,
          typename Lhs, typename Rhs>
inline
typename boost::enable_if_c<
    unit_test::is_forward_iterable<Lhs>::value && unit_test::is_forward_iterable<Rhs>::value,
    assertion_result>::type
lexicographic_compare( Lhs const& lhs, Rhs const& rhs )
{
    assertion_result ar( true );

    typename Lhs::const_iterator first1 = lhs.begin();
    typename Rhs::const_iterator first2 = rhs.begin();
    typename Lhs::const_iterator last1  = lhs.end();
    typename Rhs::const_iterator last2  = rhs.end();
    std::size_t                  pos    = 0;

    for( ; (first1 != last1) && (first2 != last2); ++first1, ++first2, ++pos ) {
        assertion_result const& element_ar = OP::eval(*first1, *first2);
        if( !can_be_equal && element_ar )
            return ar; // a < b

        assertion_result const& reverse_ar = OP::eval(*first2, *first1);
        if( element_ar && !reverse_ar )
            return ar; // a<=b and !(b<=a) => a < b => return true

        if( element_ar || !reverse_ar )
            continue; // (a<=b and b<=a) or (!(a<b) and !(b<a)) => a == b => keep looking

        // !(a<=b) and b<=a => b < a => return false
        ar = false;
        ar.message() << "\nFailure at position " << pos << ": "
                     << tt_detail::print_helper(*first1)
                     << OP::revert()
                     << tt_detail::print_helper(*first2)
                     << ". " << element_ar.message();
        return ar;
    }

    if( first1 != last1 ) {
        if( prefer_shorter ) {
            ar = false;
            ar.message() << "\nFirst collection has extra trailing elements.";
        }
    }
    else if( first2 != last2 ) {
        if( !prefer_shorter ) {
            ar = false;
            ar.message() << "\nSecond collection has extra trailing elements.";
        }
    }
    else if( !can_be_equal ) {
        ar = false;
        ar.message() << "\nCollections appear to be equal.";
    }

    return ar;
}

template <typename OP, bool can_be_equal, bool prefer_shorter,
          typename Lhs, typename Rhs>
inline
typename boost::enable_if_c<
    (!unit_test::is_forward_iterable<Lhs>::value && unit_test::is_cstring<Lhs>::value) ||
    (!unit_test::is_forward_iterable<Rhs>::value && unit_test::is_cstring<Rhs>::value),
    assertion_result>::type
lexicographic_compare( Lhs const& lhs, Rhs const& rhs )
{
    typedef typename unit_test::deduce_cstring<Lhs>::type lhs_char_type;
    typedef typename unit_test::deduce_cstring<Rhs>::type rhs_char_type;

    return lexicographic_compare<OP, can_be_equal, prefer_shorter>(
        boost::unit_test::basic_cstring<lhs_char_type>(lhs),
        boost::unit_test::basic_cstring<rhs_char_type>(rhs));
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************               equality_compare               ************** //
// ************************************************************************** //

template <typename OP, typename Lhs, typename Rhs>
inline
typename boost::enable_if_c<
    unit_test::is_forward_iterable<Lhs>::value && unit_test::is_forward_iterable<Rhs>::value,
    assertion_result>::type
element_compare( Lhs const& lhs, Rhs const& rhs )
{
    assertion_result ar( true );

    if( lhs.size() != rhs.size() ) {
        ar = false;
        ar.message() << "\nCollections size mismatch: " << lhs.size() << " != " << rhs.size();
        return ar;
    }

    typename Lhs::const_iterator left  = lhs.begin();
    typename Rhs::const_iterator right = rhs.begin();
    std::size_t                  pos   = 0;

    for( ; pos < lhs.size(); ++left, ++right, ++pos ) {
        assertion_result const element_ar = OP::eval( *left, *right );
        if( element_ar )
            continue;

        ar = false;
        ar.message() << "\nMismatch at position " << pos << ": "
                     << tt_detail::print_helper(*left)
                     << OP::revert()
                     << tt_detail::print_helper(*right)
                     << ". " << element_ar.message();
    }

    return ar;
}

// In case string comparison is branching here
template <typename OP, typename Lhs, typename Rhs>
inline
typename boost::enable_if_c<
    (!unit_test::is_forward_iterable<Lhs>::value && unit_test::is_cstring<Lhs>::value) ||
    (!unit_test::is_forward_iterable<Rhs>::value && unit_test::is_cstring<Rhs>::value),
    assertion_result>::type
element_compare( Lhs const& lhs, Rhs const& rhs )
{
    typedef typename unit_test::deduce_cstring<Lhs>::type lhs_char_type;
    typedef typename unit_test::deduce_cstring<Rhs>::type rhs_char_type;

    return element_compare<OP>(boost::unit_test::basic_cstring<lhs_char_type>(lhs),
                               boost::unit_test::basic_cstring<rhs_char_type>(rhs));
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************             non_equality_compare             ************** //
// ************************************************************************** //

template <typename OP, typename Lhs, typename Rhs>
inline assertion_result
non_equality_compare( Lhs const& lhs, Rhs const& rhs )
{
    assertion_result ar( true );

    if( lhs.size() != rhs.size() )
        return ar;

    typename Lhs::const_iterator left  = lhs.begin();
    typename Rhs::const_iterator right = rhs.begin();
    typename Lhs::const_iterator end   = lhs.end();

    for( ; left != end; ++left, ++right ) {
        if( OP::eval( *left, *right ) )
            return ar;
    }

    ar = false;
    ar.message() << "\nCollections appear to be equal";

    return ar;
}

//____________________________________________________________________________//

// ************************************************************************** //
// **************                   cctraits                   ************** //
// ************************************************************************** //
// set of collection comparison traits per comparison OP

template<typename OP>
struct cctraits;

template<typename Lhs, typename Rhs>
struct cctraits<op::EQ<Lhs, Rhs> > {
    typedef specialized_compare<Lhs> is_specialized;
};

template<typename Lhs, typename Rhs>
struct cctraits<op::NE<Lhs, Rhs> > {
    typedef specialized_compare<Lhs> is_specialized;
};

template<typename Lhs, typename Rhs>
struct cctraits<op::LT<Lhs, Rhs> > {
    static const bool can_be_equal = false;
    static const bool prefer_short = true;

    typedef specialized_compare<Lhs> is_specialized;
};

template<typename Lhs, typename Rhs>
struct cctraits<op::LE<Lhs, Rhs> > {
    static const bool can_be_equal = true;
    static const bool prefer_short = true;

    typedef specialized_compare<Lhs> is_specialized;
};

template<typename Lhs, typename Rhs>
struct cctraits<op::GT<Lhs, Rhs> > {
    static const bool can_be_equal = false;
    static const bool prefer_short = false;

    typedef specialized_compare<Lhs> is_specialized;
};

template<typename Lhs, typename Rhs>
struct cctraits<op::GE<Lhs, Rhs> > {
    static const bool can_be_equal = true;
    static const bool prefer_short = false;

    typedef specialized_compare<Lhs> is_specialized;
};

// ************************************************************************** //
// **************              compare_collections             ************** //
// ************************************************************************** //
// Overloaded set of functions dispatching to specific implementation of comparison

template <typename Lhs, typename Rhs, typename L, typename R>
inline assertion_result
compare_collections( Lhs const& lhs, Rhs const& rhs, boost::type<op::EQ<L, R> >*, mpl::true_ )
{
    return assertion::op::element_compare<op::EQ<L, R> >( lhs, rhs );
}

//____________________________________________________________________________//

template <typename Lhs, typename Rhs, typename L, typename R>
inline assertion_result
compare_collections( Lhs const& lhs, Rhs const& rhs, boost::type<op::EQ<L, R> >*, mpl::false_ )
{
    return lhs == rhs;
}

//____________________________________________________________________________//

template <typename Lhs, typename Rhs, typename L, typename R>
inline assertion_result
compare_collections( Lhs const& lhs, Rhs const& rhs, boost::type<op::NE<L, R> >*, mpl::true_ )
{
    return assertion::op::non_equality_compare<op::NE<L, R> >( lhs, rhs );
}

//____________________________________________________________________________//

template <typename Lhs, typename Rhs, typename L, typename R>
inline assertion_result
compare_collections( Lhs const& lhs, Rhs const& rhs, boost::type<op::NE<L, R> >*, mpl::false_ )
{
    return lhs != rhs;
}

//____________________________________________________________________________//

template <typename OP, typename Lhs, typename Rhs>
inline assertion_result
lexicographic_compare( Lhs const& lhs, Rhs const& rhs )
{
    return assertion::op::lexicographic_compare<OP, cctraits<OP>::can_be_equal, cctraits<OP>::prefer_short>( lhs, rhs );
}

//____________________________________________________________________________//

template <typename Lhs, typename Rhs, typename OP>
inline assertion_result
compare_collections( Lhs const& lhs, Rhs const& rhs, boost::type<OP>*, mpl::true_ )
{
    return lexicographic_compare<OP>( lhs, rhs );
}

//____________________________________________________________________________//

template <typename Lhs, typename Rhs, typename L, typename R>
inline assertion_result
compare_collections( Lhs const& lhs, Rhs const& rhs, boost::type<op::LT<L, R> >*, mpl::false_ )
{
    return lhs < rhs;
}

//____________________________________________________________________________//

template <typename Lhs, typename Rhs, typename L, typename R>
inline assertion_result
compare_collections( Lhs const& lhs, Rhs const& rhs, boost::type<op::LE<L, R> >*, mpl::false_ )
{
    return lhs <= rhs;
}

//____________________________________________________________________________//

template <typename Lhs, typename Rhs, typename L, typename R>
inline assertion_result
compare_collections( Lhs const& lhs, Rhs const& rhs, boost::type<op::GT<L, R> >*, mpl::false_ )
{
    return lhs > rhs;
}

//____________________________________________________________________________//

template <typename Lhs, typename Rhs, typename L, typename R>
inline assertion_result
compare_collections( Lhs const& lhs, Rhs const& rhs, boost::type<op::GE<L, R> >*, mpl::false_ )
{
    return lhs >= rhs;
}

//____________________________________________________________________________//

// ************************************************************************** //
// ********* specialization of comparison operators for collections ********* //
// ************************************************************************** //

#define DEFINE_COLLECTION_COMPARISON( oper, name, rev )             \
template<typename Lhs,typename Rhs>                                 \
struct name<Lhs,Rhs,typename boost::enable_if_c<                    \
    unit_test::is_forward_iterable<Lhs>::value \
    &&   !unit_test::is_cstring<Lhs>::value \
    && unit_test::is_forward_iterable<Rhs>::value \
    &&   !unit_test::is_cstring<Rhs>::value>::type> {            \
public:                                                             \
    typedef assertion_result result_type;                           \
                                                                    \
    typedef name<Lhs, Rhs> OP;                                      \
    typedef typename                                                \
        mpl::if_c<is_same<typename decay<Lhs>::type,                \
                          typename decay<Rhs>::type>::value,        \
                  typename cctraits<OP>::is_specialized,            \
                  mpl::false_>::type is_specialized;                \
                                                                    \
    typedef name<typename Lhs::value_type,                          \
                 typename Rhs::value_type> elem_op;                 \
                                                                    \
    static assertion_result                                         \
    eval( Lhs const& lhs, Rhs const& rhs)                           \
    {                                                               \
        return assertion::op::compare_collections( lhs, rhs,        \
            (boost::type<elem_op>*)0,                               \
            is_specialized() );                                     \
    }                                                               \
                                                                    \
    template<typename PrevExprType>                                 \
    static void                                                     \
    report( std::ostream&,                                          \
            PrevExprType const&,                                    \
            Rhs const& ) {}                                         \
                                                                    \
    static char const* revert()                                     \
    { return " " #rev " "; }                                        \
                                                                    \
};                                                                  \
/**/

BOOST_TEST_FOR_EACH_COMP_OP( DEFINE_COLLECTION_COMPARISON )
#undef DEFINE_COLLECTION_COMPARISON

//____________________________________________________________________________//

} // namespace op
} // namespace assertion
} // namespace test_tools
} // namespace boost

#include <boost/test/detail/enable_warnings.hpp>

#endif // BOOST_TEST_TOOLS_COLLECTION_COMPARISON_OP_HPP_050815GER
