/*//////////////////////////////////////////////////////////////////////////////
    Copyright (c) 2014 Jamboree

    Distributed under the Boost Software License, Version 1.0. (See accompanying
    file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//////////////////////////////////////////////////////////////////////////////*/
#ifndef BOOST_SPIRIT_X3_INTEGER_SEQUENCE_HPP_INCLUDED
#define BOOST_SPIRIT_X3_INTEGER_SEQUENCE_HPP_INCLUDED

#if defined(_MSC_VER)
#pragma once
#endif

#include <cstddef>
#include <boost/type_traits/integral_constant.hpp>

// This is a standard (c++1y) compatible integer_sequence implementation,
// it's needed for now, and it could be replaced with std::integer_sequence
// once the new standard is available everywhere.

namespace boost { namespace spirit { namespace x3
{
    template <typename T, T... Ns>
    struct integer_sequence
    {
        typedef T value_type;
        
        static constexpr std::size_t size() noexcept
        {
            return sizeof...(Ns);
        }
    };
}}}

namespace boost { namespace spirit { namespace x3 { namespace detail
{
    template <typename T, typename S1, typename S2, T N>
    struct accum_integer_sequence;

    template <typename T, T... N1, T... N2, T N>
    struct accum_integer_sequence<T, integer_sequence<T, N1...>, integer_sequence<T, N2...>, N>
    {
        typedef integer_sequence<T, N1..., (N + N2)...> type;
    };

    template <typename N>
    struct make_integer_sequence_impl
    {
        typedef typename N::value_type T;
        static T const n = N::value;
        static T const m = n / 2;
        typedef typename
            make_integer_sequence_impl<integral_constant<T, m>>::type
        part1;
        typedef typename
            make_integer_sequence_impl<integral_constant<T, n - m>>::type
        part2;
        typedef typename
            accum_integer_sequence<T, part1, part2, m>::type
        type;
    };
    
    template <typename T>
    struct make_integer_sequence_impl<integral_constant<T, 0>>
    {
        typedef integer_sequence<T> type;
    };
    
    template <typename T>
    struct make_integer_sequence_impl<integral_constant<T, 1>>
    {
        typedef integer_sequence<T, 0> type;
    };
}}}}

namespace boost { namespace spirit { namespace x3
{
    template <std::size_t... Ns>
    using index_sequence = integer_sequence<std::size_t, Ns...>;

    template <typename T, T N>
    using make_integer_sequence = typename detail::make_integer_sequence_impl<
        integral_constant<T, N>>::type;

    template <std::size_t N>
    using make_index_sequence = make_integer_sequence<std::size_t, N>;

    template <typename... T>
    using index_sequence_for = make_index_sequence<sizeof...(T)>;
}}}


#endif

