/*=============================================================================
    Copyright (c) 2001-2011 Joel de Guzman
    Copyright (c) 2001-2011 Hartmut Kaiser
    Copyright (c) 2011 Jan Frederick Eick
    Copyright (c) 2011 Christopher Jefferson
    Copyright (c) 2006 Stephen Nutt

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
=============================================================================*/
#if !defined(SPIRIT_NUMERIC_UTILS_APRIL_17_2006_0816AM)
#define SPIRIT_NUMERIC_UTILS_APRIL_17_2006_0816AM

#if defined(_MSC_VER)
#pragma once
#endif

#include <boost/detail/iterator.hpp>
#include <boost/spirit/home/support/unused.hpp>
#include <boost/spirit/home/qi/detail/attributes.hpp>
#include <boost/spirit/home/support/char_encoding/ascii.hpp>
#include <boost/spirit/home/support/numeric_traits.hpp>
#include <boost/preprocessor/repetition/repeat.hpp>
#include <boost/preprocessor/iteration/local.hpp>
#include <boost/preprocessor/comparison/less.hpp>
#include <boost/preprocessor/control/if.hpp>
#include <boost/preprocessor/seq/elem.hpp>
#include <boost/utility/enable_if.hpp>
#include <boost/type_traits/is_integral.hpp>
#include <boost/type_traits/is_signed.hpp>
#include <boost/mpl/bool.hpp>
#include <boost/mpl/and.hpp>
#include <boost/limits.hpp>
#include <boost/integer_traits.hpp>

#if defined(BOOST_MSVC)
# pragma warning(push)
# pragma warning(disable: 4127) // conditional expression is constant
#endif

#if !defined(SPIRIT_NUMERICS_LOOP_UNROLL)
# define SPIRIT_NUMERICS_LOOP_UNROLL 3
#endif

namespace boost { namespace spirit { namespace qi { namespace detail
{
    ///////////////////////////////////////////////////////////////////////////
    //
    //  The maximum radix digits that can be represented without
    //  overflow:
    //
    //          template<typename T, unsigned Radix>
    //          struct digits_traits::value;
    //
    ///////////////////////////////////////////////////////////////////////////
    template <typename T, unsigned Radix>
    struct digits_traits;

// lookup table for log2(x) : 2 <= x <= 36
#define BOOST_SPIRIT_LOG2 (#error)(#error)                                    \
        (1000000)(1584960)(2000000)(2321920)(2584960)(2807350)                \
        (3000000)(3169920)(3321920)(3459430)(3584960)(3700430)                \
        (3807350)(3906890)(4000000)(4087460)(4169920)(4247920)                \
        (4321920)(4392310)(4459430)(4523560)(4584960)(4643850)                \
        (4700430)(4754880)(4807350)(4857980)(4906890)(4954190)                \
        (5000000)(5044390)(5087460)(5129280)(5169925)                         \
    /***/

#define BOOST_PP_LOCAL_MACRO(Radix)                                           \
    template <typename T> struct digits_traits<T, Radix>                      \
    {                                                                         \
        typedef std::numeric_limits<T> numeric_limits_type;                   \
        BOOST_STATIC_CONSTANT(int, value = static_cast<int>(                  \
            (numeric_limits_type::digits * 1000000) /                         \
                BOOST_PP_SEQ_ELEM(Radix, BOOST_SPIRIT_LOG2)));                \
    };                                                                        \
    /***/

#define BOOST_PP_LOCAL_LIMITS (2, 36)
#include BOOST_PP_LOCAL_ITERATE()

#undef BOOST_SPIRIT_LOG2

    ///////////////////////////////////////////////////////////////////////////
    //
    //  Traits class for radix specific number conversion
    //
    //      Test the validity of a single character:
    //
    //          template<typename Char> static bool is_valid(Char ch);
    //
    //      Convert a digit from character representation to binary
    //      representation:
    //
    //          template<typename Char> static int digit(Char ch);
    //
    ///////////////////////////////////////////////////////////////////////////
    template <unsigned Radix>
    struct radix_traits
    {
        template <typename Char>
        inline static bool is_valid(Char ch)
        {
            if (Radix <= 10)
                return (ch >= '0' && ch <= static_cast<Char>('0' + Radix -1));
            return (ch >= '0' && ch <= '9')
                || (ch >= 'a' && ch <= static_cast<Char>('a' + Radix -10 -1))
                || (ch >= 'A' && ch <= static_cast<Char>('A' + Radix -10 -1));
        }

