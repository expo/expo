//Copyright (c) 2008-2016 Emil Dotchevski and Reverge Studios, Inc.

//Distributed under the Boost Software License, Version 1.0. (See accompanying
//file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef UUID_4E340430AE4C11DEBA56149755D89593
#define UUID_4E340430AE4C11DEBA56149755D89593

namespace
boost
    {
    namespace
    qvm
        {
        namespace
        qvm_detail
            {
            template <class T>
            struct
            remove_const
                {
                typedef T type;
                };

            template <class T>
            struct
            remove_const<T const>
                {
                typedef T type;
                };
            }
        }
    }

#endif
