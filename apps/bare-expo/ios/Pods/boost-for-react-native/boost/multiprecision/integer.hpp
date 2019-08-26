///////////////////////////////////////////////////////////////
//  Copyright 2012 John Maddock. Distributed under the Boost
//  Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_

#ifndef BOOST_MP_INTEGER_HPP
#define BOOST_MP_INTEGER_HPP

#include <boost/multiprecision/cpp_int.hpp>
#include <boost/multiprecision/detail/bitscan.hpp>

namespace boost{
namespace multiprecision{

template <class Integer, class I2>
typename enable_if_c<is_integral<Integer>::value && is_integral<I2>::value, Integer&>::type
   multiply(Integer& result, const I2& a, const I2& b)
{
   return result = static_cast<Integer>(a) * static_cast<Integer>(b);
}
template <class Integer, class I2>
typename enable_if_c<is_integral<Integer>::value && is_integral<I2>::value, Integer&>::type
   add(Integer& result, const I2& a, const I2& b)
{
   return result = static_cast<Integer>(a) + static_cast<Integer>(b);
}
template <class Integer, class I2>
typename enable_if_c<is_integral<Integer>::value && is_integral<I2>::value, Integer&>::type
   subtract(Integer& result, const I2& a, const I2& b)
{
   return result = static_cast<Integer>(a) - static_cast<Integer>(b);
}

template <class Integer>
typename enable_if_c<is_integral<Integer>::value>::type divide_qr(const Integer& x, const Integer& y, Integer& q, Integer& r)
{
   q = x / y;
   r = x % y;
}

template <class I1, class I2>
typename enable_if_c<is_integral<I1>::value && is_integral<I2>::value, I2>::type integer_modulus(const I1& x, I2 val)
{
   return static_cast<I2>(x % val);
}

namespace detail{
//
// Figure out the kind of integer that has twice as many bits as some builtin
// integer type I.  Use a native type if we can (including types which may not
// be recognised by boost::int_t because they're larger than boost::long_long_type),
// otherwise synthesize a cpp_int to do the job.
//
template <class I>
struct double_integer
{
   static const unsigned int_t_digits =
      2 * sizeof(I) <= sizeof(boost::long_long_type) ? std::numeric_limits<I>::digits * 2 : 1;

   typedef typename mpl::if_c<
      2 * sizeof(I) <= sizeof(boost::long_long_type),
      typename mpl::if_c<
         is_signed<I>::value,
         typename boost::int_t<int_t_digits>::least,
         typename boost::uint_t<int_t_digits>::least
      >::type,
      typename mpl::if_c<
         2 * sizeof(I) <= sizeof(double_limb_type),
         typename mpl::if_c<
            is_signed<I>::value,
            signed_double_limb_type,
            double_limb_type
         >::type,
         number<cpp_int_backend<sizeof(I)*CHAR_BIT*2, sizeof(I)*CHAR_BIT*2, (is_signed<I>::value ? signed_magnitude : unsigned_magnitude), unchecked, void> >
      >::type
   >::type type;
};

}

template <class I1, class I2, class I3>
typename enable_if_c<is_integral<I1>::value && is_unsigned<I2>::value && is_integral<I3>::value, I1>::type
   powm(const I1& a, I2 b, I3 c)
{
   typedef typename detail::double_integer<I1>::type double_type;

   I1 x(1), y(a);
   double_type result;

   while(b > 0)
   {
      if(b & 1)
      {
         multiply(result, x, y);
         x = integer_modulus(result, c);
      }
      multiply(result, y, y);
      y = integer_modulus(result, c);
      b >>= 1;
   }
   return x % c;
}

template <class I1, class I2, class I3>
inline typename enable_if_c<is_integral<I1>::value && is_signed<I2>::value && is_integral<I3>::value, I1>::type
   powm(const I1& a, I2 b, I3 c)
{
   if(b < 0)
   {
      BOOST_THROW_EXCEPTION(std::runtime_error("powm requires a positive exponent."));
   }
   return powm(a, static_cast<typename make_unsigned<I2>::type>(b), c);
}

template <class Integer>
typename enable_if_c<is_integral<Integer>::value, unsigned>::type lsb(const Integer& val)
{
   if(val <= 0)
   {
      if(val == 0)
      {
         BOOST_THROW_EXCEPTION(std::range_error("No bits were set in the operand."));
      }
      else
      {
         BOOST_THROW_EXCEPTION(std::range_error("Testing individual bits in negative values is not supported - results are undefined."));
      }
   }
   return detail::find_lsb(val);
}

template <class Integer>
typename enable_if_c<is_integral<Integer>::value, unsigned>::type msb(Integer val)
{
   if(val <= 0)
   {
      if(val == 0)
      {
         BOOST_THROW_EXCEPTION(std::range_error("No bits were set in the operand."));
      }
      else
      {
         BOOST_THROW_EXCEPTION(std::range_error("Testing individual bits in negative values is not supported - results are undefined."));
      }
   }
   return detail::find_msb(val);
}

template <class Integer>
typename enable_if_c<is_integral<Integer>::value, bool>::type bit_test(const Integer& val, unsigned index)
{
   Integer mask = 1;
   if(index >= sizeof(Integer) * CHAR_BIT)
      return 0;
   if(index)
      mask <<= index;
   return val & mask ? true : false;
}

template <class Integer>
typename enable_if_c<is_integral<Integer>::value, Integer&>::type bit_set(Integer& val, unsigned index)
{
   Integer mask = 1;
   if(index >= sizeof(Integer) * CHAR_BIT)
      return val;
   if(index)
      mask <<= index;
   val |= mask;
   return val;
}

template <class Integer>
typename enable_if_c<is_integral<Integer>::value, Integer&>::type bit_unset(Integer& val, unsigned index)
{
   Integer mask = 1;
   if(index >= sizeof(Integer) * CHAR_BIT)
      return val;
   if(index)
      mask <<= index;
   val &= ~mask;
   return val;
}

template <class Integer>
typename enable_if_c<is_integral<Integer>::value, Integer&>::type bit_flip(Integer& val, unsigned index)
{
   Integer mask = 1;
   if(index >= sizeof(Integer) * CHAR_BIT)
      return val;
   if(index)
      mask <<= index;
   val ^= mask;
   return val;
}

template <class Integer>
typename enable_if_c<is_integral<Integer>::value, Integer>::type sqrt(const Integer& x, Integer& r)
{
   //
   // This is slow bit-by-bit integer square root, see for example
   // http://en.wikipedia.org/wiki/Methods_of_computing_square_roots#Binary_numeral_system_.28base_2.29
   // There are better methods such as http://hal.inria.fr/docs/00/07/28/54/PDF/RR-3805.pdf
   // and http://hal.inria.fr/docs/00/07/21/13/PDF/RR-4475.pdf which should be implemented
   // at some point.
   //
   Integer s = 0;
   if(x == 0)
   {
      r = 0;
      return s;
   }
   int g = msb(x);
   if(g == 0)
   {
      r = 1;
      return s;
   }
   
   Integer t = 0;
   r = x;
   g /= 2;
   bit_set(s, g);
   bit_set(t, 2 * g);
   r = x - t;
   --g;
   do
   {
      t = s;
      t <<= g + 1;
      bit_set(t, 2 * g);
      if(t <= r)
      {
         bit_set(s, g);
         r -= t;
      }
      --g;
   }
   while(g >= 0);
   return s;
}

template <class Integer>
typename enable_if_c<is_integral<Integer>::value, Integer>::type sqrt(const Integer& x)
{
   Integer r;
   return sqrt(x, r);
}

}} // namespaces

#endif
