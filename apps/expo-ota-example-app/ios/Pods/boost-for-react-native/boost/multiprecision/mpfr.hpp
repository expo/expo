///////////////////////////////////////////////////////////////////////////////
//  Copyright 2011 John Maddock. Distributed under the Boost
//  Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_MATH_BN_MPFR_HPP
#define BOOST_MATH_BN_MPFR_HPP

#include <boost/multiprecision/number.hpp>
#include <boost/multiprecision/debug_adaptor.hpp>
#include <boost/multiprecision/gmp.hpp>
#include <boost/math/special_functions/fpclassify.hpp>
#include <boost/cstdint.hpp>
#include <boost/multiprecision/detail/big_lanczos.hpp>
#include <boost/multiprecision/detail/digits.hpp>
#include <mpfr.h>
#include <cmath>
#include <algorithm>

#ifndef BOOST_MULTIPRECISION_MPFR_DEFAULT_PRECISION
#  define BOOST_MULTIPRECISION_MPFR_DEFAULT_PRECISION 20
#endif

namespace boost{
namespace multiprecision{

enum mpfr_allocation_type
{
   allocate_stack,
   allocate_dynamic
};

namespace backends{

template <unsigned digits10, mpfr_allocation_type AllocationType = allocate_dynamic>
struct mpfr_float_backend;

template <>
struct mpfr_float_backend<0, allocate_stack>;

} // namespace backends

template <unsigned digits10, mpfr_allocation_type AllocationType>
struct number_category<backends::mpfr_float_backend<digits10, AllocationType> > : public mpl::int_<number_kind_floating_point>{};

namespace backends{

namespace detail{

template <bool b>
struct mpfr_cleanup
{
   struct initializer
   {
      initializer() {}
      ~initializer(){ mpfr_free_cache(); }
      void force_instantiate()const {}
   };
   static const initializer init;
   static void force_instantiate() { init.force_instantiate(); }
};

template <bool b>
typename mpfr_cleanup<b>::initializer const mpfr_cleanup<b>::init;


template <unsigned digits10, mpfr_allocation_type AllocationType>
struct mpfr_float_imp;

template <unsigned digits10>
struct mpfr_float_imp<digits10, allocate_dynamic>
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

   mpfr_float_imp()
   {
      mpfr_init2(m_data, multiprecision::detail::digits10_2_2(digits10 ? digits10 : get_default_precision()));
      mpfr_set_ui(m_data, 0u, GMP_RNDN);
   }
   mpfr_float_imp(unsigned prec)
   {
      mpfr_init2(m_data, prec);
      mpfr_set_ui(m_data, 0u, GMP_RNDN);
   }

   mpfr_float_imp(const mpfr_float_imp& o)
   {
      mpfr_init2(m_data, multiprecision::detail::digits10_2_2(digits10 ? digits10 : get_default_precision()));
      if(o.m_data[0]._mpfr_d)
         mpfr_set(m_data, o.m_data, GMP_RNDN);
   }
#ifndef BOOST_NO_CXX11_RVALUE_REFERENCES
   mpfr_float_imp(mpfr_float_imp&& o) BOOST_NOEXCEPT
   {
      m_data[0] = o.m_data[0];
      o.m_data[0]._mpfr_d = 0;
   }
#endif
   mpfr_float_imp& operator = (const mpfr_float_imp& o)
   {
      if(m_data[0]._mpfr_d == 0)
         mpfr_init2(m_data, multiprecision::detail::digits10_2_2(digits10 ? digits10 : get_default_precision()));
      if(o.m_data[0]._mpfr_d)
         mpfr_set(m_data, o.m_data, GMP_RNDN);
      return *this;
   }
#ifndef BOOST_NO_CXX11_RVALUE_REFERENCES
   mpfr_float_imp& operator = (mpfr_float_imp&& o) BOOST_NOEXCEPT
   {
      mpfr_swap(m_data, o.m_data);
      return *this;
   }
#endif
#ifdef BOOST_HAS_LONG_LONG
#ifdef _MPFR_H_HAVE_INTMAX_T
   mpfr_float_imp& operator = (boost::ulong_long_type i)
   {
      if(m_data[0]._mpfr_d == 0)
         mpfr_init2(m_data, multiprecision::detail::digits10_2_2(digits10 ? digits10 : get_default_precision()));
      mpfr_set_uj(m_data, i, GMP_RNDN);
      return *this;
   }
   mpfr_float_imp& operator = (boost::long_long_type i)
   {
      if(m_data[0]._mpfr_d == 0)
         mpfr_init2(m_data, multiprecision::detail::digits10_2_2(digits10 ? digits10 : get_default_precision()));
      mpfr_set_sj(m_data, i, GMP_RNDN);
      return *this;
   }
#else
   mpfr_float_imp& operator = (boost::ulong_long_type i)
   {
      if(m_data[0]._mpfr_d == 0)
         mpfr_init2(m_data, multiprecision::detail::digits10_2_2(digits10 ? digits10 : get_default_precision()));
      boost::ulong_long_type mask = ((((1uLL << (std::numeric_limits<unsigned long>::digits - 1)) - 1) << 1) | 1uLL);
      unsigned shift = 0;
      mpfr_t t;
      mpfr_init2(t, (std::max)(static_cast<unsigned long>(std::numeric_limits<boost::ulong_long_type>::digits), static_cast<unsigned long>(multiprecision::detail::digits10_2_2(digits10))));
      mpfr_set_ui(m_data, 0, GMP_RNDN);
      while(i)
      {
         mpfr_set_ui(t, static_cast<unsigned long>(i & mask), GMP_RNDN);
         if(shift)
            mpfr_mul_2exp(t, t, shift, GMP_RNDN);
         mpfr_add(m_data, m_data, t, GMP_RNDN);
         shift += std::numeric_limits<unsigned long>::digits;
         i >>= std::numeric_limits<unsigned long>::digits;
      }
      mpfr_clear(t);
      return *this;
   }
   mpfr_float_imp& operator = (boost::long_long_type i)
   {
      if(m_data[0]._mpfr_d == 0)
         mpfr_init2(m_data, multiprecision::detail::digits10_2_2(digits10 ? digits10 : get_default_precision()));
      bool neg = i < 0;
      *this = boost::multiprecision::detail::unsigned_abs(i);
      if(neg)
         mpfr_neg(m_data, m_data, GMP_RNDN);
      return *this;
   }
#endif
#endif
   mpfr_float_imp& operator = (unsigned long i)
   {
      if(m_data[0]._mpfr_d == 0)
         mpfr_init2(m_data, multiprecision::detail::digits10_2_2(digits10 ? digits10 : get_default_precision()));
      mpfr_set_ui(m_data, i, GMP_RNDN);
      return *this;
   }
   mpfr_float_imp& operator = (long i)
   {
      if(m_data[0]._mpfr_d == 0)
         mpfr_init2(m_data, multiprecision::detail::digits10_2_2(digits10 ? digits10 : get_default_precision()));
      mpfr_set_si(m_data, i, GMP_RNDN);
      return *this;
   }
   mpfr_float_imp& operator = (double d)
   {
      if(m_data[0]._mpfr_d == 0)
         mpfr_init2(m_data, multiprecision::detail::digits10_2_2(digits10 ? digits10 : get_default_precision()));
      mpfr_set_d(m_data, d, GMP_RNDN);
      return *this;
   }
   mpfr_float_imp& operator = (long double a)
   {
      if(m_data[0]._mpfr_d == 0)
         mpfr_init2(m_data, multiprecision::detail::digits10_2_2(digits10 ? digits10 : get_default_precision()));
      mpfr_set_ld(m_data, a, GMP_RNDN);
      return *this;
   }
   mpfr_float_imp& operator = (const char* s)
   {
      if(m_data[0]._mpfr_d == 0)
         mpfr_init2(m_data, multiprecision::detail::digits10_2_2(digits10 ? digits10 : get_default_precision()));
      if(mpfr_set_str(m_data, s, 10, GMP_RNDN) != 0)
      {
         BOOST_THROW_EXCEPTION(std::runtime_error(std::string("Unable to parse string \"") + s + std::string("\"as a valid floating point number.")));
      }
      return *this;
   }
   void swap(mpfr_float_imp& o) BOOST_NOEXCEPT
   {
      mpfr_swap(m_data, o.m_data);
   }
   std::string str(std::streamsize digits, std::ios_base::fmtflags f)const
   {
      BOOST_ASSERT(m_data[0]._mpfr_d);

      bool scientific = (f & std::ios_base::scientific) == std::ios_base::scientific;
      bool fixed      = (f & std::ios_base::fixed) == std::ios_base::fixed;

      std::streamsize org_digits(digits);

      if(scientific && digits)
         ++digits;

      std::string result;
      mp_exp_t e;
      if(mpfr_inf_p(m_data))
      {
         if(mpfr_sgn(m_data) < 0)
            result = "-inf";
         else if(f & std::ios_base::showpos)
            result = "+inf";
         else
            result = "inf";
         return result;
      }
      if(mpfr_nan_p(m_data))
      {
         result = "nan";
         return result;
      }
      if(mpfr_zero_p(m_data))
      {
         e = 0;
         result = "0";
      }
      else
      {
         char* ps = mpfr_get_str (0, &e, 10, static_cast<std::size_t>(digits), m_data, GMP_RNDN);
        --e;  // To match with what our formatter expects.
         if(fixed && e != -1)
         {
            // Oops we actually need a different number of digits to what we asked for:
            mpfr_free_str(ps);
            digits += e + 1;
            if(digits == 0)
            {
               // We need to get *all* the digits and then possibly round up,
               // we end up with either "0" or "1" as the result.
               ps = mpfr_get_str (0, &e, 10, 0, m_data, GMP_RNDN);
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
               ps = mpfr_get_str (0, &e, 10, static_cast<std::size_t>(digits), m_data, GMP_RNDN);
               --e;  // To match with what our formatter expects.
            }
            else
            {
               ps = mpfr_get_str (0, &e, 10, 1, m_data, GMP_RNDN);
               --e;
               unsigned offset = *ps == '-' ? 1 : 0;
               ps[offset] = '0';
               ps[offset + 1] = 0;
            }
         }
         result = ps ? ps : "0";
         if(ps)
            mpfr_free_str(ps);
      }
      boost::multiprecision::detail::format_float_string(result, e, org_digits, f, 0 != mpfr_zero_p(m_data));
      return result;
   }
   ~mpfr_float_imp() BOOST_NOEXCEPT
   {
       if(m_data[0]._mpfr_d)
         mpfr_clear(m_data);
      detail::mpfr_cleanup<true>::force_instantiate();
   }
   void negate() BOOST_NOEXCEPT
   {
      BOOST_ASSERT(m_data[0]._mpfr_d);
      mpfr_neg(m_data, m_data, GMP_RNDN);
   }
   template <mpfr_allocation_type AllocationType>
   int compare(const mpfr_float_backend<digits10, AllocationType>& o)const BOOST_NOEXCEPT
   {
      BOOST_ASSERT(m_data[0]._mpfr_d && o.m_data[0]._mpfr_d);
      return mpfr_cmp(m_data, o.m_data);
   }
   int compare(long i)const BOOST_NOEXCEPT
   {
      BOOST_ASSERT(m_data[0]._mpfr_d);
      return mpfr_cmp_si(m_data, i);
   }
   int compare(unsigned long i)const BOOST_NOEXCEPT
   {
      BOOST_ASSERT(m_data[0]._mpfr_d);
      return mpfr_cmp_ui(m_data, i);
   }
   template <class V>
   int compare(V v)const BOOST_NOEXCEPT
   {
      mpfr_float_backend<digits10, allocate_dynamic> d;
      d = v;
      return compare(d);
   }
   mpfr_t& data() BOOST_NOEXCEPT
   {
      BOOST_ASSERT(m_data[0]._mpfr_d);
      return m_data;
   }
   const mpfr_t& data()const BOOST_NOEXCEPT
   {
      BOOST_ASSERT(m_data[0]._mpfr_d);
      return m_data;
   }
protected:
   mpfr_t m_data;
   static unsigned& get_default_precision() BOOST_NOEXCEPT
   {
      static unsigned val = BOOST_MULTIPRECISION_MPFR_DEFAULT_PRECISION;
      return val;
   }
};

#ifdef BOOST_MSVC
#pragma warning(push)
#pragma warning(disable:4127)  // Conditional expression is constant
#endif

template <unsigned digits10>
struct mpfr_float_imp<digits10, allocate_stack>
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

