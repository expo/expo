///////////////////////////////////////////////////////////////
//  Copyright 2012 John Maddock. Distributed under the Boost
//  Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_

#ifndef BOOST_MATH_DEBUG_ADAPTER_HPP
#define BOOST_MATH_DEBUG_ADAPTER_HPP

#include <boost/multiprecision/traits/extract_exponent_type.hpp>
#include <boost/multiprecision/detail/integer_ops.hpp>

namespace boost{
namespace multiprecision{
namespace backends{

#ifdef BOOST_MSVC
#pragma warning(push)
#pragma warning(disable:4127) // conditional expression is constant
#endif
   
   template <class Backend>
struct debug_adaptor
{
   typedef typename Backend::signed_types              signed_types;
   typedef typename Backend::unsigned_types            unsigned_types;
   typedef typename Backend::float_types               float_types;
   typedef typename extract_exponent_type<
      Backend, number_category<Backend>::value>::type  exponent_type;

private:
   std::string debug_value;
   Backend m_value;
public:
   void update_view()
   {
#ifndef BOOST_NO_EXCEPTIONS
      try
      {
#endif
         debug_value = m_value.str(0, static_cast<std::ios_base::fmtflags>(0));
#ifndef BOOST_NO_EXCEPTIONS
      }
      catch(const std::exception& e)
      {
         debug_value = "String conversion failed with message: \"";
         debug_value += e.what();
         debug_value += "\"";
      }
#endif
   }
   debug_adaptor()
   {
      update_view();
   }
   debug_adaptor(const debug_adaptor& o) : debug_value(o.debug_value), m_value(o.m_value)
   {
   }
   debug_adaptor& operator = (const debug_adaptor& o)
   {
      debug_value = o.debug_value;
      m_value = o.m_value;
      return *this;
   }
   template <class T>
   debug_adaptor(const T& i, const typename enable_if_c<is_convertible<T, Backend>::value>::type* = 0)
      : m_value(i)
   {
      update_view();
   }
   template <class T>
   debug_adaptor(const T& i, const T& j)
      : m_value(i, j)
   {
      update_view();
   }
   template <class T>
   typename enable_if_c<is_arithmetic<T>::value || is_convertible<T, Backend>::value, debug_adaptor&>::type operator = (const T& i)
   {
      m_value = i;
      update_view();
      return *this;
   }
   debug_adaptor& operator = (const char* s)
   {
      m_value = s;
      update_view();
      return *this;
   }
   void swap(debug_adaptor& o)
   {
      std::swap(m_value, o.value());
      std::swap(debug_value, o.debug_value);
   }
   std::string str(std::streamsize digits, std::ios_base::fmtflags f)const
   {
      return m_value.str(digits, f);
   }
   void negate()
   {
      m_value.negate();
      update_view();
   }
   int compare(const debug_adaptor& o)const
   {
      return m_value.compare(o.value());
   }
   template <class T>
   int compare(const T& i)const
   {
      return m_value.compare(i);
   }
   Backend& value()
   {
      return m_value;
   }
   const Backend& value()const
   {
      return m_value;
   }
   template <class Archive>
   void serialize(Archive& ar, const unsigned int /*version*/)
   {
      ar & m_value;
      typedef typename Archive::is_loading tag;
      if(tag::value)
         update_view();
   }
   static unsigned default_precision() BOOST_NOEXCEPT
   {
      return Backend::default_precision();
   }
   static void default_precision(unsigned v) BOOST_NOEXCEPT
   {
      Backend::default_precision(v);
   }
   unsigned precision()const BOOST_NOEXCEPT
   {
      return value().precision();
   }
   void precision(unsigned digits10) BOOST_NOEXCEPT
   {
      value().precision(digits10);
   }
};

template <class Backend>
inline Backend const& unwrap_debug_type(debug_adaptor<Backend> const& val)
{
   return val.value();
}
template <class T>
inline const T& unwrap_debug_type(const T& val)
{
   return val;
}

#define NON_MEMBER_OP1(name, str) \
   template <class Backend>\
   inline void BOOST_JOIN(eval_, name)(debug_adaptor<Backend>& result)\
   {\
      using default_ops::BOOST_JOIN(eval_, name);\
      BOOST_JOIN(eval_, name)(result.value());\
      result.update_view();\
   }

#define NON_MEMBER_OP2(name, str) \
   template <class Backend, class T>\
   inline void BOOST_JOIN(eval_, name)(debug_adaptor<Backend>& result, const T& a)\
   {\
      using default_ops::BOOST_JOIN(eval_, name);\
      BOOST_JOIN(eval_, name)(result.value(), unwrap_debug_type(a));\
      result.update_view();\
   }\
   template <class Backend>\
   inline void BOOST_JOIN(eval_, name)(debug_adaptor<Backend>& result, const debug_adaptor<Backend>& a)\
   {\
      using default_ops::BOOST_JOIN(eval_, name);\
      BOOST_JOIN(eval_, name)(result.value(), unwrap_debug_type(a));\
      result.update_view();\
   }

#define NON_MEMBER_OP3(name, str) \
   template <class Backend, class T, class U>\
   inline void BOOST_JOIN(eval_, name)(debug_adaptor<Backend>& result, const T& a, const U& b)\
   {\
      using default_ops::BOOST_JOIN(eval_, name);\
      BOOST_JOIN(eval_, name)(result.value(), unwrap_debug_type(a), unwrap_debug_type(b));\
      result.update_view();\
   }\
   template <class Backend, class T>\
   inline void BOOST_JOIN(eval_, name)(debug_adaptor<Backend>& result, const debug_adaptor<Backend>& a, const T& b)\
   {\
      using default_ops::BOOST_JOIN(eval_, name);\
      BOOST_JOIN(eval_, name)(result.value(), unwrap_debug_type(a), unwrap_debug_type(b));\
      result.update_view();\
   }\
   template <class Backend, class T>\
   inline void BOOST_JOIN(eval_, name)(debug_adaptor<Backend>& result, const T& a, const debug_adaptor<Backend>& b)\
   {\
      using default_ops::BOOST_JOIN(eval_, name);\
      BOOST_JOIN(eval_, name)(result.value(), unwrap_debug_type(a), unwrap_debug_type(b));\
      result.update_view();\
   }\
   template <class Backend>\
   inline void BOOST_JOIN(eval_, name)(debug_adaptor<Backend>& result, const debug_adaptor<Backend>& a, const debug_adaptor<Backend>& b)\
   {\
      using default_ops::BOOST_JOIN(eval_, name);\
      BOOST_JOIN(eval_, name)(result.value(), unwrap_debug_type(a), unwrap_debug_type(b));\
      result.update_view();\
   }

#define NON_MEMBER_OP4(name, str) \
   template <class Backend, class T, class U, class V>\
   inline void BOOST_JOIN(eval_, name)(debug_adaptor<Backend>& result, const T& a, const U& b, const V& c)\
   {\
      using default_ops::BOOST_JOIN(eval_, name);\
      BOOST_JOIN(eval_, name)(result.value(), unwrap_debug_type(a), unwrap_debug_type(b), unwrap_debug_type(c));\
      result.update_view();\
   }\
   template <class Backend, class T>\
   inline void BOOST_JOIN(eval_, name)(debug_adaptor<Backend>& result, const debug_adaptor<Backend>& a, const debug_adaptor<Backend>& b, const T& c)\
   {\
      using default_ops::BOOST_JOIN(eval_, name);\
      BOOST_JOIN(eval_, name)(result.value(), unwrap_debug_type(a), unwrap_debug_type(b), unwrap_debug_type(c));\
      result.update_view();\
   }\
   template <class Backend, class T>\
   inline void BOOST_JOIN(eval_, name)(debug_adaptor<Backend>& result, const debug_adaptor<Backend>& a, const T& b, const debug_adaptor<Backend>& c)\
   {\
      using default_ops::BOOST_JOIN(eval_, name);\
      BOOST_JOIN(eval_, name)(result.value(), unwrap_debug_type(a), unwrap_debug_type(b), unwrap_debug_type(c));\
      result.update_view();\
   }\
   template <class Backend, class T>\
   inline void BOOST_JOIN(eval_, name)(debug_adaptor<Backend>& result, const T& a, const debug_adaptor<Backend>& b, const debug_adaptor<Backend>& c)\
   {\
      using default_ops::BOOST_JOIN(eval_, name);\
      BOOST_JOIN(eval_, name)(result.value(), unwrap_debug_type(a), unwrap_debug_type(b), unwrap_debug_type(c));\
      result.update_view();\
   }\
   template <class Backend>\
   inline void BOOST_JOIN(eval_, name)(debug_adaptor<Backend>& result, const debug_adaptor<Backend>& a, const debug_adaptor<Backend>& b, const debug_adaptor<Backend>& c)\
   {\
      using default_ops::BOOST_JOIN(eval_, name);\
      BOOST_JOIN(eval_, name)(result.value(), unwrap_debug_type(a), unwrap_debug_type(b), unwrap_debug_type(c));\
      result.update_view();\
   }\
   template <class Backend, class T, class U>\
   inline void BOOST_JOIN(eval_, name)(debug_adaptor<Backend>& result, const debug_adaptor<Backend>& a, const T& b, const U& c)\
   {\
      using default_ops::BOOST_JOIN(eval_, name);\
      BOOST_JOIN(eval_, name)(result.value(), unwrap_debug_type(a), unwrap_debug_type(b), unwrap_debug_type(c));\
      result.update_view();\
   }\

NON_MEMBER_OP2(add, "+=");
NON_MEMBER_OP2(subtract, "-=");
NON_MEMBER_OP2(multiply, "*=");
NON_MEMBER_OP2(divide, "/=");

template <class Backend, class R>
inline void eval_convert_to(R* result, const debug_adaptor<Backend>& val)
{
   using default_ops::eval_convert_to;
   eval_convert_to(result, val.value());
}

template <class Backend, class Exp>
inline void eval_frexp(debug_adaptor<Backend>& result, const debug_adaptor<Backend>& arg, Exp* exp)
{
   eval_frexp(result.value(), arg.value(), exp);
   result.update_view();
}

template <class Backend, class Exp>
inline void eval_ldexp(debug_adaptor<Backend>& result, const debug_adaptor<Backend>& arg, Exp exp)
{
   eval_ldexp(result.value(), arg.value(), exp);
   result.update_view();
}

template <class Backend, class Exp>
inline void eval_scalbn(debug_adaptor<Backend>& result, const debug_adaptor<Backend>& arg, Exp exp)
{
   eval_scalbn(result.value(), arg.value(), exp);
   result.update_view();
}

template <class Backend>
inline typename Backend::exponent_type eval_ilogb(const debug_adaptor<Backend>& arg)
{
   return eval_ilogb(arg.value());
}

NON_MEMBER_OP2(floor, "floor");
NON_MEMBER_OP2(ceil, "ceil");
NON_MEMBER_OP2(sqrt, "sqrt");
NON_MEMBER_OP2(logb, "logb");

template <class Backend>
inline int eval_fpclassify(const debug_adaptor<Backend>& arg)
{
   using default_ops::eval_fpclassify;
   return eval_fpclassify(arg.value());
}

/*********************************************************************
*
* Optional arithmetic operations come next:
*
*********************************************************************/

NON_MEMBER_OP3(add, "+");
NON_MEMBER_OP3(subtract, "-");
NON_MEMBER_OP3(multiply, "*");
NON_MEMBER_OP3(divide, "/");
NON_MEMBER_OP3(multiply_add, "fused-multiply-add");
NON_MEMBER_OP3(multiply_subtract, "fused-multiply-subtract");
NON_MEMBER_OP4(multiply_add, "fused-multiply-add");
NON_MEMBER_OP4(multiply_subtract, "fused-multiply-subtract");

NON_MEMBER_OP1(increment, "increment");
NON_MEMBER_OP1(decrement, "decrement");

/*********************************************************************
*
* Optional integer operations come next:
*
*********************************************************************/

NON_MEMBER_OP2(modulus, "%=");
NON_MEMBER_OP3(modulus, "%");
NON_MEMBER_OP2(bitwise_or, "|=");
NON_MEMBER_OP3(bitwise_or, "|");
NON_MEMBER_OP2(bitwise_and, "&=");
NON_MEMBER_OP3(bitwise_and, "&");
NON_MEMBER_OP2(bitwise_xor, "^=");
NON_MEMBER_OP3(bitwise_xor, "^");
NON_MEMBER_OP4(qr, "quotient-and-remainder");
NON_MEMBER_OP2(complement, "~");

template <class Backend>
inline void eval_left_shift(debug_adaptor<Backend>& arg, unsigned a)
{
   using default_ops::eval_left_shift;
   eval_left_shift(arg.value(), a);
   arg.update_view();\
}
template <class Backend>
inline void eval_left_shift(debug_adaptor<Backend>& arg, const debug_adaptor<Backend>& a, unsigned b)
{
   using default_ops::eval_left_shift;
   eval_left_shift(arg.value(), a.value(), b);
   arg.update_view();\
}
template <class Backend>
inline void eval_right_shift(debug_adaptor<Backend>& arg, unsigned a)
{
   using default_ops::eval_right_shift;
   eval_right_shift(arg.value(), a);
   arg.update_view();\
}
template <class Backend>
inline void eval_right_shift(debug_adaptor<Backend>& arg, const debug_adaptor<Backend>& a, unsigned b)
{
   using default_ops::eval_right_shift;
   eval_right_shift(arg.value(), a.value(), b);
   arg.update_view();\
}

template <class Backend, class T>
inline unsigned eval_integer_modulus(const debug_adaptor<Backend>& arg, const T& a)
{
   using default_ops::eval_integer_modulus;
   return eval_integer_modulus(arg.value(), a);
}

template <class Backend>
inline unsigned eval_lsb(const debug_adaptor<Backend>& arg)
{
   using default_ops::eval_lsb;
   return eval_lsb(arg.value());
}

template <class Backend>
inline unsigned eval_msb(const debug_adaptor<Backend>& arg)
{
   using default_ops::eval_msb;
   return eval_msb(arg.value());
}

template <class Backend>
inline bool eval_bit_test(const debug_adaptor<Backend>& arg, unsigned a)
{
   using default_ops::eval_bit_test;
   return eval_bit_test(arg.value(), a);
}

template <class Backend>
inline void eval_bit_set(const debug_adaptor<Backend>& arg, unsigned a)
{
   using default_ops::eval_bit_set;
   eval_bit_set(arg.value(), a);
   arg.update_view();\
}
template <class Backend>
inline void eval_bit_unset(const debug_adaptor<Backend>& arg, unsigned a)
{
   using default_ops::eval_bit_unset;
   eval_bit_unset(arg.value(), a);
   arg.update_view();\
}
template <class Backend>
inline void eval_bit_flip(const debug_adaptor<Backend>& arg, unsigned a)
{
   using default_ops::eval_bit_flip;
   eval_bit_flip(arg.value(), a);
   arg.update_view();\
}

NON_MEMBER_OP3(gcd, "gcd");
NON_MEMBER_OP3(lcm, "lcm");
NON_MEMBER_OP4(powm, "powm");

/*********************************************************************
*
* abs/fabs:
*
*********************************************************************/

NON_MEMBER_OP2(abs, "abs");
NON_MEMBER_OP2(fabs, "fabs");

/*********************************************************************
*
* Floating point functions:
*
*********************************************************************/

NON_MEMBER_OP2(trunc, "trunc");
NON_MEMBER_OP2(round, "round");
NON_MEMBER_OP2(exp, "exp");
NON_MEMBER_OP2(log, "log");
NON_MEMBER_OP2(log10, "log10");
NON_MEMBER_OP2(sin, "sin");
NON_MEMBER_OP2(cos, "cos");
NON_MEMBER_OP2(tan, "tan");
NON_MEMBER_OP2(asin, "asin");
NON_MEMBER_OP2(acos, "acos");
NON_MEMBER_OP2(atan, "atan");
NON_MEMBER_OP2(sinh, "sinh");
NON_MEMBER_OP2(cosh, "cosh");
NON_MEMBER_OP2(tanh, "tanh");
NON_MEMBER_OP3(fmod, "fmod");
NON_MEMBER_OP3(pow, "pow");
NON_MEMBER_OP3(atan2, "atan2");

template <class Backend>
std::size_t hash_value(const debug_adaptor<Backend>& val)
{
   return hash_value(val.value());
}


} // namespace backends

using backends::debug_adaptor;

template<class Backend>
struct number_category<backends::debug_adaptor<Backend> > : public number_category<Backend> {};

#ifdef BOOST_MSVC
#pragma warning(pop)
#endif
}} // namespaces

