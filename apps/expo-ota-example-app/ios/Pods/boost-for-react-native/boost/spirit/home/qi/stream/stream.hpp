/*=============================================================================
    Copyright (c) 2001-2011 Hartmut Kaiser

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
==============================================================================*/
#if !defined(BOOST_SPIRIT_STREAM_MAY_05_2007_1228PM)
#define BOOST_SPIRIT_STREAM_MAY_05_2007_1228PM

#if defined(_MSC_VER)
#pragma once
#endif

#include <boost/spirit/home/qi/detail/string_parse.hpp>
#include <boost/spirit/home/qi/stream/detail/match_manip.hpp>
#include <boost/spirit/home/qi/stream/detail/iterator_source.hpp>
#include <boost/spirit/home/support/detail/hold_any.hpp>

#include <iosfwd>
#include <sstream>

///////////////////////////////////////////////////////////////////////////////
namespace boost { namespace spirit
{
    ///////////////////////////////////////////////////////////////////////////
    // Enablers
    ///////////////////////////////////////////////////////////////////////////
    template <>
    struct use_terminal<qi::domain, tag::stream> // enables stream
      : mpl::true_ {};

    template <>
    struct use_terminal<qi::domain, tag::wstream> // enables wstream
      : mpl::true_ {};
}}

///////////////////////////////////////////////////////////////////////////////
namespace boost { namespace spirit { namespace qi
{
#ifndef BOOST_SPIRIT_NO_PREDEFINED_TERMINALS
    using spirit::stream;
    using spirit::wstream;
#endif
    using spirit::stream_type;
    using spirit::wstream_type;

    template <typename Char = char, typename T = spirit::basic_hold_any<char> >
    struct stream_parser
      : primitive_parser<stream_parser<Char, T> >
    {
        template <typename Context, typename Iterator>
        struct attribute
        {
            typedef T type;
        };

        template <typename Iterator, typename Context
          , typename Skipper, typename Attribute>
        bool parse(Iterator& first, Iterator const& last
          , Context& /*context*/, Skipper const& skipper
          , Attribute& attr_) const
        {
            typedef qi::detail::iterator_source<Iterator> source_device;
            typedef boost::iostreams::stream<source_device> instream;

            qi::skip_over(first, last, skipper);

            instream in(first, last);           // copies 'first'
            in >> attr_;                        // use existing operator>>()

            // advance the iterator if everything is ok
            if (in) {
                if (!in.eof()) {
                    std::streamsize pos = in.tellg();
                    std::advance(first, pos);
                } else {
                    first = last;
                }
                return true;
            }

            return false;
        }

        template <typename Context>
        info what(Context& /*context*/) const
        {
            return info("stream");
        }
    };

    template <typename T, typename Char = char>
    struct typed_stream
      : proto::terminal<stream_parser<Char, T> >::type
    {
    };

    ///////////////////////////////////////////////////////////////////////////
    // Parser generators: make_xxx function (objects)
    ///////////////////////////////////////////////////////////////////////////
    template <typename Char>
    struct make_stream
    {
        typedef stream_parser<Char> result_type;
        result_type operator()(unused_type, unused_type) const
        {
            return result_type();
        }
    };

    template <typename Modifiers>
    struct make_primitive<tag::stream, Modifiers> : make_stream<char> {};

    template <typename Modifiers>
    struct make_primitive<tag::wstream, Modifiers> : make_stream<wchar_t> {};
}}}

#endif
