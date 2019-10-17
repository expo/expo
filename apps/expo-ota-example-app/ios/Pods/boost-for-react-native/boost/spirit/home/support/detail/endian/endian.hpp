//  Boost endian.hpp header file -------------------------------------------------------//

//  (C) Copyright Darin Adler 2000
//  (C) Copyright Beman Dawes 2006, 2009

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt

//  See library home page at http://www.boost.org/libs/endian

//--------------------------------------------------------------------------------------//

//  Original design developed by Darin Adler based on classes developed by Mark
//  Borgerding. Four original class templates were combined into a single endian
//  class template by Beman Dawes, who also added the unrolled_byte_loops sign
//  partial specialization to correctly extend the sign when cover integer size
//  differs from endian representation size.

// TODO: When a compiler supporting constexpr becomes available, try possible uses.

#ifndef BOOST_SPIRIT_ENDIAN_HPP
#define BOOST_SPIRIT_ENDIAN_HPP

#if defined(_MSC_VER)
#pragma once
#endif

#ifdef BOOST_ENDIAN_LOG
# include <iostream>
#endif

#if defined(__BORLANDC__) || defined( __CODEGEARC__)
# pragma pack(push, 1)
#endif

#include <boost/config.hpp>
#include <boost/detail/endian.hpp>
#define BOOST_MINIMAL_INTEGER_COVER_OPERATORS
#define BOOST_NO_IO_COVER_OPERATORS
#include <boost/spirit/home/support/detail/endian/cover_operators.hpp>
#undef  BOOST_NO_IO_COVER_OPERATORS
#undef  BOOST_MINIMAL_INTEGER_COVER_OPERATORS
#include <boost/type_traits/is_signed.hpp>
#include <boost/type_traits/make_unsigned.hpp>
#include <boost/cstdint.hpp>
#include <boost/static_assert.hpp>
#include <boost/spirit/home/support/detail/scoped_enum_emulation.hpp>
#include <iosfwd>
#include <climits>

# if CHAR_BIT != 8
#   error Platforms with CHAR_BIT != 8 are not supported
# endif

# define BOOST_ENDIAN_DEFAULT_CONSTRUCT {}          // C++03

# if defined(BOOST_ENDIAN_FORCE_PODNESS)
#   define BOOST_ENDIAN_NO_CTORS
# endif


namespace boost { namespace spirit
{
  namespace detail
  {
    // Unrolled loops for loading and storing streams of bytes.

    template <typename T, std::size_t n_bytes,
      bool sign=boost::is_signed<T>::value >
    struct unrolled_byte_loops
    {
      typedef unrolled_byte_loops<T, n_bytes - 1, sign> next;

      static typename boost::make_unsigned<T>::type load_big(const unsigned char* bytes)
        { return *(bytes - 1) | (next::load_big(bytes - 1) << 8); }
      static typename boost::make_unsigned<T>::type load_little(const unsigned char* bytes)
        { return *bytes | (next::load_little(bytes + 1) << 8); }

      static void store_big(char* bytes, T value)
        {
          *(bytes - 1) = static_cast<char>(value);
          next::store_big(bytes - 1, value >> 8);
        }
      static void store_little(char* bytes, T value)
        {
          *bytes = static_cast<char>(value);
          next::store_little(bytes + 1, value >> 8);
        }
    };

    template <typename T>
    struct unrolled_byte_loops<T, 1, false>
    {
      static T load_big(const unsigned char* bytes)
        { return *(bytes - 1); }
      static T load_little(const unsigned char* bytes)
        { return *bytes; }
      static void store_big(char* bytes, T value)
        { *(bytes - 1) = static_cast<char>(value); }
      static void store_little(char* bytes, T value)
        { *bytes = static_cast<char>(value); }

    };

    template <typename T>
    struct unrolled_byte_loops<T, 1, true>
    {
      static typename boost::make_unsigned<T>::type load_big(const unsigned char* bytes)
        { return *(bytes - 1); }
      static typename boost::make_unsigned<T>::type load_little(const unsigned char* bytes)
        { return *bytes; }
      static void store_big(char* bytes, T value)
        { *(bytes - 1) = static_cast<char>(value); }
      static void store_little(char* bytes, T value)
        { *bytes = static_cast<char>(value); }
    };

    template <typename T, std::size_t n_bytes>
    inline
    T load_big_endian(const void* bytes)
    {
      return static_cast<T>(unrolled_byte_loops<T, n_bytes>::load_big
        (static_cast<const unsigned char*>(bytes) + n_bytes));
    }

