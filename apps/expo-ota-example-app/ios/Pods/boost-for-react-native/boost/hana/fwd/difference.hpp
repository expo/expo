/*!
@file
Forward declares `boost::hana::difference`.

@copyright Louis Dionne 2013-2016
Distributed under the Boost Software License, Version 1.0.
(See accompanying file LICENSE.md or copy at http://boost.org/LICENSE_1_0.txt)
 */

#ifndef BOOST_HANA_FWD_DIFFERENCE_HPP
#define BOOST_HANA_FWD_DIFFERENCE_HPP

#include <boost/hana/config.hpp>
#include <boost/hana/core/when.hpp>


BOOST_HANA_NAMESPACE_BEGIN
    //! Returns the set-theoretic difference of two sets.
    //! @relates hana::set
    //!
    //! Given two sets `xs` and `ys`, `difference(xs, ys)` is a new set
    //! containing all the elements of `xs` that are _not_ contained in `ys`.
    //! For any object `x`, the following holds:
    //! @code
    //!     x ^in^ difference(xs, ys) if and only if x ^in^ xs && !(x ^in^ ys)
    //! @endcode
    //!
    //!
    //! @note
    //! This operation is not commutative, i.e. `difference(xs, ys)` is not
    //! necessarily the same as `difference(ys, xs)`. Indeed, consider the
    //! case where `xs` is empty and `ys` isn't. Then, `difference(xs, ys)`
    //! is empty but `difference(ys, xs)` is equal to `ys`. For the symmetric
    //! version of this operation, see `symmetric_difference`.
    //!
    //!
    //! @param xs
    //! A set to remove values from.
    //!
    //! @param ys
    //! The set whose values are removed from `xs`.
    //!
    //!
    //! Example
    //! -------
    //! @include example/difference.cpp
#ifdef BOOST_HANA_DOXYGEN_INVOKED
    constexpr auto difference = [](auto&& xs, auto&& ys) {
        return tag-dispatched;
    };
#else
    template <typename S, typename = void>
    struct difference_impl : difference_impl<S, when<true>> { };

    struct difference_t {
        template <typename Xs, typename Ys>
        constexpr auto operator()(Xs&& xs, Ys&& ys) const;
    };

    constexpr difference_t difference{};
#endif
BOOST_HANA_NAMESPACE_END

#endif // !BOOST_HANA_FWD_DIFFERENCE_HPP
