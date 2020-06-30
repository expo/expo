///////////////////////////////////////////////////////////////
//  Copyright 2012 John Maddock. Distributed under the Boost
//  Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_

#ifndef BOOST_MATH_LOGGED_ADAPTER_HPP
#define BOOST_MATH_LOGGED_ADAPTER_HPP

#include <boost/multiprecision/traits/extract_exponent_type.hpp>
#include <boost/multiprecision/detail/integer_ops.hpp>

namespace boost{
namespace multiprecision{

template <class Backend>
inline void log_postfix_event(const Backend&, const char* /*event_description*/)
{
}
template <class Backend, class T>
inline void log_postfix_event(const Backend&, const T&, const char* /*event_description*/)
{
}
template <class Backend>
inline void log_prefix_event(const Backend&, const char* /*event_description*/)
{
}
template <class Backend, class T>
inline void log_prefix_event(const Backend&, const T&, const char* /*event_description*/)
{
}
template <class Backend, class T, class U>
inline void log_prefix_event(const Backend&, const T&, const U&, const char* /*event_description*/)
{
}
template <class Backend, class T, class U, class V>
inline void log_prefix_event(const Backend&, const T&, const U&, const V&, const char* /*event_description*/)
{
}

namespace backends{

template <class Backend>
struct logged_adaptor
{
   typedef typename Backend::signed_types              signed_types;
   typedef typename Backend::unsigned_types            unsigned_types;
   typedef typename Backend::float_types               float_types;
   typedef typename extract_exponent_type<
      Backend, number_category<Backend>::value>::type  exponent_type;

private:

