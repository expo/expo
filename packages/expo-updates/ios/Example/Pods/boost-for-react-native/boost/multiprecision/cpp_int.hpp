//////////////////3/////////////////////////////////////////////
//  Copyright 2012 John Maddock. Distributed under the Boost
//  Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_

#ifndef BOOST_MP_CPP_INT_HPP
#define BOOST_MP_CPP_INT_HPP

#include <iostream>
#include <iomanip>
#include <boost/cstdint.hpp>
#include <boost/multiprecision/number.hpp>
#include <boost/multiprecision/detail/integer_ops.hpp>
#include <boost/array.hpp>
#include <boost/type_traits/is_integral.hpp>
#include <boost/type_traits/is_floating_point.hpp>
#include <boost/multiprecision/cpp_int/cpp_int_config.hpp>
#include <boost/multiprecision/rational_adaptor.hpp>
#include <boost/multiprecision/traits/is_byte_container.hpp>
#include <boost/detail/endian.hpp>
#include <boost/integer/static_min_max.hpp>
#include <boost/type_traits/common_type.hpp>
#include <boost/type_traits/make_signed.hpp>
#include <boost/multiprecision/cpp_int/checked.hpp>
#ifdef BOOST_MP_USER_DEFINED_LITERALS
#include <boost/multiprecision/cpp_int/value_pack.hpp>
#endif

namespace boost{
namespace multiprecision{
namespace backends{

  using boost::enable_if;


#ifdef BOOST_MSVC
#pragma warning(push)
#pragma warning(disable:4307) // integral constant overflow (oveflow is in a branch not taken when it would overflow)
#pragma warning(disable:4127) // conditional expression is constant
#pragma warning(disable:4702) // Unreachable code (reachability depends on template params)
#endif

template <unsigned MinBits = 0, unsigned MaxBits = 0, boost::multiprecision::cpp_integer_type SignType = signed_magnitude, cpp_int_check_type Checked = unchecked, class Allocator = typename mpl::if_c<MinBits && (MinBits == MaxBits), void, std::allocator<limb_type> >::type >
struct cpp_int_backend;

} // namespace backends

namespace detail {

   template <unsigned MinBits, unsigned MaxBits, boost::multiprecision::cpp_integer_type SignType, cpp_int_check_type Checked, class Allocator>
   struct is_byte_container<backends::cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator> > : public boost::false_type {};

} // namespace detail

namespace backends{

template <unsigned MinBits, unsigned MaxBits, cpp_integer_type SignType, cpp_int_check_type Checked, class Allocator, bool trivial = false>
struct cpp_int_base;
//
// Traits class determines the maximum and minimum precision values:
//
template <class T> struct max_precision;

template <unsigned MinBits, unsigned MaxBits, cpp_integer_type SignType, cpp_int_check_type Checked, class Allocator>
struct max_precision<cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator> >
{
   static const unsigned value = is_void<Allocator>::value ?
      static_unsigned_max<MinBits, MaxBits>::value
      : (((MaxBits >= MinBits) && MaxBits) ? MaxBits : UINT_MAX);
};

template <class T> struct min_precision;

template <unsigned MinBits, unsigned MaxBits, cpp_integer_type SignType, cpp_int_check_type Checked, class Allocator>
struct min_precision<cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator> >
{
   static const unsigned value = (is_void<Allocator>::value ? static_unsigned_max<MinBits, MaxBits>::value : MinBits);
};
//
// Traits class determines whether the number of bits precision requested could fit in a native type,
// we call this a "trivial" cpp_int:
//
template <class T>
struct is_trivial_cpp_int
{
   static const bool value = false;
};

template <unsigned MinBits, unsigned MaxBits, cpp_integer_type SignType, cpp_int_check_type Checked, class Allocator>
struct is_trivial_cpp_int<cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator> >
{
   typedef cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator> self;
   static const bool value = is_void<Allocator>::value && (max_precision<self>::value <= (sizeof(double_limb_type) * CHAR_BIT) - (SignType == signed_packed ? 1 : 0));
};

template <unsigned MinBits, unsigned MaxBits, cpp_integer_type SignType, cpp_int_check_type Checked, class Allocator>
struct is_trivial_cpp_int<cpp_int_base<MinBits, MaxBits, SignType, Checked, Allocator, true> >
{
   static const bool value = true;
};

} // namespace backends
//
// Traits class to determine whether a cpp_int_backend is signed or not:
//
template <unsigned MinBits, unsigned MaxBits, cpp_integer_type SignType, cpp_int_check_type Checked, class Allocator>
struct is_unsigned_number<backends::cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator> >
   : public mpl::bool_<(SignType == unsigned_magnitude) || (SignType == unsigned_packed)>{};

namespace backends{
//
// Traits class determines whether T should be implicitly convertible to U, or
// whether the constructor should be made explicit.  The latter happens if we
// are losing the sign, or have fewer digits precision in the target type:
//
template <class T, class U>
struct is_implicit_cpp_int_conversion;

template <unsigned MinBits, unsigned MaxBits, cpp_integer_type SignType, cpp_int_check_type Checked, class Allocator, unsigned MinBits2, unsigned MaxBits2, cpp_integer_type SignType2, cpp_int_check_type Checked2, class Allocator2>
struct is_implicit_cpp_int_conversion<cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator>, cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2> >
{
   typedef cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator> t1;
   typedef cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2> t2;
   static const bool value =
      (is_signed_number<t2>::value || !is_signed_number<t1>::value)
      && (max_precision<t1>::value <= max_precision<t2>::value);
};

//
// Traits class to determine whether operations on a cpp_int may throw:
//
template <class T>
struct is_non_throwing_cpp_int : public mpl::false_{};
template <unsigned MinBits, unsigned MaxBits, cpp_integer_type SignType>
struct is_non_throwing_cpp_int<cpp_int_backend<MinBits, MaxBits, SignType, unchecked, void> > : public mpl::true_ {};

//
// Traits class, determines whether the cpp_int is fixed precision or not:
//
template <class T>
struct is_fixed_precision;
template <unsigned MinBits, unsigned MaxBits, cpp_integer_type SignType, cpp_int_check_type Checked, class Allocator>
struct is_fixed_precision<cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator> >
   : public mpl::bool_<max_precision<cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator> >::value != UINT_MAX> {};

namespace detail{

inline void verify_new_size(unsigned new_size, unsigned min_size, const mpl::int_<checked>&)
{
   if(new_size < min_size)
      BOOST_THROW_EXCEPTION(std::overflow_error("Unable to allocate sufficient storage for the value of the result: value overflows the maximum allowable magnitude."));
}
inline void verify_new_size(unsigned /*new_size*/, unsigned /*min_size*/, const mpl::int_<unchecked>&){}

template <class U>
inline void verify_limb_mask(bool b, U limb, U mask, const mpl::int_<checked>&)
{
   // When we mask out "limb" with "mask", do we loose bits?  If so it's an overflow error:
   if(b && (limb & ~mask))
      BOOST_THROW_EXCEPTION(std::overflow_error("Overflow in cpp_int arithmetic: there is insufficient precision in the target type to hold all of the bits of the result."));
}
template <class U>
inline void verify_limb_mask(bool /*b*/, U /*limb*/, U /*mask*/, const mpl::int_<unchecked>&){}

}

//
// Now define the various data layouts that are possible as partial specializations of the base class,
// starting with the default arbitrary precision signed integer type:
//
template <unsigned MinBits, unsigned MaxBits, cpp_int_check_type Checked, class Allocator>
struct cpp_int_base<MinBits, MaxBits, signed_magnitude, Checked, Allocator, false> : private Allocator::template rebind<limb_type>::other
{
   typedef typename Allocator::template rebind<limb_type>::other allocator_type;
   typedef typename allocator_type::pointer                      limb_pointer;
   typedef typename allocator_type::const_pointer                const_limb_pointer;
   typedef mpl::int_<Checked>                                    checked_type;

   //
   // Interface invariants:
   //
   BOOST_STATIC_ASSERT(!is_void<Allocator>::value);

private:
   struct limb_data
   {
      unsigned capacity;
      limb_pointer data;
   };

public:
   BOOST_STATIC_CONSTANT(unsigned, limb_bits = sizeof(limb_type) * CHAR_BIT);
   BOOST_STATIC_CONSTANT(limb_type, max_limb_value = ~static_cast<limb_type>(0u));
   BOOST_STATIC_CONSTANT(limb_type, sign_bit_mask = static_cast<limb_type>(1u) << (limb_bits - 1));
   BOOST_STATIC_CONSTANT(unsigned, internal_limb_count =
      MinBits
         ? (MinBits / limb_bits + ((MinBits % limb_bits) ? 1 : 0))
         : (sizeof(limb_data) / sizeof(limb_type)));
   BOOST_STATIC_CONSTANT(bool, variable = true);

private:
   union data_type
   {
      limb_data ld;
      limb_type la[internal_limb_count];
      limb_type first;
      double_limb_type double_first;

      BOOST_CONSTEXPR data_type() : first(0) {}
      BOOST_CONSTEXPR data_type(limb_type i) : first(i) {}
      BOOST_CONSTEXPR data_type(signed_limb_type i) : first(i < 0 ? static_cast<limb_type>(boost::multiprecision::detail::unsigned_abs(i)) : i) {}
#ifdef BOOST_LITTLE_ENDIAN
      BOOST_CONSTEXPR data_type(double_limb_type i) : double_first(i) {}
      BOOST_CONSTEXPR data_type(signed_double_limb_type i) : double_first(i < 0 ? static_cast<double_limb_type>(boost::multiprecision::detail::unsigned_abs(i)) : i) {}
#endif
   };

