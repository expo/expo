///////////////////////////////////////////////////////////////
//  Copyright 2012 John Maddock. Distributed under the Boost
//  Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_

#ifndef BOOST_MP_CPP_INT_CORE_HPP
#define BOOST_MP_CPP_INT_CORE_HPP

#include <boost/integer.hpp>
#include <boost/integer_traits.hpp>
#include <boost/mpl/if.hpp>
#include <boost/mpl/int.hpp>
#include <boost/static_assert.hpp>
#include <boost/assert.hpp>

namespace boost{ namespace multiprecision{

namespace detail{

//
// These traits calculate the largest type in the list
// [unsigned] boost::long_long_type, long, int, which has the specified number
// of bits.  Note that intN_t and boost::int_t<N> find the first
// member of the above list, not the last.  We want the last in the
// list to ensure that mixed arithmetic operations are as efficient
// as possible.
//
template <unsigned N>
struct largest_signed_type
{
   typedef typename mpl::if_c<
      1 + std::numeric_limits<boost::long_long_type>::digits == N,
      boost::long_long_type,
      typename mpl::if_c<
         1 + std::numeric_limits<long>::digits == N,
         long,
         typename mpl::if_c<
            1 + std::numeric_limits<int>::digits == N,
            int,
            typename boost::int_t<N>::exact
         >::type
      >::type
   >::type type;
};

template <unsigned N>
struct largest_unsigned_type
{
   typedef typename mpl::if_c<
      std::numeric_limits<boost::ulong_long_type>::digits == N,
      boost::ulong_long_type,
      typename mpl::if_c<
         std::numeric_limits<unsigned long>::digits == N,
         unsigned long,
         typename mpl::if_c<
            std::numeric_limits<unsigned int>::digits == N,
            unsigned int,
            typename boost::uint_t<N>::exact
         >::type
      >::type
   >::type type;
};

} // namespace detail

#if defined(BOOST_HAS_INT128)

typedef detail::largest_unsigned_type<64>::type limb_type;
typedef detail::largest_signed_type<64>::type signed_limb_type;
typedef boost::uint128_type double_limb_type;
typedef boost::int128_type signed_double_limb_type;
static const limb_type max_block_10 = 1000000000000000000uLL;
static const limb_type digits_per_block_10 = 18;

inline limb_type block_multiplier(unsigned count)
{
   static const limb_type values[digits_per_block_10]
      = { 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000, 10000000000, 100000000000, 1000000000000, 10000000000000, 100000000000000, 1000000000000000, 10000000000000000, 100000000000000000, 1000000000000000000 };
   BOOST_ASSERT(count < digits_per_block_10);
   return values[count];
}

// Can't do formatted IO on an __int128
#define BOOST_MP_NO_DOUBLE_LIMB_TYPE_IO

// Need to specialise integer_traits for __int128 as it's not a normal native type:
} // namespace multiprecision

template<>
class integer_traits<multiprecision::double_limb_type>
  : public std::numeric_limits<multiprecision::double_limb_type>,
    public detail::integer_traits_base<multiprecision::double_limb_type, 0, ~static_cast<multiprecision::double_limb_type>(0)>
{ };
template<>
class integer_traits<multiprecision::signed_double_limb_type>
  : public std::numeric_limits<multiprecision::signed_double_limb_type>,
    public detail::integer_traits_base<multiprecision::signed_double_limb_type, static_cast<multiprecision::signed_double_limb_type>((static_cast<multiprecision::double_limb_type>(1) << 127)), static_cast<multiprecision::signed_double_limb_type>(((~static_cast<multiprecision::double_limb_type>(0)) >> 1))>
{ };

namespace multiprecision{

#else

typedef detail::largest_unsigned_type<32>::type limb_type;
typedef detail::largest_signed_type<32>::type signed_limb_type;
typedef detail::largest_unsigned_type<64>::type double_limb_type;
typedef detail::largest_signed_type<64>::type signed_double_limb_type;
static const limb_type max_block_10 = 1000000000;
static const limb_type digits_per_block_10 = 9;

inline limb_type block_multiplier(unsigned count)
{
   static const limb_type values[digits_per_block_10]
      = { 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000 };
   BOOST_ASSERT(count < digits_per_block_10);
   return values[count];
}

#endif

static const unsigned bits_per_limb = sizeof(limb_type) * CHAR_BIT;

template <class T>
inline void minmax(const T& a, const T& b, T& aa, T& bb)
{
   if(a < b)
   {
      aa = a;
      bb = b;
   }
   else
   {
      aa = b;
      bb = a;
   }
}

enum cpp_integer_type
{
   signed_magnitude = 1,
   unsigned_magnitude = 0,
   signed_packed = 3,
   unsigned_packed = 2
};

enum cpp_int_check_type
{
   checked = 1,
   unchecked = 0
};

}}

//
// Figure out whether to support user-defined-literals or not:
//
#if !defined(BOOST_NO_CXX11_VARIADIC_TEMPLATES) && !defined(BOOST_NO_CXX11_USER_DEFINED_LITERALS) \
      && !defined(BOOST_NO_CXX11_CONSTEXPR)
#  define BOOST_MP_USER_DEFINED_LITERALS
#endif

#endif // BOOST_MP_CPP_INT_CORE_HPP

