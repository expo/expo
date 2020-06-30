///////////////////////////////////////////////////////////////////////////////
//  Copyright 2011 John Maddock. Distributed under the Boost
//  Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_MATH_ER_GMP_BACKEND_HPP
#define BOOST_MATH_ER_GMP_BACKEND_HPP

#include <boost/multiprecision/number.hpp>
#include <boost/multiprecision/debug_adaptor.hpp>
#include <boost/multiprecision/detail/integer_ops.hpp>
#include <boost/multiprecision/detail/big_lanczos.hpp>
#include <boost/multiprecision/detail/digits.hpp>
#include <boost/math/special_functions/fpclassify.hpp>
#include <boost/cstdint.hpp>
#include <boost/functional/hash_fwd.hpp>
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
#  pragma warning(push)
#  pragma warning(disable:4127)
#endif
#include <gmp.h>
#ifdef BOOST_MSVC
#  pragma warning(pop)
#endif

#if defined(__MPIR_VERSION) && defined(__MPIR_VERSION_MINOR) && defined(__MPIR_VERSION_PATCHLEVEL)
#  define BOOST_MP_MPIR_VERSION (__MPIR_VERSION * 10000 + __MPIR_VERSION_MINOR * 100 + __MPIR_VERSION_PATCHLEVEL)
#else
#  define BOOST_MP_MPIR_VERSION 0
#endif

#include <cmath>
#include <limits>
#include <climits>

namespace boost{
namespace multiprecision{
namespace backends{

#ifdef BOOST_MSVC
// warning C4127: conditional expression is constant
#pragma warning(push)
#pragma warning(disable:4127)
#endif

template <unsigned digits10>
struct gmp_float;
struct gmp_int;
struct gmp_rational;

} // namespace backends

template<>
struct number_category<backends::gmp_int> : public mpl::int_<number_kind_integer>{};
template<>
struct number_category<backends::gmp_rational> : public mpl::int_<number_kind_rational>{};
template <unsigned digits10>
struct number_category<backends::gmp_float<digits10> > : public mpl::int_<number_kind_floating_point>{};

namespace backends{
//
// Within this file, the only functions we mark as noexcept are those that manipulate
// (but don't create) an mpf_t.  All other types may allocate at pretty much any time
// via a user-supplied allocator, and therefore throw.
//
namespace detail{

template <unsigned digits10>
struct gmp_float_imp
{
#ifdef BOOST_HAS_LONG_LONG
   typedef mpl::list<long, boost::long_long_type>                     signed_types;
   typedef mpl::list<unsigned long, boost::ulong_long_type>   unsigned_types;
#else
   typedef mpl::list<long>                                signed_types;
   typedef mpl::list<unsigned long>                       unsigned_types;
#endif
   typedef mpl::list<double, long double>                 float_types;
   typedef long                                           exponent_type;

   gmp_float_imp() BOOST_NOEXCEPT {}

   gmp_float_imp(const gmp_float_imp& o)
   {
      //
      // We have to do an init followed by a set here, otherwise *this may be at
      // a lower precision than o: seems like mpf_init_set copies just enough bits
      // to get the right value, but if it's then used in further calculations
      // things go badly wrong!!
      //
      mpf_init2(m_data, multiprecision::detail::digits10_2_2(digits10 ? digits10 : get_default_precision()));
      if(o.m_data[0]._mp_d)
         mpf_set(m_data, o.m_data);
   }
#ifndef BOOST_NO_CXX11_RVALUE_REFERENCES
   gmp_float_imp(gmp_float_imp&& o) BOOST_NOEXCEPT
   {
      m_data[0] = o.m_data[0];
      o.m_data[0]._mp_d = 0;
   }
#endif
   gmp_float_imp& operator = (const gmp_float_imp& o)
   {
      if(m_data[0]._mp_d == 0)
         mpf_init2(m_data, multiprecision::detail::digits10_2_2(digits10 ? digits10 : get_default_precision()));
      if(o.m_data[0]._mp_d)
         mpf_set(m_data, o.m_data);
      return *this;
   }
#ifndef BOOST_NO_CXX11_RVALUE_REFERENCES
   gmp_float_imp& operator = (gmp_float_imp&& o) BOOST_NOEXCEPT
   {
      mpf_swap(m_data, o.m_data);
      return *this;
   }
#endif

#ifdef BOOST_HAS_LONG_LONG
#if defined(ULLONG_MAX) && (ULLONG_MAX == ULONG_MAX)
   gmp_float_imp& operator = (boost::ulong_long_type i)
   {
      *this = static_cast<unsigned long>(i);
      return *this;
   }
#else
   gmp_float_imp& operator = (boost::ulong_long_type i)
   {
      if(m_data[0]._mp_d == 0)
         mpf_init2(m_data, multiprecision::detail::digits10_2_2(digits10 ? digits10 : get_default_precision()));
      boost::ulong_long_type mask = ((((1uLL << (std::numeric_limits<unsigned long>::digits - 1)) - 1) << 1) | 1uLL);
      unsigned shift = 0;
      mpf_t t;
      mpf_init2(t, multiprecision::detail::digits10_2_2(digits10 ? digits10 : get_default_precision()));
      mpf_set_ui(m_data, 0);
      while(i)
      {
         mpf_set_ui(t, static_cast<unsigned long>(i & mask));
         if(shift)
            mpf_mul_2exp(t, t, shift);
         mpf_add(m_data, m_data, t);
         shift += std::numeric_limits<unsigned long>::digits;
         i >>= std::numeric_limits<unsigned long>::digits;
      }
      mpf_clear(t);
      return *this;
   }
#endif
   gmp_float_imp& operator = (boost::long_long_type i)
   {
      if(m_data[0]._mp_d == 0)
         mpf_init2(m_data, multiprecision::detail::digits10_2_2(digits10 ? digits10 : get_default_precision()));
      bool neg = i < 0;
      *this = static_cast<boost::ulong_long_type>(boost::multiprecision::detail::unsigned_abs(i));
      if(neg)
         mpf_neg(m_data, m_data);
      return *this;
   }
#endif
   gmp_float_imp& operator = (unsigned long i)
   {
      if(m_data[0]._mp_d == 0)
         mpf_init2(m_data, multiprecision::detail::digits10_2_2(digits10 ? digits10 : get_default_precision()));
      mpf_set_ui(m_data, i);
      return *this;
   }
   gmp_float_imp& operator = (long i)
   {
      if(m_data[0]._mp_d == 0)
         mpf_init2(m_data, multiprecision::detail::digits10_2_2(digits10 ? digits10 : get_default_precision()));
      mpf_set_si(m_data, i);
      return *this;
   }
   gmp_float_imp& operator = (double d)
   {
      if(m_data[0]._mp_d == 0)
         mpf_init2(m_data, multiprecision::detail::digits10_2_2(digits10 ? digits10 : get_default_precision()));
      mpf_set_d(m_data, d);
      return *this;
   }
   gmp_float_imp& operator = (long double a)
   {
      using std::frexp;
      using std::ldexp;
      using std::floor;

      if(m_data[0]._mp_d == 0)
         mpf_init2(m_data, multiprecision::detail::digits10_2_2(digits10 ? digits10 : get_default_precision()));

      if (a == 0) {
         mpf_set_si(m_data, 0);
         return *this;
      }

      if (a == 1) {
         mpf_set_si(m_data, 1);
         return *this;
      }

      BOOST_ASSERT(!(boost::math::isinf)(a));
      BOOST_ASSERT(!(boost::math::isnan)(a));

      int e;
      long double f, term;
      mpf_set_ui(m_data, 0u);

      f = frexp(a, &e);

      static const int shift = std::numeric_limits<int>::digits - 1;

      while(f)
      {
         // extract int sized bits from f:
         f = ldexp(f, shift);
         term = floor(f);
         e -= shift;
         mpf_mul_2exp(m_data, m_data, shift);
         if(term > 0)
            mpf_add_ui(m_data, m_data, static_cast<unsigned>(term));
         else
            mpf_sub_ui(m_data, m_data, static_cast<unsigned>(-term));
         f -= term;
      }
      if(e > 0)
         mpf_mul_2exp(m_data, m_data, e);
      else if(e < 0)
         mpf_div_2exp(m_data, m_data, -e);
      return *this;
   }
   gmp_float_imp& operator = (const char* s)
   {
      if(m_data[0]._mp_d == 0)
         mpf_init2(m_data, multiprecision::detail::digits10_2_2(digits10 ? digits10 : get_default_precision()));
      if(0 != mpf_set_str(m_data, s, 10))
         BOOST_THROW_EXCEPTION(std::runtime_error(std::string("The string \"") + s + std::string("\"could not be interpreted as a valid floating point number.")));
      return *this;
   }
   void swap(gmp_float_imp& o) BOOST_NOEXCEPT
   {
      mpf_swap(m_data, o.m_data);
   }
   std::string str(std::streamsize digits, std::ios_base::fmtflags f)const
   {
      BOOST_ASSERT(m_data[0]._mp_d);

      bool scientific = (f & std::ios_base::scientific) == std::ios_base::scientific;
      bool fixed      = (f & std::ios_base::fixed) == std::ios_base::fixed;
      std::streamsize org_digits(digits);

      if(scientific && digits)
         ++digits;

      std::string result;
      mp_exp_t e;
      void *(*alloc_func_ptr) (size_t);
      void *(*realloc_func_ptr) (void *, size_t, size_t);
      void (*free_func_ptr) (void *, size_t);
      mp_get_memory_functions(&alloc_func_ptr, &realloc_func_ptr, &free_func_ptr);

      if(mpf_sgn(m_data) == 0)
      {
         e = 0;
         result = "0";
         if(fixed && digits)
            ++digits;
      }
      else
      {
         char* ps = mpf_get_str (0, &e, 10, static_cast<std::size_t>(digits), m_data);
         --e;  // To match with what our formatter expects.
         if(fixed && e != -1)
         {
            // Oops we actually need a different number of digits to what we asked for:
            (*free_func_ptr)((void*)ps, std::strlen(ps) + 1);
            digits += e + 1;
            if(digits == 0)
            {
               // We need to get *all* the digits and then possibly round up,
               // we end up with either "0" or "1" as the result.
               ps = mpf_get_str (0, &e, 10, 0, m_data);
               --e;
               unsigned offset = *ps == '-' ? 1 : 0;
               if(ps[offset] > '5')
               {
                  ++e;
                  ps[offset] = '1';
                  ps[offset + 1] = 0;
               }
               else if(ps[offset] == '5')
               {
                  unsigned i = offset + 1;
                  bool round_up = false;
                  while(ps[i] != 0)
                  {
                     if(ps[i] != '0')
                     {
                        round_up = true;
                        break;
                     }
                  }
                  if(round_up)
                  {
                     ++e;
                     ps[offset] = '1';
                     ps[offset + 1] = 0;
                  }
                  else
                  {
                     ps[offset] = '0';
                     ps[offset + 1] = 0;
                  }
               }
               else
               {
                  ps[offset] = '0';
                  ps[offset + 1] = 0;
               }
            }
            else if(digits > 0)
            {
               ps = mpf_get_str (0, &e, 10, static_cast<std::size_t>(digits), m_data);
               --e;  // To match with what our formatter expects.
            }
            else
            {
               ps = mpf_get_str (0, &e, 10, 1, m_data);
               --e;
               unsigned offset = *ps == '-' ? 1 : 0;
               ps[offset] = '0';
               ps[offset + 1] = 0;
            }
         }
         result = ps;
         (*free_func_ptr)((void*)ps, std::strlen(ps) + 1);
      }
      boost::multiprecision::detail::format_float_string(result, e, org_digits, f, mpf_sgn(m_data) == 0);
      return result;
   }
   ~gmp_float_imp() BOOST_NOEXCEPT
   {
      if(m_data[0]._mp_d)
         mpf_clear(m_data);
   }
   void negate() BOOST_NOEXCEPT
   {
      BOOST_ASSERT(m_data[0]._mp_d);
      mpf_neg(m_data, m_data);
   }
   int compare(const gmp_float<digits10>& o)const BOOST_NOEXCEPT
   {
      BOOST_ASSERT(m_data[0]._mp_d && o.m_data[0]._mp_d);
      return mpf_cmp(m_data, o.m_data);
   }
   int compare(long i)const BOOST_NOEXCEPT
   {
      BOOST_ASSERT(m_data[0]._mp_d);
      return mpf_cmp_si(m_data, i);
   }
   int compare(unsigned long i)const BOOST_NOEXCEPT
   {
      BOOST_ASSERT(m_data[0]._mp_d);
      return mpf_cmp_ui(m_data, i);
   }
   template <class V>
   typename enable_if<is_arithmetic<V>, int>::type compare(V v)const
   {
      gmp_float<digits10> d;
      d = v;
      return compare(d);
   }
   mpf_t& data() BOOST_NOEXCEPT
   {
      BOOST_ASSERT(m_data[0]._mp_d);
      return m_data;
   }
   const mpf_t& data()const BOOST_NOEXCEPT
   {
      BOOST_ASSERT(m_data[0]._mp_d);
      return m_data;
   }
protected:
   mpf_t m_data;
   static unsigned& get_default_precision() BOOST_NOEXCEPT
   {
      static unsigned val = 50;
      return val;
   }
};

} // namespace detail

struct gmp_int;
struct gmp_rational;

template <unsigned digits10>
struct gmp_float : public detail::gmp_float_imp<digits10>
{
   gmp_float()
   {
      mpf_init2(this->m_data, multiprecision::detail::digits10_2_2(digits10));
   }
   gmp_float(const gmp_float& o) : detail::gmp_float_imp<digits10>(o) {}
   template <unsigned D>
   gmp_float(const gmp_float<D>& o, typename enable_if_c<D <= digits10>::type* = 0);
   template <unsigned D>
   explicit gmp_float(const gmp_float<D>& o, typename disable_if_c<D <= digits10>::type* = 0);
   gmp_float(const gmp_int& o);
   gmp_float(const gmp_rational& o);
   gmp_float(const mpf_t val)
   {
      mpf_init2(this->m_data, multiprecision::detail::digits10_2_2(digits10));
      mpf_set(this->m_data, val);
   }
   gmp_float(const mpz_t val)
   {
      mpf_init2(this->m_data, multiprecision::detail::digits10_2_2(digits10));
      mpf_set_z(this->m_data, val);
   }
   gmp_float(const mpq_t val)
   {
      mpf_init2(this->m_data, multiprecision::detail::digits10_2_2(digits10));
      mpf_set_q(this->m_data, val);
   }
#ifndef BOOST_NO_CXX11_RVALUE_REFERENCES
   gmp_float(gmp_float&& o) BOOST_NOEXCEPT : detail::gmp_float_imp<digits10>(static_cast<detail::gmp_float_imp<digits10>&&>(o)) {}
#endif
   gmp_float& operator=(const gmp_float& o)
   {
      *static_cast<detail::gmp_float_imp<digits10>*>(this) = static_cast<detail::gmp_float_imp<digits10> const&>(o);
      return *this;
   }
#ifndef BOOST_NO_CXX11_RVALUE_REFERENCES
   gmp_float& operator=(gmp_float&& o) BOOST_NOEXCEPT
   {
      *static_cast<detail::gmp_float_imp<digits10>*>(this) = static_cast<detail::gmp_float_imp<digits10>&&>(o);
      return *this;
   }
#endif
   template <unsigned D>
   gmp_float& operator=(const gmp_float<D>& o);
   gmp_float& operator=(const gmp_int& o);
   gmp_float& operator=(const gmp_rational& o);
   gmp_float& operator=(const mpf_t val)
   {
      if(this->m_data[0]._mp_d == 0)
         mpf_init2(this->m_data, multiprecision::detail::digits10_2_2(digits10));
      mpf_set(this->m_data, val);
      return *this;
   }
   gmp_float& operator=(const mpz_t val)
   {
      if(this->m_data[0]._mp_d == 0)
         mpf_init2(this->m_data, multiprecision::detail::digits10_2_2(digits10));
      mpf_set_z(this->m_data, val);
      return *this;
   }
   gmp_float& operator=(const mpq_t val)
   {
      if(this->m_data[0]._mp_d == 0)
         mpf_init2(this->m_data, multiprecision::detail::digits10_2_2(digits10));
      mpf_set_q(this->m_data, val);
      return *this;
   }
   template <class V>
   gmp_float& operator=(const V& v)
   {
      *static_cast<detail::gmp_float_imp<digits10>*>(this) = v;
      return *this;
   }
};

template <>
struct gmp_float<0> : public detail::gmp_float_imp<0>
{
   gmp_float()
   {
      mpf_init2(this->m_data, multiprecision::detail::digits10_2_2(get_default_precision()));
   }
   gmp_float(const mpf_t val)
   {
      mpf_init2(this->m_data, multiprecision::detail::digits10_2_2(get_default_precision()));
      mpf_set(this->m_data, val);
   }
   gmp_float(const mpz_t val)
   {
      mpf_init2(this->m_data, multiprecision::detail::digits10_2_2(get_default_precision()));
      mpf_set_z(this->m_data, val);
   }
   gmp_float(const mpq_t val)
   {
      mpf_init2(this->m_data, multiprecision::detail::digits10_2_2(get_default_precision()));
      mpf_set_q(this->m_data, val);
   }
   gmp_float(const gmp_float& o) : detail::gmp_float_imp<0>(o) {}
   template <unsigned D>
   gmp_float(const gmp_float<D>& o)
   {
      mpf_init2(this->m_data, mpf_get_prec(o.data()));
      mpf_set(this->m_data, o.data());
   }
#ifndef BOOST_NO_CXX11_RVALUE_REFERENCES
   gmp_float(gmp_float&& o) BOOST_NOEXCEPT : detail::gmp_float_imp<0>(static_cast<detail::gmp_float_imp<0>&&>(o)) {}
#endif
   gmp_float(const gmp_int& o);
   gmp_float(const gmp_rational& o);
   gmp_float(const gmp_float& o, unsigned digits10)
   {
      mpf_init2(this->m_data, multiprecision::detail::digits10_2_2(digits10));
      mpf_set(this->m_data, o.data());
   }