   data_type   m_data;
   unsigned    m_limbs;
   bool        m_sign, m_internal;

public:
   //
   // Direct construction:
   //
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR cpp_int_base(limb_type i)BOOST_NOEXCEPT
      : m_data(i), m_limbs(1), m_sign(false), m_internal(true) { }
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR cpp_int_base(signed_limb_type i)BOOST_NOEXCEPT
      : m_data(i), m_limbs(1), m_sign(i < 0), m_internal(true) { }
#if defined(BOOST_LITTLE_ENDIAN) && !defined(BOOST_MP_TEST_NO_LE)
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR cpp_int_base(double_limb_type i)BOOST_NOEXCEPT
      : m_data(i), m_limbs(i > max_limb_value ? 2 : 1), m_sign(false), m_internal(true) { }
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR cpp_int_base(signed_double_limb_type i)BOOST_NOEXCEPT
      : m_data(i), m_limbs(i < 0 ? (static_cast<double_limb_type>(boost::multiprecision::detail::unsigned_abs(i)) > static_cast<double_limb_type>(max_limb_value) ? 2 : 1) : (i > max_limb_value ? 2 : 1)),
        m_sign(i < 0), m_internal(true) { }
#endif
   //
   // Helper functions for getting at our internal data, and manipulating storage:
   //
   BOOST_MP_FORCEINLINE allocator_type& allocator() BOOST_NOEXCEPT { return *this; }
   BOOST_MP_FORCEINLINE const allocator_type& allocator()const BOOST_NOEXCEPT { return *this; }
   BOOST_MP_FORCEINLINE unsigned size()const  BOOST_NOEXCEPT { return m_limbs; }
   BOOST_MP_FORCEINLINE limb_pointer limbs()  BOOST_NOEXCEPT { return m_internal ? m_data.la : m_data.ld.data; }
   BOOST_MP_FORCEINLINE const_limb_pointer limbs()const  BOOST_NOEXCEPT { return m_internal ? m_data.la : m_data.ld.data; }
   BOOST_MP_FORCEINLINE unsigned capacity()const  BOOST_NOEXCEPT { return m_internal ? internal_limb_count : m_data.ld.capacity; }
   BOOST_MP_FORCEINLINE bool sign()const  BOOST_NOEXCEPT { return m_sign; }
   void sign(bool b)  BOOST_NOEXCEPT
   {
      m_sign = b;
      // Check for zero value:
      if(m_sign && (m_limbs == 1))
      {
         if(limbs()[0] == 0)
            m_sign = false;
      }
   }
   void resize(unsigned new_size, unsigned min_size)
   {
      static const unsigned max_limbs = MaxBits / (CHAR_BIT * sizeof(limb_type)) + ((MaxBits % (CHAR_BIT * sizeof(limb_type))) ? 1 : 0);
      // We never resize beyond MaxSize:
      if(new_size > max_limbs)
         new_size = max_limbs;
      detail::verify_new_size(new_size, min_size, checked_type());
      // See if we have enough capacity already:
      unsigned cap = capacity();
      if(new_size > cap)
      {
         // Allocate a new buffer and copy everything over:
         cap = (std::min)((std::max)(cap * 4, new_size), max_limbs);
         limb_pointer pl = allocator().allocate(cap);
         std::memcpy(pl, limbs(), size() * sizeof(limbs()[0]));
         if(!m_internal)
            allocator().deallocate(limbs(), capacity());
         else
            m_internal = false;
         m_limbs = new_size;
         m_data.ld.capacity = cap;
         m_data.ld.data = pl;
      }
      else
      {
         m_limbs = new_size;
      }
   }
   BOOST_MP_FORCEINLINE void normalize() BOOST_NOEXCEPT
   {
      limb_pointer p = limbs();
      while((m_limbs-1) && !p[m_limbs - 1])--m_limbs;
   }
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR cpp_int_base() BOOST_NOEXCEPT : m_data(), m_limbs(1), m_sign(false), m_internal(true) {}
   BOOST_MP_FORCEINLINE cpp_int_base(const cpp_int_base& o) : allocator_type(o), m_limbs(0), m_internal(true)
   {
      resize(o.size(), o.size());
      std::memcpy(limbs(), o.limbs(), o.size() * sizeof(limbs()[0]));
      m_sign = o.m_sign;
   }
#ifndef BOOST_NO_CXX11_RVALUE_REFERENCES
   cpp_int_base(cpp_int_base&& o)
      : allocator_type(static_cast<allocator_type&&>(o)), m_limbs(o.m_limbs), m_sign(o.m_sign), m_internal(o.m_internal)
   {
      if(m_internal)
      {
         std::memcpy(limbs(), o.limbs(), o.size() * sizeof(limbs()[0]));
      }
      else
      {
         m_data.ld = o.m_data.ld;
         o.m_limbs = 0;
         o.m_internal = true;
      }
   }
   cpp_int_base& operator = (cpp_int_base&& o) BOOST_NOEXCEPT
   {
      if(!m_internal)
         allocator().deallocate(m_data.ld.data, m_data.ld.capacity);
      *static_cast<allocator_type*>(this) = static_cast<allocator_type&&>(o);
      m_limbs = o.m_limbs;
      m_sign = o.m_sign;
      m_internal = o.m_internal;
      if(m_internal)
      {
         std::memcpy(limbs(), o.limbs(), o.size() * sizeof(limbs()[0]));
      }
      else
      {
         m_data.ld = o.m_data.ld;
         o.m_limbs = 0;
         o.m_internal = true;
      }
      return *this;
   }
#endif
   BOOST_MP_FORCEINLINE ~cpp_int_base() BOOST_NOEXCEPT
   {
      if(!m_internal)
         allocator().deallocate(limbs(), capacity());
   }
   void assign(const cpp_int_base& o)
   {
      if(this != &o)
      {
         static_cast<allocator_type&>(*this) = static_cast<const allocator_type&>(o);
         m_limbs = 0;
         resize(o.size(), o.size());
         std::memcpy(limbs(), o.limbs(), o.size() * sizeof(limbs()[0]));
         m_sign = o.m_sign;
      }
   }
   BOOST_MP_FORCEINLINE void negate() BOOST_NOEXCEPT
   {
      m_sign = !m_sign;
      // Check for zero value:
      if(m_sign && (m_limbs == 1))
      {
         if(limbs()[0] == 0)
            m_sign = false;
      }
   }
   BOOST_MP_FORCEINLINE bool isneg()const BOOST_NOEXCEPT
   {
      return m_sign;
   }
   BOOST_MP_FORCEINLINE void do_swap(cpp_int_base& o) BOOST_NOEXCEPT
   {
      std::swap(m_data, o.m_data);
      std::swap(m_sign, o.m_sign);
      std::swap(m_internal, o.m_internal);
      std::swap(m_limbs, o.m_limbs);
   }
protected:
   template <class A>
   void check_in_range(const A&) BOOST_NOEXCEPT {}
};

#ifndef BOOST_NO_INCLASS_MEMBER_INITIALIZATION

template <unsigned MinBits, unsigned MaxBits, cpp_int_check_type Checked, class Allocator>
const unsigned cpp_int_base<MinBits, MaxBits, signed_magnitude, Checked, Allocator, false>::limb_bits;
template <unsigned MinBits, unsigned MaxBits, cpp_int_check_type Checked, class Allocator>
const limb_type cpp_int_base<MinBits, MaxBits, signed_magnitude, Checked, Allocator, false>::max_limb_value;
template <unsigned MinBits, unsigned MaxBits, cpp_int_check_type Checked, class Allocator>
const limb_type cpp_int_base<MinBits, MaxBits, signed_magnitude, Checked, Allocator, false>::sign_bit_mask;
template <unsigned MinBits, unsigned MaxBits, cpp_int_check_type Checked, class Allocator>
const unsigned cpp_int_base<MinBits, MaxBits, signed_magnitude, Checked, Allocator, false>::internal_limb_count;
template <unsigned MinBits, unsigned MaxBits, cpp_int_check_type Checked, class Allocator>
const bool cpp_int_base<MinBits, MaxBits, signed_magnitude, Checked, Allocator, false>::variable;

#endif

template <unsigned MinBits, unsigned MaxBits, cpp_int_check_type Checked, class Allocator>
struct cpp_int_base<MinBits, MaxBits, unsigned_magnitude, Checked, Allocator, false> : private Allocator::template rebind<limb_type>::other
{
   //
   // There is currently no support for unsigned arbitrary precision arithmetic, largely
   // because it's not clear what subtraction should do:
   //
   BOOST_STATIC_ASSERT_MSG(((sizeof(Allocator) == 0) && !is_void<Allocator>::value), "There is curently no support for unsigned arbitrary precision integers.");
};
//
// Fixed precision (i.e. no allocator), signed-magnitude type with limb-usage count:
//
template <unsigned MinBits, cpp_int_check_type Checked>
struct cpp_int_base<MinBits, MinBits, signed_magnitude, Checked, void, false>
{
   typedef limb_type*                      limb_pointer;
   typedef const limb_type*                const_limb_pointer;
   typedef mpl::int_<Checked>              checked_type;

   //
   // Interface invariants:
   //
   BOOST_STATIC_ASSERT_MSG(MinBits > sizeof(double_limb_type) * CHAR_BIT, "Template parameter MinBits is inconsistent with the parameter trivial - did you mistakingly try to override the trivial parameter?");

public:
   BOOST_STATIC_CONSTANT(unsigned, limb_bits = sizeof(limb_type) * CHAR_BIT);
   BOOST_STATIC_CONSTANT(limb_type, max_limb_value = ~static_cast<limb_type>(0u));
   BOOST_STATIC_CONSTANT(limb_type, sign_bit_mask = static_cast<limb_type>(1u) << (limb_bits - 1));
   BOOST_STATIC_CONSTANT(unsigned, internal_limb_count = MinBits / limb_bits + ((MinBits % limb_bits) ? 1 : 0));
   BOOST_STATIC_CONSTANT(bool, variable = false);
   BOOST_STATIC_CONSTANT(limb_type, upper_limb_mask = (MinBits % limb_bits) ? (limb_type(1) << (MinBits % limb_bits)) -1 : (~limb_type(0)));
   BOOST_STATIC_ASSERT_MSG(internal_limb_count >= 2, "A fixed precision integer type must have at least 2 limbs");

private:
   union data_type{
      limb_type          m_data[internal_limb_count];
      limb_type          m_first_limb;
      double_limb_type   m_double_first_limb;

      BOOST_CONSTEXPR data_type() : m_first_limb(0) {}
      BOOST_CONSTEXPR data_type(limb_type i) : m_first_limb(i) {}
      BOOST_CONSTEXPR data_type(double_limb_type i) : m_double_first_limb(i) {}
#if defined(BOOST_MP_USER_DEFINED_LITERALS)
      template <limb_type...VALUES>
      BOOST_CONSTEXPR data_type(literals::detail::value_pack<VALUES...>) : m_data{ VALUES... } {}
#endif
   } m_wrapper;
   boost::uint16_t    m_limbs;
   bool               m_sign;

public:
   //
   // Direct construction:
   //
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR cpp_int_base(limb_type i)BOOST_NOEXCEPT
      : m_wrapper(i), m_limbs(1), m_sign(false) {}
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR cpp_int_base(signed_limb_type i)BOOST_NOEXCEPT
      : m_wrapper(limb_type(i < 0 ? static_cast<limb_type>(-static_cast<signed_double_limb_type>(i)) : i)), m_limbs(1), m_sign(i < 0) {}
#if defined(BOOST_LITTLE_ENDIAN) && !defined(BOOST_MP_TEST_NO_LE)
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR cpp_int_base(double_limb_type i)BOOST_NOEXCEPT
      : m_wrapper(i), m_limbs(i > max_limb_value ? 2 : 1), m_sign(false) {}
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR cpp_int_base(signed_double_limb_type i)BOOST_NOEXCEPT
      : m_wrapper(double_limb_type(i < 0 ? static_cast<double_limb_type>(boost::multiprecision::detail::unsigned_abs(i)) : i)),
        m_limbs(i < 0 ? (static_cast<double_limb_type>(boost::multiprecision::detail::unsigned_abs(i)) > max_limb_value ? 2 : 1) : (i > max_limb_value ? 2 : 1)),
        m_sign(i < 0) {}
#endif
#if defined(BOOST_MP_USER_DEFINED_LITERALS)
      template <limb_type...VALUES>
      BOOST_CONSTEXPR cpp_int_base(literals::detail::value_pack<VALUES...> i)
         : m_wrapper(i), m_limbs(sizeof...(VALUES)), m_sign(false) {}
      BOOST_CONSTEXPR cpp_int_base(literals::detail::value_pack<> i)
         : m_wrapper(i), m_limbs(1), m_sign(false) {}
      BOOST_CONSTEXPR cpp_int_base(const cpp_int_base& a, const literals::detail::negate_tag&)
         : m_wrapper(a.m_wrapper), m_limbs(a.m_limbs), m_sign((a.m_limbs == 1) && (*a.limbs() == 0) ? false : !a.m_sign) {}
#endif
   //
   // Helper functions for getting at our internal data, and manipulating storage:
   //
   BOOST_MP_FORCEINLINE unsigned size()const BOOST_NOEXCEPT { return m_limbs; }
   BOOST_MP_FORCEINLINE limb_pointer limbs() BOOST_NOEXCEPT { return m_wrapper.m_data; }
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR const_limb_pointer limbs()const BOOST_NOEXCEPT { return m_wrapper.m_data; }
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR bool sign()const BOOST_NOEXCEPT { return m_sign; }
   BOOST_MP_FORCEINLINE void sign(bool b) BOOST_NOEXCEPT
   {
      m_sign = b;
      // Check for zero value:
      if(m_sign && (m_limbs == 1))
      {
         if(limbs()[0] == 0)
            m_sign = false;
      }
   }
   BOOST_MP_FORCEINLINE void resize(unsigned new_size, unsigned min_size) BOOST_MP_NOEXCEPT_IF((Checked == unchecked))
   {
      m_limbs = static_cast<boost::uint16_t>((std::min)(new_size, internal_limb_count));
      detail::verify_new_size(m_limbs, min_size, checked_type());
   }
   BOOST_MP_FORCEINLINE void normalize() BOOST_MP_NOEXCEPT_IF((Checked == unchecked))
   {
      limb_pointer p = limbs();
      detail::verify_limb_mask(m_limbs == internal_limb_count, p[internal_limb_count-1], upper_limb_mask, checked_type());
      p[internal_limb_count-1] &= upper_limb_mask;
      while((m_limbs-1) && !p[m_limbs - 1])--m_limbs;
      if((m_limbs == 1) && (!*p)) m_sign = false; // zero is always unsigned
   }

   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR cpp_int_base()BOOST_NOEXCEPT : m_wrapper(limb_type(0u)), m_limbs(1), m_sign(false) {}
   // Not defaulted, it breaks constexpr support in the Intel compiler for some reason:
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR cpp_int_base(const cpp_int_base& o)BOOST_NOEXCEPT
      : m_wrapper(o.m_wrapper), m_limbs(o.m_limbs), m_sign(o.m_sign) {}
   // Defaulted functions:
   //~cpp_int_base() BOOST_NOEXCEPT {}

