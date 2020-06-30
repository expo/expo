///////////////////////////////////////////////////////////////////////////////
// Copyright Christopher Kormanyos 2002 - 2013.
// Copyright 2011 -2013 John Maddock. Distributed under the Boost
// Software License, Version 1.0. (See accompanying file
// LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// This work is based on an earlier work:
// "Algorithm 910: A Portable C++ Multiple-Precision System for Special-Function Calculations",
// in ACM TOMS, {VOL 37, ISSUE 4, (February 2011)} (C) ACM, 2011. http://doi.acm.org/10.1145/1916461.1916469
//
// Note that there are no "noexcept" specifications on the functions in this file: there are too many
// calls to lexical_cast (and similar) to easily analyse the code for correctness. So until compilers
// can detect noexcept misuse at compile time, the only realistic option is to simply not use it here.
//

#ifndef BOOST_MP_CPP_DEC_FLOAT_BACKEND_HPP
#define BOOST_MP_CPP_DEC_FLOAT_BACKEND_HPP

#include <boost/config.hpp>
#include <boost/cstdint.hpp>
#include <limits>
#ifndef BOOST_NO_CXX11_HDR_ARRAY
#include <array>
#else
#include <boost/array.hpp>
#endif
#include <boost/cstdint.hpp>
#include <boost/functional/hash_fwd.hpp>
#include <boost/multiprecision/number.hpp>
#include <boost/multiprecision/detail/big_lanczos.hpp>
#include <boost/multiprecision/detail/dynamic_array.hpp>

//
// Headers required for Boost.Math integration:
//
#include <boost/math/policies/policy.hpp>
//
// Some includes we need from Boost.Math, since we rely on that library to provide these functions:
//
#include <boost/math/special_functions/asinh.hpp>
#include <boost/math/special_functions/acosh.hpp>
#include <boost/math/special_functions/atanh.hpp>
#include <boost/math/special_functions/cbrt.hpp>
#include <boost/math/special_functions/expm1.hpp>
#include <boost/math/special_functions/gamma.hpp>

#ifdef BOOST_MSVC
#pragma warning(push)
#pragma warning(disable:6326)  // comparison of two constants
#endif

namespace boost{
namespace multiprecision{
namespace backends{

template <unsigned Digits10, class ExponentType = boost::int32_t, class Allocator = void>
class cpp_dec_float;

} // namespace

template <unsigned Digits10, class ExponentType, class Allocator>
struct number_category<backends::cpp_dec_float<Digits10, ExponentType, Allocator> > : public mpl::int_<number_kind_floating_point>{};

namespace backends{

template <unsigned Digits10, class ExponentType, class Allocator>
class cpp_dec_float
{
private:
   static const boost::int32_t cpp_dec_float_digits10_setting = Digits10;

   // We need at least 16-bits in the exponent type to do anything sensible:
   BOOST_STATIC_ASSERT_MSG(boost::is_signed<ExponentType>::value, "ExponentType must be a signed built in integer type.");
   BOOST_STATIC_ASSERT_MSG(sizeof(ExponentType) > 1, "ExponentType is too small.");

public:
   typedef mpl::list<boost::long_long_type> signed_types;
   typedef mpl::list<boost::ulong_long_type> unsigned_types;
   typedef mpl::list<long double> float_types;
   typedef ExponentType exponent_type;

   static const boost::int32_t cpp_dec_float_radix = 10L;
   static const boost::int32_t cpp_dec_float_digits10_limit_lo = 9L;
   static const boost::int32_t cpp_dec_float_digits10_limit_hi = boost::integer_traits<boost::int32_t>::const_max - 100;
   static const boost::int32_t cpp_dec_float_digits10 = ((cpp_dec_float_digits10_setting < cpp_dec_float_digits10_limit_lo) ? cpp_dec_float_digits10_limit_lo : ((cpp_dec_float_digits10_setting > cpp_dec_float_digits10_limit_hi) ? cpp_dec_float_digits10_limit_hi : cpp_dec_float_digits10_setting));
   static const ExponentType cpp_dec_float_max_exp10 = (static_cast<ExponentType>(1) << (std::numeric_limits<ExponentType>::digits - 5));
   static const ExponentType cpp_dec_float_min_exp10 = -cpp_dec_float_max_exp10;
   static const ExponentType cpp_dec_float_max_exp = cpp_dec_float_max_exp10;
   static const ExponentType cpp_dec_float_min_exp = cpp_dec_float_min_exp10;

   BOOST_STATIC_ASSERT((cpp_dec_float<Digits10, ExponentType, Allocator>::cpp_dec_float_max_exp10 == -cpp_dec_float<Digits10, ExponentType, Allocator>::cpp_dec_float_min_exp10));

private:
   static const boost::int32_t cpp_dec_float_elem_digits10 = 8L;
   static const boost::int32_t cpp_dec_float_elem_mask = 100000000L;

   BOOST_STATIC_ASSERT(0 == cpp_dec_float_max_exp10 % cpp_dec_float_elem_digits10);

   // There are three guard limbs.
   // 1) The first limb has 'play' from 1...8 decimal digits.
   // 2) The last limb also has 'play' from 1...8 decimal digits.
   // 3) One limb can get lost when justifying after multiply,
   // as only half of the triangle is multiplied and a carry
   // from below is missing.
   static const boost::int32_t cpp_dec_float_elem_number_request = static_cast<boost::int32_t>((cpp_dec_float_digits10 / cpp_dec_float_elem_digits10) + (((cpp_dec_float_digits10 % cpp_dec_float_elem_digits10) != 0) ? 1 : 0));

   // The number of elements needed (with a minimum of two) plus three added guard limbs.
   static const boost::int32_t cpp_dec_float_elem_number = static_cast<boost::int32_t>(((cpp_dec_float_elem_number_request < 2L) ? 2L : cpp_dec_float_elem_number_request) + 3L);

public:
   static const boost::int32_t cpp_dec_float_total_digits10 = static_cast<boost::int32_t>(cpp_dec_float_elem_number * cpp_dec_float_elem_digits10);

private:

   typedef enum enum_fpclass_type
   {
      cpp_dec_float_finite,
      cpp_dec_float_inf,
      cpp_dec_float_NaN
   }
   fpclass_type;

#ifndef BOOST_NO_CXX11_HDR_ARRAY
   typedef typename mpl::if_<is_void<Allocator>,
      std::array<boost::uint32_t, cpp_dec_float_elem_number>,
      detail::dynamic_array<boost::uint32_t, cpp_dec_float_elem_number, Allocator>
      >::type array_type;
#else
   typedef typename mpl::if_<is_void<Allocator>,
      boost::array<boost::uint32_t, cpp_dec_float_elem_number>,
      detail::dynamic_array<boost::uint32_t, cpp_dec_float_elem_number, Allocator>
      >::type array_type;
#endif

   array_type data;
   ExponentType exp;
   bool neg;
   fpclass_type fpclass;
   boost::int32_t prec_elem;

   //
   // Special values constructor:
   //
   cpp_dec_float(fpclass_type c) :
      data(),
      exp (static_cast<ExponentType>(0)),
      neg (false),
      fpclass (c),
      prec_elem(cpp_dec_float_elem_number) { }

      //
      // Static data initializer:
      //
      struct initializer
      {
         initializer()
         {
             cpp_dec_float<Digits10, ExponentType, Allocator>::nan();
             cpp_dec_float<Digits10, ExponentType, Allocator>::inf();
            (cpp_dec_float<Digits10, ExponentType, Allocator>::min)();
            (cpp_dec_float<Digits10, ExponentType, Allocator>::max)();
             cpp_dec_float<Digits10, ExponentType, Allocator>::zero();
             cpp_dec_float<Digits10, ExponentType, Allocator>::one();
             cpp_dec_float<Digits10, ExponentType, Allocator>::two();
             cpp_dec_float<Digits10, ExponentType, Allocator>::half();
             cpp_dec_float<Digits10, ExponentType, Allocator>::double_min();
             cpp_dec_float<Digits10, ExponentType, Allocator>::double_max();
             cpp_dec_float<Digits10, ExponentType, Allocator>::long_double_max();
             cpp_dec_float<Digits10, ExponentType, Allocator>::long_double_min();
             cpp_dec_float<Digits10, ExponentType, Allocator>::long_long_max();
             cpp_dec_float<Digits10, ExponentType, Allocator>::long_long_min();
             cpp_dec_float<Digits10, ExponentType, Allocator>::ulong_long_max();
             cpp_dec_float<Digits10, ExponentType, Allocator>::eps();
             cpp_dec_float<Digits10, ExponentType, Allocator>::pow2(0);
         }
         void do_nothing(){}
      };

      static initializer init;

public:
   // Constructors
   cpp_dec_float() BOOST_MP_NOEXCEPT_IF(noexcept(array_type())) :
      data(),
      exp (static_cast<ExponentType>(0)),
      neg (false),
      fpclass (cpp_dec_float_finite),
      prec_elem(cpp_dec_float_elem_number) { }

   cpp_dec_float(const char* s) :
      data(),
      exp (static_cast<ExponentType>(0)),
      neg (false),
      fpclass (cpp_dec_float_finite),
      prec_elem(cpp_dec_float_elem_number)
      {
         *this = s;
      }

   template<class I>
   cpp_dec_float(I i, typename enable_if<is_unsigned<I> >::type* = 0) :
      data(),
      exp (static_cast<ExponentType>(0)),
      neg (false),
      fpclass (cpp_dec_float_finite),
      prec_elem(cpp_dec_float_elem_number)
      {
         from_unsigned_long_long(i);
      }

   template <class I>
   cpp_dec_float(I i, typename enable_if<is_signed<I> >::type* = 0) :
      data(),
      exp (static_cast<ExponentType>(0)),
      neg (false),
      fpclass (cpp_dec_float_finite),
      prec_elem(cpp_dec_float_elem_number)
      {
         if(i < 0)
         {
            from_unsigned_long_long(boost::multiprecision::detail::unsigned_abs(i));
            negate();
         }
         else
            from_unsigned_long_long(i);
      }

   cpp_dec_float(const cpp_dec_float& f) BOOST_MP_NOEXCEPT_IF(noexcept(array_type(std::declval<const array_type&>()))) :
      data (f.data),
      exp (f.exp),
      neg (f.neg),
      fpclass (f.fpclass),
      prec_elem(f.prec_elem) { }

   template <unsigned D, class ET, class A>
   cpp_dec_float(const cpp_dec_float<D, ET, A>& f, typename enable_if_c<D <= Digits10>::type* = 0) :
      data(),
      exp (f.exp),
      neg (f.neg),
      fpclass (static_cast<fpclass_type>(static_cast<int>(f.fpclass))),
      prec_elem(cpp_dec_float_elem_number)
   {
      std::copy(f.data.begin(), f.data.begin() + f.prec_elem, data.begin());
   }
   template <unsigned D, class ET, class A>
   explicit cpp_dec_float(const cpp_dec_float<D, ET, A>& f, typename disable_if_c<D <= Digits10>::type* = 0) :
      data(),
      exp (f.exp),
      neg (f.neg),
      fpclass (static_cast<fpclass_type>(static_cast<int>(f.fpclass))),
      prec_elem(cpp_dec_float_elem_number)
   {
      // TODO: this doesn't round!
      std::copy(f.data.begin(), f.data.begin() + prec_elem, data.begin());
   }

   template <class F>
   cpp_dec_float(const F val, typename enable_if<is_floating_point<F> >::type* = 0) :
      data(),
      exp (static_cast<ExponentType>(0)),
      neg (false),
      fpclass (cpp_dec_float_finite),
      prec_elem(cpp_dec_float_elem_number)
   {
      *this = val;
   }

   cpp_dec_float(const double mantissa, const ExponentType exponent);

   std::size_t hash()const
   {
      std::size_t result = 0;
      for(int i = 0; i < prec_elem; ++i)
         boost::hash_combine(result, data[i]);
      boost::hash_combine(result, exp);
      boost::hash_combine(result, neg);
      boost::hash_combine(result, fpclass);
      return result;
   }

   // Specific special values.
   static const cpp_dec_float& nan()
   {
      static const cpp_dec_float val(cpp_dec_float_NaN);
      init.do_nothing();
      return val;
   }

   static const cpp_dec_float& inf()
   {
      static const cpp_dec_float val(cpp_dec_float_inf);
      init.do_nothing();
      return val;
   }

   static const cpp_dec_float& (max)()
   {
      init.do_nothing();
      static cpp_dec_float val_max = std::string("1.0e" + boost::lexical_cast<std::string>(cpp_dec_float_max_exp10)).c_str();
      return val_max;
   }

   static const cpp_dec_float& (min)()
   {
      init.do_nothing();
      static cpp_dec_float val_min = std::string("1.0e" + boost::lexical_cast<std::string>(cpp_dec_float_min_exp10)).c_str();
      return val_min;
   }

   static const cpp_dec_float& zero()
   {
      init.do_nothing();
      static cpp_dec_float val(static_cast<boost::ulong_long_type>(0u));
      return val;
   }

   static const cpp_dec_float& one()
   {
      init.do_nothing();
      static cpp_dec_float val(static_cast<boost::ulong_long_type>(1u));
      return val;
   }

   static const cpp_dec_float& two()
   {
      init.do_nothing();
      static cpp_dec_float val(static_cast<boost::ulong_long_type>(2u));
      return val;
   }

   static const cpp_dec_float& half()
   {
      init.do_nothing();
      static cpp_dec_float val(0.5L);
      return val;
   }

   static const cpp_dec_float& double_min()
   {
      init.do_nothing();
      static cpp_dec_float val(static_cast<long double>((std::numeric_limits<double>::min)()));
      return val;
   }

   static const cpp_dec_float& double_max()
   {
      init.do_nothing();
      static cpp_dec_float val(static_cast<long double>((std::numeric_limits<double>::max)()));
      return val;
   }

   static const cpp_dec_float& long_double_min()
   {
      init.do_nothing();
#ifdef BOOST_MATH_NO_LONG_DOUBLE_MATH_FUNCTIONS
      static cpp_dec_float val(static_cast<long double>((std::numeric_limits<double>::min)()));
#else
      static cpp_dec_float val((std::numeric_limits<long double>::min)());
#endif
      return val;
   }

   static const cpp_dec_float& long_double_max()
   {
      init.do_nothing();
#ifdef BOOST_MATH_NO_LONG_DOUBLE_MATH_FUNCTIONS
      static cpp_dec_float val(static_cast<long double>((std::numeric_limits<double>::max)()));
#else
      static cpp_dec_float val((std::numeric_limits<long double>::max)());
#endif
      return val;
   }

   static const cpp_dec_float& long_long_max()
   {
      init.do_nothing();
      static cpp_dec_float val((std::numeric_limits<boost::long_long_type>::max)());
      return val;
   }

   static const cpp_dec_float& long_long_min()
   {
      init.do_nothing();
      static cpp_dec_float val((std::numeric_limits<boost::long_long_type>::min)());
      return val;
   }

   static const cpp_dec_float& ulong_long_max()
   {
      init.do_nothing();
      static cpp_dec_float val((std::numeric_limits<boost::ulong_long_type>::max)());
      return val;
   }

   static const cpp_dec_float& eps()
   {
      init.do_nothing();
      static cpp_dec_float val(1.0, 1 - static_cast<int>(cpp_dec_float_digits10));
      return val;
   }

   // Basic operations.
   cpp_dec_float& operator=(const cpp_dec_float& v) BOOST_MP_NOEXCEPT_IF(noexcept(std::declval<array_type&>() = std::declval<const array_type&>()))
   {
      data = v.data;
      exp = v.exp;
      neg = v.neg;
      fpclass = v.fpclass;
      prec_elem = v.prec_elem;
      return *this;
   }

   template <unsigned D>
   cpp_dec_float& operator=(const cpp_dec_float<D>& f)
   {
      exp = f.exp;
      neg = f.neg;
      fpclass = static_cast<enum_fpclass_type>(static_cast<int>(f.fpclass));
      unsigned elems = (std::min)(f.prec_elem, cpp_dec_float_elem_number);
      std::copy(f.data.begin(), f.data.begin() + elems, data.begin());
      std::fill(data.begin() + elems, data.end(), 0);
      prec_elem = cpp_dec_float_elem_number;
      return *this;
   }