   gmp_float& operator=(const gmp_float& o)
   {
      *static_cast<detail::gmp_float_imp<0>*>(this) = static_cast<detail::gmp_float_imp<0> const&>(o);
      return *this;
   }
#ifndef BOOST_NO_CXX11_RVALUE_REFERENCES
   gmp_float& operator=(gmp_float&& o) BOOST_NOEXCEPT
   {
      *static_cast<detail::gmp_float_imp<0>*>(this) = static_cast<detail::gmp_float_imp<0> &&>(o);
      return *this;
   }
#endif
   template <unsigned D>
   gmp_float& operator=(const gmp_float<D>& o)
   {
      if(this->m_data[0]._mp_d == 0)
      {
         mpf_init2(this->m_data, mpf_get_prec(o.data()));
      }
      else
      {
         mpf_set_prec(this->m_data, mpf_get_prec(o.data()));
      }
      mpf_set(this->m_data, o.data());
      return *this;
   }
   gmp_float& operator=(const gmp_int& o);
   gmp_float& operator=(const gmp_rational& o);
   gmp_float& operator=(const mpf_t val)
   {
      if(this->m_data[0]._mp_d == 0)
         mpf_init2(this->m_data, multiprecision::detail::digits10_2_2(get_default_precision()));
      mpf_set(this->m_data, val);
      return *this;
   }
   gmp_float& operator=(const mpz_t val)
   {
      if(this->m_data[0]._mp_d == 0)
         mpf_init2(this->m_data, multiprecision::detail::digits10_2_2(get_default_precision()));
      mpf_set_z(this->m_data, val);
      return *this;
   }
   gmp_float& operator=(const mpq_t val)
   {
      if(this->m_data[0]._mp_d == 0)
         mpf_init2(this->m_data, multiprecision::detail::digits10_2_2(get_default_precision()));
      mpf_set_q(this->m_data, val);
      return *this;
   }
   template <class V>
   gmp_float& operator=(const V& v)
   {
      *static_cast<detail::gmp_float_imp<0>*>(this) = v;
      return *this;
   }
   static unsigned default_precision() BOOST_NOEXCEPT
   {
      return get_default_precision();
   }
   static void default_precision(unsigned v) BOOST_NOEXCEPT
   {
      get_default_precision() = v;
   }
   unsigned precision()const BOOST_NOEXCEPT
   {
      return static_cast<unsigned>(multiprecision::detail::digits2_2_10(static_cast<unsigned long>(mpf_get_prec(this->m_data))));
   }
   void precision(unsigned digits10) BOOST_NOEXCEPT
   {
      mpf_set_prec(this->m_data, multiprecision::detail::digits10_2_2(digits10));
   }
};

template <unsigned digits10, class T>
inline typename enable_if_c<is_arithmetic<T>::value, bool>::type eval_eq(const gmp_float<digits10>& a, const T& b) BOOST_NOEXCEPT
{
   return a.compare(b) == 0;
}
template <unsigned digits10, class T>
inline typename enable_if_c<is_arithmetic<T>::value, bool>::type eval_lt(const gmp_float<digits10>& a, const T& b) BOOST_NOEXCEPT
{
   return a.compare(b) < 0;
}
template <unsigned digits10, class T>
inline typename enable_if_c<is_arithmetic<T>::value, bool>::type eval_gt(const gmp_float<digits10>& a, const T& b) BOOST_NOEXCEPT
{
   return a.compare(b) > 0;
}

template <unsigned D1, unsigned D2>
inline void eval_add(gmp_float<D1>& result, const gmp_float<D2>& o)
{
   mpf_add(result.data(), result.data(), o.data());
}
template <unsigned D1, unsigned D2>
inline void eval_subtract(gmp_float<D1>& result, const gmp_float<D2>& o)
{
   mpf_sub(result.data(), result.data(), o.data());
}
template <unsigned D1, unsigned D2>
inline void eval_multiply(gmp_float<D1>& result, const gmp_float<D2>& o)
{
   mpf_mul(result.data(), result.data(), o.data());
}
template <unsigned digits10>
inline bool eval_is_zero(const gmp_float<digits10>& val) BOOST_NOEXCEPT
{
   return mpf_sgn(val.data()) == 0;
}
template <unsigned D1, unsigned D2>
inline void eval_divide(gmp_float<D1>& result, const gmp_float<D2>& o)
{
   if(eval_is_zero(o))
      BOOST_THROW_EXCEPTION(std::overflow_error("Division by zero."));
   mpf_div(result.data(), result.data(), o.data());
}
template <unsigned digits10>
inline void eval_add(gmp_float<digits10>& result, unsigned long i)
{
   mpf_add_ui(result.data(), result.data(), i);
}
template <unsigned digits10>
inline void eval_subtract(gmp_float<digits10>& result, unsigned long i)
{
   mpf_sub_ui(result.data(), result.data(), i);
}
template <unsigned digits10>
inline void eval_multiply(gmp_float<digits10>& result, unsigned long i)
{
   mpf_mul_ui(result.data(), result.data(), i);
}
template <unsigned digits10>
inline void eval_divide(gmp_float<digits10>& result, unsigned long i)
{
   if(i == 0)
      BOOST_THROW_EXCEPTION(std::overflow_error("Division by zero."));
   mpf_div_ui(result.data(), result.data(), i);
}
template <unsigned digits10>
inline void eval_add(gmp_float<digits10>& result, long i)
{
   if(i > 0)
      mpf_add_ui(result.data(), result.data(), i);
   else
      mpf_sub_ui(result.data(), result.data(), boost::multiprecision::detail::unsigned_abs(i));
}
template <unsigned digits10>
inline void eval_subtract(gmp_float<digits10>& result, long i)
{
   if(i > 0)
      mpf_sub_ui(result.data(), result.data(), i);
   else
      mpf_add_ui(result.data(), result.data(), boost::multiprecision::detail::unsigned_abs(i));
}
template <unsigned digits10>
inline void eval_multiply(gmp_float<digits10>& result, long i)
{
   mpf_mul_ui(result.data(), result.data(), boost::multiprecision::detail::unsigned_abs(i));
   if(i < 0)
      mpf_neg(result.data(), result.data());
}
template <unsigned digits10>
inline void eval_divide(gmp_float<digits10>& result, long i)
{
   if(i == 0)
      BOOST_THROW_EXCEPTION(std::overflow_error("Division by zero."));
   mpf_div_ui(result.data(), result.data(), boost::multiprecision::detail::unsigned_abs(i));
   if(i < 0)
      mpf_neg(result.data(), result.data());
}
//
// Specialised 3 arg versions of the basic operators:
//
template <unsigned D1, unsigned D2, unsigned D3>
inline void eval_add(gmp_float<D1>& a, const gmp_float<D2>& x, const gmp_float<D3>& y)
{
   mpf_add(a.data(), x.data(), y.data());
}
template <unsigned D1, unsigned D2>
inline void eval_add(gmp_float<D1>& a, const gmp_float<D2>& x, unsigned long y)
{
   mpf_add_ui(a.data(), x.data(), y);
}
template <unsigned D1, unsigned D2>
inline void eval_add(gmp_float<D1>& a, const gmp_float<D2>& x, long y)
{
   if(y < 0)
      mpf_sub_ui(a.data(), x.data(), boost::multiprecision::detail::unsigned_abs(y));
   else
      mpf_add_ui(a.data(), x.data(), y);
}
template <unsigned D1, unsigned D2>
inline void eval_add(gmp_float<D1>& a, unsigned long x, const gmp_float<D2>& y)
{
   mpf_add_ui(a.data(), y.data(), x);
}
template <unsigned D1, unsigned D2>
inline void eval_add(gmp_float<D1>& a, long x, const gmp_float<D2>& y)
{
   if(x < 0)
   {
      mpf_ui_sub(a.data(), boost::multiprecision::detail::unsigned_abs(x), y.data());
      mpf_neg(a.data(), a.data());
   }
   else
      mpf_add_ui(a.data(), y.data(), x);
}
template <unsigned D1, unsigned D2, unsigned D3>
inline void eval_subtract(gmp_float<D1>& a, const gmp_float<D2>& x, const gmp_float<D3>& y)
{
   mpf_sub(a.data(), x.data(), y.data());
}
template <unsigned D1, unsigned D2>
inline void eval_subtract(gmp_float<D1>& a, const gmp_float<D2>& x, unsigned long y)
{
   mpf_sub_ui(a.data(), x.data(), y);
}
template <unsigned D1, unsigned D2>
inline void eval_subtract(gmp_float<D1>& a, const gmp_float<D2>& x, long y)
{
   if(y < 0)
      mpf_add_ui(a.data(), x.data(), boost::multiprecision::detail::unsigned_abs(y));
   else
      mpf_sub_ui(a.data(), x.data(), y);
}
template <unsigned D1, unsigned D2>
inline void eval_subtract(gmp_float<D1>& a, unsigned long x, const gmp_float<D2>& y)
{
   mpf_ui_sub(a.data(), x, y.data());
}
template <unsigned D1, unsigned D2>
inline void eval_subtract(gmp_float<D1>& a, long x, const gmp_float<D2>& y)
{
   if(x < 0)
   {
      mpf_add_ui(a.data(), y.data(), boost::multiprecision::detail::unsigned_abs(x));
      mpf_neg(a.data(), a.data());
   }
   else
      mpf_ui_sub(a.data(), x, y.data());
}

template <unsigned D1, unsigned D2, unsigned D3>
inline void eval_multiply(gmp_float<D1>& a, const gmp_float<D2>& x, const gmp_float<D3>& y)
{
   mpf_mul(a.data(), x.data(), y.data());
}
template <unsigned D1, unsigned D2>
inline void eval_multiply(gmp_float<D1>& a, const gmp_float<D2>& x, unsigned long y)
{
   mpf_mul_ui(a.data(), x.data(), y);
}
template <unsigned D1, unsigned D2>
inline void eval_multiply(gmp_float<D1>& a, const gmp_float<D2>& x, long y)
{
   if(y < 0)
   {
      mpf_mul_ui(a.data(), x.data(), boost::multiprecision::detail::unsigned_abs(y));
      a.negate();
   }
   else
      mpf_mul_ui(a.data(), x.data(), y);
}
template <unsigned D1, unsigned D2>
inline void eval_multiply(gmp_float<D1>& a, unsigned long x, const gmp_float<D2>& y)
{
   mpf_mul_ui(a.data(), y.data(), x);
}
template <unsigned D1, unsigned D2>
inline void eval_multiply(gmp_float<D1>& a, long x, const gmp_float<D2>& y)
{
   if(x < 0)
   {
      mpf_mul_ui(a.data(), y.data(), boost::multiprecision::detail::unsigned_abs(x));
      mpf_neg(a.data(), a.data());
   }
   else
      mpf_mul_ui(a.data(), y.data(), x);
}

template <unsigned D1, unsigned D2, unsigned D3>
inline void eval_divide(gmp_float<D1>& a, const gmp_float<D2>& x, const gmp_float<D3>& y)
{
   if(eval_is_zero(y))
      BOOST_THROW_EXCEPTION(std::overflow_error("Division by zero."));
   mpf_div(a.data(), x.data(), y.data());
}
template <unsigned D1, unsigned D2>
inline void eval_divide(gmp_float<D1>& a, const gmp_float<D2>& x, unsigned long y)
{
   if(y == 0)
      BOOST_THROW_EXCEPTION(std::overflow_error("Division by zero."));
   mpf_div_ui(a.data(), x.data(), y);
}
template <unsigned D1, unsigned D2>
inline void eval_divide(gmp_float<D1>& a, const gmp_float<D2>& x, long y)
{
   if(y == 0)
      BOOST_THROW_EXCEPTION(std::overflow_error("Division by zero."));
   if(y < 0)
   {
      mpf_div_ui(a.data(), x.data(), boost::multiprecision::detail::unsigned_abs(y));
      a.negate();
   }
   else
      mpf_div_ui(a.data(), x.data(), y);
}
template <unsigned D1, unsigned D2>
inline void eval_divide(gmp_float<D1>& a, unsigned long x, const gmp_float<D2>& y)
{
   if(eval_is_zero(y))
      BOOST_THROW_EXCEPTION(std::overflow_error("Division by zero."));
   mpf_ui_div(a.data(), x, y.data());
}
template <unsigned D1, unsigned D2>
inline void eval_divide(gmp_float<D1>& a, long x, const gmp_float<D2>& y)
{
   if(eval_is_zero(y))
      BOOST_THROW_EXCEPTION(std::overflow_error("Division by zero."));
   if(x < 0)
   {
      mpf_ui_div(a.data(), boost::multiprecision::detail::unsigned_abs(x), y.data());
      mpf_neg(a.data(), a.data());
   }
   else
      mpf_ui_div(a.data(), x, y.data());
}

template <unsigned digits10>
inline int eval_get_sign(const gmp_float<digits10>& val) BOOST_NOEXCEPT
{
   return mpf_sgn(val.data());
}

template <unsigned digits10>
inline void eval_convert_to(unsigned long* result, const gmp_float<digits10>& val) BOOST_NOEXCEPT
{
   if(0 == mpf_fits_ulong_p(val.data()))
      *result = (std::numeric_limits<unsigned long>::max)();
   else
      *result = mpf_get_ui(val.data());
}
template <unsigned digits10>
inline void eval_convert_to(long* result, const gmp_float<digits10>& val) BOOST_NOEXCEPT
{
   if(0 == mpf_fits_slong_p(val.data()))
   {
      *result = (std::numeric_limits<unsigned long>::max)();
      *result *= mpf_sgn(val.data());
   }
   else
      *result = mpf_get_si(val.data());
}
template <unsigned digits10>
inline void eval_convert_to(double* result, const gmp_float<digits10>& val) BOOST_NOEXCEPT
{
   *result = mpf_get_d(val.data());
}
#ifdef BOOST_HAS_LONG_LONG
template <unsigned digits10>
inline void eval_convert_to(boost::long_long_type* result, const gmp_float<digits10>& val)
{
   gmp_float<digits10> t(val);
   if(eval_get_sign(t) < 0)
      t.negate();

   long digits = std::numeric_limits<boost::long_long_type>::digits - std::numeric_limits<long>::digits;

   if(digits > 0)
      mpf_div_2exp(t.data(), t.data(), digits);

   if(!mpf_fits_slong_p(t.data()))
   {
      if(eval_get_sign(val) < 0)
         *result = (std::numeric_limits<boost::long_long_type>::min)();
      else
         *result = (std::numeric_limits<boost::long_long_type>::max)();
      return;
   };

   *result = mpf_get_si(t.data());
   while(digits > 0)
   {
      *result <<= digits;
      digits -= std::numeric_limits<unsigned long>::digits;
      mpf_mul_2exp(t.data(), t.data(), digits >= 0 ? std::numeric_limits<unsigned long>::digits : std::numeric_limits<unsigned long>::digits + digits);
      unsigned long l = mpf_get_ui(t.data());
      if(digits < 0)
         l >>= -digits;
      *result |= l;
   }
   if(eval_get_sign(val) < 0)
      *result = -*result;
}
template <unsigned digits10>
inline void eval_convert_to(boost::ulong_long_type* result, const gmp_float<digits10>& val)
{
   gmp_float<digits10> t(val);

   long digits = std::numeric_limits<boost::long_long_type>::digits - std::numeric_limits<long>::digits;

   if(digits > 0)
      mpf_div_2exp(t.data(), t.data(), digits);

   if(!mpf_fits_ulong_p(t.data()))
   {
      *result = (std::numeric_limits<boost::long_long_type>::max)();
      return;
   }

   *result = mpf_get_ui(t.data());
   while(digits > 0)
   {
      *result <<= digits;
      digits -= std::numeric_limits<unsigned long>::digits;
      mpf_mul_2exp(t.data(), t.data(), digits >= 0 ? std::numeric_limits<unsigned long>::digits : std::numeric_limits<unsigned long>::digits + digits);
      unsigned long l = mpf_get_ui(t.data());
      if(digits < 0)
         l >>= -digits;
      *result |= l;
   }
}
#endif

//
// Native non-member operations:
//
template <unsigned Digits10>
inline void eval_sqrt(gmp_float<Digits10>& result, const gmp_float<Digits10>& val)
{
   mpf_sqrt(result.data(), val.data());
}

template <unsigned Digits10>
inline void eval_abs(gmp_float<Digits10>& result, const gmp_float<Digits10>& val)
{
   mpf_abs(result.data(), val.data());
}

template <unsigned Digits10>
inline void eval_fabs(gmp_float<Digits10>& result, const gmp_float<Digits10>& val)
{
   mpf_abs(result.data(), val.data());
}
template <unsigned Digits10>
inline void eval_ceil(gmp_float<Digits10>& result, const gmp_float<Digits10>& val)
{
   mpf_ceil(result.data(), val.data());
}
template <unsigned Digits10>
inline void eval_floor(gmp_float<Digits10>& result, const gmp_float<Digits10>& val)
{
   mpf_floor(result.data(), val.data());
}
template <unsigned Digits10>
inline void eval_trunc(gmp_float<Digits10>& result, const gmp_float<Digits10>& val)
{
   mpf_trunc(result.data(), val.data());
}
template <unsigned Digits10>
inline void eval_ldexp(gmp_float<Digits10>& result, const gmp_float<Digits10>& val, long e)
{
   if(e > 0)
      mpf_mul_2exp(result.data(), val.data(), e);
   else if(e < 0)
      mpf_div_2exp(result.data(), val.data(), -e);
   else
      result = val;
}
template <unsigned Digits10>
inline void eval_frexp(gmp_float<Digits10>& result, const gmp_float<Digits10>& val, int* e)
{
#if BOOST_MP_MPIR_VERSION >= 20600
   mpir_si v;
   mpf_get_d_2exp(&v, val.data());
#else
   long v;
   mpf_get_d_2exp(&v, val.data());
#endif
   *e = v;
   eval_ldexp(result, val, -v);
}
template <unsigned Digits10>
inline void eval_frexp(gmp_float<Digits10>& result, const gmp_float<Digits10>& val, long* e)
{
#if BOOST_MP_MPIR_VERSION >= 20600
   mpir_si v;
   mpf_get_d_2exp(&v, val.data());
   *e = v;
   eval_ldexp(result, val, -v);
#else
   mpf_get_d_2exp(e, val.data());
   eval_ldexp(result, val, -*e);
#endif
}

template <unsigned Digits10>
inline std::size_t hash_value(const gmp_float<Digits10>& val)
{
   std::size_t result = 0;
   for(int i = 0; i < std::abs(val.data()[0]._mp_size); ++i)
      boost::hash_combine(result, val.data()[0]._mp_d[i]);
   boost::hash_combine(result, val.data()[0]._mp_exp);
   boost::hash_combine(result, val.data()[0]._mp_size);
   return result;
}

struct gmp_int
{
#ifdef BOOST_HAS_LONG_LONG
   typedef mpl::list<long, boost::long_long_type>                     signed_types;
   typedef mpl::list<unsigned long, boost::ulong_long_type>   unsigned_types;
#else
   typedef mpl::list<long>                                signed_types;
   typedef mpl::list<unsigned long>                       unsigned_types;
#endif
   typedef mpl::list<double, long double>                 float_types;

