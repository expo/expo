//  Copyright John Maddock 2006.
//  Use, modification and distribution are subject to the
//  Boost Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

// Test real concept.

// real_concept is an archetype for User defined Real types.

// This file defines the features, constructors, operators, functions...
// that are essential to use mathematical and statistical functions.
// The template typename "RealType" is used where this type
// (as well as the normal built-in types, float, double & long double)
// can be used.
// That this is the minimum set is confirmed by use as a type
// in tests of all functions & distributions, for example:
//   test_spots(0.F); & test_spots(0.);  for float and double, but also
//   test_spots(boost::math::concepts::real_concept(0.));
// NTL quad_float type is an example of a type meeting the requirements,
// but note minor additions are needed - see ntl.diff and documentation
// "Using With NTL - a High-Precision Floating-Point Library".

#ifndef BOOST_MATH_REAL_CONCEPT_HPP
#define BOOST_MATH_REAL_CONCEPT_HPP

#include <boost/config.hpp>
#include <boost/limits.hpp>
#include <boost/math/special_functions/round.hpp>
#include <boost/math/special_functions/trunc.hpp>
#include <boost/math/special_functions/modf.hpp>
#include <boost/math/tools/big_constant.hpp>
#include <boost/math/tools/precision.hpp>
#include <boost/math/policies/policy.hpp>
#if defined(__SGI_STL_PORT)
#  include <boost/math/tools/real_cast.hpp>
#endif
#include <ostream>
#include <istream>
#include <boost/config/no_tr1/cmath.hpp>
#include <math.h> // fmodl

#if defined(__SGI_STL_PORT) || defined(_RWSTD_VER) || defined(__LIBCOMO__)
#  include <cstdio>
#endif

namespace boost{ namespace math{

namespace concepts
{

#ifdef BOOST_MATH_NO_LONG_DOUBLE_MATH_FUNCTIONS
   typedef double real_concept_base_type;
#else
   typedef long double real_concept_base_type;
#endif

class real_concept
{
public:
   // Constructors:
   real_concept() : m_value(0){}
   real_concept(char c) : m_value(c){}
#ifndef BOOST_NO_INTRINSIC_WCHAR_T
   real_concept(wchar_t c) : m_value(c){}
#endif
   real_concept(unsigned char c) : m_value(c){}
   real_concept(signed char c) : m_value(c){}
   real_concept(unsigned short c) : m_value(c){}
   real_concept(short c) : m_value(c){}
   real_concept(unsigned int c) : m_value(c){}
   real_concept(int c) : m_value(c){}
   real_concept(unsigned long c) : m_value(c){}
   real_concept(long c) : m_value(c){}
#if defined(__DECCXX) || defined(__SUNPRO_CC)
   real_concept(unsigned long long c) : m_value(static_cast<real_concept_base_type>(c)){}
   real_concept(long long c) : m_value(static_cast<real_concept_base_type>(c)){}
#elif defined(BOOST_HAS_LONG_LONG)
   real_concept(boost::ulong_long_type c) : m_value(static_cast<real_concept_base_type>(c)){}
   real_concept(boost::long_long_type c) : m_value(static_cast<real_concept_base_type>(c)){}
#elif defined(BOOST_HAS_MS_INT64)
   real_concept(unsigned __int64 c) : m_value(static_cast<real_concept_base_type>(c)){}
   real_concept(__int64 c) : m_value(static_cast<real_concept_base_type>(c)){}
#endif
   real_concept(float c) : m_value(c){}
   real_concept(double c) : m_value(c){}
   real_concept(long double c) : m_value(c){}
#ifdef BOOST_MATH_USE_FLOAT128
   real_concept(BOOST_MATH_FLOAT128_TYPE c) : m_value(c){}
#endif

   // Assignment:
   real_concept& operator=(char c) { m_value = c; return *this; }
   real_concept& operator=(unsigned char c) { m_value = c; return *this; }
   real_concept& operator=(signed char c) { m_value = c; return *this; }
#ifndef BOOST_NO_INTRINSIC_WCHAR_T
   real_concept& operator=(wchar_t c) { m_value = c; return *this; }
#endif
   real_concept& operator=(short c) { m_value = c; return *this; }
   real_concept& operator=(unsigned short c) { m_value = c; return *this; }
   real_concept& operator=(int c) { m_value = c; return *this; }
   real_concept& operator=(unsigned int c) { m_value = c; return *this; }
   real_concept& operator=(long c) { m_value = c; return *this; }
   real_concept& operator=(unsigned long c) { m_value = c; return *this; }
#ifdef BOOST_HAS_LONG_LONG
   real_concept& operator=(boost::long_long_type c) { m_value = static_cast<real_concept_base_type>(c); return *this; }
   real_concept& operator=(boost::ulong_long_type c) { m_value = static_cast<real_concept_base_type>(c); return *this; }
#endif
   real_concept& operator=(float c) { m_value = c; return *this; }
   real_concept& operator=(double c) { m_value = c; return *this; }
   real_concept& operator=(long double c) { m_value = c; return *this; }

