//  (C) Copyright John Maddock 2005.
//  Use, modification and distribution are subject to the
//  Boost Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_TR1_COMPLEX_HPP_INCLUDED
#  define BOOST_TR1_COMPLEX_HPP_INCLUDED
#  include <boost/tr1/detail/config.hpp>
#  include <complex>

#ifndef BOOST_HAS_TR1_COMPLEX_INVERSE_TRIG

#include <boost/math/complex.hpp>

namespace std {
namespace tr1 {

using boost::math::acos;
using boost::math::asin;
using boost::math::atan;
using boost::math::acosh;
using boost::math::asinh;
using boost::math::atanh;
using boost::math::fabs;

} }

#else

#  if defined(BOOST_HAS_INCLUDE_NEXT) && !defined(BOOST_TR1_DISABLE_INCLUDE_NEXT)
#     include_next BOOST_TR1_HEADER(complex)
#  else
#     include <boost/tr1/detail/config_all.hpp>
#     include BOOST_TR1_STD_HEADER(BOOST_TR1_PATH(complex))
#  endif

#endif

#ifndef BOOST_HAS_TR1_COMPLEX_OVERLOADS

#include <boost/tr1/detail/math_overloads.hpp>
#include <boost/assert.hpp>
#include <boost/detail/workaround.hpp>
#include <boost/config/no_tr1/cmath.hpp>