   gmp_int()
   {
      mpz_init(this->m_data);
   }
   gmp_int(const gmp_int& o)
   {
      if(o.m_data[0]._mp_d)
         mpz_init_set(m_data, o.m_data);
      else
         mpz_init(this->m_data);
   }
#ifndef BOOST_NO_CXX11_RVALUE_REFERENCES
   gmp_int(gmp_int&& o) BOOST_NOEXCEPT
   {
      m_data[0] = o.m_data[0];
      o.m_data[0]._mp_d = 0;
   }
#endif
   explicit gmp_int(const mpf_t val)
   {
      mpz_init(this->m_data);
      mpz_set_f(this->m_data, val);
   }
   gmp_int(const mpz_t val)
   {
      mpz_init_set(this->m_data, val);
   }
   explicit gmp_int(const mpq_t val)
   {
      mpz_init(this->m_data);
      mpz_set_q(this->m_data, val);
   }
   template <unsigned Digits10>
   explicit gmp_int(const gmp_float<Digits10>& o)
   {
      mpz_init(this->m_data);
      mpz_set_f(this->m_data, o.data());
   }
   explicit gmp_int(const gmp_rational& o);
   gmp_int& operator = (const gmp_int& o)
   {
      if(m_data[0]._mp_d == 0)
         mpz_init(this->m_data);
      mpz_set(m_data, o.m_data);
      return *this;
   }
#ifndef BOOST_NO_CXX11_RVALUE_REFERENCES
   gmp_int& operator = (gmp_int&& o) BOOST_NOEXCEPT
   {
      mpz_swap(m_data, o.m_data);
      return *this;
   }
#endif
#ifdef BOOST_HAS_LONG_LONG
#if defined(ULLONG_MAX) && (ULLONG_MAX == ULONG_MAX)
   gmp_int& operator = (boost::ulong_long_type i)
   {
      *this = static_cast<unsigned long>(i);
      return *this;
   }
#else
   gmp_int& operator = (boost::ulong_long_type i)
   {
      if(m_data[0]._mp_d == 0)
         mpz_init(this->m_data);
      boost::ulong_long_type mask = ((((1uLL << (std::numeric_limits<unsigned long>::digits - 1)) - 1) << 1) | 1uLL);
      unsigned shift = 0;
      mpz_t t;
      mpz_set_ui(m_data, 0);
      mpz_init_set_ui(t, 0);
      while(i)
      {
         mpz_set_ui(t, static_cast<unsigned long>(i & mask));
         if(shift)
            mpz_mul_2exp(t, t, shift);
         mpz_add(m_data, m_data, t);
         shift += std::numeric_limits<unsigned long>::digits;
         i >>= std::numeric_limits<unsigned long>::digits;
      }
      mpz_clear(t);
      return *this;
   }
#endif
   gmp_int& operator = (boost::long_long_type i)
   {
      if(m_data[0]._mp_d == 0)
         mpz_init(this->m_data);
      bool neg = i < 0;
      *this = boost::multiprecision::detail::unsigned_abs(i);
      if(neg)
         mpz_neg(m_data, m_data);
      return *this;
   }
#endif
   gmp_int& operator = (unsigned long i)
   {
      if(m_data[0]._mp_d == 0)
         mpz_init(this->m_data);
      mpz_set_ui(m_data, i);
      return *this;
   }
   gmp_int& operator = (long i)
   {
      if(m_data[0]._mp_d == 0)
         mpz_init(this->m_data);
      mpz_set_si(m_data, i);
      return *this;
   }
   gmp_int& operator = (double d)
   {
      if(m_data[0]._mp_d == 0)
         mpz_init(this->m_data);
      mpz_set_d(m_data, d);
      return *this;
   }
   gmp_int& operator = (long double a)
   {
      using std::frexp;
      using std::ldexp;
      using std::floor;

      if(m_data[0]._mp_d == 0)
         mpz_init(this->m_data);

      if (a == 0) {
         mpz_set_si(m_data, 0);
         return *this;
      }

      if (a == 1) {
         mpz_set_si(m_data, 1);
         return *this;
      }

      BOOST_ASSERT(!(boost::math::isinf)(a));
      BOOST_ASSERT(!(boost::math::isnan)(a));

      int e;
      long double f, term;
      mpz_set_ui(m_data, 0u);

      f = frexp(a, &e);

      static const int shift = std::numeric_limits<int>::digits - 1;

      while(f)
      {
         // extract int sized bits from f:
         f = ldexp(f, shift);
         term = floor(f);
         e -= shift;
         mpz_mul_2exp(m_data, m_data, shift);
         if(term > 0)
            mpz_add_ui(m_data, m_data, static_cast<unsigned>(term));
         else
            mpz_sub_ui(m_data, m_data, static_cast<unsigned>(-term));
         f -= term;
      }
      if(e > 0)
         mpz_mul_2exp(m_data, m_data, e);
      else if(e < 0)
         mpz_div_2exp(m_data, m_data, -e);
      return *this;
   }
   gmp_int& operator = (const char* s)
   {
      if(m_data[0]._mp_d == 0)
         mpz_init(this->m_data);
      std::size_t n = s ? std::strlen(s) : 0;
      int radix = 10;
      if(n && (*s == '0'))
      {
         if((n > 1) && ((s[1] == 'x') || (s[1] == 'X')))
         {
            radix = 16;
            s +=2;
            n -= 2;
         }
         else
         {
            radix = 8;
            n -= 1;
         }
      }
      if(n)
      {
         if(0 != mpz_set_str(m_data, s, radix))
            BOOST_THROW_EXCEPTION(std::runtime_error(std::string("The string \"") + s + std::string("\"could not be interpreted as a valid integer.")));
      }
      else
         mpz_set_ui(m_data, 0);
      return *this;
   }
   gmp_int& operator=(const mpf_t val)
   {
      if(m_data[0]._mp_d == 0)
         mpz_init(this->m_data);
      mpz_set_f(this->m_data, val);
      return *this;
   }
   gmp_int& operator=(const mpz_t val)
   {
      if(m_data[0]._mp_d == 0)
         mpz_init(this->m_data);
      mpz_set(this->m_data, val);
      return *this;
   }
   gmp_int& operator=(const mpq_t val)
   {
      if(m_data[0]._mp_d == 0)
         mpz_init(this->m_data);
      mpz_set_q(this->m_data, val);
      return *this;
   }
   template <unsigned Digits10>
   gmp_int& operator=(const gmp_float<Digits10>& o)
   {
      if(m_data[0]._mp_d == 0)
         mpz_init(this->m_data);
      mpz_set_f(this->m_data, o.data());
      return *this;
   }
   gmp_int& operator=(const gmp_rational& o);
   void swap(gmp_int& o)
   {
      mpz_swap(m_data, o.m_data);
   }
   std::string str(std::streamsize /*digits*/, std::ios_base::fmtflags f)const
   {
      BOOST_ASSERT(m_data[0]._mp_d);

      int base = 10;
      if((f & std::ios_base::oct) == std::ios_base::oct)
         base = 8;
      else if((f & std::ios_base::hex) == std::ios_base::hex)
         base = 16;
      //
      // sanity check, bases 8 and 16 are only available for positive numbers:
      //
      if((base != 10) && (mpz_sgn(m_data) < 0))
         BOOST_THROW_EXCEPTION(std::runtime_error("Formatted output in bases 8 or 16 is only available for positive numbers"));
      void *(*alloc_func_ptr) (size_t);
      void *(*realloc_func_ptr) (void *, size_t, size_t);
      void (*free_func_ptr) (void *, size_t);
      const char* ps = mpz_get_str (0, base, m_data);
      std::string s = ps;
      mp_get_memory_functions(&alloc_func_ptr, &realloc_func_ptr, &free_func_ptr);
      (*free_func_ptr)((void*)ps, std::strlen(ps) + 1);

      if((base != 10) && (f & std::ios_base::showbase))
      {
         int pos = s[0] == '-' ? 1 : 0;
         const char* pp = base == 8 ? "0" : "0x";
         s.insert(static_cast<std::string::size_type>(pos), pp);
      }
      if((f & std::ios_base::showpos) && (s[0] != '-'))
         s.insert(static_cast<std::string::size_type>(0), 1, '+');

      return s;
   }
   ~gmp_int() BOOST_NOEXCEPT
   {
      if(m_data[0]._mp_d)
         mpz_clear(m_data);
   }
   void negate() BOOST_NOEXCEPT
   {
      BOOST_ASSERT(m_data[0]._mp_d);
      mpz_neg(m_data, m_data);
   }
   int compare(const gmp_int& o)const BOOST_NOEXCEPT
   {
      BOOST_ASSERT(m_data[0]._mp_d && o.m_data[0]._mp_d);
      return mpz_cmp(m_data, o.m_data);
   }
   int compare(long i)const BOOST_NOEXCEPT
   {
      BOOST_ASSERT(m_data[0]._mp_d);
      return mpz_cmp_si(m_data, i);
   }
   int compare(unsigned long i)const BOOST_NOEXCEPT
   {
      BOOST_ASSERT(m_data[0]._mp_d);
      return mpz_cmp_ui(m_data, i);
   }
   template <class V>
   int compare(V v)const
   {
      gmp_int d;
      d = v;
      return compare(d);
   }
   mpz_t& data() BOOST_NOEXCEPT
   {
      BOOST_ASSERT(m_data[0]._mp_d);
      return m_data;
   }
   const mpz_t& data()const BOOST_NOEXCEPT
   {
      BOOST_ASSERT(m_data[0]._mp_d);
      return m_data;
   }
protected:
   mpz_t m_data;
};

template <class T>
inline typename enable_if<is_arithmetic<T>, bool>::type eval_eq(const gmp_int& a, const T& b)
{
   return a.compare(b) == 0;
}
template <class T>
inline typename enable_if<is_arithmetic<T>, bool>::type eval_lt(const gmp_int& a, const T& b)
{
   return a.compare(b) < 0;
}
template <class T>
inline typename enable_if<is_arithmetic<T>, bool>::type eval_gt(const gmp_int& a, const T& b)
{
   return a.compare(b) > 0;
}

inline bool eval_is_zero(const gmp_int& val)
{
   return mpz_sgn(val.data()) == 0;
}
inline void eval_add(gmp_int& t, const gmp_int& o)
{
   mpz_add(t.data(), t.data(), o.data());
}
inline void eval_multiply_add(gmp_int& t, const gmp_int& a, const gmp_int& b)
{
   mpz_addmul(t.data(), a.data(), b.data());
}
inline void eval_multiply_subtract(gmp_int& t, const gmp_int& a, const gmp_int& b)
{
   mpz_submul(t.data(), a.data(), b.data());
}
inline void eval_subtract(gmp_int& t, const gmp_int& o)
{
   mpz_sub(t.data(), t.data(), o.data());
}
inline void eval_multiply(gmp_int& t, const gmp_int& o)
{
   mpz_mul(t.data(), t.data(), o.data());
}
inline void eval_divide(gmp_int& t, const gmp_int& o)
{
   if(eval_is_zero(o))
      BOOST_THROW_EXCEPTION(std::overflow_error("Division by zero."));
   mpz_tdiv_q(t.data(), t.data(), o.data());
}
inline void eval_modulus(gmp_int& t, const gmp_int& o)
{
   mpz_tdiv_r(t.data(), t.data(), o.data());
}
inline void eval_add(gmp_int& t, unsigned long i)
{
   mpz_add_ui(t.data(), t.data(), i);
}
inline void eval_multiply_add(gmp_int& t, const gmp_int& a, unsigned long i)
{
   mpz_addmul_ui(t.data(), a.data(), i);
}
inline void eval_multiply_subtract(gmp_int& t, const gmp_int& a, unsigned long i)
{
   mpz_submul_ui(t.data(), a.data(), i);
}
inline void eval_subtract(gmp_int& t, unsigned long i)
{
   mpz_sub_ui(t.data(), t.data(), i);
}
inline void eval_multiply(gmp_int& t, unsigned long i)
{
   mpz_mul_ui(t.data(), t.data(), i);
}
inline void eval_modulus(gmp_int& t, unsigned long i)
{
   mpz_tdiv_r_ui(t.data(), t.data(), i);
}
inline void eval_divide(gmp_int& t, unsigned long i)
{
   if(i == 0)
      BOOST_THROW_EXCEPTION(std::overflow_error("Division by zero."));
   mpz_tdiv_q_ui(t.data(), t.data(), i);
}
inline void eval_add(gmp_int& t, long i)
{
   if(i > 0)
      mpz_add_ui(t.data(), t.data(), i);
   else
      mpz_sub_ui(t.data(), t.data(), boost::multiprecision::detail::unsigned_abs(i));
}
inline void eval_multiply_add(gmp_int& t, const gmp_int& a, long i)
{
   if(i > 0)
      mpz_addmul_ui(t.data(), a.data(), i);
   else
      mpz_submul_ui(t.data(), a.data(), boost::multiprecision::detail::unsigned_abs(i));
}
inline void eval_multiply_subtract(gmp_int& t, const gmp_int& a, long i)
{
   if(i > 0)
      mpz_submul_ui(t.data(), a.data(), i);
   else
      mpz_addmul_ui(t.data(), a.data(), boost::multiprecision::detail::unsigned_abs(i));
}
inline void eval_subtract(gmp_int& t, long i)
{
   if(i > 0)
      mpz_sub_ui(t.data(), t.data(), i);
   else
      mpz_add_ui(t.data(), t.data(), boost::multiprecision::detail::unsigned_abs(i));
}
inline void eval_multiply(gmp_int& t, long i)
{
   mpz_mul_ui(t.data(), t.data(), boost::multiprecision::detail::unsigned_abs(i));
   if(i < 0)
      mpz_neg(t.data(), t.data());
}
inline void eval_modulus(gmp_int& t, long i)
{
   mpz_tdiv_r_ui(t.data(), t.data(), boost::multiprecision::detail::unsigned_abs(i));
}
inline void eval_divide(gmp_int& t, long i)
{
   if(i == 0)
      BOOST_THROW_EXCEPTION(std::overflow_error("Division by zero."));
   mpz_tdiv_q_ui(t.data(), t.data(), boost::multiprecision::detail::unsigned_abs(i));
   if(i < 0)
      mpz_neg(t.data(), t.data());
}
template <class UI>
inline void eval_left_shift(gmp_int& t, UI i)
{
   mpz_mul_2exp(t.data(), t.data(), static_cast<unsigned long>(i));
}
template <class UI>
inline void eval_right_shift(gmp_int& t, UI i)
{
   mpz_fdiv_q_2exp(t.data(), t.data(), static_cast<unsigned long>(i));
}
template <class UI>
inline void eval_left_shift(gmp_int& t, const gmp_int& v, UI i)
{
   mpz_mul_2exp(t.data(), v.data(), static_cast<unsigned long>(i));
}
template <class UI>
inline void eval_right_shift(gmp_int& t, const gmp_int& v, UI i)
{
   mpz_fdiv_q_2exp(t.data(), v.data(), static_cast<unsigned long>(i));
}

inline void eval_bitwise_and(gmp_int& result, const gmp_int& v)
{
   mpz_and(result.data(), result.data(), v.data());
}

inline void eval_bitwise_or(gmp_int& result, const gmp_int& v)
{
   mpz_ior(result.data(), result.data(), v.data());
}

inline void eval_bitwise_xor(gmp_int& result, const gmp_int& v)
{
   mpz_xor(result.data(), result.data(), v.data());
}

inline void eval_add(gmp_int& t, const gmp_int& p, const gmp_int& o)
{
   mpz_add(t.data(), p.data(), o.data());
}
inline void eval_subtract(gmp_int& t, const gmp_int& p, const gmp_int& o)
{
   mpz_sub(t.data(), p.data(), o.data());
}
inline void eval_multiply(gmp_int& t, const gmp_int& p, const gmp_int& o)
{
   mpz_mul(t.data(), p.data(), o.data());
}
inline void eval_divide(gmp_int& t, const gmp_int& p, const gmp_int& o)
{
   if(eval_is_zero(o))
      BOOST_THROW_EXCEPTION(std::overflow_error("Division by zero."));
   mpz_tdiv_q(t.data(), p.data(), o.data());
}
inline void eval_modulus(gmp_int& t, const gmp_int& p, const gmp_int& o)
{
   mpz_tdiv_r(t.data(), p.data(), o.data());
}
inline void eval_add(gmp_int& t, const gmp_int& p, unsigned long i)
{
   mpz_add_ui(t.data(), p.data(), i);
}
inline void eval_subtract(gmp_int& t, const gmp_int& p, unsigned long i)
{
   mpz_sub_ui(t.data(), p.data(), i);
}
inline void eval_multiply(gmp_int& t, const gmp_int& p, unsigned long i)
{
   mpz_mul_ui(t.data(), p.data(), i);
}
inline void eval_modulus(gmp_int& t, const gmp_int& p, unsigned long i)
{
   mpz_tdiv_r_ui(t.data(), p.data(), i);
}
inline void eval_divide(gmp_int& t, const gmp_int& p, unsigned long i)
{
   if(i == 0)
      BOOST_THROW_EXCEPTION(std::overflow_error("Division by zero."));
   mpz_tdiv_q_ui(t.data(), p.data(), i);
}
inline void eval_add(gmp_int& t, const gmp_int& p, long i)
{
   if(i > 0)
      mpz_add_ui(t.data(), p.data(), i);
   else
      mpz_sub_ui(t.data(), p.data(), boost::multiprecision::detail::unsigned_abs(i));
}
inline void eval_subtract(gmp_int& t, const gmp_int& p, long i)
{
   if(i > 0)
      mpz_sub_ui(t.data(), p.data(), i);
   else
      mpz_add_ui(t.data(), p.data(), boost::multiprecision::detail::unsigned_abs(i));
}
inline void eval_multiply(gmp_int& t, const gmp_int& p, long i)
{
   mpz_mul_ui(t.data(), p.data(), boost::multiprecision::detail::unsigned_abs(i));
   if(i < 0)
      mpz_neg(t.data(), t.data());
}
inline void eval_modulus(gmp_int& t, const gmp_int& p, long i)
{
   mpz_tdiv_r_ui(t.data(), p.data(), boost::multiprecision::detail::unsigned_abs(i));
}
inline void eval_divide(gmp_int& t, const gmp_int& p, long i)
{
   if(i == 0)
      BOOST_THROW_EXCEPTION(std::overflow_error("Division by zero."));
   mpz_tdiv_q_ui(t.data(), p.data(), boost::multiprecision::detail::unsigned_abs(i));
   if(i < 0)
      mpz_neg(t.data(), t.data());
}

inline void eval_bitwise_and(gmp_int& result, const gmp_int& u, const gmp_int& v)
{
   mpz_and(result.data(), u.data(), v.data());
}

inline void eval_bitwise_or(gmp_int& result, const gmp_int& u, const gmp_int& v)
{
   mpz_ior(result.data(), u.data(), v.data());
}

inline void eval_bitwise_xor(gmp_int& result, const gmp_int& u, const gmp_int& v)
{
   mpz_xor(result.data(), u.data(), v.data());
}

inline void eval_complement(gmp_int& result, const gmp_int& u)
{
   mpz_com(result.data(), u.data());
}

inline int eval_get_sign(const gmp_int& val)
{
   return mpz_sgn(val.data());
}
inline void eval_convert_to(unsigned long* result, const gmp_int& val)
{
   if(0 == mpz_fits_ulong_p(val.data()))
   {
      *result = (std::numeric_limits<unsigned long>::max)();
   }
   else
      *result = mpz_get_ui(val.data());
}
inline void eval_convert_to(long* result, const gmp_int& val)
{
   if(0 == mpz_fits_slong_p(val.data()))
   {
      *result = (std::numeric_limits<unsigned long>::max)();
      *result *= mpz_sgn(val.data());
   }
   else
      *result = mpz_get_si(val.data());
}
inline void eval_convert_to(double* result, const gmp_int& val)
{
   *result = mpz_get_d(val.data());
}

inline void eval_abs(gmp_int& result, const gmp_int& val)
{
   mpz_abs(result.data(), val.data());
}

inline void eval_gcd(gmp_int& result, const gmp_int& a, const gmp_int& b)
{
   mpz_gcd(result.data(), a.data(), b.data());
}
inline void eval_lcm(gmp_int& result, const gmp_int& a, const gmp_int& b)
{
   mpz_lcm(result.data(), a.data(), b.data());
}
template <class I>
inline typename enable_if_c<(is_unsigned<I>::value && (sizeof(I) <= sizeof(unsigned long)))>::type eval_gcd(gmp_int& result, const gmp_int& a, const I b)
{
   mpz_gcd_ui(result.data(), a.data(), b);
}
template <class I>
inline typename enable_if_c<(is_unsigned<I>::value && (sizeof(I) <= sizeof(unsigned long)))>::type eval_lcm(gmp_int& result, const gmp_int& a, const I b)
{
   mpz_lcm_ui(result.data(), a.data(), b);
}
template <class I>
inline typename enable_if_c<(is_signed<I>::value && (sizeof(I) <= sizeof(long)))>::type eval_gcd(gmp_int& result, const gmp_int& a, const I b)
{
   mpz_gcd_ui(result.data(), a.data(), boost::multiprecision::detail::unsigned_abs(b));
}
template <class I>
inline typename enable_if_c<is_signed<I>::value && ((sizeof(I) <= sizeof(long)))>::type eval_lcm(gmp_int& result, const gmp_int& a, const I b)
{
   mpz_lcm_ui(result.data(), a.data(), boost::multiprecision::detail::unsigned_abs(b));
}

inline void eval_integer_sqrt(gmp_int& s, gmp_int& r, const gmp_int& x)
{
   mpz_sqrtrem(s.data(), r.data(), x.data());
}

inline unsigned eval_lsb(const gmp_int& val)
{
   int c = eval_get_sign(val);
   if(c == 0)
   {
      BOOST_THROW_EXCEPTION(std::range_error("No bits were set in the operand."));
   }
   if(c < 0)
   {
      BOOST_THROW_EXCEPTION(std::range_error("Testing individual bits in negative values is not supported - results are undefined."));
   }
   return static_cast<unsigned>(mpz_scan1(val.data(), 0));
}

inline unsigned eval_msb(const gmp_int& val)
{
   int c = eval_get_sign(val);
   if(c == 0)
   {
      BOOST_THROW_EXCEPTION(std::range_error("No bits were set in the operand."));
   }
   if(c < 0)
   {
      BOOST_THROW_EXCEPTION(std::range_error("Testing individual bits in negative values is not supported - results are undefined."));
   }
   return static_cast<unsigned>(mpz_sizeinbase(val.data(), 2) - 1);
}

inline bool eval_bit_test(const gmp_int& val, unsigned index)
{
   return mpz_tstbit(val.data(), index) ? true : false;
}

inline void eval_bit_set(gmp_int& val, unsigned index)
{
   mpz_setbit(val.data(), index);
}

inline void eval_bit_unset(gmp_int& val, unsigned index)
{
   mpz_clrbit(val.data(), index);
}

inline void eval_bit_flip(gmp_int& val, unsigned index)
{
   mpz_combit(val.data(), index);
}

inline void eval_qr(const gmp_int& x, const gmp_int& y,
   gmp_int& q, gmp_int& r)
{
   mpz_tdiv_qr(q.data(), r.data(), x.data(), y.data());
}

template <class Integer>
inline typename enable_if<is_unsigned<Integer>, Integer>::type eval_integer_modulus(const gmp_int& x, Integer val)
{
   if((sizeof(Integer) <= sizeof(long)) || (val <= (std::numeric_limits<unsigned long>::max)()))
   {
      return mpz_tdiv_ui(x.data(), val);
   }
   else
   {
      return default_ops::eval_integer_modulus(x, val);
   }
}
template <class Integer>
inline typename enable_if<is_signed<Integer>, Integer>::type eval_integer_modulus(const gmp_int& x, Integer val)
{
   return eval_integer_modulus(x, boost::multiprecision::detail::unsigned_abs(val));
}
inline void eval_powm(gmp_int& result, const gmp_int& base, const gmp_int& p, const gmp_int& m)
{
   if(eval_get_sign(p) < 0)
   {
      BOOST_THROW_EXCEPTION(std::runtime_error("powm requires a positive exponent."));
   }
   mpz_powm(result.data(), base.data(), p.data(), m.data());
}

template <class Integer>
inline typename enable_if<
   mpl::and_<
      is_unsigned<Integer>,
      mpl::bool_<sizeof(Integer) <= sizeof(unsigned long)>
   >
>::type eval_powm(gmp_int& result, const gmp_int& base, Integer p, const gmp_int& m)
{
   mpz_powm_ui(result.data(), base.data(), p, m.data());
}
template <class Integer>
inline typename enable_if<
   mpl::and_<
      is_signed<Integer>,
      mpl::bool_<sizeof(Integer) <= sizeof(unsigned long)>
   >
>::type eval_powm(gmp_int& result, const gmp_int& base, Integer p, const gmp_int& m)
{
   if(p < 0)
   {
      BOOST_THROW_EXCEPTION(std::runtime_error("powm requires a positive exponent."));
   }
   mpz_powm_ui(result.data(), base.data(), p, m.data());
}

inline std::size_t hash_value(const gmp_int& val)
{
   // We should really use mpz_limbs_read here, but that's unsupported on older versions:
   std::size_t result = 0;
   for(int i = 0; i < std::abs(val.data()[0]._mp_size); ++i)
      boost::hash_combine(result, val.data()[0]._mp_d[i]);
   boost::hash_combine(result, val.data()[0]._mp_size);
   return result;
}

struct gmp_rational;
void eval_add(gmp_rational& t, const gmp_rational& o);

struct gmp_rational
{
#ifdef BOOST_HAS_LONG_LONG
   typedef mpl::list<long, boost::long_long_type>                     signed_types;
   typedef mpl::list<unsigned long, boost::ulong_long_type>   unsigned_types;
#else
   typedef mpl::list<long>                                signed_types;
   typedef mpl::list<unsigned long>                       unsigned_types;
#endif
   typedef mpl::list<double, long double>                 float_types;