    template <>
    inline
    float load_big_endian<float, 4>(const void* bytes)
    {
        const unsigned char *b = reinterpret_cast<const unsigned char *>(
            bytes);
        b += 3;

        float value;
        unsigned char *v = reinterpret_cast<unsigned char *>(&value);

        for(std::size_t i = 0; i < 4; ++i)
        {
            *v++ = *b--;
        }

        return value;
    }

    template <>
    inline
    double load_big_endian<double, 8>(const void* bytes)
    {
        const unsigned char *b = reinterpret_cast<const unsigned char *>(
            bytes);
        b += 7;

        double value;
        unsigned char *v = reinterpret_cast<unsigned char *>(&value);

        for(std::size_t i = 0; i < 8; ++i)
        {
            *v++ = *b--;
        }

        return value;
    }

    template <typename T, std::size_t n_bytes>
    inline
    T load_little_endian(const void* bytes)
    {
      return static_cast<T>(unrolled_byte_loops<T, n_bytes>::load_little
        (static_cast<const unsigned char*>(bytes)));
    }

    template <>
    inline
    float load_little_endian<float, 4>(const void* bytes)
    {
        const unsigned char *b = reinterpret_cast<const unsigned char *>(
            bytes);

        float value;
        unsigned char *v = reinterpret_cast<unsigned char *>(&value);

        for(std::size_t i = 0; i < 4; ++i)
        {
            *v++ = *b++;
        }

        return value;
    }

    template <>
    inline
    double load_little_endian<double, 8>(const void* bytes)
    {
        const unsigned char *b = reinterpret_cast<const unsigned char *>(
            bytes);

        double value;
        unsigned char *v = reinterpret_cast<unsigned char *>(&value);

        for(std::size_t i = 0; i < 8; ++i)
        {
            *v++ = *b++;
        }

        return value;
    }

    template <typename T, std::size_t n_bytes>
    inline
    void store_big_endian(void* bytes, T value)
    {
      unrolled_byte_loops<T, n_bytes>::store_big
        (static_cast<char*>(bytes) + n_bytes, value);
    }

    template <>
    inline
    void store_big_endian<float, 4>(void* bytes, float value)
    {
        unsigned char *b = reinterpret_cast<unsigned char *>(bytes);
        b += 3;

        const unsigned char *v = reinterpret_cast<const unsigned char *>(
            &value);

        for(std::size_t i = 0; i < 4; ++i)
        {
            *b-- = *v++;
        }
    }

    template <>
    inline
    void store_big_endian<double, 8>(void* bytes, double value)
    {
        unsigned char *b = reinterpret_cast<unsigned char *>(bytes);
        b += 7;

        const unsigned char *v = reinterpret_cast<const unsigned char *>(
            &value);

        for(std::size_t i = 0; i < 8; ++i)
        {
            *b-- = *v++;
        }
    }

    template <typename T, std::size_t n_bytes>
    inline
    void store_little_endian(void* bytes, T value)
    {
      unrolled_byte_loops<T, n_bytes>::store_little
        (static_cast<char*>(bytes), value);
    }

    template <>
    inline
    void store_little_endian<float, 4>(void* bytes, float value)
    {
        unsigned char *b = reinterpret_cast<unsigned char *>(bytes);

        const unsigned char *v = reinterpret_cast<const unsigned char *>(
            &value);

        for(std::size_t i = 0; i < 4; ++i)
        {
            *b++ = *v++;
        }
    }

    template <>
    inline
    void store_little_endian<double, 8>(void* bytes, double value)
    {
        unsigned char *b = reinterpret_cast<unsigned char *>(bytes);

        const unsigned char *v = reinterpret_cast<const unsigned char *>(
            &value);

        for(std::size_t i = 0; i < 8; ++i)
        {
            *b++ = *v++;
        }
    }

  } // namespace detail

  namespace endian
  {

# ifdef BOOST_ENDIAN_LOG
    bool endian_log(true);
# endif


  //  endian class template and specializations  ---------------------------------------//

  BOOST_SCOPED_ENUM_START(endianness) { big, little, native }; BOOST_SCOPED_ENUM_END
  BOOST_SCOPED_ENUM_START(alignment) { unaligned, aligned }; BOOST_SCOPED_ENUM_END

  template <BOOST_SCOPED_ENUM(endianness) E, typename T, std::size_t n_bits,
    BOOST_SCOPED_ENUM(alignment) A = alignment::unaligned>
    class endian;