   static const unsigned digits2 = (digits10 * 1000uL) / 301uL + ((digits10 * 1000uL) % 301 ? 2u : 1u);
   static const unsigned limb_count = mpfr_custom_get_size(digits2) / sizeof(mp_limb_t);

   ~mpfr_float_imp() BOOST_NOEXCEPT
   {
      detail::mpfr_cleanup<true>::force_instantiate();
   }
   mpfr_float_imp()
   {
      mpfr_custom_init(m_buffer, digits2);
      mpfr_custom_init_set(m_data, MPFR_NAN_KIND, 0, digits2, m_buffer);
      mpfr_set_ui(m_data, 0u, GMP_RNDN);
   }

   mpfr_float_imp(const mpfr_float_imp& o)
   {
      mpfr_custom_init(m_buffer, digits2);
      mpfr_custom_init_set(m_data, MPFR_NAN_KIND, 0, digits2, m_buffer);
      mpfr_set(m_data, o.m_data, GMP_RNDN);
   }
   mpfr_float_imp& operator = (const mpfr_float_imp& o)
   {
      mpfr_set(m_data, o.m_data, GMP_RNDN);
      return *this;
   }
#ifdef BOOST_HAS_LONG_LONG
#ifdef _MPFR_H_HAVE_INTMAX_T
   mpfr_float_imp& operator = (boost::ulong_long_type i)
   {
      mpfr_set_uj(m_data, i, GMP_RNDN);
      return *this;
   }
   mpfr_float_imp& operator = (boost::long_long_type i)
   {
      mpfr_set_sj(m_data, i, GMP_RNDN);
      return *this;
   }
#else
   mpfr_float_imp& operator = (boost::ulong_long_type i)
   {
      boost::ulong_long_type mask = ((((1uLL << (std::numeric_limits<unsigned long>::digits - 1)) - 1) << 1) | 1uL);
      unsigned shift = 0;
      mpfr_t t;
      mp_limb_t t_limbs[limb_count];
      mpfr_custom_init(t_limbs, digits2);
      mpfr_custom_init_set(t, MPFR_NAN_KIND, 0, digits2, t_limbs);
      mpfr_set_ui(m_data, 0, GMP_RNDN);
      while(i)
      {
         mpfr_set_ui(t, static_cast<unsigned long>(i & mask), GMP_RNDN);
         if(shift)
            mpfr_mul_2exp(t, t, shift, GMP_RNDN);
         mpfr_add(m_data, m_data, t, GMP_RNDN);
         shift += std::numeric_limits<unsigned long>::digits;
         i >>= std::numeric_limits<unsigned long>::digits;
      }
      return *this;
   }
   mpfr_float_imp& operator = (boost::long_long_type i)
   {
      bool neg = i < 0;
      *this = boost::multiprecision::detail::unsigned_abs(i);
      if(neg)
         mpfr_neg(m_data, m_data, GMP_RNDN);
      return *this;
   }
#endif
#endif
   mpfr_float_imp& operator = (unsigned long i)
   {
      mpfr_set_ui(m_data, i, GMP_RNDN);
      return *this;
   }
   mpfr_float_imp& operator = (long i)
   {
      mpfr_set_si(m_data, i, GMP_RNDN);
      return *this;
   }
   mpfr_float_imp& operator = (double d)
   {
      mpfr_set_d(m_data, d, GMP_RNDN);
      return *this;
   }
   mpfr_float_imp& operator = (long double a)
   {
      mpfr_set_ld(m_data, a, GMP_RNDN);
      return *this;
   }
   mpfr_float_imp& operator = (const char* s)
   {
      if(mpfr_set_str(m_data, s, 10, GMP_RNDN) != 0)
      {
         BOOST_THROW_EXCEPTION(std::runtime_error(std::string("Unable to parse string \"") + s + std::string("\"as a valid floating point number.")));
      }
      return *this;
   }
   void swap(mpfr_float_imp& o) BOOST_NOEXCEPT
   {
      // We have to swap by copying:
      mpfr_float_imp t(*this);
      *this = o;
      o = t;
   }
   std::string str(std::streamsize digits, std::ios_base::fmtflags f)const
   {
      BOOST_ASSERT(m_data[0]._mpfr_d);

      bool scientific = (f & std::ios_base::scientific) == std::ios_base::scientific;
      bool fixed      = (f & std::ios_base::fixed) == std::ios_base::fixed;

      std::streamsize org_digits(digits);

      if(scientific && digits)
         ++digits;

      std::string result;
      mp_exp_t e;
      if(mpfr_inf_p(m_data))
      {
         if(mpfr_sgn(m_data) < 0)
            result = "-inf";
         else if(f & std::ios_base::showpos)
            result = "+inf";
         else
            result = "inf";
         return result;
      }
      if(mpfr_nan_p(m_data))
      {
         result = "nan";
         return result;
      }
      if(mpfr_zero_p(m_data))
      {
         e = 0;
         result = "0";
      }
      else
      {
         char* ps = mpfr_get_str (0, &e, 10, static_cast<std::size_t>(digits), m_data, GMP_RNDN);
        --e;  // To match with what our formatter expects.
         if(fixed && e != -1)
         {
            // Oops we actually need a different number of digits to what we asked for:
            mpfr_free_str(ps);
            digits += e + 1;
            if(digits == 0)
            {
               // We need to get *all* the digits and then possibly round up,
               // we end up with either "0" or "1" as the result.
               ps = mpfr_get_str (0, &e, 10, 0, m_data, GMP_RNDN);
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
               ps = mpfr_get_str (0, &e, 10, static_cast<std::size_t>(digits), m_data, GMP_RNDN);
               --e;  // To match with what our formatter expects.
            }
            else
            {
               ps = mpfr_get_str (0, &e, 10, 1, m_data, GMP_RNDN);
               --e;
               unsigned offset = *ps == '-' ? 1 : 0;
               ps[offset] = '0';
               ps[offset + 1] = 0;
            }
         }
         result = ps ? ps : "0";
         if(ps)
            mpfr_free_str(ps);
      }
      boost::multiprecision::detail::format_float_string(result, e, org_digits, f, 0 != mpfr_zero_p(m_data));
      return result;
   }
   void negate() BOOST_NOEXCEPT
   {
      mpfr_neg(m_data, m_data, GMP_RNDN);
   }
   template <mpfr_allocation_type AllocationType>
   int compare(const mpfr_float_backend<digits10, AllocationType>& o)const BOOST_NOEXCEPT
   {
      return mpfr_cmp(m_data, o.m_data);
   }
   int compare(long i)const BOOST_NOEXCEPT
   {
      return mpfr_cmp_si(m_data, i);
   }
   int compare(unsigned long i)const BOOST_NOEXCEPT
   {
      return mpfr_cmp_ui(m_data, i);
   }
   template <class V>
   int compare(V v)const BOOST_NOEXCEPT
   {
      mpfr_float_backend<digits10, allocate_stack> d;
      d = v;
      return compare(d);
   }
   mpfr_t& data() BOOST_NOEXCEPT
   {
      return m_data;
   }
   const mpfr_t& data()const BOOST_NOEXCEPT
   {
      return m_data;
   }
protected:
   mpfr_t m_data;
   mp_limb_t m_buffer[limb_count];
};

#ifdef BOOST_MSVC
#pragma warning(pop)
#endif

} // namespace detail

template <unsigned digits10, mpfr_allocation_type AllocationType>
struct mpfr_float_backend : public detail::mpfr_float_imp<digits10, AllocationType>
{
   mpfr_float_backend() : detail::mpfr_float_imp<digits10, AllocationType>() {}
   mpfr_float_backend(const mpfr_float_backend& o) : detail::mpfr_float_imp<digits10, AllocationType>(o) {}
#ifndef BOOST_NO_CXX11_RVALUE_REFERENCES
   mpfr_float_backend(mpfr_float_backend&& o) BOOST_NOEXCEPT : detail::mpfr_float_imp<digits10, AllocationType>(static_cast<detail::mpfr_float_imp<digits10, AllocationType>&&>(o)) {}
#endif
   template <unsigned D, mpfr_allocation_type AT>
   mpfr_float_backend(const mpfr_float_backend<D, AT>& val, typename enable_if_c<D <= digits10>::type* = 0)
       : detail::mpfr_float_imp<digits10, AllocationType>()
   {
      mpfr_set(this->m_data, val.data(), GMP_RNDN);
   }
   template <unsigned D, mpfr_allocation_type AT>
   explicit mpfr_float_backend(const mpfr_float_backend<D, AT>& val, typename disable_if_c<D <= digits10>::type* = 0)
       : detail::mpfr_float_imp<digits10, AllocationType>()
   {
      mpfr_set(this->m_data, val.data(), GMP_RNDN);
   }
   template <unsigned D>
   mpfr_float_backend(const gmp_float<D>& val, typename enable_if_c<D <= digits10>::type* = 0)
       : detail::mpfr_float_imp<digits10, AllocationType>()
   {
      mpfr_set_f(this->m_data, val.data(), GMP_RNDN);
   }
   template <unsigned D>
   mpfr_float_backend(const gmp_float<D>& val, typename disable_if_c<D <= digits10>::type* = 0)
       : detail::mpfr_float_imp<digits10, AllocationType>()
   {
      mpfr_set_f(this->m_data, val.data(), GMP_RNDN);
   }
   mpfr_float_backend(const gmp_int& val)
       : detail::mpfr_float_imp<digits10, AllocationType>()
   {
      mpfr_set_z(this->m_data, val.data(), GMP_RNDN);
   }
   mpfr_float_backend(const gmp_rational& val)
       : detail::mpfr_float_imp<digits10, AllocationType>()
   {
      mpfr_set_q(this->m_data, val.data(), GMP_RNDN);
   }
   mpfr_float_backend(const mpfr_t val)
       : detail::mpfr_float_imp<digits10, AllocationType>()
   {
      mpfr_set(this->m_data, val, GMP_RNDN);
   }
   mpfr_float_backend(const mpf_t val)
       : detail::mpfr_float_imp<digits10, AllocationType>()
   {
      mpfr_set_f(this->m_data, val, GMP_RNDN);
   }
   mpfr_float_backend(const mpz_t val)
       : detail::mpfr_float_imp<digits10, AllocationType>()
   {
      mpfr_set_z(this->m_data, val, GMP_RNDN);
   }
   mpfr_float_backend(const mpq_t val)
       : detail::mpfr_float_imp<digits10, AllocationType>()
   {
      mpfr_set_q(this->m_data, val, GMP_RNDN);
   }
   mpfr_float_backend& operator=(const mpfr_float_backend& o)
   {
      *static_cast<detail::mpfr_float_imp<digits10, AllocationType>*>(this) = static_cast<detail::mpfr_float_imp<digits10, AllocationType> const&>(o);
      return *this;
   }
#ifndef BOOST_NO_CXX11_RVALUE_REFERENCES
   mpfr_float_backend& operator=(mpfr_float_backend&& o) BOOST_NOEXCEPT
   {
      *static_cast<detail::mpfr_float_imp<digits10, AllocationType>*>(this) = static_cast<detail::mpfr_float_imp<digits10, AllocationType>&&>(o);
      return *this;
   }
#endif
   template <class V>
   mpfr_float_backend& operator=(const V& v)
   {
      *static_cast<detail::mpfr_float_imp<digits10, AllocationType>*>(this) = v;
      return *this;
   }
   mpfr_float_backend& operator=(const mpfr_t val)
   {
      if(this->m_data[0]._mpfr_d == 0)
         mpfr_init2(this->m_data, multiprecision::detail::digits10_2_2(digits10));
      mpfr_set(this->m_data, val, GMP_RNDN);
      return *this;
   }
   mpfr_float_backend& operator=(const mpf_t val)
   {
      if(this->m_data[0]._mpfr_d == 0)
         mpfr_init2(this->m_data, multiprecision::detail::digits10_2_2(digits10));
      mpfr_set_f(this->m_data, val, GMP_RNDN);
      return *this;
   }
   mpfr_float_backend& operator=(const mpz_t val)
   {
      if(this->m_data[0]._mpfr_d == 0)
         mpfr_init2(this->m_data, multiprecision::detail::digits10_2_2(digits10));
      mpfr_set_z(this->m_data, val, GMP_RNDN);
      return *this;
   }
   mpfr_float_backend& operator=(const mpq_t val)
   {
      if(this->m_data[0]._mpfr_d == 0)
         mpfr_init2(this->m_data, multiprecision::detail::digits10_2_2(digits10));
      mpfr_set_q(this->m_data, val, GMP_RNDN);
      return *this;
   }
   // We don't change our precision here, this is a fixed precision type:
   template <unsigned D, mpfr_allocation_type AT>
   mpfr_float_backend& operator=(const mpfr_float_backend<D, AT>& val)
   {
      if(this->m_data[0]._mpfr_d == 0)
         mpfr_init2(this->m_data, multiprecision::detail::digits10_2_2(digits10));
      mpfr_set(this->m_data, val.data(), GMP_RNDN);
      return *this;
   }
   template <unsigned D>
   mpfr_float_backend& operator=(const gmp_float<D>& val)
   {
      if(this->m_data[0]._mpfr_d == 0)
         mpfr_init2(this->m_data, multiprecision::detail::digits10_2_2(digits10));
      mpfr_set_f(this->m_data, val.data(), GMP_RNDN);
      return *this;
   }
   mpfr_float_backend& operator=(const gmp_int& val)
   {
      if(this->m_data[0]._mpfr_d == 0)
         mpfr_init2(this->m_data, multiprecision::detail::digits10_2_2(digits10));
      mpfr_set_z(this->m_data, val.data(), GMP_RNDN);
      return *this;
   }
   mpfr_float_backend& operator=(const gmp_rational& val)
   {
      if(this->m_data[0]._mpfr_d == 0)
         mpfr_init2(this->m_data, multiprecision::detail::digits10_2_2(digits10));
      mpfr_set_q(this->m_data, val.data(), GMP_RNDN);
      return *this;
   }
};

template <>
struct mpfr_float_backend<0, allocate_dynamic> : public detail::mpfr_float_imp<0, allocate_dynamic>
{
   mpfr_float_backend() : detail::mpfr_float_imp<0, allocate_dynamic>() {}
   mpfr_float_backend(const mpfr_t val)
      : detail::mpfr_float_imp<0, allocate_dynamic>(mpfr_get_prec(val))
   {
      mpfr_set(this->m_data, val, GMP_RNDN);
   }
   mpfr_float_backend(const mpf_t val)
      : detail::mpfr_float_imp<0, allocate_dynamic>(mpf_get_prec(val))
   {
      mpfr_set_f(this->m_data, val, GMP_RNDN);
   }
   mpfr_float_backend(const mpz_t val)
      : detail::mpfr_float_imp<0, allocate_dynamic>()
   {
      mpfr_set_z(this->m_data, val, GMP_RNDN);
   }
   mpfr_float_backend(const mpq_t val)
      : detail::mpfr_float_imp<0, allocate_dynamic>()
   {
      mpfr_set_q(this->m_data, val, GMP_RNDN);
   }
   mpfr_float_backend(const mpfr_float_backend& o) : detail::mpfr_float_imp<0, allocate_dynamic>(o) {}
#ifndef BOOST_NO_CXX11_RVALUE_REFERENCES
   mpfr_float_backend(mpfr_float_backend&& o) BOOST_NOEXCEPT : detail::mpfr_float_imp<0, allocate_dynamic>(static_cast<detail::mpfr_float_imp<0, allocate_dynamic>&&>(o)) {}
#endif
   mpfr_float_backend(const mpfr_float_backend& o, unsigned digits10)
      : detail::mpfr_float_imp<0, allocate_dynamic>(digits10)
   {
      *this = o;
   }
   template <unsigned D>
   mpfr_float_backend(const mpfr_float_backend<D>& val)
      : detail::mpfr_float_imp<0, allocate_dynamic>(mpfr_get_prec(val.data()))
   {
      mpfr_set(this->m_data, val.data(), GMP_RNDN);
   }
   template <unsigned D>
   mpfr_float_backend(const gmp_float<D>& val)
      : detail::mpfr_float_imp<0, allocate_dynamic>(mpf_get_prec(val.data()))
   {
      mpfr_set_f(this->m_data, val.data(), GMP_RNDN);
   }
   mpfr_float_backend(const gmp_int& val)
      : detail::mpfr_float_imp<0, allocate_dynamic>()
   {
      mpfr_set_z(this->m_data, val.data(), GMP_RNDN);
   }
   mpfr_float_backend(const gmp_rational& val)
      : detail::mpfr_float_imp<0, allocate_dynamic>()
   {
      mpfr_set_q(this->m_data, val.data(), GMP_RNDN);
   }