        template <typename Char>
        inline static unsigned digit(Char ch)
        {
            if (Radix <= 10 || (ch >= '0' && ch <= '9'))
                return ch - '0';
            return spirit::char_encoding::ascii::tolower(ch) - 'a' + 10;
        }
    };
    
    template <typename T, T Val>
    struct constexpr_int
    {
        BOOST_STATIC_CONSTEXPR T value = Val; 
    };

    ///////////////////////////////////////////////////////////////////////////
    //  positive_accumulator/negative_accumulator: Accumulator policies for
    //  extracting integers. Use positive_accumulator if number is positive.
    //  Use negative_accumulator if number is negative.
    ///////////////////////////////////////////////////////////////////////////
    template <unsigned Radix>
    struct positive_accumulator
    {
        template <typename T, typename Char>
        inline static void add(T& n, Char ch, mpl::false_) // unchecked add
        {
            const int digit = radix_traits<Radix>::digit(ch);
            n = n * T(Radix) + T(digit);
        }

        template <typename T, typename Char>
        inline static bool add(T& n, Char ch, mpl::true_) // checked add
        {
            // Ensure n *= Radix will not overflow
            typedef constexpr_int<T, boost::integer_traits<T>::const_max> max;
            typedef constexpr_int<T, max::value / Radix> val;

            if (n > val::value)
                return false;

            n *= Radix;

            // Ensure n += digit will not overflow
            const int digit = radix_traits<Radix>::digit(ch);
            if (n > max::value - digit)
                return false;

            n += static_cast<T>(digit);
            return true;
        }
    };

    template <unsigned Radix>
    struct negative_accumulator
    {
        template <typename T, typename Char>
        inline static void add(T& n, Char ch, mpl::false_) // unchecked subtract
        {
            const int digit = radix_traits<Radix>::digit(ch);
            n = n * T(Radix) - T(digit);
        }

        template <typename T, typename Char>
        inline static bool add(T& n, Char ch, mpl::true_) // checked subtract
        {
            // Ensure n *= Radix will not underflow
            typedef constexpr_int<T, boost::integer_traits<T>::const_min> min;
            typedef constexpr_int<T, (min::value + 1) / T(Radix)> val;

            if (n < val::value)
                return false;

            n *= Radix;

            // Ensure n -= digit will not underflow
            int const digit = radix_traits<Radix>::digit(ch);
            if (n < min::value + digit)
                return false;

            n -= static_cast<T>(digit);
            return true;
        }
    };

    ///////////////////////////////////////////////////////////////////////////
    //  Common code for extract_int::parse specializations
    ///////////////////////////////////////////////////////////////////////////
    template <unsigned Radix, typename Accumulator, int MaxDigits, bool AlwaysCheckOverflow>
    struct int_extractor
    {
        template <typename Char, typename T>
        inline static bool
        call(Char ch, std::size_t count, T& n, mpl::true_)
        {
            typedef constexpr_int<std::size_t, digits_traits<T, Radix>::value - 1> overflow_free;

            if (!AlwaysCheckOverflow && (count < overflow_free::value))
            {
                Accumulator::add(n, ch, mpl::false_());
            }
            else
            {
                if (!Accumulator::add(n, ch, mpl::true_()))
                    return false; //  over/underflow!
            }
            return true;
        }

        template <typename Char, typename T>
        inline static bool
        call(Char ch, std::size_t /*count*/, T& n, mpl::false_)
        {
            // no need to check for overflow
            Accumulator::add(n, ch, mpl::false_());
            return true;
        }

        template <typename Char>
        inline static bool
        call(Char /*ch*/, std::size_t /*count*/, unused_type, mpl::false_)
        {
            return true;
        }