    //  Specializations that represent unaligned bytes.
    //  Taking an integer type as a parameter provides a nice way to pass both
    //  the size and signedness of the desired integer and get the appropriate
    //  corresponding integer type for the interface.

    //  unaligned big endian specialization
    template <typename T, std::size_t n_bits>
    class endian< endianness::big, T, n_bits, alignment::unaligned >
      : cover_operators< endian< endianness::big, T, n_bits >, T >
    {
        BOOST_STATIC_ASSERT( (n_bits/8)*8 == n_bits );
      public:
        typedef T value_type;
#     ifndef BOOST_ENDIAN_NO_CTORS
        endian() BOOST_ENDIAN_DEFAULT_CONSTRUCT
        explicit endian(T val)
        {
#       ifdef BOOST_ENDIAN_LOG
          if ( endian_log )
            std::clog << "big, unaligned, " << n_bits << "-bits, construct(" << val << ")\n";
#       endif
          detail::store_big_endian<T, n_bits/8>(m_value, val);
        }
#     endif
        endian & operator=(T val) { detail::store_big_endian<T, n_bits/8>(m_value, val); return *this; }
        operator T() const
        {
#       ifdef BOOST_ENDIAN_LOG
          if ( endian_log )
            std::clog << "big, unaligned, " << n_bits << "-bits, convert(" << detail::load_big_endian<T, n_bits/8>(m_value) << ")\n";
#       endif
          return detail::load_big_endian<T, n_bits/8>(m_value);
        }
      private:
        char m_value[n_bits/8];
    };

    //  unaligned little endian specialization
    template <typename T, std::size_t n_bits>
    class endian< endianness::little, T, n_bits, alignment::unaligned >
      : cover_operators< endian< endianness::little, T, n_bits >, T >
    {
        BOOST_STATIC_ASSERT( (n_bits/8)*8 == n_bits );
      public:
        typedef T value_type;
#     ifndef BOOST_ENDIAN_NO_CTORS
        endian() BOOST_ENDIAN_DEFAULT_CONSTRUCT
        explicit endian(T val)
        {
#       ifdef BOOST_ENDIAN_LOG
          if ( endian_log )
            std::clog << "little, unaligned, " << n_bits << "-bits, construct(" << val << ")\n";
#       endif
          detail::store_little_endian<T, n_bits/8>(m_value, val);
        }
#     endif
        endian & operator=(T val) { detail::store_little_endian<T, n_bits/8>(m_value, val); return *this; }
        operator T() const
        {
#       ifdef BOOST_ENDIAN_LOG
          if ( endian_log )
            std::clog << "little, unaligned, " << n_bits << "-bits, convert(" << detail::load_little_endian<T, n_bits/8>(m_value) << ")\n";
#       endif
          return detail::load_little_endian<T, n_bits/8>(m_value);
        }
      private:
        char m_value[n_bits/8];
    };

    //  unaligned native endian specialization
    template <typename T, std::size_t n_bits>
    class endian< endianness::native, T, n_bits, alignment::unaligned >
      : cover_operators< endian< endianness::native, T, n_bits >, T >
    {
        BOOST_STATIC_ASSERT( (n_bits/8)*8 == n_bits );
      public:
        typedef T value_type;
#   ifndef BOOST_ENDIAN_NO_CTORS
        endian() BOOST_ENDIAN_DEFAULT_CONSTRUCT
#     ifdef BOOST_BIG_ENDIAN
        explicit endian(T val)    { detail::store_big_endian<T, n_bits/8>(m_value, val); }
#     else
        explicit endian(T val)    { detail::store_little_endian<T, n_bits/8>(m_value, val); }
#     endif
#   endif
#   ifdef BOOST_BIG_ENDIAN
        endian & operator=(T val) { detail::store_big_endian<T, n_bits/8>(m_value, val); return *this; }
        operator T() const        { return detail::load_big_endian<T, n_bits/8>(m_value); }
#   else
        endian & operator=(T val) { detail::store_little_endian<T, n_bits/8>(m_value, val); return *this; }
        operator T() const        { return detail::load_little_endian<T, n_bits/8>(m_value); }
#   endif
      private:
        char m_value[n_bits/8];
    };

    //  Specializations that mimic built-in integer types.
    //  These typically have the same alignment as the underlying types.