   mpfr_float_backend& operator=(const mpfr_float_backend& o)
   {
      if(this != &o)
      {
         if(this->m_data[0]._mpfr_d == 0)
            mpfr_init2(this->m_data, mpfr_get_prec(o.data()));
         else
            mpfr_set_prec(this->m_data, mpfr_get_prec(o.data()));
         mpfr_set(this->m_data, o.data(), GMP_RNDN);
      }
      return *this;
   }
#ifndef BOOST_NO_CXX11_RVALUE_REFERENCES
   mpfr_float_backend& operator=(mpfr_float_backend&& o) BOOST_NOEXCEPT
   {
      *static_cast<detail::mpfr_float_imp<0, allocate_dynamic>*>(this) = static_cast<detail::mpfr_float_imp<0, allocate_dynamic> &&>(o);
      return *this;
   }
#endif
   template <class V>
   mpfr_float_backend& operator=(const V& v)
   {
      *static_cast<detail::mpfr_float_imp<0, allocate_dynamic>*>(this) = v;
      return *this;
   }
   mpfr_float_backend& operator=(const mpfr_t val)
   {
      if(this->m_data[0]._mpfr_d == 0)
         mpfr_init2(this->m_data, mpfr_get_prec(val));
      else
         mpfr_set_prec(this->m_data, mpfr_get_prec(val));
      mpfr_set(this->m_data, val, GMP_RNDN);
      return *this;
   }
   mpfr_float_backend& operator=(const mpf_t val)
   {
      if(this->m_data[0]._mpfr_d == 0)
         mpfr_init2(this->m_data, mpf_get_prec(val));
      else
         mpfr_set_prec(this->m_data, mpf_get_prec(val));
      mpfr_set_f(this->m_data, val, GMP_RNDN);
      return *this;
   }
   mpfr_float_backend& operator=(const mpz_t val)
   {
      if(this->m_data[0]._mpfr_d == 0)
         mpfr_init2(this->m_data, multiprecision::detail::digits10_2_2(get_default_precision()));
      mpfr_set_z(this->m_data, val, GMP_RNDN);
      return *this;
   }
   mpfr_float_backend& operator=(const mpq_t val)
   {
      if(this->m_data[0]._mpfr_d == 0)
         mpfr_init2(this->m_data, multiprecision::detail::digits10_2_2(get_default_precision()));
      mpfr_set_q(this->m_data, val, GMP_RNDN);
      return *this;
   }
   template <unsigned D>
   mpfr_float_backend& operator=(const mpfr_float_backend<D>& val)
   {
      if(this->m_data[0]._mpfr_d == 0)
         mpfr_init2(this->m_data, mpfr_get_prec(val.data()));
      else
         mpfr_set_prec(this->m_data, mpfr_get_prec(val.data()));
      mpfr_set(this->m_data, val.data(), GMP_RNDN);
      return *this;
   }
   template <unsigned D>
   mpfr_float_backend& operator=(const gmp_float<D>& val)
   {
      if(this->m_data[0]._mpfr_d == 0)
         mpfr_init2(this->m_data, mpf_get_prec(val.data()));
      else
         mpfr_set_prec(this->m_data, mpf_get_prec(val.data()));
      mpfr_set_f(this->m_data, val.data(), GMP_RNDN);
      return *this;
   }
   mpfr_float_backend& operator=(const gmp_int& val)
   {
      if(this->m_data[0]._mpfr_d == 0)
         mpfr_init2(this->m_data, multiprecision::detail::digits10_2_2(get_default_precision()));
      mpfr_set_z(this->m_data, val.data(), GMP_RNDN);
      return *this;
   }
   mpfr_float_backend& operator=(const gmp_rational& val)
   {
      if(this->m_data[0]._mpfr_d == 0)
         mpfr_init2(this->m_data, multiprecision::detail::digits10_2_2(get_default_precision()));
      mpfr_set_q(this->m_data, val.data(), GMP_RNDN);
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
      return multiprecision::detail::digits2_2_10(mpfr_get_prec(this->m_data));
   }
   void precision(unsigned digits10) BOOST_NOEXCEPT
   {
      mpfr_prec_round(this->m_data, multiprecision::detail::digits10_2_2((digits10)), GMP_RNDN);
   }
};

template <unsigned digits10, mpfr_allocation_type AllocationType, class T>
inline typename enable_if<is_arithmetic<T>, bool>::type eval_eq(const mpfr_float_backend<digits10, AllocationType>& a, const T& b) BOOST_NOEXCEPT
{
   return a.compare(b) == 0;
}
template <unsigned digits10, mpfr_allocation_type AllocationType, class T>
inline typename enable_if<is_arithmetic<T>, bool>::type eval_lt(const mpfr_float_backend<digits10, AllocationType>& a, const T& b) BOOST_NOEXCEPT
{
   return a.compare(b) < 0;
}
template <unsigned digits10, mpfr_allocation_type AllocationType, class T>
inline typename enable_if<is_arithmetic<T>, bool>::type eval_gt(const mpfr_float_backend<digits10, AllocationType>& a, const T& b) BOOST_NOEXCEPT
{
   return a.compare(b) > 0;
}

template <unsigned D1, unsigned D2, mpfr_allocation_type A1, mpfr_allocation_type A2>
inline void eval_add(mpfr_float_backend<D1, A1>& result, const mpfr_float_backend<D2, A2>& o)
{
   mpfr_add(result.data(), result.data(), o.data(), GMP_RNDN);
}
template <unsigned D1, unsigned D2, mpfr_allocation_type A1, mpfr_allocation_type A2>
inline void eval_subtract(mpfr_float_backend<D1, A1>& result, const mpfr_float_backend<D2, A2>& o)
{
   mpfr_sub(result.data(), result.data(), o.data(), GMP_RNDN);
}
template <unsigned D1, unsigned D2, mpfr_allocation_type A1, mpfr_allocation_type A2>
inline void eval_multiply(mpfr_float_backend<D1, A1>& result, const mpfr_float_backend<D2, A2>& o)
{
   if((void*)&o == (void*)&result)
      mpfr_sqr(result.data(), o.data(), GMP_RNDN);
   else
      mpfr_mul(result.data(), result.data(), o.data(), GMP_RNDN);
}
template <unsigned D1, unsigned D2, mpfr_allocation_type A1, mpfr_allocation_type A2>
inline void eval_divide(mpfr_float_backend<D1, A1>& result, const mpfr_float_backend<D2, A2>& o)
{
   mpfr_div(result.data(), result.data(), o.data(), GMP_RNDN);
}
template <unsigned digits10, mpfr_allocation_type AllocationType>
inline void eval_add(mpfr_float_backend<digits10, AllocationType>& result, unsigned long i)
{
   mpfr_add_ui(result.data(), result.data(), i, GMP_RNDN);
}
template <unsigned digits10, mpfr_allocation_type AllocationType>
inline void eval_subtract(mpfr_float_backend<digits10, AllocationType>& result, unsigned long i)
{
   mpfr_sub_ui(result.data(), result.data(), i, GMP_RNDN);
}
template <unsigned digits10, mpfr_allocation_type AllocationType>
inline void eval_multiply(mpfr_float_backend<digits10, AllocationType>& result, unsigned long i)
{
   mpfr_mul_ui(result.data(), result.data(), i, GMP_RNDN);
}
template <unsigned digits10, mpfr_allocation_type AllocationType>
inline void eval_divide(mpfr_float_backend<digits10, AllocationType>& result, unsigned long i)
{
   mpfr_div_ui(result.data(), result.data(), i, GMP_RNDN);
}
template <unsigned digits10, mpfr_allocation_type AllocationType>
inline void eval_add(mpfr_float_backend<digits10, AllocationType>& result, long i)
{
   if(i > 0)
      mpfr_add_ui(result.data(), result.data(), i, GMP_RNDN);
   else
      mpfr_sub_ui(result.data(), result.data(), boost::multiprecision::detail::unsigned_abs(i), GMP_RNDN);
}
template <unsigned digits10, mpfr_allocation_type AllocationType>
inline void eval_subtract(mpfr_float_backend<digits10, AllocationType>& result, long i)
{
   if(i > 0)
      mpfr_sub_ui(result.data(), result.data(), i, GMP_RNDN);
   else
      mpfr_add_ui(result.data(), result.data(), boost::multiprecision::detail::unsigned_abs(i), GMP_RNDN);
}
template <unsigned digits10, mpfr_allocation_type AllocationType>
inline void eval_multiply(mpfr_float_backend<digits10, AllocationType>& result, long i)
{
   mpfr_mul_ui(result.data(), result.data(), boost::multiprecision::detail::unsigned_abs(i), GMP_RNDN);
   if(i < 0)
      mpfr_neg(result.data(), result.data(), GMP_RNDN);
}
template <unsigned digits10, mpfr_allocation_type AllocationType>
inline void eval_divide(mpfr_float_backend<digits10, AllocationType>& result, long i)
{
   mpfr_div_ui(result.data(), result.data(), boost::multiprecision::detail::unsigned_abs(i), GMP_RNDN);
   if(i < 0)
      mpfr_neg(result.data(), result.data(), GMP_RNDN);
}
//
// Specialised 3 arg versions of the basic operators:
//
template <unsigned D1, unsigned D2, mpfr_allocation_type A1, mpfr_allocation_type A2, unsigned D3>
inline void eval_add(mpfr_float_backend<D1, A1>& a, const mpfr_float_backend<D2, A2>& x, const mpfr_float_backend<D3>& y)
{
   mpfr_add(a.data(), x.data(), y.data(), GMP_RNDN);
}
template <unsigned D1, unsigned D2, mpfr_allocation_type A1, mpfr_allocation_type A2>
inline void eval_add(mpfr_float_backend<D1, A1>& a, const mpfr_float_backend<D2, A2>& x, unsigned long y)
{
   mpfr_add_ui(a.data(), x.data(), y, GMP_RNDN);
}
template <unsigned D1, unsigned D2, mpfr_allocation_type A1, mpfr_allocation_type A2>
inline void eval_add(mpfr_float_backend<D1, A1>& a, const mpfr_float_backend<D2, A2>& x, long y)
{
   if(y < 0)
      mpfr_sub_ui(a.data(), x.data(), boost::multiprecision::detail::unsigned_abs(y), GMP_RNDN);
   else
      mpfr_add_ui(a.data(), x.data(), y, GMP_RNDN);
}
template <unsigned D1, unsigned D2, mpfr_allocation_type A1, mpfr_allocation_type A2>
inline void eval_add(mpfr_float_backend<D1, A1>& a, unsigned long x, const mpfr_float_backend<D2, A2>& y)
{
   mpfr_add_ui(a.data(), y.data(), x, GMP_RNDN);
}
template <unsigned D1, unsigned D2, mpfr_allocation_type A1, mpfr_allocation_type A2>
inline void eval_add(mpfr_float_backend<D1, A1>& a, long x, const mpfr_float_backend<D2, A2>& y)
{
   if(x < 0)
   {
      mpfr_ui_sub(a.data(), boost::multiprecision::detail::unsigned_abs(x), y.data(), GMP_RNDN);
      mpfr_neg(a.data(), a.data(), GMP_RNDN);
   }
   else
      mpfr_add_ui(a.data(), y.data(), x, GMP_RNDN);
}
template <unsigned D1, unsigned D2, mpfr_allocation_type A1, mpfr_allocation_type A2, unsigned D3>
inline void eval_subtract(mpfr_float_backend<D1, A1>& a, const mpfr_float_backend<D2, A2>& x, const mpfr_float_backend<D3>& y)
{
   mpfr_sub(a.data(), x.data(), y.data(), GMP_RNDN);
}
template <unsigned D1, unsigned D2, mpfr_allocation_type A1, mpfr_allocation_type A2>
inline void eval_subtract(mpfr_float_backend<D1, A1>& a, const mpfr_float_backend<D2, A2>& x, unsigned long y)
{
   mpfr_sub_ui(a.data(), x.data(), y, GMP_RNDN);
}
template <unsigned D1, unsigned D2, mpfr_allocation_type A1, mpfr_allocation_type A2>
inline void eval_subtract(mpfr_float_backend<D1, A1>& a, const mpfr_float_backend<D2, A2>& x, long y)
{
   if(y < 0)
      mpfr_add_ui(a.data(), x.data(), boost::multiprecision::detail::unsigned_abs(y), GMP_RNDN);
   else
      mpfr_sub_ui(a.data(), x.data(), y, GMP_RNDN);
}
template <unsigned D1, unsigned D2, mpfr_allocation_type A1, mpfr_allocation_type A2>
inline void eval_subtract(mpfr_float_backend<D1, A1>& a, unsigned long x, const mpfr_float_backend<D2, A2>& y)
{
   mpfr_ui_sub(a.data(), x, y.data(), GMP_RNDN);
}
template <unsigned D1, unsigned D2, mpfr_allocation_type A1, mpfr_allocation_type A2>
inline void eval_subtract(mpfr_float_backend<D1, A1>& a, long x, const mpfr_float_backend<D2, A2>& y)
{
   if(x < 0)
   {
      mpfr_add_ui(a.data(), y.data(), boost::multiprecision::detail::unsigned_abs(x), GMP_RNDN);
      mpfr_neg(a.data(), a.data(), GMP_RNDN);
   }
   else
      mpfr_ui_sub(a.data(), x, y.data(), GMP_RNDN);
}

template <unsigned D1, unsigned D2, mpfr_allocation_type A1, mpfr_allocation_type A2, unsigned D3>
inline void eval_multiply(mpfr_float_backend<D1, A1>& a, const mpfr_float_backend<D2, A2>& x, const mpfr_float_backend<D3>& y)
{
   if((void*)&x == (void*)&y)
      mpfr_sqr(a.data(), x.data(), GMP_RNDN);
   else
      mpfr_mul(a.data(), x.data(), y.data(), GMP_RNDN);
}
template <unsigned D1, unsigned D2, mpfr_allocation_type A1, mpfr_allocation_type A2>
inline void eval_multiply(mpfr_float_backend<D1, A1>& a, const mpfr_float_backend<D2, A2>& x, unsigned long y)
{
   mpfr_mul_ui(a.data(), x.data(), y, GMP_RNDN);
}
template <unsigned D1, unsigned D2, mpfr_allocation_type A1, mpfr_allocation_type A2>
inline void eval_multiply(mpfr_float_backend<D1, A1>& a, const mpfr_float_backend<D2, A2>& x, long y)
{
   if(y < 0)
   {
      mpfr_mul_ui(a.data(), x.data(), boost::multiprecision::detail::unsigned_abs(y), GMP_RNDN);
      a.negate();
   }
   else
      mpfr_mul_ui(a.data(), x.data(), y, GMP_RNDN);
}
template <unsigned D1, unsigned D2, mpfr_allocation_type A1, mpfr_allocation_type A2>
inline void eval_multiply(mpfr_float_backend<D1, A1>& a, unsigned long x, const mpfr_float_backend<D2, A2>& y)
{
   mpfr_mul_ui(a.data(), y.data(), x, GMP_RNDN);
}
template <unsigned D1, unsigned D2, mpfr_allocation_type A1, mpfr_allocation_type A2>
inline void eval_multiply(mpfr_float_backend<D1, A1>& a, long x, const mpfr_float_backend<D2, A2>& y)
{
   if(x < 0)
   {
      mpfr_mul_ui(a.data(), y.data(), boost::multiprecision::detail::unsigned_abs(x), GMP_RNDN);
      mpfr_neg(a.data(), a.data(), GMP_RNDN);
   }
   else
      mpfr_mul_ui(a.data(), y.data(), x, GMP_RNDN);
}

template <unsigned D1, unsigned D2, mpfr_allocation_type A1, mpfr_allocation_type A2, unsigned D3>
inline void eval_divide(mpfr_float_backend<D1, A1>& a, const mpfr_float_backend<D2, A2>& x, const mpfr_float_backend<D3>& y)
{
   mpfr_div(a.data(), x.data(), y.data(), GMP_RNDN);
}
template <unsigned D1, unsigned D2, mpfr_allocation_type A1, mpfr_allocation_type A2>
inline void eval_divide(mpfr_float_backend<D1, A1>& a, const mpfr_float_backend<D2, A2>& x, unsigned long y)
{
   mpfr_div_ui(a.data(), x.data(), y, GMP_RNDN);
}
template <unsigned D1, unsigned D2, mpfr_allocation_type A1, mpfr_allocation_type A2>
inline void eval_divide(mpfr_float_backend<D1, A1>& a, const mpfr_float_backend<D2, A2>& x, long y)
{
   if(y < 0)
   {
      mpfr_div_ui(a.data(), x.data(), boost::multiprecision::detail::unsigned_abs(y), GMP_RNDN);
      a.negate();
   }
   else
      mpfr_div_ui(a.data(), x.data(), y, GMP_RNDN);
}
template <unsigned D1, unsigned D2, mpfr_allocation_type A1, mpfr_allocation_type A2>
inline void eval_divide(mpfr_float_backend<D1, A1>& a, unsigned long x, const mpfr_float_backend<D2, A2>& y)
{
   mpfr_ui_div(a.data(), x, y.data(), GMP_RNDN);
}
template <unsigned D1, unsigned D2, mpfr_allocation_type A1, mpfr_allocation_type A2>
inline void eval_divide(mpfr_float_backend<D1, A1>& a, long x, const mpfr_float_backend<D2, A2>& y)
{
   if(x < 0)
   {
      mpfr_ui_div(a.data(), boost::multiprecision::detail::unsigned_abs(x), y.data(), GMP_RNDN);
      mpfr_neg(a.data(), a.data(), GMP_RNDN);
   }
   else
      mpfr_ui_div(a.data(), x, y.data(), GMP_RNDN);
}

template <unsigned digits10, mpfr_allocation_type AllocationType>
inline bool eval_is_zero(const mpfr_float_backend<digits10, AllocationType>& val) BOOST_NOEXCEPT
{
   return 0 != mpfr_zero_p(val.data());
}
template <unsigned digits10, mpfr_allocation_type AllocationType>
inline int eval_get_sign(const mpfr_float_backend<digits10, AllocationType>& val) BOOST_NOEXCEPT
{
   return mpfr_sgn(val.data());
}

template <unsigned digits10, mpfr_allocation_type AllocationType>
inline void eval_convert_to(unsigned long* result, const mpfr_float_backend<digits10, AllocationType>& val)
{
   if(mpfr_nan_p(val.data()))
   {
      BOOST_THROW_EXCEPTION(std::runtime_error("Could not convert NaN to integer."));
   }
   *result = mpfr_get_ui(val.data(), GMP_RNDZ);
}
template <unsigned digits10, mpfr_allocation_type AllocationType>
inline void eval_convert_to(long* result, const mpfr_float_backend<digits10, AllocationType>& val)
{
   if(mpfr_nan_p(val.data()))
   {
      BOOST_THROW_EXCEPTION(std::runtime_error("Could not convert NaN to integer."));
   }
   *result = mpfr_get_si(val.data(), GMP_RNDZ);
}
#ifdef _MPFR_H_HAVE_INTMAX_T
template <unsigned digits10, mpfr_allocation_type AllocationType>
inline void eval_convert_to(boost::ulong_long_type* result, const mpfr_float_backend<digits10, AllocationType>& val)
{
   if(mpfr_nan_p(val.data()))
   {
      BOOST_THROW_EXCEPTION(std::runtime_error("Could not convert NaN to integer."));
   }
   *result = mpfr_get_uj(val.data(), GMP_RNDZ);
}
template <unsigned digits10, mpfr_allocation_type AllocationType>
inline void eval_convert_to(boost::long_long_type* result, const mpfr_float_backend<digits10, AllocationType>& val)
{
   if(mpfr_nan_p(val.data()))
   {
      BOOST_THROW_EXCEPTION(std::runtime_error("Could not convert NaN to integer."));
   }
   *result = mpfr_get_sj(val.data(), GMP_RNDZ);
}
#endif
template <unsigned digits10, mpfr_allocation_type AllocationType>
inline void eval_convert_to(float* result, const mpfr_float_backend<digits10, AllocationType>& val) BOOST_NOEXCEPT
{
   *result = mpfr_get_flt(val.data(), GMP_RNDN);
}
template <unsigned digits10, mpfr_allocation_type AllocationType>
inline void eval_convert_to(double* result, const mpfr_float_backend<digits10, AllocationType>& val) BOOST_NOEXCEPT
{
   *result = mpfr_get_d(val.data(), GMP_RNDN);
}
template <unsigned digits10, mpfr_allocation_type AllocationType>
inline void eval_convert_to(long double* result, const mpfr_float_backend<digits10, AllocationType>& val) BOOST_NOEXCEPT
{
   *result = mpfr_get_ld(val.data(), GMP_RNDN);
}

//
// Native non-member operations:
//
template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_sqrt(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& val)
{
   mpfr_sqrt(result.data(), val.data(), GMP_RNDN);
}

template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_abs(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& val)
{
   mpfr_abs(result.data(), val.data(), GMP_RNDN);
}

template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_fabs(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& val)
{
   mpfr_abs(result.data(), val.data(), GMP_RNDN);
}
template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_ceil(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& val)
{
   mpfr_ceil(result.data(), val.data());
}
template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_floor(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& val)
{
   mpfr_floor(result.data(), val.data());
}
template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_trunc(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& val)
{
   if(0 == mpfr_number_p(val.data()))
   {
      result = boost::math::policies::raise_rounding_error("boost::multiprecision::trunc<%1%>(%1%)", 0, number<mpfr_float_backend<Digits10, AllocateType> >(val), number<mpfr_float_backend<Digits10, AllocateType> >(val), boost::math::policies::policy<>()).backend();
      return;
   }
   mpfr_trunc(result.data(), val.data());
}
template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_ldexp(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& val, long e)
{
   if(e > 0)
      mpfr_mul_2exp(result.data(), val.data(), e, GMP_RNDN);
   else if(e < 0)
      mpfr_div_2exp(result.data(), val.data(), -e, GMP_RNDN);
   else
      result = val;
}
template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_frexp(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& val, int* e)
{
   long v;
   mpfr_get_d_2exp(&v, val.data(), GMP_RNDN);
   *e = v;
   eval_ldexp(result, val, -v);
}
template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_frexp(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& val, long* e)
{
   mpfr_get_d_2exp(e, val.data(), GMP_RNDN);
   return eval_ldexp(result, val, -*e);
}

template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline int eval_fpclassify(const mpfr_float_backend<Digits10, AllocateType>& val) BOOST_NOEXCEPT
{
   return mpfr_inf_p(val.data()) ? FP_INFINITE : mpfr_nan_p(val.data()) ? FP_NAN : mpfr_zero_p(val.data()) ? FP_ZERO : FP_NORMAL;
}

template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_pow(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& b, const mpfr_float_backend<Digits10, AllocateType>& e)
{
   mpfr_pow(result.data(), b.data(), e.data(), GMP_RNDN);
}

#ifdef BOOST_MSVC
//
// The enable_if usage below doesn't work with msvc - but only when
// certain other enable_if usages are defined first.  It's a capricious
// and rather annoying compiler bug in other words....
//
# define BOOST_MP_ENABLE_IF_WORKAROUND (Digits10 || !Digits10) &&
#else
#define BOOST_MP_ENABLE_IF_WORKAROUND
#endif

template <unsigned Digits10, mpfr_allocation_type AllocateType, class Integer>
inline typename enable_if<mpl::and_<is_signed<Integer>, mpl::bool_<BOOST_MP_ENABLE_IF_WORKAROUND (sizeof(Integer) <= sizeof(long))> > >::type
   eval_pow(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& b, const Integer& e)
{
   mpfr_pow_si(result.data(), b.data(), e, GMP_RNDN);
}

template <unsigned Digits10, mpfr_allocation_type AllocateType, class Integer>
inline typename enable_if<mpl::and_<is_unsigned<Integer>, mpl::bool_<BOOST_MP_ENABLE_IF_WORKAROUND (sizeof(Integer) <= sizeof(long))> > >::type
   eval_pow(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& b, const Integer& e)
{
   mpfr_pow_ui(result.data(), b.data(), e, GMP_RNDN);
}

#undef BOOST_MP_ENABLE_IF_WORKAROUND

template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_exp(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& arg)
{
   mpfr_exp(result.data(), arg.data(), GMP_RNDN);
}

template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_exp2(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& arg)
{
   mpfr_exp2(result.data(), arg.data(), GMP_RNDN);
}

template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_log(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& arg)
{
   mpfr_log(result.data(), arg.data(), GMP_RNDN);
}

template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_log10(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& arg)
{
   mpfr_log10(result.data(), arg.data(), GMP_RNDN);
}

template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_sin(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& arg)
{
   mpfr_sin(result.data(), arg.data(), GMP_RNDN);
}

template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_cos(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& arg)
{
   mpfr_cos(result.data(), arg.data(), GMP_RNDN);
}

template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_tan(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& arg)
{
   mpfr_tan(result.data(), arg.data(), GMP_RNDN);
}

template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_asin(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& arg)
{
   mpfr_asin(result.data(), arg.data(), GMP_RNDN);
}

template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_acos(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& arg)
{
   mpfr_acos(result.data(), arg.data(), GMP_RNDN);
}

template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_atan(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& arg)
{
   mpfr_atan(result.data(), arg.data(), GMP_RNDN);
}

template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_atan2(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& arg1, const mpfr_float_backend<Digits10, AllocateType>& arg2)
{
   mpfr_atan2(result.data(), arg1.data(), arg2.data(), GMP_RNDN);
}

template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_sinh(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& arg)
{
   mpfr_sinh(result.data(), arg.data(), GMP_RNDN);
}

template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_cosh(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& arg)
{
   mpfr_cosh(result.data(), arg.data(), GMP_RNDN);
}

template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_tanh(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& arg)
{
   mpfr_tanh(result.data(), arg.data(), GMP_RNDN);
}

template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_log2(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& arg)
{
   mpfr_log2(result.data(), arg.data(), GMP_RNDN);
}

template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_modf(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& arg, mpfr_float_backend<Digits10, AllocateType>* pipart)
{
   if(0 == pipart)
   {
      mpfr_float_backend<Digits10, AllocateType> ipart;
      mpfr_modf(ipart.data(), result.data(), arg.data(), GMP_RNDN);
   }
   else
   {
      mpfr_modf(pipart->data(), result.data(), arg.data(), GMP_RNDN);
   }
}
template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_remainder(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& a, const mpfr_float_backend<Digits10, AllocateType>& b)
{
   mpfr_remainder(result.data(), a.data(), b.data(), GMP_RNDN);
}
template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_remquo(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& a, const mpfr_float_backend<Digits10, AllocateType>& b, int* pi)
{
   long l;
   mpfr_remquo(result.data(), &l, a.data(), b.data(), GMP_RNDN);
   if(pi) *pi = l;
}

template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_fmod(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& a, const mpfr_float_backend<Digits10, AllocateType>& b)
{
   mpfr_fmod(result.data(), a.data(), b.data(), GMP_RNDN);
}

template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_multiply_add(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& a, const mpfr_float_backend<Digits10, AllocateType>& b)
{
   mpfr_fma(result.data(), a.data(), b.data(), result.data(), GMP_RNDN);
}

template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_multiply_add(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& a, const mpfr_float_backend<Digits10, AllocateType>& b, const mpfr_float_backend<Digits10, AllocateType>& c)
{
   mpfr_fma(result.data(), a.data(), b.data(), c.data(), GMP_RNDN);
}

template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_multiply_subtract(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& a, const mpfr_float_backend<Digits10, AllocateType>& b)
{
   mpfr_fms(result.data(), a.data(), b.data(), result.data(), GMP_RNDN);
   result.negate();
}

template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline void eval_multiply_subtract(mpfr_float_backend<Digits10, AllocateType>& result, const mpfr_float_backend<Digits10, AllocateType>& a, const mpfr_float_backend<Digits10, AllocateType>& b, const mpfr_float_backend<Digits10, AllocateType>& c)
{
   mpfr_fms(result.data(), a.data(), b.data(), c.data(), GMP_RNDN);
}

template <unsigned Digits10, mpfr_allocation_type AllocateType>
inline std::size_t hash_value(const mpfr_float_backend<Digits10, AllocateType>& val)
{
   std::size_t result = 0;
   std::size_t len = val.data()[0]._mpfr_prec / mp_bits_per_limb;
   if(val.data()[0]._mpfr_prec % mp_bits_per_limb)
      ++len;
   for(int i = 0; i < len; ++i)
      boost::hash_combine(result, val.data()[0]._mpfr_d[i]);
   boost::hash_combine(result, val.data()[0]._mpfr_exp);
   boost::hash_combine(result, val.data()[0]._mpfr_sign);
   return result;
}

} // namespace backends

