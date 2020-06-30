//  (C) Copyright John Maddock 2005.
//  (C) Copyright Henry S. Warren 2005.
//  Use, modification and distribution are subject to the
//  Boost Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_TR1_RANDOM_HPP_INCLUDED
#  define BOOST_TR1_RANDOM_HPP_INCLUDED
#  include <boost/tr1/detail/config.hpp>

#ifdef BOOST_HAS_TR1_RANDOM
#  if defined(BOOST_HAS_INCLUDE_NEXT) && !defined(BOOST_TR1_DISABLE_INCLUDE_NEXT)
#     include_next BOOST_TR1_HEADER(random)
#  else
#     include <boost/tr1/detail/config_all.hpp>
#     include BOOST_TR1_STD_HEADER(BOOST_TR1_PATH(random))
#  endif
#else
// Boost.Random:
#include <boost/random.hpp>
#ifndef __SUNPRO_CC
    // Sunpros linker complains if we so much as include this...
#   include <boost/nondet_random.hpp>
#endif
#include <boost/tr1/detail/functor2iterator.hpp>
#include <boost/type_traits/is_fundamental.hpp>
#include <boost/type_traits/is_same.hpp>

namespace std { namespace tr1{

using ::boost::variate_generator;

template<class UIntType, UIntType a, UIntType c, UIntType m>
class linear_congruential
{
private:
   typedef ::boost::random::linear_congruential<UIntType, a, c, m, 0> impl_type;
public:
   // types
   typedef UIntType result_type;
   // parameter values
   BOOST_STATIC_CONSTANT(UIntType, multiplier = a);
   BOOST_STATIC_CONSTANT(UIntType, increment = c);
   BOOST_STATIC_CONSTANT(UIntType, modulus = m);
   // constructors and member function
   explicit linear_congruential(unsigned long x0 = 1)
      : m_gen(x0){}
   linear_congruential(const linear_congruential& that)
      : m_gen(that.m_gen){}
   template<class Gen> linear_congruential(Gen& g)
   {
      init1(g, ::boost::is_same<Gen,linear_congruential>());
   }
   void seed(unsigned long x0 = 1)
   { m_gen.seed(x0); }
   template<class Gen> void seed(Gen& g)
   { 
      init2(g, ::boost::is_fundamental<Gen>());
   }
   result_type min BOOST_PREVENT_MACRO_SUBSTITUTION() const
   { return (m_gen.min)(); }
   result_type max BOOST_PREVENT_MACRO_SUBSTITUTION() const
   { return (m_gen.max)(); }
   result_type operator()()
   {
      return m_gen(); 
   }
   bool operator==(const linear_congruential& that)const
   { return m_gen == that.m_gen; }
   bool operator!=(const linear_congruential& that)const
   { return m_gen != that.m_gen; }

#if !defined(BOOST_NO_MEMBER_TEMPLATE_FRIENDS) && !BOOST_WORKAROUND(__BORLANDC__, BOOST_TESTED_AT(0x551))
  template<class CharT, class Traits>
  friend std::basic_ostream<CharT,Traits>&
  operator<<(std::basic_ostream<CharT,Traits>& os,
             const linear_congruential& lcg)
  {
    return os << lcg.m_gen; 
  }