   void assign(const cpp_int_base& o) BOOST_NOEXCEPT
   {
      if(this != &o)
      {
         m_limbs = o.m_limbs;
         std::memcpy(limbs(), o.limbs(), o.size() * sizeof(o.limbs()[0]));
         m_sign = o.m_sign;
      }
   }
   BOOST_MP_FORCEINLINE void negate() BOOST_NOEXCEPT
   {
      m_sign = !m_sign;
      // Check for zero value:
      if(m_sign && (m_limbs == 1))
      {
         if(limbs()[0] == 0)
            m_sign = false;
      }
   }
   BOOST_MP_FORCEINLINE bool isneg()const BOOST_NOEXCEPT
   {
      return m_sign;
   }
   BOOST_MP_FORCEINLINE void do_swap(cpp_int_base& o) BOOST_NOEXCEPT
   {
      for(unsigned i = 0; i < (std::max)(size(), o.size()); ++i)
         std::swap(m_wrapper.m_data[i], o.m_wrapper.m_data[i]);
      std::swap(m_sign, o.m_sign);
      std::swap(m_limbs, o.m_limbs);
   }
protected:
   template <class A>
   void check_in_range(const A&) BOOST_NOEXCEPT {}
};
#ifndef BOOST_NO_INCLASS_MEMBER_INITIALIZATION

template <unsigned MinBits, cpp_int_check_type Checked>
const unsigned cpp_int_base<MinBits, MinBits, signed_magnitude, Checked, void, false>::limb_bits;
template <unsigned MinBits, cpp_int_check_type Checked>
const limb_type cpp_int_base<MinBits, MinBits, signed_magnitude, Checked, void, false>::max_limb_value;
template <unsigned MinBits, cpp_int_check_type Checked>
const limb_type cpp_int_base<MinBits, MinBits, signed_magnitude, Checked, void, false>::sign_bit_mask;
template <unsigned MinBits, cpp_int_check_type Checked>
const unsigned cpp_int_base<MinBits, MinBits, signed_magnitude, Checked, void, false>::internal_limb_count;
template <unsigned MinBits, cpp_int_check_type Checked>
const bool cpp_int_base<MinBits, MinBits, signed_magnitude, Checked, void, false>::variable;

#endif
//
// Fixed precision (i.e. no allocator), unsigned type with limb-usage count:
//
template <unsigned MinBits, cpp_int_check_type Checked>
struct cpp_int_base<MinBits, MinBits, unsigned_magnitude, Checked, void, false>
{
   typedef limb_type*                      limb_pointer;
   typedef const limb_type*                const_limb_pointer;
   typedef mpl::int_<Checked>              checked_type;

   //
   // Interface invariants:
   //
   BOOST_STATIC_ASSERT_MSG(MinBits > sizeof(double_limb_type) * CHAR_BIT, "Template parameter MinBits is inconsistent with the parameter trivial - did you mistakingly try to override the trivial parameter?");

public:
   BOOST_STATIC_CONSTANT(unsigned, limb_bits = sizeof(limb_type) * CHAR_BIT);
   BOOST_STATIC_CONSTANT(limb_type, max_limb_value = ~static_cast<limb_type>(0u));
   BOOST_STATIC_CONSTANT(limb_type, sign_bit_mask = static_cast<limb_type>(1u) << (limb_bits - 1));
   BOOST_STATIC_CONSTANT(unsigned, internal_limb_count = MinBits / limb_bits + ((MinBits % limb_bits) ? 1 : 0));
   BOOST_STATIC_CONSTANT(bool, variable = false);
   BOOST_STATIC_CONSTANT(limb_type, upper_limb_mask = (MinBits % limb_bits) ? (limb_type(1) << (MinBits % limb_bits)) -1 : (~limb_type(0)));
   BOOST_STATIC_ASSERT_MSG(internal_limb_count >= 2, "A fixed precision integer type must have at least 2 limbs");

private:
   union data_type{
      limb_type          m_data[internal_limb_count];
      limb_type          m_first_limb;
      double_limb_type   m_double_first_limb;

      BOOST_CONSTEXPR data_type() : m_first_limb(0) {}
      BOOST_CONSTEXPR data_type(limb_type i) : m_first_limb(i) {}
      BOOST_CONSTEXPR data_type(double_limb_type i) : m_double_first_limb(i) {}
#if defined(BOOST_MP_USER_DEFINED_LITERALS)
      template <limb_type...VALUES>
      BOOST_CONSTEXPR data_type(literals::detail::value_pack<VALUES...>) : m_data{ VALUES... } {}
#endif
   } m_wrapper;
   limb_type          m_limbs;

public:
   //
   // Direct construction:
   //
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR cpp_int_base(limb_type i)BOOST_NOEXCEPT
      : m_wrapper(i), m_limbs(1) {}
   BOOST_MP_FORCEINLINE cpp_int_base(signed_limb_type i)BOOST_MP_NOEXCEPT_IF((Checked == unchecked))
      : m_wrapper(limb_type(i < 0 ? static_cast<limb_type>(-static_cast<signed_double_limb_type>(i)) : i)), m_limbs(1) { if(i < 0) negate(); }
#if defined(BOOST_LITTLE_ENDIAN) && !defined(BOOST_MP_TEST_NO_LE)
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR cpp_int_base(double_limb_type i)BOOST_NOEXCEPT
      : m_wrapper(i), m_limbs(i > max_limb_value ? 2 : 1) {}
   BOOST_MP_FORCEINLINE cpp_int_base(signed_double_limb_type i)BOOST_MP_NOEXCEPT_IF((Checked == unchecked))
      : m_wrapper(double_limb_type(i < 0 ? static_cast<double_limb_type>(boost::multiprecision::detail::unsigned_abs(i)) : i)), 
      m_limbs(i < 0 ? (static_cast<double_limb_type>(boost::multiprecision::detail::unsigned_abs(i)) > max_limb_value ? 2 : 1) : (i > max_limb_value ? 2 : 1)) 
   {
      if (i < 0) negate();
   }
#endif
#if defined(BOOST_MP_USER_DEFINED_LITERALS)
      template <limb_type...VALUES>
      BOOST_CONSTEXPR cpp_int_base(literals::detail::value_pack<VALUES...> i)
         : m_wrapper(i), m_limbs(sizeof...(VALUES)) {}
      BOOST_CONSTEXPR cpp_int_base(literals::detail::value_pack<>)
         : m_wrapper(static_cast<limb_type>(0u)), m_limbs(1) {}
#endif
   //
   // Helper functions for getting at our internal data, and manipulating storage:
   //
   BOOST_MP_FORCEINLINE unsigned size()const BOOST_NOEXCEPT { return m_limbs; }
   BOOST_MP_FORCEINLINE limb_pointer limbs() BOOST_NOEXCEPT { return m_wrapper.m_data; }
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR const_limb_pointer limbs()const BOOST_NOEXCEPT { return m_wrapper.m_data; }
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR bool sign()const BOOST_NOEXCEPT { return false; }
   BOOST_MP_FORCEINLINE void sign(bool b) BOOST_MP_NOEXCEPT_IF((Checked == unchecked)) {  if(b) negate(); }
   BOOST_MP_FORCEINLINE void resize(unsigned new_size, unsigned min_size) BOOST_MP_NOEXCEPT_IF((Checked == unchecked))
   {
      m_limbs = (std::min)(new_size, internal_limb_count);
      detail::verify_new_size(m_limbs, min_size, checked_type());
   }
   BOOST_MP_FORCEINLINE void normalize() BOOST_MP_NOEXCEPT_IF((Checked == unchecked))
   {
      limb_pointer p = limbs();
      detail::verify_limb_mask(m_limbs == internal_limb_count, p[internal_limb_count-1], upper_limb_mask, checked_type());
      p[internal_limb_count-1] &= upper_limb_mask;
      while((m_limbs-1) && !p[m_limbs - 1])--m_limbs;
   }

   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR cpp_int_base() BOOST_NOEXCEPT
      : m_wrapper(limb_type(0u)), m_limbs(1) {}
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR cpp_int_base(const cpp_int_base& o) BOOST_NOEXCEPT
      : m_wrapper(o.m_wrapper), m_limbs(o.m_limbs) {}
   // Defaulted functions:
   //~cpp_int_base() BOOST_NOEXCEPT {}

