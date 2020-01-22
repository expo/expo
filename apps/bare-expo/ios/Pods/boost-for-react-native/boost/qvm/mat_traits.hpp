//Copyright (c) 2008-2016 Emil Dotchevski and Reverge Studios, Inc.

//Distributed under the Boost Software License, Version 1.0. (See accompanying
//file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef UUID_8C06FE26A3E711DEA02C88BA55D89593
#define UUID_8C06FE26A3E711DEA02C88BA55D89593

namespace
boost
    {
    namespace
    qvm
        {
        template <class M>
        struct
        mat_traits
            {
            static int const rows=0;
            static int const cols=0;
            typedef void scalar_type;
            };

        template <class T>
        struct
        is_mat
            {
            static bool const value=mat_traits<T>::rows>0 && mat_traits<T>::cols>0;
            };
        }
    }

#endif
