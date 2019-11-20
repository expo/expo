///////////////////////////////////////////////////////////////
//  Copyright 2013 John Maddock. Distributed under the Boost
//  Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_
//
// Comparison operators for cpp_int_backend:
//
#ifndef BOOST_MP_DETAIL_BITSCAN_HPP
#define BOOST_MP_DETAIL_BITSCAN_HPP

#if (defined(BOOST_MSVC) || (defined(__clang__) && defined(__c2__)) || (defined(BOOST_INTEL) && defined(_MSC_VER))) && (defined(_M_IX86) || defined(_M_X64))
#include <intrin.h>
#endif

namespace boost{ namespace multiprecision{ namespace detail{

template <class Unsigned>
inline unsigned find_lsb(Unsigned mask, const mpl::int_<0>&)
{
   unsigned result = 0;
   while(!(mask & 1u))
   {
      mask >>= 1;
      ++result;
   }
   return result;
}

template <class Unsigned>
inline unsigned find_msb(Unsigned mask, const mpl::int_<0>&)
{
   unsigned index = 0;
   while(mask)
   {
      ++index;
      mask >>= 1;
   }
   return --index;
}

#if (defined(BOOST_MSVC) || (defined(__clang__) && defined(__c2__)) || (defined(BOOST_INTEL) && defined(_MSC_VER))) && (defined(_M_IX86) || defined(_M_X64))

#pragma intrinsic(_BitScanForward,_BitScanReverse)

BOOST_FORCEINLINE unsigned find_lsb(unsigned long mask, const mpl::int_<1>&)
{
   unsigned long result;
   _BitScanForward(&result, mask);
   return result;
}

BOOST_FORCEINLINE unsigned find_msb(unsigned long mask, const mpl::int_<1>&)
{
   unsigned long result;
   _BitScanReverse(&result, mask);
   return result;
}
#ifdef _M_X64

#pragma intrinsic(_BitScanForward64,_BitScanReverse64)

BOOST_FORCEINLINE unsigned find_lsb(unsigned __int64 mask, const mpl::int_<2>&)
{
   unsigned long result;
   _BitScanForward64(&result, mask);
   return result;
}
template <class Unsigned>
BOOST_FORCEINLINE unsigned find_msb(Unsigned mask, const mpl::int_<2>&)
{
   unsigned long result;
   _BitScanReverse64(&result, mask);
   return result;
}
#endif

template <class Unsigned>
BOOST_FORCEINLINE unsigned find_lsb(Unsigned mask)
{
   typedef typename make_unsigned<Unsigned>::type ui_type;
   typedef typename mpl::if_c<
      sizeof(Unsigned) <= sizeof(unsigned long),
      mpl::int_<1>,
#ifdef _M_X64
      typename mpl::if_c<
         sizeof(Unsigned) <= sizeof(__int64),
         mpl::int_<2>,
         mpl::int_<0>
      >::type
#else
      mpl::int_<0>
#endif
   >::type tag_type;
   return find_lsb(static_cast<ui_type>(mask), tag_type());
}

template <class Unsigned>
BOOST_FORCEINLINE unsigned find_msb(Unsigned mask)
{
   typedef typename make_unsigned<Unsigned>::type ui_type;
   typedef typename mpl::if_c<
      sizeof(Unsigned) <= sizeof(unsigned long),
      mpl::int_<1>,
#ifdef _M_X64
      typename mpl::if_c<
         sizeof(Unsigned) <= sizeof(__int64),
         mpl::int_<2>,
         mpl::int_<0>
      >::type
#else
      mpl::int_<0>
#endif
   >::type tag_type;
   return find_msb(static_cast<ui_type>(mask), tag_type());
}

#elif defined(BOOST_GCC) || defined(__clang__) || (defined(BOOST_INTEL) && defined(__GNUC__))

BOOST_FORCEINLINE unsigned find_lsb(unsigned mask, mpl::int_<1> const&)
{
   return __builtin_ctz(mask);
}
BOOST_FORCEINLINE unsigned find_lsb(unsigned long mask, mpl::int_<2> const&)
{
   return __builtin_ctzl(mask);
}
BOOST_FORCEINLINE unsigned find_lsb(boost::ulong_long_type mask, mpl::int_<3> const&)
{
   return __builtin_ctzll(mask);
}
BOOST_FORCEINLINE unsigned find_msb(unsigned mask, mpl::int_<1> const&)
{
   return sizeof(unsigned) * CHAR_BIT - 1 - __builtin_clz(mask);
}
BOOST_FORCEINLINE unsigned find_msb(unsigned long mask, mpl::int_<2> const&)
{
   return sizeof(unsigned long) * CHAR_BIT - 1 - __builtin_clzl(mask);
}
BOOST_FORCEINLINE unsigned find_msb(boost::ulong_long_type mask, mpl::int_<3> const&)
{
   return sizeof(boost::ulong_long_type) * CHAR_BIT - 1 - __builtin_clzll(mask);
}

template <class Unsigned>
BOOST_FORCEINLINE unsigned find_lsb(Unsigned mask)
{
   typedef typename make_unsigned<Unsigned>::type ui_type;
   typedef typename mpl::if_c<
      sizeof(Unsigned) <= sizeof(unsigned),
      mpl::int_<1>,
      typename mpl::if_c<
         sizeof(Unsigned) <= sizeof(unsigned long),
         mpl::int_<2>,
         typename mpl::if_c<
            sizeof(Unsigned) <= sizeof(boost::ulong_long_type),
            mpl::int_<3>,
            mpl::int_<0>
         >::type
      >::type
   >::type tag_type;
   return find_lsb(static_cast<ui_type>(mask), tag_type());
}
template <class Unsigned>
BOOST_FORCEINLINE unsigned find_msb(Unsigned mask)
{
   typedef typename make_unsigned<Unsigned>::type ui_type;
   typedef typename mpl::if_c<
      sizeof(Unsigned) <= sizeof(unsigned),
      mpl::int_<1>,
      typename mpl::if_c<
         sizeof(Unsigned) <= sizeof(unsigned long),
         mpl::int_<2>,
         typename mpl::if_c<
            sizeof(Unsigned) <= sizeof(boost::ulong_long_type),
            mpl::int_<3>,
            mpl::int_<0>
         >::type
      >::type
   >::type tag_type;
   return find_msb(static_cast<ui_type>(mask), tag_type());
}
#elif defined(BOOST_INTEL)
BOOST_FORCEINLINE unsigned find_lsb(unsigned mask, mpl::int_<1> const&)
{
   return _bit_scan_forward(mask);
}
BOOST_FORCEINLINE unsigned find_msb(unsigned mask, mpl::int_<1> const&)
{
   return _bit_scan_reverse(mask);
}
template <class Unsigned>
BOOST_FORCEINLINE unsigned find_lsb(Unsigned mask)
{
   typedef typename make_unsigned<Unsigned>::type ui_type;
   typedef typename mpl::if_c<
      sizeof(Unsigned) <= sizeof(unsigned),
      mpl::int_<1>,
      mpl::int_<0>
   >::type tag_type;
   return find_lsb(static_cast<ui_type>(mask), tag_type());
}
template <class Unsigned>
BOOST_FORCEINLINE unsigned find_msb(Unsigned mask)
{
   typedef typename make_unsigned<Unsigned>::type ui_type;
   typedef typename mpl::if_c<
      sizeof(Unsigned) <= sizeof(unsigned),
      mpl::int_<1>,
      mpl::int_<0>
   >::type tag_type;
   return find_msb(static_cast<ui_type>(mask), tag_type());
}
#else
template <class Unsigned>
BOOST_FORCEINLINE unsigned find_lsb(Unsigned mask)
{
   return find_lsb(mask, mpl::int_<0>());
}
template <class Unsigned>
BOOST_FORCEINLINE unsigned find_msb(Unsigned mask)
{
   return find_msb(mask, mpl::int_<0>());
}
#endif

}}}

#endif

