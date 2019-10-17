// Copyright (c) 2009-2016 Vladimir Batov.
// Use, modification and distribution are subject to the Boost Software License,
// Version 1.0. See http://www.boost.org/LICENSE_1_0.txt.

#ifndef BOOST_CONVERT_DETAIL_IS_CHAR_HPP
#define BOOST_CONVERT_DETAIL_IS_CHAR_HPP

#include <boost/mpl/bool.hpp>
#include <boost/type_traits/remove_const.hpp>

namespace boost { namespace cnv
{
    namespace detail
    {
        template<typename T> struct is_char          : mpl::false_ {};
        template<>           struct is_char<char>    : mpl:: true_ {};
        template<>           struct is_char<wchar_t> : mpl:: true_ {};
    }
    template <typename T> struct is_char : detail::is_char<typename remove_const<T>::type> {};
}}

#endif // BOOST_CONVERT_DETAIL_IS_CHAR_HPP

