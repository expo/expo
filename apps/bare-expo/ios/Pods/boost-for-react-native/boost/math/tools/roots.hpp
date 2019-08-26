//  (C) Copyright John Maddock 2006.
//  Use, modification and distribution are subject to the
//  Boost Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_MATH_TOOLS_NEWTON_SOLVER_HPP
#define BOOST_MATH_TOOLS_NEWTON_SOLVER_HPP

#ifdef _MSC_VER
#pragma once
#endif

#include <utility>
#include <boost/config/no_tr1/cmath.hpp>
#include <stdexcept>

#include <boost/math/tools/config.hpp>
#include <boost/cstdint.hpp>
#include <boost/assert.hpp>
#include <boost/throw_exception.hpp>

#ifdef BOOST_MSVC
#pragma warning(push)
#pragma warning(disable: 4512)
#endif
#include <boost/math/tools/tuple.hpp>
#ifdef BOOST_MSVC
#pragma warning(pop)
#endif

#include <boost/math/special_functions/sign.hpp>
#include <boost/math/tools/toms748_solve.hpp>
#include <boost/math/policies/error_handling.hpp>

namespace boost{ namespace math{ namespace tools{

namespace detail{

namespace dummy{

   template<int n, class T>
   typename T::value_type get(const T&) BOOST_MATH_NOEXCEPT(T);
}

template <class Tuple, class T>
void unpack_tuple(const Tuple& t, T& a, T& b) BOOST_MATH_NOEXCEPT(T)
{
   using dummy::get;
   // Use ADL to find the right overload for get:
   a = get<0>(t);
   b = get<1>(t);
}
template <class Tuple, class T>
void unpack_tuple(const Tuple& t, T& a, T& b, T& c) BOOST_MATH_NOEXCEPT(T)
{
   using dummy::get;
   // Use ADL to find the right overload for get:
   a = get<0>(t);
   b = get<1>(t);
   c = get<2>(t);
}

template <class Tuple, class T>
inline void unpack_0(const Tuple& t, T& val) BOOST_MATH_NOEXCEPT(T)
{
   using dummy::get;
   // Rely on ADL to find the correct overload of get:
   val = get<0>(t); 
}

template <class T, class U, class V>
inline void unpack_tuple(const std::pair<T, U>& p, V& a, V& b) BOOST_MATH_NOEXCEPT(T)
{
   a = p.first;
   b = p.second;
}
template <class T, class U, class V>
inline void unpack_0(const std::pair<T, U>& p, V& a) BOOST_MATH_NOEXCEPT(T)
{
   a = p.first;
}

template <class F, class T>
void handle_zero_derivative(F f,
                            T& last_f0,
                            const T& f0,
                            T& delta,
                            T& result,
                            T& guess,
                            const T& min,
                            const T& max) BOOST_NOEXCEPT_IF(BOOST_MATH_IS_FLOAT(T) && noexcept(std::declval<F>()(std::declval<T>())))
{
   if(last_f0 == 0)
   {
      // this must be the first iteration, pretend that we had a
      // previous one at either min or max:
      if(result == min)
      {
         guess = max;
      }
      else
      {
         guess = min;
      }
      unpack_0(f(guess), last_f0);
      delta = guess - result;
   }
   if(sign(last_f0) * sign(f0) < 0)
   {
      // we've crossed over so move in opposite direction to last step:
      if(delta < 0)
      {
         delta = (result - min) / 2;
      }
      else
      {
         delta = (result - max) / 2;
      }
   }
   else
   {
      // move in same direction as last step:
      if(delta < 0)
      {
         delta = (result - max) / 2;
      }
      else
      {
         delta = (result - min) / 2;
      }
   }
}

} // namespace

template <class F, class T, class Tol, class Policy>
std::pair<T, T> bisect(F f, T min, T max, Tol tol, boost::uintmax_t& max_iter, const Policy& pol) BOOST_NOEXCEPT_IF(policies::is_noexcept_error_policy<Policy>::value && BOOST_MATH_IS_FLOAT(T) && noexcept(std::declval<F>()(std::declval<T>())))
{
   T fmin = f(min);
   T fmax = f(max);
   if(fmin == 0)
   {
      max_iter = 2;
      return std::make_pair(min, min);
   }
   if(fmax == 0)
   {
      max_iter = 2;
      return std::make_pair(max, max);
   }

   //
   // Error checking:
   //
   static const char* function = "boost::math::tools::bisect<%1%>";
   if(min >= max)
   {
      return boost::math::detail::pair_from_single(policies::raise_evaluation_error(function,
         "Arguments in wrong order in boost::math::tools::bisect (first arg=%1%)", min, pol));
   }
   if(fmin * fmax >= 0)
   {
      return boost::math::detail::pair_from_single(policies::raise_evaluation_error(function,
         "No change of sign in boost::math::tools::bisect, either there is no root to find, or there are multiple roots in the interval (f(min) = %1%).", fmin, pol));
   }

   //
   // Three function invocations so far:
   //
   boost::uintmax_t count = max_iter;
   if(count < 3)
      count = 0;
   else
      count -= 3;

   while(count && (0 == tol(min, max)))
   {
      T mid = (min + max) / 2;
      T fmid = f(mid);
      if((mid == max) || (mid == min))
         break;
      if(fmid == 0)
      {
         min = max = mid;
         break;
      }
      else if(sign(fmid) * sign(fmin) < 0)
      {
         max = mid;
         fmax = fmid;
      }
      else
      {
         min = mid;
         fmin = fmid;
      }
      --count;
   }

   max_iter -= count;

#ifdef BOOST_MATH_INSTRUMENT
   std::cout << "Bisection iteration, final count = " << max_iter << std::endl;

   static boost::uintmax_t max_count = 0;
   if(max_iter > max_count)
   {
      max_count = max_iter;
      std::cout << "Maximum iterations: " << max_iter << std::endl;
   }
#endif

   return std::make_pair(min, max);
}

template <class F, class T, class Tol>
inline std::pair<T, T> bisect(F f, T min, T max, Tol tol, boost::uintmax_t& max_iter)  BOOST_NOEXCEPT_IF(policies::is_noexcept_error_policy<policies::policy<> >::value && BOOST_MATH_IS_FLOAT(T) && noexcept(std::declval<F>()(std::declval<T>())))
{
   return bisect(f, min, max, tol, max_iter, policies::policy<>());
}

template <class F, class T, class Tol>
inline std::pair<T, T> bisect(F f, T min, T max, Tol tol) BOOST_NOEXCEPT_IF(policies::is_noexcept_error_policy<policies::policy<> >::value && BOOST_MATH_IS_FLOAT(T) && noexcept(std::declval<F>()(std::declval<T>())))
{
   boost::uintmax_t m = (std::numeric_limits<boost::uintmax_t>::max)();
   return bisect(f, min, max, tol, m, policies::policy<>());
}


template <class F, class T>
T newton_raphson_iterate(F f, T guess, T min, T max, int digits, boost::uintmax_t& max_iter) BOOST_NOEXCEPT_IF(BOOST_MATH_IS_FLOAT(T) && noexcept(std::declval<F>()(std::declval<T>())))
{
   BOOST_MATH_STD_USING

   T f0(0), f1, last_f0(0);
   T result = guess;

   T factor = static_cast<T>(ldexp(1.0, 1 - digits));
   T delta = tools::max_value<T>();
   T delta1 = tools::max_value<T>();
   T delta2 = tools::max_value<T>();

   boost::uintmax_t count(max_iter);

   do{
      last_f0 = f0;
      delta2 = delta1;
      delta1 = delta;
      detail::unpack_tuple(f(result), f0, f1);
      --count;
      if(0 == f0)
         break;
      if(f1 == 0)
      {
         // Oops zero derivative!!!
#ifdef BOOST_MATH_INSTRUMENT
         std::cout << "Newton iteration, zero derivative found" << std::endl;
#endif
         detail::handle_zero_derivative(f, last_f0, f0, delta, result, guess, min, max);
      }
      else
      {
         delta = f0 / f1;
      }
#ifdef BOOST_MATH_INSTRUMENT
      std::cout << "Newton iteration, delta = " << delta << std::endl;
#endif
      if(fabs(delta * 2) > fabs(delta2))
      {
         // last two steps haven't converged, try bisection:
         delta = (delta > 0) ? (result - min) / 2 : (result - max) / 2;
      }
      guess = result;
      result -= delta;
      if(result <= min)
      {
         delta = 0.5F * (guess - min);
         result = guess - delta;
         if((result == min) || (result == max))
            break;
      }
      else if(result >= max)
      {
         delta = 0.5F * (guess - max);
         result = guess - delta;
         if((result == min) || (result == max))
            break;
      }
      // update brackets:
      if(delta > 0)
         max = guess;
      else
         min = guess;
   }while(count && (fabs(result * factor) < fabs(delta)));

   max_iter -= count;

#ifdef BOOST_MATH_INSTRUMENT
   std::cout << "Newton Raphson iteration, final count = " << max_iter << std::endl;

   static boost::uintmax_t max_count = 0;
   if(max_iter > max_count)
   {
      max_count = max_iter;
      std::cout << "Maximum iterations: " << max_iter << std::endl;
   }
#endif

   return result;
}

template <class F, class T>
inline T newton_raphson_iterate(F f, T guess, T min, T max, int digits) BOOST_NOEXCEPT_IF(BOOST_MATH_IS_FLOAT(T) && noexcept(std::declval<F>()(std::declval<T>())))
{
   boost::uintmax_t m = (std::numeric_limits<boost::uintmax_t>::max)();
   return newton_raphson_iterate(f, guess, min, max, digits, m);
}

namespace detail{