  template<class CharT, class Traits>
  friend std::basic_istream<CharT,Traits>&
  operator>>(std::basic_istream<CharT,Traits>& is,
             linear_congruential& lcg)
  {
    return is >> lcg.m_gen;
  }
#endif

private:
   template <class Gen>
   void init1(Gen& g, const ::boost::true_type&)
   {
      m_gen = g.m_gen;
   }
   template <class Gen>
   void init1(Gen& g, const ::boost::false_type&)
   {
      init2(g, ::boost::is_fundamental<Gen>());
   }
   template <class Gen>
   void init2(Gen& g, const ::boost::true_type&)
   {
      m_gen.seed(static_cast<unsigned long>(g));
   }
   template <class Gen>
   void init2(Gen& g, const ::boost::false_type&)
   {
      //typedef typename Gen::result_type gen_rt;
      boost::tr1_details::functor2iterator<Gen, unsigned long> f1(g), f2;
      m_gen.seed(f1, f2);
   }
   impl_type m_gen;
};

template<class UIntType, int w, int n, int m, int r,
UIntType a, int u, int s, UIntType b, int t, UIntType c, int l>
class mersenne_twister
{
   typedef ::boost::random::mersenne_twister
      <UIntType, w, n, m, r, a, u, s, b, t, c, l, 0> imp_type;
public:
   // types
   typedef UIntType result_type;
   // parameter values
   BOOST_STATIC_CONSTANT(int, word_size = w);
   BOOST_STATIC_CONSTANT(int, state_size = n);
   BOOST_STATIC_CONSTANT(int, shift_size = m);
   BOOST_STATIC_CONSTANT(int, mask_bits = r);
   BOOST_STATIC_CONSTANT(UIntType, parameter_a = a);
   BOOST_STATIC_CONSTANT(int, output_u = u);
   BOOST_STATIC_CONSTANT(int, output_s = s);
   BOOST_STATIC_CONSTANT(UIntType, output_b = b);
   BOOST_STATIC_CONSTANT(int, output_t = t);
   BOOST_STATIC_CONSTANT(UIntType, output_c = c);
   BOOST_STATIC_CONSTANT(int, output_l = l);
   // constructors and member function
   mersenne_twister(){}
   explicit mersenne_twister(unsigned long value)
      : m_gen(value == 0 ? 5489UL : value){}
   template<class Gen> mersenne_twister(Gen& g)
   {
      init1(g, ::boost::is_same<mersenne_twister,Gen>());
   }
   void seed()
   { m_gen.seed(); }
   void seed(unsigned long value)
   { m_gen.seed(value == 0 ? 5489UL : value); }
   template<class Gen> void seed(Gen& g)
   { init2(g, ::boost::is_fundamental<Gen>()); }
   result_type min BOOST_PREVENT_MACRO_SUBSTITUTION() const
   { return (m_gen.min)(); }
   result_type max BOOST_PREVENT_MACRO_SUBSTITUTION() const
   { return (m_gen.max)(); }
   result_type operator()()
   { return m_gen(); }
   bool operator==(const mersenne_twister& that)const
   { return m_gen == that.m_gen; }
   bool operator!=(const mersenne_twister& that)const
   { return m_gen != that.m_gen; }

#if !defined(BOOST_NO_MEMBER_TEMPLATE_FRIENDS) && !BOOST_WORKAROUND(__BORLANDC__, BOOST_TESTED_AT(0x551))
   template<class CharT, class Traits>
   friend std::basic_ostream<CharT,Traits>&
   operator<<(std::basic_ostream<CharT,Traits>& os,
            const mersenne_twister& lcg)
   {
      return os << lcg.m_gen;
   }

   template<class CharT, class Traits>
   friend std::basic_istream<CharT,Traits>&
   operator>>(std::basic_istream<CharT,Traits>& is,
            mersenne_twister& lcg)
   {
      return is >> lcg.m_gen;
   }
#endif
private:
   template <class Gen>
   void init1(Gen& g, const ::boost::true_type&)
   {
      m_gen = g.m_gen;
   }
   template <class Gen>
   void init1(Gen& g, const ::boost::false_type&)
   {
      init2(g, ::boost::is_fundamental<Gen>());
   }
   template <class Gen>
   void init2(Gen& g, const ::boost::true_type&)
   {
      m_gen.seed(static_cast<unsigned long>(g == 0 ? 4357UL : g));
   }
   template <class Gen>
   void init2(Gen& g, const ::boost::false_type&)
   {
      m_gen.seed(g);
   }
   imp_type m_gen;
};

template<class IntType, IntType m, int s, int r>
class subtract_with_carry
{
public:
   // types
   typedef IntType result_type;
   // parameter values
   BOOST_STATIC_CONSTANT(IntType, modulus = m);
   BOOST_STATIC_CONSTANT(int, long_lag = r);
   BOOST_STATIC_CONSTANT(int, short_lag = s);