#ifdef BOOST_NO_SFINAE_EXPR

namespace detail{

template<unsigned D1, unsigned D2, mpfr_allocation_type A1, mpfr_allocation_type A2>
struct is_explicitly_convertible<backends::mpfr_float_backend<D1, A1>, backends::mpfr_float_backend<D2, A2> > : public mpl::true_ {};

}

#endif

template<>
struct number_category<detail::canonical<mpfr_t, backends::mpfr_float_backend<0> >::type> : public mpl::int_<number_kind_floating_point>{};

using boost::multiprecision::backends::mpfr_float_backend;

typedef number<mpfr_float_backend<50> >    mpfr_float_50;
typedef number<mpfr_float_backend<100> >   mpfr_float_100;
typedef number<mpfr_float_backend<500> >   mpfr_float_500;
typedef number<mpfr_float_backend<1000> >  mpfr_float_1000;
typedef number<mpfr_float_backend<0> >     mpfr_float;

typedef number<mpfr_float_backend<50, allocate_stack> >    static_mpfr_float_50;
typedef number<mpfr_float_backend<100, allocate_stack> >   static_mpfr_float_100;

template<unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
inline int signbit BOOST_PREVENT_MACRO_SUBSTITUTION(const boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates>& arg)
{
   return (arg.backend().data()[0]._mpfr_sign < 0) ? 1 : 0;
}

