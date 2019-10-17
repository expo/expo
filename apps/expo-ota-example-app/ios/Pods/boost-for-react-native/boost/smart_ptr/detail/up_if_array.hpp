/*
 * Copyright (c) 2014 Glen Joseph Fernandes 
 * glenfe at live dot com
 *
 * Distributed under the Boost Software License, 
 * Version 1.0. (See accompanying file LICENSE_1_0.txt 
 * or copy at http://boost.org/LICENSE_1_0.txt)
 */
#ifndef BOOST_SMART_PTR_DETAIL_UP_IF_ARRAY_HPP
#define BOOST_SMART_PTR_DETAIL_UP_IF_ARRAY_HPP

#include <memory>

namespace boost {
    namespace detail {
        template<class T>
        struct up_if_array;

        template<class T>
        struct up_if_array<T[]> {
            typedef std::unique_ptr<T[]> type;
        };
    }
}

#endif
