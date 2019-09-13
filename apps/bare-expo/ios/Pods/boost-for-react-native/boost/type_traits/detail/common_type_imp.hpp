/*******************************************************************************
 * boost/type_traits/detail/common_type_imp.hpp
 *
 * Copyright 2010, Jeffrey Hellrung.
 * Distributed under the Boost Software License, Version 1.0.  (See accompanying
 * file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
 *
 * struct boost::common_type<T,U>
 *
 * common_type<T,U>::type is the type of the expression
 *     b() ? x() : y()
 * where b() returns a bool, x() has return type T, and y() has return type U.
 * See
 *     http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2008/n2661.htm#common_type
 *
 * Note that this evaluates to void if one or both of T and U is void.
 ******************************************************************************/

#ifndef BOOST_TYPE_TRAITS_DETAIL_COMMON_TYPE_IMP_HPP
#define BOOST_TYPE_TRAITS_DETAIL_COMMON_TYPE_IMP_HPP

#include <cstddef>

#include <boost/mpl/assert.hpp>
#include <boost/mpl/at.hpp>
#include <boost/mpl/begin_end.hpp>
#include <boost/mpl/contains.hpp>
#include <boost/mpl/copy.hpp>
#include <boost/mpl/deref.hpp>
#include <boost/mpl/eval_if.hpp>
#include <boost/mpl/if.hpp>
#include <boost/mpl/inserter.hpp>
#include <boost/mpl/next.hpp>
#include <boost/mpl/or.hpp>
#include <boost/mpl/placeholders.hpp>
#include <boost/mpl/push_back.hpp>
#include <boost/mpl/size.hpp>
#include <boost/mpl/vector/vector0.hpp>
#include <boost/mpl/vector/vector10.hpp>
#include <boost/type_traits/integral_constant.hpp>
#include <boost/type_traits/is_enum.hpp>
#include <boost/type_traits/is_integral.hpp>
#include <boost/type_traits/make_signed.hpp>
#include <boost/type_traits/make_unsigned.hpp>
#include <boost/type_traits/remove_cv.hpp>
#include <boost/type_traits/remove_reference.hpp>
#include <boost/utility/declval.hpp>