   gmp_rational()
   {
      mpq_init(this->m_data);
   }
   gmp_rational(const gmp_rational& o)
   {
      mpq_init(m_data);
      if(o.m_data[0]._mp_num._mp_d)
         mpq_set(m_data, o.m_data);
   }
   gmp_rational(const gmp_int& o)
   {
      mpq_init(m_data);
      mpq_set_z(m_data, o.data());
   }
#ifndef BOOST_NO_CXX11_RVALUE_REFERENCES
   gmp_rational(gmp_rational&& o) BOOST_NOEXCEPT
   {
      m_data[0] = o.m_data[0];
      o.m_data[0]._mp_num._mp_d = 0;
      o.m_data[0]._mp_den._mp_d = 0;
   }
#endif
   gmp_rational(const mpq_t o)
   {
      mpq_init(m_data);
      mpq_set(m_data, o);
   }
   gmp_rational(const mpz_t o)
   {
      mpq_init(m_data);
      mpq_set_z(m_data, o);
   }
   gmp_rational& operator = (const gmp_rational& o)
   {
      if(m_data[0]._mp_den._mp_d == 0)
         mpq_init(m_data);
      mpq_set(m_data, o.m_data);
      return *this;
   }
#ifndef BOOST_NO_CXX11_RVALUE_REFERENCES
   gmp_rational& operator = (gmp_rational&& o) BOOST_NOEXCEPT
   {
      mpq_swap(m_data, o.m_data);
      return *this;
   }
#endif
#ifdef BOOST_HAS_LONG_LONG
#if defined(ULLONG_MAX) && (ULLONG_MAX == ULONG_MAX)
   gmp_rational& operator = (boost::ulong_long_type i)
   {
      *this = static_cast<unsigned long>(i);
      return *this;
   }
#else
   gmp_rational& operator = (boost::ulong_long_type i)
   {
      if(m_data[0]._mp_den._mp_d == 0)
         mpq_init(m_data);
      gmp_int zi;
      zi = i;
      mpq_set_z(m_data, zi.data());
      return *this;
   }
   gmp_rational& operator = (boost::long_long_type i)
   {
      if(m_data[0]._mp_den._mp_d == 0)
         mpq_init(m_data);
      bool neg = i < 0;
      *this = boost::multiprecision::detail::unsigned_abs(i);
      if(neg)
         mpq_neg(m_data, m_data);
      return *this;
   }
#endif
#endif
   gmp_rational& operator = (unsigned long i)
   {
      if(m_data[0]._mp_den._mp_d == 0)
         mpq_init(m_data);
      mpq_set_ui(m_data, i, 1);
      return *this;
   }
   gmp_rational& operator = (long i)
   {
      if(m_data[0]._mp_den._mp_d == 0)
         mpq_init(m_data);
      mpq_set_si(m_data, i, 1);
      return *this;
   }
   gmp_rational& operator = (double d)
   {
      if(m_data[0]._mp_den._mp_d == 0)
         mpq_init(m_data);
      mpq_set_d(m_data, d);
      return *this;
   }
   gmp_rational& operator = (long double a)
   {
      using std::frexp;
      using std::ldexp;
      using std::floor;
      using default_ops::eval_add;
      using default_ops::eval_subtract;

      if(m_data[0]._mp_den._mp_d == 0)
         mpq_init(m_data);

      if (a == 0) {
         mpq_set_si(m_data, 0, 1);
         return *this;
      }

      if (a == 1) {
         mpq_set_si(m_data, 1, 1);
         return *this;
      }

      BOOST_ASSERT(!(boost::math::isinf)(a));
      BOOST_ASSERT(!(boost::math::isnan)(a));

      int e;
      long double f, term;
      mpq_set_ui(m_data, 0, 1);
      mpq_set_ui(m_data, 0u, 1);
      gmp_rational t;

      f = frexp(a, &e);

      static const int shift = std::numeric_limits<int>::digits - 1;

      while(f)
      {
         // extract int sized bits from f:
         f = ldexp(f, shift);
         term = floor(f);
         e -= shift;
         mpq_mul_2exp(m_data, m_data, shift);
         t = static_cast<long>(term);
         eval_add(*this, t);
         f -= term;
      }
      if(e > 0)
         mpq_mul_2exp(m_data, m_data, e);
      else if(e < 0)
         mpq_div_2exp(m_data, m_data, -e);
      return *this;
   }
   gmp_rational& operator = (const char* s)
   {
      if(m_data[0]._mp_den._mp_d == 0)
         mpq_init(m_data);
      if(0 != mpq_set_str(m_data, s, 10))
         BOOST_THROW_EXCEPTION(std::runtime_error(std::string("The string \"") + s + std::string("\"could not be interpreted as a valid rational number.")));
      return *this;
   }
   gmp_rational& operator=(const gmp_int& o)
   {
      if(m_data[0]._mp_den._mp_d == 0)
         mpq_init(m_data);
      mpq_set_z(m_data, o.data());
      return *this;
   }
   gmp_rational& operator=(const mpq_t o)
   {
      if(m_data[0]._mp_den._mp_d == 0)
         mpq_init(m_data);
      mpq_set(m_data, o);
      return *this;
   }
   gmp_rational& operator=(const mpz_t o)
   {
      if(m_data[0]._mp_den._mp_d == 0)
         mpq_init(m_data);
      mpq_set_z(m_data, o);
      return *this;
   }
   void swap(gmp_rational& o)
   {
      mpq_swap(m_data, o.m_data);
   }
   std::string str(std::streamsize /*digits*/, std::ios_base::fmtflags /*f*/)const
   {
      BOOST_ASSERT(m_data[0]._mp_num._mp_d);
      // TODO make a better job of this including handling of f!!
      void *(*alloc_func_ptr) (size_t);
      void *(*realloc_func_ptr) (void *, size_t, size_t);
      void (*free_func_ptr) (void *, size_t);
      const char* ps = mpq_get_str (0, 10, m_data);
      std::string s = ps;
      mp_get_memory_functions(&alloc_func_ptr, &realloc_func_ptr, &free_func_ptr);
      (*free_func_ptr)((void*)ps, std::strlen(ps) + 1);
      return s;
   }
   ~gmp_rational()
   {
      if(m_data[0]._mp_num._mp_d || m_data[0]._mp_den._mp_d)
         mpq_clear(m_data);
   }
   void negate()
   {
      BOOST_ASSERT(m_data[0]._mp_num._mp_d);
      mpq_neg(m_data, m_data);
   }
   int compare(const gmp_rational& o)const
   {
      BOOST_ASSERT(m_data[0]._mp_num._mp_d && o.m_data[0]._mp_num._mp_d);
      return mpq_cmp(m_data, o.m_data);
   }
   template <class V>
   int compare(V v)const
   {
      gmp_rational d;
      d = v;
      return compare(d);
   }
   int compare(unsigned long v)const
   {
      BOOST_ASSERT(m_data[0]._mp_num._mp_d);
      return mpq_cmp_ui(m_data, v, 1);
   }
   int compare(long v)const
   {
      BOOST_ASSERT(m_data[0]._mp_num._mp_d);
      return mpq_cmp_si(m_data, v, 1);
   }
   mpq_t& data()
   {
      BOOST_ASSERT(m_data[0]._mp_num._mp_d);
      return m_data;
   }
   const mpq_t& data()const
   {
      BOOST_ASSERT(m_data[0]._mp_num._mp_d);
      return m_data;
   }
protected:
   mpq_t m_data;
};

inline bool eval_is_zero(const gmp_rational& val)
{
   return mpq_sgn(val.data()) == 0;
}
template <class T>
inline bool eval_eq(gmp_rational& a, const T& b)
{
   return a.compare(b) == 0;
}
template <class T>
inline bool eval_lt(gmp_rational& a, const T& b)
{
   return a.compare(b) < 0;
}
template <class T>
inline bool eval_gt(gmp_rational& a, const T& b)
{
   return a.compare(b) > 0;
}

inline void eval_add(gmp_rational& t, const gmp_rational& o)
{
   mpq_add(t.data(), t.data(), o.data());
}
inline void eval_subtract(gmp_rational& t, const gmp_rational& o)
{
   mpq_sub(t.data(), t.data(), o.data());
}
inline void eval_multiply(gmp_rational& t, const gmp_rational& o)
{
   mpq_mul(t.data(), t.data(), o.data());
}
inline void eval_divide(gmp_rational& t, const gmp_rational& o)
{
   if(eval_is_zero(o))
      BOOST_THROW_EXCEPTION(std::overflow_error("Division by zero."));
   mpq_div(t.data(), t.data(), o.data());
}
inline void eval_add(gmp_rational& t, const gmp_rational& p, const gmp_rational& o)
{
   mpq_add(t.data(), p.data(), o.data());
}
inline void eval_subtract(gmp_rational& t, const gmp_rational& p, const gmp_rational& o)
{
   mpq_sub(t.data(), p.data(), o.data());
}
inline void eval_multiply(gmp_rational& t, const gmp_rational& p, const gmp_rational& o)
{
   mpq_mul(t.data(), p.data(), o.data());
}
inline void eval_divide(gmp_rational& t, const gmp_rational& p, const gmp_rational& o)
{
   if(eval_is_zero(o))
      BOOST_THROW_EXCEPTION(std::overflow_error("Division by zero."));
   mpq_div(t.data(), p.data(), o.data());
}

inline int eval_get_sign(const gmp_rational& val)
{
   return mpq_sgn(val.data());
}
inline void eval_convert_to(double* result, const gmp_rational& val)
{
   //
   // This does not round correctly:
   //
   //*result = mpq_get_d(val.data());
   //
   // This does:
   //
   boost::multiprecision::detail::generic_convert_rational_to_float(*result, val);
}

inline void eval_convert_to(long* result, const gmp_rational& val)
{
   double r;
   eval_convert_to(&r, val);
   *result = static_cast<long>(r);
}

inline void eval_convert_to(unsigned long* result, const gmp_rational& val)
{
   double r;
   eval_convert_to(&r, val);
   *result = static_cast<long>(r);
}

inline void eval_abs(gmp_rational& result, const gmp_rational& val)
{
   mpq_abs(result.data(), val.data());
}

inline void assign_components(gmp_rational& result, unsigned long v1, unsigned long v2)
{
   mpq_set_ui(result.data(), v1, v2);
   mpq_canonicalize(result.data());
}
inline void assign_components(gmp_rational& result, long v1, long v2)
{
   mpq_set_si(result.data(), v1, v2);
   mpq_canonicalize(result.data());
}
inline void assign_components(gmp_rational& result, gmp_int const& v1, gmp_int const& v2)
{
   mpz_set(mpq_numref(result.data()), v1.data());
   mpz_set(mpq_denref(result.data()), v2.data());
   mpq_canonicalize(result.data());
}

inline std::size_t hash_value(const gmp_rational& val)
{
   std::size_t result = 0;
   for(int i = 0; i < std::abs(val.data()[0]._mp_num._mp_size); ++i)
      boost::hash_combine(result, val.data()[0]._mp_num._mp_d[i]);
   for(int i = 0; i < std::abs(val.data()[0]._mp_den._mp_size); ++i)
      boost::hash_combine(result, val.data()[0]._mp_den._mp_d[i]);
   boost::hash_combine(result, val.data()[0]._mp_num._mp_size);
   return result;
}

//
// Some member functions that are dependent upon previous code go here:
//
template <unsigned Digits10>
template <unsigned D>
inline gmp_float<Digits10>::gmp_float(const gmp_float<D>& o, typename enable_if_c<D <= Digits10>::type*)
{
   mpf_init2(this->m_data, multiprecision::detail::digits10_2_2(Digits10 ? Digits10 : this->get_default_precision()));
   mpf_set(this->m_data, o.data());
}
template <unsigned Digits10>
template <unsigned D>
inline gmp_float<Digits10>::gmp_float(const gmp_float<D>& o, typename disable_if_c<D <= Digits10>::type*)
{
   mpf_init2(this->m_data, multiprecision::detail::digits10_2_2(Digits10 ? Digits10 : this->get_default_precision()));
   mpf_set(this->m_data, o.data());
}
template <unsigned Digits10>
inline gmp_float<Digits10>::gmp_float(const gmp_int& o)
{
   mpf_init2(this->m_data, multiprecision::detail::digits10_2_2(Digits10 ? Digits10 : this->get_default_precision()));
   mpf_set_z(this->data(), o.data());
}
template <unsigned Digits10>
inline gmp_float<Digits10>::gmp_float(const gmp_rational& o)
{
   mpf_init2(this->m_data, multiprecision::detail::digits10_2_2(Digits10 ? Digits10 : this->get_default_precision()));
   mpf_set_q(this->data(), o.data());
}
template <unsigned Digits10>
template <unsigned D>
inline gmp_float<Digits10>& gmp_float<Digits10>::operator=(const gmp_float<D>& o)
{
   if(this->m_data[0]._mp_d == 0)
      mpf_init2(this->m_data, multiprecision::detail::digits10_2_2(Digits10 ? Digits10 : this->get_default_precision()));
   mpf_set(this->m_data, o.data());
   return *this;
}
template <unsigned Digits10>
inline gmp_float<Digits10>& gmp_float<Digits10>::operator=(const gmp_int& o)
{
   if(this->m_data[0]._mp_d == 0)
      mpf_init2(this->m_data, multiprecision::detail::digits10_2_2(Digits10 ? Digits10 : this->get_default_precision()));
   mpf_set_z(this->data(), o.data());
   return *this;
}
template <unsigned Digits10>
inline gmp_float<Digits10>& gmp_float<Digits10>::operator=(const gmp_rational& o)
{
   if(this->m_data[0]._mp_d == 0)
      mpf_init2(this->m_data, multiprecision::detail::digits10_2_2(Digits10 ? Digits10 : this->get_default_precision()));
   mpf_set_q(this->data(), o.data());
   return *this;
}
inline gmp_float<0>::gmp_float(const gmp_int& o)
{
   mpf_init2(this->m_data, multiprecision::detail::digits10_2_2(get_default_precision()));
   mpf_set_z(this->data(), o.data());
}
inline gmp_float<0>::gmp_float(const gmp_rational& o)
{
   mpf_init2(this->m_data, multiprecision::detail::digits10_2_2(get_default_precision()));
   mpf_set_q(this->data(), o.data());
}
inline gmp_float<0>& gmp_float<0>::operator=(const gmp_int& o)
{
   if(this->m_data[0]._mp_d == 0)
      mpf_init2(this->m_data, multiprecision::detail::digits10_2_2(this->get_default_precision()));
   mpf_set_z(this->data(), o.data());
   return *this;
}
inline gmp_float<0>& gmp_float<0>::operator=(const gmp_rational& o)
{
   if(this->m_data[0]._mp_d == 0)
      mpf_init2(this->m_data, multiprecision::detail::digits10_2_2(this->get_default_precision()));
   mpf_set_q(this->data(), o.data());
   return *this;
}
inline gmp_int::gmp_int(const gmp_rational& o)
{
   mpz_init(this->m_data);
   mpz_set_q(this->m_data, o.data());
}
inline gmp_int& gmp_int::operator=(const gmp_rational& o)
{
   if(this->m_data[0]._mp_d == 0)
      mpz_init(this->m_data);
   mpz_set_q(this->m_data, o.data());
   return *this;
}

} //namespace backends

using boost::multiprecision::backends::gmp_int;
using boost::multiprecision::backends::gmp_rational;
using boost::multiprecision::backends::gmp_float;

template <>
struct component_type<number<gmp_rational> >
{
   typedef number<gmp_int> type;
};

template <expression_template_option ET>
inline number<gmp_int, ET> numerator(const number<gmp_rational, ET>& val)
{
   number<gmp_int, ET> result;
   mpz_set(result.backend().data(), (mpq_numref(val.backend().data())));
   return result;
}
template <expression_template_option ET>
inline number<gmp_int, ET> denominator(const number<gmp_rational, ET>& val)
{
   number<gmp_int, ET> result;
   mpz_set(result.backend().data(), (mpq_denref(val.backend().data())));
   return result;
}

namespace detail{

#ifdef BOOST_NO_SFINAE_EXPR

template<>
struct is_explicitly_convertible<canonical<mpf_t, gmp_int>::type, gmp_int> : public mpl::true_ {};
template<>
struct is_explicitly_convertible<canonical<mpq_t, gmp_int>::type, gmp_int> : public mpl::true_ {};
template<unsigned Digits10>
struct is_explicitly_convertible<gmp_float<Digits10>, gmp_int> : public mpl::true_ {};
template<>
struct is_explicitly_convertible<gmp_rational, gmp_int> : public mpl::true_ {};
template<unsigned D1, unsigned D2>
struct is_explicitly_convertible<gmp_float<D1>, gmp_float<D2> > : public mpl::true_ {};

#endif

template <>
struct digits2<number<gmp_float<0>, et_on> >
{
   static long value()
   {
      return  multiprecision::detail::digits10_2_2(gmp_float<0>::default_precision());
   }
};

template <>
struct digits2<number<gmp_float<0>, et_off> >
{
   static long value()
   {
      return  multiprecision::detail::digits10_2_2(gmp_float<0>::default_precision());
   }
};

template <>
struct digits2<number<debug_adaptor<gmp_float<0> >, et_on> >
{
   static long value()
   {
      return  multiprecision::detail::digits10_2_2(gmp_float<0>::default_precision());
   }
};

template <>
struct digits2<number<debug_adaptor<gmp_float<0> >, et_off> >
{
   static long value()
   {
      return  multiprecision::detail::digits10_2_2(gmp_float<0>::default_precision());
   }
};

}

template<>
struct number_category<detail::canonical<mpz_t, gmp_int>::type> : public mpl::int_<number_kind_integer>{};
template<>
struct number_category<detail::canonical<mpq_t, gmp_rational>::type> : public mpl::int_<number_kind_rational>{};
template<>
struct number_category<detail::canonical<mpf_t, gmp_float<0> >::type> : public mpl::int_<number_kind_floating_point>{};


typedef number<gmp_float<50> >    mpf_float_50;
typedef number<gmp_float<100> >   mpf_float_100;
typedef number<gmp_float<500> >   mpf_float_500;
typedef number<gmp_float<1000> >  mpf_float_1000;
typedef number<gmp_float<0> >     mpf_float;
typedef number<gmp_int >         mpz_int;
typedef number<gmp_rational >    mpq_rational;

}  // namespace multiprecision

namespace math { namespace tools{

