/*!
@file
Forward declares `boost::hana::union_`.

@copyright Louis Dionne 2013-2016
Distributed under the Boost Software License, Version 1.0.
(See accompanying file LICENSE.md or copy at http://boost.org/LICENSE_1_0.txt)
 */

#ifndef BOOST_HANA_FWD_UNION_HPP
#define BOOST_HANA_FWD_UNION_HPP

#include <boost/hana/config.hpp>
#include <boost/hana/core/when.hpp>


BOOST_HANA_NAMESPACE_BEGIN
    //! Returns the union of two sets.
    //! @relates hana::set
    //!
    //! Given two sets `xs` and `ys`, `union_(xs, ys)` is a new set containing
    //! all the elements of `xs` and all the elements of `ys`, without
    //! duplicates. For any object `x`, the following holds:
    //! @code
    //!     x ^in^ union_(xs, ys) if and only if x ^in^ xs || x ^in^ ys
    //! @endcode
    //!
    //!
    //! @param xs, ys
    //! Two sets to compute the union of.
    //!
    //!
    //! Example
    //! -------
    //! @include example/union.cpp
#ifdef BOOST_HANA_DOXYGEN_INVOKED
    constexpr auto union_ = [](auto&& xs, auto&& ys) {
        return tag-dispatched;
    };
#else
    template <typename S, typename = void>
    struct union_impl : union_impl<S, when<true>> { };

    struct union_t {
        template <typename Xs, typename Ys>
        constexpr auto operator()(Xs&& xs, Ys&& ys) const;
    };

    constexpr union_t union_{};
#endif
BOOST_HANA_NAMESPACE_END

#endif // !BOOST_HANA_FWD_UNION_HPP