namespace std{

template <class Backend, boost::multiprecision::expression_template_option ExpressionTemplates>
class numeric_limits<boost::multiprecision::number<boost::multiprecision::backends::debug_adaptor<Backend>, ExpressionTemplates> >
   : public std::numeric_limits<boost::multiprecision::number<Backend, ExpressionTemplates> >
{
   typedef std::numeric_limits<boost::multiprecision::number<Backend, ExpressionTemplates> > base_type;
   typedef boost::multiprecision::number<boost::multiprecision::backends::debug_adaptor<Backend>, ExpressionTemplates> number_type;
public:
   static number_type (min)() BOOST_NOEXCEPT { return (base_type::min)(); }
   static number_type (max)() BOOST_NOEXCEPT { return (base_type::max)(); }
   static number_type lowest() BOOST_NOEXCEPT { return -(max)(); }
   static number_type epsilon() BOOST_NOEXCEPT { return base_type::epsilon(); }
   static number_type round_error() BOOST_NOEXCEPT { return epsilon() / 2; }
   static number_type infinity() BOOST_NOEXCEPT { return base_type::infinity(); }
   static number_type quiet_NaN() BOOST_NOEXCEPT { return base_type::quiet_NaN(); }
   static number_type signaling_NaN() BOOST_NOEXCEPT { return base_type::signaling_NaN(); }
   static number_type denorm_min() BOOST_NOEXCEPT { return base_type::denorm_min(); }
};

} // namespace std

namespace boost{ namespace math{

namespace policies{

template <class Backend, boost::multiprecision::expression_template_option ExpressionTemplates, class Policy>
struct precision< boost::multiprecision::number<boost::multiprecision::debug_adaptor<Backend>, ExpressionTemplates>, Policy>
   : public precision<boost::multiprecision::number<Backend, ExpressionTemplates>, Policy>
{};

#undef NON_MEMBER_OP1
#undef NON_MEMBER_OP2
#undef NON_MEMBER_OP3
#undef NON_MEMBER_OP4

} // namespace policies

}} // namespaces boost::math


#endif
