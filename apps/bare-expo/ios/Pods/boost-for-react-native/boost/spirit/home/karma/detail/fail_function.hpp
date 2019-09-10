//  Copyright (c) 2001-2011 Hartmut Kaiser
//  Copyright (c) 2001-2011 Joel de Guzman
// 
//  Distributed under the Boost Software License, Version 1.0. (See accompanying 
//  file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#if !defined(SPIRIT_KARMA_SEQUENCE_FEB_28_2007_0249PM)
#define SPIRIT_KARMA_SEQUENCE_FEB_28_2007_0249PM

#if defined(_MSC_VER)
#pragma once
#endif

#include <boost/spirit/home/support/unused.hpp>
#include <boost/config.hpp>

namespace boost { namespace spirit { namespace karma { namespace detail
{
    template <typename OutputIterator, typename Context, typename Delimiter>
    struct fail_function
    {
        typedef Context context_type;

        fail_function(OutputIterator& sink_, Context& context_
            , Delimiter const& delim_)
          : sink(sink_), ctx(context_), delim(delim_) 
        {}

        template <typename Component, typename Attribute>
        bool operator()(Component const& component, Attribute const& attr) const
        {
#if BOOST_WORKAROUND(BOOST_MSVC, BOOST_TESTED_AT(1600))  
            component; // suppresses warning: C4100: 'component' : unreferenced formal parameter
#endif
            // return true if any of the generators fail
            return !component.generate(sink, ctx, delim, attr);
        }

        template <typename Component>
        bool operator()(Component const& component) const
        {
#if BOOST_WORKAROUND(BOOST_MSVC, BOOST_TESTED_AT(1600))  
            component; // suppresses warning: C4100: 'component' : unreferenced formal parameter
#endif
            // return true if any of the generators fail
            return !component.generate(sink, ctx, delim, unused);
        }

        OutputIterator& sink;
        Context& ctx;
        Delimiter const& delim;

    private:
        // silence MSVC warning C4512: assignment operator could not be generated
        fail_function& operator= (fail_function const&);
    };

}}}}

#endif
