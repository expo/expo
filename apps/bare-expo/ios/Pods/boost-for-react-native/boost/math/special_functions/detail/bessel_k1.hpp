//  Copyright (c) 2006 Xiaogang Zhang
//  Use, modification and distribution are subject to the
//  Boost Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_MATH_BESSEL_K1_HPP
#define BOOST_MATH_BESSEL_K1_HPP

#ifdef _MSC_VER
#pragma once
#pragma warning(push)
#pragma warning(disable:4702) // Unreachable code (release mode only warning)
#endif

#include <boost/math/tools/rational.hpp>
#include <boost/math/tools/big_constant.hpp>
#include <boost/math/policies/error_handling.hpp>
#include <boost/assert.hpp>

// Modified Bessel function of the second kind of order one
// minimax rational approximations on intervals, see
// Russon and Blair, Chalk River Report AECL-3461, 1969

namespace boost { namespace math { namespace detail{

template <typename T, typename Policy>
T bessel_k1(T x, const Policy&);

template <class T, class Policy>
struct bessel_k1_initializer
{
   struct init
   {
      init()
      {
         do_init();
      }
      static void do_init()
      {
         bessel_k1(T(1), Policy());
      }
      void force_instantiate()const{}
   };
   static const init initializer;
   static void force_instantiate()
   {
      initializer.force_instantiate();
   }
};

template <class T, class Policy>
const typename bessel_k1_initializer<T, Policy>::init bessel_k1_initializer<T, Policy>::initializer;

template <typename T, typename Policy>
T bessel_k1(T x, const Policy& pol)
{
    bessel_k1_initializer<T, Policy>::force_instantiate();

    static const T P1[] = {
        static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, -2.2149374878243304548e+06)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 7.1938920065420586101e+05)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 1.7733324035147015630e+05)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 7.1885382604084798576e+03)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 9.9991373567429309922e+01)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 4.8127070456878442310e-01))
    };
    static const T Q1[] = {
        static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, -2.2149374878243304548e+06)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 3.7264298672067697862e+04)),
        static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, -2.8143915754538725829e+02)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 1.0))
    };
    static const T P2[] = {
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 0.0)),
        static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, -1.3531161492785421328e+06)),
        static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, -1.4758069205414222471e+05)),
        static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, -4.5051623763436087023e+03)),
        static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, -5.3103913335180275253e+01)),
        static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, -2.2795590826955002390e-01))
    };
    static const T Q2[] = {
        static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, -2.7062322985570842656e+06)),
        static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 4.3117653211351080007e+04)),
        static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, -3.0507151578787595807e+02)),
        static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 1.0))
    };
    static const T P3[] = {
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 2.2196792496874548962e+00)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 4.4137176114230414036e+01)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 3.4122953486801312910e+02)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 1.3319486433183221990e+03)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 2.8590657697910288226e+03)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 3.4540675585544584407e+03)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 2.3123742209168871550e+03)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 8.1094256146537402173e+02)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 1.3182609918569941308e+02)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 7.5584584631176030810e+00)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 6.4257745859173138767e-02))
    };
    static const T Q3[] = {
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 1.7710478032601086579e+00)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 3.4552228452758912848e+01)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 2.5951223655579051357e+02)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 9.6929165726802648634e+02)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 1.9448440788918006154e+03)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 2.1181000487171943810e+03)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 1.2082692316002348638e+03)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 3.3031020088765390854e+02)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 3.6001069306861518855e+01)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 1.0))
    };
    T value, factor, r, r1, r2;

    BOOST_MATH_STD_USING
    using namespace boost::math::tools;

    static const char* function = "boost::math::bessel_k1<%1%>(%1%,%1%)";

    if (x < 0)
    {
       return policies::raise_domain_error<T>(function,
            "Got x = %1%, but argument x must be non-negative, complex number result not supported.", x, pol);
    }
    if (x == 0)
    {
       return policies::raise_overflow_error<T>(function, 0, pol);
    }
    if (x <= 1)                         // x in (0, 1]
    {
        T y = x * x;
        r1 = evaluate_polynomial(P1, y) /  evaluate_polynomial(Q1, y);
        r2 = evaluate_polynomial(P2, y) /  evaluate_polynomial(Q2, y);
        factor = log(x);
        value = (r1 + factor * r2) / x;
    }
    else                                // x in (1, \infty)
    {
        T y = 1 / x;
        r = evaluate_polynomial(P3, y) /  evaluate_polynomial(Q3, y);
        factor = exp(-x) / sqrt(x);
        value = factor * r;
    }

    return value;
}

}}} // namespaces

#ifdef _MSC_VER
#pragma warning(pop)
#endif

#endif // BOOST_MATH_BESSEL_K1_HPP

