// Copyright (c) 2009-2016 Vladimir Batov.
// Use, modification and distribution are subject to the Boost Software License,
// Version 1.0. See http://www.boost.org/LICENSE_1_0.txt.

#ifndef BOOST_CONVERT_PARAMETERS_HPP
#define BOOST_CONVERT_PARAMETERS_HPP

#include <boost/convert/detail/boost_parameter_ext.hpp>

namespace boost
{
    namespace cnv
    {
        struct adjust { enum type { left, right, center };};
        struct base { enum type { bin =2, dec =10, hex =16, oct =8 };};
        struct notation { enum type { fixed, scientific };};

        namespace parameter
        {
            BOOST_PARAMETER_KEYWORD(type,     adjust)
            BOOST_PARAMETER_KEYWORD(type,       base)
            BOOST_PARAMETER_KEYWORD(type,       fill)
            BOOST_PARAMETER_KEYWORD(type,     locale)
            BOOST_PARAMETER_KEYWORD(type,   notation)
            BOOST_PARAMETER_KEYWORD(type,  precision)
            BOOST_PARAMETER_KEYWORD(type,     skipws)
            BOOST_PARAMETER_KEYWORD(type,  uppercase)
            BOOST_PARAMETER_KEYWORD(type,      width)
        }
    }
}

#endif // BOOST_CONVERT_PARAMETERS_HPP