   template <>
   inline int digits<boost::multiprecision::mpf_float>()
#ifdef BOOST_MATH_NOEXCEPT
      BOOST_NOEXCEPT
#endif
   {
      return multiprecision::detail::digits10_2_2(boost::multiprecision::mpf_float::default_precision());
   }
   template <>
   inline int digits<boost::multiprecision::number<boost::multiprecision::gmp_float<0>, boost::multiprecision::et_off> >()
#ifdef BOOST_MATH_NOEXCEPT
      BOOST_NOEXCEPT
#endif
   {
      return multiprecision::detail::digits10_2_2(boost::multiprecision::mpf_float::default_precision());
   }

   template <>
   inline boost::multiprecision::mpf_float
      max_value<boost::multiprecision::mpf_float>()
   {
      boost::multiprecision::mpf_float result(0.5);
      mpf_mul_2exp(result.backend().data(), result.backend().data(), (std::numeric_limits<mp_exp_t>::max)() / 64 + 1);
      return result;
   }

   template <>
   inline boost::multiprecision::mpf_float
      min_value<boost::multiprecision::mpf_float>()
   {
      boost::multiprecision::mpf_float result(0.5);
      mpf_div_2exp(result.backend().data(), result.backend().data(), (std::numeric_limits<mp_exp_t>::min)() / 64 + 1);
      return result;
   }