   BOOST_MP_FORCEINLINE void assign(const cpp_int_base& o) BOOST_NOEXCEPT
   {
      if(this != &o)
      {
         m_limbs = o.m_limbs;
         std::memcpy(limbs(), o.limbs(), o.size() * sizeof(limbs()[0]));
      }
   }
private:
   void check_negate(const mpl::int_<checked>&)
   {
      BOOST_THROW_EXCEPTION(std::range_error("Attempt to negate an unsigned number."));
   }
   void check_negate(const mpl::int_<unchecked>&){}
public:
   void negate() BOOST_MP_NOEXCEPT_IF((Checked == unchecked))
   {
      // Not so much a negate as a complement - this gets called when subtraction
      // would result in a "negative" number:
      unsigned i;
      if((m_limbs == 1) && (m_wrapper.m_data[0] == 0))
         return; // negating zero is always zero, and always OK.
      check_negate(checked_type());
      for(i = m_limbs; i < internal_limb_count; ++i)
         m_wrapper.m_data[i] = 0;
      m_limbs = internal_limb_count;
      for(i = 0; i < internal_limb_count; ++i)
         m_wrapper.m_data[i] = ~m_wrapper.m_data[i];
      normalize();
      eval_increment(static_cast<cpp_int_backend<MinBits, MinBits, unsigned_magnitude, Checked, void>& >(*this));
   }
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR bool isneg()const BOOST_NOEXCEPT
   {
      return false;
   }
   BOOST_MP_FORCEINLINE void do_swap(cpp_int_base& o) BOOST_NOEXCEPT
   {
      for(unsigned i = 0; i < (std::max)(size(), o.size()); ++i)
         std::swap(m_wrapper.m_data[i], o.m_wrapper.m_data[i]);
      std::swap(m_limbs, o.m_limbs);
   }
protected:
   template <class A>
   void check_in_range(const A&) BOOST_NOEXCEPT {}
};
#ifndef BOOST_NO_INCLASS_MEMBER_INITIALIZATION

template <unsigned MinBits, cpp_int_check_type Checked>
const unsigned cpp_int_base<MinBits, MinBits, unsigned_magnitude, Checked, void, false>::limb_bits;
template <unsigned MinBits, cpp_int_check_type Checked>
const limb_type cpp_int_base<MinBits, MinBits, unsigned_magnitude, Checked, void, false>::max_limb_value;
template <unsigned MinBits, cpp_int_check_type Checked>
const limb_type cpp_int_base<MinBits, MinBits, unsigned_magnitude, Checked, void, false>::sign_bit_mask;
template <unsigned MinBits, cpp_int_check_type Checked>
const unsigned cpp_int_base<MinBits, MinBits, unsigned_magnitude, Checked, void, false>::internal_limb_count;
template <unsigned MinBits, cpp_int_check_type Checked>
const bool cpp_int_base<MinBits, MinBits, unsigned_magnitude, Checked, void, false>::variable;

#endif
//
// Traits classes to figure out a native type with N bits, these vary from boost::uint_t<N> only
// because some platforms have native integer types longer than boost::long_long_type, "really boost::long_long_type" anyone??
//
template <unsigned N, bool s>
struct trivial_limb_type_imp
{
   typedef double_limb_type type;
};

template <unsigned N>
struct trivial_limb_type_imp<N, true>
{
   typedef typename boost::uint_t<N>::least type;
};

template <unsigned N>
struct trivial_limb_type : public trivial_limb_type_imp<N, N <= sizeof(boost::long_long_type) * CHAR_BIT> {};
//
// Backend for fixed precision signed-magnitude type which will fit entirely inside a "double_limb_type":
//
template <unsigned MinBits, cpp_int_check_type Checked>
struct cpp_int_base<MinBits, MinBits, signed_magnitude, Checked, void, true>
{
   typedef typename trivial_limb_type<MinBits>::type  local_limb_type;
   typedef local_limb_type*                           limb_pointer;
   typedef const local_limb_type*                     const_limb_pointer;
   typedef mpl::int_<Checked>                         checked_type;
protected:
   BOOST_STATIC_CONSTANT(unsigned, limb_bits = sizeof(local_limb_type) * CHAR_BIT);
   BOOST_STATIC_CONSTANT(local_limb_type, limb_mask = (MinBits < limb_bits) ? local_limb_type((local_limb_type(~local_limb_type(0))) >> (limb_bits - MinBits)) : local_limb_type(~local_limb_type(0)));
private:
   local_limb_type    m_data;
   bool               m_sign;

   //
   // Interface invariants:
   //
   BOOST_STATIC_ASSERT_MSG(MinBits <= sizeof(double_limb_type) * CHAR_BIT, "Template parameter MinBits is inconsistent with the parameter trivial - did you mistakingly try to override the trivial parameter?");
protected:
   template <class T>
   typename boost::disable_if_c<!boost::is_integral<T>::value || (std::numeric_limits<T>::is_specialized && (std::numeric_limits<T>::digits <= (int)MinBits))>::type
      check_in_range(T val, const mpl::int_<checked>&)
   {
      typedef typename common_type<typename make_unsigned<T>::type, local_limb_type>::type common_type;

      if(static_cast<common_type>(boost::multiprecision::detail::unsigned_abs(val)) > static_cast<common_type>(limb_mask))
         BOOST_THROW_EXCEPTION(std::range_error("The argument to a cpp_int constructor exceeded the largest value it can represent."));
   }
   template <class T>
   typename boost::disable_if_c<boost::is_integral<T>::value || (std::numeric_limits<T>::is_specialized && (std::numeric_limits<T>::digits <= (int)MinBits))>::type
      check_in_range(T val, const mpl::int_<checked>&)
   {
         using std::abs;
         typedef typename common_type<T, local_limb_type>::type common_type;

         if (static_cast<common_type>(abs(val)) > static_cast<common_type>(limb_mask))
            BOOST_THROW_EXCEPTION(std::range_error("The argument to a cpp_int constructor exceeded the largest value it can represent."));
   }
   template <class T, int C>
   void check_in_range(T, const mpl::int_<C>&) BOOST_NOEXCEPT {}

   template <class T>
   void check_in_range(T val) BOOST_MP_NOEXCEPT_IF(noexcept(std::declval<cpp_int_base>().check_in_range(std::declval<T>(), checked_type())))
   {
      check_in_range(val, checked_type());
   }

public:
   //
   // Direct construction:
   //
   template <class SI>
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR cpp_int_base(SI i, typename boost::enable_if_c<is_signed<SI>::value && (Checked == unchecked) >::type const* = 0) BOOST_MP_NOEXCEPT_IF(noexcept(std::declval<cpp_int_base>().check_in_range(std::declval<SI>())))
      : m_data(i < 0 ? static_cast<local_limb_type>(static_cast<typename make_unsigned<SI>::type>(boost::multiprecision::detail::unsigned_abs(i)) & limb_mask) : static_cast<local_limb_type>(i & limb_mask)), m_sign(i < 0) {}
   template <class SI>
   BOOST_MP_FORCEINLINE cpp_int_base(SI i, typename boost::enable_if_c<is_signed<SI>::value && (Checked == checked) >::type const* = 0) BOOST_MP_NOEXCEPT_IF(noexcept(std::declval<cpp_int_base>().check_in_range(std::declval<SI>())))
      : m_data(i < 0 ? (static_cast<local_limb_type>(static_cast<typename make_unsigned<SI>::type>(boost::multiprecision::detail::unsigned_abs(i)) & limb_mask)) : static_cast<local_limb_type>(i & limb_mask)), m_sign(i < 0)
   { check_in_range(i); }
   template <class UI>
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR cpp_int_base(UI i, typename boost::enable_if_c<is_unsigned<UI>::value && (Checked == unchecked)>::type const* = 0) BOOST_NOEXCEPT
      : m_data(static_cast<local_limb_type>(i) & limb_mask), m_sign(false) {}
   template <class UI>
   BOOST_MP_FORCEINLINE cpp_int_base(UI i, typename boost::enable_if_c<is_unsigned<UI>::value && (Checked == checked)>::type const* = 0) BOOST_MP_NOEXCEPT_IF(noexcept(std::declval<cpp_int_base>().check_in_range(std::declval<UI>())))
      : m_data(static_cast<local_limb_type>(i) & limb_mask), m_sign(false) { check_in_range(i); }
   template <class F>
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR cpp_int_base(F i, typename boost::enable_if_c<is_floating_point<F>::value && (Checked == unchecked)>::type const* = 0) BOOST_NOEXCEPT
      : m_data(static_cast<local_limb_type>(std::fabs(i)) & limb_mask), m_sign(i < 0) {}
   template <class F>
   BOOST_MP_FORCEINLINE cpp_int_base(F i, typename boost::enable_if_c<is_floating_point<F>::value && (Checked == checked)>::type const* = 0)
      : m_data(static_cast<local_limb_type>(std::fabs(i)) & limb_mask), m_sign(i < 0) { check_in_range(i); }
#if defined(BOOST_MP_USER_DEFINED_LITERALS)
      BOOST_CONSTEXPR cpp_int_base(literals::detail::value_pack<>) BOOST_NOEXCEPT
         : m_data(static_cast<local_limb_type>(0u)), m_sign(false) {}
      template <limb_type a>
      BOOST_CONSTEXPR cpp_int_base(literals::detail::value_pack<a>)BOOST_NOEXCEPT
         : m_data(static_cast<local_limb_type>(a)), m_sign(false) {}
      template <limb_type a, limb_type b>
      BOOST_CONSTEXPR cpp_int_base(literals::detail::value_pack<a, b>)BOOST_NOEXCEPT
         : m_data(static_cast<local_limb_type>(a) | (static_cast<local_limb_type>(b) << bits_per_limb)), m_sign(false) {}
      BOOST_CONSTEXPR cpp_int_base(const cpp_int_base& a, const literals::detail::negate_tag&)BOOST_NOEXCEPT
         : m_data(a.m_data), m_sign(a.m_data ? !a.m_sign : false) {}
#endif
   //
   // Helper functions for getting at our internal data, and manipulating storage:
   //
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR unsigned size()const BOOST_NOEXCEPT { return 1; }
   BOOST_MP_FORCEINLINE limb_pointer limbs() BOOST_NOEXCEPT { return &m_data; }
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR const_limb_pointer limbs()const BOOST_NOEXCEPT { return &m_data; }
   BOOST_MP_FORCEINLINE bool sign()const BOOST_NOEXCEPT { return m_sign; }
   BOOST_MP_FORCEINLINE void sign(bool b) BOOST_NOEXCEPT
   {
      m_sign = b;
      // Check for zero value:
      if(m_sign && !m_data)
      {
         m_sign = false;
      }
   }
   BOOST_MP_FORCEINLINE void resize(unsigned new_size, unsigned min_size)
   {
      detail::verify_new_size(2, min_size, checked_type());
   }
   BOOST_MP_FORCEINLINE void normalize() BOOST_MP_NOEXCEPT_IF((Checked == unchecked))
   {
      if(!m_data)
         m_sign = false; // zero is always unsigned
      detail::verify_limb_mask(true, m_data, limb_mask, checked_type());
      m_data &= limb_mask;
   }

   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR cpp_int_base() BOOST_NOEXCEPT : m_data(0), m_sign(false) {}
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR cpp_int_base(const cpp_int_base& o) BOOST_NOEXCEPT
      : m_data(o.m_data), m_sign(o.m_sign) {}
   //~cpp_int_base() BOOST_NOEXCEPT {}
   BOOST_MP_FORCEINLINE void assign(const cpp_int_base& o) BOOST_NOEXCEPT
   {
      m_data = o.m_data;
      m_sign = o.m_sign;
   }
   BOOST_MP_FORCEINLINE void negate() BOOST_NOEXCEPT
   {
      m_sign = !m_sign;
      // Check for zero value:
      if(m_data == 0)
      {
         m_sign = false;
      }
   }
   BOOST_MP_FORCEINLINE bool isneg()const BOOST_NOEXCEPT
   {
      return m_sign;
   }
   BOOST_MP_FORCEINLINE void do_swap(cpp_int_base& o) BOOST_NOEXCEPT
   {
      std::swap(m_sign, o.m_sign);
      std::swap(m_data, o.m_data);
   }
};
//
// Backend for unsigned fixed precision (i.e. no allocator) type which will fit entirely inside a "double_limb_type":
//
template <unsigned MinBits, cpp_int_check_type Checked>
struct cpp_int_base<MinBits, MinBits, unsigned_magnitude, Checked, void, true>
{
   typedef typename trivial_limb_type<MinBits>::type  local_limb_type;
   typedef local_limb_type*                           limb_pointer;
   typedef const local_limb_type*                     const_limb_pointer;
private:
   BOOST_STATIC_CONSTANT(unsigned, limb_bits = sizeof(local_limb_type) * CHAR_BIT);
   BOOST_STATIC_CONSTANT(local_limb_type, limb_mask = limb_bits != MinBits ? 
      static_cast<local_limb_type>(static_cast<local_limb_type>(~local_limb_type(0)) >> (limb_bits - MinBits))
      : static_cast<local_limb_type>(~local_limb_type(0)));