template<unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
inline boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> copysign BOOST_PREVENT_MACRO_SUBSTITUTION(const boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates>& a, const boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates>& b)
{
   return (boost::multiprecision::signbit)(a) != (boost::multiprecision::signbit)(b) ? boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates>(-a) : a;
}

template<unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
inline int signbit BOOST_PREVENT_MACRO_SUBSTITUTION(const boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType> >, ExpressionTemplates>& arg)
{
   return (arg.backend().value().data()[0]._mpfr_sign < 0) ? 1 : 0;
}

template<unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
inline boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType> >, ExpressionTemplates> copysign BOOST_PREVENT_MACRO_SUBSTITUTION(const boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType> >, ExpressionTemplates>& a, const boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType> >, ExpressionTemplates>& b)
{
   return (boost::multiprecision::signbit)(a) != (boost::multiprecision::signbit)(b) ? boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType> >, ExpressionTemplates>(-a) : a;
}

} // namespace multiprecision

namespace math{

   using boost::multiprecision::signbit;
   using boost::multiprecision::copysign;

namespace tools{

template <>
inline int digits<boost::multiprecision::mpfr_float>()
#ifdef BOOST_MATH_NOEXCEPT
   BOOST_NOEXCEPT
#endif
{
   return multiprecision::detail::digits10_2_2(boost::multiprecision::mpfr_float::default_precision());
}
template <>
inline int digits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, boost::multiprecision::et_off> >()
#ifdef BOOST_MATH_NOEXCEPT
   BOOST_NOEXCEPT
#endif
{
   return multiprecision::detail::digits10_2_2(boost::multiprecision::mpfr_float::default_precision());
}

template <>
inline boost::multiprecision::mpfr_float
   max_value<boost::multiprecision::mpfr_float>()
{
   boost::multiprecision::mpfr_float result(0.5);
   mpfr_mul_2exp(result.backend().data(), result.backend().data(), mpfr_get_emax(), GMP_RNDN);
   BOOST_ASSERT(mpfr_number_p(result.backend().data()));
   return result;
}

template <>
inline boost::multiprecision::mpfr_float
   min_value<boost::multiprecision::mpfr_float>()
{
   boost::multiprecision::mpfr_float result(0.5);
   mpfr_div_2exp(result.backend().data(), result.backend().data(), -mpfr_get_emin(), GMP_RNDN);
   BOOST_ASSERT(mpfr_number_p(result.backend().data()));
   return result;
}

template <>
inline boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, boost::multiprecision::et_off> 
   max_value<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, boost::multiprecision::et_off> >()
{
   boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, boost::multiprecision::et_off> result(0.5);
   mpfr_mul_2exp(result.backend().data(), result.backend().data(), mpfr_get_emax(), GMP_RNDN);
   BOOST_ASSERT(mpfr_number_p(result.backend().data()));
   return result;
}

template <>
inline boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, boost::multiprecision::et_off>
   min_value<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, boost::multiprecision::et_off> >()
{
   boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, boost::multiprecision::et_off> result(0.5);
   mpfr_div_2exp(result.backend().data(), result.backend().data(), -mpfr_get_emin(), GMP_RNDN);
   BOOST_ASSERT(mpfr_number_p(result.backend().data()));
   return result;
}

template <>
inline int digits<boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpfr_float::backend_type> > >()
#ifdef BOOST_MATH_NOEXCEPT
BOOST_NOEXCEPT
#endif
{
   return multiprecision::detail::digits10_2_2(boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpfr_float::backend_type> >::default_precision());
}
template <>
inline int digits<boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpfr_float_backend<0> >, boost::multiprecision::et_off> >()
#ifdef BOOST_MATH_NOEXCEPT
BOOST_NOEXCEPT
#endif
{
   return multiprecision::detail::digits10_2_2(boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpfr_float::backend_type> >::default_precision());
}

template <>
inline boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpfr_float::backend_type> >
max_value<boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpfr_float::backend_type> > >()
{
   return max_value<boost::multiprecision::mpfr_float>().backend();
}

template <>
inline boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpfr_float::backend_type> >
min_value<boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpfr_float::backend_type> > >()
{
   return min_value<boost::multiprecision::mpfr_float>().backend();
}

template <>
inline boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpfr_float_backend<0> >, boost::multiprecision::et_off>
max_value<boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpfr_float_backend<0> >, boost::multiprecision::et_off> >()
{
   return max_value<boost::multiprecision::mpfr_float>().backend();
}

template <>
inline boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpfr_float_backend<0> >, boost::multiprecision::et_off>
min_value<boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpfr_float_backend<0> >, boost::multiprecision::et_off> >()
{
   return min_value<boost::multiprecision::mpfr_float>().backend();
}

} // namespace tools

namespace constants{ namespace detail{

template <class T> struct constant_pi;
template <class T> struct constant_ln_two;
template <class T> struct constant_euler;
template <class T> struct constant_catalan;

namespace detail{