   cpp_dec_float& operator=(boost::long_long_type v)
   {
      if(v < 0)
      {
         from_unsigned_long_long(-v);
         negate();
      }
      else
         from_unsigned_long_long(v);
      return *this;
   }

   cpp_dec_float& operator=(boost::ulong_long_type v)
   {
      from_unsigned_long_long(v);
      return *this;
   }

   cpp_dec_float& operator=(long double v);

   cpp_dec_float& operator=(const char* v)
   {
      rd_string(v);
      return *this;
   }

   cpp_dec_float& operator+=(const cpp_dec_float& v);
   cpp_dec_float& operator-=(const cpp_dec_float& v);
   cpp_dec_float& operator*=(const cpp_dec_float& v);
   cpp_dec_float& operator/=(const cpp_dec_float& v);

   cpp_dec_float& add_unsigned_long_long(const boost::ulong_long_type n)
   {
      cpp_dec_float t;
      t.from_unsigned_long_long(n);
      return *this += t;
   }

   cpp_dec_float& sub_unsigned_long_long(const boost::ulong_long_type n)
   {
      cpp_dec_float t;
      t.from_unsigned_long_long(n);
      return *this -= t;
   }

   cpp_dec_float& mul_unsigned_long_long(const boost::ulong_long_type n);
   cpp_dec_float& div_unsigned_long_long(const boost::ulong_long_type n);

   // Elementary primitives.
   cpp_dec_float& calculate_inv ();
   cpp_dec_float& calculate_sqrt();

   void negate()
   {
      if(!iszero())
         neg = !neg;
   }

   // Comparison functions
   bool isnan    BOOST_PREVENT_MACRO_SUBSTITUTION() const { return (fpclass == cpp_dec_float_NaN); }
   bool isinf    BOOST_PREVENT_MACRO_SUBSTITUTION() const { return (fpclass == cpp_dec_float_inf); }
   bool isfinite BOOST_PREVENT_MACRO_SUBSTITUTION() const { return (fpclass == cpp_dec_float_finite); }

   bool iszero () const
   {
      return ((fpclass == cpp_dec_float_finite) && (data[0u] == 0u));
   }

   bool isone () const;
   bool isint () const;
   bool isneg () const { return neg; }

   // Operators pre-increment and pre-decrement
   cpp_dec_float& operator++()
   {
      return *this += one();
   }

   cpp_dec_float& operator--()
   {
      return *this -= one();
   }

   std::string str(boost::intmax_t digits, std::ios_base::fmtflags f)const;

   int compare(const cpp_dec_float& v)const;

   template <class V>
   int compare(const V& v)const
   {
      cpp_dec_float<Digits10, ExponentType, Allocator> t;
      t = v;
      return compare(t);
   }

   void swap(cpp_dec_float& v)
   {
      data.swap(v.data);
      std::swap(exp, v.exp);
      std::swap(neg, v.neg);
      std::swap(fpclass, v.fpclass);
      std::swap(prec_elem, v.prec_elem);
   }

   double extract_double() const;
   long double extract_long_double() const;
   boost::long_long_type extract_signed_long_long() const;
   boost::ulong_long_type extract_unsigned_long_long() const;
   void extract_parts(double& mantissa, ExponentType& exponent) const;
   cpp_dec_float extract_integer_part() const;

   void precision(const boost::int32_t prec_digits)
   {
      if(prec_digits >= cpp_dec_float_total_digits10)
      {
         prec_elem = cpp_dec_float_elem_number;
      }
      else
      {
         const boost::int32_t elems = static_cast<boost::int32_t>( static_cast<boost::int32_t>( (prec_digits + (cpp_dec_float_elem_digits10 / 2)) / cpp_dec_float_elem_digits10)
            + static_cast<boost::int32_t>(((prec_digits % cpp_dec_float_elem_digits10) != 0) ? 1 : 0));

         prec_elem = (std::min)(cpp_dec_float_elem_number, (std::max)(elems, static_cast<boost::int32_t>(2)));
      }
   }
   static cpp_dec_float pow2(boost::long_long_type i);
   ExponentType order()const
   {
      const bool bo_order_is_zero = ((!(isfinite)()) || (data[0] == static_cast<boost::uint32_t>(0u)));
      //
      // Binary search to find the order of the leading term:
      //
      ExponentType prefix = 0;

      if(data[0] >= 100000UL)
      {
         if(data[0] >= 10000000UL)
         {
            if(data[0] >= 100000000UL)
            {
               if(data[0] >= 1000000000UL)
                  prefix = 9;
               else
                  prefix = 8;
            }
            else
               prefix = 7;
         }
         else
         {
            if(data[0] >= 1000000UL)
               prefix = 6;
            else
               prefix = 5;
         }
      }
      else
      {
         if(data[0] >= 1000UL)
         {
            if(data[0] >= 10000UL)
               prefix = 4;
            else
               prefix = 3;
         }
         else
         {
            if(data[0] >= 100)
               prefix = 2;
            else if(data[0] >= 10)
               prefix = 1;
         }
      }

      return (bo_order_is_zero ? static_cast<ExponentType>(0) : static_cast<ExponentType>(exp + prefix));
   }

   template<class Archive>
   void serialize(Archive & ar, const unsigned int /*version*/)
   {
      for(unsigned i = 0; i < data.size(); ++i)
         ar & data[i];
      ar & exp;
      ar & neg;
      ar & fpclass;
      ar & prec_elem;
   }

private:
   static bool data_elem_is_non_zero_predicate(const boost::uint32_t& d) { return (d != static_cast<boost::uint32_t>(0u)); }
   static bool data_elem_is_non_nine_predicate(const boost::uint32_t& d) { return (d != static_cast<boost::uint32_t>(cpp_dec_float::cpp_dec_float_elem_mask - 1)); }
   static bool char_is_nonzero_predicate(const char& c) { return (c != static_cast<char>('0')); }

   void from_unsigned_long_long(const boost::ulong_long_type u);

   int cmp_data(const array_type& vd) const;


   static boost::uint32_t mul_loop_uv(boost::uint32_t* const u, const boost::uint32_t* const v, const boost::int32_t p);
   static boost::uint32_t mul_loop_n (boost::uint32_t* const u, boost::uint32_t n, const boost::int32_t p);
   static boost::uint32_t div_loop_n (boost::uint32_t* const u, boost::uint32_t n, const boost::int32_t p);

   bool rd_string(const char* const s);