   // Access:
   real_concept_base_type value()const{ return m_value; }

   // Member arithmetic:
   real_concept& operator+=(const real_concept& other)
   { m_value += other.value(); return *this; }
   real_concept& operator-=(const real_concept& other)
   { m_value -= other.value(); return *this; }
   real_concept& operator*=(const real_concept& other)
   { m_value *= other.value(); return *this; }
   real_concept& operator/=(const real_concept& other)
   { m_value /= other.value(); return *this; }
   real_concept operator-()const
   { return -m_value; }
   real_concept const& operator+()const
   { return *this; }
   real_concept& operator++()
   { ++m_value;  return *this; }
   real_concept& operator--()
   { --m_value;  return *this; }

private:
   real_concept_base_type m_value;
};

// Non-member arithmetic:
inline real_concept operator+(const real_concept& a, const real_concept& b)
{
   real_concept result(a);
   result += b;
   return result;
}
inline real_concept operator-(const real_concept& a, const real_concept& b)
{
   real_concept result(a);
   result -= b;
   return result;
}
inline real_concept operator*(const real_concept& a, const real_concept& b)
{
   real_concept result(a);
   result *= b;
   return result;
}
inline real_concept operator/(const real_concept& a, const real_concept& b)
{
   real_concept result(a);
   result /= b;
   return result;
}

// Comparison:
inline bool operator == (const real_concept& a, const real_concept& b)
{ return a.value() == b.value(); }
inline bool operator != (const real_concept& a, const real_concept& b)
{ return a.value() != b.value();}
inline bool operator < (const real_concept& a, const real_concept& b)
{ return a.value() < b.value(); }
inline bool operator <= (const real_concept& a, const real_concept& b)
{ return a.value() <= b.value(); }
inline bool operator > (const real_concept& a, const real_concept& b)
{ return a.value() > b.value(); }
inline bool operator >= (const real_concept& a, const real_concept& b)
{ return a.value() >= b.value(); }

// Non-member functions:
inline real_concept acos(real_concept a)
{ return std::acos(a.value()); }
inline real_concept cos(real_concept a)
{ return std::cos(a.value()); }
inline real_concept asin(real_concept a)
{ return std::asin(a.value()); }
inline real_concept atan(real_concept a)
{ return std::atan(a.value()); }
inline real_concept atan2(real_concept a, real_concept b)
{ return std::atan2(a.value(), b.value()); }
inline real_concept ceil(real_concept a)
{ return std::ceil(a.value()); }
#ifndef BOOST_MATH_NO_LONG_DOUBLE_MATH_FUNCTIONS
// I've seen std::fmod(long double) crash on some platforms
// so use fmodl instead:
#ifdef _WIN32_WCE
//
// Ugly workaround for macro fmodl:
//
inline long double call_fmodl(long double a, long double b)
{  return fmodl(a, b); }
inline real_concept fmod(real_concept a, real_concept b)
{ return call_fmodl(a.value(), b.value()); }
#else
inline real_concept fmod(real_concept a, real_concept b)
{ return fmodl(a.value(), b.value()); }
#endif
#endif
inline real_concept cosh(real_concept a)
{ return std::cosh(a.value()); }
inline real_concept exp(real_concept a)
{ return std::exp(a.value()); }
inline real_concept fabs(real_concept a)
{ return std::fabs(a.value()); }
inline real_concept abs(real_concept a)
{ return std::abs(a.value()); }
inline real_concept floor(real_concept a)
{ return std::floor(a.value()); }
inline real_concept modf(real_concept a, real_concept* ipart)
{
#ifdef __MINGW32__
   real_concept_base_type ip;
   real_concept_base_type result = boost::math::modf(a.value(), &ip);
   *ipart = ip;
   return result;
#else
   real_concept_base_type ip;
   real_concept_base_type result = std::modf(a.value(), &ip);
   *ipart = ip;
   return result;
#endif
}
inline real_concept frexp(real_concept a, int* expon)
{ return std::frexp(a.value(), expon); }
inline real_concept ldexp(real_concept a, int expon)
{ return std::ldexp(a.value(), expon); }
inline real_concept log(real_concept a)
{ return std::log(a.value()); }
inline real_concept log10(real_concept a)
{ return std::log10(a.value()); }
inline real_concept tan(real_concept a)
{ return std::tan(a.value()); }
inline real_concept pow(real_concept a, real_concept b)
{ return std::pow(a.value(), b.value()); }
#if !defined(__SUNPRO_CC)
inline real_concept pow(real_concept a, int b)
{ return std::pow(a.value(), b); }
#else
inline real_concept pow(real_concept a, int b)
{ return std::pow(a.value(), static_cast<real_concept_base_type>(b)); }
#endif
inline real_concept sin(real_concept a)
{ return std::sin(a.value()); }
inline real_concept sinh(real_concept a)
{ return std::sinh(a.value()); }
inline real_concept sqrt(real_concept a)
{ return std::sqrt(a.value()); }
inline real_concept tanh(real_concept a)
{ return std::tanh(a.value()); }

//
// Conversion and truncation routines:
//
template <class Policy>
inline int iround(const concepts::real_concept& v, const Policy& pol)
{ return boost::math::iround(v.value(), pol); }
inline int iround(const concepts::real_concept& v)
{ return boost::math::iround(v.value(), policies::policy<>()); }
template <class Policy>
inline long lround(const concepts::real_concept& v, const Policy& pol)
{ return boost::math::lround(v.value(), pol); }
inline long lround(const concepts::real_concept& v)
{ return boost::math::lround(v.value(), policies::policy<>()); }

#ifdef BOOST_HAS_LONG_LONG
template <class Policy>
inline boost::long_long_type llround(const concepts::real_concept& v, const Policy& pol)
{ return boost::math::llround(v.value(), pol); }
inline boost::long_long_type llround(const concepts::real_concept& v)
{ return boost::math::llround(v.value(), policies::policy<>()); }
#endif

template <class Policy>
inline int itrunc(const concepts::real_concept& v, const Policy& pol)
{ return boost::math::itrunc(v.value(), pol); }
inline int itrunc(const concepts::real_concept& v)
{ return boost::math::itrunc(v.value(), policies::policy<>()); }
template <class Policy>
inline long ltrunc(const concepts::real_concept& v, const Policy& pol)
{ return boost::math::ltrunc(v.value(), pol); }
inline long ltrunc(const concepts::real_concept& v)
{ return boost::math::ltrunc(v.value(), policies::policy<>()); }

#ifdef BOOST_HAS_LONG_LONG
template <class Policy>
inline boost::long_long_type lltrunc(const concepts::real_concept& v, const Policy& pol)
{ return boost::math::lltrunc(v.value(), pol); }
inline boost::long_long_type lltrunc(const concepts::real_concept& v)
{ return boost::math::lltrunc(v.value(), policies::policy<>()); }
#endif

// Streaming:
template <class charT, class traits>
inline std::basic_ostream<charT, traits>& operator<<(std::basic_ostream<charT, traits>& os, const real_concept& a)
{
   return os << a.value();
}
template <class charT, class traits>
inline std::basic_istream<charT, traits>& operator>>(std::basic_istream<charT, traits>& is, real_concept& a)
{
#if defined(BOOST_MSVC) && defined(__SGI_STL_PORT)
   //
   // STLPort 5.1.4 has a problem reading long doubles from strings,
   // see http://sourceforge.net/tracker/index.php?func=detail&aid=1811043&group_id=146814&atid=766244
   //
   double v;
   is >> v;
   a = v;
   return is;
#elif defined(__SGI_STL_PORT) || defined(_RWSTD_VER) || defined(__LIBCOMO__) || defined(_LIBCPP_VERSION)
   std::string s;
   real_concept_base_type d;
   is >> s;
   std::sscanf(s.c_str(), "%Lf", &d);
   a = d;
   return is;
#else
   real_concept_base_type v;
   is >> v;
   a = v;
   return is;
#endif
}

} // namespace concepts

namespace tools
{

template <>
inline concepts::real_concept make_big_value<concepts::real_concept>(boost::math::tools::largest_float val, const char* , mpl::false_ const&, mpl::false_ const&)
{
   return val;  // Can't use lexical_cast here, sometimes it fails....
}

template <>
inline concepts::real_concept max_value<concepts::real_concept>(BOOST_MATH_EXPLICIT_TEMPLATE_TYPE_SPEC(concepts::real_concept))
{
   return max_value<concepts::real_concept_base_type>();
}

template <>
inline concepts::real_concept min_value<concepts::real_concept>(BOOST_MATH_EXPLICIT_TEMPLATE_TYPE_SPEC(concepts::real_concept))
{
   return min_value<concepts::real_concept_base_type>();
}

template <>
inline concepts::real_concept log_max_value<concepts::real_concept>(BOOST_MATH_EXPLICIT_TEMPLATE_TYPE_SPEC(concepts::real_concept))
{
   return log_max_value<concepts::real_concept_base_type>();
}

template <>
inline concepts::real_concept log_min_value<concepts::real_concept>(BOOST_MATH_EXPLICIT_TEMPLATE_TYPE_SPEC(concepts::real_concept))
{
   return log_min_value<concepts::real_concept_base_type>();
}

template <>
inline concepts::real_concept epsilon<concepts::real_concept>(BOOST_MATH_EXPLICIT_TEMPLATE_TYPE_SPEC(concepts::real_concept))
{
#ifdef __SUNPRO_CC
   return std::numeric_limits<concepts::real_concept_base_type>::epsilon();
#else
   return tools::epsilon<concepts::real_concept_base_type>();
#endif
}

template <>
inline BOOST_MATH_CONSTEXPR int digits<concepts::real_concept>(BOOST_MATH_EXPLICIT_TEMPLATE_TYPE_SPEC(concepts::real_concept)) BOOST_NOEXCEPT
{
   // Assume number of significand bits is same as real_concept_base_type,
   // unless std::numeric_limits<T>::is_specialized to provide digits.
   return tools::digits<concepts::real_concept_base_type>();
   // Note that if numeric_limits real concept is NOT specialized to provide digits10
   // (or max_digits10) then the default precision of 6 decimal digits will be used
   // by Boost test (giving misleading error messages like
   // "difference between {9.79796} and {9.79796} exceeds 5.42101e-19%"
   // and by Boost lexical cast and serialization causing loss of accuracy.
}

} // namespace tools
/*
namespace policies {
   namespace detail {

      template <class T>
      inline concepts::real_concept raise_rounding_error(
         const char*,
         const char*,
         const T& val,
         const concepts::real_concept&,
         const  ::boost::math::policies::rounding_error< ::boost::math::policies::errno_on_error>&) BOOST_MATH_NOEXCEPT(T)
      {
         errno = ERANGE;
         // This may or may not do the right thing, but the user asked for the error
         // to be silent so here we go anyway:
         return  val > 0 ? boost::math::tools::max_value<concepts::real_concept>() : -boost::math::tools::max_value<concepts::real_concept>();
      }

   }
}*/

#if defined(__SGI_STL_PORT) || defined(BOOST_NO_LIMITS_COMPILE_TIME_CONSTANTS)
//
// We shouldn't really need these type casts any more, but there are some
// STLport iostream bugs we work around by using them....
//
namespace tools
{
// real_cast converts from T to integer and narrower floating-point types.

// Convert from T to integer types.

template <>
inline unsigned int real_cast<unsigned int, concepts::real_concept>(concepts::real_concept r)
{
   return static_cast<unsigned int>(r.value());
}

template <>
inline int real_cast<int, concepts::real_concept>(concepts::real_concept r)
{
   return static_cast<int>(r.value());
}

template <>
inline long real_cast<long, concepts::real_concept>(concepts::real_concept r)
{
   return static_cast<long>(r.value());
}

// Converts from T to narrower floating-point types, float, double & long double.

template <>
inline float real_cast<float, concepts::real_concept>(concepts::real_concept r)
{
   return static_cast<float>(r.value());
}
template <>
inline double real_cast<double, concepts::real_concept>(concepts::real_concept r)
{
   return static_cast<double>(r.value());
}
template <>
inline long double real_cast<long double, concepts::real_concept>(concepts::real_concept r)
{
   return r.value();
}

} // STLPort

#endif

#if BOOST_WORKAROUND(BOOST_MSVC, <= 1310)
//
// For some strange reason ADL sometimes fails to find the
// correct overloads, unless we bring these declarations into scope:
//
using concepts::itrunc;
using concepts::iround;

#endif

} // namespace math
} // namespace boost

#endif // BOOST_MATH_REAL_CONCEPT_HPP


