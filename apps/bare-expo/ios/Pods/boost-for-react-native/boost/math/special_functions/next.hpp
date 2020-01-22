//  (C) Copyright John Maddock 2008.
//  Use, modification and distribution are subject to the
//  Boost Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_MATH_SPECIAL_NEXT_HPP
#define BOOST_MATH_SPECIAL_NEXT_HPP

#ifdef _MSC_VER
#pragma once
#endif

#include <boost/math/special_functions/math_fwd.hpp>
#include <boost/math/policies/error_handling.hpp>
#include <boost/math/special_functions/fpclassify.hpp>
#include <boost/math/special_functions/sign.hpp>
#include <boost/math/special_functions/trunc.hpp>

#include <float.h>

#if !defined(_CRAYC) && !defined(__CUDACC__) && (!defined(__GNUC__) || (__GNUC__ > 3) || ((__GNUC__ == 3) && (__GNUC_MINOR__ > 3)))
#if (defined(_M_IX86_FP) && (_M_IX86_FP >= 2)) || defined(__SSE2__)
#include "xmmintrin.h"
#define BOOST_MATH_CHECK_SSE2
#endif
#endif

namespace boost{ namespace math{

namespace detail{

template <class T>
inline T get_smallest_value(mpl::true_ const&)
{
   //
   // numeric_limits lies about denorms being present - particularly
   // when this can be turned on or off at runtime, as is the case
   // when using the SSE2 registers in DAZ or FTZ mode.
   //
   static const T m = std::numeric_limits<T>::denorm_min();
#ifdef BOOST_MATH_CHECK_SSE2
   return (_mm_getcsr() & (_MM_FLUSH_ZERO_ON | 0x40)) ? tools::min_value<T>() : m;;
#else
   return ((tools::min_value<T>() / 2) == 0) ? tools::min_value<T>() : m;
#endif
}

template <class T>
inline T get_smallest_value(mpl::false_ const&)
{
   return tools::min_value<T>();
}

template <class T>
inline T get_smallest_value()
{
#if defined(BOOST_MSVC) && (BOOST_MSVC <= 1310)
   return get_smallest_value<T>(mpl::bool_<std::numeric_limits<T>::is_specialized && (std::numeric_limits<T>::has_denorm == 1)>());
#else
   return get_smallest_value<T>(mpl::bool_<std::numeric_limits<T>::is_specialized && (std::numeric_limits<T>::has_denorm == std::denorm_present)>());
#endif
}

//
// Returns the smallest value that won't generate denorms when
// we calculate the value of the least-significant-bit:
//
template <class T>
T get_min_shift_value();

template <class T>
struct min_shift_initializer
{
   struct init
   {
      init()
      {
         do_init();
      }
      static void do_init()
      {
         get_min_shift_value<T>();
      }
      void force_instantiate()const{}
   };
   static const init initializer;
   static void force_instantiate()
   {
      initializer.force_instantiate();
   }
};

template <class T>
const typename min_shift_initializer<T>::init min_shift_initializer<T>::initializer;


template <class T>
inline T get_min_shift_value()
{
   BOOST_MATH_STD_USING
   static const T val = ldexp(tools::min_value<T>(), tools::digits<T>() + 1);
   min_shift_initializer<T>::force_instantiate();

   return val;
}

template <class T, class Policy>
T float_next_imp(const T& val, const Policy& pol)
{
   BOOST_MATH_STD_USING
   int expon;
   static const char* function = "float_next<%1%>(%1%)";

   int fpclass = (boost::math::fpclassify)(val);

   if((fpclass == (int)FP_NAN) || (fpclass == (int)FP_INFINITE))
   {
      if(val < 0)
         return -tools::max_value<T>();
      return policies::raise_domain_error<T>(
         function,
         "Argument must be finite, but got %1%", val, pol);
   }

   if(val >= tools::max_value<T>())
      return policies::raise_overflow_error<T>(function, 0, pol);

   if(val == 0)
      return detail::get_smallest_value<T>();

   if((fpclass != (int)FP_SUBNORMAL) && (fpclass != (int)FP_ZERO) && (fabs(val) < detail::get_min_shift_value<T>()) && (val != -tools::min_value<T>()))
   {
      //
      // Special case: if the value of the least significant bit is a denorm, and the result
      // would not be a denorm, then shift the input, increment, and shift back.
      // This avoids issues with the Intel SSE2 registers when the FTZ or DAZ flags are set.
      //
      return ldexp(float_next(T(ldexp(val, 2 * tools::digits<T>())), pol), -2 * tools::digits<T>());
   }

   if(-0.5f == frexp(val, &expon))
      --expon; // reduce exponent when val is a power of two, and negative.
   T diff = ldexp(T(1), expon - tools::digits<T>());
   if(diff == 0)
      diff = detail::get_smallest_value<T>();
   return val + diff;
}

}

template <class T, class Policy>
inline typename tools::promote_args<T>::type float_next(const T& val, const Policy& pol)
{
   typedef typename tools::promote_args<T>::type result_type;
   return detail::float_next_imp(static_cast<result_type>(val), pol);
}

#if 0 //def BOOST_MSVC
//
// We used to use ::_nextafter here, but doing so fails when using
// the SSE2 registers if the FTZ or DAZ flags are set, so use our own
// - albeit slower - code instead as at least that gives the correct answer.
//
template <class Policy>
inline double float_next(const double& val, const Policy& pol)
{
   static const char* function = "float_next<%1%>(%1%)";

   if(!(boost::math::isfinite)(val) && (val > 0))
      return policies::raise_domain_error<double>(
         function,
         "Argument must be finite, but got %1%", val, pol);

   if(val >= tools::max_value<double>())
      return policies::raise_overflow_error<double>(function, 0, pol);

   return ::_nextafter(val, tools::max_value<double>());
}
#endif

template <class T>
inline typename tools::promote_args<T>::type float_next(const T& val)
{
   return float_next(val, policies::policy<>());
}

namespace detail{

template <class T, class Policy>
T float_prior_imp(const T& val, const Policy& pol)
{
   BOOST_MATH_STD_USING
   int expon;
   static const char* function = "float_prior<%1%>(%1%)";

   int fpclass = (boost::math::fpclassify)(val);

   if((fpclass == (int)FP_NAN) || (fpclass == (int)FP_INFINITE))
   {
      if(val > 0)
         return tools::max_value<T>();
      return policies::raise_domain_error<T>(
         function,
         "Argument must be finite, but got %1%", val, pol);
   }

   if(val <= -tools::max_value<T>())
      return -policies::raise_overflow_error<T>(function, 0, pol);

   if(val == 0)
      return -detail::get_smallest_value<T>();

   if((fpclass != (int)FP_SUBNORMAL) && (fpclass != (int)FP_ZERO) && (fabs(val) < detail::get_min_shift_value<T>()) && (val != tools::min_value<T>()))
   {
      //
      // Special case: if the value of the least significant bit is a denorm, and the result
      // would not be a denorm, then shift the input, increment, and shift back.
      // This avoids issues with the Intel SSE2 registers when the FTZ or DAZ flags are set.
      //
      return ldexp(float_prior(T(ldexp(val, 2 * tools::digits<T>())), pol), -2 * tools::digits<T>());
   }

   T remain = frexp(val, &expon);
   if(remain == 0.5)
      --expon; // when val is a power of two we must reduce the exponent
   T diff = ldexp(T(1), expon - tools::digits<T>());
   if(diff == 0)
      diff = detail::get_smallest_value<T>();
   return val - diff;
}

}

template <class T, class Policy>
inline typename tools::promote_args<T>::type float_prior(const T& val, const Policy& pol)
{
   typedef typename tools::promote_args<T>::type result_type;
   return detail::float_prior_imp(static_cast<result_type>(val), pol);
}

#if 0 //def BOOST_MSVC
//
// We used to use ::_nextafter here, but doing so fails when using
// the SSE2 registers if the FTZ or DAZ flags are set, so use our own
// - albeit slower - code instead as at least that gives the correct answer.
//
template <class Policy>
inline double float_prior(const double& val, const Policy& pol)
{
   static const char* function = "float_prior<%1%>(%1%)";

   if(!(boost::math::isfinite)(val) && (val < 0))
      return policies::raise_domain_error<double>(
         function,
         "Argument must be finite, but got %1%", val, pol);

   if(val <= -tools::max_value<double>())
      return -policies::raise_overflow_error<double>(function, 0, pol);

   return ::_nextafter(val, -tools::max_value<double>());
}
#endif

template <class T>
inline typename tools::promote_args<T>::type float_prior(const T& val)
{
   return float_prior(val, policies::policy<>());
}

template <class T, class U, class Policy>
inline typename tools::promote_args<T, U>::type nextafter(const T& val, const U& direction, const Policy& pol)
{
   typedef typename tools::promote_args<T, U>::type result_type;
   return val < direction ? boost::math::float_next<result_type>(val, pol) : val == direction ? val : boost::math::float_prior<result_type>(val, pol);
}

template <class T, class U>
inline typename tools::promote_args<T, U>::type nextafter(const T& val, const U& direction)
{
   return nextafter(val, direction, policies::policy<>());
}

namespace detail{

template <class T, class Policy>
T float_distance_imp(const T& a, const T& b, const Policy& pol)
{
   BOOST_MATH_STD_USING
   //
   // Error handling:
   //
   static const char* function = "float_distance<%1%>(%1%, %1%)";
   if(!(boost::math::isfinite)(a))
      return policies::raise_domain_error<T>(
         function,
         "Argument a must be finite, but got %1%", a, pol);
   if(!(boost::math::isfinite)(b))
      return policies::raise_domain_error<T>(
         function,
         "Argument b must be finite, but got %1%", b, pol);
   //
   // Special cases:
   //
   if(a > b)
      return -float_distance(b, a, pol);
   if(a == b)
      return 0;
   if(a == 0)
      return 1 + fabs(float_distance(static_cast<T>((b < 0) ? T(-detail::get_smallest_value<T>()) : detail::get_smallest_value<T>()), b, pol));
   if(b == 0)
      return 1 + fabs(float_distance(static_cast<T>((a < 0) ? T(-detail::get_smallest_value<T>()) : detail::get_smallest_value<T>()), a, pol));
   if(boost::math::sign(a) != boost::math::sign(b))
      return 2 + fabs(float_distance(static_cast<T>((b < 0) ? T(-detail::get_smallest_value<T>()) : detail::get_smallest_value<T>()), b, pol))
         + fabs(float_distance(static_cast<T>((a < 0) ? T(-detail::get_smallest_value<T>()) : detail::get_smallest_value<T>()), a, pol));
   //
   // By the time we get here, both a and b must have the same sign, we want
   // b > a and both postive for the following logic:
   //
   if(a < 0)
      return float_distance(static_cast<T>(-b), static_cast<T>(-a), pol);

   BOOST_ASSERT(a >= 0);
   BOOST_ASSERT(b >= a);

   int expon;
   //
   // Note that if a is a denorm then the usual formula fails
   // because we actually have fewer than tools::digits<T>()
   // significant bits in the representation:
   //
   frexp(((boost::math::fpclassify)(a) == (int)FP_SUBNORMAL) ? tools::min_value<T>() : a, &expon);
   T upper = ldexp(T(1), expon);
   T result = 0;
   expon = tools::digits<T>() - expon;
   //
   // If b is greater than upper, then we *must* split the calculation
   // as the size of the ULP changes with each order of magnitude change:
   //
   if(b > upper)
   {
      result = float_distance(upper, b);
   }
   //
   // Use compensated double-double addition to avoid rounding
   // errors in the subtraction:
   //
   T mb, x, y, z;
   if(((boost::math::fpclassify)(a) == (int)FP_SUBNORMAL) || (b - a < tools::min_value<T>()))
   {
      //
      // Special case - either one end of the range is a denormal, or else the difference is.
      // The regular code will fail if we're using the SSE2 registers on Intel and either
      // the FTZ or DAZ flags are set.
      //
      T a2 = ldexp(a, tools::digits<T>());
      T b2 = ldexp(b, tools::digits<T>());
      mb = -(std::min)(T(ldexp(upper, tools::digits<T>())), b2);
      x = a2 + mb;
      z = x - a2;
      y = (a2 - (x - z)) + (mb - z);

      expon -= tools::digits<T>();
   }
   else
   {
      mb = -(std::min)(upper, b);
      x = a + mb;
      z = x - a;
      y = (a - (x - z)) + (mb - z);
   }
   if(x < 0)
   {
      x = -x;
      y = -y;
   }
   result += ldexp(x, expon) + ldexp(y, expon);
   //
   // Result must be an integer:
   //
   BOOST_ASSERT(result == floor(result));
   return result;
}

}

template <class T, class U, class Policy>
inline typename tools::promote_args<T, U>::type float_distance(const T& a, const U& b, const Policy& pol)
{
   typedef typename tools::promote_args<T, U>::type result_type;
   return detail::float_distance_imp(static_cast<result_type>(a), static_cast<result_type>(b), pol);
}

template <class T, class U>
typename tools::promote_args<T, U>::type float_distance(const T& a, const U& b)
{
   return boost::math::float_distance(a, b, policies::policy<>());
}

namespace detail{

template <class T, class Policy>
T float_advance_imp(T val, int distance, const Policy& pol)
{
   BOOST_MATH_STD_USING
   //
   // Error handling:
   //
   static const char* function = "float_advance<%1%>(%1%, int)";

   int fpclass = (boost::math::fpclassify)(val);

   if((fpclass == (int)FP_NAN) || (fpclass == (int)FP_INFINITE))
      return policies::raise_domain_error<T>(
         function,
         "Argument val must be finite, but got %1%", val, pol);

   if(val < 0)
      return -float_advance(-val, -distance, pol);
   if(distance == 0)
      return val;
   if(distance == 1)
      return float_next(val, pol);
   if(distance == -1)
      return float_prior(val, pol);

   if(fabs(val) < detail::get_min_shift_value<T>())
   {
      //
      // Special case: if the value of the least significant bit is a denorm,
      // implement in terms of float_next/float_prior.
      // This avoids issues with the Intel SSE2 registers when the FTZ or DAZ flags are set.
      //
      if(distance > 0)
      {
         do{ val = float_next(val, pol); } while(--distance);
      }
      else
      {
         do{ val = float_prior(val, pol); } while(++distance);
      }
      return val;
   }

   int expon;
   frexp(val, &expon);
   T limit = ldexp((distance < 0 ? T(0.5f) : T(1)), expon);
   if(val <= tools::min_value<T>())
   {
      limit = sign(T(distance)) * tools::min_value<T>();
   }
   T limit_distance = float_distance(val, limit);
   while(fabs(limit_distance) < abs(distance))
   {
      distance -= itrunc(limit_distance);
      val = limit;
      if(distance < 0)
      {
         limit /= 2;
         expon--;
      }
      else
      {
         limit *= 2;
         expon++;
      }
      limit_distance = float_distance(val, limit);
      if(distance && (limit_distance == 0))
      {
         return policies::raise_evaluation_error<T>(function, "Internal logic failed while trying to increment floating point value %1%: most likely your FPU is in non-IEEE conforming mode.", val, pol);
      }
   }
   if((0.5f == frexp(val, &expon)) && (distance < 0))
      --expon;
   T diff = 0;
   if(val != 0)
      diff = distance * ldexp(T(1), expon - tools::digits<T>());
   if(diff == 0)
      diff = distance * detail::get_smallest_value<T>();
   return val += diff;
}

}

template <class T, class Policy>
inline typename tools::promote_args<T>::type float_advance(T val, int distance, const Policy& pol)
{
   typedef typename tools::promote_args<T>::type result_type;
   return detail::float_advance_imp(static_cast<result_type>(val), distance, pol);
}

template <class T>
inline typename tools::promote_args<T>::type float_advance(const T& val, int distance)
{
   return boost::math::float_advance(val, distance, policies::policy<>());
}

}} // namespaces

#endif // BOOST_MATH_SPECIAL_NEXT_HPP

