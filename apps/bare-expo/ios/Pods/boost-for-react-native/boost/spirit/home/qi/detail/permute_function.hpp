/*=============================================================================
    Copyright (c) 2001-2011 Joel de Guzman

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
=============================================================================*/
#if !defined(SPIRIT_PERMUTE_FUNCTION_MARCH_13_2007_1129AM)
#define SPIRIT_PERMUTE_FUNCTION_MARCH_13_2007_1129AM

#if defined(_MSC_VER)
#pragma once
#endif

#include <boost/spirit/home/support/unused.hpp>
#include <boost/optional.hpp>

namespace boost { namespace spirit { namespace qi { namespace detail
{
    template <typename Iterator, typename Context, typename Skipper>
    struct permute_function
    {
        permute_function(
            Iterator& first_, Iterator const& last_
          , Context& context_, Skipper const& skipper_)
          : first(first_)
          , last(last_)
          , context(context_)
          , skipper(skipper_)
        {
        }

        template <typename Component, typename Attribute>
        bool operator()(Component const& component, Attribute& attr)
        {
            // return true if the parser succeeds and the slot is not yet taken
            if (!*taken && component.parse(first, last, context, skipper, attr))
            {
                *taken = true;
                ++taken;
                return true;
            }
            ++taken;
            return false;
        }

        template <typename Component, typename Attribute>
        bool operator()(Component const& component, boost::optional<Attribute>& attr)
        {
            // return true if the parser succeeds and the slot is not yet taken
            Attribute val;
            if (!*taken && component.parse(first, last, context, skipper, val))
            {
                attr = val;
                *taken = true;
                ++taken;
                return true;
            }
            ++taken;
            return false;
        }

        template <typename Component>
        bool operator()(Component const& component)
        {
            // return true if the parser succeeds and the slot is not yet taken
            if (!*taken && component.parse(first, last, context, skipper, unused))
            {
                *taken = true;
                ++taken;
                return true;
            }
            ++taken;
            return false;
        }

        Iterator& first;
        Iterator const& last;
        Context& context;
        Skipper const& skipper;
        bool* taken;

    private:
        // silence MSVC warning C4512: assignment operator could not be generated
        permute_function& operator= (permute_function const&);
    };
}}}}

#endif
