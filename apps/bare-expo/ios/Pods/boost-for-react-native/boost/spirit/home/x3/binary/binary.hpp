/*=============================================================================
    Copyright (c) 2001-2011 Hartmut Kaiser
    Copyright (c) 2001-2011 Joel de Guzman

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
==============================================================================*/
#if !defined(BOOST_SPIRIT_X3_BINARY_MAY_08_2007_0808AM)
#define BOOST_SPIRIT_X3_BINARY_MAY_08_2007_0808AM

#include <boost/spirit/home/x3/core/parser.hpp>
#include <boost/spirit/home/x3/core/skip_over.hpp>
#include <boost/spirit/home/x3/support/traits/move_to.hpp>
#include <cstdint>

#include <boost/endian/conversion.hpp>
#include <boost/endian/arithmetic.hpp>
#include <boost/fusion/include/at.hpp>
#include <boost/mpl/or.hpp>
#include <boost/type_traits/is_integral.hpp>
#include <boost/type_traits/is_enum.hpp>
#include <boost/type_traits/is_floating_point.hpp>
#include <boost/config.hpp>

namespace boost { namespace spirit { namespace x3
{
    template <typename V, typename T
      , boost::endian::order endian, std::size_t bits>
    struct binary_lit_parser
      : parser<binary_lit_parser<V, T, endian, bits> >
    {
        static bool const has_attribute = false;
        typedef unused_type attribute_type;

        binary_lit_parser(V n_)
          : n(n_) {}

        template <typename Iterator, typename Context, typename Attribute>
        bool parse(Iterator& first, Iterator const& last
          , Context& context, unused_type, Attribute& attr_param) const
        {
            x3::skip_over(first, last, context);

            auto bytes = reinterpret_cast<const unsigned char*>(&n);

            Iterator it = first;
            for (unsigned int i = 0; i < sizeof(n); ++i)
            {
                if (it == last || *bytes++ != static_cast<unsigned char>(*it++))
                    return false;
            }

            first = it;
            x3::traits::move_to(n, attr_param);
            return true;
        }

        boost::endian::endian_arithmetic<endian, T, bits> n;
    };

    ///////////////////////////////////////////////////////////////////////////
    template <typename T, boost::endian::order endian, std::size_t bits>
    struct any_binary_parser : parser<any_binary_parser<T, endian, bits > >
    {

        typedef T attribute_type;
        static bool const has_attribute =
            !is_same<unused_type, attribute_type>::value;

        template <typename Iterator, typename Context, typename Attribute>
        bool parse(Iterator& first, Iterator const& last
          , Context& context, unused_type, Attribute& attr_param) const
        {
            x3::skip_over(first, last, context);

            attribute_type attr_;
            auto bytes = reinterpret_cast<unsigned char*>(&attr_);

            Iterator it = first;
            for (unsigned int i = 0; i < sizeof(attr_); ++i)
            {
                if (it == last)
                    return false;
                *bytes++ = *it++;
            }

            first = it;
            x3::traits::move_to(
                    endian::conditional_reverse<endian, endian::order::native>(attr_)
                    , attr_param );
            return true;
        }

        template <typename V>
        binary_lit_parser< V, T, endian, bits> operator()(V n) const
        {
            return {n};
        }
    };

#define BOOST_SPIRIT_MAKE_BINARY_PRIMITIVE(name, endiantype, attrtype, bits)                  \
    typedef any_binary_parser< attrtype, boost::endian::order::endiantype, bits > name##type; \
    name##type const name = name##type();


    BOOST_SPIRIT_MAKE_BINARY_PRIMITIVE(byte_, native, uint_least8_t, 8)
    BOOST_SPIRIT_MAKE_BINARY_PRIMITIVE(word, native, uint_least16_t, 16)
    BOOST_SPIRIT_MAKE_BINARY_PRIMITIVE(big_word, big, uint_least16_t, 16)
    BOOST_SPIRIT_MAKE_BINARY_PRIMITIVE(little_word, little, uint_least16_t, 16)
    BOOST_SPIRIT_MAKE_BINARY_PRIMITIVE(dword, native, uint_least32_t, 32)
    BOOST_SPIRIT_MAKE_BINARY_PRIMITIVE(big_dword, big, uint_least32_t, 32)
    BOOST_SPIRIT_MAKE_BINARY_PRIMITIVE(little_dword, little, uint_least32_t, 32)
#ifdef BOOST_HAS_LONG_LONG
    BOOST_SPIRIT_MAKE_BINARY_PRIMITIVE(qword, native, uint_least64_t, 64)
    BOOST_SPIRIT_MAKE_BINARY_PRIMITIVE(big_qword, big, uint_least64_t, 64)
    BOOST_SPIRIT_MAKE_BINARY_PRIMITIVE(little_qword, little, uint_least64_t, 64)
#endif

    // Use a pseudo configuration macro to make clear that endian libray support
    // for floating point types is required. Must be removed as soon as the endian library
    // properly supports floating point types.
#ifdef BOOST_ENDIAN_HAS_FLOATING_POINT
    BOOST_SPIRIT_MAKE_BINARY_PRIMITIVE(bin_float, native, float, 32)
    BOOST_SPIRIT_MAKE_BINARY_PRIMITIVE(big_bin_float, big, float, 32)
    BOOST_SPIRIT_MAKE_BINARY_PRIMITIVE(little_bin_float, little, float, 32)
    BOOST_SPIRIT_MAKE_BINARY_PRIMITIVE(bin_double, native, double, 64)
    BOOST_SPIRIT_MAKE_BINARY_PRIMITIVE(big_bin_double, big, double, 64)
    BOOST_SPIRIT_MAKE_BINARY_PRIMITIVE(little_bin_double, little, double, 64)
#endif

#undef BOOST_SPIRIT_MAKE_BINARY_PRIMITIVE

    ///////////////////////////////////////////////////////////////////////////
    template <typename T, std::size_t bits>
    struct get_info<any_binary_parser<T, endian::order::little, bits>>
    {
        typedef std::string result_type;
        std::string operator()(any_binary_parser<T, endian::order::little, bits> const& p) const
        {
            return "little-endian binary";
        }
    };

    template <typename T, std::size_t bits>
    struct get_info<any_binary_parser<T, endian::order::big, bits>>
    {
        typedef std::string result_type;
        std::string operator()(any_binary_parser<T, endian::order::big, bits> const& p) const
        {
            return "big-endian binary";
        }
    };

    template <typename V, typename T, std::size_t bits>
    struct get_info<binary_lit_parser<V, T, endian::order::little, bits>>
    {
        typedef std::string result_type;
        std::string operator()(binary_lit_parser<V, T, endian::order::little, bits> const& p) const
        {
            return "little-endian binary";
        }
    };

    template <typename V, typename T, std::size_t bits>
    struct get_info<binary_lit_parser<V, T, endian::order::big, bits>>
    {
        typedef std::string result_type;
        std::string operator()(binary_lit_parser<V, T, endian::order::big, bits> const& p) const
        {
            return "big-endian binary";
        }
    };

}}}

#endif
