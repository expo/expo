//Copyright (c) 2008-2016 Emil Dotchevski and Reverge Studios, Inc.

//Distributed under the Boost Software License, Version 1.0. (See accompanying
//file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef UUID_2812944066B011E29F616DCB6188709B
#define UUID_2812944066B011E29F616DCB6188709B

#include <boost/exception/to_string.hpp>

namespace
boost
    {
    namespace
    qvm
        {
        namespace
        qvm_to_string_detail
            {
            template <class T>
            std::string
            to_string( T const & x )
                {
                using boost::to_string;
                return to_string(x);
                }
            }
        }
    }

#endif