   template <class T, int N>
   struct mpfr_constant_initializer
   {
      static void force_instantiate()
      {
         init.force_instantiate();
      }
   private:
      struct initializer
      {
         initializer()
         {
            T::get(mpl::int_<N>());
         }
         void force_instantiate()const{}
      };
      static const initializer init;
   };

   template <class T, int N>
   typename mpfr_constant_initializer<T, N>::initializer const mpfr_constant_initializer<T, N>::init;

}

template<unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
struct constant_pi<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >
{
   typedef boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> result_type;
   template<int N>
   static inline const result_type& get(const mpl::int_<N>&)
   {
      detail::mpfr_constant_initializer<constant_pi<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >, N>::force_instantiate();
      static result_type result;
      static bool has_init = false;
      if(!has_init)
      {
         mpfr_const_pi(result.backend().data(), GMP_RNDN);
         has_init = true;
      }
      return result;
   }
   static inline const result_type get(const mpl::int_<0>&)
   {
      result_type result;
      mpfr_const_pi(result.backend().data(), GMP_RNDN);
      return result;
   }
};
template<unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
struct constant_ln_two<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >
{
   typedef boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> result_type;
   template<int N>
   static inline const result_type& get(const mpl::int_<N>&)
   {
      detail::mpfr_constant_initializer<constant_ln_two<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >, N>::force_instantiate();
      static result_type result;
      static bool init = false;
      if(!init)
      {
         mpfr_const_log2(result.backend().data(), GMP_RNDN);
         init = true;
      }
      return result;
   }
   static inline const result_type get(const mpl::int_<0>&)
   {
      result_type result;
      mpfr_const_log2(result.backend().data(), GMP_RNDN);
      return result;
   }
};
template<unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
struct constant_euler<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >
{
   typedef boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> result_type;
   template<int N>
   static inline const result_type& get(const mpl::int_<N>&)
   {
      detail::mpfr_constant_initializer<constant_euler<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >, N>::force_instantiate();
      static result_type result;
      static bool init = false;
      if(!init)
      {
         mpfr_const_euler(result.backend().data(), GMP_RNDN);
         init = true;
      }
      return result;
   }
   static inline const result_type get(const mpl::int_<0>&)
   {
      result_type result;
      mpfr_const_euler(result.backend().data(), GMP_RNDN);
      return result;
   }
};
template<unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
struct constant_catalan<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >
{
   typedef boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> result_type;
   template<int N>
   static inline const result_type& get(const mpl::int_<N>&)
   {
      detail::mpfr_constant_initializer<constant_catalan<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >, N>::force_instantiate();
      static result_type result;
      static bool init = false;
      if(!init)
      {
         mpfr_const_catalan(result.backend().data(), GMP_RNDN);
         init = true;
      }
      return result;
   }
   static inline const result_type get(const mpl::int_<0>&)
   {
      result_type result;
      mpfr_const_catalan(result.backend().data(), GMP_RNDN);
      return result;
   }
};

template<unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
struct constant_pi<boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType> >, ExpressionTemplates> >
{
   typedef boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType> >, ExpressionTemplates> result_type;
   template<int N>
   static inline const result_type& get(const mpl::int_<N>&)
   {
      detail::mpfr_constant_initializer<constant_pi<boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType> >, ExpressionTemplates> >, N>::force_instantiate();
      static result_type result;
      static bool has_init = false;
      if(!has_init)
      {
         mpfr_const_pi(result.backend().value().data(), GMP_RNDN);
         has_init = true;
      }
      return result;
   }
   static inline const result_type get(const mpl::int_<0>&)
   {
      result_type result;
      mpfr_const_pi(result.backend().value().data(), GMP_RNDN);
      return result;
   }
};
template<unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
struct constant_ln_two<boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType> >, ExpressionTemplates> >
{
   typedef boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType> >, ExpressionTemplates> result_type;
   template<int N>
   static inline const result_type& get(const mpl::int_<N>&)
   {
      detail::mpfr_constant_initializer<constant_ln_two<boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType> >, ExpressionTemplates> >, N>::force_instantiate();
      static result_type result;
      static bool init = false;
      if(!init)
      {
         mpfr_const_log2(result.backend().value().data(), GMP_RNDN);
         init = true;
      }
      return result;
   }
   static inline const result_type get(const mpl::int_<0>&)
   {
      result_type result;
      mpfr_const_log2(result.backend().value().data(), GMP_RNDN);
      return result;
   }
};
template<unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
struct constant_euler<boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType> >, ExpressionTemplates> >
{
   typedef boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType> >, ExpressionTemplates> result_type;
   template<int N>
   static inline const result_type& get(const mpl::int_<N>&)
   {
      detail::mpfr_constant_initializer<constant_euler<boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType> >, ExpressionTemplates> >, N>::force_instantiate();
      static result_type result;
      static bool init = false;
      if(!init)
      {
         mpfr_const_euler(result.backend().value().data(), GMP_RNDN);
         init = true;
      }
      return result;
   }
   static inline const result_type get(const mpl::int_<0>&)
   {
      result_type result;
      mpfr_const_euler(result.backend().value().data(), GMP_RNDN);
      return result;
   }
};
template<unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
struct constant_catalan<boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType> >, ExpressionTemplates> >
{
   typedef boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType> >, ExpressionTemplates> result_type;
   template<int N>
   static inline const result_type& get(const mpl::int_<N>&)
   {
      detail::mpfr_constant_initializer<constant_catalan<boost::multiprecision::number<boost::multiprecision::debug_adaptor<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType> >, ExpressionTemplates> >, N>::force_instantiate();
      static result_type result;
      static bool init = false;
      if(!init)
      {
         mpfr_const_catalan(result.backend().value().data(), GMP_RNDN);
         init = true;
      }
      return result;
   }
   static inline const result_type get(const mpl::int_<0>&)
   {
      result_type result;
      mpfr_const_catalan(result.backend().value().data(), GMP_RNDN);
      return result;
   }
};

}} // namespaces

} // namespace multiprecision

