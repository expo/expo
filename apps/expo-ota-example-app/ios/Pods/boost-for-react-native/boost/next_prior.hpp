//  Boost next_prior.hpp header file  ---------------------------------------//

//  (C) Copyright Dave Abrahams and Daniel Walker 1999-2003. Distributed under the Boost
//  Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org/libs/utility for documentation.

//  Revision History
//  13 Dec 2003  Added next(x, n) and prior(x, n) (Daniel Walker)

#ifndef BOOST_NEXT_PRIOR_HPP_INCLUDED
#define BOOST_NEXT_PRIOR_HPP_INCLUDED

#include <iterator>
#if defined(_MSC_VER) && _MSC_VER <= 1310
#include <boost/mpl/and.hpp>
#include <boost/type_traits/is_integral.hpp>
#endif
#include <boost/type_traits/is_unsigned.hpp>
#include <boost/type_traits/integral_promotion.hpp>
#include <boost/type_traits/make_signed.hpp>
#include <boost/type_traits/has_plus.hpp>
#include <boost/type_traits/has_plus_assign.hpp>
#include <boost/type_traits/has_minus.hpp>
#include <boost/type_traits/has_minus_assign.hpp>

namespace boost {

//  Helper functions for classes like bidirectional iterators not supporting
//  operator+ and operator-
//
//  Usage:
//    const std::list<T>::iterator p = get_some_iterator();
//    const std::list<T>::iterator prev = boost::prior(p);
//    const std::list<T>::iterator next = boost::next(prev, 2);

//  Contributed by Dave Abrahams

namespace next_prior_detail {

template< typename T, typename Distance, bool HasPlus = has_plus< T, Distance >::value >
struct next_impl2
{
    static T call(T x, Distance n)
    {
        std::advance(x, n);
        return x;
    }
};

template< typename T, typename Distance >
struct next_impl2< T, Distance, true >
{
    static T call(T x, Distance n)
    {
        return x + n;
    }
};


template< typename T, typename Distance, bool HasPlusAssign = has_plus_assign< T, Distance >::value >
struct next_impl1 :
    public next_impl2< T, Distance >
{
};

template< typename T, typename Distance >
struct next_impl1< T, Distance, true >
{
    static T call(T x, Distance n)
    {
        x += n;
        return x;
    }
};


template<
    typename T,
    typename Distance,
    typename PromotedDistance = typename integral_promotion< Distance >::type,
#if !defined(_MSC_VER) || _MSC_VER > 1310
    bool IsUInt = is_unsigned< PromotedDistance >::value
#else
    // MSVC 7.1 has problems with applying is_unsigned to non-integral types
    bool IsUInt = mpl::and_< is_integral< PromotedDistance >, is_unsigned< PromotedDistance > >::value
#endif
>
struct prior_impl3
{
    static T call(T x, Distance n)
    {
        std::advance(x, -n);
        return x;
    }
};

template< typename T, typename Distance, typename PromotedDistance >
struct prior_impl3< T, Distance, PromotedDistance, true >
{
    static T call(T x, Distance n)
    {
        typedef typename make_signed< PromotedDistance >::type signed_distance;
        std::advance(x, -static_cast< signed_distance >(static_cast< PromotedDistance >(n)));
        return x;
    }
};


template< typename T, typename Distance, bool HasMinus = has_minus< T, Distance >::value >
struct prior_impl2 :
    public prior_impl3< T, Distance >
{
};

template< typename T, typename Distance >
struct prior_impl2< T, Distance, true >
{
    static T call(T x, Distance n)
    {
        return x - n;
    }
};


template< typename T, typename Distance, bool HasMinusAssign = has_minus_assign< T, Distance >::value >
struct prior_impl1 :
    public prior_impl2< T, Distance >
{
};

template< typename T, typename Distance >
struct prior_impl1< T, Distance, true >
{
    static T call(T x, Distance n)
    {
        x -= n;
        return x;
    }
};

} // namespace next_prior_detail

template <class T>
inline T next(T x) { return ++x; }

template <class T, class Distance>
inline T next(T x, Distance n)
{
    return next_prior_detail::next_impl1< T, Distance >::call(x, n);
}

template <class T>
inline T prior(T x) { return --x; }

template <class T, class Distance>
inline T prior(T x, Distance n)
{
    return next_prior_detail::prior_impl1< T, Distance >::call(x, n);
}

} // namespace boost

#endif  // BOOST_NEXT_PRIOR_HPP_INCLUDED