namespace boost
{

namespace detail_type_traits_common_type
{

/*******************************************************************************
 * struct propagate_cv< From, To >
 *
 * This metafunction propagates cv-qualifiers on type From to type To.
 ******************************************************************************/

template< class From, class To >
struct propagate_cv
{ typedef To type; };
template< class From, class To >
struct propagate_cv< const From, To >
{ typedef To const type; };
template< class From, class To >
struct propagate_cv< volatile From, To >
{ typedef To volatile type; };
template< class From, class To >
struct propagate_cv< const volatile From, To >
{ typedef To const volatile type; };

/*******************************************************************************
 * struct is_integral_or_enum<T>
 *
 * This metafunction determines if T is an integral type which can be made
 * signed or unsigned.
 ******************************************************************************/

template< class T >
struct is_integral_or_enum
    : public mpl::or_< is_integral<T>, is_enum<T> >
{ };
template<>
struct is_integral_or_enum< bool >
    : public false_type
{ };

/*******************************************************************************
 * struct make_unsigned_soft<T>
 * struct make_signed_soft<T>
 *
 * These metafunction are identical to make_unsigned and make_signed,
 * respectively, except for special-casing bool.
 ******************************************************************************/

template< class T >
struct make_unsigned_soft
    : public make_unsigned<T>
{ };
template<>
struct make_unsigned_soft< bool >
{ typedef bool type; };

template< class T >
struct make_signed_soft
    : public make_signed<T>
{ };
template<>
struct make_signed_soft< bool >
{ typedef bool type; };

/*******************************************************************************
 * struct sizeof_t<N>
 * typedef ... yes_type
 * typedef ... no_type
 *
 * These types are integral players in the use of the "sizeof trick", i.e., we
 * can distinguish overload selection by inspecting the size of the return type
 * of the overload.
 ******************************************************************************/

template< std::size_t N > struct sizeof_t { char _dummy[N]; };
typedef sizeof_t<1> yes_type;
typedef sizeof_t<2> no_type;
BOOST_MPL_ASSERT_RELATION( sizeof( yes_type ), ==, 1 );
BOOST_MPL_ASSERT_RELATION( sizeof( no_type ), ==, 2 );

/*******************************************************************************
 * rvalue_test(T&) -> no_type
 * rvalue_test(...) -> yes_type
 *
 * These overloads are used to determine the rvalue-ness of an expression.
 ******************************************************************************/

template< class T > no_type rvalue_test(T&);
yes_type rvalue_test(...);

/*******************************************************************************
 * struct conversion_test_overloads< Sequence >
 *
 * This struct has multiple overloads of the static member function apply, each
 * one taking a single parameter of a type within the Boost.MPL sequence
 * Sequence.  Each such apply overload has a return type with sizeof equal to
 * one plus the index of the parameter type within Sequence.  Thus, we can
 * deduce the type T of an expression as long as we can generate a finite set of
 * candidate types containing T via these apply overloads and the "sizeof
 * trick".
 ******************************************************************************/

template< class First, class Last, std::size_t Index >
struct conversion_test_overloads_iterate
    : public conversion_test_overloads_iterate<
          typename mpl::next< First >::type, Last, Index + 1
      >
{
    using conversion_test_overloads_iterate<
        typename mpl::next< First >::type, Last, Index + 1
    >::apply;
    static sizeof_t< Index + 1 >
    apply(typename mpl::deref< First >::type);
};

template< class Last, std::size_t Index >
struct conversion_test_overloads_iterate< Last, Last, Index >
{ static sizeof_t< Index + 1 > apply(...); };

template< class Sequence >
struct conversion_test_overloads
    : public conversion_test_overloads_iterate<
          typename mpl::begin< Sequence >::type,
          typename mpl::end< Sequence >::type,
          0
      >
{ };

/*******************************************************************************
 * struct select< Sequence, Index >
 *
 * select is synonymous with mpl::at_c unless Index equals the size of the
 * Boost.MPL Sequence, in which case this evaluates to void.
 ******************************************************************************/

template<
    class Sequence, int Index,
    int N = mpl::size< Sequence >::value
>
struct select
    : public mpl::at_c< Sequence, Index >
{ };
template< class Sequence, int N >
struct select< Sequence, N, N >
{ typedef void type; };

/*******************************************************************************
 * class deduce_common_type< T, U, NominalCandidates >
 * struct nominal_candidates<T,U>
 * struct common_type_dispatch_on_rvalueness<T,U>
 * struct common_type_impl<T,U>
 *
 * These classes and structs implement the logic behind common_type, which goes
 * roughly as follows.  Let C be the type of the conditional expression
 *     declval< bool >() ? declval<T>() : declval<U>()
 * if C is an rvalue, then:
 *     let T' and U' be T and U stripped of reference- and cv-qualifiers
 *     if T' and U' are pointer types, say, T' = V* and U' = W*, then:
 *         define the set of NominalCandidates to be
 *             { V*, W*, V'*, W'* }
 *           where V' is V with whatever cv-qualifiers are on W, and W' is W
 *           with whatever cv-qualifiers are on V
 *     else if T' and U' are both integral or enum types, then:
 *         define the set of NominalCandidates to be
 *             {
 *                 unsigned_soft(T'),
 *                 unsigned_soft(U'),
 *                 signed_soft(T'),
 *                 signed_soft(U'),
 *                 T',
 *                 U',
 *                 unsigned int,
 *                 int
 *             }
 *           where unsigned_soft(X) is make_unsigned_soft<X>::type and
 *           signed_soft(X) is make_signed_soft<X>::type (these are all
 *           generally necessary to cover the various integral promotion cases)
 *     else
 *         define the set of NominalCandidates to be
 *             { T', U' }
 * else
 *     let V and W be T and U stripped of reference-qualifiers
 *     define the set of NominalCandidates to be
 *         { V&, W&, V'&, W'& }
 *     where V' is V with whatever cv-qualifiers are on W, and W' is W with
 *       whatever cv-qualifiers are on V
 * define the set of Candidates to be equal to the set of NominalCandidates with
 * duplicates removed, and use this set of Candidates to determine C using the
 * conversion_test_overloads struct
 ******************************************************************************/

template< class T, class U, class NominalCandidates >
class deduce_common_type
{
    typedef typename mpl::copy<
        NominalCandidates,
        mpl::inserter<
            mpl::vector0<>,
            mpl::if_<
                mpl::contains< mpl::_1, mpl::_2 >,
                mpl::_1,
                mpl::push_back< mpl::_1, mpl::_2 >
            >
        >
    >::type candidate_types;
    static const int best_candidate_index =
        sizeof( conversion_test_overloads< candidate_types >::apply(
            declval< bool >() ? declval<T>() : declval<U>()
        ) ) - 1;
public:
    typedef typename select< candidate_types, best_candidate_index >::type type;
};

template<
    class T, class U,
    class V = typename remove_cv< typename remove_reference<T>::type >::type,
    class W = typename remove_cv< typename remove_reference<U>::type >::type,
    bool = is_integral_or_enum<V>::value && is_integral_or_enum<W>::value
>
struct nominal_candidates
{ typedef mpl::vector2<V,W> type; };

template< class T, class U, class V, class W >
struct nominal_candidates< T, U, V, W, true >
{
    typedef boost::mpl::vector8<
        typename make_unsigned_soft<V>::type,
        typename make_unsigned_soft<W>::type,
        typename make_signed_soft<V>::type,
        typename make_signed_soft<W>::type,
        V, W, unsigned int, int
    > type;
};

template< class T, class U, class V, class W >
struct nominal_candidates< T, U, V*, W*, false >
{
    typedef mpl::vector4<
        V*, W*,
        typename propagate_cv<W,V>::type *,
        typename propagate_cv<V,W>::type *
    > type;
};

template<class T, class U, bool b>
struct common_type_dispatch_on_rvalueness
    : public deduce_common_type< T, U, typename nominal_candidates<T,U>::type >
{ };

template< class T, class U >
struct common_type_dispatch_on_rvalueness< T, U, false >
{
private:
    typedef typename remove_reference<T>::type unrefed_T_type;
    typedef typename remove_reference<U>::type unrefed_U_type;
public:
    typedef typename deduce_common_type<
        T, U,
        mpl::vector4<
            unrefed_T_type &,
            unrefed_U_type &,
            typename propagate_cv< unrefed_U_type, unrefed_T_type >::type &,
            typename propagate_cv< unrefed_T_type, unrefed_U_type >::type &
        >
    >::type type;
};

template< class T, class U >
struct common_type_impl
    : public common_type_dispatch_on_rvalueness<T,U, sizeof( ::boost::detail_type_traits_common_type::rvalue_test(
        declval< bool >() ? declval<T>() : declval<U>() ) ) == sizeof( yes_type ) >
{ };

template< class T > struct common_type_impl< T, void > { typedef void type; };
template< class T > struct common_type_impl< void, T > { typedef void type; };
template<> struct common_type_impl< void, void > { typedef void type; };

} // namespace detail_type_traits_common_type


} // namespace boost

#endif // BOOST_TYPE_TRAITS_DETAIL_COMMON_TYPE_HPP