   local_limb_type    m_data;

   typedef mpl::int_<Checked>                          checked_type;

   //
   // Interface invariants:
   //
   BOOST_STATIC_ASSERT_MSG(MinBits <= sizeof(double_limb_type) * CHAR_BIT, "Template parameter MinBits is inconsistent with the parameter trivial - did you mistakingly try to override the trivial parameter?");
protected:
   template <class T>
   typename boost::disable_if_c<std::numeric_limits<T>::is_specialized && (std::numeric_limits<T>::digits <= (int)MinBits)>::type
      check_in_range(T val, const mpl::int_<checked>&, const boost::false_type&)
   {
      typedef typename common_type<T, local_limb_type>::type common_type;

      if(static_cast<common_type>(val) > limb_mask)
         BOOST_THROW_EXCEPTION(std::range_error("The argument to a cpp_int constructor exceeded the largest value it can represent."));
   }
   template <class T>
   void check_in_range(T val, const mpl::int_<checked>&, const boost::true_type&)
   {
      typedef typename common_type<T, local_limb_type>::type common_type;

      if(static_cast<common_type>(val) > limb_mask)
         BOOST_THROW_EXCEPTION(std::range_error("The argument to a cpp_int constructor exceeded the largest value it can represent."));
      if(val < 0)
         BOOST_THROW_EXCEPTION(std::range_error("The argument to an unsigned cpp_int constructor was negative."));
   }
   template <class T, int C, bool B>
   BOOST_MP_FORCEINLINE void check_in_range(T, const mpl::int_<C>&, const boost::integral_constant<bool, B>&) BOOST_NOEXCEPT {}