   struct halley_step
   {
      template <class T>
      static T step(const T& /*x*/, const T& f0, const T& f1, const T& f2) BOOST_NOEXCEPT_IF(BOOST_MATH_IS_FLOAT(T))
      {
         using std::fabs;
         T denom = 2 * f0;
         T num = 2 * f1 - f0 * (f2 / f1);
         T delta;

         BOOST_MATH_INSTRUMENT_VARIABLE(denom);
         BOOST_MATH_INSTRUMENT_VARIABLE(num);

         if((fabs(num) < 1) && (fabs(denom) >= fabs(num) * tools::max_value<T>()))
         {
            // possible overflow, use Newton step:
            delta = f0 / f1;
         }
         else
            delta = denom / num;
         return delta;
      }
   };

   template <class Stepper, class F, class T>
   T second_order_root_finder(F f, T guess, T min, T max, int digits, boost::uintmax_t& max_iter) BOOST_NOEXCEPT_IF(BOOST_MATH_IS_FLOAT(T) && noexcept(std::declval<F>()(std::declval<T>())))
   {
      BOOST_MATH_STD_USING

         T f0(0), f1, f2;
      T result = guess;

      T factor = static_cast<T>(ldexp(1.0, 1 - digits));
      T delta = (std::max)(T(10000000 * guess), T(10000000));  // arbitarily large delta
      T last_f0 = 0;
      T delta1 = delta;
      T delta2 = delta;

      bool out_of_bounds_sentry = false;

#ifdef BOOST_MATH_INSTRUMENT
      std::cout << "Second order root iteration, limit = " << factor << std::endl;
#endif

      boost::uintmax_t count(max_iter);

      do{
         last_f0 = f0;
         delta2 = delta1;
         delta1 = delta;
         detail::unpack_tuple(f(result), f0, f1, f2);
         --count;

         BOOST_MATH_INSTRUMENT_VARIABLE(f0);
         BOOST_MATH_INSTRUMENT_VARIABLE(f1);
         BOOST_MATH_INSTRUMENT_VARIABLE(f2);

         if(0 == f0)
            break;
         if(f1 == 0)
         {
            // Oops zero derivative!!!
#ifdef BOOST_MATH_INSTRUMENT
            std::cout << "Second order root iteration, zero derivative found" << std::endl;
#endif
            detail::handle_zero_derivative(f, last_f0, f0, delta, result, guess, min, max);
         }
         else
         {
            if(f2 != 0)
            {
               delta = Stepper::step(result, f0, f1, f2);
               if(delta * f1 / f0 < 0)
               {
                  // Oh dear, we have a problem as Newton and Halley steps
                  // disagree about which way we should move.  Probably
                  // there is cancelation error in the calculation of the
                  // Halley step, or else the derivatives are so small
                  // that their values are basically trash.  We will move
                  // in the direction indicated by a Newton step, but
                  // by no more than twice the current guess value, otherwise
                  // we can jump way out of bounds if we're not careful.
                  // See https://svn.boost.org/trac/boost/ticket/8314.
                  delta = f0 / f1;
                  if(fabs(delta) > 2 * fabs(guess))
                     delta = (delta < 0 ? -1 : 1) * 2 * fabs(guess);
               }
            }
            else
               delta = f0 / f1;
         }
#ifdef BOOST_MATH_INSTRUMENT
         std::cout << "Second order root iteration, delta = " << delta << std::endl;
#endif
         T convergence = fabs(delta / delta2);
         if((convergence > 0.8) && (convergence < 2))
         {
            // last two steps haven't converged, try bisection:
            delta = (delta > 0) ? (result - min) / 2 : (result - max) / 2;
            if(fabs(delta) > result)
               delta = sign(delta) * result; // protect against huge jumps!
            // reset delta2 so that this branch will *not* be taken on the
            // next iteration:
            delta2 = delta * 3;
            BOOST_MATH_INSTRUMENT_VARIABLE(delta);
         }
         guess = result;
         result -= delta;
         BOOST_MATH_INSTRUMENT_VARIABLE(result);

         // check for out of bounds step:
         if(result < min)
         {
            T diff = ((fabs(min) < 1) && (fabs(result) > 1) && (tools::max_value<T>() / fabs(result) < fabs(min))) ? T(1000) : T(result / min);
            if(fabs(diff) < 1)
               diff = 1 / diff;
            if(!out_of_bounds_sentry && (diff > 0) && (diff < 3))
            {
               // Only a small out of bounds step, lets assume that the result
               // is probably approximately at min:
               delta = 0.99f * (guess - min);
               result = guess - delta;
               out_of_bounds_sentry = true; // only take this branch once!
            }
            else
            {
               delta = (guess - min) / 2;
               result = guess - delta;
               if((result == min) || (result == max))
                  break;
            }
         }
         else if(result > max)
         {
            T diff = ((fabs(max) < 1) && (fabs(result) > 1) && (tools::max_value<T>() / fabs(result) < fabs(max))) ? T(1000) : T(result / max);
            if(fabs(diff) < 1)
               diff = 1 / diff;
            if(!out_of_bounds_sentry && (diff > 0) && (diff < 3))
            {
               // Only a small out of bounds step, lets assume that the result
               // is probably approximately at min:
               delta = 0.99f * (guess - max);
               result = guess - delta;
               out_of_bounds_sentry = true; // only take this branch once!
            }
            else
            {
               delta = (guess - max) / 2;
               result = guess - delta;
               if((result == min) || (result == max))
                  break;
            }
         }
         // update brackets:
         if(delta > 0)
            max = guess;
         else
            min = guess;
      } while(count && (fabs(result * factor) < fabs(delta)));

      max_iter -= count;

#ifdef BOOST_MATH_INSTRUMENT
      std::cout << "Second order root iteration, final count = " << max_iter << std::endl;
#endif

      return result;
   }

}

template <class F, class T>
T halley_iterate(F f, T guess, T min, T max, int digits, boost::uintmax_t& max_iter) BOOST_NOEXCEPT_IF(BOOST_MATH_IS_FLOAT(T) && noexcept(std::declval<F>()(std::declval<T>())))
{
   return detail::second_order_root_finder<detail::halley_step>(f, guess, min, max, digits, max_iter);
}

template <class F, class T>
inline T halley_iterate(F f, T guess, T min, T max, int digits) BOOST_NOEXCEPT_IF(BOOST_MATH_IS_FLOAT(T) && noexcept(std::declval<F>()(std::declval<T>())))
{
   boost::uintmax_t m = (std::numeric_limits<boost::uintmax_t>::max)();
   return halley_iterate(f, guess, min, max, digits, m);
}

namespace detail{

