/*!
@file
Defines `boost::hana::detail::index_if`.

@copyright Louis Dionne 2013-2016
Distributed under the Boost Software License, Version 1.0.
(See accompanying file LICENSE.md or copy at http://boost.org/LICENSE_1_0.txt)
 */

#ifndef BOOST_HANA_DETAIL_INDEX_IF_HPP
#define BOOST_HANA_DETAIL_INDEX_IF_HPP

#include <boost/hana/config.hpp>
#include <boost/hana/core/when.hpp>

#include <cstddef>
#include <utility>


BOOST_HANA_NAMESPACE_BEGIN namespace detail {
    template <typename ...T>
    struct pack {
        static constexpr std::size_t length = sizeof...(T);
    };

    template <typename T>
    struct make_pack;

    template <template <typename...> class Template, typename ...T>
    struct make_pack<Template<T...>> {
        using type = pack<T...>;
    };

    template <typename T> struct make_pack<T const> : make_pack<T> { };
    template <typename T> struct make_pack<T&> : make_pack<T> { };
    template <typename T> struct make_pack<T&&> : make_pack<T> { };


    //! @ingroup group-details
    //! Returns the index of the first element of the `pack<>` that satisfies
    //! the predicate, or the size of the pack if there is no such element.
    //!
    //! @note
    //! The predicate must return an `IntegralConstant` that can be explicitly
    //! converted to `bool`.
    template <typename Pred, typename Ts, typename = when<true>>
    struct index_if;

    //! @cond
    template <typename Pred, typename T, typename ...Ts>
    struct index_if<Pred, pack<T, Ts...>, when<static_cast<bool>(decltype(
        std::declval<Pred>()(std::declval<T>())
    )::value)>> {
        static constexpr std::size_t value = 0;
    };

    template <typename Pred, typename T, typename ...Ts>
    struct index_if<Pred, pack<T, Ts...>, when<!static_cast<bool>(decltype(
        std::declval<Pred>()(std::declval<T>())
    )::value)>> {
        static constexpr std::size_t value = 1 + index_if<Pred, pack<Ts...>>::value;
    };

    template <typename Pred>
    struct index_if<Pred, pack<>> {
        static constexpr std::size_t value = 0;
    };
    //! @endcond
} BOOST_HANA_NAMESPACE_END

#endif // !BOOST_HANA_DETAIL_INDEX_IF_HPP