   // constructors and member function
   subtract_with_carry(){}
   explicit subtract_with_carry(unsigned long value)
      : m_gen(value == 0 ? 19780503UL : value){}
   template<class Gen> subtract_with_carry(Gen& g)
   { init1(g, ::boost::is_same<Gen, subtract_with_carry<IntType, m, s, r> >()); }
   void seed(unsigned long value = 19780503ul)
   { m_gen.seed(value == 0 ? 19780503UL : value); }
   template<class Gen> void seed(Gen& g)
   { init2(g, ::boost::is_fundamental<Gen>()); }
   result_type min BOOST_PREVENT_MACRO_SUBSTITUTION() const
   { return (m_gen.min)(); }
   result_type max BOOST_PREVENT_MACRO_SUBSTITUTION() const
   { return (m_gen.max)(); }
   result_type operator()()
   { return m_gen(); }
   bool operator==(const subtract_with_carry& that)const
   { return m_gen == that.m_gen; }
   bool operator!=(const subtract_with_carry& that)const
   { return m_gen != that.m_gen; }

#if !defined(BOOST_NO_MEMBER_TEMPLATE_FRIENDS) && !BOOST_WORKAROUND(__BORLANDC__, BOOST_TESTED_AT(0x551))
   template<class CharT, class Traits>
   friend std::basic_ostream<CharT,Traits>&
   operator<<(std::basic_ostream<CharT,Traits>& os,
            const subtract_with_carry& lcg)
   {
      return os << lcg.m_gen;
   }

   template<class CharT, class Traits>
   friend std::basic_istream<CharT,Traits>&
   operator>>(std::basic_istream<CharT,Traits>& is,
            subtract_with_carry& lcg)
   {
      return is >> lcg.m_gen;
   }
#endif
private:
   template <class Gen>
   void init1(Gen& g, const ::boost::true_type&)
   {
      m_gen = g.m_gen;
   }
   template <class Gen>
   void init1(Gen& g, const ::boost::false_type&)
   {
      init2(g, ::boost::is_fundamental<Gen>());
   }
   template <class Gen>
   void init2(Gen& g, const ::boost::true_type&)
   {
      m_gen.seed(static_cast<unsigned long>(g == 0 ? 19780503UL : g));
   }
   template <class Gen>
   void init2(Gen& g, const ::boost::false_type&)
   {
      m_gen.seed(g);
   }
   ::boost::random::subtract_with_carry<IntType, m, s, r, 0> m_gen;
};

template<class RealType, int w, int s, int r>
class subtract_with_carry_01
{
public:
   // types
   typedef RealType result_type;
   // parameter values
   BOOST_STATIC_CONSTANT(int, word_size = w);
   BOOST_STATIC_CONSTANT(int, long_lag = r);
   BOOST_STATIC_CONSTANT(int, short_lag = s);

   // constructors and member function
   subtract_with_carry_01(){}
   explicit subtract_with_carry_01(unsigned long value)
      : m_gen(value == 0 ? 19780503UL : value){}
   template<class Gen> subtract_with_carry_01(Gen& g)
   { init1(g, ::boost::is_same<Gen, subtract_with_carry_01<RealType, w, s, r> >()); }
   void seed(unsigned long value = 19780503UL)
   { m_gen.seed(value == 0 ? 19780503UL : value); }
   template<class Gen> void seed(Gen& g)
   { init2(g, ::boost::is_fundamental<Gen>()); }
   result_type min BOOST_PREVENT_MACRO_SUBSTITUTION() const
   { return (m_gen.min)(); }
   result_type max BOOST_PREVENT_MACRO_SUBSTITUTION() const
   { return (m_gen.max)(); }
   result_type operator()()
   { return m_gen(); }
   bool operator==(const subtract_with_carry_01& that)const
   { return m_gen == that.m_gen; }
   bool operator!=(const subtract_with_carry_01& that)const
   { return m_gen != that.m_gen; }

#if !defined(BOOST_NO_MEMBER_TEMPLATE_FRIENDS) && !BOOST_WORKAROUND(__BORLANDC__, BOOST_TESTED_AT(0x551))
   template<class CharT, class Traits>
   friend std::basic_ostream<CharT,Traits>&
   operator<<(std::basic_ostream<CharT,Traits>& os,
            const subtract_with_carry_01& lcg)
   {
      return os << lcg.m_gen;
   }