    //  aligned big endian specialization
    template <typename T, std::size_t n_bits>
    class endian< endianness::big, T, n_bits, alignment::aligned  >
      : cover_operators< endian< endianness::big, T, n_bits, alignment::aligned >, T >
    {
        BOOST_STATIC_ASSERT( (n_bits/8)*8 == n_bits );
        BOOST_STATIC_ASSERT( sizeof(T) == n_bits/8 );
      public:
        typedef T value_type;
#   ifndef BOOST_ENDIAN_NO_CTORS
        endian() BOOST_ENDIAN_DEFAULT_CONSTRUCT
#     ifdef BOOST_BIG_ENDIAN
        endian(T val) : m_value(val) { }
#     else
        explicit endian(T val)    { detail::store_big_endian<T, sizeof(T)>(&m_value, val); }
#     endif
#   endif
#   ifdef BOOST_BIG_ENDIAN
        endian & operator=(T val) { m_value = val; return *this; }
        operator T() const        { return m_value; }
#   else
        endian & operator=(T val) { detail::store_big_endian<T, sizeof(T)>(&m_value, val); return *this; }
        operator T() const        { return detail::load_big_endian<T, sizeof(T)>(&m_value); }
#   endif
      private:
        T m_value;
    };

    //  aligned little endian specialization
    template <typename T, std::size_t n_bits>
    class endian< endianness::little, T, n_bits, alignment::aligned  >
      : cover_operators< endian< endianness::little, T, n_bits, alignment::aligned >, T >
    {
        BOOST_STATIC_ASSERT( (n_bits/8)*8 == n_bits );
        BOOST_STATIC_ASSERT( sizeof(T) == n_bits/8 );
      public:
        typedef T value_type;
#   ifndef BOOST_ENDIAN_NO_CTORS
        endian() BOOST_ENDIAN_DEFAULT_CONSTRUCT
#     ifdef BOOST_LITTLE_ENDIAN
        endian(T val) : m_value(val) { }
#     else
        explicit endian(T val)    { detail::store_little_endian<T, sizeof(T)>(&m_value, val); }
#     endif
#   endif
#   ifdef BOOST_LITTLE_ENDIAN
        endian & operator=(T val) { m_value = val; return *this; }
        operator T() const        { return m_value; }
    #else
        endian & operator=(T val) { detail::store_little_endian<T, sizeof(T)>(&m_value, val); return *this; }
        operator T() const        { return detail::load_little_endian<T, sizeof(T)>(&m_value); }
    #endif
      private:
        T m_value;
    };

  //  naming convention typedefs  ------------------------------------------------------//

    // unaligned big endian signed integer types
    typedef endian< endianness::big, int_least8_t, 8 >           big8_t;
    typedef endian< endianness::big, int_least16_t, 16 >         big16_t;
    typedef endian< endianness::big, int_least32_t, 24 >         big24_t;
    typedef endian< endianness::big, int_least32_t, 32 >         big32_t;
    typedef endian< endianness::big, int_least64_t, 40 >         big40_t;
    typedef endian< endianness::big, int_least64_t, 48 >         big48_t;
    typedef endian< endianness::big, int_least64_t, 56 >         big56_t;
    typedef endian< endianness::big, int_least64_t, 64 >         big64_t;

    // unaligned big endian unsigned integer types
    typedef endian< endianness::big, uint_least8_t, 8 >          ubig8_t;
    typedef endian< endianness::big, uint_least16_t, 16 >        ubig16_t;
    typedef endian< endianness::big, uint_least32_t, 24 >        ubig24_t;
    typedef endian< endianness::big, uint_least32_t, 32 >        ubig32_t;
    typedef endian< endianness::big, uint_least64_t, 40 >        ubig40_t;
    typedef endian< endianness::big, uint_least64_t, 48 >        ubig48_t;
    typedef endian< endianness::big, uint_least64_t, 56 >        ubig56_t;
    typedef endian< endianness::big, uint_least64_t, 64 >        ubig64_t;

    // unaligned little endian signed integer types
    typedef endian< endianness::little, int_least8_t, 8 >        little8_t;
    typedef endian< endianness::little, int_least16_t, 16 >      little16_t;
    typedef endian< endianness::little, int_least32_t, 24 >      little24_t;
    typedef endian< endianness::little, int_least32_t, 32 >      little32_t;
    typedef endian< endianness::little, int_least64_t, 40 >      little40_t;
    typedef endian< endianness::little, int_least64_t, 48 >      little48_t;
    typedef endian< endianness::little, int_least64_t, 56 >      little56_t;
    typedef endian< endianness::little, int_least64_t, 64 >      little64_t;

