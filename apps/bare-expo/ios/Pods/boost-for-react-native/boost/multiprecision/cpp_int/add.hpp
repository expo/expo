///////////////////////////////////////////////////////////////
//  Copyright 2012 John Maddock. Distributed under the Boost
//  Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_
//
// Comparison operators for cpp_int_backend:
//
#ifndef BOOST_MP_CPP_INT_ADD_HPP
#define BOOST_MP_CPP_INT_ADD_HPP

namespace boost{ namespace multiprecision{ namespace backends{

#ifdef _MSC_VER
#pragma warning(push)
#pragma warning(disable:4127) // conditional expression is constant
#endif

//
// This is the key addition routine where all the argument types are non-trivial cpp_int's:
//
template <class CppInt1, class CppInt2, class CppInt3>
inline void add_unsigned(CppInt1& result, const CppInt2& a, const CppInt3& b) BOOST_MP_NOEXCEPT_IF(is_non_throwing_cpp_int<CppInt1>::value)
{
   using std::swap;

   // Nothing fancy, just let uintmax_t take the strain:
   double_limb_type carry = 0;
   unsigned m, x;
   unsigned as = a.size();
   unsigned bs = b.size();
   minmax(as, bs, m, x);
   if(x == 1)
   {
      bool s = a.sign();
      result = static_cast<double_limb_type>(*a.limbs()) + static_cast<double_limb_type>(*b.limbs());
      result.sign(s);
      return;
   }
   result.resize(x, x);
   typename CppInt2::const_limb_pointer pa = a.limbs();
   typename CppInt3::const_limb_pointer pb = b.limbs();
   typename CppInt1::limb_pointer pr = result.limbs();
   typename CppInt1::limb_pointer pr_end = pr + m;

   if(as < bs)
      swap(pa, pb);
   
   // First where a and b overlap:
   while(pr != pr_end)
   {
      carry += static_cast<double_limb_type>(*pa) + static_cast<double_limb_type>(*pb);
#ifdef __MSVC_RUNTIME_CHECKS
      *pr = static_cast<limb_type>(carry & ~static_cast<limb_type>(0));
#else
      *pr = static_cast<limb_type>(carry);
#endif
      carry >>= CppInt1::limb_bits;
      ++pr, ++pa, ++pb;
   }
   pr_end += x - m;
   // Now where only a has digits:
   while(pr != pr_end)
   {
      if(!carry)
      {
         if(pa != pr)
#if BOOST_WORKAROUND(BOOST_MSVC, >= 1600)
            std::copy(pa, pa + (pr_end - pr), stdext::checked_array_iterator<limb_type*>(pr, result.size()));
#else
            std::copy(pa, pa + (pr_end - pr), pr);
#endif
         break;
      }
      carry += static_cast<double_limb_type>(*pa);
#ifdef __MSVC_RUNTIME_CHECKS
      *pr = static_cast<limb_type>(carry & ~static_cast<limb_type>(0));
#else
      *pr = static_cast<limb_type>(carry);
#endif
      carry >>= CppInt1::limb_bits;
      ++pr, ++pa;
   }
   if(carry)
   {
      // We overflowed, need to add one more limb:
      result.resize(x + 1, x + 1);
      if(CppInt1::variable || (result.size() > x))
         result.limbs()[x] = static_cast<limb_type>(carry);
   }
   result.normalize();
   result.sign(a.sign());
}
//
// As above, but for adding a single limb to a non-trivial cpp_int:
//
template <class CppInt1, class CppInt2>
inline void add_unsigned(CppInt1& result, const CppInt2& a, const limb_type& o) BOOST_MP_NOEXCEPT_IF(is_non_throwing_cpp_int<CppInt1>::value)
{
   // Addition using modular arithmetic.
   // Nothing fancy, just let uintmax_t take the strain:
   if(&result != &a)
      result.resize(a.size(), a.size());
   double_limb_type carry = o;
   typename CppInt1::limb_pointer pr = result.limbs();
   typename CppInt2::const_limb_pointer pa = a.limbs();
   unsigned i = 0;
   // Addition with carry until we either run out of digits or carry is zero:
   for(; carry && (i < result.size()); ++i)
   {
      carry += static_cast<double_limb_type>(pa[i]);
#ifdef __MSVC_RUNTIME_CHECKS
      pr[i] = static_cast<limb_type>(carry & ~static_cast<limb_type>(0));
#else
      pr[i] = static_cast<limb_type>(carry);
#endif
      carry >>= CppInt1::limb_bits;
   }
   // Just copy any remaining digits:
   if(&a != &result)
   {
      for(; i < result.size(); ++i)
         pr[i] = pa[i];
   }
   if(carry)
   {
      // We overflowed, need to add one more limb:
      unsigned x = result.size();
      result.resize(x + 1, x + 1);
      if(CppInt1::variable || (result.size() > x))
         result.limbs()[x] = static_cast<limb_type>(carry);
   }
   result.normalize();
   result.sign(a.sign());
}
//
// Core subtraction routine for all non-trivial cpp_int's:
//
template <class CppInt1, class CppInt2, class CppInt3>
inline void subtract_unsigned(CppInt1& result, const CppInt2& a, const CppInt3& b) BOOST_MP_NOEXCEPT_IF(is_non_throwing_cpp_int<CppInt1>::value)
{
   using std::swap;

   // Nothing fancy, just let uintmax_t take the strain:
   double_limb_type borrow = 0;
   unsigned m, x;
   minmax(a.size(), b.size(), m, x);
   //
   // special cases for small limb counts:
   //
   if(x == 1)
   {
      bool s = a.sign();
      limb_type al = *a.limbs();
      limb_type bl = *b.limbs();
      if(bl > al)
      {
         std::swap(al, bl);
         s = !s;
      }
      result = al - bl;
      result.sign(s);
      return;
   }
   // This isn't used till later, but comparison has to occur before we resize the result,
   // as that may also resize a or b if this is an inplace operation:
   int c = a.compare_unsigned(b);
   // Set up the result vector:
   result.resize(x, x);
   // Now that a, b, and result are stable, get pointers to their limbs:
   typename CppInt2::const_limb_pointer pa = a.limbs();
   typename CppInt3::const_limb_pointer pb = b.limbs();
   typename CppInt1::limb_pointer pr = result.limbs();
   bool swapped = false;
   if(c < 0)
   {
      swap(pa, pb);
      swapped = true;
   }
   else if(c == 0)
   {
      result = static_cast<limb_type>(0);
      return;
   }
   
   unsigned i = 0;
   // First where a and b overlap:
   while(i < m)
   {
      borrow = static_cast<double_limb_type>(pa[i]) - static_cast<double_limb_type>(pb[i]) - borrow;
      pr[i] = static_cast<limb_type>(borrow);
      borrow = (borrow >> CppInt1::limb_bits) & 1u;
      ++i;
   }
   // Now where only a has digits, only as long as we've borrowed:
   while(borrow && (i < x))
   {
      borrow = static_cast<double_limb_type>(pa[i]) - borrow;
      pr[i] = static_cast<limb_type>(borrow);
      borrow = (borrow >> CppInt1::limb_bits) & 1u;
      ++i;
   }
   // Any remaining digits are the same as those in pa:
   if((x != i) && (pa != pr))
#if BOOST_WORKAROUND(BOOST_MSVC, >= 1600)
      std::copy(pa + i, pa + x, stdext::checked_array_iterator<limb_type*>(pr + i, result.size() - i));
#else
      std::copy(pa + i, pa + x, pr + i);
#endif
   BOOST_ASSERT(0 == borrow);

   //
   // We may have lost digits, if so update limb usage count:
   //
   result.normalize();
   result.sign(a.sign());
   if(swapped)
      result.negate();
}
//
// And again to subtract a single limb:
//
template <class CppInt1, class CppInt2>
inline void subtract_unsigned(CppInt1& result, const CppInt2& a, const limb_type& b) BOOST_MP_NOEXCEPT_IF(is_non_throwing_cpp_int<CppInt1>::value)
{
   // Subtract one limb.
   // Nothing fancy, just let uintmax_t take the strain:
   BOOST_STATIC_CONSTANT(double_limb_type, borrow = static_cast<double_limb_type>(CppInt1::max_limb_value) + 1);
   result.resize(a.size(), a.size());
   typename CppInt1::limb_pointer pr = result.limbs();
   typename CppInt2::const_limb_pointer pa = a.limbs();
   if(*pa >= b)
   {
      *pr = *pa - b;
      if(&result != &a)
      {
#if BOOST_WORKAROUND(BOOST_MSVC, >= 1600)
         std::copy(pa + 1, pa + a.size(), stdext::checked_array_iterator<limb_type*>(pr + 1, result.size() - 1));
#else
         std::copy(pa + 1, pa + a.size(), pr + 1);
#endif
         result.sign(a.sign());
      }
      else if((result.size() == 1) && (*pr == 0))
      {
         result.sign(false); // zero is unsigned.
      }
   }
   else if(result.size() == 1)
   {
      *pr = b - *pa;
      result.sign(!a.sign());
   }
   else
   {
      *pr = static_cast<limb_type>((borrow + *pa) - b);
      unsigned i = 1;
      while(!pa[i])
      {
         pr[i] = CppInt1::max_limb_value;
         ++i;
      }
      pr[i] = pa[i] - 1;
      if(&result != &a)
      {
         ++i;
#if BOOST_WORKAROUND(BOOST_MSVC, >= 1600)
         std::copy(pa + i, pa + a.size(), stdext::checked_array_iterator<limb_type*>(pr + i, result.size() - i));
#else
         std::copy(pa + i, pa + a.size(), pr + i);
#endif
      }
      result.normalize();
      result.sign(a.sign());
   }
}

//
// Now the actual functions called by the front end, all of which forward to one of the above:
//
template <unsigned MinBits1, unsigned MaxBits1, cpp_integer_type SignType1, cpp_int_check_type Checked1, class Allocator1, unsigned MinBits2, unsigned MaxBits2, cpp_integer_type SignType2, cpp_int_check_type Checked2, class Allocator2>
BOOST_MP_FORCEINLINE typename enable_if_c<!is_trivial_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value && !is_trivial_cpp_int<cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2> >::value >::type 
   eval_add(
      cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>& result, 
      const cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2>& o) BOOST_MP_NOEXCEPT_IF((is_non_throwing_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value))
{
   eval_add(result, result, o);
}
template <unsigned MinBits1, unsigned MaxBits1, cpp_integer_type SignType1, cpp_int_check_type Checked1, class Allocator1, unsigned MinBits2, unsigned MaxBits2, cpp_integer_type SignType2, cpp_int_check_type Checked2, class Allocator2, unsigned MinBits3, unsigned MaxBits3, cpp_integer_type SignType3, cpp_int_check_type Checked3, class Allocator3>
inline typename enable_if_c<!is_trivial_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value && !is_trivial_cpp_int<cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2> >::value && !is_trivial_cpp_int<cpp_int_backend<MinBits3, MaxBits3, SignType3, Checked3, Allocator3> >::value >::type
   eval_add(
      cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>& result, 
      const cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2>& a, 
      const cpp_int_backend<MinBits3, MaxBits3, SignType3, Checked3, Allocator3>& b) BOOST_MP_NOEXCEPT_IF((is_non_throwing_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value))
{
   if(a.sign() != b.sign())
   {
      subtract_unsigned(result, a, b);
      return;
   }
   add_unsigned(result, a, b);
}
template <unsigned MinBits1, unsigned MaxBits1, cpp_integer_type SignType1, cpp_int_check_type Checked1, class Allocator1>
BOOST_MP_FORCEINLINE typename enable_if_c<!is_trivial_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value>::type 
   eval_add(cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>& result, const limb_type& o) BOOST_MP_NOEXCEPT_IF((is_non_throwing_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value))
{
   if(result.sign())
   {
      subtract_unsigned(result, result, o);
   }
   else
      add_unsigned(result, result, o);
}
template <unsigned MinBits1, unsigned MaxBits1, cpp_integer_type SignType1, cpp_int_check_type Checked1, class Allocator1, unsigned MinBits2, unsigned MaxBits2, cpp_integer_type SignType2, cpp_int_check_type Checked2, class Allocator2>
BOOST_MP_FORCEINLINE typename enable_if_c<!is_trivial_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value && !is_trivial_cpp_int<cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2> >::value >::type 
   eval_add(
      cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>& result, 
      const cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2>& a, 
      const limb_type& o) BOOST_MP_NOEXCEPT_IF((is_non_throwing_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value))
{
   if(a.sign())
   {
      subtract_unsigned(result, a, o);
   }
   else
      add_unsigned(result, a, o);
}
template <unsigned MinBits1, unsigned MaxBits1, cpp_integer_type SignType1, cpp_int_check_type Checked1, class Allocator1>
BOOST_MP_FORCEINLINE typename enable_if_c<!is_trivial_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value>::type 
   eval_add(
      cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>& result, 
      const signed_limb_type& o) BOOST_MP_NOEXCEPT_IF((is_non_throwing_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value))
{
   if(o < 0)
      eval_subtract(result, static_cast<limb_type>(boost::multiprecision::detail::unsigned_abs(o)));
   else if(o > 0)
      eval_add(result, static_cast<limb_type>(o));
}
template <unsigned MinBits1, unsigned MaxBits1, cpp_integer_type SignType1, cpp_int_check_type Checked1, class Allocator1, unsigned MinBits2, unsigned MaxBits2, cpp_integer_type SignType2, cpp_int_check_type Checked2, class Allocator2>
BOOST_MP_FORCEINLINE typename enable_if_c<!is_trivial_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value && !is_trivial_cpp_int<cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2> >::value >::type 
   eval_add(
      cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>& result, 
      const cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2>& a, 
      const signed_limb_type& o) BOOST_MP_NOEXCEPT_IF((is_non_throwing_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value))
{
   if(o < 0)
      eval_subtract(result, a, static_cast<limb_type>(boost::multiprecision::detail::unsigned_abs(o)));
   else if(o > 0)
      eval_add(result, a, static_cast<limb_type>(o));
   else if(&result != &a)
      result = a;
}
template <unsigned MinBits1, unsigned MaxBits1, cpp_integer_type SignType1, cpp_int_check_type Checked1, class Allocator1>
BOOST_MP_FORCEINLINE typename enable_if_c<!is_trivial_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value>::type 
   eval_subtract(
      cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>& result, 
      const limb_type& o) BOOST_MP_NOEXCEPT_IF((is_non_throwing_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value))
{
   if(result.sign())
   {
      add_unsigned(result, result, o);
   }
   else
      subtract_unsigned(result, result, o);
}
template <unsigned MinBits1, unsigned MaxBits1, cpp_integer_type SignType1, cpp_int_check_type Checked1, class Allocator1, unsigned MinBits2, unsigned MaxBits2, cpp_integer_type SignType2, cpp_int_check_type Checked2, class Allocator2>
BOOST_MP_FORCEINLINE typename enable_if_c<!is_trivial_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value && !is_trivial_cpp_int<cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2> >::value >::type 
   eval_subtract(
      cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>& result, 
      const cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2>& a, 
      const limb_type& o) BOOST_MP_NOEXCEPT_IF((is_non_throwing_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value))
{
   if(a.sign())
   {
      add_unsigned(result, a, o);
   }
   else
   {
      subtract_unsigned(result, a, o);
   }
}
template <unsigned MinBits1, unsigned MaxBits1, cpp_integer_type SignType1, cpp_int_check_type Checked1, class Allocator1>
BOOST_MP_FORCEINLINE typename enable_if_c<!is_trivial_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value>::type 
   eval_subtract(
      cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>& result, 
      const signed_limb_type& o) BOOST_MP_NOEXCEPT_IF((is_non_throwing_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value))
{
   if(o)
   {
      if(o < 0)
         eval_add(result, static_cast<limb_type>(boost::multiprecision::detail::unsigned_abs(o)));
      else
         eval_subtract(result, static_cast<limb_type>(o));
   }
}
template <unsigned MinBits1, unsigned MaxBits1, cpp_integer_type SignType1, cpp_int_check_type Checked1, class Allocator1, unsigned MinBits2, unsigned MaxBits2, cpp_integer_type SignType2, cpp_int_check_type Checked2, class Allocator2>
BOOST_MP_FORCEINLINE typename enable_if_c<!is_trivial_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value && !is_trivial_cpp_int<cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2> >::value >::type 
   eval_subtract(
      cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>& result, 
      const cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2>& a, 
      const signed_limb_type& o) BOOST_MP_NOEXCEPT_IF((is_non_throwing_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value))
{
   if(o)
   {
      if(o < 0)
         eval_add(result, a, static_cast<limb_type>(boost::multiprecision::detail::unsigned_abs(o)));
      else
         eval_subtract(result, a, static_cast<limb_type>(o));
   }
   else if(&result != &a)
      result = a;
}

template <unsigned MinBits1, unsigned MaxBits1, cpp_integer_type SignType1, cpp_int_check_type Checked1, class Allocator1>
BOOST_MP_FORCEINLINE typename enable_if_c<!is_trivial_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value>::type 
   eval_increment(cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>& result) BOOST_MP_NOEXCEPT_IF((is_non_throwing_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value))
{
   static const limb_type one = 1;
   if(!result.sign() && (result.limbs()[0] < cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>::max_limb_value))
      ++result.limbs()[0];
   else if(result.sign() && result.limbs()[0])
      --result.limbs()[0];
   else
      eval_add(result, one);
}
template <unsigned MinBits1, unsigned MaxBits1, cpp_integer_type SignType1, cpp_int_check_type Checked1, class Allocator1>
BOOST_MP_FORCEINLINE typename enable_if_c<!is_trivial_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value>::type 
   eval_decrement(cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>& result) BOOST_MP_NOEXCEPT_IF((is_non_throwing_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value))
{
   static const limb_type one = 1;
   if(!result.sign() && result.limbs()[0])
      --result.limbs()[0];
   else if(result.sign() && (result.limbs()[0] < cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>::max_limb_value))
      ++result.limbs()[0];
   else
      eval_subtract(result, one);
}
template <unsigned MinBits1, unsigned MaxBits1, cpp_integer_type SignType1, cpp_int_check_type Checked1, class Allocator1, unsigned MinBits2, unsigned MaxBits2, cpp_integer_type SignType2, cpp_int_check_type Checked2, class Allocator2>
BOOST_MP_FORCEINLINE typename enable_if_c<!is_trivial_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value && !is_trivial_cpp_int<cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2> >::value >::type 
   eval_subtract(
      cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>& result, 
      const cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2>& o) BOOST_MP_NOEXCEPT_IF((is_non_throwing_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value))
{
   eval_subtract(result, result, o);
}
template <unsigned MinBits1, unsigned MaxBits1, cpp_integer_type SignType1, cpp_int_check_type Checked1, class Allocator1, unsigned MinBits2, unsigned MaxBits2, cpp_integer_type SignType2, cpp_int_check_type Checked2, class Allocator2, unsigned MinBits3, unsigned MaxBits3, cpp_integer_type SignType3, cpp_int_check_type Checked3, class Allocator3>
BOOST_MP_FORCEINLINE typename enable_if_c<!is_trivial_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value && !is_trivial_cpp_int<cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2> >::value && !is_trivial_cpp_int<cpp_int_backend<MinBits3, MaxBits3, SignType3, Checked3, Allocator3> >::value >::type
   eval_subtract(
      cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>& result, 
      const cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2>& a, 
      const cpp_int_backend<MinBits3, MaxBits3, SignType3, Checked3, Allocator3>& b) BOOST_MP_NOEXCEPT_IF((is_non_throwing_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value))
{
   if(a.sign() != b.sign())
   {
      add_unsigned(result, a, b);
      return;
   }
   subtract_unsigned(result, a, b);
}

//
// Simple addition and subtraction routine for trivial cpp_int's come last:
//
// One of the arguments is signed:
//
template <unsigned MinBits1, unsigned MaxBits1, cpp_integer_type SignType1, cpp_int_check_type Checked1, class Allocator1>
inline typename enable_if_c<
         is_trivial_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value 
         && is_trivial_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value
         && (is_signed_number<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value || is_signed_number<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value)
         >::type 
   eval_add(
      cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>& result, 
      const cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>& o) BOOST_MP_NOEXCEPT_IF((is_non_throwing_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value))
{
   if(result.sign() != o.sign())
   {
      if(*o.limbs() > *result.limbs())
      {
         *result.limbs() = detail::checked_subtract(*o.limbs(), *result.limbs(), typename cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>::checked_type());
         result.negate();
      }
      else
         *result.limbs() = detail::checked_subtract(*result.limbs(), *o.limbs(), typename cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>::checked_type());
   }
   else
      *result.limbs() = detail::checked_add(*result.limbs(), *o.limbs(), typename cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>::checked_type());
   result.normalize();
}
// Simple version for two unsigned arguments:
template <unsigned MinBits1, unsigned MaxBits1, cpp_integer_type SignType1, cpp_int_check_type Checked1, class Allocator1>
BOOST_MP_FORCEINLINE typename enable_if_c<
         is_trivial_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value 
         && is_trivial_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value
         && is_unsigned_number<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value 
         && is_unsigned_number<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value
         >::type 
   eval_add(cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>& result, 
      const cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>& o) BOOST_MP_NOEXCEPT_IF((is_non_throwing_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value))
{
   *result.limbs() = detail::checked_add(*result.limbs(), *o.limbs(), typename cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>::checked_type());
   result.normalize();
}

// signed subtraction:
template <unsigned MinBits1, unsigned MaxBits1, cpp_integer_type SignType1, cpp_int_check_type Checked1, class Allocator1>
inline typename enable_if_c<
         is_trivial_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value 
         && is_trivial_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value
         && (is_signed_number<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value || is_signed_number<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value)
         >::type 
   eval_subtract(
      cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>& result, 
      const cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>& o) BOOST_MP_NOEXCEPT_IF((is_non_throwing_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value))
{
   if(result.sign() != o.sign())
   {
      *result.limbs() = detail::checked_add(*result.limbs(), *o.limbs(), typename cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>::checked_type());
   }
   else if(*result.limbs() < *o.limbs())
   {
      *result.limbs() = detail::checked_subtract(*o.limbs(), *result.limbs(), typename cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>::checked_type());
      result.negate();
   }
   else
      *result.limbs() = detail::checked_subtract(*result.limbs(), *o.limbs(), typename cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>::checked_type());
   result.normalize();
}

template <unsigned MinBits1, unsigned MaxBits1, cpp_integer_type SignType1, cpp_int_check_type Checked1, class Allocator1>
BOOST_MP_FORCEINLINE typename enable_if_c<
         is_trivial_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value 
         && is_trivial_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value
         && is_unsigned_number<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value 
         && is_unsigned_number<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value
         >::type 
   eval_subtract(
      cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>& result, 
      const cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>& o) BOOST_MP_NOEXCEPT_IF((is_non_throwing_cpp_int<cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1> >::value))
{
   *result.limbs() = detail::checked_subtract(*result.limbs(), *o.limbs(), typename cpp_int_backend<MinBits1, MaxBits1, SignType1, Checked1, Allocator1>::checked_type());
   result.normalize();
}

#ifdef _MSC_VER
#pragma warning(pop)
#endif

}}} // namespaces

#endif