   template<class CharT, class Traits>
   friend std::basic_istream<CharT,Traits>&
   operator>>(std::basic_istream<CharT,Traits>& is,
            subtract_with_carry_01& lcg)
   {
      return is >> lcg.m_gen;
   }
#endif
private:
   template <class Gen>
   void init1(Gen& g, const ::boost::true_type&)
   {
      m_gen = g.m_gen;
   }
   template <class Gen>
   void init1(Gen& g, const ::boost::false_type&)
   {
      init2(g, ::boost::is_fundamental<Gen>());
   }
   template <class Gen>
   void init2(Gen& g, const ::boost::true_type&)
   {
      m_gen.seed(static_cast<unsigned long>(g == 0 ? 19780503UL : g));
   }
   template <class Gen>
   void init2(Gen& g, const ::boost::false_type&)
   {
      //typedef typename Gen::result_type gen_rt;
      boost::tr1_details::functor2iterator<Gen, unsigned long> f1(g), f2;
      m_gen.seed(f1, f2);
   }
   ::boost::random::subtract_with_carry_01<RealType, w, s, r, 0> m_gen;
};

using ::boost::random::discard_block;

template<class UniformRandomNumberGenerator1, int s1, class UniformRandomNumberGenerator2, int s2>
class xor_combine
{
public:
   // types
   typedef UniformRandomNumberGenerator1 base1_type;
   typedef UniformRandomNumberGenerator2 base2_type;
   typedef unsigned long result_type;
   // parameter values
   BOOST_STATIC_CONSTANT(int, shift1 = s1);
   BOOST_STATIC_CONSTANT(int, shift2 = s2);
   // constructors and member function
   xor_combine(){ init_minmax(); }
   xor_combine(const base1_type & rng1, const base2_type & rng2)
      : m_b1(rng1), m_b2(rng2) { init_minmax(); }
   xor_combine(unsigned long s)
      : m_b1(s), m_b2(s+1) { init_minmax(); }
   template<class Gen> xor_combine(Gen& g)
   { 
      init_minmax(); 
      init1(g, ::boost::is_same<Gen, xor_combine<UniformRandomNumberGenerator1, s1, UniformRandomNumberGenerator2, s2> >());
   }
   void seed()
   {
      m_b1.seed();
      m_b2.seed();
   }
   void seed(unsigned long s)
   {
      m_b1.seed(s);
      m_b2.seed(s+1);
   }
   template<class Gen> void seed(Gen& g)
   {
      init2(g, ::boost::is_fundamental<Gen>());
   }

   const base1_type& base1() const
   { return m_b1; }
   const base2_type& base2() const
   { return m_b2; }
   result_type min BOOST_PREVENT_MACRO_SUBSTITUTION() const
   { return m_min; }
   result_type max BOOST_PREVENT_MACRO_SUBSTITUTION() const
   { return m_max; }
   result_type operator()()
   { return (m_b1() << s1) ^ (m_b2() << s2); }

   bool operator == (const xor_combine& that)const
   { return (m_b1 == that.m_b1) && (m_b2 == that.m_b2); }
   bool operator != (const xor_combine& that)const
   { return !(*this == that); }

#if !defined(BOOST_NO_MEMBER_TEMPLATE_FRIENDS) && !BOOST_WORKAROUND(__BORLANDC__, BOOST_TESTED_AT(0x551))
   template<class CharT, class Traits>
   friend std::basic_ostream<CharT,Traits>&
   operator<<(std::basic_ostream<CharT,Traits>& os,
            const xor_combine& lcg)
   {
      return os << lcg.m_b1 << " " << lcg.m_b2;
   }

   template<class CharT, class Traits>
   friend std::basic_istream<CharT,Traits>&
   operator>>(std::basic_istream<CharT,Traits>& is,
            xor_combine& lcg)
   {
      return is >> lcg.m_b1 >> lcg.m_b2;
   }
#endif

private:
   void init_minmax();
   base1_type m_b1;
   base2_type m_b2;
   result_type m_min;
   result_type m_max;

