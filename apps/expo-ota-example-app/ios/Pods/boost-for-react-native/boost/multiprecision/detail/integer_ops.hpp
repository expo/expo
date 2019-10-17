///////////////////////////////////////////////////////////////
//  Copyright 2012 John Maddock. Distributed under the Boost
//  Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_

#ifndef BOOST_MP_INT_FUNC_HPP
#define BOOST_MP_INT_FUNC_HPP

#include <boost/multiprecision/number.hpp>

namespace boost{ namespace multiprecision{

namespace default_ops
{

template <class Backend>
inline void eval_qr(const Backend& x, const Backend& y, Backend& q, Backend& r)
{
   eval_divide(q, x, y);
   eval_modulus(r, x, y);
}

template <class Backend, class Integer>
inline Integer eval_integer_modulus(const Backend& x, Integer val)
{
   BOOST_MP_USING_ABS
   using default_ops::eval_modulus;
   using default_ops::eval_convert_to;
   typedef typename boost::multiprecision::detail::canonical<Integer, Backend>::type int_type;
   Backend t;
   eval_modulus(t, x, static_cast<int_type>(val));
   Integer result;
   eval_convert_to(&result, t);
   return abs(result);
}

#ifdef BOOST_MSVC
#pragma warning(push)
#pragma warning(disable:4127)
#endif

template <class B>
inline void eval_gcd(B& result, const B& a, const B& b)
{
   using default_ops::eval_lsb;
   using default_ops::eval_is_zero;
   using default_ops::eval_get_sign;

   int shift;

   B u(a), v(b);

   int s = eval_get_sign(u);

   /* GCD(0,x) := x */
   if(s < 0)
   {
      u.negate();
   }
   else if(s == 0)
   {
      result = v;
      return;
   }
   s = eval_get_sign(v);
   if(s < 0)
   {
      v.negate();
   }
   else if(s == 0)
   {
      result = u;
      return;
   }

   /* Let shift := lg K, where K is the greatest power of 2
   dividing both u and v. */

   unsigned us = eval_lsb(u);
   unsigned vs = eval_lsb(v);
   shift = (std::min)(us, vs);
   eval_right_shift(u, us);
   eval_right_shift(v, vs);

   do 
   {
      /* Now u and v are both odd, so diff(u, v) is even.
      Let u = min(u, v), v = diff(u, v)/2. */
      s = u.compare(v);
      if(s > 0)
         u.swap(v);
      if(s == 0)
         break;
      eval_subtract(v, u);
      vs = eval_lsb(v);
      eval_right_shift(v, vs);
   } 
   while(true);

   result = u;
   eval_left_shift(result, shift);
}

#ifdef BOOST_MSVC
#pragma warning(pop)
#endif

template <class B>
inline void eval_lcm(B& result, const B& a, const B& b)
{
   typedef typename mpl::front<typename B::unsigned_types>::type ui_type;
   B t;
   eval_gcd(t, a, b);

   if(eval_is_zero(t))
   {
      result = static_cast<ui_type>(0);
   }
   else
   {
      eval_divide(result, a, t);
      eval_multiply(result, b);
   }
   if(eval_get_sign(result) < 0)
      result.negate();
}

}

template <class Backend, expression_template_option ExpressionTemplates>
inline typename enable_if_c<number_category<Backend>::value == number_kind_integer>::type 
   divide_qr(const number<Backend, ExpressionTemplates>& x, const number<Backend, ExpressionTemplates>& y,
   number<Backend, ExpressionTemplates>& q, number<Backend, ExpressionTemplates>& r)
{
   using default_ops::eval_qr;
   eval_qr(x.backend(), y.backend(), q.backend(), r.backend());
}

template <class Backend, expression_template_option ExpressionTemplates, class tag, class A1, class A2, class A3, class A4>
inline typename enable_if_c<number_category<Backend>::value == number_kind_integer>::type 
   divide_qr(const number<Backend, ExpressionTemplates>& x, const multiprecision::detail::expression<tag, A1, A2, A3, A4>& y,
   number<Backend, ExpressionTemplates>& q, number<Backend, ExpressionTemplates>& r)
{
   divide_qr(x, number<Backend, ExpressionTemplates>(y), q, r);
}

template <class tag, class A1, class A2, class A3, class A4, class Backend, expression_template_option ExpressionTemplates>
inline typename enable_if_c<number_category<Backend>::value == number_kind_integer>::type 
   divide_qr(const multiprecision::detail::expression<tag, A1, A2, A3, A4>& x, const number<Backend, ExpressionTemplates>& y,
   number<Backend, ExpressionTemplates>& q, number<Backend, ExpressionTemplates>& r)
{
   divide_qr(number<Backend, ExpressionTemplates>(x), y, q, r);
}

template <class tag, class A1, class A2, class A3, class A4, class tagb, class A1b, class A2b, class A3b, class A4b, class Backend, expression_template_option ExpressionTemplates>
inline typename enable_if_c<number_category<Backend>::value == number_kind_integer>::type 
   divide_qr(const multiprecision::detail::expression<tag, A1, A2, A3, A4>& x, const multiprecision::detail::expression<tagb, A1b, A2b, A3b, A4b>& y,
   number<Backend, ExpressionTemplates>& q, number<Backend, ExpressionTemplates>& r)
{
   divide_qr(number<Backend, ExpressionTemplates>(x), number<Backend, ExpressionTemplates>(y), q, r);
}

template <class Backend, expression_template_option ExpressionTemplates, class Integer>
inline typename enable_if<mpl::and_<is_integral<Integer>, mpl::bool_<number_category<Backend>::value == number_kind_integer> >, Integer>::type 
   integer_modulus(const number<Backend, ExpressionTemplates>& x, Integer val)
{
   using default_ops::eval_integer_modulus;
   return eval_integer_modulus(x.backend(), val);
}

template <class tag, class A1, class A2, class A3, class A4, class Integer>
inline typename enable_if<mpl::and_<is_integral<Integer>, mpl::bool_<number_category<typename multiprecision::detail::expression<tag, A1, A2, A3, A4>::result_type>::value == number_kind_integer> >, Integer>::type 
   integer_modulus(const multiprecision::detail::expression<tag, A1, A2, A3, A4>& x, Integer val)
{
   typedef typename multiprecision::detail::expression<tag, A1, A2, A3, A4>::result_type result_type;
   return integer_modulus(result_type(x), val);
}

template <class Backend, expression_template_option ExpressionTemplates>
inline typename enable_if_c<number_category<Backend>::value == number_kind_integer, unsigned>::type 
   lsb(const number<Backend, ExpressionTemplates>& x)
{
   using default_ops::eval_lsb;
   return eval_lsb(x.backend());
}

template <class tag, class A1, class A2, class A3, class A4>
inline typename enable_if_c<number_category<typename multiprecision::detail::expression<tag, A1, A2, A3, A4>::result_type>::value == number_kind_integer, unsigned>::type 
   lsb(const multiprecision::detail::expression<tag, A1, A2, A3, A4>& x)
{
   typedef typename multiprecision::detail::expression<tag, A1, A2, A3, A4>::result_type number_type;
   number_type n(x);
   using default_ops::eval_lsb;
   return eval_lsb(n.backend());
}

template <class Backend, expression_template_option ExpressionTemplates>
inline typename enable_if_c<number_category<Backend>::value == number_kind_integer, unsigned>::type 
   msb(const number<Backend, ExpressionTemplates>& x)
{
   using default_ops::eval_msb;
   return eval_msb(x.backend());
}

template <class tag, class A1, class A2, class A3, class A4>
inline typename enable_if_c<number_category<typename multiprecision::detail::expression<tag, A1, A2, A3, A4>::result_type>::value == number_kind_integer, unsigned>::type 
   msb(const multiprecision::detail::expression<tag, A1, A2, A3, A4>& x)
{
   typedef typename multiprecision::detail::expression<tag, A1, A2, A3, A4>::result_type number_type;
   number_type n(x);
   using default_ops::eval_msb;
   return eval_msb(n.backend());
}

template <class Backend, expression_template_option ExpressionTemplates>
inline typename enable_if_c<number_category<Backend>::value == number_kind_integer, bool>::type 
   bit_test(const number<Backend, ExpressionTemplates>& x, unsigned index)
{
   using default_ops::eval_bit_test;
   return eval_bit_test(x.backend(), index);
}

template <class tag, class A1, class A2, class A3, class A4>
inline typename enable_if_c<number_category<typename multiprecision::detail::expression<tag, A1, A2, A3, A4>::result_type>::value == number_kind_integer, bool>::type 
   bit_test(const multiprecision::detail::expression<tag, A1, A2, A3, A4>& x, unsigned index)
{
   typedef typename multiprecision::detail::expression<tag, A1, A2, A3, A4>::result_type number_type;
   number_type n(x);
   using default_ops::eval_bit_test;
   return eval_bit_test(n.backend(), index);
}

template <class Backend, expression_template_option ExpressionTemplates>
inline typename enable_if_c<number_category<Backend>::value == number_kind_integer, number<Backend, ExpressionTemplates>&>::type 
   bit_set(number<Backend, ExpressionTemplates>& x, unsigned index)
{
   using default_ops::eval_bit_set;
   eval_bit_set(x.backend(), index);
   return x;
}

template <class Backend, expression_template_option ExpressionTemplates>
inline typename enable_if_c<number_category<Backend>::value == number_kind_integer, number<Backend, ExpressionTemplates>&>::type 
   bit_unset(number<Backend, ExpressionTemplates>& x, unsigned index)
{
   using default_ops::eval_bit_unset;
   eval_bit_unset(x.backend(), index);
   return x;
}

template <class Backend, expression_template_option ExpressionTemplates>
inline typename enable_if_c<number_category<Backend>::value == number_kind_integer, number<Backend, ExpressionTemplates>&>::type 
   bit_flip(number<Backend, ExpressionTemplates>& x, unsigned index)
{
   using default_ops::eval_bit_flip;
   eval_bit_flip(x.backend(), index);
   return x;
}

namespace default_ops{

//
// Within powm, we need a type with twice as many digits as the argument type, define
// a traits class to obtain that type:
//
template <class Backend>
struct double_precision_type
{
   typedef Backend type;
};

//
// If the exponent is a signed integer type, then we need to
// check the value is positive:
//
template <class Backend>
inline void check_sign_of_backend(const Backend& v, const mpl::true_)
{
   if(eval_get_sign(v) < 0)
   {
      BOOST_THROW_EXCEPTION(std::runtime_error("powm requires a positive exponent."));
   }
}
template <class Backend>
inline void check_sign_of_backend(const Backend&, const mpl::false_){}
//
// Calculate (a^p)%c:
//
template <class Backend>
void eval_powm(Backend& result, const Backend& a, const Backend& p, const Backend& c)
{
   using default_ops::eval_bit_test;
   using default_ops::eval_get_sign;
   using default_ops::eval_multiply;
   using default_ops::eval_modulus;
   using default_ops::eval_right_shift;

   typedef typename double_precision_type<Backend>::type double_type;
   typedef typename boost::multiprecision::detail::canonical<unsigned char, double_type>::type ui_type;

   check_sign_of_backend(p, mpl::bool_<std::numeric_limits<number<Backend> >::is_signed>());
   
   double_type x, y(a), b(p), t;
   x = ui_type(1u);

   while(eval_get_sign(b) > 0)
   {
      if(eval_bit_test(b, 0))
      {
         eval_multiply(t, x, y);
         eval_modulus(x, t, c);
      }
      eval_multiply(t, y, y);
      eval_modulus(y, t, c);
      eval_right_shift(b, ui_type(1));
   }
   Backend x2(x);
   eval_modulus(result, x2, c);
}

template <class Backend, class Integer>
void eval_powm(Backend& result, const Backend& a, const Backend& p, Integer c)
{
   typedef typename double_precision_type<Backend>::type double_type;
   typedef typename boost::multiprecision::detail::canonical<unsigned char, double_type>::type ui_type;
   typedef typename boost::multiprecision::detail::canonical<Integer, double_type>::type i1_type;
   typedef typename boost::multiprecision::detail::canonical<Integer, Backend>::type i2_type;

   using default_ops::eval_bit_test;
   using default_ops::eval_get_sign;
   using default_ops::eval_multiply;
   using default_ops::eval_modulus;
   using default_ops::eval_right_shift;

   check_sign_of_backend(p, mpl::bool_<std::numeric_limits<number<Backend> >::is_signed>());

   if(eval_get_sign(p) < 0)
   {
      BOOST_THROW_EXCEPTION(std::runtime_error("powm requires a positive exponent."));
   }

   double_type x, y(a), b(p), t;
   x = ui_type(1u);

   while(eval_get_sign(b) > 0)
   {
      if(eval_bit_test(b, 0))
      {
         eval_multiply(t, x, y);
         eval_modulus(x, t, static_cast<i1_type>(c));
      }
      eval_multiply(t, y, y);
      eval_modulus(y, t, static_cast<i1_type>(c));
      eval_right_shift(b, ui_type(1));
   }
   Backend x2(x);
   eval_modulus(result, x2, static_cast<i2_type>(c));
}

template <class Backend, class Integer>
typename enable_if<is_unsigned<Integer> >::type eval_powm(Backend& result, const Backend& a, Integer b, const Backend& c)
{
   typedef typename double_precision_type<Backend>::type double_type;
   typedef typename boost::multiprecision::detail::canonical<unsigned char, double_type>::type ui_type;

   using default_ops::eval_bit_test;
   using default_ops::eval_get_sign;
   using default_ops::eval_multiply;
   using default_ops::eval_modulus;
   using default_ops::eval_right_shift;

   double_type x, y(a), t;
   x = ui_type(1u);

   while(b > 0)
   {
      if(b & 1)
      {
         eval_multiply(t, x, y);
         eval_modulus(x, t, c);
      }
      eval_multiply(t, y, y);
      eval_modulus(y, t, c);
      b >>= 1;
   }
   Backend x2(x);
   eval_modulus(result, x2, c);
}

template <class Backend, class Integer>
typename enable_if<is_signed<Integer> >::type eval_powm(Backend& result, const Backend& a, Integer b, const Backend& c)
{
   if(b < 0)
   {
      BOOST_THROW_EXCEPTION(std::runtime_error("powm requires a positive exponent."));
   }
   eval_powm(result, a, static_cast<typename make_unsigned<Integer>::type>(b), c);
}

template <class Backend, class Integer1, class Integer2>
typename enable_if<is_unsigned<Integer1> >::type eval_powm(Backend& result, const Backend& a, Integer1 b, Integer2 c)
{
   typedef typename double_precision_type<Backend>::type double_type;
   typedef typename boost::multiprecision::detail::canonical<unsigned char, double_type>::type ui_type;
   typedef typename boost::multiprecision::detail::canonical<Integer1, double_type>::type i1_type;
   typedef typename boost::multiprecision::detail::canonical<Integer2, Backend>::type i2_type;

   using default_ops::eval_bit_test;
   using default_ops::eval_get_sign;
   using default_ops::eval_multiply;
   using default_ops::eval_modulus;
   using default_ops::eval_right_shift;

   double_type x, y(a), t;
   x = ui_type(1u);

   while(b > 0)
   {
      if(b & 1)
      {
         eval_multiply(t, x, y);
         eval_modulus(x, t, static_cast<i1_type>(c));
      }
      eval_multiply(t, y, y);
      eval_modulus(y, t, static_cast<i1_type>(c));
      b >>= 1;
   }
   Backend x2(x);
   eval_modulus(result, x2, static_cast<i2_type>(c));
}

template <class Backend, class Integer1, class Integer2>
typename enable_if<is_signed<Integer1> >::type eval_powm(Backend& result, const Backend& a, Integer1 b, Integer2 c)
{
   if(b < 0)
   {
      BOOST_THROW_EXCEPTION(std::runtime_error("powm requires a positive exponent."));
   }
   eval_powm(result, a, static_cast<typename make_unsigned<Integer1>::type>(b), c);
}

struct powm_func
{
   template <class T, class U, class V>
   void operator()(T& result, const T& b, const U& p, const V& m)const
   {
      eval_powm(result, b, p, m);
   }
};

}

template <class T, class U, class V>
inline typename enable_if<
   mpl::and_<
      mpl::bool_<number_category<T>::value == number_kind_integer>, 
      mpl::or_<
         is_number<T>,
         is_number_expression<T>
      >,
      mpl::or_<
         is_number<U>,
         is_number_expression<U>,
         is_integral<U>
      >,
      mpl::or_<
         is_number<V>,
         is_number_expression<V>,
         is_integral<V>
      >
   >,
   typename mpl::if_<
      is_no_et_number<T>, 
      T,
      typename mpl::if_<
         is_no_et_number<U>,
         U,
         typename mpl::if_<
            is_no_et_number<V>,
            V,
            detail::expression<detail::function, default_ops::powm_func, T, U, V> >::type
         >::type
      >::type
   >::type
   powm(const T& b, const U& p, const V& mod)
{
   return detail::expression<detail::function, default_ops::powm_func, T, U, V>(
      default_ops::powm_func(), b, p, mod);
}

}} //namespaces

#endif


