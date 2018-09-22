
//  (C) Copyright John Maddock 2006.
//  Use, modification and distribution are subject to the
//  Boost Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_MATH_SPECIAL_LEGENDRE_HPP
#define BOOST_MATH_SPECIAL_LEGENDRE_HPP

#ifdef _MSC_VER
#pragma once
#endif

#include <boost/math/special_functions/math_fwd.hpp>
#include <boost/math/special_functions/factorials.hpp>
#include <boost/math/tools/config.hpp>

namespace boost{
namespace math{

// Recurrance relation for legendre P and Q polynomials:
template <class T1, class T2, class T3>
inline typename tools::promote_args<T1, T2, T3>::type
   legendre_next(unsigned l, T1 x, T2 Pl, T3 Plm1)
{
   typedef typename tools::promote_args<T1, T2, T3>::type result_type;
   return ((2 * l + 1) * result_type(x) * result_type(Pl) - l * result_type(Plm1)) / (l + 1);
}

namespace detail{

// Implement Legendre P and Q polynomials via recurrance:
template <class T, class Policy>
T legendre_imp(unsigned l, T x, const Policy& pol, bool second = false)
{
   static const char* function = "boost::math::legrendre_p<%1%>(unsigned, %1%)";
   // Error handling:
   if((x < -1) || (x > 1))
      return policies::raise_domain_error<T>(
         function,
         "The Legendre Polynomial is defined for"
         " -1 <= x <= 1, but got x = %1%.", x, pol);

   T p0, p1;
   if(second)
   {
      // A solution of the second kind (Q):
      p0 = (boost::math::log1p(x, pol) - boost::math::log1p(-x, pol)) / 2;
      p1 = x * p0 - 1;
   }
   else
   {
      // A solution of the first kind (P):
      p0 = 1;
      p1 = x;
   }
   if(l == 0)
      return p0;

   unsigned n = 1;

   while(n < l)
   {
      std::swap(p0, p1);
      p1 = boost::math::legendre_next(n, x, p0, p1);
      ++n;
   }
   return p1;
}

} // namespace detail

template <class T, class Policy>
inline typename boost::enable_if_c<policies::is_policy<Policy>::value, typename tools::promote_args<T>::type>::type
   legendre_p(int l, T x, const Policy& pol)
{
   typedef typename tools::promote_args<T>::type result_type;
   typedef typename policies::evaluation<result_type, Policy>::type value_type;
   static const char* function = "boost::math::legendre_p<%1%>(unsigned, %1%)";
   if(l < 0)
      return policies::checked_narrowing_cast<result_type, Policy>(detail::legendre_imp(-l-1, static_cast<value_type>(x), pol, false), function);
   return policies::checked_narrowing_cast<result_type, Policy>(detail::legendre_imp(l, static_cast<value_type>(x), pol, false), function);
}

template <class T>
inline typename tools::promote_args<T>::type 
   legendre_p(int l, T x)
{
   return boost::math::legendre_p(l, x, policies::policy<>());
}

template <class T, class Policy>
inline typename boost::enable_if_c<policies::is_policy<Policy>::value, typename tools::promote_args<T>::type>::type
   legendre_q(unsigned l, T x, const Policy& pol)
{
   typedef typename tools::promote_args<T>::type result_type;
   typedef typename policies::evaluation<result_type, Policy>::type value_type;
   return policies::checked_narrowing_cast<result_type, Policy>(detail::legendre_imp(l, static_cast<value_type>(x), pol, true), "boost::math::legendre_q<%1%>(unsigned, %1%)");
}

template <class T>
inline typename tools::promote_args<T>::type 
   legendre_q(unsigned l, T x)
{
   return boost::math::legendre_q(l, x, policies::policy<>());
}

// Recurrence for associated polynomials:
template <class T1, class T2, class T3>
inline typename tools::promote_args<T1, T2, T3>::type 
   legendre_next(unsigned l, unsigned m, T1 x, T2 Pl, T3 Plm1)
{
   typedef typename tools::promote_args<T1, T2, T3>::type result_type;
   return ((2 * l + 1) * result_type(x) * result_type(Pl) - (l + m) * result_type(Plm1)) / (l + 1 - m);
}

namespace detail{
// Legendre P associated polynomial:
template <class T, class Policy>
T legendre_p_imp(int l, int m, T x, T sin_theta_power, const Policy& pol)
{
   // Error handling:
   if((x < -1) || (x > 1))
      return policies::raise_domain_error<T>(
      "boost::math::legendre_p<%1%>(int, int, %1%)",
         "The associated Legendre Polynomial is defined for"
         " -1 <= x <= 1, but got x = %1%.", x, pol);
   // Handle negative arguments first:
   if(l < 0)
      return legendre_p_imp(-l-1, m, x, sin_theta_power, pol);
   if(m < 0)
   {
      int sign = (m&1) ? -1 : 1;
      return sign * boost::math::tgamma_ratio(static_cast<T>(l+m+1), static_cast<T>(l+1-m), pol) * legendre_p_imp(l, -m, x, sin_theta_power, pol);
   }
   // Special cases:
   if(m > l)
      return 0;
   if(m == 0)
      return boost::math::legendre_p(l, x, pol);

   T p0 = boost::math::double_factorial<T>(2 * m - 1, pol) * sin_theta_power;

   if(m&1)
      p0 *= -1;
   if(m == l)
      return p0;

   T p1 = x * (2 * m + 1) * p0;

   int n = m + 1;

   while(n < l)
   {
      std::swap(p0, p1);
      p1 = boost::math::legendre_next(n, m, x, p0, p1);
      ++n;
   }
   return p1;
}

template <class T, class Policy>
inline T legendre_p_imp(int l, int m, T x, const Policy& pol)
{
   BOOST_MATH_STD_USING
   // TODO: we really could use that mythical "pow1p" function here:
   return legendre_p_imp(l, m, x, static_cast<T>(pow(1 - x*x, T(abs(m))/2)), pol);
}

}

template <class T, class Policy>
inline typename tools::promote_args<T>::type
   legendre_p(int l, int m, T x, const Policy& pol)
{
   typedef typename tools::promote_args<T>::type result_type;
   typedef typename policies::evaluation<result_type, Policy>::type value_type;
   return policies::checked_narrowing_cast<result_type, Policy>(detail::legendre_p_imp(l, m, static_cast<value_type>(x), pol), "bost::math::legendre_p<%1%>(int, int, %1%)");
}

template <class T>
inline typename tools::promote_args<T>::type
   legendre_p(int l, int m, T x)
{
   return boost::math::legendre_p(l, m, x, policies::policy<>());
}

} // namespace math
} // namespace boost

#endif // BOOST_MATH_SPECIAL_LEGENDRE_HPP