   template <>
   inline boost::multiprecision::number<boost::multiprecision::gmp_float<0>, boost::multiprecision::et_off>
      max_value<boost::multiprecision::number<boost::multiprecision::gmp_float<0>, boost::multiprecision::et_off> >()
   {
      boost::multiprecision::number<boost::multiprecision::gmp_float<0>, boost::multiprecision::et_off> result(0.5);
      mpf_mul_2exp(result.backend().data(), result.backend().data(), (std::numeric_limits<mp_exp_t>::max)() / 64 + 1);
      return result;
   }

   template <>
   inline boost::multiprecision::number<boost::multiprecision::gmp_float<0>, boost::multiprecision::et_off>
      min_value<boost::multiprecision::number<boost::multiprecision::gmp_float<0>, boost::multiprecision::et_off> >()
   {
      boost::multiprecision::number<boost::multiprecision::gmp_float<0>, boost::multiprecision::et_off> result(0.5);
      mpf_div_2exp(result.backend().data(), result.backend().data(), (std::numeric_limits<mp_exp_t>::max)() / 64 + 1);
      return result;
   }

   template <>
   inline int digits<boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpf_float::backend_type> > >()
#ifdef BOOST_MATH_NOEXCEPT
      BOOST_NOEXCEPT
#endif
   {
      return multiprecision::detail::digits10_2_2(boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpf_float::backend_type> >::default_precision());
   }
   template <>
   inline int digits<boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::gmp_float<0> >, boost::multiprecision::et_off> >()
#ifdef BOOST_MATH_NOEXCEPT
      BOOST_NOEXCEPT
#endif
   {
      return multiprecision::detail::digits10_2_2(boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpf_float::backend_type> >::default_precision());
   }