namespace std{ 

#ifdef BOOST_NO_STDC_NAMESPACE
   using :: atan2;
#endif

#ifndef BOOST_NO_FUNCTION_TEMPLATE_ORDERING
template <class T>
inline BOOST_TR1_MATH_RETURN(double) arg(const T& t)
{
   return ::std::atan2(0.0, static_cast<double>(t));
}
#else
inline double arg(const double& t)
{
   return ::std::atan2(0.0, t);
}
#endif
inline long double arg(const long double& t)
{
   return ::std::atan2(0.0L, static_cast<long double>(t));
}
inline float arg(const float& t)
{
   return ::std::atan2(0.0F, static_cast<float>(t));
}

#ifndef BOOST_NO_FUNCTION_TEMPLATE_ORDERING
template <class T>
inline BOOST_TR1_MATH_RETURN(double) norm(const T& t)
{
   double r = static_cast<double>(t);
   return r*r;
}
#else
inline double norm(const double& t)
{
   return t*t;
}
#endif
inline long double norm(const long double& t)
{
   long double l = t;
   return l*l;
}
inline float norm(const float& t)
{
   float f = t;
   return f*f;
}

#ifndef BOOST_NO_FUNCTION_TEMPLATE_ORDERING
template <class T>
inline BOOST_TR1_MATH_RETURN(std::complex<double>) conj(const T& t)
{
   return ::std::conj(std::complex<double>(static_cast<double>(t)));
}
#else
inline std::complex<double> conj(const double& t)
{
   return ::std::conj(std::complex<double>(t));
}
#endif
inline std::complex<long double> conj(const long double& t)
{
   return ::std::conj(std::complex<long double>(t));
}
inline std::complex<float> conj(const float& t)
{
   std::complex<float> ct(t);
   ct = ::std::conj(ct);
   return ct;
}

#if !BOOST_WORKAROUND(__BORLANDC__, <=0x570)
inline complex<double> polar(const char& rho, const char& theta = 0)
{ return ::std::polar(static_cast<double>(rho), static_cast<double>(theta)); }
inline complex<double> polar(const unsigned char& rho, const unsigned char& theta = 0)
{ return ::std::polar(static_cast<double>(rho), static_cast<double>(theta)); }
inline complex<double> polar(const signed char& rho, const signed char& theta = 0)
{ return ::std::polar(static_cast<double>(rho), static_cast<double>(theta)); }
inline complex<double> polar(const short& rho, const short& theta = 0)
{ return ::std::polar(static_cast<double>(rho), static_cast<double>(theta)); }
inline complex<double> polar(const unsigned short& rho, const unsigned short& theta = 0)
{ return ::std::polar(static_cast<double>(rho), static_cast<double>(theta)); }
inline complex<double> polar(const int& rho, const int& theta = 0)
{ return ::std::polar(static_cast<double>(rho), static_cast<double>(theta)); }
inline complex<double> polar(const unsigned int& rho, const unsigned int& theta = 0)
{ return ::std::polar(static_cast<double>(rho), static_cast<double>(theta)); }
inline complex<double> polar(const long& rho, const long& theta = 0)
{ return ::std::polar(static_cast<double>(rho), static_cast<double>(theta)); }
inline complex<double> polar(const unsigned long& rho, const unsigned long& theta = 0)
{ return ::std::polar(static_cast<double>(rho), static_cast<double>(theta)); }
#ifdef BOOST_HAS_LONG_LONG
inline complex<double> polar(const long long& rho, const long long& theta = 0)
{ return ::std::polar(static_cast<double>(rho), static_cast<double>(theta)); }
inline complex<double> polar(const unsigned long long& rho, const unsigned long long& theta = 0)
{ return ::std::polar(static_cast<double>(rho), static_cast<double>(theta)); }
#elif defined(BOOST_HAS_MS_INT64)
inline complex<double> polar(const __int64& rho, const __int64& theta = 0)
{ return ::std::polar(static_cast<double>(rho), static_cast<double>(theta)); }
inline complex<double> polar(const unsigned __int64& rho, const unsigned __int64& theta = 0)
{ return ::std::polar(static_cast<double>(rho), static_cast<double>(theta)); }
#endif

template<class T, class U> 
inline complex<typename boost::tr1_detail::promote_to_real<T, U>::type> 
   polar(const T& rho, const U& theta)
{
   typedef typename boost::tr1_detail::promote_to_real<T, U>::type real_type;
   return std::polar(static_cast<real_type>(rho), static_cast<real_type>(theta));
}
#endif

#ifndef BOOST_NO_FUNCTION_TEMPLATE_ORDERING
template <class T>
inline BOOST_TR1_MATH_RETURN(double) imag(const T& )
{
   return 0;
}
#else
inline double imag(const double& )
{
   return 0;
}
#endif
inline long double imag(const long double& )
{
   return 0;
}
inline float imag(const float& )
{
   return 0;
}

#ifndef BOOST_NO_FUNCTION_TEMPLATE_ORDERING
template <class T>
inline BOOST_TR1_MATH_RETURN(double) real(const T& t)
{
   return static_cast<double>(t);
}
#else
inline double real(const double& t)
{
   return t;
}
#endif
inline long double real(const long double& t)
{
   return t;
}
inline float real(const float& t)
{
   return t;
}

template<class T, class U>
inline complex<typename boost::tr1_detail::largest_real<T, U>::type>
   pow(const complex<T>& x, const complex<U>& y)
{
   typedef complex<typename boost::tr1_detail::largest_real<T, U>::type> result_type;
   typedef typename boost::mpl::if_<boost::is_same<result_type, complex<T> >, result_type const&, result_type>::type cast1_type;
   typedef typename boost::mpl::if_<boost::is_same<result_type, complex<U> >, result_type const&, result_type>::type cast2_type;
   cast1_type x1(x);
   cast2_type y1(y);
   return std::pow(x1, y1);
}
template<class T, class U> 
inline complex<typename boost::tr1_detail::promote_to_real<T, U>::type>
   pow (const complex<T>& x, const U& y)
{
   typedef typename boost::tr1_detail::promote_to_real<T, U>::type real_type;
   typedef complex<typename boost::tr1_detail::promote_to_real<T, U>::type> result_type;
   typedef typename boost::mpl::if_<boost::is_same<result_type, complex<T> >, result_type const&, result_type>::type cast1_type;
   real_type r = y;
   cast1_type x1(x);
   std::complex<real_type> y1(r);
   return std::pow(x1, y1);
}

template<class T, class U> 
inline complex<typename boost::tr1_detail::promote_to_real<T, U>::type>
   pow (const T& x, const complex<U>& y)
{
   typedef typename boost::tr1_detail::promote_to_real<T, U>::type real_type;
   typedef complex<typename boost::tr1_detail::promote_to_real<T, U>::type> result_type;
   typedef typename boost::mpl::if_<boost::is_same<result_type, complex<U> >, result_type const&, result_type>::type cast_type;
   real_type r = x;
   std::complex<real_type> x1(r);
   cast_type y1(y);
   return std::pow(x1, y1);
}

}

#endif

#endif

