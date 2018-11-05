/*
 (c) 2014 Glen Joseph Fernandes
 glenjofe at gmail dot com

 Distributed under the Boost Software
 License, Version 1.0.
 http://boost.org/LICENSE_1_0.txt
*/
#ifndef BOOST_ALIGN_DETAIL_OFFSET_OBJECT_HPP
#define BOOST_ALIGN_DETAIL_OFFSET_OBJECT_HPP

namespace boost {
    namespace alignment {
        namespace detail {
            template<class T>
            struct offset_object {
                char offset;
                T object;
            };
        }
    }
}

#endif
