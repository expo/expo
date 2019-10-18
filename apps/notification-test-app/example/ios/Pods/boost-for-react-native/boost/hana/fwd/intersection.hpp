/*!
@file
Forward declares `boost::hana::intersection`.

@copyright Louis Dionne 2013-2016
Distributed under the Boost Software License, Version 1.0.
(See accompanying file LICENSE.md or copy at http://boost.org/LICENSE_1_0.txt)
 */

#ifndef BOOST_HANA_FWD_INTERSECTION_HPP
#define BOOST_HANA_FWD_INTERSECTION_HPP

#include <boost/hana/config.hpp>
#include <boost/hana/core/when.hpp>


BOOST_HANA_NAMESPACE_BEGIN
    //! Returns the intersection of two sets.
    //! @relates hana::set
    //!
    //! Given two sets `xs` and `ys`, `intersection(xs, ys)` is a new set
    //! containing exactly those elements that are present both in `xs` and
    //! in `ys`. In other words, the following holds for any object `x`:
    //! @code
    //!     x ^in^ intersection(xs, ys) if and only if x ^in^ xs && x ^in^ ys
    //! @endcode
    //!
    //!
    //! @param xs, ys
    //! Two sets to intersect.
    //!
    //!
    //! Example
    //! -------
    //! @include example/intersection.cpp
#ifdef BOOST_HANA_DOXYGEN_INVOKED
    constexpr auto intersection = [](auto&& xs, auto&& ys) {
        return tag-dispatched;
    };
#else
    template <typename S, typename = void>
    struct intersection_impl : intersection_impl<S, when<true>> { };

    struct intersection_t {
        template <typename Xs, typename Ys>
        constexpr auto operator()(Xs&& xs, Ys&& ys) const;
    };

    constexpr intersection_t intersection{};
#endif
BOOST_HANA_NAMESPACE_END

#endif // !BOOST_HANA_FWD_INTERSECTION_HPP