        template <typename Char, typename T>
        inline static bool
        call(Char ch, std::size_t count, T& n)
        {
            return call(ch, count, n
              , mpl::bool_<
                    (   (MaxDigits < 0)
                    ||  (MaxDigits > digits_traits<T, Radix>::value)
                    )
                  && traits::check_overflow<T>::value
                >()
            );
        }
    };

    ///////////////////////////////////////////////////////////////////////////
    //  End of loop checking: check if the number of digits
    //  being parsed exceeds MaxDigits. Note: if MaxDigits == -1
    //  we don't do any checking.
    ///////////////////////////////////////////////////////////////////////////
    template <int MaxDigits>
    struct check_max_digits
    {
        inline static bool
        call(std::size_t count)
        {
            return count < MaxDigits; // bounded
        }
    };

    template <>
    struct check_max_digits<-1>
    {
        inline static bool
        call(std::size_t /*count*/)
        {
            return true; // unbounded
        }
    };

    ///////////////////////////////////////////////////////////////////////////
    //  extract_int: main code for extracting integers
    ///////////////////////////////////////////////////////////////////////////
#define SPIRIT_NUMERIC_INNER_LOOP(z, x, data)                                 \
        if (!check_max_digits<MaxDigits>::call(count + leading_zeros)         \
            || it == last)                                                    \
            break;                                                            \
        ch = *it;                                                             \
        if (!radix_check::is_valid(ch))                                       \
            break;                                                            \
        if (!extractor::call(ch, count, val))                                 \
        {                                                                     \
            if (IgnoreOverflowDigits)                                         \
                first = it;                                                   \
            traits::assign_to(val, attr);                                     \
            return IgnoreOverflowDigits;                                      \
        }                                                                     \
        ++it;                                                                 \
        ++count;                                                              \
    /**/

    template <
        typename T, unsigned Radix, unsigned MinDigits, int MaxDigits
      , typename Accumulator = positive_accumulator<Radix>
      , bool Accumulate = false
      , bool IgnoreOverflowDigits = false
    >
    struct extract_int
    {
#if BOOST_WORKAROUND(BOOST_MSVC, >= 1400)
# pragma warning(push)
# pragma warning(disable: 4127)   // conditional expression is constant
#endif
        template <typename Iterator, typename Attribute>
        inline static bool
        parse_main(
            Iterator& first
          , Iterator const& last
          , Attribute& attr)
        {
            typedef radix_traits<Radix> radix_check;
            typedef int_extractor<Radix, Accumulator, MaxDigits, Accumulate> extractor;
            typedef typename
                boost::detail::iterator_traits<Iterator>::value_type
            char_type;

            Iterator it = first;
            std::size_t leading_zeros = 0;
            if (!Accumulate)
            {
                // skip leading zeros
                while (it != last && *it == '0' && (MaxDigits < 0 || leading_zeros < static_cast< std::size_t >(MaxDigits)))
                {
                    ++it;
                    ++leading_zeros;
                }
            }

            typedef typename
                traits::attribute_type<Attribute>::type
            attribute_type;

            attribute_type val = Accumulate ? attr : attribute_type(0);
            std::size_t count = 0;
            char_type ch;

            while (true)
            {
                BOOST_PP_REPEAT(
                    SPIRIT_NUMERICS_LOOP_UNROLL
                  , SPIRIT_NUMERIC_INNER_LOOP, _)
            }

            if (count + leading_zeros >= MinDigits)
            {
                traits::assign_to(val, attr);
                first = it;
                return true;
            }
            return false;
        }
#if BOOST_WORKAROUND(BOOST_MSVC, >= 1400)
# pragma warning(pop)
#endif

        template <typename Iterator>
        inline static bool
        parse(
            Iterator& first
          , Iterator const& last
          , unused_type)
        {
            T n = 0; // must calculate value to detect over/underflow
            return parse_main(first, last, n);
        }

        template <typename Iterator, typename Attribute>
        inline static bool
        parse(
            Iterator& first
          , Iterator const& last
          , Attribute& attr)
        {
            return parse_main(first, last, attr);
        }
    };
#undef SPIRIT_NUMERIC_INNER_LOOP