   template <unsigned D, class ET, class A>
   friend class cpp_dec_float;
};

template <unsigned Digits10, class ExponentType, class Allocator>
typename cpp_dec_float<Digits10, ExponentType, Allocator>::initializer cpp_dec_float<Digits10, ExponentType, Allocator>::init;

template <unsigned Digits10, class ExponentType, class Allocator>
const boost::int32_t cpp_dec_float<Digits10, ExponentType, Allocator>::cpp_dec_float_radix;
template <unsigned Digits10, class ExponentType, class Allocator>
const boost::int32_t cpp_dec_float<Digits10, ExponentType, Allocator>::cpp_dec_float_digits10_setting;
template <unsigned Digits10, class ExponentType, class Allocator>
const boost::int32_t cpp_dec_float<Digits10, ExponentType, Allocator>::cpp_dec_float_digits10_limit_lo;
template <unsigned Digits10, class ExponentType, class Allocator>
const boost::int32_t cpp_dec_float<Digits10, ExponentType, Allocator>::cpp_dec_float_digits10_limit_hi;
template <unsigned Digits10, class ExponentType, class Allocator>
const boost::int32_t cpp_dec_float<Digits10, ExponentType, Allocator>::cpp_dec_float_digits10;
template <unsigned Digits10, class ExponentType, class Allocator>
const ExponentType cpp_dec_float<Digits10, ExponentType, Allocator>::cpp_dec_float_max_exp;
template <unsigned Digits10, class ExponentType, class Allocator>
const ExponentType cpp_dec_float<Digits10, ExponentType, Allocator>::cpp_dec_float_min_exp;
template <unsigned Digits10, class ExponentType, class Allocator>
const ExponentType cpp_dec_float<Digits10, ExponentType, Allocator>::cpp_dec_float_max_exp10;
template <unsigned Digits10, class ExponentType, class Allocator>
const ExponentType cpp_dec_float<Digits10, ExponentType, Allocator>::cpp_dec_float_min_exp10;
template <unsigned Digits10, class ExponentType, class Allocator>
const boost::int32_t cpp_dec_float<Digits10, ExponentType, Allocator>::cpp_dec_float_elem_digits10;
template <unsigned Digits10, class ExponentType, class Allocator>
const boost::int32_t cpp_dec_float<Digits10, ExponentType, Allocator>::cpp_dec_float_elem_number_request;
template <unsigned Digits10, class ExponentType, class Allocator>
const boost::int32_t cpp_dec_float<Digits10, ExponentType, Allocator>::cpp_dec_float_elem_number;
template <unsigned Digits10, class ExponentType, class Allocator>
const boost::int32_t cpp_dec_float<Digits10, ExponentType, Allocator>::cpp_dec_float_elem_mask;

template <unsigned Digits10, class ExponentType, class Allocator>
cpp_dec_float<Digits10, ExponentType, Allocator>& cpp_dec_float<Digits10, ExponentType, Allocator>::operator+=(const cpp_dec_float<Digits10, ExponentType, Allocator>& v)
{
   if((isnan)())
   {
      return *this;
   }

   if((isinf)())
   {
      if((v.isinf)() && (isneg() != v.isneg()))
      {
         *this = nan();
      }
      return *this;
   }

   if(iszero())
   {
      return operator=(v);
   }

   if((v.isnan)() || (v.isinf)())
   {
      *this = v;
      return *this;
   }

   // Get the offset for the add/sub operation.
   static const ExponentType max_delta_exp = static_cast<ExponentType>((cpp_dec_float_elem_number - 1) * cpp_dec_float_elem_digits10);

   const ExponentType ofs_exp = static_cast<ExponentType>(exp - v.exp);

   // Check if the operation is out of range, requiring special handling.
   if(v.iszero() || (ofs_exp > max_delta_exp))
   {
      // Result is *this unchanged since v is negligible compared to *this.
      return *this;
   }
   else if(ofs_exp < -max_delta_exp)
   {
      // Result is *this = v since *this is negligible compared to v.
      return operator=(v);
   }

   // Do the add/sub operation.

   typename array_type::iterator p_u = data.begin();
   typename array_type::const_iterator p_v = v.data.begin();
   bool b_copy = false;
   const boost::int32_t ofs = static_cast<boost::int32_t>(static_cast<boost::int32_t>(ofs_exp) / cpp_dec_float_elem_digits10);
   array_type n_data;

   if(neg == v.neg)
   {
      // Add v to *this, where the data array of either *this or v
      // might have to be treated with a positive, negative or zero offset.
      // The result is stored in *this. The data are added one element
      // at a time, each element with carry.
      if(ofs >= static_cast<boost::int32_t>(0))
      {
         std::copy(v.data.begin(), v.data.end() - static_cast<size_t>(ofs), n_data.begin() + static_cast<size_t>(ofs));
         std::fill(n_data.begin(), n_data.begin() + static_cast<size_t>(ofs), static_cast<boost::uint32_t>(0u));
         p_v = n_data.begin();
      }
      else
      {
         std::copy(data.begin(), data.end() - static_cast<size_t>(-ofs), n_data.begin() + static_cast<size_t>(-ofs));
         std::fill(n_data.begin(), n_data.begin() + static_cast<size_t>(-ofs), static_cast<boost::uint32_t>(0u));
         p_u = n_data.begin();
         b_copy = true;
      }

      // Addition algorithm
      boost::uint32_t carry = static_cast<boost::uint32_t>(0u);

      for(boost::int32_t j = static_cast<boost::int32_t>(cpp_dec_float_elem_number - static_cast<boost::int32_t>(1)); j >= static_cast<boost::int32_t>(0); j--)
      {
         boost::uint32_t t = static_cast<boost::uint32_t>(static_cast<boost::uint32_t>(p_u[j] + p_v[j]) + carry);
         carry = t / static_cast<boost::uint32_t>(cpp_dec_float_elem_mask);
         p_u[j] = static_cast<boost::uint32_t>(t - static_cast<boost::uint32_t>(carry * static_cast<boost::uint32_t>(cpp_dec_float_elem_mask)));
      }

      if(b_copy)
      {
         data = n_data;
         exp = v.exp;
      }

      // There needs to be a carry into the element -1 of the array data
      if(carry != static_cast<boost::uint32_t>(0u))
      {
         std::copy_backward(data.begin(), data.end() - static_cast<std::size_t>(1u), data.end());
         data[0] = carry;
         exp += static_cast<ExponentType>(cpp_dec_float_elem_digits10);
      }
   }
   else
   {
      // Subtract v from *this, where the data array of either *this or v
      // might have to be treated with a positive, negative or zero offset.
      if((ofs > static_cast<boost::int32_t>(0))
         || ( (ofs == static_cast<boost::int32_t>(0))
         && (cmp_data(v.data) > static_cast<boost::int32_t>(0)))
         )
      {
         // In this case, |u| > |v| and ofs is positive.
         // Copy the data of v, shifted down to a lower value
         // into the data array m_n. Set the operand pointer p_v
         // to point to the copied, shifted data m_n.
         std::copy(v.data.begin(), v.data.end() - static_cast<size_t>(ofs), n_data.begin() + static_cast<size_t>(ofs));
         std::fill(n_data.begin(), n_data.begin() + static_cast<size_t>(ofs), static_cast<boost::uint32_t>(0u));
         p_v = n_data.begin();
      }
      else
      {
         if(ofs != static_cast<boost::int32_t>(0))
         {
            // In this case, |u| < |v| and ofs is negative.
            // Shift the data of u down to a lower value.
            std::copy_backward(data.begin(), data.end() - static_cast<size_t>(-ofs), data.end());
            std::fill(data.begin(), data.begin() + static_cast<size_t>(-ofs), static_cast<boost::uint32_t>(0u));
         }

         // Copy the data of v into the data array n_data.
         // Set the u-pointer p_u to point to m_n and the
         // operand pointer p_v to point to the shifted
         // data m_data.
         n_data = v.data;
         p_u = n_data.begin();
         p_v = data.begin();
         b_copy = true;
      }

      boost::int32_t j;

      // Subtraction algorithm
      boost::int32_t borrow = static_cast<boost::int32_t>(0);

      for(j = static_cast<boost::int32_t>(cpp_dec_float_elem_number - static_cast<boost::int32_t>(1)); j >= static_cast<boost::int32_t>(0); j--)
      {
         boost::int32_t t = static_cast<boost::int32_t>(static_cast<boost::int32_t>( static_cast<boost::int32_t>(p_u[j])
            - static_cast<boost::int32_t>(p_v[j])) - borrow);

         // Underflow? Borrow?
         if(t < static_cast<boost::int32_t>(0))
         {
            // Yes, underflow and borrow
            t += static_cast<boost::int32_t>(cpp_dec_float_elem_mask);
            borrow = static_cast<boost::int32_t>(1);
         }
         else
         {
            borrow = static_cast<boost::int32_t>(0);
         }

         p_u[j] = static_cast<boost::uint32_t>(static_cast<boost::uint32_t>(t) % static_cast<boost::uint32_t>(cpp_dec_float_elem_mask));
      }

      if(b_copy)
      {
         data = n_data;
         exp = v.exp;
         neg = v.neg;
      }

      // Is it necessary to justify the data?
      const typename array_type::const_iterator first_nonzero_elem = std::find_if(data.begin(), data.end(), data_elem_is_non_zero_predicate);

      if(first_nonzero_elem != data.begin())
      {
         if(first_nonzero_elem == data.end())
         {
            // This result of the subtraction is exactly zero.
            // Reset the sign and the exponent.
            neg = false;
            exp = static_cast<ExponentType>(0);
         }
         else
         {
            // Justify the data
            const std::size_t sj = static_cast<std::size_t>(std::distance<typename array_type::const_iterator>(data.begin(), first_nonzero_elem));

            std::copy(data.begin() + static_cast<std::size_t>(sj), data.end(), data.begin());
            std::fill(data.end() - sj, data.end(), static_cast<boost::uint32_t>(0u));

            exp -= static_cast<ExponentType>(sj * static_cast<std::size_t>(cpp_dec_float_elem_digits10));
         }
      }
   }

   // Handle underflow.
   if(iszero())
      return (*this = zero());

   // Check for potential overflow.
   const bool b_result_might_overflow  = (exp >= static_cast<ExponentType>(cpp_dec_float_max_exp10));

   // Handle overflow.
   if(b_result_might_overflow)
   {
      const bool b_result_is_neg = neg;
      neg = false;

      if(compare((cpp_dec_float::max)()) > 0)
        *this = inf();

      neg = b_result_is_neg;
   }

   return *this;
}

template <unsigned Digits10, class ExponentType, class Allocator>
cpp_dec_float<Digits10, ExponentType, Allocator>& cpp_dec_float<Digits10, ExponentType, Allocator>::operator-=(const cpp_dec_float<Digits10, ExponentType, Allocator>& v)
{
   // Use *this - v = -(-*this + v).
   negate();
   *this += v;
   negate();
   return *this;
}

template <unsigned Digits10, class ExponentType, class Allocator>
cpp_dec_float<Digits10, ExponentType, Allocator>& cpp_dec_float<Digits10, ExponentType, Allocator>::operator*=(const cpp_dec_float<Digits10, ExponentType, Allocator>& v)
{
   // Evaluate the sign of the result.
   const bool b_result_is_neg = (neg != v.neg);

   // Artificially set the sign of the result to be positive.
   neg = false;

   // Handle special cases like zero, inf and NaN.
   const bool b_u_is_inf  = (isinf)();
   const bool b_v_is_inf  = (v.isinf)();
   const bool b_u_is_zero = iszero();
   const bool b_v_is_zero = v.iszero();

   if(   ((isnan)() || (v.isnan)())
      || (b_u_is_inf && b_v_is_zero)
      || (b_v_is_inf && b_u_is_zero)
      )
   {
      *this = nan();
      return *this;
   }

   if(b_u_is_inf || b_v_is_inf)
   {
      *this = inf();
      if(b_result_is_neg)
         negate();
      return *this;
   }

   if(b_u_is_zero || b_v_is_zero)
   {
      return *this = zero();
   }

   // Check for potential overflow or underflow.
   const bool b_result_might_overflow  = ((exp + v.exp) >= static_cast<ExponentType>(cpp_dec_float_max_exp10));
   const bool b_result_might_underflow = ((exp + v.exp) <= static_cast<ExponentType>(cpp_dec_float_min_exp10));

   // Set the exponent of the result.
   exp += v.exp;

   const boost::int32_t prec_mul = (std::min)(prec_elem, v.prec_elem);

   const boost::uint32_t carry = mul_loop_uv(data.data(), v.data.data(), prec_mul);

   // Handle a potential carry.
   if(carry != static_cast<boost::uint32_t>(0u))
   {
      exp += cpp_dec_float_elem_digits10;

      // Shift the result of the multiplication one element to the right...
      std::copy_backward(data.begin(),
                         data.begin() + static_cast<std::size_t>(prec_elem - static_cast<boost::int32_t>(1)),
                         data.begin() + static_cast<std::size_t>(prec_elem));

      // ... And insert the carry.
      data.front() = carry;
   }

   // Handle overflow.
   if(b_result_might_overflow && (compare((cpp_dec_float::max)()) > 0))
   {
      *this = inf();
   }

   // Handle underflow.
   if(b_result_might_underflow && (compare((cpp_dec_float::min)()) < 0))
   {
      *this = zero();

      return *this;
   }

   // Set the sign of the result.
   neg = b_result_is_neg;

   return *this;
}

template <unsigned Digits10, class ExponentType, class Allocator>
cpp_dec_float<Digits10, ExponentType, Allocator>& cpp_dec_float<Digits10, ExponentType, Allocator>::operator/=(const cpp_dec_float<Digits10, ExponentType, Allocator>& v)
{
   if(iszero())
   {
      if((v.isnan)())
      {
         return *this = v;
      }
      else if(v.iszero())
      {
         return *this = nan();
      }
   }

   const bool u_and_v_are_finite_and_identical = ( (isfinite)()
      && (fpclass == v.fpclass)
      && (exp == v.exp)
      && (cmp_data(v.data) == static_cast<boost::int32_t>(0)));

   if(u_and_v_are_finite_and_identical)
   {
      if(neg != v.neg)
      {
         *this = one();
         negate();
      }
      else
         *this = one();
      return *this;
   }
   else
   {
      cpp_dec_float t(v);
      t.calculate_inv();
      return operator*=(t);
   }
}

template <unsigned Digits10, class ExponentType, class Allocator>
cpp_dec_float<Digits10, ExponentType, Allocator>& cpp_dec_float<Digits10, ExponentType, Allocator>::mul_unsigned_long_long(const boost::ulong_long_type n)
{
   // Multiply *this with a constant boost::ulong_long_type.

   // Evaluate the sign of the result.
   const bool b_neg = neg;

   // Artificially set the sign of the result to be positive.
   neg = false;

   // Handle special cases like zero, inf and NaN.
   const bool b_u_is_inf = (isinf)();
   const bool b_n_is_zero = (n == static_cast<boost::int32_t>(0));

   if((isnan)() || (b_u_is_inf && b_n_is_zero))
   {
      return (*this = nan());
   }

   if(b_u_is_inf)
   {
      *this = inf();
      if(b_neg)
         negate();
      return *this;
   }

   if(iszero() || b_n_is_zero)
   {
      // Multiplication by zero.
      return *this = zero();
   }

   if(n >= static_cast<boost::ulong_long_type>(cpp_dec_float_elem_mask))
   {
      neg = b_neg;
      cpp_dec_float t;
      t = n;
      return operator*=(t);
   }

   if(n == static_cast<boost::ulong_long_type>(1u))
   {
      neg = b_neg;
      return *this;
   }

   // Set up the multiplication loop.
   const boost::uint32_t nn = static_cast<boost::uint32_t>(n);
   const boost::uint32_t carry = mul_loop_n(data.data(), nn, prec_elem);

   // Handle the carry and adjust the exponent.
   if(carry != static_cast<boost::uint32_t>(0u))
   {
      exp += static_cast<ExponentType>(cpp_dec_float_elem_digits10);

      // Shift the result of the multiplication one element to the right.
      std::copy_backward(data.begin(),
         data.begin() + static_cast<std::size_t>(prec_elem - static_cast<boost::int32_t>(1)),
         data.begin() + static_cast<std::size_t>(prec_elem));

      data.front() = static_cast<boost::uint32_t>(carry);
   }

   // Check for potential overflow.
   const bool b_result_might_overflow = (exp >= cpp_dec_float_max_exp10);

   // Handle overflow.
   if(b_result_might_overflow && (compare((cpp_dec_float::max)()) > 0))
   {
      *this = inf();
   }

   // Set the sign.
   neg = b_neg;

   return *this;
}

template <unsigned Digits10, class ExponentType, class Allocator>
cpp_dec_float<Digits10, ExponentType, Allocator>& cpp_dec_float<Digits10, ExponentType, Allocator>::div_unsigned_long_long(const boost::ulong_long_type n)
{
   // Divide *this by a constant boost::ulong_long_type.

   // Evaluate the sign of the result.
   const bool b_neg = neg;

   // Artificially set the sign of the result to be positive.
   neg = false;

   // Handle special cases like zero, inf and NaN.
   if((isnan)())
   {
      return *this;
   }

   if((isinf)())
   {
      *this = inf();
      if(b_neg)
         negate();
      return *this;
   }

   if(n == static_cast<boost::ulong_long_type>(0u))
   {
      // Divide by 0.
      if(iszero())
      {
         *this = nan();
         return *this;
      }
      else
      {
         *this = inf();
         if(isneg())
            negate();
         return *this;
      }
   }

   if(iszero())
   {
      return *this;
   }

   if(n >= static_cast<boost::ulong_long_type>(cpp_dec_float_elem_mask))
   {
      neg = b_neg;
      cpp_dec_float t;
      t = n;
      return operator/=(t);
   }

   const boost::uint32_t nn = static_cast<boost::uint32_t>(n);

   if(nn > static_cast<boost::uint32_t>(1u))
   {
      // Do the division loop.
      const boost::uint32_t prev = div_loop_n(data.data(), nn, prec_elem);

      // Determine if one leading zero is in the result data.
      if(data[0] == static_cast<boost::uint32_t>(0u))
      {
         // Adjust the exponent
         exp -= static_cast<ExponentType>(cpp_dec_float_elem_digits10);

         // Shift result of the division one element to the left.
         std::copy(data.begin() + static_cast<std::size_t>(1u),
            data.begin() + static_cast<std::size_t>(prec_elem - static_cast<boost::int32_t>(1)),
            data.begin());

         data[prec_elem - static_cast<boost::int32_t>(1)] = static_cast<boost::uint32_t>(static_cast<boost::uint64_t>(prev * static_cast<boost::uint64_t>(cpp_dec_float_elem_mask)) / nn);
      }
   }

   // Check for potential underflow.
   const bool b_result_might_underflow = (exp <= cpp_dec_float_min_exp10);

   // Handle underflow.
   if(b_result_might_underflow && (compare((cpp_dec_float::min)()) < 0))
      return (*this = zero());

   // Set the sign of the result.
   neg = b_neg;

   return *this;
}

template <unsigned Digits10, class ExponentType, class Allocator>
cpp_dec_float<Digits10, ExponentType, Allocator>& cpp_dec_float<Digits10, ExponentType, Allocator>::calculate_inv()
{
   // Compute the inverse of *this.
   const bool b_neg = neg;

   neg = false;

   // Handle special cases like zero, inf and NaN.
   if(iszero())
   {
      *this = inf();
      if(b_neg)
         negate();
      return *this;
   }

   if((isnan)())
   {
      return *this;
   }

   if((isinf)())
   {
      return *this = zero();
   }

   if(isone())
   {
      if(b_neg)
         negate();
      return *this;
   }

   // Save the original *this.
   cpp_dec_float<Digits10, ExponentType, Allocator> x(*this);

   // Generate the initial estimate using division.
   // Extract the mantissa and exponent for a "manual"
   // computation of the estimate.
   double dd;
   ExponentType ne;
   x.extract_parts(dd, ne);

   // Do the inverse estimate using double precision estimates of mantissa and exponent.
   operator=(cpp_dec_float<Digits10, ExponentType, Allocator>(1.0 / dd, -ne));

   // Compute the inverse of *this. Quadratically convergent Newton-Raphson iteration
   // is used. During the iterative steps, the precision of the calculation is limited
   // to the minimum required in order to minimize the run-time.

   static const boost::int32_t double_digits10_minus_a_few = std::numeric_limits<double>::digits10 - 3;

   for(boost::int32_t digits = double_digits10_minus_a_few; digits <= cpp_dec_float_total_digits10; digits *= static_cast<boost::int32_t>(2))
   {
      // Adjust precision of the terms.
      precision(static_cast<boost::int32_t>((digits + 10) * static_cast<boost::int32_t>(2)));
      x.precision(static_cast<boost::int32_t>((digits + 10) * static_cast<boost::int32_t>(2)));

      // Next iteration.
      cpp_dec_float t(*this);
      t *= x;
      t -= two();
      t.negate();
      *this *= t;
   }

   neg = b_neg;

   prec_elem = cpp_dec_float_elem_number;

   return *this;
}

template <unsigned Digits10, class ExponentType, class Allocator>
cpp_dec_float<Digits10, ExponentType, Allocator>& cpp_dec_float<Digits10, ExponentType, Allocator>::calculate_sqrt()
{
   // Compute the square root of *this.

   if(isneg() || (!(isfinite)()))
   {
      *this = nan();
      return *this;
   }

   if(iszero() || isone())
   {
      return *this;
   }

   // Save the original *this.
   cpp_dec_float<Digits10, ExponentType, Allocator> x(*this);

   // Generate the initial estimate using division.
   // Extract the mantissa and exponent for a "manual"
   // computation of the estimate.
   double dd;
   ExponentType ne;
   extract_parts(dd, ne);

   // Force the exponent to be an even multiple of two.
   if((ne % static_cast<ExponentType>(2)) != static_cast<ExponentType>(0))
   {
      ++ne;
      dd /= 10.0;
   }

   // Setup the iteration.
   // Estimate the square root using simple manipulations.
   const double sqd = std::sqrt(dd);

   *this = cpp_dec_float<Digits10, ExponentType, Allocator>(sqd, static_cast<ExponentType>(ne / static_cast<ExponentType>(2)));

   // Estimate 1.0 / (2.0 * x0) using simple manipulations.
   cpp_dec_float<Digits10, ExponentType, Allocator> vi(0.5 / sqd, static_cast<ExponentType>(-ne / static_cast<ExponentType>(2)));

   // Compute the square root of x. Coupled Newton iteration
   // as described in "Pi Unleashed" is used. During the
   // iterative steps, the precision of the calculation is
   // limited to the minimum required in order to minimize
   // the run-time.
   //
   // Book references:
   // http://www.jjj.de/pibook/pibook.html
   // http://www.amazon.com/exec/obidos/tg/detail/-/3540665722/qid=1035535482/sr=8-7/ref=sr_8_7/104-3357872-6059916?v=glance&n=507846

   static const boost::uint32_t double_digits10_minus_a_few = std::numeric_limits<double>::digits10 - 3;

   for(boost::int32_t digits = double_digits10_minus_a_few; digits <= cpp_dec_float_total_digits10; digits *= 2u)
   {
      // Adjust precision of the terms.
      precision((digits + 10) * 2);
      vi.precision((digits + 10) * 2);

      // Next iteration of vi
      cpp_dec_float t(*this);
      t *= vi;
      t.negate();
      t.mul_unsigned_long_long(2u);
      t += one();
      t *= vi;
      vi += t;

      // Next iteration of *this
      t = *this;
      t *= *this;
      t.negate();
      t += x;
      t *= vi;
      *this += t;
   }

   prec_elem = cpp_dec_float_elem_number;

   return *this;
}

template <unsigned Digits10, class ExponentType, class Allocator>
int cpp_dec_float<Digits10, ExponentType, Allocator>::cmp_data(const array_type& vd) const
{
   // Compare the data of *this with those of v.
   // Return +1 for *this > v
   // 0 for *this = v
   // -1 for *this < v

   const std::pair<typename array_type::const_iterator, typename array_type::const_iterator> mismatch_pair = std::mismatch(data.begin(), data.end(), vd.begin());

   const bool is_equal = ((mismatch_pair.first == data.end()) && (mismatch_pair.second == vd.end()));

   if(is_equal)
   {
      return 0;
   }
   else
   {
      return ((*mismatch_pair.first > *mismatch_pair.second) ? 1 : -1);
   }
}

template <unsigned Digits10, class ExponentType, class Allocator>
int cpp_dec_float<Digits10, ExponentType, Allocator>::compare(const cpp_dec_float& v) const
{
   // Compare v with *this.
   // Return +1 for *this > v
   // 0 for *this = v
   // -1 for *this < v

   // Handle all non-finite cases.
   if((!(isfinite)()) || (!(v.isfinite)()))
   {
      // NaN can never equal NaN. Return an implementation-dependent
      // signed result. Also note that comparison of NaN with NaN
      // using operators greater-than or less-than is undefined.
      if((isnan)() || (v.isnan)()) { return ((isnan)() ? 1 : -1); }

      if((isinf)() && (v.isinf)())
      {
         // Both *this and v are infinite. They are equal if they have the same sign.
         // Otherwise, *this is less than v if and only if *this is negative.
         return ((neg == v.neg) ? 0 : (neg ? -1 : 1));
      }

      if((isinf)())
      {
         // *this is infinite, but v is finite.
         // So negative infinite *this is less than any finite v.
         // Whereas positive infinite *this is greater than any finite v.
         return (isneg() ? -1 : 1);
      }
      else
      {
         // *this is finite, and v is infinite.
         // So any finite *this is greater than negative infinite v.
         // Whereas any finite *this is less than positive infinite v.
         return (v.neg ? 1 : -1);
      }
   }

   // And now handle all *finite* cases.
   if(iszero())
   {
      // The value of *this is zero and v is either zero or non-zero.
      return (v.iszero() ? 0
         : (v.neg ? 1 : -1));
   }
   else if(v.iszero())
   {
      // The value of v is zero and *this is non-zero.
      return (neg ? -1 : 1);
   }
   else
   {
      // Both *this and v are non-zero.

      if(neg != v.neg)
      {
         // The signs are different.
         return (neg ? -1 : 1);
      }
      else if(exp != v.exp)
      {
         // The signs are the same and the exponents are different.
         const int val_cexpression = ((exp < v.exp) ? 1 : -1);

         return (neg ? val_cexpression : -val_cexpression);
      }
      else
      {
         // The signs are the same and the exponents are the same.
         // Compare the data.
         const int val_cmp_data = cmp_data(v.data);

         return ((!neg) ? val_cmp_data : -val_cmp_data);
      }
   }
}

template <unsigned Digits10, class ExponentType, class Allocator>
bool cpp_dec_float<Digits10, ExponentType, Allocator>::isone() const
{
   // Check if the value of *this is identically 1 or very close to 1.

   const bool not_negative_and_is_finite = ((!neg) && (isfinite)());

   if(not_negative_and_is_finite)
   {
      if((data[0u] == static_cast<boost::uint32_t>(1u)) && (exp == static_cast<ExponentType>(0)))
      {
         const typename array_type::const_iterator it_non_zero = std::find_if(data.begin(), data.end(), data_elem_is_non_zero_predicate);
         return (it_non_zero == data.end());
      }
      else if((data[0u] == static_cast<boost::uint32_t>(cpp_dec_float_elem_mask - 1)) && (exp == static_cast<ExponentType>(-cpp_dec_float_elem_digits10)))
      {
         const typename array_type::const_iterator it_non_nine = std::find_if(data.begin(), data.end(), data_elem_is_non_nine_predicate);
         return (it_non_nine == data.end());
      }
   }

   return false;
}

template <unsigned Digits10, class ExponentType, class Allocator>
bool cpp_dec_float<Digits10, ExponentType, Allocator>::isint() const
{
   if(fpclass != cpp_dec_float_finite) { return false; }

   if(iszero()) { return true; }

   if(exp < static_cast<ExponentType>(0)) { return false; } // |*this| < 1.

   const typename array_type::size_type offset_decimal_part = static_cast<typename array_type::size_type>(exp / cpp_dec_float_elem_digits10) + 1u;

   if(offset_decimal_part >= static_cast<typename array_type::size_type>(cpp_dec_float_elem_number))
   {
      // The number is too large to resolve the integer part.
      // It considered to be a pure integer.
      return true;
   }

   typename array_type::const_iterator it_non_zero = std::find_if(data.begin() + offset_decimal_part, data.end(), data_elem_is_non_zero_predicate);

   return (it_non_zero == data.end());
}

template <unsigned Digits10, class ExponentType, class Allocator>
void cpp_dec_float<Digits10, ExponentType, Allocator>::extract_parts(double& mantissa, ExponentType& exponent) const
{
   // Extract the approximate parts mantissa and base-10 exponent from the input cpp_dec_float<Digits10, ExponentType, Allocator> value x.

   // Extracts the mantissa and exponent.
   exponent = exp;

   boost::uint32_t p10 = static_cast<boost::uint32_t>(1u);
   boost::uint32_t test = data[0u];

   for(;;)
   {
      test /= static_cast<boost::uint32_t>(10u);

      if(test == static_cast<boost::uint32_t>(0u))
      {
         break;
      }

      p10 *= static_cast<boost::uint32_t>(10u);
      ++exponent;
   }

   // Establish the upper bound of limbs for extracting the double.
   const int max_elem_in_double_count = static_cast<int>(static_cast<boost::int32_t>(std::numeric_limits<double>::digits10) / cpp_dec_float_elem_digits10)
                                         + (static_cast<int>(static_cast<boost::int32_t>(std::numeric_limits<double>::digits10) % cpp_dec_float_elem_digits10) != 0 ? 1 : 0)
                                         + 1;

   // And make sure this upper bound stays within bounds of the elems.
   const std::size_t max_elem_extract_count = static_cast<std::size_t>((std::min)(static_cast<boost::int32_t>(max_elem_in_double_count), cpp_dec_float_elem_number));

   // Extract into the mantissa the first limb, extracted as a double.
   mantissa = static_cast<double>(data[0]);
   double scale = 1.0;

   // Extract the rest of the mantissa piecewise from the limbs.
   for(std::size_t i = 1u; i < max_elem_extract_count; i++)
   {
     scale /= static_cast<double>(cpp_dec_float_elem_mask);
     mantissa += (static_cast<double>(data[i]) * scale);
   }

   mantissa /= static_cast<double>(p10);

   if(neg) { mantissa = -mantissa; }
}

template <unsigned Digits10, class ExponentType, class Allocator>
double cpp_dec_float<Digits10, ExponentType, Allocator>::extract_double() const
{
   // Returns the double conversion of a cpp_dec_float<Digits10, ExponentType, Allocator>.

   // Check for non-normal cpp_dec_float<Digits10, ExponentType, Allocator>.
   if(!(isfinite)())
   {
      if((isnan)())
      {
         return std::numeric_limits<double>::quiet_NaN();
      }
      else
      {
         return ((!neg) ? std::numeric_limits<double>::infinity()
            : -std::numeric_limits<double>::infinity());
      }
   }

   cpp_dec_float<Digits10, ExponentType, Allocator> xx(*this);
   if(xx.isneg())
      xx.negate();

   // Check if *this cpp_dec_float<Digits10, ExponentType, Allocator> is zero.
   if(iszero() || (xx.compare(double_min()) < 0))
   {
      return 0.0;
   }

   // Check if *this cpp_dec_float<Digits10, ExponentType, Allocator> exceeds the maximum of double.
   if(xx.compare(double_max()) > 0)
   {
      return ((!neg) ? std::numeric_limits<double>::infinity()
         : -std::numeric_limits<double>::infinity());
   }

   std::stringstream ss;

   ss << str(std::numeric_limits<double>::digits10 + (2 + 1), std::ios_base::scientific);

   double d;
   ss >> d;

   return d;
}

template <unsigned Digits10, class ExponentType, class Allocator>
long double cpp_dec_float<Digits10, ExponentType, Allocator>::extract_long_double() const
{
   // Returns the long double conversion of a cpp_dec_float<Digits10, ExponentType, Allocator>.

   // Check if *this cpp_dec_float<Digits10, ExponentType, Allocator> is subnormal.
   if(!(isfinite)())
   {
      if((isnan)())
      {
         return std::numeric_limits<long double>::quiet_NaN();
      }
      else
      {
         return ((!neg) ? std::numeric_limits<long double>::infinity()
            : -std::numeric_limits<long double>::infinity());
      }
   }

   cpp_dec_float<Digits10, ExponentType, Allocator> xx(*this);
   if(xx.isneg())
      xx.negate();

   // Check if *this cpp_dec_float<Digits10, ExponentType, Allocator> is zero.
   if(iszero() || (xx.compare(long_double_min()) < 0))
   {
      return static_cast<long double>(0.0);
   }

   // Check if *this cpp_dec_float<Digits10, ExponentType, Allocator> exceeds the maximum of double.
   if(xx.compare(long_double_max()) > 0)
   {
      return ((!neg) ? std::numeric_limits<long double>::infinity()
         : -std::numeric_limits<long double>::infinity());
   }

   std::stringstream ss;

   ss << str(std::numeric_limits<long double>::digits10 + (2 + 1), std::ios_base::scientific);

   long double ld;
   ss >> ld;

   return ld;
}

template <unsigned Digits10, class ExponentType, class Allocator>
boost::long_long_type cpp_dec_float<Digits10, ExponentType, Allocator>::extract_signed_long_long() const
{
   // Extracts a signed long long from *this.
   // If (x > maximum of long long) or (x < minimum of long long),
   // then the maximum or minimum of long long is returned accordingly.

   if(exp < static_cast<ExponentType>(0))
   {
      return static_cast<boost::long_long_type>(0);
   }

   const bool b_neg = isneg();

   boost::ulong_long_type val;

   if((!b_neg) && (compare(long_long_max()) > 0))
   {
      return (std::numeric_limits<boost::long_long_type>::max)();
   }
   else if(b_neg && (compare(long_long_min()) < 0))
   {
      return (std::numeric_limits<boost::long_long_type>::min)();
   }
   else
   {
      // Extract the data into an boost::ulong_long_type value.
      cpp_dec_float<Digits10, ExponentType, Allocator> xn(extract_integer_part());
      if(xn.isneg())
         xn.negate();

      val = static_cast<boost::ulong_long_type>(xn.data[0]);

      const boost::int32_t imax = (std::min)(static_cast<boost::int32_t>(static_cast<boost::int32_t>(xn.exp) / cpp_dec_float_elem_digits10), static_cast<boost::int32_t>(cpp_dec_float_elem_number - static_cast<boost::int32_t>(1)));

      for(boost::int32_t i = static_cast<boost::int32_t>(1); i <= imax; i++)
      {
         val *= static_cast<boost::ulong_long_type>(cpp_dec_float_elem_mask);
         val += static_cast<boost::ulong_long_type>(xn.data[i]);
      }
   }

   if (!b_neg)
   {
      return static_cast<boost::long_long_type>(val);
   }
   else
   {
      // This strange expression avoids a hardware trap in the corner case
      // that val is the most negative value permitted in boost::long_long_type.
      // See https://svn.boost.org/trac/boost/ticket/9740.
      //
      boost::long_long_type sval = static_cast<boost::long_long_type>(val - 1);
      sval = -sval;
      --sval;
      return sval;
   }
}

template <unsigned Digits10, class ExponentType, class Allocator>
boost::ulong_long_type cpp_dec_float<Digits10, ExponentType, Allocator>::extract_unsigned_long_long() const
{
   // Extracts an boost::ulong_long_type from *this.
   // If x exceeds the maximum of boost::ulong_long_type,
   // then the maximum of boost::ulong_long_type is returned.
   // If x is negative, then the boost::ulong_long_type cast of
   // the long long extracted value is returned.

   if(isneg())
   {
      return static_cast<boost::ulong_long_type>(extract_signed_long_long());
   }

   if(exp < static_cast<ExponentType>(0))
   {
      return static_cast<boost::ulong_long_type>(0u);
   }

   const cpp_dec_float<Digits10, ExponentType, Allocator> xn(extract_integer_part());

   boost::ulong_long_type val;

   if(xn.compare(ulong_long_max()) > 0)
   {
      return (std::numeric_limits<boost::ulong_long_type>::max)();
   }
   else
   {
      // Extract the data into an boost::ulong_long_type value.
      val = static_cast<boost::ulong_long_type>(xn.data[0]);

      const boost::int32_t imax = (std::min)(static_cast<boost::int32_t>(static_cast<boost::int32_t>(xn.exp) / cpp_dec_float_elem_digits10), static_cast<boost::int32_t>(cpp_dec_float_elem_number - static_cast<boost::int32_t>(1)));

      for(boost::int32_t i = static_cast<boost::int32_t>(1); i <= imax; i++)
      {
         val *= static_cast<boost::ulong_long_type>(cpp_dec_float_elem_mask);
         val += static_cast<boost::ulong_long_type>(xn.data[i]);
      }
   }

   return val;
}

template <unsigned Digits10, class ExponentType, class Allocator>
cpp_dec_float<Digits10, ExponentType, Allocator> cpp_dec_float<Digits10, ExponentType, Allocator>::extract_integer_part() const
{
   // Compute the signed integer part of x.

   if(!(isfinite)())
   {
      return *this;
   }

   if(exp < static_cast<ExponentType>(0))
   {
      // The absolute value of the number is smaller than 1.
      // Thus the integer part is zero.
      return zero();
   }

   // Truncate the digits from the decimal part, including guard digits
   // that do not belong to the integer part.

   // Make a local copy.
   cpp_dec_float<Digits10, ExponentType, Allocator> x = *this;

   // Clear out the decimal portion
   const size_t first_clear = (static_cast<size_t>(x.exp) / static_cast<size_t>(cpp_dec_float_elem_digits10)) + 1u;
   const size_t last_clear = static_cast<size_t>(cpp_dec_float_elem_number);

   if(first_clear < last_clear)
      std::fill(x.data.begin() + first_clear, x.data.begin() + last_clear, static_cast<boost::uint32_t>(0u));

   return x;
}

template <unsigned Digits10, class ExponentType, class Allocator>
std::string cpp_dec_float<Digits10, ExponentType, Allocator>::str(boost::intmax_t number_of_digits, std::ios_base::fmtflags f) const
{
   if((this->isinf)())
   {
      if(this->isneg())
         return "-inf";
      else if(f & std::ios_base::showpos)
         return "+inf";
      else
         return "inf";
   }
   else if((this->isnan)())
   {
      return "nan";
   }

   std::string str;
   boost::intmax_t org_digits(number_of_digits);
   ExponentType my_exp = order();

   if(number_of_digits == 0)
      number_of_digits = cpp_dec_float_total_digits10;

   if(f & std::ios_base::fixed)
   {
      number_of_digits += my_exp + 1;
   }
   else if(f & std::ios_base::scientific)
      ++number_of_digits;
   // Determine the number of elements needed to provide the requested digits from cpp_dec_float<Digits10, ExponentType, Allocator>.
   const std::size_t number_of_elements = (std::min)(static_cast<std::size_t>((number_of_digits / static_cast<std::size_t>(cpp_dec_float_elem_digits10)) + 2u),
      static_cast<std::size_t>(cpp_dec_float_elem_number));

   // Extract the remaining digits from cpp_dec_float<Digits10, ExponentType, Allocator> after the decimal point.
   str = boost::lexical_cast<std::string>(data[0]);

   // Extract all of the digits from cpp_dec_float<Digits10, ExponentType, Allocator>, beginning with the first data element.
   for(std::size_t i = static_cast<std::size_t>(1u); i < number_of_elements; i++)
   {
      std::stringstream ss;

      ss << std::setw(static_cast<std::streamsize>(cpp_dec_float_elem_digits10))
         << std::setfill(static_cast<char>('0'))
         << data[i];

      str += ss.str();
   }

   bool have_leading_zeros = false;

   if(number_of_digits == 0)
   {
      // We only get here if the output format is "fixed" and we just need to
      // round the first non-zero digit.
      number_of_digits -= my_exp + 1; // reset to original value
      str.insert(static_cast<std::string::size_type>(0), std::string::size_type(number_of_digits), '0');
      have_leading_zeros = true;
   }

   if(number_of_digits < 0)
   {
      str = "0";
      if(isneg())
         str.insert(static_cast<std::string::size_type>(0), 1, '-');
      boost::multiprecision::detail::format_float_string(str, 0, number_of_digits - my_exp - 1, f, this->iszero());
      return str;
   }
   else
   {
      // Cut the output to the size of the precision.
      if(str.length() > static_cast<std::string::size_type>(number_of_digits))
      {
         // Get the digit after the last needed digit for rounding
         const boost::uint32_t round = static_cast<boost::uint32_t>(static_cast<boost::uint32_t>(str[static_cast<std::string::size_type>(number_of_digits)]) - static_cast<boost::uint32_t>('0'));

         bool need_round_up = round >= 5u;

         if(round == 5u)
         {
            const boost::uint32_t ix = static_cast<boost::uint32_t>(static_cast<boost::uint32_t>(str[static_cast<std::string::size_type>(number_of_digits - 1)]) - static_cast<boost::uint32_t>('0'));
            if((ix & 1u) == 0)
            {
               // We have an even digit followed by a 5, so we might not actually need to round up
               // if all the remaining digits are zero:
               if(str.find_first_not_of('0', static_cast<std::string::size_type>(number_of_digits + 1)) == std::string::npos)
               {
                  bool all_zeros = true;
                  // No none-zero trailing digits in the string, now check whatever parts we didn't convert to the string:
                  for(std::size_t i = number_of_elements; i < data.size(); i++)
                  {
                     if(data[i])
                     {
                        all_zeros = false;
                        break;
                     }
                  }
                  if(all_zeros)
                     need_round_up = false; // tie break - round to even.
               }
            }
         }

         // Truncate the string
         str.erase(static_cast<std::string::size_type>(number_of_digits));

         if(need_round_up)
         {
            std::size_t ix = static_cast<std::size_t>(str.length() - 1u);

            // Every trailing 9 must be rounded up
            while(ix && (static_cast<boost::int32_t>(str.at(ix)) - static_cast<boost::int32_t>('0') == static_cast<boost::int32_t>(9)))
            {
               str.at(ix) = static_cast<char>('0');
               --ix;
            }

            if(!ix)
            {
               // There were nothing but trailing nines.
               if(static_cast<boost::int32_t>(static_cast<boost::int32_t>(str.at(ix)) - static_cast<boost::int32_t>(0x30)) == static_cast<boost::int32_t>(9))
               {
                  // Increment up to the next order and adjust exponent.
                  str.at(ix) = static_cast<char>('1');
                  ++my_exp;
               }
               else
               {
                  // Round up this digit.
                  ++str.at(ix);
               }
            }
            else
            {
               // Round up the last digit.
               ++str[ix];
            }
         }
      }
   }

   if(have_leading_zeros)
   {
      // We need to take the zeros back out again, and correct the exponent
      // if we rounded up:
      if(str[std::string::size_type(number_of_digits - 1)] != '0')
      {
         ++my_exp;
         str.erase(0, std::string::size_type(number_of_digits - 1));
      }
      else
         str.erase(0, std::string::size_type(number_of_digits));
   }

   if(isneg())
      str.insert(static_cast<std::string::size_type>(0), 1, '-');

   boost::multiprecision::detail::format_float_string(str, my_exp, org_digits, f, this->iszero());
   return str;
}

template <unsigned Digits10, class ExponentType, class Allocator>
bool cpp_dec_float<Digits10, ExponentType, Allocator>::rd_string(const char* const s)
{
#ifndef BOOST_NO_EXCEPTIONS
   try{
#endif

   std::string str(s);

   // TBD: Using several regular expressions may significantly reduce
   // the code complexity (and perhaps the run-time) of rd_string().

   // Get a possible exponent and remove it.
   exp = static_cast<ExponentType>(0);

   std::size_t pos;

   if( ((pos = str.find('e')) != std::string::npos)
      || ((pos = str.find('E')) != std::string::npos)
      )
   {
      // Remove the exponent part from the string.
      exp = boost::lexical_cast<ExponentType>(static_cast<const char*>(str.c_str() + (pos + 1u)));
      str = str.substr(static_cast<std::size_t>(0u), pos);
   }

   // Get a possible +/- sign and remove it.
   neg = false;

   if(str.size())
   {
      if(str[0] == '-')
      {
         neg = true;
         str.erase(0, 1);
      }
      else if(str[0] == '+')
      {
         str.erase(0, 1);
      }
   }
   //
   // Special cases for infinities and NaN's:
   //
   if((str == "inf") || (str == "INF") || (str == "infinity") || (str == "INFINITY"))
   {
      if(neg)
      {
         *this = this->inf();
         this->negate();
      }
      else
         *this = this->inf();
      return true;
   }
   if((str.size() >= 3) && ((str.substr(0, 3) == "nan") || (str.substr(0, 3) == "NAN") || (str.substr(0, 3) == "NaN")))
   {
      *this = this->nan();
      return true;
   }

   // Remove the leading zeros for all input types.
   const std::string::iterator fwd_it_leading_zero = std::find_if(str.begin(), str.end(), char_is_nonzero_predicate);

   if(fwd_it_leading_zero != str.begin())
   {
      if(fwd_it_leading_zero == str.end())
      {
         // The string contains nothing but leading zeros.
         // This string represents zero.
         operator=(zero());
         return true;
      }
      else
      {
         str.erase(str.begin(), fwd_it_leading_zero);
      }
   }

   // Put the input string into the standard cpp_dec_float<Digits10, ExponentType, Allocator> input form
   // aaa.bbbbE+/-n, where aaa has 1...cpp_dec_float_elem_digits10, bbbb has an
   // even multiple of cpp_dec_float_elem_digits10 which are possibly zero padded
   // on the right-end, and n is a signed 64-bit integer which is an
   // even multiple of cpp_dec_float_elem_digits10.

   // Find a possible decimal point.
   pos = str.find(static_cast<char>('.'));

   if(pos != std::string::npos)
   {
      // Remove all trailing insignificant zeros.
      const std::string::const_reverse_iterator rit_non_zero = std::find_if(str.rbegin(), str.rend(), char_is_nonzero_predicate);

      if(rit_non_zero != static_cast<std::string::const_reverse_iterator>(str.rbegin()))
      {
         const std::string::size_type ofs = str.length() - std::distance<std::string::const_reverse_iterator>(str.rbegin(), rit_non_zero);
         str.erase(str.begin() + ofs, str.end());
      }

      // Check if the input is identically zero.
      if(str == std::string("."))
      {
         operator=(zero());
         return true;
      }

      // Remove leading significant zeros just after the decimal point
      // and adjust the exponent accordingly.
      // Note that the while-loop operates only on strings of the form ".000abcd..."
      // and peels away the zeros just after the decimal point.
      if(str.at(static_cast<std::size_t>(0u)) == static_cast<char>('.'))
      {
         const std::string::iterator it_non_zero = std::find_if(str.begin() + 1u, str.end(), char_is_nonzero_predicate);

         std::size_t delta_exp = static_cast<std::size_t>(0u);

         if(str.at(static_cast<std::size_t>(1u)) == static_cast<char>('0'))
         {
            delta_exp = std::distance<std::string::const_iterator>(str.begin() + 1u, it_non_zero);
         }

         // Bring one single digit into the mantissa and adjust the exponent accordingly.
         str.erase(str.begin(), it_non_zero);
         str.insert(static_cast<std::string::size_type>(1u), ".");
         exp -= static_cast<ExponentType>(delta_exp + 1u);
      }
   }
   else
   {
      // Input string has no decimal point: Append decimal point.
      str.append(".");
   }

   // Shift the decimal point such that the exponent is an even multiple of cpp_dec_float_elem_digits10.
   std::size_t n_shift = static_cast<std::size_t>(0u);
   const std::size_t n_exp_rem = static_cast<std::size_t>(exp % static_cast<ExponentType>(cpp_dec_float_elem_digits10));

   if((exp % static_cast<ExponentType>(cpp_dec_float_elem_digits10)) != static_cast<ExponentType>(0))
   {
      n_shift = ((exp < static_cast<ExponentType>(0))
         ? static_cast<std::size_t>(n_exp_rem + static_cast<std::size_t>(cpp_dec_float_elem_digits10))
         : static_cast<std::size_t>(n_exp_rem));
   }

   // Make sure that there are enough digits for the decimal point shift.
   pos = str.find(static_cast<char>('.'));

   std::size_t pos_plus_one = static_cast<std::size_t>(pos + 1u);

   if((str.length() - pos_plus_one) < n_shift)
   {
      const std::size_t sz = static_cast<std::size_t>(n_shift - (str.length() - pos_plus_one));

      str.append(std::string(sz, static_cast<char>('0')));
   }

   // Do the decimal point shift.
   if(n_shift != static_cast<std::size_t>(0u))
   {
      str.insert(static_cast<std::string::size_type>(pos_plus_one + n_shift), ".");

      str.erase(pos, static_cast<std::string::size_type>(1u));

      exp -= static_cast<ExponentType>(n_shift);
   }

   // Cut the size of the mantissa to <= cpp_dec_float_elem_digits10.
   pos = str.find(static_cast<char>('.'));
   pos_plus_one = static_cast<std::size_t>(pos + 1u);

   if(pos > static_cast<std::size_t>(cpp_dec_float_elem_digits10))
   {
      const boost::int32_t n_pos = static_cast<boost::int32_t>(pos);
      const boost::int32_t n_rem_is_zero = ((static_cast<boost::int32_t>(n_pos % cpp_dec_float_elem_digits10) == static_cast<boost::int32_t>(0)) ? static_cast<boost::int32_t>(1) : static_cast<boost::int32_t>(0));
      const boost::int32_t n = static_cast<boost::int32_t>(static_cast<boost::int32_t>(n_pos / cpp_dec_float_elem_digits10) - n_rem_is_zero);

      str.insert(static_cast<std::size_t>(static_cast<boost::int32_t>(n_pos - static_cast<boost::int32_t>(n * cpp_dec_float_elem_digits10))), ".");

      str.erase(pos_plus_one, static_cast<std::size_t>(1u));

      exp += static_cast<ExponentType>(static_cast<ExponentType>(n) * static_cast<ExponentType>(cpp_dec_float_elem_digits10));
   }

   // Pad the decimal part such that its value is an even
   // multiple of cpp_dec_float_elem_digits10.
   pos = str.find(static_cast<char>('.'));
   pos_plus_one = static_cast<std::size_t>(pos + 1u);

   const boost::int32_t n_dec = static_cast<boost::int32_t>(static_cast<boost::int32_t>(str.length() - 1u) - static_cast<boost::int32_t>(pos));
   const boost::int32_t n_rem = static_cast<boost::int32_t>(n_dec % cpp_dec_float_elem_digits10);

   boost::int32_t n_cnt = ((n_rem != static_cast<boost::int32_t>(0))
                             ? static_cast<boost::int32_t>(cpp_dec_float_elem_digits10 - n_rem)
                             : static_cast<boost::int32_t>(0));

   if(n_cnt != static_cast<boost::int32_t>(0))
   {
      str.append(static_cast<std::size_t>(n_cnt), static_cast<char>('0'));
   }

   // Truncate decimal part if it is too long.
   const std::size_t max_dec = static_cast<std::size_t>((cpp_dec_float_elem_number - 1) * cpp_dec_float_elem_digits10);

   if(static_cast<std::size_t>(str.length() - pos) > max_dec)
   {
      str = str.substr(static_cast<std::size_t>(0u),
         static_cast<std::size_t>(pos_plus_one + max_dec));
   }

   // Now the input string has the standard cpp_dec_float<Digits10, ExponentType, Allocator> input form.
   // (See the comment above.)

   // Set all the data elements to 0.
   std::fill(data.begin(), data.end(), static_cast<boost::uint32_t>(0u));

   // Extract the data.

   // First get the digits to the left of the decimal point...
   data[0u] = boost::lexical_cast<boost::uint32_t>(str.substr(static_cast<std::size_t>(0u), pos));

   // ...then get the remaining digits to the right of the decimal point.
   const std::string::size_type i_end = ((str.length() - pos_plus_one) / static_cast<std::string::size_type>(cpp_dec_float_elem_digits10));

   for(std::string::size_type i = static_cast<std::string::size_type>(0u); i < i_end; i++)
   {
      const std::string::const_iterator it = str.begin()
         + pos_plus_one
         + (i * static_cast<std::string::size_type>(cpp_dec_float_elem_digits10));

      data[i + 1u] = boost::lexical_cast<boost::uint32_t>(std::string(it, it + static_cast<std::string::size_type>(cpp_dec_float_elem_digits10)));
   }

   // Check for overflow...
   if(exp > cpp_dec_float_max_exp10)
   {
      const bool b_result_is_neg = neg;

      *this = inf();
      if(b_result_is_neg)
         negate();
   }

   // ...and check for underflow.
   if(exp <= cpp_dec_float_min_exp10)
   {
      if(exp == cpp_dec_float_min_exp10)
      {
         // Check for identity with the minimum value.
         cpp_dec_float<Digits10, ExponentType, Allocator> test = *this;

         test.exp = static_cast<ExponentType>(0);

         if(test.isone())
         {
            *this = zero();
         }
      }
      else
      {
         *this = zero();
      }
   }

#ifndef BOOST_NO_EXCEPTIONS
   }
   catch(const bad_lexical_cast&)
   {
      // Rethrow with better error message:
      std::string msg = "Unable to parse the string \"";
      msg += s;
      msg += "\" as a floating point value.";
      throw std::runtime_error(msg);
   }
#endif
   return true;
}

template <unsigned Digits10, class ExponentType, class Allocator>
cpp_dec_float<Digits10, ExponentType, Allocator>::cpp_dec_float(const double mantissa, const ExponentType exponent)
 : data (),
   exp  (static_cast<ExponentType>(0)),
   neg  (false),
   fpclass (cpp_dec_float_finite),
   prec_elem(cpp_dec_float_elem_number)
{
   // Create *this cpp_dec_float<Digits10, ExponentType, Allocator> from a given mantissa and exponent.
   // Note: This constructor does not maintain the full precision of double.

   const bool mantissa_is_iszero = (::fabs(mantissa) < ((std::numeric_limits<double>::min)() * (1.0 + std::numeric_limits<double>::epsilon())));

   if(mantissa_is_iszero)
   {
      std::fill(data.begin(), data.end(), static_cast<boost::uint32_t>(0u));
      return;
   }

   const bool b_neg = (mantissa < 0.0);

   double d = ((!b_neg) ? mantissa : -mantissa);
   ExponentType e = exponent;

   while(d > 10.0) { d /= 10.0; ++e; }
   while(d < 1.0) { d *= 10.0; --e; }

   boost::int32_t shift = static_cast<boost::int32_t>(e % static_cast<boost::int32_t>(cpp_dec_float_elem_digits10));

   while(static_cast<boost::int32_t>(shift-- % cpp_dec_float_elem_digits10) != static_cast<boost::int32_t>(0))
   {
      d *= 10.0;
      --e;
   }

   exp = e;
   neg = b_neg;

   std::fill(data.begin(), data.end(), static_cast<boost::uint32_t>(0u));

   static const boost::int32_t digit_ratio = static_cast<boost::int32_t>(static_cast<boost::int32_t>(std::numeric_limits<double>::digits10) / static_cast<boost::int32_t>(cpp_dec_float_elem_digits10));
   static const boost::int32_t digit_loops = static_cast<boost::int32_t>(digit_ratio + static_cast<boost::int32_t>(2));

   for(boost::int32_t i = static_cast<boost::int32_t>(0); i < digit_loops; i++)
   {
      boost::uint32_t n = static_cast<boost::uint32_t>(static_cast<boost::uint64_t>(d));
      data[i] = static_cast<boost::uint32_t>(n);
      d -= static_cast<double>(n);
      d *= static_cast<double>(cpp_dec_float_elem_mask);
   }
}

template <unsigned Digits10, class ExponentType, class Allocator>
cpp_dec_float<Digits10, ExponentType, Allocator>& cpp_dec_float<Digits10, ExponentType, Allocator>::operator= (long double a)
{
   // Christopher Kormanyos's original code used a cast to boost::long_long_type here, but that fails
   // when long double has more digits than a boost::long_long_type.
   using std::frexp;
   using std::ldexp;
   using std::floor;

   if(a == 0)
      return *this = zero();

   if(a == 1)
      return *this = one();

   if((boost::math::isinf)(a))
   {
      *this = inf();
      if(a < 0)
         this->negate();
      return *this;
   }

   if((boost::math::isnan)(a))
      return *this = nan();

   int e;
   long double f, term;
   *this = zero();

   f = frexp(a, &e);
   // See https://svn.boost.org/trac/boost/ticket/10924 for an example of why this may go wrong:
   BOOST_ASSERT((boost::math::isfinite)(f));

   static const int shift = std::numeric_limits<int>::digits - 1;

   while(f)
   {
      // extract int sized bits from f:
      f = ldexp(f, shift);
      BOOST_ASSERT((boost::math::isfinite)(f));
      term = floor(f);
      e -= shift;
      *this *= pow2(shift);
      if(term > 0)
         add_unsigned_long_long(static_cast<unsigned>(term));
      else
         sub_unsigned_long_long(static_cast<unsigned>(-term));
      f -= term;
   }

   if(e != 0)
      *this *= pow2(e);

   return *this;
}

template <unsigned Digits10, class ExponentType, class Allocator>
void cpp_dec_float<Digits10, ExponentType, Allocator>::from_unsigned_long_long(const boost::ulong_long_type u)
{
   std::fill(data.begin(), data.end(), static_cast<boost::uint32_t>(0u));

   exp = static_cast<ExponentType>(0);
   neg = false;
   fpclass = cpp_dec_float_finite;
   prec_elem = cpp_dec_float_elem_number;

   std::size_t i =static_cast<std::size_t>(0u);

   boost::ulong_long_type uu = u;

   boost::uint32_t temp[(std::numeric_limits<boost::ulong_long_type>::digits10 / static_cast<int>(cpp_dec_float_elem_digits10)) + 3] = { static_cast<boost::uint32_t>(0u) };

   while(uu != static_cast<boost::ulong_long_type>(0u))
   {
      temp[i] = static_cast<boost::uint32_t>(uu % static_cast<boost::ulong_long_type>(cpp_dec_float_elem_mask));
      uu = static_cast<boost::ulong_long_type>(uu / static_cast<boost::ulong_long_type>(cpp_dec_float_elem_mask));
      ++i;
   }

   if(i > static_cast<std::size_t>(1u))
   {
      exp += static_cast<ExponentType>((i - 1u) * static_cast<std::size_t>(cpp_dec_float_elem_digits10));
   }

   std::reverse(temp, temp + i);
   std::copy(temp, temp + (std::min)(i, static_cast<std::size_t>(cpp_dec_float_elem_number)), data.begin());
}

template <unsigned Digits10, class ExponentType, class Allocator>
boost::uint32_t cpp_dec_float<Digits10, ExponentType, Allocator>::mul_loop_uv(boost::uint32_t* const u, const boost::uint32_t* const v, const boost::int32_t p)
{
   //
   // There is a limit on how many limbs this algorithm can handle without dropping digits
   // due to overflow in the carry, it is:
   //
   // FLOOR( (2^64 - 1) / (10^8 * 10^8) ) == 1844
   //
   BOOST_STATIC_ASSERT_MSG(cpp_dec_float_elem_number < 1800, "Too many limbs in the data type for the multiplication algorithm - unsupported precision in cpp_dec_float.");

   boost::uint64_t carry = static_cast<boost::uint64_t>(0u);

   for(boost::int32_t j = static_cast<boost::int32_t>(p - 1u); j >= static_cast<boost::int32_t>(0); j--)
   {
     boost::uint64_t sum = carry;

     for(boost::int32_t i = j; i >= static_cast<boost::int32_t>(0); i--)
     {
       sum += static_cast<boost::uint64_t>(u[j - i] * static_cast<boost::uint64_t>(v[i]));
     }

     u[j] = static_cast<boost::uint32_t>(sum % static_cast<boost::uint32_t>(cpp_dec_float_elem_mask));
     carry = static_cast<boost::uint64_t>(sum / static_cast<boost::uint32_t>(cpp_dec_float_elem_mask));
   }

   return static_cast<boost::uint32_t>(carry);
}

template <unsigned Digits10, class ExponentType, class Allocator>
boost::uint32_t cpp_dec_float<Digits10, ExponentType, Allocator>::mul_loop_n(boost::uint32_t* const u, boost::uint32_t n, const boost::int32_t p)
{
   boost::uint64_t carry = static_cast<boost::uint64_t>(0u);

   // Multiplication loop.
   for(boost::int32_t j = p - 1; j >= static_cast<boost::int32_t>(0); j--)
   {
      const boost::uint64_t t = static_cast<boost::uint64_t>(carry + static_cast<boost::uint64_t>(u[j] * static_cast<boost::uint64_t>(n)));
      carry = static_cast<boost::uint64_t>(t / static_cast<boost::uint32_t>(cpp_dec_float_elem_mask));
      u[j] = static_cast<boost::uint32_t>(t - static_cast<boost::uint64_t>(static_cast<boost::uint32_t>(cpp_dec_float_elem_mask) * static_cast<boost::uint64_t>(carry)));
   }

   return static_cast<boost::uint32_t>(carry);
}

template <unsigned Digits10, class ExponentType, class Allocator>
boost::uint32_t cpp_dec_float<Digits10, ExponentType, Allocator>::div_loop_n(boost::uint32_t* const u, boost::uint32_t n, const boost::int32_t p)
{
   boost::uint64_t prev = static_cast<boost::uint64_t>(0u);

   for(boost::int32_t j = static_cast<boost::int32_t>(0); j < p; j++)
   {
      const boost::uint64_t t = static_cast<boost::uint64_t>(u[j] + static_cast<boost::uint64_t>(prev * static_cast<boost::uint32_t>(cpp_dec_float_elem_mask)));
      u[j] = static_cast<boost::uint32_t>(t / n);
      prev = static_cast<boost::uint64_t>(t - static_cast<boost::uint64_t>(n * static_cast<boost::uint64_t>(u[j])));
   }

   return static_cast<boost::uint32_t>(prev);
}

template <unsigned Digits10, class ExponentType, class Allocator>
cpp_dec_float<Digits10, ExponentType, Allocator> cpp_dec_float<Digits10, ExponentType, Allocator>::pow2(const boost::long_long_type p)
{
   // Create a static const table of p^2 for -128 < p < +128.
   // Note: The size of this table must be odd-numbered and
   // symmetric about 0.
   init.do_nothing();
   static const boost::array<cpp_dec_float<Digits10, ExponentType, Allocator>, 255u> p2_data =
   {{
       cpp_dec_float("5.877471754111437539843682686111228389093327783860437607543758531392086297273635864257812500000000000e-39"),
       cpp_dec_float("1.175494350822287507968736537222245677818665556772087521508751706278417259454727172851562500000000000e-38"),
       cpp_dec_float("2.350988701644575015937473074444491355637331113544175043017503412556834518909454345703125000000000000e-38"),
       cpp_dec_float("4.701977403289150031874946148888982711274662227088350086035006825113669037818908691406250000000000000e-38"),
       cpp_dec_float("9.403954806578300063749892297777965422549324454176700172070013650227338075637817382812500000000000000e-38"),
       cpp_dec_float("1.880790961315660012749978459555593084509864890835340034414002730045467615127563476562500000000000000e-37"),
       cpp_dec_float("3.761581922631320025499956919111186169019729781670680068828005460090935230255126953125000000000000000e-37"),
       cpp_dec_float("7.523163845262640050999913838222372338039459563341360137656010920181870460510253906250000000000000000e-37"),
       cpp_dec_float("1.504632769052528010199982767644474467607891912668272027531202184036374092102050781250000000000000000e-36"),
       cpp_dec_float("3.009265538105056020399965535288948935215783825336544055062404368072748184204101562500000000000000000e-36"),
       cpp_dec_float("6.018531076210112040799931070577897870431567650673088110124808736145496368408203125000000000000000000e-36"),
       cpp_dec_float("1.203706215242022408159986214115579574086313530134617622024961747229099273681640625000000000000000000e-35"),
       cpp_dec_float("2.407412430484044816319972428231159148172627060269235244049923494458198547363281250000000000000000000e-35"),
       cpp_dec_float("4.814824860968089632639944856462318296345254120538470488099846988916397094726562500000000000000000000e-35"),
       cpp_dec_float("9.629649721936179265279889712924636592690508241076940976199693977832794189453125000000000000000000000e-35"),
       cpp_dec_float("1.925929944387235853055977942584927318538101648215388195239938795566558837890625000000000000000000000e-34"),
       cpp_dec_float("3.851859888774471706111955885169854637076203296430776390479877591133117675781250000000000000000000000e-34"),
       cpp_dec_float("7.703719777548943412223911770339709274152406592861552780959755182266235351562500000000000000000000000e-34"),
       cpp_dec_float("1.540743955509788682444782354067941854830481318572310556191951036453247070312500000000000000000000000e-33"),
       cpp_dec_float("3.081487911019577364889564708135883709660962637144621112383902072906494140625000000000000000000000000e-33"),
       cpp_dec_float("6.162975822039154729779129416271767419321925274289242224767804145812988281250000000000000000000000000e-33"),
       cpp_dec_float("1.232595164407830945955825883254353483864385054857848444953560829162597656250000000000000000000000000e-32"),
       cpp_dec_float("2.465190328815661891911651766508706967728770109715696889907121658325195312500000000000000000000000000e-32"),
       cpp_dec_float("4.930380657631323783823303533017413935457540219431393779814243316650390625000000000000000000000000000e-32"),
       cpp_dec_float("9.860761315262647567646607066034827870915080438862787559628486633300781250000000000000000000000000000e-32"),
       cpp_dec_float("1.972152263052529513529321413206965574183016087772557511925697326660156250000000000000000000000000000e-31"),
       cpp_dec_float("3.944304526105059027058642826413931148366032175545115023851394653320312500000000000000000000000000000e-31"),
       cpp_dec_float("7.888609052210118054117285652827862296732064351090230047702789306640625000000000000000000000000000000e-31"),
       cpp_dec_float("1.577721810442023610823457130565572459346412870218046009540557861328125000000000000000000000000000000e-30"),
       cpp_dec_float("3.155443620884047221646914261131144918692825740436092019081115722656250000000000000000000000000000000e-30"),
       cpp_dec_float("6.310887241768094443293828522262289837385651480872184038162231445312500000000000000000000000000000000e-30"),
       cpp_dec_float("1.262177448353618888658765704452457967477130296174436807632446289062500000000000000000000000000000000e-29"),
       cpp_dec_float("2.524354896707237777317531408904915934954260592348873615264892578125000000000000000000000000000000000e-29"),
       cpp_dec_float("5.048709793414475554635062817809831869908521184697747230529785156250000000000000000000000000000000000e-29"),
       cpp_dec_float("1.009741958682895110927012563561966373981704236939549446105957031250000000000000000000000000000000000e-28"),
       cpp_dec_float("2.019483917365790221854025127123932747963408473879098892211914062500000000000000000000000000000000000e-28"),
       cpp_dec_float("4.038967834731580443708050254247865495926816947758197784423828125000000000000000000000000000000000000e-28"),
       cpp_dec_float("8.077935669463160887416100508495730991853633895516395568847656250000000000000000000000000000000000000e-28"),
       cpp_dec_float("1.615587133892632177483220101699146198370726779103279113769531250000000000000000000000000000000000000e-27"),
       cpp_dec_float("3.231174267785264354966440203398292396741453558206558227539062500000000000000000000000000000000000000e-27"),
       cpp_dec_float("6.462348535570528709932880406796584793482907116413116455078125000000000000000000000000000000000000000e-27"),
       cpp_dec_float("1.292469707114105741986576081359316958696581423282623291015625000000000000000000000000000000000000000e-26"),
       cpp_dec_float("2.584939414228211483973152162718633917393162846565246582031250000000000000000000000000000000000000000e-26"),
       cpp_dec_float("5.169878828456422967946304325437267834786325693130493164062500000000000000000000000000000000000000000e-26"),
       cpp_dec_float("1.033975765691284593589260865087453566957265138626098632812500000000000000000000000000000000000000000e-25"),
       cpp_dec_float("2.067951531382569187178521730174907133914530277252197265625000000000000000000000000000000000000000000e-25"),
       cpp_dec_float("4.135903062765138374357043460349814267829060554504394531250000000000000000000000000000000000000000000e-25"),
       cpp_dec_float("8.271806125530276748714086920699628535658121109008789062500000000000000000000000000000000000000000000e-25"),
       cpp_dec_float("1.654361225106055349742817384139925707131624221801757812500000000000000000000000000000000000000000000e-24"),
       cpp_dec_float("3.308722450212110699485634768279851414263248443603515625000000000000000000000000000000000000000000000e-24"),
       cpp_dec_float("6.617444900424221398971269536559702828526496887207031250000000000000000000000000000000000000000000000e-24"),
       cpp_dec_float("1.323488980084844279794253907311940565705299377441406250000000000000000000000000000000000000000000000e-23"),
       cpp_dec_float("2.646977960169688559588507814623881131410598754882812500000000000000000000000000000000000000000000000e-23"),
       cpp_dec_float("5.293955920339377119177015629247762262821197509765625000000000000000000000000000000000000000000000000e-23"),
       cpp_dec_float("1.058791184067875423835403125849552452564239501953125000000000000000000000000000000000000000000000000e-22"),
       cpp_dec_float("2.117582368135750847670806251699104905128479003906250000000000000000000000000000000000000000000000000e-22"),
       cpp_dec_float("4.235164736271501695341612503398209810256958007812500000000000000000000000000000000000000000000000000e-22"),
       cpp_dec_float("8.470329472543003390683225006796419620513916015625000000000000000000000000000000000000000000000000000e-22"),
       cpp_dec_float("1.694065894508600678136645001359283924102783203125000000000000000000000000000000000000000000000000000e-21"),
       cpp_dec_float("3.388131789017201356273290002718567848205566406250000000000000000000000000000000000000000000000000000e-21"),
       cpp_dec_float("6.776263578034402712546580005437135696411132812500000000000000000000000000000000000000000000000000000e-21"),
       cpp_dec_float("1.355252715606880542509316001087427139282226562500000000000000000000000000000000000000000000000000000e-20"),
       cpp_dec_float("2.710505431213761085018632002174854278564453125000000000000000000000000000000000000000000000000000000e-20"),
       cpp_dec_float("5.421010862427522170037264004349708557128906250000000000000000000000000000000000000000000000000000000e-20"),
       cpp_dec_float("1.084202172485504434007452800869941711425781250000000000000000000000000000000000000000000000000000000e-19"),
       cpp_dec_float("2.168404344971008868014905601739883422851562500000000000000000000000000000000000000000000000000000000e-19"),
       cpp_dec_float("4.336808689942017736029811203479766845703125000000000000000000000000000000000000000000000000000000000e-19"),
       cpp_dec_float("8.673617379884035472059622406959533691406250000000000000000000000000000000000000000000000000000000000e-19"),
       cpp_dec_float("1.734723475976807094411924481391906738281250000000000000000000000000000000000000000000000000000000000e-18"),
       cpp_dec_float("3.469446951953614188823848962783813476562500000000000000000000000000000000000000000000000000000000000e-18"),
       cpp_dec_float("6.938893903907228377647697925567626953125000000000000000000000000000000000000000000000000000000000000e-18"),
       cpp_dec_float("1.387778780781445675529539585113525390625000000000000000000000000000000000000000000000000000000000000e-17"),
       cpp_dec_float("2.775557561562891351059079170227050781250000000000000000000000000000000000000000000000000000000000000e-17"),
       cpp_dec_float("5.551115123125782702118158340454101562500000000000000000000000000000000000000000000000000000000000000e-17"),
       cpp_dec_float("1.110223024625156540423631668090820312500000000000000000000000000000000000000000000000000000000000000e-16"),
       cpp_dec_float("2.220446049250313080847263336181640625000000000000000000000000000000000000000000000000000000000000000e-16"),
       cpp_dec_float("4.440892098500626161694526672363281250000000000000000000000000000000000000000000000000000000000000000e-16"),
       cpp_dec_float("8.881784197001252323389053344726562500000000000000000000000000000000000000000000000000000000000000000e-16"),
       cpp_dec_float("1.776356839400250464677810668945312500000000000000000000000000000000000000000000000000000000000000000e-15"),
       cpp_dec_float("3.552713678800500929355621337890625000000000000000000000000000000000000000000000000000000000000000000e-15"),
       cpp_dec_float("7.105427357601001858711242675781250000000000000000000000000000000000000000000000000000000000000000000e-15"),
       cpp_dec_float("1.421085471520200371742248535156250000000000000000000000000000000000000000000000000000000000000000000e-14"),
       cpp_dec_float("2.842170943040400743484497070312500000000000000000000000000000000000000000000000000000000000000000000e-14"),
       cpp_dec_float("5.684341886080801486968994140625000000000000000000000000000000000000000000000000000000000000000000000e-14"),
       cpp_dec_float("1.136868377216160297393798828125000000000000000000000000000000000000000000000000000000000000000000000e-13"),
       cpp_dec_float("2.273736754432320594787597656250000000000000000000000000000000000000000000000000000000000000000000000e-13"),
       cpp_dec_float("4.547473508864641189575195312500000000000000000000000000000000000000000000000000000000000000000000000e-13"),
       cpp_dec_float("9.094947017729282379150390625000000000000000000000000000000000000000000000000000000000000000000000000e-13"),
       cpp_dec_float("1.818989403545856475830078125000000000000000000000000000000000000000000000000000000000000000000000000e-12"),
       cpp_dec_float("3.637978807091712951660156250000000000000000000000000000000000000000000000000000000000000000000000000e-12"),
       cpp_dec_float("7.275957614183425903320312500000000000000000000000000000000000000000000000000000000000000000000000000e-12"),
       cpp_dec_float("1.455191522836685180664062500000000000000000000000000000000000000000000000000000000000000000000000000e-11"),
       cpp_dec_float("2.910383045673370361328125000000000000000000000000000000000000000000000000000000000000000000000000000e-11"),
       cpp_dec_float("5.820766091346740722656250000000000000000000000000000000000000000000000000000000000000000000000000000e-11"),
       cpp_dec_float("1.164153218269348144531250000000000000000000000000000000000000000000000000000000000000000000000000000e-10"),
       cpp_dec_float("2.328306436538696289062500000000000000000000000000000000000000000000000000000000000000000000000000000e-10"),
       cpp_dec_float("4.656612873077392578125000000000000000000000000000000000000000000000000000000000000000000000000000000e-10"),
       cpp_dec_float("9.313225746154785156250000000000000000000000000000000000000000000000000000000000000000000000000000000e-10"),
       cpp_dec_float("1.862645149230957031250000000000000000000000000000000000000000000000000000000000000000000000000000000e-9"),
       cpp_dec_float("3.725290298461914062500000000000000000000000000000000000000000000000000000000000000000000000000000000e-9"),
       cpp_dec_float("7.450580596923828125000000000000000000000000000000000000000000000000000000000000000000000000000000000e-9"),
       cpp_dec_float("1.490116119384765625000000000000000000000000000000000000000000000000000000000000000000000000000000000e-8"),
       cpp_dec_float("2.980232238769531250000000000000000000000000000000000000000000000000000000000000000000000000000000000e-8"),
       cpp_dec_float("5.960464477539062500000000000000000000000000000000000000000000000000000000000000000000000000000000000e-8"),
       cpp_dec_float("1.192092895507812500000000000000000000000000000000000000000000000000000000000000000000000000000000000e-7"),
       cpp_dec_float("2.384185791015625000000000000000000000000000000000000000000000000000000000000000000000000000000000000e-7"),
       cpp_dec_float("4.768371582031250000000000000000000000000000000000000000000000000000000000000000000000000000000000000e-7"),
       cpp_dec_float("9.536743164062500000000000000000000000000000000000000000000000000000000000000000000000000000000000000e-7"),
       cpp_dec_float("1.907348632812500000000000000000000000000000000000000000000000000000000000000000000000000000000000000e-6"),
       cpp_dec_float("3.814697265625000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e-6"),
       cpp_dec_float("7.629394531250000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e-6"),
       cpp_dec_float("0.000015258789062500000000000000000000000000000000000000000000000000000000000000000000000000000000000000"),
       cpp_dec_float("0.000030517578125000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"),
       cpp_dec_float("0.000061035156250000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"),
       cpp_dec_float("0.000122070312500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"),
       cpp_dec_float("0.000244140625000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"),
       cpp_dec_float("0.000488281250000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"),
       cpp_dec_float("0.000976562500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"),
       cpp_dec_float("0.001953125000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"),
       cpp_dec_float("0.003906250000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"),
       cpp_dec_float("0.007812500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"),
       cpp_dec_float("0.01562500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"),
       cpp_dec_float("0.03125000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"),
       cpp_dec_float("0.06250000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"),
       cpp_dec_float("0.125"),
       cpp_dec_float("0.25"),
       cpp_dec_float("0.5"),
       one(),
       two(),
       cpp_dec_float(static_cast<boost::ulong_long_type>(4)),
       cpp_dec_float(static_cast<boost::ulong_long_type>(8)),
       cpp_dec_float(static_cast<boost::ulong_long_type>(16)),
       cpp_dec_float(static_cast<boost::ulong_long_type>(32)),
       cpp_dec_float(static_cast<boost::ulong_long_type>(64)),
       cpp_dec_float(static_cast<boost::ulong_long_type>(128)),
       cpp_dec_float(static_cast<boost::ulong_long_type>(256)),
       cpp_dec_float(static_cast<boost::ulong_long_type>(512)),
       cpp_dec_float(static_cast<boost::ulong_long_type>(1024)),
       cpp_dec_float(static_cast<boost::ulong_long_type>(2048)),
       cpp_dec_float(static_cast<boost::ulong_long_type>(4096)),
       cpp_dec_float(static_cast<boost::ulong_long_type>(8192)),
       cpp_dec_float(static_cast<boost::ulong_long_type>(16384)),
       cpp_dec_float(static_cast<boost::ulong_long_type>(32768)),
       cpp_dec_float(static_cast<boost::ulong_long_type>(65536)),
       cpp_dec_float(static_cast<boost::ulong_long_type>(131072)),
       cpp_dec_float(static_cast<boost::ulong_long_type>(262144)),
       cpp_dec_float(static_cast<boost::ulong_long_type>(524288)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uL << 20u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uL << 21u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uL << 22u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uL << 23u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uL << 24u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uL << 25u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uL << 26u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uL << 27u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uL << 28u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uL << 29u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uL << 30u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uL << 31u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 32u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 33u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 34u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 35u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 36u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 37u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 38u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 39u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 40u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 41u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 42u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 43u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 44u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 45u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 46u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 47u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 48u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 49u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 50u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 51u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 52u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 53u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 54u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 55u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 56u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 57u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 58u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 59u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 60u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 61u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 62u)),
       cpp_dec_float(static_cast<boost::uint64_t>(1uLL << 63u)),
       cpp_dec_float("1.844674407370955161600000000000000000000000000000000000000000000000000000000000000000000000000000000e19"),
       cpp_dec_float("3.689348814741910323200000000000000000000000000000000000000000000000000000000000000000000000000000000e19"),
       cpp_dec_float("7.378697629483820646400000000000000000000000000000000000000000000000000000000000000000000000000000000e19"),
       cpp_dec_float("1.475739525896764129280000000000000000000000000000000000000000000000000000000000000000000000000000000e20"),
       cpp_dec_float("2.951479051793528258560000000000000000000000000000000000000000000000000000000000000000000000000000000e20"),
       cpp_dec_float("5.902958103587056517120000000000000000000000000000000000000000000000000000000000000000000000000000000e20"),
       cpp_dec_float("1.180591620717411303424000000000000000000000000000000000000000000000000000000000000000000000000000000e21"),
       cpp_dec_float("2.361183241434822606848000000000000000000000000000000000000000000000000000000000000000000000000000000e21"),
       cpp_dec_float("4.722366482869645213696000000000000000000000000000000000000000000000000000000000000000000000000000000e21"),
       cpp_dec_float("9.444732965739290427392000000000000000000000000000000000000000000000000000000000000000000000000000000e21"),
       cpp_dec_float("1.888946593147858085478400000000000000000000000000000000000000000000000000000000000000000000000000000e22"),
       cpp_dec_float("3.777893186295716170956800000000000000000000000000000000000000000000000000000000000000000000000000000e22"),
       cpp_dec_float("7.555786372591432341913600000000000000000000000000000000000000000000000000000000000000000000000000000e22"),
       cpp_dec_float("1.511157274518286468382720000000000000000000000000000000000000000000000000000000000000000000000000000e23"),
       cpp_dec_float("3.022314549036572936765440000000000000000000000000000000000000000000000000000000000000000000000000000e23"),
       cpp_dec_float("6.044629098073145873530880000000000000000000000000000000000000000000000000000000000000000000000000000e23"),
       cpp_dec_float("1.208925819614629174706176000000000000000000000000000000000000000000000000000000000000000000000000000e24"),
       cpp_dec_float("2.417851639229258349412352000000000000000000000000000000000000000000000000000000000000000000000000000e24"),
       cpp_dec_float("4.835703278458516698824704000000000000000000000000000000000000000000000000000000000000000000000000000e24"),
       cpp_dec_float("9.671406556917033397649408000000000000000000000000000000000000000000000000000000000000000000000000000e24"),
       cpp_dec_float("1.934281311383406679529881600000000000000000000000000000000000000000000000000000000000000000000000000e25"),
       cpp_dec_float("3.868562622766813359059763200000000000000000000000000000000000000000000000000000000000000000000000000e25"),
       cpp_dec_float("7.737125245533626718119526400000000000000000000000000000000000000000000000000000000000000000000000000e25"),
       cpp_dec_float("1.547425049106725343623905280000000000000000000000000000000000000000000000000000000000000000000000000e26"),
       cpp_dec_float("3.094850098213450687247810560000000000000000000000000000000000000000000000000000000000000000000000000e26"),
       cpp_dec_float("6.189700196426901374495621120000000000000000000000000000000000000000000000000000000000000000000000000e26"),
       cpp_dec_float("1.237940039285380274899124224000000000000000000000000000000000000000000000000000000000000000000000000e27"),
       cpp_dec_float("2.475880078570760549798248448000000000000000000000000000000000000000000000000000000000000000000000000e27"),
       cpp_dec_float("4.951760157141521099596496896000000000000000000000000000000000000000000000000000000000000000000000000e27"),
       cpp_dec_float("9.903520314283042199192993792000000000000000000000000000000000000000000000000000000000000000000000000e27"),
       cpp_dec_float("1.980704062856608439838598758400000000000000000000000000000000000000000000000000000000000000000000000e28"),
       cpp_dec_float("3.961408125713216879677197516800000000000000000000000000000000000000000000000000000000000000000000000e28"),
       cpp_dec_float("7.922816251426433759354395033600000000000000000000000000000000000000000000000000000000000000000000000e28"),
       cpp_dec_float("1.584563250285286751870879006720000000000000000000000000000000000000000000000000000000000000000000000e29"),
       cpp_dec_float("3.169126500570573503741758013440000000000000000000000000000000000000000000000000000000000000000000000e29"),
       cpp_dec_float("6.338253001141147007483516026880000000000000000000000000000000000000000000000000000000000000000000000e29"),
       cpp_dec_float("1.267650600228229401496703205376000000000000000000000000000000000000000000000000000000000000000000000e30"),
       cpp_dec_float("2.535301200456458802993406410752000000000000000000000000000000000000000000000000000000000000000000000e30"),
       cpp_dec_float("5.070602400912917605986812821504000000000000000000000000000000000000000000000000000000000000000000000e30"),
       cpp_dec_float("1.014120480182583521197362564300800000000000000000000000000000000000000000000000000000000000000000000e31"),
       cpp_dec_float("2.028240960365167042394725128601600000000000000000000000000000000000000000000000000000000000000000000e31"),
       cpp_dec_float("4.056481920730334084789450257203200000000000000000000000000000000000000000000000000000000000000000000e31"),
       cpp_dec_float("8.112963841460668169578900514406400000000000000000000000000000000000000000000000000000000000000000000e31"),
       cpp_dec_float("1.622592768292133633915780102881280000000000000000000000000000000000000000000000000000000000000000000e32"),
       cpp_dec_float("3.245185536584267267831560205762560000000000000000000000000000000000000000000000000000000000000000000e32"),
       cpp_dec_float("6.490371073168534535663120411525120000000000000000000000000000000000000000000000000000000000000000000e32"),
       cpp_dec_float("1.298074214633706907132624082305024000000000000000000000000000000000000000000000000000000000000000000e33"),
       cpp_dec_float("2.596148429267413814265248164610048000000000000000000000000000000000000000000000000000000000000000000e33"),
       cpp_dec_float("5.192296858534827628530496329220096000000000000000000000000000000000000000000000000000000000000000000e33"),
       cpp_dec_float("1.038459371706965525706099265844019200000000000000000000000000000000000000000000000000000000000000000e34"),
       cpp_dec_float("2.076918743413931051412198531688038400000000000000000000000000000000000000000000000000000000000000000e34"),
       cpp_dec_float("4.153837486827862102824397063376076800000000000000000000000000000000000000000000000000000000000000000e34"),
       cpp_dec_float("8.307674973655724205648794126752153600000000000000000000000000000000000000000000000000000000000000000e34"),
       cpp_dec_float("1.661534994731144841129758825350430720000000000000000000000000000000000000000000000000000000000000000e35"),
       cpp_dec_float("3.323069989462289682259517650700861440000000000000000000000000000000000000000000000000000000000000000e35"),
       cpp_dec_float("6.646139978924579364519035301401722880000000000000000000000000000000000000000000000000000000000000000e35"),
       cpp_dec_float("1.329227995784915872903807060280344576000000000000000000000000000000000000000000000000000000000000000e36"),
       cpp_dec_float("2.658455991569831745807614120560689152000000000000000000000000000000000000000000000000000000000000000e36"),
       cpp_dec_float("5.316911983139663491615228241121378304000000000000000000000000000000000000000000000000000000000000000e36"),
       cpp_dec_float("1.063382396627932698323045648224275660800000000000000000000000000000000000000000000000000000000000000e37"),
       cpp_dec_float("2.126764793255865396646091296448551321600000000000000000000000000000000000000000000000000000000000000e37"),
       cpp_dec_float("4.253529586511730793292182592897102643200000000000000000000000000000000000000000000000000000000000000e37"),
       cpp_dec_float("8.507059173023461586584365185794205286400000000000000000000000000000000000000000000000000000000000000e37"),
       cpp_dec_float("1.701411834604692317316873037158841057280000000000000000000000000000000000000000000000000000000000000e38")
   }};