   template <>
   inline boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpf_float::backend_type> >
      max_value<boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpf_float::backend_type> > >()
   {
      return max_value<boost::multiprecision::mpf_float>().backend();
   }

   template <>
   inline boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpf_float::backend_type> >
      min_value<boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpf_float::backend_type> > >()
   {
      return min_value<boost::multiprecision::mpf_float>().backend();
   }

   template <>
   inline boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::gmp_float<0> >, boost::multiprecision::et_off>
      max_value<boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::gmp_float<0> >, boost::multiprecision::et_off> >()
   {
      return max_value<boost::multiprecision::mpf_float>().backend();
   }

   template <>
   inline boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::gmp_float<0> >, boost::multiprecision::et_off>
      min_value<boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::gmp_float<0> >, boost::multiprecision::et_off> >()
   {
      return min_value<boost::multiprecision::mpf_float>().backend();
   }


}} // namespaces math::tools


}  // namespace boost

namespace std{

//
// numeric_limits [partial] specializations for the types declared in this header:
//
template<unsigned Digits10, boost::multiprecision::expression_template_option ExpressionTemplates>
class numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<Digits10>, ExpressionTemplates> >
{
   typedef boost::multiprecision::number<boost::multiprecision::gmp_float<Digits10>, ExpressionTemplates> number_type;
public:
   BOOST_STATIC_CONSTEXPR bool is_specialized = true;
   //
   // min and max values chosen so as to not cause segfaults when calling
   // mpf_get_str on 64-bit Linux builds.  Possibly we could use larger
   // exponent values elsewhere.
   //
   static number_type (min)()
   {
      initializer.do_nothing();
      static std::pair<bool, number_type> value;
      if(!value.first)
      {
         value.first = true;
         value.second = 1;
         mpf_div_2exp(value.second.backend().data(), value.second.backend().data(), (std::numeric_limits<mp_exp_t>::max)() / 64 + 1);
      }
      return value.second;
   }
   static number_type (max)()
   {
      initializer.do_nothing();
      static std::pair<bool, number_type> value;
      if(!value.first)
      {
         value.first = true;
         value.second = 1;
         mpf_mul_2exp(value.second.backend().data(), value.second.backend().data(), (std::numeric_limits<mp_exp_t>::max)() / 64 + 1);
      }
      return value.second;
   }
   BOOST_STATIC_CONSTEXPR number_type lowest()
   {
      return -(max)();
   }
   BOOST_STATIC_CONSTEXPR int digits = static_cast<int>((Digits10 * 1000L) / 301L + ((Digits10 * 1000L) % 301L ? 2 : 1));
   BOOST_STATIC_CONSTEXPR int digits10 = Digits10;
   // Have to allow for a possible extra limb inside the gmp data structure:
   BOOST_STATIC_CONSTEXPR int max_digits10 = Digits10 + 3 + ((GMP_LIMB_BITS * 301L) / 1000L);
   BOOST_STATIC_CONSTEXPR bool is_signed = true;
   BOOST_STATIC_CONSTEXPR bool is_integer = false;
   BOOST_STATIC_CONSTEXPR bool is_exact = false;
   BOOST_STATIC_CONSTEXPR int radix = 2;
   static number_type epsilon()
   {
      initializer.do_nothing();
      static std::pair<bool, number_type> value;
      if(!value.first)
      {
         value.first = true;
         value.second = 1;
         mpf_div_2exp(value.second.backend().data(), value.second.backend().data(), std::numeric_limits<number_type>::digits - 1);
      }
      return value.second;
   }
   // What value should this be????
   static number_type round_error()
   {
      // returns epsilon/2
      initializer.do_nothing();
      static std::pair<bool, number_type> value;
      if(!value.first)
      {
         value.first = true;
         value.second = 1;
      }
      return value.second;
   }
   BOOST_STATIC_CONSTEXPR long min_exponent = LONG_MIN;
   BOOST_STATIC_CONSTEXPR long min_exponent10 = (LONG_MIN / 1000) * 301L;
   BOOST_STATIC_CONSTEXPR long max_exponent = LONG_MAX;
   BOOST_STATIC_CONSTEXPR long max_exponent10 = (LONG_MAX / 1000) * 301L;
   BOOST_STATIC_CONSTEXPR bool has_infinity = false;
   BOOST_STATIC_CONSTEXPR bool has_quiet_NaN = false;
   BOOST_STATIC_CONSTEXPR bool has_signaling_NaN = false;
   BOOST_STATIC_CONSTEXPR float_denorm_style has_denorm = denorm_absent;
   BOOST_STATIC_CONSTEXPR bool has_denorm_loss = false;
   BOOST_STATIC_CONSTEXPR number_type infinity() { return number_type(); }
   BOOST_STATIC_CONSTEXPR number_type quiet_NaN() { return number_type(); }
   BOOST_STATIC_CONSTEXPR number_type signaling_NaN() { return number_type(); }
   BOOST_STATIC_CONSTEXPR number_type denorm_min() { return number_type(); }
   BOOST_STATIC_CONSTEXPR bool is_iec559 = false;
   BOOST_STATIC_CONSTEXPR bool is_bounded = true;
   BOOST_STATIC_CONSTEXPR bool is_modulo = false;
   BOOST_STATIC_CONSTEXPR bool traps = true;
   BOOST_STATIC_CONSTEXPR bool tinyness_before = false;
   BOOST_STATIC_CONSTEXPR float_round_style round_style = round_indeterminate;

private:
   struct data_initializer
   {
      data_initializer()
      {
         std::numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<digits10> > >::epsilon();
         std::numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<digits10> > >::round_error();
         (std::numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<digits10> > >::min)();
         (std::numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<digits10> > >::max)();
      }
      void do_nothing()const{}
   };
   static const data_initializer initializer;
};

template<unsigned Digits10, boost::multiprecision::expression_template_option ExpressionTemplates>
const typename numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<Digits10>, ExpressionTemplates> >::data_initializer numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<Digits10>, ExpressionTemplates> >::initializer;

#ifndef BOOST_NO_INCLASS_MEMBER_INITIALIZATION

template <unsigned Digits10, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<Digits10>, ExpressionTemplates> >::digits;
template <unsigned Digits10, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<Digits10>, ExpressionTemplates> >::digits10;
template <unsigned Digits10, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<Digits10>, ExpressionTemplates> >::max_digits10;
template <unsigned Digits10, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<Digits10>, ExpressionTemplates> >::is_signed;
template <unsigned Digits10, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<Digits10>, ExpressionTemplates> >::is_integer;
template <unsigned Digits10, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<Digits10>, ExpressionTemplates> >::is_exact;
template <unsigned Digits10, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<Digits10>, ExpressionTemplates> >::radix;
template <unsigned Digits10, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST long numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<Digits10>, ExpressionTemplates> >::min_exponent;
template <unsigned Digits10, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST long numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<Digits10>, ExpressionTemplates> >::min_exponent10;
template <unsigned Digits10, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST long numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<Digits10>, ExpressionTemplates> >::max_exponent;
template <unsigned Digits10, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST long numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<Digits10>, ExpressionTemplates> >::max_exponent10;
template <unsigned Digits10, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<Digits10>, ExpressionTemplates> >::has_infinity;
template <unsigned Digits10, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<Digits10>, ExpressionTemplates> >::has_quiet_NaN;
template <unsigned Digits10, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<Digits10>, ExpressionTemplates> >::has_signaling_NaN;
template <unsigned Digits10, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST float_denorm_style numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<Digits10>, ExpressionTemplates> >::has_denorm;
template <unsigned Digits10, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<Digits10>, ExpressionTemplates> >::has_denorm_loss;
template <unsigned Digits10, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<Digits10>, ExpressionTemplates> >::is_iec559;
template <unsigned Digits10, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<Digits10>, ExpressionTemplates> >::is_bounded;
template <unsigned Digits10, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<Digits10>, ExpressionTemplates> >::is_modulo;
template <unsigned Digits10, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<Digits10>, ExpressionTemplates> >::traps;
template <unsigned Digits10, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<Digits10>, ExpressionTemplates> >::tinyness_before;
template <unsigned Digits10, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST float_round_style numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<Digits10>, ExpressionTemplates> >::round_style;

#endif

template<boost::multiprecision::expression_template_option ExpressionTemplates>
class numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<0>, ExpressionTemplates> >
{
   typedef boost::multiprecision::number<boost::multiprecision::gmp_float<0>, ExpressionTemplates> number_type;
public:
   BOOST_STATIC_CONSTEXPR bool is_specialized = false;
   static number_type (min)() { return number_type(); }
   static number_type (max)() { return number_type(); }
   static number_type lowest() { return number_type(); }
   BOOST_STATIC_CONSTEXPR int digits = 0;
   BOOST_STATIC_CONSTEXPR int digits10 = 0;
   BOOST_STATIC_CONSTEXPR int max_digits10 = 0;
   BOOST_STATIC_CONSTEXPR bool is_signed = false;
   BOOST_STATIC_CONSTEXPR bool is_integer = false;
   BOOST_STATIC_CONSTEXPR bool is_exact = false;
   BOOST_STATIC_CONSTEXPR int radix = 0;
   static number_type epsilon() { return number_type(); }
   static number_type round_error() { return number_type(); }
   BOOST_STATIC_CONSTEXPR int min_exponent = 0;
   BOOST_STATIC_CONSTEXPR int min_exponent10 = 0;
   BOOST_STATIC_CONSTEXPR int max_exponent = 0;
   BOOST_STATIC_CONSTEXPR int max_exponent10 = 0;
   BOOST_STATIC_CONSTEXPR bool has_infinity = false;
   BOOST_STATIC_CONSTEXPR bool has_quiet_NaN = false;
   BOOST_STATIC_CONSTEXPR bool has_signaling_NaN = false;
   BOOST_STATIC_CONSTEXPR float_denorm_style has_denorm = denorm_absent;
   BOOST_STATIC_CONSTEXPR bool has_denorm_loss = false;
   static number_type infinity() { return number_type(); }
   static number_type quiet_NaN() { return number_type(); }
   static number_type signaling_NaN() { return number_type(); }
   static number_type denorm_min() { return number_type(); }
   BOOST_STATIC_CONSTEXPR bool is_iec559 = false;
   BOOST_STATIC_CONSTEXPR bool is_bounded = false;
   BOOST_STATIC_CONSTEXPR bool is_modulo = false;
   BOOST_STATIC_CONSTEXPR bool traps = false;
   BOOST_STATIC_CONSTEXPR bool tinyness_before = false;
   BOOST_STATIC_CONSTEXPR float_round_style round_style = round_indeterminate;
};

#ifndef BOOST_NO_INCLASS_MEMBER_INITIALIZATION

template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<0>, ExpressionTemplates> >::digits;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<0>, ExpressionTemplates> >::digits10;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<0>, ExpressionTemplates> >::max_digits10;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<0>, ExpressionTemplates> >::is_signed;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<0>, ExpressionTemplates> >::is_integer;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<0>, ExpressionTemplates> >::is_exact;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<0>, ExpressionTemplates> >::radix;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<0>, ExpressionTemplates> >::min_exponent;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<0>, ExpressionTemplates> >::min_exponent10;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<0>, ExpressionTemplates> >::max_exponent;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<0>, ExpressionTemplates> >::max_exponent10;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<0>, ExpressionTemplates> >::has_infinity;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<0>, ExpressionTemplates> >::has_quiet_NaN;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<0>, ExpressionTemplates> >::has_signaling_NaN;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST float_denorm_style numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<0>, ExpressionTemplates> >::has_denorm;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<0>, ExpressionTemplates> >::has_denorm_loss;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<0>, ExpressionTemplates> >::is_iec559;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<0>, ExpressionTemplates> >::is_bounded;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<0>, ExpressionTemplates> >::is_modulo;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<0>, ExpressionTemplates> >::traps;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<0>, ExpressionTemplates> >::tinyness_before;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST float_round_style numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_float<0>, ExpressionTemplates> >::round_style;

#endif

template<boost::multiprecision::expression_template_option ExpressionTemplates>
class numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_int, ExpressionTemplates> >
{
   typedef boost::multiprecision::number<boost::multiprecision::gmp_int, ExpressionTemplates> number_type;
public:
   BOOST_STATIC_CONSTEXPR bool is_specialized = true;
   //
   // Largest and smallest numbers are bounded only by available memory, set
   // to zero:
   //
   static number_type (min)()
   {
      return number_type();
   }
   static number_type (max)()
   {
      return number_type();
   }
   static number_type lowest() { return (min)(); }
   BOOST_STATIC_CONSTEXPR int digits = INT_MAX;
   BOOST_STATIC_CONSTEXPR int digits10 = (INT_MAX / 1000) * 301L;
   BOOST_STATIC_CONSTEXPR int max_digits10 = digits10 + 3;
   BOOST_STATIC_CONSTEXPR bool is_signed = true;
   BOOST_STATIC_CONSTEXPR bool is_integer = true;
   BOOST_STATIC_CONSTEXPR bool is_exact = true;
   BOOST_STATIC_CONSTEXPR int radix = 2;
   static number_type epsilon() { return number_type(); }
   static number_type round_error() { return number_type(); }
   BOOST_STATIC_CONSTEXPR int min_exponent = 0;
   BOOST_STATIC_CONSTEXPR int min_exponent10 = 0;
   BOOST_STATIC_CONSTEXPR int max_exponent = 0;
   BOOST_STATIC_CONSTEXPR int max_exponent10 = 0;
   BOOST_STATIC_CONSTEXPR bool has_infinity = false;
   BOOST_STATIC_CONSTEXPR bool has_quiet_NaN = false;
   BOOST_STATIC_CONSTEXPR bool has_signaling_NaN = false;
   BOOST_STATIC_CONSTEXPR float_denorm_style has_denorm = denorm_absent;
   BOOST_STATIC_CONSTEXPR bool has_denorm_loss = false;
   static number_type infinity() { return number_type(); }
   static number_type quiet_NaN() { return number_type(); }
   static number_type signaling_NaN() { return number_type(); }
   static number_type denorm_min() { return number_type(); }
   BOOST_STATIC_CONSTEXPR bool is_iec559 = false;
   BOOST_STATIC_CONSTEXPR bool is_bounded = false;
   BOOST_STATIC_CONSTEXPR bool is_modulo = false;
   BOOST_STATIC_CONSTEXPR bool traps = false;
   BOOST_STATIC_CONSTEXPR bool tinyness_before = false;
   BOOST_STATIC_CONSTEXPR float_round_style round_style = round_toward_zero;
};

#ifndef BOOST_NO_INCLASS_MEMBER_INITIALIZATION

template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_int, ExpressionTemplates> >::digits;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_int, ExpressionTemplates> >::digits10;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_int, ExpressionTemplates> >::max_digits10;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_int, ExpressionTemplates> >::is_signed;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_int, ExpressionTemplates> >::is_integer;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_int, ExpressionTemplates> >::is_exact;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_int, ExpressionTemplates> >::radix;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_int, ExpressionTemplates> >::min_exponent;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_int, ExpressionTemplates> >::min_exponent10;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_int, ExpressionTemplates> >::max_exponent;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_int, ExpressionTemplates> >::max_exponent10;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_int, ExpressionTemplates> >::has_infinity;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_int, ExpressionTemplates> >::has_quiet_NaN;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_int, ExpressionTemplates> >::has_signaling_NaN;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST float_denorm_style numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_int, ExpressionTemplates> >::has_denorm;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_int, ExpressionTemplates> >::has_denorm_loss;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_int, ExpressionTemplates> >::is_iec559;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_int, ExpressionTemplates> >::is_bounded;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_int, ExpressionTemplates> >::is_modulo;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_int, ExpressionTemplates> >::traps;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_int, ExpressionTemplates> >::tinyness_before;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST float_round_style numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_int, ExpressionTemplates> >::round_style;

#endif

template<boost::multiprecision::expression_template_option ExpressionTemplates>
class numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_rational, ExpressionTemplates> >
{
   typedef boost::multiprecision::number<boost::multiprecision::gmp_rational, ExpressionTemplates> number_type;
public:
   BOOST_STATIC_CONSTEXPR bool is_specialized = true;
   //
   // Largest and smallest numbers are bounded only by available memory, set
   // to zero:
   //
   static number_type (min)()
   {
      return number_type();
   }
   static number_type (max)()
   {
      return number_type();
   }
   static number_type lowest() { return (min)(); }
   // Digits are unbounded, use zero for now:
   BOOST_STATIC_CONSTEXPR int digits = INT_MAX;
   BOOST_STATIC_CONSTEXPR int digits10 = (INT_MAX / 1000) * 301L;
   BOOST_STATIC_CONSTEXPR int max_digits10 = digits10 + 3;
   BOOST_STATIC_CONSTEXPR bool is_signed = true;
   BOOST_STATIC_CONSTEXPR bool is_integer = false;
   BOOST_STATIC_CONSTEXPR bool is_exact = true;
   BOOST_STATIC_CONSTEXPR int radix = 2;
   static number_type epsilon() { return number_type(); }
   static number_type round_error() { return number_type(); }
   BOOST_STATIC_CONSTEXPR int min_exponent = 0;
   BOOST_STATIC_CONSTEXPR int min_exponent10 = 0;
   BOOST_STATIC_CONSTEXPR int max_exponent = 0;
   BOOST_STATIC_CONSTEXPR int max_exponent10 = 0;
   BOOST_STATIC_CONSTEXPR bool has_infinity = false;
   BOOST_STATIC_CONSTEXPR bool has_quiet_NaN = false;
   BOOST_STATIC_CONSTEXPR bool has_signaling_NaN = false;
   BOOST_STATIC_CONSTEXPR float_denorm_style has_denorm = denorm_absent;
   BOOST_STATIC_CONSTEXPR bool has_denorm_loss = false;
   static number_type infinity() { return number_type(); }
   static number_type quiet_NaN() { return number_type(); }
   static number_type signaling_NaN() { return number_type(); }
   static number_type denorm_min() { return number_type(); }
   BOOST_STATIC_CONSTEXPR bool is_iec559 = false;
   BOOST_STATIC_CONSTEXPR bool is_bounded = false;
   BOOST_STATIC_CONSTEXPR bool is_modulo = false;
   BOOST_STATIC_CONSTEXPR bool traps = false;
   BOOST_STATIC_CONSTEXPR bool tinyness_before = false;
   BOOST_STATIC_CONSTEXPR float_round_style round_style = round_toward_zero;
};

#ifndef BOOST_NO_INCLASS_MEMBER_INITIALIZATION

template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_rational, ExpressionTemplates> >::digits;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_rational, ExpressionTemplates> >::digits10;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_rational, ExpressionTemplates> >::max_digits10;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_rational, ExpressionTemplates> >::is_signed;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_rational, ExpressionTemplates> >::is_integer;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_rational, ExpressionTemplates> >::is_exact;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_rational, ExpressionTemplates> >::radix;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_rational, ExpressionTemplates> >::min_exponent;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_rational, ExpressionTemplates> >::min_exponent10;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_rational, ExpressionTemplates> >::max_exponent;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_rational, ExpressionTemplates> >::max_exponent10;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_rational, ExpressionTemplates> >::has_infinity;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_rational, ExpressionTemplates> >::has_quiet_NaN;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_rational, ExpressionTemplates> >::has_signaling_NaN;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST float_denorm_style numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_rational, ExpressionTemplates> >::has_denorm;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_rational, ExpressionTemplates> >::has_denorm_loss;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_rational, ExpressionTemplates> >::is_iec559;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_rational, ExpressionTemplates> >::is_bounded;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_rational, ExpressionTemplates> >::is_modulo;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_rational, ExpressionTemplates> >::traps;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_rational, ExpressionTemplates> >::tinyness_before;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST float_round_style numeric_limits<boost::multiprecision::number<boost::multiprecision::gmp_rational, ExpressionTemplates> >::round_style;

#endif

#ifdef BOOST_MSVC
#pragma warning(pop)
#endif

} // namespace std

#endif
