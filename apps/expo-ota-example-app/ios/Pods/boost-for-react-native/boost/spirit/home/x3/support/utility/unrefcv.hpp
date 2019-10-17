/*//////////////////////////////////////////////////////////////////////////////
    Copyright (c) 2014 Jamboree

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//////////////////////////////////////////////////////////////////////////////*/
#ifndef BOOST_SPIRIT_X3_UNREFCV_HPP_INCLUDED
#define BOOST_SPIRIT_X3_UNREFCV_HPP_INCLUDED

#include <boost/type_traits/remove_cv.hpp>
#include <boost/type_traits/remove_reference.hpp>


namespace boost { namespace spirit { namespace x3
{
    template <typename T>
    struct unrefcv : remove_cv<typename remove_reference<T>::type> {};

    template <typename T>
    using unrefcv_t = typename unrefcv<T>::type;
}}}


#endif