   if((p > static_cast<boost::long_long_type>(-128)) && (p < static_cast<boost::long_long_type>(+128)))
   {
      return p2_data[static_cast<std::size_t>(p + ((p2_data.size() - 1u) / 2u))];
   }
   else
   {
      // Compute and return 2^p.
      if(p < static_cast<boost::long_long_type>(0))
      {
         return pow2(static_cast<boost::long_long_type>(-p)).calculate_inv();
      }
      else
      {
         cpp_dec_float<Digits10, ExponentType, Allocator> t;
         default_ops::detail::pow_imp(t, two(), p, mpl::true_());
         return t;
      }
   }
}


template <unsigned Digits10, class ExponentType, class Allocator>
inline void eval_add(cpp_dec_float<Digits10, ExponentType, Allocator>& result, const cpp_dec_float<Digits10, ExponentType, Allocator>& o)
{
   result += o;
}
template <unsigned Digits10, class ExponentType, class Allocator>
inline void eval_subtract(cpp_dec_float<Digits10, ExponentType, Allocator>& result, const cpp_dec_float<Digits10, ExponentType, Allocator>& o)
{
   result -= o;
}
template <unsigned Digits10, class ExponentType, class Allocator>
inline void eval_multiply(cpp_dec_float<Digits10, ExponentType, Allocator>& result, const cpp_dec_float<Digits10, ExponentType, Allocator>& o)
{
   result *= o;
}
template <unsigned Digits10, class ExponentType, class Allocator>
inline void eval_divide(cpp_dec_float<Digits10, ExponentType, Allocator>& result, const cpp_dec_float<Digits10, ExponentType, Allocator>& o)
{
   result /= o;
}

template <unsigned Digits10, class ExponentType, class Allocator>
inline void eval_add(cpp_dec_float<Digits10, ExponentType, Allocator>& result, const boost::ulong_long_type& o)
{
   result.add_unsigned_long_long(o);
}
template <unsigned Digits10, class ExponentType, class Allocator>
inline void eval_subtract(cpp_dec_float<Digits10, ExponentType, Allocator>& result, const boost::ulong_long_type& o)
{
   result.sub_unsigned_long_long(o);
}
template <unsigned Digits10, class ExponentType, class Allocator>
inline void eval_multiply(cpp_dec_float<Digits10, ExponentType, Allocator>& result, const boost::ulong_long_type& o)
{
   result.mul_unsigned_long_long(o);
}
template <unsigned Digits10, class ExponentType, class Allocator>
inline void eval_divide(cpp_dec_float<Digits10, ExponentType, Allocator>& result, const boost::ulong_long_type& o)
{
   result.div_unsigned_long_long(o);
}

template <unsigned Digits10, class ExponentType, class Allocator>
inline void eval_add(cpp_dec_float<Digits10, ExponentType, Allocator>& result, boost::long_long_type o)
{
   if(o < 0)
      result.sub_unsigned_long_long(boost::multiprecision::detail::unsigned_abs(o));
   else
      result.add_unsigned_long_long(o);
}
template <unsigned Digits10, class ExponentType, class Allocator>
inline void eval_subtract(cpp_dec_float<Digits10, ExponentType, Allocator>& result, boost::long_long_type o)
{
   if(o < 0)
      result.add_unsigned_long_long(boost::multiprecision::detail::unsigned_abs(o));
   else
      result.sub_unsigned_long_long(o);
}
template <unsigned Digits10, class ExponentType, class Allocator>
inline void eval_multiply(cpp_dec_float<Digits10, ExponentType, Allocator>& result, boost::long_long_type o)
{
   if(o < 0)
   {
      result.mul_unsigned_long_long(boost::multiprecision::detail::unsigned_abs(o));
      result.negate();
   }
   else
      result.mul_unsigned_long_long(o);
}
template <unsigned Digits10, class ExponentType, class Allocator>
inline void eval_divide(cpp_dec_float<Digits10, ExponentType, Allocator>& result, boost::long_long_type o)
{
   if(o < 0)
   {
      result.div_unsigned_long_long(boost::multiprecision::detail::unsigned_abs(o));
      result.negate();
   }
   else
      result.div_unsigned_long_long(o);
}

template <unsigned Digits10, class ExponentType, class Allocator>
inline void eval_convert_to(boost::ulong_long_type* result, const cpp_dec_float<Digits10, ExponentType, Allocator>& val)
{
   *result = val.extract_unsigned_long_long();
}
template <unsigned Digits10, class ExponentType, class Allocator>
inline void eval_convert_to(boost::long_long_type* result, const cpp_dec_float<Digits10, ExponentType, Allocator>& val)
{
   *result = val.extract_signed_long_long();
}
template <unsigned Digits10, class ExponentType, class Allocator>
inline void eval_convert_to(long double* result, cpp_dec_float<Digits10, ExponentType, Allocator>& val)
{
   *result = val.extract_long_double();
}

//
// Non member function support:
//
template <unsigned Digits10, class ExponentType, class Allocator>
inline int eval_fpclassify(const cpp_dec_float<Digits10, ExponentType, Allocator>& x)
{
   if((x.isinf)())
      return FP_INFINITE;
   if((x.isnan)())
      return FP_NAN;
   if(x.iszero())
      return FP_ZERO;
   return FP_NORMAL;
}

template <unsigned Digits10, class ExponentType, class Allocator>
inline void eval_abs(cpp_dec_float<Digits10, ExponentType, Allocator>& result, const cpp_dec_float<Digits10, ExponentType, Allocator>& x)
{
   result = x;
   if(x.isneg())
      result.negate();
}

template <unsigned Digits10, class ExponentType, class Allocator>
inline void eval_fabs(cpp_dec_float<Digits10, ExponentType, Allocator>& result, const cpp_dec_float<Digits10, ExponentType, Allocator>& x)
{
   result = x;
   if(x.isneg())
      result.negate();
}

template <unsigned Digits10, class ExponentType, class Allocator>
inline void eval_sqrt(cpp_dec_float<Digits10, ExponentType, Allocator>& result, const cpp_dec_float<Digits10, ExponentType, Allocator>& x)
{
   result = x;
   result.calculate_sqrt();
}

template <unsigned Digits10, class ExponentType, class Allocator>
inline void eval_floor(cpp_dec_float<Digits10, ExponentType, Allocator>& result, const cpp_dec_float<Digits10, ExponentType, Allocator>& x)
{
   result = x;
   if(!(x.isfinite)() || x.isint())
   {
      return;
   }

   if(x.isneg())
      result -= cpp_dec_float<Digits10, ExponentType, Allocator>::one();
   result = result.extract_integer_part();
}

template <unsigned Digits10, class ExponentType, class Allocator>
inline void eval_ceil(cpp_dec_float<Digits10, ExponentType, Allocator>& result, const cpp_dec_float<Digits10, ExponentType, Allocator>& x)
{
   result = x;
   if(!(x.isfinite)() || x.isint())
   {
      return;
   }

   if(!x.isneg())
      result += cpp_dec_float<Digits10, ExponentType, Allocator>::one();
   result = result.extract_integer_part();
}

template <unsigned Digits10, class ExponentType, class Allocator>
inline void eval_trunc(cpp_dec_float<Digits10, ExponentType, Allocator>& result, const cpp_dec_float<Digits10, ExponentType, Allocator>& x)
{
   if(!(x.isfinite)())
   {
      result = boost::math::policies::raise_rounding_error("boost::multiprecision::trunc<%1%>(%1%)", 0, number<cpp_dec_float<Digits10, ExponentType, Allocator> >(x), number<cpp_dec_float<Digits10, ExponentType, Allocator> >(x), boost::math::policies::policy<>()).backend();
      return;
   }
   else if(x.isint())
   {
      result = x;
      return;
   }
   result = x.extract_integer_part();
}

template <unsigned Digits10, class ExponentType, class Allocator>
inline ExponentType eval_ilogb(const cpp_dec_float<Digits10, ExponentType, Allocator>& val)
{
   // Set result, to the exponent of val:
   return val.order();
}
template <unsigned Digits10, class ExponentType, class Allocator, class ArgType>
inline void eval_scalbn(cpp_dec_float<Digits10, ExponentType, Allocator>& result, const cpp_dec_float<Digits10, ExponentType, Allocator>& val, ArgType e_)
{
   using default_ops::eval_multiply;
   const ExponentType e = e_;
   cpp_dec_float<Digits10, ExponentType, Allocator> t(1.0, e);
   eval_multiply(result, val, t);
}

template <unsigned Digits10, class ExponentType, class Allocator, class ArgType>
inline void eval_ldexp(cpp_dec_float<Digits10, ExponentType, Allocator>& result, const cpp_dec_float<Digits10, ExponentType, Allocator>& x, ArgType e)
{
   const boost::long_long_type the_exp = static_cast<boost::long_long_type>(e);

   if((the_exp > (std::numeric_limits<ExponentType>::max)()) || (the_exp < (std::numeric_limits<ExponentType>::min)()))
      BOOST_THROW_EXCEPTION(std::runtime_error(std::string("Exponent value is out of range.")));

   result = x;

   if ((the_exp > static_cast<boost::long_long_type>(-std::numeric_limits<boost::long_long_type>::digits)) && (the_exp < static_cast<boost::long_long_type>(0)))
      result.div_unsigned_long_long(1ULL << static_cast<boost::long_long_type>(-the_exp));
   else if((the_exp < static_cast<boost::long_long_type>( std::numeric_limits<boost::long_long_type>::digits)) && (the_exp > static_cast<boost::long_long_type>(0)))
      result.mul_unsigned_long_long(1ULL << the_exp);
   else if(the_exp != static_cast<boost::long_long_type>(0))
      result *= cpp_dec_float<Digits10, ExponentType, Allocator>::pow2(e);
}

template <unsigned Digits10, class ExponentType, class Allocator>
inline void eval_frexp(cpp_dec_float<Digits10, ExponentType, Allocator>& result, const cpp_dec_float<Digits10, ExponentType, Allocator>& x, ExponentType* e)
{
   result = x;
   if(result.isneg())
      result.negate();

   if(result.iszero())
   {
      *e = 0;
      return;
   }

   ExponentType t = result.order();
   BOOST_MP_USING_ABS
   if(abs(t) < ((std::numeric_limits<ExponentType>::max)() / 1000))
   {
      t *= 1000;
      t /= 301;
   }
   else
   {
      t /= 301;
      t *= 1000;
   }

   result *= cpp_dec_float<Digits10, ExponentType, Allocator>::pow2(-t);

   if(result.iszero() || (result.isinf)() || (result.isnan)())
   {
      // pow2 overflowed, slip the calculation up:
      result = x;
      if(result.isneg())
         result.negate();
      t /= 2;
      result *= cpp_dec_float<Digits10, ExponentType, Allocator>::pow2(-t);
   }
   BOOST_MP_USING_ABS
   if(abs(result.order()) > 5)
   {
      // If our first estimate doesn't get close enough then try recursion until we do:
      ExponentType e2;
      cpp_dec_float<Digits10, ExponentType, Allocator> r2;
      eval_frexp(r2, result, &e2);
      // overflow protection:
      if((t > 0) && (e2 > 0) && (t > (std::numeric_limits<ExponentType>::max)() - e2))
         BOOST_THROW_EXCEPTION(std::runtime_error("Exponent is too large to be represented as a power of 2."));
      if((t < 0) && (e2 < 0) && (t < (std::numeric_limits<ExponentType>::min)() - e2))
         BOOST_THROW_EXCEPTION(std::runtime_error("Exponent is too large to be represented as a power of 2."));
      t += e2;
      result = r2;
   }

   while(result.compare(cpp_dec_float<Digits10, ExponentType, Allocator>::one()) >= 0)
   {
      result /= cpp_dec_float<Digits10, ExponentType, Allocator>::two();
      ++t;
   }
   while(result.compare(cpp_dec_float<Digits10, ExponentType, Allocator>::half()) < 0)
   {
      result *= cpp_dec_float<Digits10, ExponentType, Allocator>::two();
      --t;
   }
   *e = t;
   if(x.isneg())
      result.negate();
}

template <unsigned Digits10, class ExponentType, class Allocator>
inline typename disable_if<is_same<ExponentType, int> >::type eval_frexp(cpp_dec_float<Digits10, ExponentType, Allocator>& result, const cpp_dec_float<Digits10, ExponentType, Allocator>& x, int* e)
{
   ExponentType t;
   eval_frexp(result, x, &t);
   if((t > (std::numeric_limits<int>::max)()) || (t < (std::numeric_limits<int>::min)()))
      BOOST_THROW_EXCEPTION(std::runtime_error("Exponent is outside the range of an int"));
   *e = static_cast<int>(t);
}

template <unsigned Digits10, class ExponentType, class Allocator>
inline bool eval_is_zero(const cpp_dec_float<Digits10, ExponentType, Allocator>& val)
{
   return val.iszero();
}
template <unsigned Digits10, class ExponentType, class Allocator>
inline int eval_get_sign(const cpp_dec_float<Digits10, ExponentType, Allocator>& val)
{
   return val.iszero() ? 0 : val.isneg() ? -1 : 1;
}

template <unsigned Digits10, class ExponentType, class Allocator>
inline std::size_t hash_value(const cpp_dec_float<Digits10, ExponentType, Allocator>& val)
{
   return val.hash();
}

} // namespace backends

using boost::multiprecision::backends::cpp_dec_float;


typedef number<cpp_dec_float<50> > cpp_dec_float_50;
typedef number<cpp_dec_float<100> > cpp_dec_float_100;

#ifdef BOOST_NO_SFINAE_EXPR

namespace detail{

template<unsigned D1, class E1, class A1, unsigned D2, class E2, class A2>
struct is_explicitly_convertible<cpp_dec_float<D1, E1, A1>, cpp_dec_float<D2, E2, A2> > : public mpl::true_ {};

}

#endif


}}

