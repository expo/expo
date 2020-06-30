// fpclassify.hpp

#ifndef BOOST_SPIRIT_MATH_FPCLASSIFY_HPP
#define BOOST_SPIRIT_MATH_FPCLASSIFY_HPP

// Copyright (c) 2006 Johan Rade

// Distributed under the Boost Software License, Version 1.0.
// (See accompanying file LICENSE_1_0.txt
// or copy at http://www.boost.org/LICENSE_1_0.txt)

/*
The following algorithm is used:

  If all exponent bits, the flag bit (if there is one), 
  and all mantissa bits are 0, then the number is zero.

  If all exponent bits and the flag bit (if there is one) are 0, 
  and at least one mantissa bit is 1, then the number is subnormal.

  If all exponent bits are 1 and all mantissa bits are 0, 
  then the number is infinity.

  If all exponent bits are 1 and at least one mantissa bit is 1,
  then the number is a not-a-number.

  Otherwise the number is normal.

(Note that the binary representation of infinity
has flag bit 0 for Motorola 68K extended double precision,
and flag bit 1 for Intel extended double precision.)

To get the bits, the four or eight most significant bytes are copied
into an uint32_t or uint64_t and bit masks are applied.
This covers all the exponent bits and the flag bit (if there is one),
but not always all the mantissa bits.
Some of the functions below have two implementations,
depending on whether all the mantissa bits are copied or not.
*/

#if defined(_MSC_VER)
#pragma once
#endif

#include <cmath>

#ifndef FP_INFINITE
#   define FP_INFINITE 0
#   define FP_NAN 1
#   define FP_NORMAL 2
#   define FP_SUBNORMAL 3
#   define FP_ZERO 4
#endif

#include <boost/spirit/home/support/detail/math/detail/fp_traits.hpp>

namespace boost {
namespace spirit {
namespace math {
    
//------------------------------------------------------------------------------

template<class T> bool (isfinite)(T x)
{
    typedef BOOST_DEDUCED_TYPENAME detail::fp_traits<T>::type traits;
    traits::init();

    BOOST_DEDUCED_TYPENAME traits::bits a;
    traits::get_bits(x,a);
    a &= traits::exponent;
    return a != traits::exponent;
}

//------------------------------------------------------------------------------

template<class T> bool (isnormal)(T x)
{
    typedef BOOST_DEDUCED_TYPENAME detail::fp_traits<T>::type traits;
    traits::init();

    BOOST_DEDUCED_TYPENAME traits::bits a;
    traits::get_bits(x,a);
    a &= traits::exponent | traits::flag;
    return (a != 0) && (a < traits::exponent);
}

//------------------------------------------------------------------------------

namespace detail {

    template<class T> bool isinf_impl(T x, all_bits)
    {
        typedef BOOST_DEDUCED_TYPENAME fp_traits<T>::type traits;

        BOOST_DEDUCED_TYPENAME traits::bits a;
        traits::get_bits(x,a);
        a &= traits::exponent | traits::mantissa;
        return a == traits::exponent;
    }

    template<class T> bool isinf_impl(T x, not_all_bits)
    {
        typedef BOOST_DEDUCED_TYPENAME fp_traits<T>::type traits;

        BOOST_DEDUCED_TYPENAME traits::bits a;
        traits::get_bits(x,a);
        a &= traits::exponent | traits::mantissa;
        if(a != traits::exponent)
            return false;

        traits::set_bits(x,0);
        return x == 0;
    }

}   // namespace detail

template<class T> bool (isinf)(T x)
{
    typedef BOOST_DEDUCED_TYPENAME detail::fp_traits<T>::type traits;
    traits::init();
    return detail::isinf_impl(x, BOOST_DEDUCED_TYPENAME traits::coverage());
}

//------------------------------------------------------------------------------

namespace detail {

    template<class T> bool isnan_impl(T x, all_bits)
    {
        typedef BOOST_DEDUCED_TYPENAME fp_traits<T>::type traits;
        traits::init();

        BOOST_DEDUCED_TYPENAME traits::bits a;
        traits::get_bits(x,a);
        a &= traits::exponent | traits::mantissa;
        return a > traits::exponent;
    }

    template<class T> bool isnan_impl(T x, not_all_bits)
    {
        typedef BOOST_DEDUCED_TYPENAME fp_traits<T>::type traits;
        traits::init();

        BOOST_DEDUCED_TYPENAME traits::bits a;
        traits::get_bits(x,a);

        a &= traits::exponent | traits::mantissa;
        if(a < traits::exponent)
            return false;

        a &= traits::mantissa;
        traits::set_bits(x,a);
        return x != 0;
    }

}   // namespace detail

template<class T> bool (isnan)(T x)
{
    typedef BOOST_DEDUCED_TYPENAME detail::fp_traits<T>::type traits;
    traits::init();
    return detail::isnan_impl(x, BOOST_DEDUCED_TYPENAME traits::coverage());
}

//------------------------------------------------------------------------------

namespace detail {

    template<class T> int fpclassify_impl(T x, all_bits)
    {
        typedef BOOST_DEDUCED_TYPENAME fp_traits<T>::type traits;

        BOOST_DEDUCED_TYPENAME traits::bits a;
        traits::get_bits(x,a);
        a &= traits::exponent | traits::flag | traits::mantissa;

        if(a <= traits::mantissa) {
            if(a == 0)
                return FP_ZERO;
            else
                return FP_SUBNORMAL;
        }

        if(a < traits::exponent)
            return FP_NORMAL;

        a &= traits::mantissa;
        if(a == 0)
            return FP_INFINITE;

        return FP_NAN;
    }

    template<class T> int fpclassify_impl(T x, not_all_bits)
    {
        typedef BOOST_DEDUCED_TYPENAME fp_traits<T>::type traits;

        BOOST_DEDUCED_TYPENAME traits::bits a;
        traits::get_bits(x,a); 
        a &= traits::exponent | traits::flag | traits::mantissa;

        if(a <= traits::mantissa) {
            if(x == 0)
                return FP_ZERO;
            else
                return FP_SUBNORMAL;
        }
            
        if(a < traits::exponent)
            return FP_NORMAL;

        a &= traits::mantissa;
        traits::set_bits(x,a);
        if(x == 0)
            return FP_INFINITE;
        
        return FP_NAN;
    }

}   // namespace detail

template<class T> int (fpclassify)(T x)
{
    typedef BOOST_DEDUCED_TYPENAME detail::fp_traits<T>::type traits;
    traits::init();
    return detail::fpclassify_impl(x, BOOST_DEDUCED_TYPENAME traits::coverage());
}

//------------------------------------------------------------------------------

}   // namespace math
}   // namespace spirit
}   // namespace boost

#endif