namespace multiprecision {
   //
   // Overloaded special functions which call native mpfr routines:
   //
   template<unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
   inline boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> asinh BOOST_PREVENT_MACRO_SUBSTITUTION(const boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates>& arg)
   {
      boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> result;
      mpfr_asinh(result.backend().data(), arg.backend().data(), GMP_RNDN);
      return BOOST_MP_MOVE(result);
   }
   template<unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
   inline boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> acosh BOOST_PREVENT_MACRO_SUBSTITUTION(const boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates>& arg)
   {
      boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> result;
      mpfr_acosh(result.backend().data(), arg.backend().data(), GMP_RNDN);
      return BOOST_MP_MOVE(result);
   }
   template<unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
   inline boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> atanh BOOST_PREVENT_MACRO_SUBSTITUTION(const boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates>& arg)
   {
      boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> result;
      mpfr_atanh(result.backend().data(), arg.backend().data(), GMP_RNDN);
      return BOOST_MP_MOVE(result);
   }
   template<unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
   inline boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> cbrt BOOST_PREVENT_MACRO_SUBSTITUTION(const boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates>& arg)
   {
      boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> result;
      mpfr_cbrt(result.backend().data(), arg.backend().data(), GMP_RNDN);
      return BOOST_MP_MOVE(result);
   }
   template<unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
   inline boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> erf BOOST_PREVENT_MACRO_SUBSTITUTION(const boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates>& arg)
   {
      boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> result;
      mpfr_erf(result.backend().data(), arg.backend().data(), GMP_RNDN);
      return BOOST_MP_MOVE(result);
   }
   template<unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
   inline boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> erfc BOOST_PREVENT_MACRO_SUBSTITUTION(const boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates>& arg)
   {
      boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> result;
      mpfr_erfc(result.backend().data(), arg.backend().data(), GMP_RNDN);
      return BOOST_MP_MOVE(result);
   }
   template<unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
   inline boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> expm1 BOOST_PREVENT_MACRO_SUBSTITUTION(const boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates>& arg)
   {
      boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> result;
      mpfr_expm1(result.backend().data(), arg.backend().data(), GMP_RNDN);
      return BOOST_MP_MOVE(result);
   }
   template<unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
   inline boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> lgamma BOOST_PREVENT_MACRO_SUBSTITUTION(const boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates>& arg)
   {
      boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> result;
      mpfr_lngamma(result.backend().data(), arg.backend().data(), GMP_RNDN);
      return BOOST_MP_MOVE(result);
   }
   template<unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
   inline boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> tgamma BOOST_PREVENT_MACRO_SUBSTITUTION(const boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates>& arg)
   {
      boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> result;
      mpfr_gamma(result.backend().data(), arg.backend().data(), GMP_RNDN);
      return BOOST_MP_MOVE(result);
   }
   template<unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
   inline boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> log1p BOOST_PREVENT_MACRO_SUBSTITUTION(const boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates>& arg)
   {
      boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> result;
      mpfr_log1p(result.backend().data(), arg.backend().data(), GMP_RNDN);
      return BOOST_MP_MOVE(result);
   }

}

}  // namespace boost

