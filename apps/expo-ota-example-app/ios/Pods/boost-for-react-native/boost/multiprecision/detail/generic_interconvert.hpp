///////////////////////////////////////////////////////////////////////////////
//  Copyright 2011 John Maddock. Distributed under the Boost
//  Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_MP_GENERIC_INTERCONVERT_HPP
#define BOOST_MP_GENERIC_INTERCONVERT_HPP

#include <boost/multiprecision/detail/default_ops.hpp>

#ifdef BOOST_MSVC
#pragma warning(push)
#pragma warning(disable:4127 6326)
#endif

namespace boost{ namespace multiprecision{ namespace detail{

template <class To, class From>
inline To do_cast(const From & from)
{
   return static_cast<To>(from);
}
template <class To, class B, ::boost::multiprecision::expression_template_option et>
inline To do_cast(const number<B, et>& from)
{
   return from.template convert_to<To>();
}

template <class To, class From>
void generic_interconvert(To& to, const From& from, const mpl::int_<number_kind_floating_point>& /*to_type*/, const mpl::int_<number_kind_integer>& /*from_type*/)
{
   using default_ops::eval_get_sign;
   using default_ops::eval_bitwise_and;
   using default_ops::eval_convert_to;
   using default_ops::eval_right_shift;
   using default_ops::eval_ldexp;
   using default_ops::eval_add;
   using default_ops::eval_is_zero;
   // smallest unsigned type handled natively by "From" is likely to be it's limb_type:
   typedef typename canonical<unsigned char, From>::type   l_limb_type;
   // get the corresponding type that we can assign to "To":
   typedef typename canonical<l_limb_type, To>::type         to_type;
   From t(from);
   bool is_neg = eval_get_sign(t) < 0;
   if(is_neg)
      t.negate();
   // Pick off the first limb:
   l_limb_type limb;
   l_limb_type mask = static_cast<l_limb_type>(~static_cast<l_limb_type>(0));
   From fl;
   eval_bitwise_and(fl, t, mask);
   eval_convert_to(&limb, fl);
   to = static_cast<to_type>(limb);
   eval_right_shift(t, std::numeric_limits<l_limb_type>::digits);
   //
   // Then keep picking off more limbs until "t" is zero:
   //
   To l;
   unsigned shift = std::numeric_limits<l_limb_type>::digits;
   while(!eval_is_zero(t))
   {
      eval_bitwise_and(fl, t, mask);
      eval_convert_to(&limb, fl);
      l = static_cast<to_type>(limb);
      eval_right_shift(t, std::numeric_limits<l_limb_type>::digits);
      eval_ldexp(l, l, shift);
      eval_add(to, l);
      shift += std::numeric_limits<l_limb_type>::digits;
   }
   //
   // Finish off by setting the sign:
   //
   if(is_neg)
      to.negate();
}

template <class To, class From>
void generic_interconvert(To& to, const From& from, const mpl::int_<number_kind_integer>& /*to_type*/, const mpl::int_<number_kind_integer>& /*from_type*/)
{
   using default_ops::eval_get_sign;
   using default_ops::eval_bitwise_and;
   using default_ops::eval_convert_to;
   using default_ops::eval_right_shift;
   using default_ops::eval_left_shift;
   using default_ops::eval_bitwise_or;
   using default_ops::eval_is_zero;
   // smallest unsigned type handled natively by "From" is likely to be it's limb_type:
   typedef typename canonical<unsigned char, From>::type   limb_type;
   // get the corresponding type that we can assign to "To":
   typedef typename canonical<limb_type, To>::type         to_type;
   From t(from);
   bool is_neg = eval_get_sign(t) < 0;
   if(is_neg)
      t.negate();
   // Pick off the first limb:
   limb_type limb;
   limb_type mask = static_cast<limb_type>(~static_cast<limb_type>(0));
   From fl;
   eval_bitwise_and(fl, t, mask);
   eval_convert_to(&limb, fl);
   to = static_cast<to_type>(limb);
   eval_right_shift(t, std::numeric_limits<limb_type>::digits);
   //
   // Then keep picking off more limbs until "t" is zero:
   //
   To l;
   unsigned shift = std::numeric_limits<limb_type>::digits;
   while(!eval_is_zero(t))
   {
      eval_bitwise_and(fl, t, mask);
      eval_convert_to(&limb, fl);
      l = static_cast<to_type>(limb);
      eval_right_shift(t, std::numeric_limits<limb_type>::digits);
      eval_left_shift(l, shift);
      eval_bitwise_or(to, l);
      shift += std::numeric_limits<limb_type>::digits;
   }
   //
   // Finish off by setting the sign:
   //
   if(is_neg)
      to.negate();
}

template <class To, class From>
void generic_interconvert(To& to, const From& from, const mpl::int_<number_kind_floating_point>& /*to_type*/, const mpl::int_<number_kind_floating_point>& /*from_type*/)
{
#ifdef BOOST_MSVC
#pragma warning(push)
#pragma warning(disable:4127)
#endif
   //
   // The code here only works when the radix of "From" is 2, we could try shifting by other
   // radixes but it would complicate things.... use a string conversion when the radix is other
   // than 2:
   //
   if(std::numeric_limits<number<From> >::radix != 2)
   {
      to = from.str(0, std::ios_base::fmtflags()).c_str();
      return;
   }


   typedef typename canonical<unsigned char, To>::type ui_type;

   using default_ops::eval_fpclassify;
   using default_ops::eval_add;
   using default_ops::eval_subtract;
   using default_ops::eval_convert_to;
   using default_ops::eval_get_sign;
   using default_ops::eval_is_zero;

   //
   // First classify the input, then handle the special cases:
   //
   int c = eval_fpclassify(from);

   if(c == (int)FP_ZERO)
   {
      to = ui_type(0);
      return;
   }
   else if(c == (int)FP_NAN)
   {
      to = static_cast<const char*>("nan");
      return;
   }
   else if(c == (int)FP_INFINITE)
   {
      to = static_cast<const char*>("inf");
      if(eval_get_sign(from) < 0)
         to.negate();
      return;
   }

   typename From::exponent_type e;
   From f, term;
   to = ui_type(0);

   eval_frexp(f, from, &e);

   static const int shift = std::numeric_limits<boost::intmax_t>::digits - 1;

   while(!eval_is_zero(f))
   {
      // extract int sized bits from f:
      eval_ldexp(f, f, shift);
      eval_floor(term, f);
      e -= shift;
      eval_ldexp(to, to, shift);
      typename boost::multiprecision::detail::canonical<boost::intmax_t, To>::type ll;
      eval_convert_to(&ll, term);
      eval_add(to, ll);
      eval_subtract(f, term);
   }
   typedef typename To::exponent_type to_exponent;
   if((e > (std::numeric_limits<to_exponent>::max)()) || (e < (std::numeric_limits<to_exponent>::min)()))
   {
      to = static_cast<const char*>("inf");
      if(eval_get_sign(from) < 0)
         to.negate();
      return;
   }
   eval_ldexp(to, to, static_cast<to_exponent>(e));
#ifdef BOOST_MSVC
#pragma warning(pop)
#endif
}

template <class To, class From>
void generic_interconvert(To& to, const From& from, const mpl::int_<number_kind_rational>& /*to_type*/, const mpl::int_<number_kind_rational>& /*from_type*/)
{
   typedef typename component_type<number<To> >::type     to_component_type;

   number<From> t(from);
   to_component_type n(numerator(t)), d(denominator(t));
   using default_ops::assign_components;
   assign_components(to, n.backend(), d.backend());
}

template <class To, class From>
void generic_interconvert(To& to, const From& from, const mpl::int_<number_kind_rational>& /*to_type*/, const mpl::int_<number_kind_integer>& /*from_type*/)
{
   typedef typename component_type<number<To> >::type     to_component_type;

   number<From> t(from);
   to_component_type n(t), d(1);
   using default_ops::assign_components;
   assign_components(to, n.backend(), d.backend());
}

template <class R, class LargeInteger>
R safe_convert_to_float(const LargeInteger& i)
{
   using std::ldexp;
   if(!i)
      return R(0);
   if(std::numeric_limits<R>::is_specialized && std::numeric_limits<R>::max_exponent)
   {
      LargeInteger val(i);
      if(val.sign() < 0)
         val = -val;
      unsigned mb = msb(val);
      if(mb >= std::numeric_limits<R>::max_exponent)
      {
         int scale_factor = (int)mb + 1 - std::numeric_limits<R>::max_exponent;
         BOOST_ASSERT(scale_factor >= 1);
         val >>= scale_factor;
         R result = val.template convert_to<R>();
         if(std::numeric_limits<R>::digits == 0 || std::numeric_limits<R>::digits >= std::numeric_limits<R>::max_exponent)
         {
            //
            // Calculate and add on the remainder, only if there are more
            // digits in the mantissa that the size of the exponent, in 
            // other words if we are dropping digits in the conversion
            // otherwise:
            //
            LargeInteger remainder(i);
            remainder &= (LargeInteger(1) << scale_factor) - 1;
            result += ldexp(safe_convert_to_float<R>(remainder), -scale_factor);
         }
         return i.sign() < 0 ? static_cast<R>(-result) : result;
      }
   }
   return i.template convert_to<R>();
}

template <class To, class Integer>
inline typename disable_if_c<is_number<To>::value || is_floating_point<To>::value>::type 
   generic_convert_rational_to_float_imp(To& result, const Integer& n, const Integer& d, const mpl::true_&)
{
   //
   // If we get here, then there's something about one type or the other
   // that prevents an exactly rounded result from being calculated
   // (or at least it's not clear how to implement such a thing).
   //
   using default_ops::eval_divide;
   number<To> fn(safe_convert_to_float<number<To> >(n)), fd(safe_convert_to_float<number<To> >(d));
   eval_divide(result, fn.backend(), fd.backend());
}
template <class To, class Integer>
inline typename enable_if_c<is_number<To>::value || is_floating_point<To>::value>::type 
   generic_convert_rational_to_float_imp(To& result, const Integer& n, const Integer& d, const mpl::true_&)
{
   //
   // If we get here, then there's something about one type or the other
   // that prevents an exactly rounded result from being calculated
   // (or at least it's not clear how to implement such a thing).
   //
   To fd(safe_convert_to_float<To>(d));
   result = safe_convert_to_float<To>(n);
   result /= fd;
}

template <class To, class Integer>
typename enable_if_c<is_number<To>::value || is_floating_point<To>::value>::type 
   generic_convert_rational_to_float_imp(To& result, Integer& num, Integer& denom, const mpl::false_&)
{
   //
   // If we get here, then the precision of type To is known, and the integer type is unbounded
   // so we can use integer division plus manipulation of the remainder to get an exactly
   // rounded result.
   //
   if(num == 0)
   {
      result = 0;
      return;
   }
   bool s = false;
   if(num < 0)
   {
      s = true;
      num = -num;
   }
   int denom_bits = msb(denom);
   int shift = std::numeric_limits<To>::digits + denom_bits - msb(num);
   if(shift > 0)
      num <<= shift;
   else if(shift < 0)
      denom <<= boost::multiprecision::detail::unsigned_abs(shift);
   Integer q, r;
   divide_qr(num, denom, q, r);
   int q_bits = msb(q);
   if(q_bits == std::numeric_limits<To>::digits - 1)
   {
      //
      // Round up if 2 * r > denom:
      //
      r <<= 1;
      int c = r.compare(denom);
      if(c > 0)
         ++q;
      else if((c == 0) && (q & 1u))
      {
         ++q;
      }
   }
   else
   {
      BOOST_ASSERT(q_bits == std::numeric_limits<To>::digits);
      //
      // We basically already have the rounding info:
      //
      if(q & 1u)
      {
         if(r || (q & 2u))
            ++q;
      }
   }
   using std::ldexp;
   result = do_cast<To>(q);
   result = ldexp(result, -shift);
   if(s)
      result = -result;
}
template <class To, class Integer>
inline typename disable_if_c<is_number<To>::value || is_floating_point<To>::value>::type
   generic_convert_rational_to_float_imp(To& result, Integer& num, Integer& denom, const mpl::false_& tag)
{
   number<To> t;
   generic_convert_rational_to_float_imp(t, num, denom, tag);
   result = t.backend();
}

template <class To, class From>
inline void generic_convert_rational_to_float(To& result, const From& f)
{
   //
   // Type From is always a Backend to number<>, or an
   // instance of number<>, but we allow
   // To to be either a Backend type, or a real number type,
   // that way we can call this from generic conversions, and
   // from specific conversions to built in types.
   //
   typedef typename mpl::if_c<is_number<From>::value, From, number<From> >::type actual_from_type;
   typedef typename mpl::if_c<is_number<To>::value || is_floating_point<To>::value, To, number<To> >::type actual_to_type;
   typedef typename component_type<actual_from_type>::type integer_type;
   typedef mpl::bool_<!std::numeric_limits<integer_type>::is_specialized 
                      || std::numeric_limits<integer_type>::is_bounded
                      || !std::numeric_limits<actual_to_type>::is_specialized 
                      || !std::numeric_limits<actual_to_type>::is_bounded
                      || (std::numeric_limits<actual_to_type>::radix != 2)> dispatch_tag;

   integer_type n(numerator(static_cast<actual_from_type>(f))), d(denominator(static_cast<actual_from_type>(f)));
   generic_convert_rational_to_float_imp(result, n, d, dispatch_tag());
}

template <class To, class From>
inline void generic_interconvert(To& to, const From& from, const mpl::int_<number_kind_floating_point>& /*to_type*/, const mpl::int_<number_kind_rational>& /*from_type*/)
{
   generic_convert_rational_to_float(to, from);
}

template <class To, class From>
void generic_interconvert_float2rational(To& to, const From& from, const mpl::int_<2>& /*radix*/)
{
   typedef typename mpl::front<typename To::unsigned_types>::type ui_type;
   static const int shift = std::numeric_limits<boost::long_long_type>::digits;
   typename From::exponent_type e;
   typename component_type<number<To> >::type num, denom;
   number<From> val(from);
   val = frexp(val, &e);
   while(val)
   {
      val = ldexp(val, shift);
      e -= shift;
      boost::long_long_type ll = boost::math::lltrunc(val);
      val -= ll;
      num <<= shift;
      num += ll;
   }
   denom = ui_type(1u);
   if(e < 0)
      denom <<= -e;
   else if(e > 0)
      num <<= e;
   assign_components(to, num.backend(), denom.backend());
}

template <class To, class From, int Radix>
void generic_interconvert_float2rational(To& to, const From& from, const mpl::int_<Radix>& /*radix*/)
{
   //
   // This is almost the same as the binary case above, but we have to use
   // scalbn and ilogb rather than ldexp and frexp, we also only extract
   // one Radix digit at a time which is terribly inefficient!
   //
   typedef typename mpl::front<typename To::unsigned_types>::type ui_type;
   typename From::exponent_type e;
   typename component_type<number<To> >::type num, denom;
   number<From> val(from);
   e = ilogb(val);
   val = scalbn(val, -e);
   while(val)
   {
      boost::long_long_type ll = boost::math::lltrunc(val);
      val -= ll;
      val = scalbn(val, 1);
      num *= Radix;
      num += ll;
      --e;
   }
   ++e;
   denom = ui_type(Radix);
   denom = pow(denom, abs(e));
   if(e > 0)
   {
      num *= denom;
      denom = 1;
   }
   assign_components(to, num.backend(), denom.backend());
}

template <class To, class From>
void generic_interconvert(To& to, const From& from, const mpl::int_<number_kind_rational>& /*to_type*/, const mpl::int_<number_kind_floating_point>& /*from_type*/)
{
   generic_interconvert_float2rational(to, from, mpl::int_<std::numeric_limits<number<From> >::radix>());
}

template <class To, class From>
void generic_interconvert(To& to, const From& from, const mpl::int_<number_kind_integer>& /*to_type*/, const mpl::int_<number_kind_rational>& /*from_type*/)
{
   number<From> t(from);
   number<To> result(numerator(t) / denominator(t));
   to = result.backend();
}

template <class To, class From>
void generic_interconvert_float2int(To& to, const From& from, const mpl::int_<2>& /*radix*/)
{
   typedef typename From::exponent_type exponent_type;
   static const exponent_type shift = std::numeric_limits<boost::long_long_type>::digits;
   exponent_type e;
   number<To>   num(0u);
   number<From> val(from);
   val = frexp(val, &e);
   while(e > 0)
   {
      int s = (std::min)(e, shift);
      val = ldexp(val, s);
      e -= s;
      boost::long_long_type ll = boost::math::lltrunc(val);
      val -= ll;
      num <<= s;
      num += ll;
   }
   to = num.backend();
}

template <class To, class From, int Radix>
void generic_interconvert_float2int(To& to, const From& from, const mpl::int_<Radix>& /*radix*/)
{
   //
   // This is almost the same as the binary case above, but we have to use
   // scalbn and ilogb rather than ldexp and frexp, we also only extract
   // one Radix digit at a time which is terribly inefficient!
   //
   typename From::exponent_type e;
   number<To> num(0u);
   number<From> val(from);
   e = ilogb(val);
   val = scalbn(val, -e);
   while(e >= 0)
   {
      boost::long_long_type ll = boost::math::lltrunc(val);
      val -= ll;
      val = scalbn(val, 1);
      num *= Radix;
      num += ll;
      --e;
   }
   to = num.backend();
}

template <class To, class From>
void generic_interconvert(To& to, const From& from, const mpl::int_<number_kind_integer>& /*to_type*/, const mpl::int_<number_kind_floating_point>& /*from_type*/)
{
   generic_interconvert_float2int(to, from, mpl::int_<std::numeric_limits<number<From> >::radix>());
}

}
}
} // namespaces

#ifdef BOOST_MSVC
#pragma warning(pop)
#endif

#endif  // BOOST_MP_GENERIC_INTERCONVERT_HPP