   template <class Gen>
   void init1(Gen& g, const ::boost::true_type&)
   {
      m_b1 = g.m_b1;
      m_b2 = g.m_b2;
   }
   template <class Gen>
   void init1(Gen& g, const ::boost::false_type&)
   {
      init2(g, ::boost::is_fundamental<Gen>());
   }
   template <class Gen>
   void init2(Gen& g, const ::boost::true_type&)
   {
      m_b1.seed(static_cast<unsigned long>(g));
      m_b2.seed(static_cast<unsigned long>(g));
   }
   template <class Gen>
   void init2(Gen& g, const ::boost::false_type&)
   {
      m_b1.seed(g);
      m_b2.seed(g);
   }
};

template<class UniformRandomNumberGenerator1, int s1, class UniformRandomNumberGenerator2, int s2>
void xor_combine<UniformRandomNumberGenerator1, s1, UniformRandomNumberGenerator2, s2>::init_minmax()
{
   //
   // The following code is based on that given in "Hacker's Delight"
   // by Henry S. Warren, (Addison-Wesley, 2003), and at 
   // http://www.hackersdelight.org/index.htm.
   // Used here by permission.
   //
   // calculation of minimum value:
   //
   result_type a = (m_b1.min)() << s1;
   result_type b = (m_b1.max)() << s1;
   result_type c = (m_b2.min)() << s2;
   result_type d = (m_b2.max)() << s2;
   result_type m, temp;

   m = 0x1uL << ((sizeof(result_type) * CHAR_BIT) - 1);
   while (m != 0) {
      if (~a & c & m) {
         temp = (a | m) & (static_cast<result_type>(0u) - m);
         if (temp <= b) a = temp;
      }
      else if (a & ~c & m) {
         temp = (c | m) & (static_cast<result_type>(0u) - m);
         if (temp <= d) c = temp;
      }
      m >>= 1;
   }
   m_min = a ^ c;

   //
   // calculation of maximum value:
   //
   if((((std::numeric_limits<result_type>::max)() >> s1) < (m_b1.max)())
      || ((((std::numeric_limits<result_type>::max)()) >> s2) < (m_b2.max)()))
   {
      m_max = (std::numeric_limits<result_type>::max)();
      return;
   }
   a = (m_b1.min)() << s1;
   b = (m_b1.max)() << s1;
   c = (m_b2.min)() << s2;
   d = (m_b2.max)() << s2;

   m = 0x1uL << ((sizeof(result_type) * CHAR_BIT) - 1);

   while (m != 0) {
      if (b & d & m) {
         temp = (b - m) | (m - 1);
         if (temp >= a) b = temp;
         else {
            temp = (d - m) | (m - 1);
            if (temp >= c) d = temp;
         }
      }
      m = m >> 1;
   }
   m_max = b ^ d;
}

typedef linear_congruential< ::boost::int32_t, 16807, 0, 2147483647> minstd_rand0;
typedef linear_congruential< ::boost::int32_t, 48271, 0, 2147483647> minstd_rand;
typedef mersenne_twister< ::boost::uint32_t, 32,624,397,31,0x9908b0df,11,7,0x9d2c5680,15,0xefc60000,18> mt19937;
typedef subtract_with_carry_01<float, 24, 10, 24> ranlux_base_01;
typedef subtract_with_carry_01<double, 48, 10, 24> ranlux64_base_01;
typedef discard_block<subtract_with_carry< ::boost::int32_t, (1<<24), 10, 24>, 223, 24> ranlux3;
typedef discard_block<subtract_with_carry< ::boost::int32_t, (1<<24), 10, 24>, 389, 24> ranlux4;
typedef discard_block<subtract_with_carry_01<float, 24, 10, 24>, 223, 24> ranlux3_01;
typedef discard_block<subtract_with_carry_01<float, 24, 10, 24>, 389, 24> ranlux4_01;

#ifndef __SUNPRO_CC
using ::boost::random_device;
#endif
using ::boost::uniform_int;

class bernoulli_distribution
{
public:
   // types
   typedef int input_type;
   typedef bool result_type;
   // constructors and member function
   explicit bernoulli_distribution(double p = 0.5)
      : m_dist(p){}
   double p() const
   { return m_dist.p(); }
   void reset()
   { m_dist.reset(); }
   template<class UniformRandomNumberGenerator>
   result_type operator()(UniformRandomNumberGenerator& urng)
   {
      return m_dist(urng);
   }
#if !defined(BOOST_NO_MEMBER_TEMPLATE_FRIENDS) && !BOOST_WORKAROUND(__BORLANDC__, BOOST_TESTED_AT(0x551))
   template<class CharT, class Traits>
   friend std::basic_ostream<CharT,Traits>&
   operator<<(std::basic_ostream<CharT,Traits>& os,
            const bernoulli_distribution& lcg)
   {
      return os << lcg.m_dist;
   }

   template<class CharT, class Traits>
   friend std::basic_istream<CharT,Traits>&
   operator>>(std::basic_istream<CharT,Traits>& is,
            bernoulli_distribution& lcg)
   {
      return is >> lcg.m_dist;
   }
#endif

private:
   ::boost::bernoulli_distribution<double> m_dist;
};
//using ::boost::bernoulli_distribution;
using ::boost::geometric_distribution;
using ::boost::poisson_distribution;
using ::boost::binomial_distribution;
using ::boost::uniform_real;
using ::boost::exponential_distribution;
using ::boost::normal_distribution;
using ::boost::gamma_distribution;

} }

#endif

#endif