namespace std{

//
// numeric_limits [partial] specializations for the types declared in this header:
//
template<unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
class numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >
{
   typedef boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> number_type;
public:
   BOOST_STATIC_CONSTEXPR bool is_specialized = true;
   static number_type (min)()
   {
      initializer.do_nothing();
      static std::pair<bool, number_type> value;
      if(!value.first)
      {
         value.first = true;
         value.second = 0.5;
         mpfr_div_2exp(value.second.backend().data(), value.second.backend().data(), -mpfr_get_emin(), GMP_RNDN);
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
         value.second = 0.5;
         mpfr_mul_2exp(value.second.backend().data(), value.second.backend().data(), mpfr_get_emax(), GMP_RNDN);
      }
      return value.second;
   }
   BOOST_STATIC_CONSTEXPR number_type lowest()
   {
      return -(max)();
   }
   BOOST_STATIC_CONSTEXPR int digits = static_cast<int>((Digits10 * 1000L) / 301L + ((Digits10 * 1000L) % 301 ? 2 : 1));
   BOOST_STATIC_CONSTEXPR int digits10 = Digits10;
   // Is this really correct???
   BOOST_STATIC_CONSTEXPR int max_digits10 = Digits10 + 3;
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
         mpfr_div_2exp(value.second.backend().data(), value.second.backend().data(), std::numeric_limits<number_type>::digits - 1, GMP_RNDN);
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
         mpfr_div_2exp(value.second.backend().data(), value.second.backend().data(), 1, GMP_RNDN);
      }
      return value.second;
   }
   BOOST_STATIC_CONSTEXPR long min_exponent = MPFR_EMIN_DEFAULT;
   BOOST_STATIC_CONSTEXPR long min_exponent10 = (MPFR_EMIN_DEFAULT / 1000) * 301L;
   BOOST_STATIC_CONSTEXPR long max_exponent = MPFR_EMAX_DEFAULT;
   BOOST_STATIC_CONSTEXPR long max_exponent10 = (MPFR_EMAX_DEFAULT / 1000) * 301L;
   BOOST_STATIC_CONSTEXPR bool has_infinity = true;
   BOOST_STATIC_CONSTEXPR bool has_quiet_NaN = true;
   BOOST_STATIC_CONSTEXPR bool has_signaling_NaN = false;
   BOOST_STATIC_CONSTEXPR float_denorm_style has_denorm = denorm_absent;
   BOOST_STATIC_CONSTEXPR bool has_denorm_loss = false;
   static number_type infinity()
   {
      // returns epsilon/2
      initializer.do_nothing();
      static std::pair<bool, number_type> value;
      if(!value.first)
      {
         value.first = true;
         value.second = 1;
         mpfr_set_inf(value.second.backend().data(), 1);
      }
      return value.second;
   }
   static number_type quiet_NaN()
   {
      // returns epsilon/2
      initializer.do_nothing();
      static std::pair<bool, number_type> value;
      if(!value.first)
      {
         value.first = true;
         value.second = 1;
         mpfr_set_nan(value.second.backend().data());
      }
      return value.second;
   }
   BOOST_STATIC_CONSTEXPR number_type signaling_NaN()
   {
      return number_type(0);
   }
   BOOST_STATIC_CONSTEXPR number_type denorm_min() { return number_type(0); }
   BOOST_STATIC_CONSTEXPR bool is_iec559 = false;
   BOOST_STATIC_CONSTEXPR bool is_bounded = true;
   BOOST_STATIC_CONSTEXPR bool is_modulo = false;
   BOOST_STATIC_CONSTEXPR bool traps = true;
   BOOST_STATIC_CONSTEXPR bool tinyness_before = false;
   BOOST_STATIC_CONSTEXPR float_round_style round_style = round_to_nearest;

private:
   struct data_initializer
   {
      data_initializer()
      {
         std::numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<digits10, AllocateType> > >::epsilon();
         std::numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<digits10, AllocateType> > >::round_error();
         (std::numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<digits10, AllocateType> > >::min)();
         (std::numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<digits10, AllocateType> > >::max)();
         std::numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<digits10, AllocateType> > >::infinity();
         std::numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<digits10, AllocateType> > >::quiet_NaN();
      }
      void do_nothing()const{}
   };
   static const data_initializer initializer;
};

template<unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
const typename numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >::data_initializer numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >::initializer;

#ifndef BOOST_NO_INCLASS_MEMBER_INITIALIZATION

template <unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >::digits;
template <unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >::digits10;
template <unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >::max_digits10;
template <unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >::is_signed;
template <unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >::is_integer;
template <unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >::is_exact;
template <unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >::radix;
template <unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST long numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >::min_exponent;
template <unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST long numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >::min_exponent10;
template <unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST long numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >::max_exponent;
template <unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST long numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >::max_exponent10;
template <unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >::has_infinity;
template <unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >::has_quiet_NaN;
template <unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >::has_signaling_NaN;
template <unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST float_denorm_style numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >::has_denorm;
template <unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >::has_denorm_loss;
template <unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >::is_iec559;
template <unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >::is_bounded;
template <unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >::is_modulo;
template <unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >::traps;
template <unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >::tinyness_before;
template <unsigned Digits10, boost::multiprecision::mpfr_allocation_type AllocateType, boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST float_round_style numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<Digits10, AllocateType>, ExpressionTemplates> >::round_style;

#endif


template<boost::multiprecision::expression_template_option ExpressionTemplates>
class numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, ExpressionTemplates> >
{
   typedef boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, ExpressionTemplates> number_type;
public:
   BOOST_STATIC_CONSTEXPR bool is_specialized = false;
   static number_type (min)() { return number_type(0); }
   static number_type (max)() { return number_type(0); }
   static number_type lowest() { return number_type(0); }
   BOOST_STATIC_CONSTEXPR int digits = 0;
   BOOST_STATIC_CONSTEXPR int digits10 = 0;
   BOOST_STATIC_CONSTEXPR int max_digits10 = 0;
   BOOST_STATIC_CONSTEXPR bool is_signed = false;
   BOOST_STATIC_CONSTEXPR bool is_integer = false;
   BOOST_STATIC_CONSTEXPR bool is_exact = false;
   BOOST_STATIC_CONSTEXPR int radix = 0;
   static number_type epsilon() { return number_type(0); }
   static number_type round_error() { return number_type(0); }
   BOOST_STATIC_CONSTEXPR int min_exponent = 0;
   BOOST_STATIC_CONSTEXPR int min_exponent10 = 0;
   BOOST_STATIC_CONSTEXPR int max_exponent = 0;
   BOOST_STATIC_CONSTEXPR int max_exponent10 = 0;
   BOOST_STATIC_CONSTEXPR bool has_infinity = false;
   BOOST_STATIC_CONSTEXPR bool has_quiet_NaN = false;
   BOOST_STATIC_CONSTEXPR bool has_signaling_NaN = false;
   BOOST_STATIC_CONSTEXPR float_denorm_style has_denorm = denorm_absent;
   BOOST_STATIC_CONSTEXPR bool has_denorm_loss = false;
   static number_type infinity() { return number_type(0); }
   static number_type quiet_NaN() { return number_type(0); }
   static number_type signaling_NaN() { return number_type(0); }
   static number_type denorm_min() { return number_type(0); }
   BOOST_STATIC_CONSTEXPR bool is_iec559 = false;
   BOOST_STATIC_CONSTEXPR bool is_bounded = false;
   BOOST_STATIC_CONSTEXPR bool is_modulo = false;
   BOOST_STATIC_CONSTEXPR bool traps = false;
   BOOST_STATIC_CONSTEXPR bool tinyness_before = false;
   BOOST_STATIC_CONSTEXPR float_round_style round_style = round_toward_zero;
};

#ifndef BOOST_NO_INCLASS_MEMBER_INITIALIZATION

template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, ExpressionTemplates> >::digits;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, ExpressionTemplates> >::digits10;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, ExpressionTemplates> >::max_digits10;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, ExpressionTemplates> >::is_signed;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, ExpressionTemplates> >::is_integer;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, ExpressionTemplates> >::is_exact;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, ExpressionTemplates> >::radix;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, ExpressionTemplates> >::min_exponent;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, ExpressionTemplates> >::min_exponent10;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, ExpressionTemplates> >::max_exponent;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST int numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, ExpressionTemplates> >::max_exponent10;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, ExpressionTemplates> >::has_infinity;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, ExpressionTemplates> >::has_quiet_NaN;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, ExpressionTemplates> >::has_signaling_NaN;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST float_denorm_style numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, ExpressionTemplates> >::has_denorm;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, ExpressionTemplates> >::has_denorm_loss;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, ExpressionTemplates> >::is_iec559;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, ExpressionTemplates> >::is_bounded;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, ExpressionTemplates> >::is_modulo;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, ExpressionTemplates> >::traps;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST bool numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, ExpressionTemplates> >::tinyness_before;
template <boost::multiprecision::expression_template_option ExpressionTemplates>
BOOST_CONSTEXPR_OR_CONST float_round_style numeric_limits<boost::multiprecision::number<boost::multiprecision::mpfr_float_backend<0>, ExpressionTemplates> >::round_style;

#endif
} // namespace std
#endif