   struct schroder_stepper
   {
      template <class T>
      static T step(const T& x, const T& f0, const T& f1, const T& f2) BOOST_NOEXCEPT_IF(BOOST_MATH_IS_FLOAT(T))
      {
         T ratio = f0 / f1;
         T delta;
         if(ratio / x < 0.1)
         {
            delta = ratio + (f2 / (2 * f1)) * ratio * ratio;
            // check second derivative doesn't over compensate:
            if(delta * ratio < 0)
               delta = ratio;
         }
         else
            delta = ratio;  // fall back to Newton iteration.
         return delta;
      }
   };

}

template <class F, class T>
T schroder_iterate(F f, T guess, T min, T max, int digits, boost::uintmax_t& max_iter) BOOST_NOEXCEPT_IF(BOOST_MATH_IS_FLOAT(T) && noexcept(std::declval<F>()(std::declval<T>())))
{
   return detail::second_order_root_finder<detail::schroder_stepper>(f, guess, min, max, digits, max_iter);
}

template <class F, class T>
inline T schroder_iterate(F f, T guess, T min, T max, int digits) BOOST_NOEXCEPT_IF(BOOST_MATH_IS_FLOAT(T) && noexcept(std::declval<F>()(std::declval<T>())))
{
   boost::uintmax_t m = (std::numeric_limits<boost::uintmax_t>::max)();
   return schroder_iterate(f, guess, min, max, digits, m);
}
//
// These two are the old spelling of this function, retained for backwards compatibity just in case:
//
template <class F, class T>
T schroeder_iterate(F f, T guess, T min, T max, int digits, boost::uintmax_t& max_iter) BOOST_NOEXCEPT_IF(BOOST_MATH_IS_FLOAT(T) && noexcept(std::declval<F>()(std::declval<T>())))
{
   return detail::second_order_root_finder<detail::schroder_stepper>(f, guess, min, max, digits, max_iter);
}

template <class F, class T>
inline T schroeder_iterate(F f, T guess, T min, T max, int digits) BOOST_NOEXCEPT_IF(BOOST_MATH_IS_FLOAT(T) && noexcept(std::declval<F>()(std::declval<T>())))
{
   boost::uintmax_t m = (std::numeric_limits<boost::uintmax_t>::max)();
   return schroder_iterate(f, guess, min, max, digits, m);
}


} // namespace tools
} // namespace math
} // namespace boost

#endif // BOOST_MATH_TOOLS_NEWTON_SOLVER_HPP

