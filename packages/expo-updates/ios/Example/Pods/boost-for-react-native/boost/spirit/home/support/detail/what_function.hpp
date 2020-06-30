/*=============================================================================
    Copyright (c) 2001-2011 Joel de Guzman

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
=============================================================================*/
#if !defined(SPIRIT_WHAT_FUNCTION_APRIL_22_2007_0236PM)
#define SPIRIT_WHAT_FUNCTION_APRIL_22_2007_0236PM

#if defined(_MSC_VER)
#pragma once
#endif

#include <string>
#include <boost/spirit/home/support/info.hpp>
#include <boost/detail/workaround.hpp>

namespace boost { namespace spirit { namespace detail
{
    template <typename Context>
    struct what_function
    {
        what_function(info& what_, Context& context_)
          : what(what_), context(context_)
        {
            what.value = std::list<info>();
        }

        template <typename Component>
        void operator()(Component const& component) const
        {
#if BOOST_WORKAROUND(BOOST_MSVC, BOOST_TESTED_AT(1600))
            component; // suppresses warning: C4100: 'component' : unreferenced formal parameter
#endif
            boost::get<std::list<info> >(what.value).
                push_back(component.what(context));
        }

        info& what;
        Context& context;

    private:
        // silence MSVC warning C4512: assignment operator could not be generated
        what_function& operator= (what_function const&);
    };
}}}

#endif