   template <class T>
   BOOST_MP_FORCEINLINE void check_in_range(T val) BOOST_MP_NOEXCEPT_IF(noexcept(std::declval<cpp_int_base>().check_in_range(std::declval<T>(), checked_type(), is_signed<T>())))
   {
      check_in_range(val, checked_type(), is_signed<T>());
   }

public:
   //
   // Direct construction:
   //
#ifdef __MSVC_RUNTIME_CHECKS
   template <class SI>
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR cpp_int_base(SI i, typename boost::enable_if_c<is_signed<SI>::value && (Checked == unchecked) >::type const* = 0) BOOST_NOEXCEPT
      : m_data(i < 0 ? (1 + ~static_cast<local_limb_type>(-i & limb_mask)) & limb_mask : static_cast<local_limb_type>(i & limb_mask)) {}
   template <class SI>
   BOOST_MP_FORCEINLINE cpp_int_base(SI i, typename boost::enable_if_c<is_signed<SI>::value && (Checked == checked) >::type const* = 0) BOOST_MP_NOEXCEPT_IF(noexcept(std::declval<cpp_int_base>().check_in_range(std::declval<SI>())))
      : m_data(i < 0 ? 1 + ~static_cast<local_limb_type>(-i & limb_mask) : static_cast<local_limb_type>(i & limb_mask)) { check_in_range(i); }
   template <class UI>
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR cpp_int_base(UI i, typename boost::enable_if_c<is_unsigned<UI>::value && (Checked == unchecked) >::type const* = 0) BOOST_NOEXCEPT
      : m_data(static_cast<local_limb_type>(i & limb_mask)) {}
   template <class UI>
   BOOST_MP_FORCEINLINE cpp_int_base(UI i, typename boost::enable_if_c<is_unsigned<UI>::value && (Checked == checked) >::type const* = 0) BOOST_MP_NOEXCEPT_IF(noexcept(std::declval<cpp_int_base>().check_in_range(std::declval<UI>())))
      : m_data(static_cast<local_limb_type>(i & limb_mask)) { check_in_range(i); }
#else
   template <class SI>
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR cpp_int_base(SI i, typename boost::enable_if_c<is_signed<SI>::value && (Checked == unchecked) >::type const* = 0) BOOST_NOEXCEPT
      : m_data(i < 0 ? (1 + ~static_cast<local_limb_type>(-i)) & limb_mask : static_cast<local_limb_type>(i) & limb_mask) {}
   template <class SI>
   BOOST_MP_FORCEINLINE cpp_int_base(SI i, typename boost::enable_if_c<is_signed<SI>::value && (Checked == checked) >::type const* = 0) BOOST_MP_NOEXCEPT_IF(noexcept(std::declval<cpp_int_base>().check_in_range(std::declval<SI>())))
      : m_data(i < 0 ? 1 + ~static_cast<local_limb_type>(-i) : static_cast<local_limb_type>(i)) { check_in_range(i); }
   template <class UI>
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR cpp_int_base(UI i, typename boost::enable_if_c<is_unsigned<UI>::value && (Checked == unchecked) >::type const* = 0) BOOST_NOEXCEPT
      : m_data(static_cast<local_limb_type>(i) & limb_mask) {}
   template <class UI>
   BOOST_MP_FORCEINLINE cpp_int_base(UI i, typename boost::enable_if_c<is_unsigned<UI>::value && (Checked == checked) >::type const* = 0) BOOST_MP_NOEXCEPT_IF(noexcept(std::declval<cpp_int_base>().check_in_range(std::declval<UI>())))
      : m_data(static_cast<local_limb_type>(i)) { check_in_range(i); }
#endif
   template <class F>
   BOOST_MP_FORCEINLINE cpp_int_base(F i, typename boost::enable_if<is_floating_point<F> >::type const* = 0) BOOST_MP_NOEXCEPT_IF((Checked == unchecked))
      : m_data(static_cast<local_limb_type>(std::fabs(i)) & limb_mask)
   {
      check_in_range(i);
      if(i < 0)
         negate();
   }
#if defined(BOOST_MP_USER_DEFINED_LITERALS)
      BOOST_CONSTEXPR cpp_int_base(literals::detail::value_pack<>) BOOST_NOEXCEPT
         : m_data(static_cast<local_limb_type>(0u)) {}
      template <limb_type a>
      BOOST_CONSTEXPR cpp_int_base(literals::detail::value_pack<a>) BOOST_NOEXCEPT
         : m_data(static_cast<local_limb_type>(a)) {}
      template <limb_type a, limb_type b>
      BOOST_CONSTEXPR cpp_int_base(literals::detail::value_pack<a, b>) BOOST_NOEXCEPT
         : m_data(static_cast<local_limb_type>(a) | (static_cast<local_limb_type>(b) << bits_per_limb)) {}
#endif
   //
   // Helper functions for getting at our internal data, and manipulating storage:
   //
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR unsigned size()const BOOST_NOEXCEPT { return 1; }
   BOOST_MP_FORCEINLINE limb_pointer limbs() BOOST_NOEXCEPT { return &m_data; }
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR const_limb_pointer limbs()const BOOST_NOEXCEPT { return &m_data; }
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR bool sign()const BOOST_NOEXCEPT { return false; }
   BOOST_MP_FORCEINLINE void sign(bool b) BOOST_MP_NOEXCEPT_IF((Checked == unchecked))
   {
      if(b)
         negate();
   }
   BOOST_MP_FORCEINLINE void resize(unsigned, unsigned min_size)
   {
      detail::verify_new_size(2, min_size, checked_type());
   }
   BOOST_MP_FORCEINLINE void normalize() BOOST_MP_NOEXCEPT_IF((Checked == unchecked))
   {
      detail::verify_limb_mask(true, m_data, limb_mask, checked_type());
      m_data &= limb_mask;
   }

   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR cpp_int_base() BOOST_NOEXCEPT : m_data(0) {}
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR cpp_int_base(const cpp_int_base& o) BOOST_NOEXCEPT
      : m_data(o.m_data) {}
   //~cpp_int_base() BOOST_NOEXCEPT {}
   BOOST_MP_FORCEINLINE void assign(const cpp_int_base& o) BOOST_NOEXCEPT
   {
      m_data = o.m_data;
   }
   BOOST_MP_FORCEINLINE void negate() BOOST_MP_NOEXCEPT_IF((Checked == unchecked))
   {
      if(Checked == checked)
      {
         BOOST_THROW_EXCEPTION(std::range_error("Attempt to negate an unsigned type."));
      }
      m_data = ~m_data;
      ++m_data;
   }
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR bool isneg()const BOOST_NOEXCEPT
   {
      return false;
   }
   BOOST_MP_FORCEINLINE void do_swap(cpp_int_base& o) BOOST_NOEXCEPT
   {
      std::swap(m_data, o.m_data);
   }
};
//
// Traits class, lets us know whether type T can be directly converted to the base type,
// used to enable/disable constructors etc:
//
template <class Arg, class Base>
struct is_allowed_cpp_int_base_conversion : public mpl::if_c<
      is_same<Arg, limb_type>::value || is_same<Arg, signed_limb_type>::value
#if defined(BOOST_LITTLE_ENDIAN) && !defined(BOOST_MP_TEST_NO_LE)
      || is_same<Arg, double_limb_type>::value || is_same<Arg, signed_double_limb_type>::value
#endif
#if defined(BOOST_MP_USER_DEFINED_LITERALS)
      || literals::detail::is_value_pack<Arg>::value
#endif
      || (is_trivial_cpp_int<Base>::value && is_arithmetic<Arg>::value),
      mpl::true_,
      mpl::false_
   >::type
{};
//
// Now the actual backend, normalising parameters passed to the base class:
//
template <unsigned MinBits, unsigned MaxBits, cpp_integer_type SignType, cpp_int_check_type Checked, class Allocator>
struct cpp_int_backend
   : public cpp_int_base<
               min_precision<cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator> >::value,
               max_precision<cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator> >::value,
               SignType,
               Checked,
               Allocator,
               is_trivial_cpp_int<cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator> >::value>
{
   typedef cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator>    self_type;
   typedef cpp_int_base<
               min_precision<self_type>::value,
               max_precision<self_type>::value,
               SignType,
               Checked,
               Allocator,
               is_trivial_cpp_int<self_type>::value>                 base_type;
   typedef mpl::bool_<is_trivial_cpp_int<self_type>::value>          trivial_tag;
public:
   typedef typename mpl::if_<
      trivial_tag,
      mpl::list<
      signed char, short, int, long,
      boost::long_long_type, signed_double_limb_type>,
      mpl::list<signed_limb_type, signed_double_limb_type>
   >::type                                                           signed_types;
   typedef typename mpl::if_<
      trivial_tag,
      mpl::list<unsigned char, unsigned short, unsigned,
      unsigned long, boost::ulong_long_type, double_limb_type>,
      mpl::list<limb_type, double_limb_type>
   >::type                                                           unsigned_types;
   typedef typename mpl::if_<
      trivial_tag,
      mpl::list<float, double, long double>,
      mpl::list<long double>
   >::type                                                           float_types;
   typedef mpl::int_<Checked>                                        checked_type;

   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR cpp_int_backend() BOOST_NOEXCEPT{}
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR cpp_int_backend(const cpp_int_backend& o) BOOST_MP_NOEXCEPT_IF(boost::is_void<Allocator>::value) : base_type(o) {}
#ifndef BOOST_NO_CXX11_RVALUE_REFERENCES
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR cpp_int_backend(cpp_int_backend&& o) BOOST_NOEXCEPT
      : base_type(static_cast<base_type&&>(o)) {}
#endif
   //
   // Direct construction from arithmetic type:
   //
   template <class Arg>
   BOOST_MP_FORCEINLINE BOOST_CONSTEXPR cpp_int_backend(Arg i, typename boost::enable_if_c<is_allowed_cpp_int_base_conversion<Arg, base_type>::value >::type const* = 0)BOOST_MP_NOEXCEPT_IF(noexcept(base_type(std::declval<Arg>())))
      : base_type(i) {}

private:
   template <unsigned MinBits2, unsigned MaxBits2, cpp_integer_type SignType2, cpp_int_check_type Checked2, class Allocator2>
   void do_assign(const cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2>& other, mpl::true_ const&, mpl::true_ const &)
   {
      // Assigning trivial type to trivial type:
      this->check_in_range(*other.limbs());
      *this->limbs() = static_cast<typename self_type::local_limb_type>(*other.limbs());
      this->sign(other.sign());
      this->normalize();
   }
   template <unsigned MinBits2, unsigned MaxBits2, cpp_integer_type SignType2, cpp_int_check_type Checked2, class Allocator2>
   void do_assign(const cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2>& other, mpl::true_ const&, mpl::false_ const &)
   {
      // non-trivial to trivial narrowing conversion:
      double_limb_type v = *other.limbs();
      if(other.size() > 1)
      {
         v |= static_cast<double_limb_type>(other.limbs()[1]) << bits_per_limb;
         if((Checked == checked) && (other.size() > 2))
         {
            BOOST_THROW_EXCEPTION(std::range_error("Assignment of a cpp_int that is out of range for the target type."));
         }
      }
      *this = v;
      this->sign(other.sign());
      this->normalize();
   }
   template <unsigned MinBits2, unsigned MaxBits2, cpp_integer_type SignType2, cpp_int_check_type Checked2, class Allocator2>
   void do_assign(const cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2>& other, mpl::false_ const&, mpl::true_ const &)
   {
      // trivial to non-trivial, treat the trivial argument as if it were an unsigned arithmetic type, then set the sign afterwards:
       *this = static_cast<
            typename boost::multiprecision::detail::canonical<
               typename cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2>::local_limb_type,
               cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator>
            >::type
         >(*other.limbs());
       this->sign(other.sign());
   }
   template <unsigned MinBits2, unsigned MaxBits2, cpp_integer_type SignType2, cpp_int_check_type Checked2, class Allocator2>
   void do_assign(const cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2>& other, mpl::false_ const&, mpl::false_ const &)
   {
      // regular non-trivial to non-trivial assign:
      this->resize(other.size(), other.size());
      std::memcpy(this->limbs(), other.limbs(), (std::min)(other.size(), this->size()) * sizeof(this->limbs()[0]));
      this->sign(other.sign());
      this->normalize();
   }
public:
   template <unsigned MinBits2, unsigned MaxBits2, cpp_integer_type SignType2, cpp_int_check_type Checked2, class Allocator2>
   cpp_int_backend(
      const cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2>& other,
      typename boost::enable_if_c<is_implicit_cpp_int_conversion<cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2>, self_type>::value>::type* = 0)
      : base_type()
   {
      do_assign(
         other,
         mpl::bool_<is_trivial_cpp_int<self_type>::value>(),
         mpl::bool_<is_trivial_cpp_int<cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2> >::value>());
   }
   template <unsigned MinBits2, unsigned MaxBits2, cpp_integer_type SignType2, cpp_int_check_type Checked2, class Allocator2>
   explicit cpp_int_backend(
      const cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2>& other,
      typename boost::disable_if_c<is_implicit_cpp_int_conversion<cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2>, self_type>::value>::type* = 0)
      : base_type()
   {
      do_assign(
         other,
         mpl::bool_<is_trivial_cpp_int<self_type>::value>(),
         mpl::bool_<is_trivial_cpp_int<cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2> >::value>());
   }
   template <unsigned MinBits2, unsigned MaxBits2, cpp_integer_type SignType2, cpp_int_check_type Checked2, class Allocator2>
   cpp_int_backend& operator=(
      const cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2>& other)
   {
      do_assign(
         other,
         mpl::bool_<is_trivial_cpp_int<self_type>::value>(),
         mpl::bool_<is_trivial_cpp_int<cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2> >::value>());
      return *this;
   }
#ifdef BOOST_MP_USER_DEFINED_LITERALS
   BOOST_CONSTEXPR cpp_int_backend(const cpp_int_backend& a, const literals::detail::negate_tag& tag)
      : base_type(static_cast<const base_type&>(a), tag){}
#endif

   BOOST_MP_FORCEINLINE cpp_int_backend& operator = (const cpp_int_backend& o) BOOST_MP_NOEXCEPT_IF(noexcept(std::declval<cpp_int_backend>().assign(std::declval<const cpp_int_backend&>())))
   {
      this->assign(o);
      return *this;
   }
#ifndef BOOST_NO_CXX11_RVALUE_REFERENCES
   BOOST_MP_FORCEINLINE cpp_int_backend& operator = (cpp_int_backend&& o) BOOST_MP_NOEXCEPT_IF(noexcept(std::declval<base_type&>() = std::declval<base_type>()))
   {
      *static_cast<base_type*>(this) = static_cast<base_type&&>(o);
      return *this;
   }
#endif
private:
   template <class A>
   typename boost::enable_if<is_unsigned<A> >::type do_assign_arithmetic(A val, const mpl::true_&) 
         BOOST_MP_NOEXCEPT_IF(noexcept(std::declval<cpp_int_backend>().check_in_range(std::declval<A>())))
   {
      this->check_in_range(val);
      *this->limbs() = static_cast<typename self_type::local_limb_type>(val);
      this->normalize();
   }
   template <class A>
   typename boost::disable_if_c<is_unsigned<A>::value || !is_integral<A>::value >::type do_assign_arithmetic(A val, const mpl::true_&) 
         BOOST_MP_NOEXCEPT_IF(noexcept(std::declval<cpp_int_backend>().check_in_range(std::declval<A>())) && noexcept(std::declval<cpp_int_backend>().sign(true)))
   {
      this->check_in_range(val);
      *this->limbs() = (val < 0) ? static_cast<typename self_type::local_limb_type>(boost::multiprecision::detail::unsigned_abs(val)) : static_cast<typename self_type::local_limb_type>(val);
      this->sign(val < 0);
      this->normalize();
   }
   template <class A>
   typename boost::enable_if_c< !is_integral<A>::value>::type do_assign_arithmetic(A val, const mpl::true_&)
   {
      this->check_in_range(val);
      *this->limbs() = (val < 0) ? static_cast<typename self_type::local_limb_type>(boost::multiprecision::detail::abs(val)) : static_cast<typename self_type::local_limb_type>(val);
      this->sign(val < 0);
      this->normalize();
   }
   BOOST_MP_FORCEINLINE void do_assign_arithmetic(limb_type i, const mpl::false_&) BOOST_NOEXCEPT
   {
      this->resize(1, 1);
      *this->limbs() = i;
      this->sign(false);
   }
   BOOST_MP_FORCEINLINE void do_assign_arithmetic(signed_limb_type i, const mpl::false_&) BOOST_MP_NOEXCEPT_IF(noexcept(std::declval<cpp_int_backend>().sign(true)))
   {
      this->resize(1, 1);
      *this->limbs() = static_cast<limb_type>(boost::multiprecision::detail::unsigned_abs(i));
      this->sign(i < 0);
   }
   void do_assign_arithmetic(double_limb_type i, const mpl::false_&) BOOST_NOEXCEPT
   {
      BOOST_STATIC_ASSERT(sizeof(i) == 2 * sizeof(limb_type));
      BOOST_STATIC_ASSERT(base_type::internal_limb_count >= 2);
      typename base_type::limb_pointer p = this->limbs();
#ifdef __MSVC_RUNTIME_CHECKS
      *p = static_cast<limb_type>(i & ~static_cast<limb_type>(0));
#else
      *p = static_cast<limb_type>(i);
#endif
      p[1] = static_cast<limb_type>(i >> base_type::limb_bits);
      this->resize(p[1] ? 2 : 1, p[1] ? 2 : 1);
      this->sign(false);
   }
   void do_assign_arithmetic(signed_double_limb_type i, const mpl::false_&) BOOST_MP_NOEXCEPT_IF(noexcept(std::declval<cpp_int_backend>().sign(true)))
   {
      BOOST_STATIC_ASSERT(sizeof(i) == 2 * sizeof(limb_type));
      BOOST_STATIC_ASSERT(base_type::internal_limb_count >= 2);
      bool s = false;
      double_limb_type ui;
      if(i < 0)
         s = true;
      ui = static_cast<double_limb_type>(boost::multiprecision::detail::unsigned_abs(i));
      typename base_type::limb_pointer p = this->limbs();
#ifdef __MSVC_RUNTIME_CHECKS
      *p = static_cast<limb_type>(ui & ~static_cast<limb_type>(0));
#else
      *p = static_cast<limb_type>(ui);
#endif
      p[1] = static_cast<limb_type>(ui >> base_type::limb_bits);
      this->resize(p[1] ? 2 : 1, p[1] ? 2 : 1);
      this->sign(s);
   }

   void do_assign_arithmetic(long double a, const mpl::false_&)
   {
      using default_ops::eval_add;
      using default_ops::eval_subtract;
      using std::frexp;
      using std::ldexp;
      using std::floor;

      if(a < 0)
      {
         do_assign_arithmetic(-a, mpl::false_());
         this->sign(true);
         return;
      }

      if (a == 0) {
         *this = static_cast<limb_type>(0u);
      }

      if (a == 1) {
         *this = static_cast<limb_type>(1u);
      }

      BOOST_ASSERT(!(boost::math::isinf)(a));
      BOOST_ASSERT(!(boost::math::isnan)(a));

      int e;
      long double f, term;
      *this = static_cast<limb_type>(0u);

      f = frexp(a, &e);

      static const limb_type shift = std::numeric_limits<limb_type>::digits;

      while(f)
      {
         // extract int sized bits from f:
         f = ldexp(f, shift);
         term = floor(f);
         e -= shift;
         eval_left_shift(*this, shift);
         if(term > 0)
            eval_add(*this, static_cast<limb_type>(term));
         else
            eval_subtract(*this, static_cast<limb_type>(-term));
         f -= term;
      }
      if(e > 0)
         eval_left_shift(*this, e);
      else if(e < 0)
         eval_right_shift(*this, -e);
   }
public:
   template <class Arithmetic>
   BOOST_MP_FORCEINLINE typename boost::enable_if_c<!boost::multiprecision::detail::is_byte_container<Arithmetic>::value, cpp_int_backend&>::type operator = (Arithmetic val) BOOST_MP_NOEXCEPT_IF(noexcept(std::declval<cpp_int_backend>().do_assign_arithmetic(std::declval<Arithmetic>(), trivial_tag())))
   {
      do_assign_arithmetic(val, trivial_tag());
      return *this;
   }
private:
   void do_assign_string(const char* s, const mpl::true_&)
   {
      std::size_t n = s ? std::strlen(s) : 0;
      *this = 0;
      unsigned radix = 10;
      bool isneg = false;
      if(n && (*s == '-'))
      {
         --n;
         ++s;
         isneg = true;
      }
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
         unsigned val;
         while(*s)
         {
            if(*s >= '0' && *s <= '9')
               val = *s - '0';
            else if(*s >= 'a' && *s <= 'f')
               val = 10 + *s - 'a';
            else if(*s >= 'A' && *s <= 'F')
               val = 10 + *s - 'A';
            else
               val = radix + 1;
            if(val >= radix)
            {
               BOOST_THROW_EXCEPTION(std::runtime_error("Unexpected content found while parsing character string."));
            }
            *this->limbs() = detail::checked_multiply(*this->limbs(), static_cast<typename base_type::local_limb_type>(radix), checked_type());
            *this->limbs() = detail::checked_add(*this->limbs(), static_cast<typename base_type::local_limb_type>(val), checked_type());
            ++s;
         }
      }
      if(isneg)
         this->negate();
   }
   void do_assign_string(const char* s, const mpl::false_&)
   {
      using default_ops::eval_multiply;
      using default_ops::eval_add;
      std::size_t n = s ? std::strlen(s) : 0;
      *this = static_cast<limb_type>(0u);
      unsigned radix = 10;
      bool isneg = false;
      if(n && (*s == '-'))
      {
         --n;
         ++s;
         isneg = true;
      }
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
      //
      // Exception guarantee: create the result in stack variable "result"
      // then do a swap at the end.  In the event of a throw, *this will
      // be left unchanged.
      //
      cpp_int_backend result;
      if(n)
      {
         if(radix == 16)
         {
            while(*s == '0') ++s;
            std::size_t bitcount = 4 * std::strlen(s);
            limb_type val;
            std::size_t limb, shift;
            if(bitcount > 4)
               bitcount -= 4;
            else
               bitcount = 0;
            std::size_t newsize = bitcount / (sizeof(limb_type) * CHAR_BIT) + 1;
            result.resize(static_cast<unsigned>(newsize), static_cast<unsigned>(newsize));  // will throw if this is a checked integer that cannot be resized
            std::memset(result.limbs(), 0, result.size() * sizeof(limb_type));
            while(*s)
            {
               if(*s >= '0' && *s <= '9')
                  val = *s - '0';
               else if(*s >= 'a' && *s <= 'f')
                  val = 10 + *s - 'a';
               else if(*s >= 'A' && *s <= 'F')
                  val = 10 + *s - 'A';
               else
               {
                  BOOST_THROW_EXCEPTION(std::runtime_error("Unexpected content found while parsing character string."));
               }
               limb = bitcount / (sizeof(limb_type) * CHAR_BIT);
               shift = bitcount % (sizeof(limb_type) * CHAR_BIT);
               val <<= shift;
               if(result.size() > limb)
               {
                  result.limbs()[limb] |= val;
               }
               ++s;
               bitcount -= 4;
            }
            result.normalize();
         }
         else if(radix == 8)
         {
            while(*s == '0') ++s;
            std::size_t bitcount = 3 * std::strlen(s);
            limb_type val;
            std::size_t limb, shift;
            if(bitcount > 3)
               bitcount -= 3;
            else
               bitcount = 0;
            std::size_t newsize = bitcount / (sizeof(limb_type) * CHAR_BIT) + 1;
            result.resize(static_cast<unsigned>(newsize), static_cast<unsigned>(newsize));  // will throw if this is a checked integer that cannot be resized
            std::memset(result.limbs(), 0, result.size() * sizeof(limb_type));
            while(*s)
            {
               if(*s >= '0' && *s <= '7')
                  val = *s - '0';
               else
               {
                  BOOST_THROW_EXCEPTION(std::runtime_error("Unexpected content found while parsing character string."));
               }
               limb = bitcount / (sizeof(limb_type) * CHAR_BIT);
               shift = bitcount % (sizeof(limb_type) * CHAR_BIT);
               if(result.size() > limb)
               {
                  result.limbs()[limb] |= (val << shift);
                  if(shift > sizeof(limb_type) * CHAR_BIT - 3)
                  {
                     // Deal with the bits in val that overflow into the next limb:
                     val >>= (sizeof(limb_type) * CHAR_BIT - shift);
                     if(val)
                     {
                        // If this is the most-significant-limb, we may need to allocate an extra one for the overflow:
                        if(limb + 1 == newsize)
                           result.resize(static_cast<unsigned>(newsize + 1), static_cast<unsigned>(newsize + 1));
                        if(result.size() > limb + 1)
                        {
                           result.limbs()[limb + 1] |= val;
                        }
                     }
                  }
               }
               ++s;
               bitcount -= 3;
            }
            result.normalize();
         }
         else
         {
            // Base 10, we extract blocks of size 10^9 at a time, that way
            // the number of multiplications is kept to a minimum:
            limb_type block_mult = max_block_10;
            while(*s)
            {
               limb_type block = 0;
               for(unsigned i = 0; i < digits_per_block_10; ++i)
               {
                  limb_type val;
                  if(*s >= '0' && *s <= '9')
                     val = *s - '0';
                  else
                     BOOST_THROW_EXCEPTION(std::runtime_error("Unexpected character encountered in input."));
                  block *= 10;
                  block += val;
                  if(!*++s)
                  {
                     block_mult = block_multiplier(i);
                     break;
                  }
               }
               eval_multiply(result, block_mult);
               eval_add(result, block);
            }
         }
      }
      if(isneg)
         result.negate();
      result.swap(*this);
   }
public:
   cpp_int_backend& operator = (const char* s)
   {
      do_assign_string(s, trivial_tag());
      return *this;
   }
   BOOST_MP_FORCEINLINE void swap(cpp_int_backend& o) BOOST_NOEXCEPT
   {
      this->do_swap(o);
   }
private:
   std::string do_get_trivial_string(std::ios_base::fmtflags f, const mpl::false_&)const
   {
      typedef typename mpl::if_c<sizeof(typename base_type::local_limb_type) == 1, unsigned, typename base_type::local_limb_type>::type io_type;
      if(this->sign() && (((f & std::ios_base::hex) == std::ios_base::hex) || ((f & std::ios_base::oct) == std::ios_base::oct)))
         BOOST_THROW_EXCEPTION(std::runtime_error("Base 8 or 16 printing of negative numbers is not supported."));
      std::stringstream ss;
      ss.flags(f & ~std::ios_base::showpos);
      ss << static_cast<io_type>(*this->limbs());
      std::string result;
      if(this->sign())
         result += '-';
      else if(f & std::ios_base::showpos)
         result += '+';
      result += ss.str();
      return result;
   }
   std::string do_get_trivial_string(std::ios_base::fmtflags f, const mpl::true_&)const
   {
      // Even though we have only one limb, we can't do IO on it :-(
      int base = 10;
      if((f & std::ios_base::oct) == std::ios_base::oct)
         base = 8;
      else if((f & std::ios_base::hex) == std::ios_base::hex)
         base = 16;
      std::string result;

      unsigned Bits = sizeof(typename base_type::local_limb_type) * CHAR_BIT;

      if(base == 8 || base == 16)
      {
         if(this->sign())
            BOOST_THROW_EXCEPTION(std::runtime_error("Base 8 or 16 printing of negative numbers is not supported."));
         limb_type shift = base == 8 ? 3 : 4;
         limb_type mask = static_cast<limb_type>((1u << shift) - 1);
         typename base_type::local_limb_type v = *this->limbs();
         result.assign(Bits / shift + (Bits % shift ? 1 : 0), '0');
         std::string::difference_type pos = result.size() - 1;
         for(unsigned i = 0; i < Bits / shift; ++i)
         {
            char c = '0' + static_cast<char>(v & mask);
            if(c > '9')
               c += 'A' - '9' - 1;
            result[pos--] = c;
            v >>= shift;
         }
         if(Bits % shift)
         {
            mask = static_cast<limb_type>((1u << (Bits % shift)) - 1);
            char c = '0' + static_cast<char>(v & mask);
            if(c > '9')
               c += 'A' - '9';
            result[pos] = c;
         }
         //
         // Get rid of leading zeros:
         //
         std::string::size_type n = result.find_first_not_of('0');
         if(!result.empty() && (n == std::string::npos))
            n = result.size() - 1;
         result.erase(0, n);
         if(f & std::ios_base::showbase)
         {
            const char* pp = base == 8 ? "0" : "0x";
            result.insert(static_cast<std::string::size_type>(0), pp);
         }
      }
      else
      {
         result.assign(Bits / 3 + 1, '0');
         std::string::difference_type pos = result.size() - 1;
         typename base_type::local_limb_type v(*this->limbs());
         bool neg = false;
         if(this->sign())
         {
            neg = true;
         }
         while(v)
         {
            result[pos] = (v % 10) + '0';
            --pos;
            v /= 10;
         }
         std::string::size_type n = result.find_first_not_of('0');
         result.erase(0, n);
         if(result.empty())
            result = "0";
         if(neg)
            result.insert(static_cast<std::string::size_type>(0), 1, '-');
         else if(f & std::ios_base::showpos)
            result.insert(static_cast<std::string::size_type>(0), 1, '+');
      }
      return result;
   }
   std::string do_get_string(std::ios_base::fmtflags f, const mpl::true_&)const
   {
#ifdef BOOST_MP_NO_DOUBLE_LIMB_TYPE_IO
      return do_get_trivial_string(f, mpl::bool_<is_same<typename base_type::local_limb_type, double_limb_type>::value>());
#else
      return do_get_trivial_string(f, mpl::bool_<false>());
#endif
   }
   std::string do_get_string(std::ios_base::fmtflags f, const mpl::false_&)const
   {
      using default_ops::eval_get_sign;
      int base = 10;
      if((f & std::ios_base::oct) == std::ios_base::oct)
         base = 8;
      else if((f & std::ios_base::hex) == std::ios_base::hex)
         base = 16;
      std::string result;

      unsigned Bits = this->size() * base_type::limb_bits;

      if(base == 8 || base == 16)
      {
         if(this->sign())
            BOOST_THROW_EXCEPTION(std::runtime_error("Base 8 or 16 printing of negative numbers is not supported."));
         limb_type shift = base == 8 ? 3 : 4;
         limb_type mask = static_cast<limb_type>((1u << shift) - 1);
         cpp_int_backend t(*this);
         result.assign(Bits / shift + ((Bits % shift) ? 1 : 0), '0');
         std::string::difference_type pos = result.size() - 1;
         for(unsigned i = 0; i < Bits / shift; ++i)
         {
            char c = '0' + static_cast<char>(t.limbs()[0] & mask);
            if(c > '9')
               c += 'A' - '9' - 1;
            result[pos--] = c;
            eval_right_shift(t, shift);
         }
         if(Bits % shift)
         {
            mask = static_cast<limb_type>((1u << (Bits % shift)) - 1);
            char c = '0' + static_cast<char>(t.limbs()[0] & mask);
            if(c > '9')
               c += 'A' - '9';
            result[pos] = c;
         }
         //
         // Get rid of leading zeros:
         //
         std::string::size_type n = result.find_first_not_of('0');
         if(!result.empty() && (n == std::string::npos))
            n = result.size() - 1;
         result.erase(0, n);
         if(f & std::ios_base::showbase)
         {
            const char* pp = base == 8 ? "0" : "0x";
            result.insert(static_cast<std::string::size_type>(0), pp);
         }
      }
      else
      {
         result.assign(Bits / 3 + 1, '0');
         std::string::difference_type pos = result.size() - 1;
         cpp_int_backend t(*this);
         cpp_int_backend r;
         bool neg = false;
         if(t.sign())
         {
            t.negate();
            neg = true;
         }
         if(this->size() == 1)
         {
            result = boost::lexical_cast<std::string>(t.limbs()[0]);
         }
         else
         {
            cpp_int_backend block10;
            block10 = max_block_10;
            while(eval_get_sign(t) != 0)
            {
               cpp_int_backend t2;
               divide_unsigned_helper(&t2, t, block10, r);
               t = t2;
               limb_type v = r.limbs()[0];
               for(unsigned i = 0; i < digits_per_block_10; ++i)
               {
                  char c = '0' + v % 10;
                  v /= 10;
                  result[pos] = c;
                  if(pos-- == 0)
                     break;
               }
            }
         }
         std::string::size_type n = result.find_first_not_of('0');
         result.erase(0, n);
         if(result.empty())
            result = "0";
         if(neg)
            result.insert(static_cast<std::string::size_type>(0), 1, '-');
         else if(f & std::ios_base::showpos)
            result.insert(static_cast<std::string::size_type>(0), 1, '+');
      }
      return result;
   }
public:
   std::string str(std::streamsize /*digits*/, std::ios_base::fmtflags f)const
   {
      return do_get_string(f, trivial_tag());
   }
private:
   template <class Container>
   void construct_from_container(const Container& c, const mpl::false_&)
   {
      //
      // We assume that c is a sequence of (unsigned) bytes with the most significant byte first:
      //
      unsigned newsize = static_cast<unsigned>(c.size() / sizeof(limb_type));
      if(c.size() % sizeof(limb_type))
      {
         ++newsize;
      }
      if(newsize)
      {
         this->resize(newsize, newsize);   // May throw
         std::memset(this->limbs(), 0, this->size());
         typename Container::const_iterator i(c.begin()), j(c.end());
         unsigned byte_location = static_cast<unsigned>(c.size() - 1);
         while(i != j)
         {
            unsigned limb = byte_location / sizeof(limb_type);
            unsigned shift = (byte_location % sizeof(limb_type))  * CHAR_BIT;
            if(this->size() > limb)
               this->limbs()[limb] |= static_cast<limb_type>(static_cast<unsigned char>(*i)) << shift;
            ++i;
            --byte_location;
         }
      }
   }
   template <class Container>
   void construct_from_container(const Container& c, const mpl::true_&)
   {
      //
      // We assume that c is a sequence of (unsigned) bytes with the most significant byte first:
      //
      typedef typename base_type::local_limb_type local_limb_type;
      *this->limbs() = 0;
      if(c.size())
      {
         typename Container::const_iterator i(c.begin()), j(c.end());
         unsigned byte_location = static_cast<unsigned>(c.size() - 1);
         while(i != j)
         {
            unsigned limb = byte_location / sizeof(local_limb_type);
            unsigned shift = (byte_location % sizeof(local_limb_type)) * CHAR_BIT;
            if(limb == 0)
               this->limbs()[0] |= static_cast<limb_type>(static_cast<unsigned char>(*i)) << shift;
            ++i;
            --byte_location;
         }
      }
   }
public:
   template <class Container>
   cpp_int_backend(const Container& c, typename boost::enable_if_c<boost::multiprecision::detail::is_byte_container<Container>::value>::type const* = 0)
   {
      //
      // We assume that c is a sequence of (unsigned) bytes with the most significant byte first:
      //
      construct_from_container(c, trivial_tag());
   }
   template <unsigned MinBits2, unsigned MaxBits2, cpp_integer_type SignType2, cpp_int_check_type Checked2, class Allocator2>
   int compare_imp(const cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2>& o, const mpl::false_&, const mpl::false_&)const BOOST_NOEXCEPT
   {
      if(this->sign() != o.sign())
         return this->sign() ? -1 : 1;

      // Only do the compare if the same sign:
      int result = compare_unsigned(o);

      if(this->sign())
         result = -result;
      return result;
   }
   template <unsigned MinBits2, unsigned MaxBits2, cpp_integer_type SignType2, cpp_int_check_type Checked2, class Allocator2>
   int compare_imp(const cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2>& o, const mpl::true_&, const mpl::false_&)const
   {
      cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2> t(*this);
      return t.compare(o);
   }
   template <unsigned MinBits2, unsigned MaxBits2, cpp_integer_type SignType2, cpp_int_check_type Checked2, class Allocator2>
   int compare_imp(const cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2>& o, const mpl::false_&, const mpl::true_&)const
   {
      cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator> t(o);
      return compare(t);
   }
   template <unsigned MinBits2, unsigned MaxBits2, cpp_integer_type SignType2, cpp_int_check_type Checked2, class Allocator2>
   int compare_imp(const cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2>& o, const mpl::true_&, const mpl::true_&)const BOOST_NOEXCEPT
   {
      if(this->sign())
      {
         if(o.sign())
         {
            return *this->limbs() < *o.limbs() ? 1 : (*this->limbs() > *o.limbs() ? -1 : 0);
         }
         else
            return -1;
      }
      else
      {
         if(o.sign())
            return 1;
         return *this->limbs() < *o.limbs() ? -1 : (*this->limbs() > *o.limbs() ? 1 : 0);
      }
   }
   template <unsigned MinBits2, unsigned MaxBits2, cpp_integer_type SignType2, cpp_int_check_type Checked2, class Allocator2>
   int compare(const cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2>& o)const BOOST_NOEXCEPT
   {
      typedef mpl::bool_<is_trivial_cpp_int<cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator> >::value> t1;
      typedef mpl::bool_<is_trivial_cpp_int<cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2> >::value> t2;
      return compare_imp(o, t1(), t2());
   }
   template <unsigned MinBits2, unsigned MaxBits2, cpp_integer_type SignType2, cpp_int_check_type Checked2, class Allocator2>
   int compare_unsigned(const cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2>& o)const BOOST_NOEXCEPT
   {
      if(this->size() != o.size())
      {
         return this->size() > o.size() ? 1 : -1;
      }
      typename base_type::const_limb_pointer pa = this->limbs();
      typename base_type::const_limb_pointer pb = o.limbs();
      for(int i = this->size() - 1; i >= 0; --i)
      {
         if(pa[i] != pb[i])
            return pa[i] > pb[i] ? 1 : -1;
      }
      return 0;
   }
   template <class Arithmetic>
   BOOST_MP_FORCEINLINE typename boost::enable_if<is_arithmetic<Arithmetic>, int>::type compare(Arithmetic i)const
   {
      // braindead version:
      cpp_int_backend t;
      t = i;
      return compare(t);
   }
};

} // namespace backends

namespace default_ops{

template <class Backend>
struct double_precision_type;

template <unsigned MinBits, unsigned MaxBits, cpp_integer_type SignType, cpp_int_check_type Checked, class Allocator>
struct double_precision_type<backends::cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator> >
{
   typedef typename mpl::if_c<
      backends::is_fixed_precision<backends::cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator> >::value,
      backends::cpp_int_backend<
         (is_void<Allocator>::value ?
            2 * backends::max_precision<backends::cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator> >::value
            : MinBits),
         2 * backends::max_precision<backends::cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator> >::value,
         SignType,
         Checked,
         Allocator>,
      backends::cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator>
   >::type type;
};


}

template <unsigned MinBits, unsigned MaxBits, cpp_integer_type SignType, cpp_int_check_type Checked>
struct expression_template_default<backends::cpp_int_backend<MinBits, MaxBits, SignType, Checked, void> >
{
   static const expression_template_option value = et_off;
};

using boost::multiprecision::backends::cpp_int_backend;

template <unsigned MinBits, unsigned MaxBits, cpp_integer_type SignType, cpp_int_check_type Checked, class Allocator>
struct number_category<cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator> > : public mpl::int_<number_kind_integer>{};

typedef number<cpp_int_backend<> >                   cpp_int;
typedef rational_adaptor<cpp_int_backend<> >         cpp_rational_backend;
typedef number<cpp_rational_backend>                 cpp_rational;

// Fixed precision unsigned types:
typedef number<cpp_int_backend<128, 128, unsigned_magnitude, unchecked, void> >   uint128_t;
typedef number<cpp_int_backend<256, 256, unsigned_magnitude, unchecked, void> >   uint256_t;
typedef number<cpp_int_backend<512, 512, unsigned_magnitude, unchecked, void> >   uint512_t;
typedef number<cpp_int_backend<1024, 1024, unsigned_magnitude, unchecked, void> > uint1024_t;

// Fixed precision signed types:
typedef number<cpp_int_backend<128, 128, signed_magnitude, unchecked, void> >    int128_t;
typedef number<cpp_int_backend<256, 256, signed_magnitude, unchecked, void> >    int256_t;
typedef number<cpp_int_backend<512, 512, signed_magnitude, unchecked, void> >    int512_t;
typedef number<cpp_int_backend<1024, 1024, signed_magnitude, unchecked, void> >  int1024_t;

// Over again, but with checking enabled this time:
typedef number<cpp_int_backend<0, 0, signed_magnitude, checked> >               checked_cpp_int;
typedef rational_adaptor<cpp_int_backend<0, 0, signed_magnitude, checked> >     checked_cpp_rational_backend;
typedef number<checked_cpp_rational_backend>                                    checked_cpp_rational;
// Fixed precision unsigned types:
typedef number<cpp_int_backend<128, 128, unsigned_magnitude, checked, void> >   checked_uint128_t;
typedef number<cpp_int_backend<256, 256, unsigned_magnitude, checked, void> >   checked_uint256_t;
typedef number<cpp_int_backend<512, 512, unsigned_magnitude, checked, void> >   checked_uint512_t;
typedef number<cpp_int_backend<1024, 1024, unsigned_magnitude, checked, void> > checked_uint1024_t;

// Fixed precision signed types:
typedef number<cpp_int_backend<128, 128, signed_magnitude, checked, void> >    checked_int128_t;
typedef number<cpp_int_backend<256, 256, signed_magnitude, checked, void> >    checked_int256_t;
typedef number<cpp_int_backend<512, 512, signed_magnitude, checked, void> >    checked_int512_t;
typedef number<cpp_int_backend<1024, 1024, signed_magnitude, checked, void> >  checked_int1024_t;

#ifdef BOOST_NO_SFINAE_EXPR

namespace detail{

template<unsigned MinBits, unsigned MaxBits, cpp_integer_type SignType, cpp_int_check_type Checked, class Allocator, unsigned MinBits2, unsigned MaxBits2, cpp_integer_type SignType2, cpp_int_check_type Checked2, class Allocator2>
struct is_explicitly_convertible<cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator>, cpp_int_backend<MinBits2, MaxBits2, SignType2, Checked2, Allocator2> > : public mpl::true_ {};

}
#endif

#ifdef _MSC_VER
#pragma warning(pop)
#endif

}} // namespaces

//
// Last of all we include the implementations of all the eval_* non member functions:
//
#include <boost/multiprecision/cpp_int/comparison.hpp>
#include <boost/multiprecision/cpp_int/add.hpp>
#include <boost/multiprecision/cpp_int/multiply.hpp>
#include <boost/multiprecision/cpp_int/divide.hpp>
#include <boost/multiprecision/cpp_int/bitwise.hpp>
#include <boost/multiprecision/cpp_int/misc.hpp>
#include <boost/multiprecision/cpp_int/limits.hpp>
#ifdef BOOST_MP_USER_DEFINED_LITERALS
#include <boost/multiprecision/cpp_int/literals.hpp>
#endif
#include <boost/multiprecision/cpp_int/serialize.hpp>
#include <boost/multiprecision/cpp_int/import_export.hpp>

#endif
