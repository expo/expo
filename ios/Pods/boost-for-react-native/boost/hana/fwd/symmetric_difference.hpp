/*!
@file
Forward declares `boost::hana::symmetric_difference`.

@copyright Louis Dionne 2013-2016
Distributed under the Boost Software License, Version 1.0.
(See accompanying file LICENSE.md or copy at http://boost.org/LICENSE_1_0.txt)
 */

#ifndef BOOST_HANA_FWD_SYMMETRIC_DIFFERENCE_HPP
#define BOOST_HANA_FWD_SYMMETRIC_DIFFERENCE_HPP

#include <boost/hana/config.hpp>
#include <boost/hana/core/when.hpp>


BOOST_HANA_NAMESPACE_BEGIN
    //! Returns the symmetric set-theoretic difference of two sets.
    //! @relates hana::set
    //!
    //! Given two sets `xs` and `ys`, `symmetric_difference(xs, ys)` is a new
    //! set containing all the elements of `xs` that are not contained in `ys`,
    //! and all the elements of `ys` that are not contained in `xs`. The
    //! symmetric difference of two sets satisfies the following:
    //! @code
    //!     symmetric_difference(xs, ys) == union_(difference(xs, ys), difference(ys, xs))
    //! @endcode
    //!
    //!
    //! @param xs, ys
    //! Two sets to compute the symmetric difference of.
    //!
    //!
    //! Example
    //! -------
    //! @include example/symmetric_difference.cpp
#ifdef BOOST_HANA_DOXYGEN_INVOKED
    constexpr auto symmetric_difference = [](auto&& xs, auto&& ys) {
        return tag-dispatched;
    };
#else
    template <typename S, typename = void>
    struct symmetric_difference_impl : symmetric_difference_impl<S, when<true>> { };

    struct symmetric_difference_t {
        template <typename Xs, typename Ys>
        constexpr auto operator()(Xs&& xs, Ys&& ys) const;
    };

    constexpr symmetric_difference_t symmetric_difference{};
#endif
BOOST_HANA_NAMESPACE_END

#endif // !BOOST_HANA_FWD_SYMMETRIC_DIFFERENCE_HPP