    ///////////////////////////////////////////////////////////////////////////
    //  extract_int: main code for extracting integers
    //  common case where MinDigits == 1 and MaxDigits = -1
    ///////////////////////////////////////////////////////////////////////////
#define SPIRIT_NUMERIC_INNER_LOOP(z, x, data)                                 \
        if (it == last)                                                       \
            break;                                                            \
        ch = *it;                                                             \
        if (!radix_check::is_valid(ch))                                       \
            break;                                                            \
        if (!extractor::call(ch, count, val))                                 \
        {                                                                     \
            traits::assign_to(val, attr);                                     \
            return false;                                                     \
        }                                                                     \
        ++it;                                                                 \
        ++count;                                                              \
    /**/

    template <typename T, unsigned Radix, typename Accumulator, bool Accumulate>
    struct extract_int<T, Radix, 1, -1, Accumulator, Accumulate>
    {
#if BOOST_WORKAROUND(BOOST_MSVC, >= 1400)
# pragma warning(push)
# pragma warning(disable: 4127)   // conditional expression is constant
#endif
        template <typename Iterator, typename Attribute>
        inline static bool
        parse_main(
            Iterator& first
          , Iterator const& last
          , Attribute& attr)
        {
            typedef radix_traits<Radix> radix_check;
            typedef int_extractor<Radix, Accumulator, -1, Accumulate> extractor;
            typedef typename
                boost::detail::iterator_traits<Iterator>::value_type
            char_type;

            Iterator it = first;
            std::size_t count = 0;
            if (!Accumulate)
            {
                // skip leading zeros
                while (it != last && *it == '0')
                {
                    ++it;
                    ++count;
                }

                if (it == last)
                {
                    if (count == 0) // must have at least one digit
                        return false;
                    traits::assign_to(0, attr);
                    first = it;
                    return true;
                }
            }

            typedef typename
                traits::attribute_type<Attribute>::type
            attribute_type;

            attribute_type val = Accumulate ? attr : attribute_type(0);
            char_type ch = *it;

            if (!radix_check::is_valid(ch) || !extractor::call(ch, 0, val))
            {
                if (count == 0) // must have at least one digit
                    return false;
                traits::assign_to(val, attr);
                first = it;
                return true;
            }

            // count = 0; $$$ verify: I think this is wrong $$$
            ++it;
            while (true)
            {
                BOOST_PP_REPEAT(
                    SPIRIT_NUMERICS_LOOP_UNROLL
                  , SPIRIT_NUMERIC_INNER_LOOP, _)
            }

            traits::assign_to(val, attr);
            first = it;
            return true;
        }
#if BOOST_WORKAROUND(BOOST_MSVC, >= 1400)
# pragma warning(pop)
#endif

        template <typename Iterator>
        inline static bool
        parse(
            Iterator& first
          , Iterator const& last
          , unused_type)
        {
            T n = 0; // must calculate value to detect over/underflow
            return parse_main(first, last, n);
        }

        template <typename Iterator, typename Attribute>
        inline static bool
        parse(
            Iterator& first
          , Iterator const& last
          , Attribute& attr)
        {
            return parse_main(first, last, attr);
        }
    };

#undef SPIRIT_NUMERIC_INNER_LOOP

    ///////////////////////////////////////////////////////////////////////////
    // Cast an signed integer to an unsigned integer
    ///////////////////////////////////////////////////////////////////////////
    template <typename T,
        bool force_unsigned
            = mpl::and_<is_integral<T>, is_signed<T> >::value>
    struct cast_unsigned;

    template <typename T>
    struct cast_unsigned<T, true>
    {
        typedef typename make_unsigned<T>::type unsigned_type;
        typedef typename make_unsigned<T>::type& unsigned_type_ref;

        inline static unsigned_type_ref call(T& n)
        {
            return unsigned_type_ref(n);
        }
    };

    template <typename T>
    struct cast_unsigned<T, false>
    {
        inline static T& call(T& n)
        {
            return n;
        }
    };
}}}}

#if defined(BOOST_MSVC)
# pragma warning(pop)
#endif

#endif
