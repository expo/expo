///////////////////////////////////////////////////////////////
//  Copyright 2013 John Maddock. Distributed under the Boost
//  Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_

#ifndef BOOST_MULTIPRECISION_CPP_BIN_FLOAT_TRANSCENDENTAL_HPP
#define BOOST_MULTIPRECISION_CPP_BIN_FLOAT_TRANSCENDENTAL_HPP

namespace boost{ namespace multiprecision{ namespace backends{

template <unsigned Digits, digit_base_type DigitBase, class Allocator, class Exponent, Exponent MinE, Exponent MaxE>
void eval_exp_taylor(cpp_bin_float<Digits, DigitBase, Allocator, Exponent, MinE, MaxE> &res, const cpp_bin_float<Digits, DigitBase, Allocator, Exponent, MinE, MaxE> &arg)
{
   static const int bits = cpp_bin_float<Digits, DigitBase, Allocator, Exponent, MinE, MaxE>::bit_count;
   //
   // Taylor series for small argument, note returns exp(x) - 1:
   //
   res = limb_type(0);
   cpp_bin_float<Digits, DigitBase, Allocator, Exponent, MinE, MaxE> num(arg), denom, t;
   denom = limb_type(1);
   eval_add(res, num);

   for(unsigned k = 2; ; ++k)
   {
      eval_multiply(denom, k);
      eval_multiply(num, arg);
      eval_divide(t, num, denom);
      eval_add(res, t);
      if(eval_is_zero(t) || (res.exponent() - bits > t.exponent()))
         break;
   }
}

template <unsigned Digits, digit_base_type DigitBase, class Allocator, class Exponent, Exponent MinE, Exponent MaxE>
void eval_exp(cpp_bin_float<Digits, DigitBase, Allocator, Exponent, MinE, MaxE> &res, const cpp_bin_float<Digits, DigitBase, Allocator, Exponent, MinE, MaxE> &arg)
{
   //
   // This is based on MPFR's method, let:
   //
   // n = floor(x / ln(2))
   //
   // Then:
   //
   // r = x - n ln(2) : 0 <= r < ln(2)
   //
   // We can reduce r further by dividing by 2^k, with k ~ sqrt(n),
   // so if:
   //
   // e0 = exp(r / 2^k) - 1
   //
   // With e0 evaluated by taylor series for small arguments, then:
   //
   // exp(x) = 2^n (1 + e0)^2^k
   //
   // Note that to preserve precision we actually square (1 + e0) k times, calculating
   // the result less one each time, i.e.
   //
   // (1 + e0)^2 - 1 = e0^2 + 2e0
   //
   // Then add the final 1 at the end, given that e0 is small, this effectively wipes
   // out the error in the last step.
   //
   using default_ops::eval_multiply;
   using default_ops::eval_subtract;
   using default_ops::eval_add;
   using default_ops::eval_convert_to;

   int type = eval_fpclassify(arg);
   bool isneg = eval_get_sign(arg) < 0;
   if(type == (int)FP_NAN)
   {
      res = arg;
      return;
   }
   else if(type == (int)FP_INFINITE)
   {
      res = arg;
      if(isneg)
         res = limb_type(0u);
      else 
         res = arg;
      return;
   }
   else if(type == (int)FP_ZERO)
   {
      res = limb_type(1);
      return;
   }
   cpp_bin_float<Digits, DigitBase, Allocator, Exponent, MinE, MaxE> t, n;
   if(isneg)
   {
      t = arg;
      t.negate();
      eval_exp(res, t);
      t.swap(res);
      res = limb_type(1);
      eval_divide(res, t);
      return;
   }

   eval_divide(n, arg, default_ops::get_constant_ln2<cpp_bin_float<Digits, DigitBase, Allocator, Exponent, MinE, MaxE> >());
   eval_floor(n, n);
   eval_multiply(t, n, default_ops::get_constant_ln2<cpp_bin_float<Digits, DigitBase, Allocator, Exponent, MinE, MaxE> >());
   eval_subtract(t, arg);
   t.negate();
   if(eval_get_sign(t) < 0)
   {
      // There are some very rare cases where arg/ln2 is an integer, and the subsequent multiply
      // rounds up, in that situation t ends up negative at this point which breaks our invariants below:
      t = limb_type(0);
   }
   BOOST_ASSERT(t.compare(default_ops::get_constant_ln2<cpp_bin_float<Digits, DigitBase, Allocator, Exponent, MinE, MaxE> >()) < 0);

   Exponent k, nn;
   eval_convert_to(&nn, n);
   k = nn ? Exponent(1) << (msb(nn) / 2) : 0;
   eval_ldexp(t, t, -k);

   eval_exp_taylor(res, t);
   //
   // Square 1 + res k times:
   //
   for(int s = 0; s < k; ++s)
   {
      t.swap(res);
      eval_multiply(res, t, t);
      eval_ldexp(t, t, 1);
      eval_add(res, t);
   }
   eval_add(res, limb_type(1));
   eval_ldexp(res, res, nn);
}

}}} // namespaces

#endif

