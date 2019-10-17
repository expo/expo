// fp_traits.hpp

#ifndef BOOST_SPIRIT_MATH_FP_TRAITS_HPP
#define BOOST_SPIRIT_MATH_FP_TRAITS_HPP

// Copyright (c) 2006 Johan Rade

// Distributed under the Boost Software License, Version 1.0.
// (See accompanying file LICENSE_1_0.txt
// or copy at http://www.boost.org/LICENSE_1_0.txt)

#if defined(__vms) && defined(__DECCXX) && !__IEEE_FLOAT
#   error The VAX floating point mode on VMS is not supported.
#endif

#if defined(_MSC_VER)
#pragma once
#endif

#include <cstring>

#include <boost/assert.hpp>
#include <boost/cstdint.hpp>
#include <boost/detail/endian.hpp>
#include <boost/static_assert.hpp>
#include <boost/type_traits/is_floating_point.hpp>

//------------------------------------------------------------------------------

namespace boost {
namespace spirit {
namespace math {
namespace detail {

//------------------------------------------------------------------------------

/*
Most processors support three different floating point precisions:
single precision (32 bits), double precision (64 bits)
and extended double precision (>64 bits)

Note that the C++ type long double can be implemented
both as double precision and extended double precision.
*/

struct single_precision_tag {};
struct double_precision_tag {};
struct extended_double_precision_tag {};

//------------------------------------------------------------------------------

/*
template<class T, class U> struct fp_traits_impl;

  This is traits class that describes the binary structure of floating
  point numbers of C++ type T and precision U

Requirements: 

  T = float, double or long double
  U = single_precision_tag, double_precision_tag
      or extended_double_precision_tag

Typedef members:

  bits -- the target type when copying the leading bytes of a floating
      point number. It is a typedef for uint32_t or uint64_t.

  coverage -- tells us whether all bytes are copied or not.
      It is a typedef for all_bits or not_all_bits.

Static data members:

  sign, exponent, flag, mantissa -- bit masks that give the meaning of the bits
      in the leading bytes.

Static function members:

  init() -- initializes the static data members, if needed.
            (Is a no-op in the specialized versions of the template.)

  get_bits(), set_bits() -- provide access to the leading bytes.
*/

struct all_bits {};
struct not_all_bits {};

// Generic version -------------------------------------------------------------

// The generic version uses run time initialization to determine the floating
// point format. It is capable of handling most formats,
// but not the Motorola 68K extended double precision format.

// Currently the generic version is used only for extended double precision
// on Itanium. In all other cases there are specializations of the template
// that use compile time initialization.

template<class T> struct uint32_t_coverage
{
    typedef not_all_bits type;
};

template<> struct uint32_t_coverage<single_precision_tag>
{
    typedef all_bits type;
};

template<class T, class U> struct fp_traits_impl
{
    typedef uint32_t bits;
    typedef BOOST_DEDUCED_TYPENAME uint32_t_coverage<U>::type coverage;

    BOOST_STATIC_CONSTANT(uint32_t, sign = 0x80000000);
    static uint32_t exponent;
    static uint32_t flag;
    static uint32_t mantissa;

    static void init()
    {
        if(is_init_) return;
        do_init_();
        is_init_ = true;
    }

    static void get_bits(T x, uint32_t& a)
    {
        memcpy(&a, reinterpret_cast<const unsigned char*>(&x) + offset_, 4);
    }

    static void set_bits(T& x, uint32_t a)
    {
        memcpy(reinterpret_cast<unsigned char*>(&x) + offset_, &a, 4);
    }

private:
    static size_t offset_;
    static bool is_init_;
    static void do_init_();
};

//..............................................................................

template<class T, class U> uint32_t fp_traits_impl<T,U>::exponent;
template<class T, class U> uint32_t fp_traits_impl<T,U>::flag;
template<class T, class U> uint32_t fp_traits_impl<T,U>::mantissa;
template<class T, class U> size_t   fp_traits_impl<T,U>::offset_;
template<class T, class U> bool     fp_traits_impl<T,U>::is_init_;

// In a single-threaded program, do_init will be called exactly once.
// In a multi-threaded program, do_init may be called simultaneously
// by more then one thread. That should not be a problem.

//..............................................................................

template<class T, class U> void fp_traits_impl<T,U>::do_init_()
{
    T x = static_cast<T>(3) / static_cast<T>(4);
    // sign bit = 0
    // exponent: first and last bit = 0, all other bits  = 1
    // flag bit (if present) = 1
    // mantissa: first bit = 1, all other bits = 0

    uint32_t a;

    for(size_t k = 0; k <= sizeof(T) - 4; ++k) {

        memcpy(&a, reinterpret_cast<unsigned char*>(&x) + k, 4);

        switch(a) {

        case 0x3f400000:      // IEEE single precision format

            offset_  = k;      
            exponent = 0x7f800000;
            flag     = 0x00000000;
            mantissa = 0x007fffff;
            return;

        case 0x3fe80000:      // IEEE double precision format 
                              // and PowerPC extended double precision format
            offset_  = k;      
            exponent = 0x7ff00000;
            flag     = 0x00000000;
            mantissa = 0x000fffff;
            return;

        case 0x3ffe0000:      // Motorola extended double precision format

            // Must not get here. Must be handled by specialization.
            // To get accurate cutoff between normals and subnormals
            // we must use the flag bit that is in the 5th byte.
            // Otherwise this cutoff will be off by a factor 2.
            // If we do get here, then we have failed to detect the Motorola
            // processor at compile time.

            BOOST_ASSERT(false && 
                "Failed to detect the Motorola processor at compile time");        
            return;

        case 0x3ffe8000:      // IEEE extended double precision format
                              // with 15 exponent bits
            offset_  = k;      
            exponent = 0x7fff0000;
            flag     = 0x00000000;
            mantissa = 0x0000ffff;
            return;

        case 0x3ffec000:      // Intel extended double precision format

            offset_  = k;
            exponent = 0x7fff0000;
            flag     = 0x00008000;
            mantissa = 0x00007fff;
            return;

        default:
            continue;
        }
    }

    BOOST_ASSERT(false); 

    // Unknown format.
}


// float (32 bits) -------------------------------------------------------------

template<> struct fp_traits_impl<float, single_precision_tag>
{
    typedef uint32_t bits;
    typedef all_bits coverage;

    BOOST_STATIC_CONSTANT(uint32_t, sign     = 0x80000000);
    BOOST_STATIC_CONSTANT(uint32_t, exponent = 0x7f800000);
    BOOST_STATIC_CONSTANT(uint32_t, flag     = 0x00000000);
    BOOST_STATIC_CONSTANT(uint32_t, mantissa = 0x007fffff);

    static void init() {}
    static void get_bits(float x, uint32_t& a) { memcpy(&a, &x, 4); }
    static void set_bits(float& x, uint32_t a) { memcpy(&x, &a, 4); }
};


// double (64 bits) ------------------------------------------------------------

#if defined(BOOST_NO_INT64_T) || defined(BOOST_NO_INCLASS_MEMBER_INITIALIZATION)

template<> struct fp_traits_impl<double, double_precision_tag>
{
    typedef uint32_t bits;
    typedef not_all_bits coverage;

    BOOST_STATIC_CONSTANT(uint32_t, sign     = 0x80000000);
    BOOST_STATIC_CONSTANT(uint32_t, exponent = 0x7ff00000);
    BOOST_STATIC_CONSTANT(uint32_t, flag     = 0);
    BOOST_STATIC_CONSTANT(uint32_t, mantissa = 0x000fffff);

    static void init() {}

    static void get_bits(double x, uint32_t& a)
    {
        memcpy(&a, reinterpret_cast<const unsigned char*>(&x) + offset_, 4);
    }

    static void set_bits(double& x, uint32_t a)
    {
        memcpy(reinterpret_cast<unsigned char*>(&x) + offset_, &a, 4);
    }

private:

#if defined(BOOST_BIG_ENDIAN)
    BOOST_STATIC_CONSTANT(int, offset_ = 0);
#elif defined(BOOST_LITTLE_ENDIAN)
    BOOST_STATIC_CONSTANT(int, offset_ = 4);
#else
    BOOST_STATIC_ASSERT(false);
#endif
};

//..............................................................................

#else

template<> struct fp_traits_impl<double, double_precision_tag>
{
    typedef uint64_t bits;
    typedef all_bits coverage;

    static const uint64_t sign     = (uint64_t)0x80000000 << 32;
    static const uint64_t exponent = (uint64_t)0x7ff00000 << 32;
    static const uint64_t flag     = 0;
    static const uint64_t mantissa
        = ((uint64_t)0x000fffff << 32) + (uint64_t)0xffffffff;

    static void init() {}
    static void get_bits(double x, uint64_t& a) { memcpy(&a, &x, 8); }
    static void set_bits(double& x, uint64_t a) { memcpy(&x, &a, 8); }
};

#endif


// long double (64 bits) -------------------------------------------------------

#if defined(BOOST_NO_INT64_T) || defined(BOOST_NO_INCLASS_MEMBER_INITIALIZATION)

template<> struct fp_traits_impl<long double, double_precision_tag>
{
    typedef uint32_t bits;
    typedef not_all_bits coverage;

    BOOST_STATIC_CONSTANT(uint32_t, sign     = 0x80000000);
    BOOST_STATIC_CONSTANT(uint32_t, exponent = 0x7ff00000);
    BOOST_STATIC_CONSTANT(uint32_t, flag     = 0);
    BOOST_STATIC_CONSTANT(uint32_t, mantissa = 0x000fffff);

    static void init() {}

    static void get_bits(long double x, uint32_t& a)
    {
        memcpy(&a, reinterpret_cast<const unsigned char*>(&x) + offset_, 4);
    }

    static void set_bits(long double& x, uint32_t a)
    {
        memcpy(reinterpret_cast<unsigned char*>(&x) + offset_, &a, 4);
    }

private:

#if defined(BOOST_BIG_ENDIAN)
    BOOST_STATIC_CONSTANT(int, offset_ = 0);
#elif defined(BOOST_LITTLE_ENDIAN)
    BOOST_STATIC_CONSTANT(int, offset_ = 4);
#else
    BOOST_STATIC_ASSERT(false);
#endif
};

//..............................................................................

#else

template<> struct fp_traits_impl<long double, double_precision_tag>
{
    typedef uint64_t bits;
    typedef all_bits coverage;

    static const uint64_t sign     = (uint64_t)0x80000000 << 32;
    static const uint64_t exponent = (uint64_t)0x7ff00000 << 32;
    static const uint64_t flag     = 0;
    static const uint64_t mantissa
        = ((uint64_t)0x000fffff << 32) + (uint64_t)0xffffffff;

    static void init() {}
    static void get_bits(long double x, uint64_t& a) { memcpy(&a, &x, 8); }
    static void set_bits(long double& x, uint64_t a) { memcpy(&x, &a, 8); }
};

#endif


// long double (>64 bits), x86 and x64 -----------------------------------------

#if defined(__i386) || defined(__i386__) || defined(_M_IX86) \
    || defined(__amd64) || defined(__amd64__)  || defined(_M_AMD64) \
    || defined(__x86_64) || defined(__x86_64__) || defined(_M_X64)

// Intel extended double precision format (80 bits)

template<> struct fp_traits_impl<long double, extended_double_precision_tag>
{
    typedef uint32_t bits;
    typedef not_all_bits coverage;

    BOOST_STATIC_CONSTANT(uint32_t, sign     = 0x80000000);
    BOOST_STATIC_CONSTANT(uint32_t, exponent = 0x7fff0000);
    BOOST_STATIC_CONSTANT(uint32_t, flag     = 0x00008000);
    BOOST_STATIC_CONSTANT(uint32_t, mantissa = 0x00007fff);

    static void init() {}

    static void get_bits(long double x, uint32_t& a)
    {
        memcpy(&a, reinterpret_cast<const unsigned char*>(&x) + 6, 4);
    }

    static void set_bits(long double& x, uint32_t a)
    {
        memcpy(reinterpret_cast<unsigned char*>(&x) + 6, &a, 4);
    }
};


// long double (>64 bits), Itanium ---------------------------------------------

#elif defined(__ia64) || defined(__ia64__) || defined(_M_IA64)

// The floating point format is unknown at compile time
// No template specialization is provided.
// The generic definition is used.

// The Itanium supports both
// the Intel extended double precision format (80 bits) and
// the IEEE extended double precision format with 15 exponent bits (128 bits).


// long double (>64 bits), PowerPC ---------------------------------------------

#elif defined(__powerpc) || defined(__powerpc__) || defined(__POWERPC__) \
    || defined(__ppc) || defined(__ppc__) || defined(__PPC__)

// PowerPC extended double precision format (128 bits)

template<> struct fp_traits_impl<long double, extended_double_precision_tag>
{
    typedef uint32_t bits;
    typedef not_all_bits coverage;

    BOOST_STATIC_CONSTANT(uint32_t, sign     = 0x80000000);
    BOOST_STATIC_CONSTANT(uint32_t, exponent = 0x7ff00000);
    BOOST_STATIC_CONSTANT(uint32_t, flag     = 0x00000000);
    BOOST_STATIC_CONSTANT(uint32_t, mantissa = 0x000fffff);

    static void init() {}

    static void get_bits(long double x, uint32_t& a)
    {
        memcpy(&a, reinterpret_cast<const unsigned char*>(&x) + offset_, 4);
    }

    static void set_bits(long double& x, uint32_t a)
    {
        memcpy(reinterpret_cast<unsigned char*>(&x) + offset_, &a, 4);
    }

private:

#if defined(BOOST_BIG_ENDIAN)
    BOOST_STATIC_CONSTANT(int, offset_ = 0);
#elif defined(BOOST_LITTLE_ENDIAN)
    BOOST_STATIC_CONSTANT(int, offset_ = 12);
#else
    BOOST_STATIC_ASSERT(false);
#endif
};


// long double (>64 bits), Motorola 68K ----------------------------------------

#elif defined(__m68k) || defined(__m68k__) \
    || defined(__mc68000) || defined(__mc68000__) \

// Motorola extended double precision format (96 bits)

// It is the same format as the Intel extended double precision format,
// except that 1) it is big-endian, 2) the 3rd and 4th byte are padding, and
// 3) the flag bit is not set for infinity

template<> struct fp_traits_impl<long double, extended_double_precision_tag>
{
    typedef uint32_t bits;
    typedef not_all_bits coverage;

    BOOST_STATIC_CONSTANT(uint32_t, sign     = 0x80000000);
    BOOST_STATIC_CONSTANT(uint32_t, exponent = 0x7fff0000);
    BOOST_STATIC_CONSTANT(uint32_t, flag     = 0x00008000);
    BOOST_STATIC_CONSTANT(uint32_t, mantissa = 0x00007fff);

    static void init() {}

    // copy 1st, 2nd, 5th and 6th byte. 3rd and 4th byte are padding.

    static void get_bits(long double x, uint32_t& a)
    {
        memcpy(&a, &x, 2);
        memcpy(reinterpret_cast<unsigned char*>(&a) + 2,
               reinterpret_cast<const unsigned char*>(&x) + 4, 2);
    }

    static void set_bits(long double& x, uint32_t a)
    {
        memcpy(&x, &a, 2);
        memcpy(reinterpret_cast<unsigned char*>(&x) + 4,
               reinterpret_cast<const unsigned char*>(&a) + 2, 2);
    }
};


// long double (>64 bits), All other processors --------------------------------

#else

// IEEE extended double precision format with 15 exponent bits (128 bits)

template<> struct fp_traits_impl<long double, extended_double_precision_tag>
{
    typedef uint32_t bits;
    typedef not_all_bits coverage;

    BOOST_STATIC_CONSTANT(uint32_t, sign     = 0x80000000);
    BOOST_STATIC_CONSTANT(uint32_t, exponent = 0x7fff0000);
    BOOST_STATIC_CONSTANT(uint32_t, flag     = 0x00000000);
    BOOST_STATIC_CONSTANT(uint32_t, mantissa = 0x0000ffff);

    static void init() {}

    static void get_bits(long double x, uint32_t& a)
    {
        memcpy(&a, reinterpret_cast<const unsigned char*>(&x) + offset_, 4);
    }

    static void set_bits(long double& x, uint32_t a)
    {
        memcpy(reinterpret_cast<unsigned char*>(&x) + offset_, &a, 4);
    }

private:

#if defined(BOOST_BIG_ENDIAN)
    BOOST_STATIC_CONSTANT(int, offset_ = 0);
#elif defined(BOOST_LITTLE_ENDIAN)
    BOOST_STATIC_CONSTANT(int, offset_ = 12);
#else
    BOOST_STATIC_ASSERT(false);
#endif
};

#endif


//------------------------------------------------------------------------------

// size_to_precision is a type switch for converting a C++ floating point type
// to the corresponding precision type.

template<int n> struct size_to_precision;

template<> struct size_to_precision<4>
{
    typedef single_precision_tag type;
};

template<> struct size_to_precision<8>
{
    typedef double_precision_tag type;
};

template<> struct size_to_precision<10>
{
    typedef extended_double_precision_tag type;
};

template<> struct size_to_precision<12>
{
    typedef extended_double_precision_tag type;
};

template<> struct size_to_precision<16>
{
    typedef extended_double_precision_tag type;
};

// fp_traits is a type switch that selects the right fp_traits_impl

template<class T> struct fp_traits
{
    BOOST_STATIC_ASSERT(boost::is_floating_point<T>::value);
    typedef BOOST_DEDUCED_TYPENAME size_to_precision<sizeof(T)>::type precision;
    typedef fp_traits_impl<T, precision> type;
};


//------------------------------------------------------------------------------

}   // namespace detail
}   // namespace math
}   // namespace spirit
}   // namespace boost

#endif
