/*=============================================================================
    Copyright (c) 2011 Jamboree
    Copyright (c) 2014 Lee Clagett

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
==============================================================================*/
#if !defined(BOOST_SPIRIT_X3_SEEK_APRIL_13_2014_1920PM)
#define BOOST_SPIRIT_X3_SEEK_APRIL_13_2014_1920PM

#if defined(_MSC_VER)
#pragma once
#endif

#include <boost/spirit/home/x3/core/parser.hpp>

namespace boost { namespace spirit { namespace x3
{
    template<typename Subject>
    struct seek_directive : unary_parser<Subject, seek_directive<Subject>>
    {
        typedef unary_parser<Subject, seek_directive<Subject>> base_type;
        static bool const is_pass_through_unary = true;
        static bool const handles_container = Subject::handles_container;

        seek_directive(Subject const& subject) :
            base_type(subject) {}

        template<typename Iterator, typename Context
          , typename RContext, typename Attribute>
        bool parse(
            Iterator& first, Iterator const& last
          , Context const& context, RContext& rcontext, Attribute& attr) const
        {
            Iterator current(first);
            for (/**/; current != last; ++current)
            {
                if (this->subject.parse(current, last, context, rcontext, attr))
                {
                    first = current;
                    return true;
                }
            }

            // Test for when subjects match on input empty. Example:
            //     comment = "//" >> seek[eol | eoi]
            if (this->subject.parse(current, last, context, rcontext, attr))
            {
                first = current;
                return true;
            }

            return false;
        }
    };

    struct seek_gen
    {
        template<typename Subject>
        seek_directive<typename extension::as_parser<Subject>::value_type>
        operator[](Subject const& subject) const
        {
            return {as_parser(subject)};
        }
    };

    seek_gen const seek = seek_gen();
}}}

#endif
