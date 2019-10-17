//  (C) Copyright Gennadiy Rozental 2001.
//  Distributed under the Boost Software License, Version 1.0.
//  (See accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org/libs/test for the library home page.
//
//!@file
//!@brief Floating point comparison with enhanced reporting
// ***************************************************************************

#ifndef BOOST_TEST_TOOLS_FPC_OP_HPP_050915GER
#define BOOST_TEST_TOOLS_FPC_OP_HPP_050915GER

// Boost.Test
#include <boost/test/tools/assertion.hpp>

#include <boost/test/tools/floating_point_comparison.hpp>
#include <boost/test/tools/fpc_tolerance.hpp>

// Boost
#include <boost/type_traits/common_type.hpp>
#include <boost/utility/enable_if.hpp>

#include <boost/test/detail/suppress_warnings.hpp>

//____________________________________________________________________________//

namespace boost {
namespace test_tools {
namespace assertion {
namespace op {

// ************************************************************************** //
// **************                   fpctraits                  ************** //
// ************************************************************************** //
// set of floating point comparison traits per comparison OP

template<typename OP>
struct fpctraits {
    static const bool cmp_direct = true;
};

template <typename Lhs, typename Rhs>
struct fpctraits<op::NE<Lhs,Rhs> > {
    static const bool cmp_direct = false;
};

template <typename Lhs, typename Rhs>
struct fpctraits<op::LT<Lhs,Rhs> > {
    static const bool cmp_direct = false;
};

template <typename Lhs, typename Rhs>
struct fpctraits<op::GT<Lhs,Rhs> > {
    static const bool cmp_direct = false;
};

//____________________________________________________________________________//

// ************************************************************************** //
// ************** set of overloads to select correct fpc algo  ************** //
// ************************************************************************** //
// we really only care about EQ vs NE. All other comparisons use direct first
// and then need EQ. For example a < b (tolerance t) IFF a < b OR a == b (tolerance t)

template <typename FPT, typename Lhs, typename Rhs, typename OP>
inline assertion_result
compare_fpv( Lhs const& lhs, Rhs const& rhs, OP* )
{
    fpc::close_at_tolerance<FPT> P( fpc_tolerance<FPT>(), fpc::FPC_STRONG );

    assertion_result ar( P( lhs, rhs ) );
    if( !ar )
        ar.message() << "Relative difference exceeds tolerance ["
                     << P.tested_rel_diff() << " > " << P.fraction_tolerance() << ']';
    return ar;
}

//____________________________________________________________________________//

template <typename FPT, typename OP>
inline assertion_result
compare_fpv_near_zero( FPT const& fpv, OP* )
{
    fpc::small_with_tolerance<FPT> P( fpc_tolerance<FPT>() );

    assertion_result ar( P( fpv ) );
    if( !ar )
        ar.message() << "Absolute value exceeds tolerance [|" << fpv << "| > "<< fpc_tolerance<FPT>() << ']';

    return ar;
}

//____________________________________________________________________________//

template <typename FPT, typename Lhs, typename Rhs>
inline assertion_result
compare_fpv( Lhs const& lhs, Rhs const& rhs, op::NE<Lhs,Rhs>* )
{
    fpc::close_at_tolerance<FPT> P( fpc_tolerance<FPT>(), fpc::FPC_WEAK );

    assertion_result ar( !P( lhs, rhs ) );
    if( !ar )
        ar.message() << "Relative difference is within tolerance ["
                     << P.tested_rel_diff() << " < " << fpc_tolerance<FPT>() << ']';

    return ar;
}

//____________________________________________________________________________//

template <typename FPT, typename Lhs, typename Rhs>
inline assertion_result
compare_fpv_near_zero( FPT const& fpv, op::NE<Lhs,Rhs>* )
{
    fpc::small_with_tolerance<FPT> P( fpc_tolerance<FPT>() );

    assertion_result ar( !P( fpv ) );
    if( !ar )
        ar.message() << "Absolute value is within tolerance [|" << fpv << "| < "<< fpc_tolerance<FPT>() << ']';
    return ar;
}

//____________________________________________________________________________//

template <typename FPT, typename Lhs, typename Rhs>
inline assertion_result
compare_fpv( Lhs const& lhs, Rhs const& rhs, op::LT<Lhs,Rhs>* )
{
    return lhs >= rhs ? assertion_result( false ) : compare_fpv<FPT>( lhs, rhs, (op::NE<Lhs,Rhs>*)0 );
}

template <typename FPT, typename Lhs, typename Rhs>
inline assertion_result
compare_fpv_near_zero( FPT const& fpv, op::LT<Lhs,Rhs>* )
{
    return fpv >= 0 ? assertion_result( false ) : compare_fpv_near_zero( fpv, (op::NE<Lhs,Rhs>*)0 );
}

//____________________________________________________________________________//

template <typename FPT, typename Lhs, typename Rhs>
inline assertion_result
compare_fpv( Lhs const& lhs, Rhs const& rhs, op::GT<Lhs,Rhs>* )
{
    return lhs <= rhs ? assertion_result( false ) : compare_fpv<FPT>( lhs, rhs, (op::NE<Lhs,Rhs>*)0 );
}

template <typename FPT, typename Lhs, typename Rhs>
inline assertion_result
compare_fpv_near_zero( FPT const& fpv, op::GT<Lhs,Rhs>* )
{
    return fpv <= 0 ? assertion_result( false ) : compare_fpv_near_zero( fpv, (op::NE<Lhs,Rhs>*)0 );
}


//____________________________________________________________________________//

#define DEFINE_FPV_COMPARISON( oper, name, rev )                        \
template<typename Lhs,typename Rhs>                                     \
struct name<Lhs,Rhs,typename boost::enable_if_c<                        \
    (fpc::tolerance_based<Lhs>::value &&                                \
     fpc::tolerance_based<Rhs>::value)>::type> {                        \
public:                                                                 \
    typedef typename common_type<Lhs,Rhs>::type FPT;                    \
    typedef name<Lhs,Rhs> OP;                                           \
                                                                        \
    typedef assertion_result result_type;                               \
                                                                        \
    static bool                                                         \
    eval_direct( Lhs const& lhs, Rhs const& rhs )                       \
    {                                                                   \
        return lhs oper rhs;                                            \
    }                                                                   \
                                                                        \
    static assertion_result                                             \
    eval( Lhs const& lhs, Rhs const& rhs )                              \
    {                                                                   \
        if( lhs == 0 )                                                  \
        {                                                               \
            return compare_fpv_near_zero( rhs, (OP*)0 );                \
        }                                                               \
                                                                        \
        if( rhs == 0 )                                                  \
        {                                                               \
            return compare_fpv_near_zero( lhs, (OP*)0 );                \
        }                                                               \
                                                                        \
        bool direct_res = eval_direct( lhs, rhs );                      \
                                                                        \
        if( (direct_res && fpctraits<OP>::cmp_direct) ||                \
            fpc_tolerance<FPT>() == FPT(0) )                            \
        {                                                               \
            return direct_res;                                          \
        }                                                               \
                                                                        \
        return compare_fpv<FPT>( lhs, rhs, (OP*)0 );                    \
    }                                                                   \
                                                                        \
    template<typename PrevExprType>                                     \
    static void                                                         \
    report( std::ostream&       ostr,                                   \
            PrevExprType const& lhs,                                    \
            Rhs const&          rhs )                                   \
    {                                                                   \
        lhs.report( ostr );                                             \
        ostr << revert()                                                \
             << tt_detail::print_helper( rhs );                         \
    }                                                                   \
                                                                        \
    static char const* revert()                                         \
    { return " " #rev " "; }                                            \
};                                                                      \
/**/

BOOST_TEST_FOR_EACH_COMP_OP( DEFINE_FPV_COMPARISON )
#undef DEFINE_FPV_COMPARISON

//____________________________________________________________________________//

} // namespace op
} // namespace assertion
} // namespace test_tools
} // namespace boost

#include <boost/test/detail/enable_warnings.hpp>

#endif // BOOST_TEST_TOOLS_FPC_OP_HPP_050915GER

