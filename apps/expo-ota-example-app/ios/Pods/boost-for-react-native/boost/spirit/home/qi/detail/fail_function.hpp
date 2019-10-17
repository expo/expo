/*=============================================================================
    Copyright (c) 2001-2011 Joel de Guzman

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
=============================================================================*/
#if !defined(SPIRIT_FAIL_FUNCTION_APRIL_22_2006_0159PM)
#define SPIRIT_FAIL_FUNCTION_APRIL_22_2006_0159PM

#if defined(_MSC_VER)
#pragma once
#endif

#include <boost/spirit/home/support/unused.hpp>

namespace boost { namespace spirit { namespace qi { namespace detail
{
    template <typename Iterator, typename Context, typename Skipper>
    struct fail_function
    {
        typedef Iterator iterator_type;
        typedef Context context_type;

        fail_function(
            Iterator& first_, Iterator const& last_
          , Context& context_, Skipper const& skipper_)
          : first(first_)
          , last(last_)
          , context(context_)
          , skipper(skipper_)
        {
        }

        template <typename Component, typename Attribute>
        bool operator()(Component const& component, Attribute& attr) const
        {
            // return true if the parser fails
            return !component.parse(first, last, context, skipper, attr);
        }

        template <typename Component>
        bool operator()(Component const& component) const
        {
            // return true if the parser fails
            return !component.parse(first, last, context, skipper, unused);
        }

        Iterator& first;
        Iterator const& last;
        Context& context;
        Skipper const& skipper;

    private:
        // silence MSVC warning C4512: assignment operator could not be generated
        fail_function& operator= (fail_function const&);
    };
}}}}

#endif
