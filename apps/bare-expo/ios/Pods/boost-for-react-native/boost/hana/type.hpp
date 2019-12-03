/*!
@file
Defines `boost::hana::type` and related utilities.

@copyright Louis Dionne 2013-2016
Distributed under the Boost Software License, Version 1.0.
(See accompanying file LICENSE.md or copy at http://boost.org/LICENSE_1_0.txt)
 */

#ifndef BOOST_HANA_TYPE_HPP
#define BOOST_HANA_TYPE_HPP

#include <boost/hana/fwd/type.hpp>

#include <boost/hana/bool.hpp>
#include <boost/hana/config.hpp>
#include <boost/hana/detail/operators/adl.hpp>
#include <boost/hana/detail/operators/comparable.hpp>
#include <boost/hana/fwd/concept/metafunction.hpp>
#include <boost/hana/fwd/core/make.hpp>
#include <boost/hana/fwd/equal.hpp>
#include <boost/hana/fwd/hash.hpp>
#include <boost/hana/integral_constant.hpp>

#include <type_traits>
#include <utility>


BOOST_HANA_NAMESPACE_BEGIN
    //////////////////////////////////////////////////////////////////////////
    // basic_type
    //////////////////////////////////////////////////////////////////////////
    //! @cond
    template <typename T>
    struct basic_type : detail::operators::adl<basic_type<T>> {
        using hana_tag = type_tag;

        using type = T;
        constexpr auto operator+() const { return *this; }
    };
    //! @endcond

    //////////////////////////////////////////////////////////////////////////
    // type
    //////////////////////////////////////////////////////////////////////////
    template <typename T>
    struct type_impl {
        struct _ : basic_type<T> { };
    };

    //////////////////////////////////////////////////////////////////////////
    // decltype_
    //////////////////////////////////////////////////////////////////////////
    namespace detail {
        template <typename T, typename = type_tag>
        struct decltype_t {
            using type = typename std::remove_reference<T>::type;
        };

        template <typename T>
        struct decltype_t<T, typename hana::tag_of<T>::type> {
            using type = typename std::remove_reference<T>::type::type;
        };
    }

    //! @cond
    template <typename T>
    constexpr auto decltype_t::operator()(T&&) const
    { return hana::type_c<typename detail::decltype_t<T>::type>; }
    //! @endcond

    //////////////////////////////////////////////////////////////////////////
    // typeid_
    //////////////////////////////////////////////////////////////////////////
    namespace detail {
        template <typename T, typename = type_tag>
        struct typeid_t {
            using type = typename std::remove_cv<
                typename std::remove_reference<T>::type
            >::type;
        };

        template <typename T>
        struct typeid_t<T, typename hana::tag_of<T>::type> {
            using type = typename std::remove_reference<T>::type::type;
        };
    }
    //! @cond
    template <typename T>
    constexpr auto typeid_t::operator()(T&&) const
    { return hana::type_c<typename detail::typeid_t<T>::type>; }
    //! @endcond

    //////////////////////////////////////////////////////////////////////////
    // make<type_tag>
    //////////////////////////////////////////////////////////////////////////
    template <>
    struct make_impl<type_tag> {
        template <typename T>
        static constexpr auto apply(T&& t)
        { return hana::typeid_(static_cast<T&&>(t)); }
    };

    //////////////////////////////////////////////////////////////////////////
    // sizeof_
    //////////////////////////////////////////////////////////////////////////
    //! @cond
    template <typename T>
    constexpr auto sizeof_t::operator()(T&&) const
    { return hana::size_c<sizeof(typename detail::decltype_t<T>::type)>; }
    //! @endcond

    //////////////////////////////////////////////////////////////////////////
    // alignof_
    //////////////////////////////////////////////////////////////////////////
    //! @cond
    template <typename T>
    constexpr auto alignof_t::operator()(T&&) const
    { return hana::size_c<alignof(typename detail::decltype_t<T>::type)>; }
    //! @endcond

    //////////////////////////////////////////////////////////////////////////
    // is_valid
    //////////////////////////////////////////////////////////////////////////
    namespace type_detail {
        template <typename F, typename ...Args, typename = decltype(
            std::declval<F&&>()(std::declval<Args&&>()...)
        )>
        constexpr auto is_valid_impl(int) { return hana::true_c; }

        template <typename F, typename ...Args>
        constexpr auto is_valid_impl(...) { return hana::false_c; }

        template <typename F>
        struct is_valid_fun {
            template <typename ...Args>
            constexpr auto operator()(Args&& ...) const
            { return is_valid_impl<F, Args&&...>(int{}); }
        };
    }

    //! @cond
    template <typename F>
    constexpr auto is_valid_t::operator()(F&&) const
    { return type_detail::is_valid_fun<F&&>{}; }

    template <typename F, typename ...Args>
    constexpr auto is_valid_t::operator()(F&&, Args&& ...) const
    { return type_detail::is_valid_impl<F&&, Args&&...>(int{}); }
    //! @endcond

    //////////////////////////////////////////////////////////////////////////
    // template_
    //////////////////////////////////////////////////////////////////////////
    template <template <typename ...> class F>
    struct template_t {
        template <typename ...T>
        struct apply {
            using type = F<T...>;
        };

        template <typename ...T>
        constexpr auto operator()(T const& ...) const
        { return hana::type<F<typename T::type...>>{}; }
    };

    //////////////////////////////////////////////////////////////////////////
    // metafunction
    //////////////////////////////////////////////////////////////////////////
    template <template <typename ...> class F>
    struct metafunction_t {
        template <typename ...T>
        using apply = F<T...>;

        template <typename ...T>
        constexpr hana::type<typename F<typename T::type...>::type>
        operator()(T const& ...) const { return {}; }
    };

    //////////////////////////////////////////////////////////////////////////
    // Metafunction
    //////////////////////////////////////////////////////////////////////////
    template <template <typename ...> class F>
    struct Metafunction<template_t<F>> {
        static constexpr bool value = true;
    };

    template <template <typename ...> class F>
    struct Metafunction<metafunction_t<F>> {
        static constexpr bool value = true;
    };

    template <typename F>
    struct Metafunction<metafunction_class_t<F>> {
        static constexpr bool value = true;
    };

    //////////////////////////////////////////////////////////////////////////
    // integral
    //////////////////////////////////////////////////////////////////////////
    template <typename F>
    struct integral_t {
        template <typename ...T>
        constexpr auto operator()(T const& ...) const {
            using Result = typename F::template apply<typename T::type...>::type;
            return Result{};
        }
    };

    //////////////////////////////////////////////////////////////////////////
    // Operators
    //////////////////////////////////////////////////////////////////////////
    namespace detail {
        template <>
        struct comparable_operators<type_tag> {
            static constexpr bool value = true;
        };
    }

    //////////////////////////////////////////////////////////////////////////
    // Comparable
    //////////////////////////////////////////////////////////////////////////
    template <>
    struct equal_impl<type_tag, type_tag> {
        template <typename T, typename U>
        static constexpr auto apply(basic_type<T> const&, basic_type<U> const&)
        { return hana::false_c; }

        template <typename T>
        static constexpr auto apply(basic_type<T> const&, basic_type<T> const&)
        { return hana::true_c; }
    };

    //////////////////////////////////////////////////////////////////////////
    // Hashable
    //////////////////////////////////////////////////////////////////////////
    template <>
    struct hash_impl<hana::type_tag> {
        template <typename T>
        static constexpr T apply(T const& t)
        { return t; }
    };
BOOST_HANA_NAMESPACE_END

#endif // !BOOST_HANA_TYPE_HPP