   Backend m_value;
public:
   logged_adaptor()
   {
      log_postfix_event(m_value, "Default construct");
   }
   logged_adaptor(const logged_adaptor& o)
   {
      log_prefix_event(m_value, o.value(), "Copy construct");
      m_value = o.m_value;
      log_postfix_event(m_value, "Copy construct");
   }
   logged_adaptor& operator = (const logged_adaptor& o)
   {
      log_prefix_event(m_value, o.value(), "Assignment");
      m_value = o.m_value;
      log_postfix_event(m_value, "Copy construct");
      return *this;
   }
   template <class T>
   logged_adaptor(const T& i, const typename enable_if_c<is_convertible<T, Backend>::value>::type* = 0)
      : m_value(i)
   {
      log_postfix_event(m_value, "construct from arithmetic type");
   }
   template <class T>
   typename enable_if_c<is_arithmetic<T>::value || is_convertible<T, Backend>::value, logged_adaptor&>::type operator = (const T& i)
   {
      log_prefix_event(m_value, i, "Assignment from arithmetic type");
      m_value = i;
      log_postfix_event(m_value, "Assignment from arithmetic type");
      return *this;
   }
   logged_adaptor& operator = (const char* s)
   {
      log_prefix_event(m_value, s, "Assignment from string type");
      m_value = s;
      log_postfix_event(m_value, "Assignment from string type");
      return *this;
   }
   void swap(logged_adaptor& o)
   {
      log_prefix_event(m_value, o.value(), "swap");
      std::swap(m_value, o.value());
      log_postfix_event(m_value, "swap");
   }
   std::string str(std::streamsize digits, std::ios_base::fmtflags f)const
   {
      log_prefix_event(m_value, "Conversion to string");
      std::string s = m_value.str(digits, f);
      log_postfix_event(m_value, s, "Conversion to string");
      return s;
   }
   void negate()
   {
      log_prefix_event(m_value, "negate");
      m_value.negate();
      log_postfix_event(m_value, "negate");
   }
   int compare(const logged_adaptor& o)const
   {
      log_prefix_event(m_value, o.value(), "compare");
      int r = m_value.compare(o.value());
      log_postfix_event(m_value, r, "compare");
      return r;
   }
   template <class T>
   int compare(const T& i)const
   {
      log_prefix_event(m_value, i, "compare");
      int r = m_value.compare(i);
      log_postfix_event(m_value, r, "compare");
      return r;
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
      log_prefix_event(m_value, "serialize");
      ar & m_value;
      log_postfix_event(m_value, "serialize");
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

template <class T>
inline const T& unwrap_logged_type(const T& a) { return a; }
template <class Backend>
inline const Backend& unwrap_logged_type(const logged_adaptor<Backend>& a) { return a.value(); }

#define NON_MEMBER_OP1(name, str) \
   template <class Backend>\
   inline void BOOST_JOIN(eval_, name)(logged_adaptor<Backend>& result)\
   {\
      using default_ops::BOOST_JOIN(eval_, name);\
      log_prefix_event(result.value(), str);\
      BOOST_JOIN(eval_, name)(result.value());\
      log_postfix_event(result.value(), str);\
   }

#define NON_MEMBER_OP2(name, str) \
   template <class Backend, class T>\
   inline void BOOST_JOIN(eval_, name)(logged_adaptor<Backend>& result, const T& a)\
   {\
      using default_ops::BOOST_JOIN(eval_, name);\
      log_prefix_event(result.value(), unwrap_logged_type(a), str);\
      BOOST_JOIN(eval_, name)(result.value(), unwrap_logged_type(a));\
      log_postfix_event(result.value(), str);\
   }\
   template <class Backend>\
   inline void BOOST_JOIN(eval_, name)(logged_adaptor<Backend>& result, const logged_adaptor<Backend>& a)\
   {\
      using default_ops::BOOST_JOIN(eval_, name);\
      log_prefix_event(result.value(), unwrap_logged_type(a), str);\
      BOOST_JOIN(eval_, name)(result.value(), unwrap_logged_type(a));\
      log_postfix_event(result.value(), str);\
   }

#define NON_MEMBER_OP3(name, str) \
   template <class Backend, class T, class U>\
   inline void BOOST_JOIN(eval_, name)(logged_adaptor<Backend>& result, const T& a, const U& b)\
   {\
      using default_ops::BOOST_JOIN(eval_, name);\
      log_prefix_event(result.value(), unwrap_logged_type(a), unwrap_logged_type(b), str);\
      BOOST_JOIN(eval_, name)(result.value(), unwrap_logged_type(a), unwrap_logged_type(b));\
      log_postfix_event(result.value(), str);\
   }\
   template <class Backend, class T>\
   inline void BOOST_JOIN(eval_, name)(logged_adaptor<Backend>& result, const logged_adaptor<Backend>& a, const T& b)\
   {\
      using default_ops::BOOST_JOIN(eval_, name);\
      log_prefix_event(result.value(), unwrap_logged_type(a), unwrap_logged_type(b), str);\
      BOOST_JOIN(eval_, name)(result.value(), unwrap_logged_type(a), unwrap_logged_type(b));\
      log_postfix_event(result.value(), str);\
   }\
   template <class Backend, class T>\
   inline void BOOST_JOIN(eval_, name)(logged_adaptor<Backend>& result, const T& a, const logged_adaptor<Backend>& b)\
   {\
      using default_ops::BOOST_JOIN(eval_, name);\
      log_prefix_event(result.value(), unwrap_logged_type(a), unwrap_logged_type(b), str);\
      BOOST_JOIN(eval_, name)(result.value(), unwrap_logged_type(a), unwrap_logged_type(b));\
      log_postfix_event(result.value(), str);\
   }\
   template <class Backend>\
   inline void BOOST_JOIN(eval_, name)(logged_adaptor<Backend>& result, const logged_adaptor<Backend>& a, const logged_adaptor<Backend>& b)\
   {\
      using default_ops::BOOST_JOIN(eval_, name);\
      log_prefix_event(result.value(), unwrap_logged_type(a), unwrap_logged_type(b), str);\
      BOOST_JOIN(eval_, name)(result.value(), unwrap_logged_type(a), unwrap_logged_type(b));\
      log_postfix_event(result.value(), str);\
   }

#define NON_MEMBER_OP4(name, str) \
   template <class Backend, class T, class U, class V>\
   inline void BOOST_JOIN(eval_, name)(logged_adaptor<Backend>& result, const T& a, const U& b, const V& c)\
   {\
      using default_ops::BOOST_JOIN(eval_, name);\
      log_prefix_event(result.value(), unwrap_logged_type(a), unwrap_logged_type(b), unwrap_logged_type(c), str);\
      BOOST_JOIN(eval_, name)(result.value(), unwrap_logged_type(a), unwrap_logged_type(b), unwrap_logged_type(c));\
      log_postfix_event(result.value(), str);\
   }\
   template <class Backend, class T>\
   inline void BOOST_JOIN(eval_, name)(logged_adaptor<Backend>& result, const logged_adaptor<Backend>& a, const logged_adaptor<Backend>& b, const T& c)\
   {\
      using default_ops::BOOST_JOIN(eval_, name);\
      log_prefix_event(result.value(), unwrap_logged_type(a), unwrap_logged_type(b), unwrap_logged_type(c), str);\
      BOOST_JOIN(eval_, name)(result.value(), unwrap_logged_type(a), unwrap_logged_type(b), unwrap_logged_type(c));\
      log_postfix_event(result.value(), str);\
   }\
   template <class Backend, class T>\
   inline void BOOST_JOIN(eval_, name)(logged_adaptor<Backend>& result, const logged_adaptor<Backend>& a, const T& b, const logged_adaptor<Backend>& c)\
   {\
      using default_ops::BOOST_JOIN(eval_, name);\
      log_prefix_event(result.value(), unwrap_logged_type(a), unwrap_logged_type(b), unwrap_logged_type(c), str);\
      BOOST_JOIN(eval_, name)(result.value(), unwrap_logged_type(a), unwrap_logged_type(b), unwrap_logged_type(c));\
      log_postfix_event(result.value(), str);\
   }\
   template <class Backend, class T>\
   inline void BOOST_JOIN(eval_, name)(logged_adaptor<Backend>& result, const T& a, const logged_adaptor<Backend>& b, const logged_adaptor<Backend>& c)\
   {\
      using default_ops::BOOST_JOIN(eval_, name);\
      log_prefix_event(result.value(), unwrap_logged_type(a), unwrap_logged_type(b), unwrap_logged_type(c), str);\
      BOOST_JOIN(eval_, name)(result.value(), unwrap_logged_type(a), unwrap_logged_type(b), unwrap_logged_type(c));\
      log_postfix_event(result.value(), str);\
   }\
   template <class Backend>\
   inline void BOOST_JOIN(eval_, name)(logged_adaptor<Backend>& result, const logged_adaptor<Backend>& a, const logged_adaptor<Backend>& b, const logged_adaptor<Backend>& c)\
   {\
      using default_ops::BOOST_JOIN(eval_, name);\
      log_prefix_event(result.value(), unwrap_logged_type(a), unwrap_logged_type(b), unwrap_logged_type(c), str);\
      BOOST_JOIN(eval_, name)(result.value(), unwrap_logged_type(a), unwrap_logged_type(b), unwrap_logged_type(c));\
      log_postfix_event(result.value(), str);\
   }\
   template <class Backend, class T, class U>\
   inline void BOOST_JOIN(eval_, name)(logged_adaptor<Backend>& result, const logged_adaptor<Backend>& a, const T& b, const U& c)\
   {\
      using default_ops::BOOST_JOIN(eval_, name);\
      log_prefix_event(result.value(), unwrap_logged_type(a), unwrap_logged_type(b), unwrap_logged_type(c), str);\
      BOOST_JOIN(eval_, name)(result.value(), unwrap_logged_type(a), unwrap_logged_type(b), unwrap_logged_type(c));\
      log_postfix_event(result.value(), str);\
   }\

NON_MEMBER_OP2(add, "+=");
NON_MEMBER_OP2(subtract, "-=");
NON_MEMBER_OP2(multiply, "*=");
NON_MEMBER_OP2(divide, "/=");

template <class Backend, class R>
inline void eval_convert_to(R* result, const logged_adaptor<Backend>& val)
{
   using default_ops::eval_convert_to;
   log_prefix_event(val.value(), "convert_to");
   eval_convert_to(result, val.value());
   log_postfix_event(val.value(), *result, "convert_to");
}

template <class Backend, class Exp>
inline void eval_frexp(logged_adaptor<Backend>& result, const logged_adaptor<Backend>& arg, Exp* exp)
{
   log_prefix_event(arg.value(), "frexp");
   eval_frexp(result.value(), arg.value(), exp);
   log_postfix_event(result.value(), *exp, "frexp");
}

template <class Backend, class Exp>
inline void eval_ldexp(logged_adaptor<Backend>& result, const logged_adaptor<Backend>& arg, Exp exp)
{
   log_prefix_event(arg.value(), "ldexp");
   eval_ldexp(result.value(), arg.value(), exp);
   log_postfix_event(result.value(), exp, "ldexp");
}

template <class Backend, class Exp>
inline void eval_scalbn(logged_adaptor<Backend>& result, const logged_adaptor<Backend>& arg, Exp exp)
{
   log_prefix_event(arg.value(), "scalbn");
   eval_scalbn(result.value(), arg.value(), exp);
   log_postfix_event(result.value(), exp, "scalbn");
}

template <class Backend>
inline typename Backend::exponent_type eval_ilogb(const logged_adaptor<Backend>& arg)
{
   log_prefix_event(arg.value(), "ilogb");
   typename Backend::exponent_type r = eval_ilogb(arg.value());
   log_postfix_event(arg.value(), "ilogb");
   return r;
}

NON_MEMBER_OP2(floor, "floor");
NON_MEMBER_OP2(ceil, "ceil");
NON_MEMBER_OP2(sqrt, "sqrt");

template <class Backend>
inline int eval_fpclassify(const logged_adaptor<Backend>& arg)
{
   using default_ops::eval_fpclassify;
   log_prefix_event(arg.value(), "fpclassify");
   int r = eval_fpclassify(arg.value());
   log_postfix_event(arg.value(), r, "fpclassify");
   return r;
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
inline void eval_left_shift(logged_adaptor<Backend>& arg, unsigned a)
{
   using default_ops::eval_left_shift;
   log_prefix_event(arg.value(), a, "<<=");
   eval_left_shift(arg.value(), a);
   log_postfix_event(arg.value(), "<<=");
}
template <class Backend>
inline void eval_left_shift(logged_adaptor<Backend>& arg, const logged_adaptor<Backend>& a, unsigned b)
{
   using default_ops::eval_left_shift;
   log_prefix_event(arg.value(), a, b, "<<");
   eval_left_shift(arg.value(), a.value(), b);
   log_postfix_event(arg.value(), "<<");
}
template <class Backend>
inline void eval_right_shift(logged_adaptor<Backend>& arg, unsigned a)
{
   using default_ops::eval_right_shift;
   log_prefix_event(arg.value(), a, ">>=");
   eval_right_shift(arg.value(), a);
   log_postfix_event(arg.value(), ">>=");
}
template <class Backend>
inline void eval_right_shift(logged_adaptor<Backend>& arg, const logged_adaptor<Backend>& a, unsigned b)
{
   using default_ops::eval_right_shift;
   log_prefix_event(arg.value(), a, b, ">>");
   eval_right_shift(arg.value(), a.value(), b);
   log_postfix_event(arg.value(), ">>");
}

template <class Backend, class T>
inline unsigned eval_integer_modulus(const logged_adaptor<Backend>& arg, const T& a)
{
   using default_ops::eval_integer_modulus;
   log_prefix_event(arg.value(), a, "integer-modulus");
   unsigned r = eval_integer_modulus(arg.value(), a);
   log_postfix_event(arg.value(), r, "integer-modulus");
   return r;
}

template <class Backend>
inline unsigned eval_lsb(const logged_adaptor<Backend>& arg)
{
   using default_ops::eval_lsb;
   log_prefix_event(arg.value(), "least-significant-bit");
   unsigned r = eval_lsb(arg.value());
   log_postfix_event(arg.value(), r, "least-significant-bit");
   return r;
}

template <class Backend>
inline unsigned eval_msb(const logged_adaptor<Backend>& arg)
{
   using default_ops::eval_msb;
   log_prefix_event(arg.value(), "most-significant-bit");
   unsigned r = eval_msb(arg.value());
   log_postfix_event(arg.value(), r, "most-significant-bit");
   return r;
}

template <class Backend>
inline bool eval_bit_test(const logged_adaptor<Backend>& arg, unsigned a)
{
   using default_ops::eval_bit_test;
   log_prefix_event(arg.value(), a, "bit-test");
   bool r = eval_bit_test(arg.value(), a);
   log_postfix_event(arg.value(), r, "bit-test");
   return r;
}

template <class Backend>
inline void eval_bit_set(const logged_adaptor<Backend>& arg, unsigned a)
{
   using default_ops::eval_bit_set;
   log_prefix_event(arg.value(), a, "bit-set");
   eval_bit_set(arg.value(), a);
   log_postfix_event(arg.value(), arg, "bit-set");
}
template <class Backend>
inline void eval_bit_unset(const logged_adaptor<Backend>& arg, unsigned a)
{
   using default_ops::eval_bit_unset;
   log_prefix_event(arg.value(), a, "bit-unset");
   eval_bit_unset(arg.value(), a);
   log_postfix_event(arg.value(), arg, "bit-unset");
}
template <class Backend>
inline void eval_bit_flip(const logged_adaptor<Backend>& arg, unsigned a)
{
   using default_ops::eval_bit_flip;
   log_prefix_event(arg.value(), a, "bit-flip");
   eval_bit_flip(arg.value(), a);
   log_postfix_event(arg.value(), arg, "bit-flip");
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
NON_MEMBER_OP2(logb, "logb");
NON_MEMBER_OP3(fmod, "fmod");
NON_MEMBER_OP3(pow, "pow");
NON_MEMBER_OP3(atan2, "atan2");

template <class Backend>
std::size_t hash_value(const logged_adaptor<Backend>& val)
{
   return hash_value(val.value());
}

} // namespace backends

using backends::logged_adaptor;

template<class Backend>
struct number_category<backends::logged_adaptor<Backend> > : public number_category<Backend> {};

}} // namespaces

namespace std{

template <class Backend, boost::multiprecision::expression_template_option ExpressionTemplates>
class numeric_limits<boost::multiprecision::number<boost::multiprecision::backends::logged_adaptor<Backend>, ExpressionTemplates> >
   : public std::numeric_limits<boost::multiprecision::number<Backend, ExpressionTemplates> >
{
   typedef std::numeric_limits<boost::multiprecision::number<Backend, ExpressionTemplates> > base_type;
   typedef boost::multiprecision::number<boost::multiprecision::backends::logged_adaptor<Backend>, ExpressionTemplates> number_type;
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
struct precision< boost::multiprecision::number<boost::multiprecision::logged_adaptor<Backend>, ExpressionTemplates>, Policy>
   : public precision<boost::multiprecision::number<Backend, ExpressionTemplates>, Policy>
{};

} // namespace policies

}} // namespaces boost::math

#undef NON_MEMBER_OP1
#undef NON_MEMBER_OP2
#undef NON_MEMBER_OP3
#undef NON_MEMBER_OP4

#endif
