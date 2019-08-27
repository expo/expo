/*=============================================================================
    Copyright (c) 2001-2014 Joel de Guzman
    Copyright (c) 2001-2011 Hartmut Kaiser
    http://spirit.sourceforge.net/

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
=============================================================================*/
#if !defined(BOOST_SPIRIT_X3_VALUE_TRAITS_MAY_07_2013_0203PM)
#define BOOST_SPIRIT_X3_VALUE_TRAITS_MAY_07_2013_0203PM

#include <boost/utility/value_init.hpp>

namespace boost { namespace spirit { namespace x3 { namespace traits
{
    template <typename T, typename Enable = void>
    struct value_initialize
    {
        static T call()
        {
            return boost::value_initialized<T>();
        }
    };
}}}}

#endif