    // unaligned little endian unsigned integer types
    typedef endian< endianness::little, uint_least8_t, 8 >       ulittle8_t;
    typedef endian< endianness::little, uint_least16_t, 16 >     ulittle16_t;
    typedef endian< endianness::little, uint_least32_t, 24 >     ulittle24_t;
    typedef endian< endianness::little, uint_least32_t, 32 >     ulittle32_t;
    typedef endian< endianness::little, uint_least64_t, 40 >     ulittle40_t;
    typedef endian< endianness::little, uint_least64_t, 48 >     ulittle48_t;
    typedef endian< endianness::little, uint_least64_t, 56 >     ulittle56_t;
    typedef endian< endianness::little, uint_least64_t, 64 >     ulittle64_t;

    // unaligned native endian signed integer types
    typedef endian< endianness::native, int_least8_t, 8 >        native8_t;
    typedef endian< endianness::native, int_least16_t, 16 >      native16_t;
    typedef endian< endianness::native, int_least32_t, 24 >      native24_t;
    typedef endian< endianness::native, int_least32_t, 32 >      native32_t;
    typedef endian< endianness::native, int_least64_t, 40 >      native40_t;
    typedef endian< endianness::native, int_least64_t, 48 >      native48_t;
    typedef endian< endianness::native, int_least64_t, 56 >      native56_t;
    typedef endian< endianness::native, int_least64_t, 64 >      native64_t;

    // unaligned native endian unsigned integer types
    typedef endian< endianness::native, uint_least8_t, 8 >       unative8_t;
    typedef endian< endianness::native, uint_least16_t, 16 >     unative16_t;
    typedef endian< endianness::native, uint_least32_t, 24 >     unative24_t;
    typedef endian< endianness::native, uint_least32_t, 32 >     unative32_t;
    typedef endian< endianness::native, uint_least64_t, 40 >     unative40_t;
    typedef endian< endianness::native, uint_least64_t, 48 >     unative48_t;
    typedef endian< endianness::native, uint_least64_t, 56 >     unative56_t;
    typedef endian< endianness::native, uint_least64_t, 64 >     unative64_t;

#define BOOST_HAS_INT16_T
#define BOOST_HAS_INT32_T
#define BOOST_HAS_INT64_T

  //  These types only present if platform has exact size integers:
  //     aligned big endian signed integer types
  //     aligned big endian unsigned integer types
  //     aligned little endian signed integer types
  //     aligned little endian unsigned integer types

  //     aligned native endian typedefs are not provided because
  //     <cstdint> types are superior for this use case

# if defined(BOOST_HAS_INT16_T)
    typedef endian< endianness::big, int16_t, 16, alignment::aligned >      aligned_big16_t;
    typedef endian< endianness::big, uint16_t, 16, alignment::aligned >     aligned_ubig16_t;
    typedef endian< endianness::little, int16_t, 16, alignment::aligned >   aligned_little16_t;
    typedef endian< endianness::little, uint16_t, 16, alignment::aligned >  aligned_ulittle16_t;
# endif

# if defined(BOOST_HAS_INT32_T)
    typedef endian< endianness::big, int32_t, 32, alignment::aligned >      aligned_big32_t;
    typedef endian< endianness::big, uint32_t, 32, alignment::aligned >     aligned_ubig32_t;
    typedef endian< endianness::little, int32_t, 32, alignment::aligned >   aligned_little32_t;
    typedef endian< endianness::little, uint32_t, 32, alignment::aligned >  aligned_ulittle32_t;
# endif

# if defined(BOOST_HAS_INT64_T)
    typedef endian< endianness::big, int64_t, 64, alignment::aligned >      aligned_big64_t;
    typedef endian< endianness::big, uint64_t, 64, alignment::aligned >     aligned_ubig64_t;
    typedef endian< endianness::little, int64_t, 64, alignment::aligned >   aligned_little64_t;
    typedef endian< endianness::little, uint64_t, 64, alignment::aligned >  aligned_ulittle64_t;
# endif

  } // namespace endian
}} // namespace boost::spirit

// import the namespace above into boost::endian
namespace boost { namespace endian
{
    using namespace boost::spirit::endian;
}}

#if defined(__BORLANDC__) || defined( __CODEGEARC__)
# pragma pack(pop)
#endif

#endif // BOOST_SPIRIT_ENDIAN_HPP
