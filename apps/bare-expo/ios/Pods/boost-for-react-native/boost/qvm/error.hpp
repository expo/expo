//Copyright (c) 2008-2016 Emil Dotchevski and Reverge Studios, Inc.

//Distributed under the Boost Software License, Version 1.0. (See accompanying
//file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef UUID_92B1247AAE1111DE9655F2FC55D89593
#define UUID_92B1247AAE1111DE9655F2FC55D89593

#include "boost/exception/exception.hpp"
#include "boost/exception/error_info.hpp"
#include <exception>

namespace
boost
    {
    namespace
    qvm
        {
        struct
        error:
            virtual boost::exception,
            virtual std::exception
            {
            char const *
            what() const throw()
                {
                return "Boost QVM error";
                }

            ~error() throw()
                {
                }
            };

        struct zero_determinant_error: virtual error { };
        struct zero_magnitude_error: virtual error { };
        }
    }

#endif