namespace std
{
   template <unsigned Digits10, class ExponentType, class Allocator, boost::multiprecision::expression_template_option ExpressionTemplates>
   class numeric_limits<boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> >
   {
   public:
      BOOST_STATIC_CONSTEXPR bool is_specialized = true;
      BOOST_STATIC_CONSTEXPR bool is_signed = true;
      BOOST_STATIC_CONSTEXPR bool is_integer = false;
      BOOST_STATIC_CONSTEXPR bool is_exact = false;
      BOOST_STATIC_CONSTEXPR bool is_bounded = true;
      BOOST_STATIC_CONSTEXPR bool is_modulo = false;
      BOOST_STATIC_CONSTEXPR bool is_iec559 = false;
      BOOST_STATIC_CONSTEXPR int digits = boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>::cpp_dec_float_digits10;
      BOOST_STATIC_CONSTEXPR int digits10 = boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>::cpp_dec_float_digits10;
      BOOST_STATIC_CONSTEXPR int max_digits10 = boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>::cpp_dec_float_total_digits10;
      BOOST_STATIC_CONSTEXPR ExponentType min_exponent = boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>::cpp_dec_float_min_exp; // Type differs from int.
      BOOST_STATIC_CONSTEXPR ExponentType min_exponent10 = boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>::cpp_dec_float_min_exp10; // Type differs from int.
      BOOST_STATIC_CONSTEXPR ExponentType max_exponent = boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>::cpp_dec_float_max_exp; // Type differs from int.
      BOOST_STATIC_CONSTEXPR ExponentType max_exponent10 = boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>::cpp_dec_float_max_exp10; // Type differs from int.
      BOOST_STATIC_CONSTEXPR int radix = boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>::cpp_dec_float_radix;
      BOOST_STATIC_CONSTEXPR std::float_round_style round_style = std::round_indeterminate;
      BOOST_STATIC_CONSTEXPR bool has_infinity = true;
      BOOST_STATIC_CONSTEXPR bool has_quiet_NaN = true;
      BOOST_STATIC_CONSTEXPR bool has_signaling_NaN = false;
      BOOST_STATIC_CONSTEXPR std::float_denorm_style has_denorm = std::denorm_absent;
      BOOST_STATIC_CONSTEXPR bool has_denorm_loss = false;
      BOOST_STATIC_CONSTEXPR bool traps = false;
      BOOST_STATIC_CONSTEXPR bool tinyness_before = false;

      BOOST_STATIC_CONSTEXPR boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> (min) () { return (boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>::min)(); }
      BOOST_STATIC_CONSTEXPR boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> (max) () { return (boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>::max)(); }
      BOOST_STATIC_CONSTEXPR boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> lowest () { return boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>::zero(); }
      BOOST_STATIC_CONSTEXPR boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> epsilon () { return boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>::eps(); }
      BOOST_STATIC_CONSTEXPR boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> round_error () { return 0.5L; }
      BOOST_STATIC_CONSTEXPR boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> infinity () { return boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>::inf(); }
      BOOST_STATIC_CONSTEXPR boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> quiet_NaN () { return boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>::nan(); }
      BOOST_STATIC_CONSTEXPR boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> signaling_NaN() { return boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>::zero(); }
      BOOST_STATIC_CONSTEXPR boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> denorm_min () { return boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>::zero(); }
   };

#ifndef BOOST_NO_INCLASS_MEMBER_INITIALIZATION

template <unsigned Digits10, class ExponentType, class Allocator, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> >::digits;
template <unsigned Digits10, class ExponentType, class Allocator, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> >::digits10;
template <unsigned Digits10, class ExponentType, class Allocator, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> >::max_digits10;
template <unsigned Digits10, class ExponentType, class Allocator, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> >::is_signed;
template <unsigned Digits10, class ExponentType, class Allocator, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> >::is_integer;
template <unsigned Digits10, class ExponentType, class Allocator, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> >::is_exact;
template <unsigned Digits10, class ExponentType, class Allocator, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> >::radix;
template <unsigned Digits10, class ExponentType, class Allocator, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST ExponentType numeric_limits<boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> >::min_exponent;
template <unsigned Digits10, class ExponentType, class Allocator, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST ExponentType numeric_limits<boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> >::min_exponent10;
template <unsigned Digits10, class ExponentType, class Allocator, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST ExponentType numeric_limits<boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> >::max_exponent;
template <unsigned Digits10, class ExponentType, class Allocator, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST ExponentType numeric_limits<boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> >::max_exponent10;
template <unsigned Digits10, class ExponentType, class Allocator, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> >::has_infinity;
template <unsigned Digits10, class ExponentType, class Allocator, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> >::has_quiet_NaN;
template <unsigned Digits10, class ExponentType, class Allocator, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> >::has_signaling_NaN;
template <unsigned Digits10, class ExponentType, class Allocator, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST float_denorm_style numeric_limits<boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> >::has_denorm;
template <unsigned Digits10, class ExponentType, class Allocator, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> >::has_denorm_loss;
template <unsigned Digits10, class ExponentType, class Allocator, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> >::is_iec559;
template <unsigned Digits10, class ExponentType, class Allocator, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> >::is_bounded;
template <unsigned Digits10, class ExponentType, class Allocator, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> >::is_modulo;
template <unsigned Digits10, class ExponentType, class Allocator, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> >::traps;
template <unsigned Digits10, class ExponentType, class Allocator, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> >::tinyness_before;
template <unsigned Digits10, class ExponentType, class Allocator, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST float_round_style numeric_limits<boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates> >::round_style;

#endif
}

namespace boost{ namespace math{

namespace policies{

template <unsigned Digits10, class ExponentType, class Allocator, class Policy, boost::multiprecision::expression_template_option ExpressionTemplates>
struct precision< boost::multiprecision::number<boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>, ExpressionTemplates>, Policy>
{
   // Define a local copy of cpp_dec_float_digits10 because it might differ
   // from the template parameter Digits10 for small or large digit counts.
   static const boost::int32_t cpp_dec_float_digits10 = boost::multiprecision::cpp_dec_float<Digits10, ExponentType, Allocator>::cpp_dec_float_digits10;

   typedef typename Policy::precision_type precision_type;
   typedef digits2<((cpp_dec_float_digits10 + 1LL) * 1000LL) / 301LL> digits_2;
   typedef typename mpl::if_c<
      ((digits_2::value <= precision_type::value)
      || (Policy::precision_type::value <= 0)),
      // Default case, full precision for RealType:
      digits_2,
      // User customized precision:
      precision_type
   >::type type;
};

} // namespace policies

}} // namespaces boost::math

#ifdef BOOST_MSVC
#pragma warning(pop)
#endif

#endif
