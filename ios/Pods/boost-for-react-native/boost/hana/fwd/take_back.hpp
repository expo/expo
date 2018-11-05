/*!
@file
Forward declares `boost::hana::take_back`.

@copyright Louis Dionne 2013-2016
Distributed under the Boost Software License, Version 1.0.
(See accompanying file LICENSE.md or copy at http://boost.org/LICENSE_1_0.txt)
 */

#ifndef BOOST_HANA_FWD_TAKE_BACK_HPP
#define BOOST_HANA_FWD_TAKE_BACK_HPP

#include <boost/hana/config.hpp>
#include <boost/hana/core/when.hpp>

#include <cstddef>


BOOST_HANA_NAMESPACE_BEGIN
    //! Returns the last `n` elements of a sequence, or the whole sequence
    //! if the sequence has less than `n` elements.
    //! @ingroup group-Sequence
    //!
    //! Given a `Sequence` `xs` and an `IntegralConstant` `n`, `take_back(xs, n)`
    //! is a new sequence containing the last `n` elements of `xs`, in the
    //! same order. If `length(xs) <= n`, the whole sequence is returned and
    //! no error is triggered.
    //!
    //!
    //! @param xs
    //! The sequence to take the elements from.
    //!
    //! @param n
    //! A non-negative `IntegralConstant` representing the number of elements
    //! to keep in the resulting sequence.
    //!
    //!
    //! Example
    //! -------
    //! @include example/take_back.cpp
#ifdef BOOST_HANA_DOXYGEN_INVOKED
    constexpr auto take_back = [](auto&& xs, auto const& n) {
        return tag-dispatched;
    };
#else
    template <typename S, typename = void>
    struct take_back_impl : take_back_impl<S, when<true>> { };

    struct take_back_t {
        template <typename Xs, typename N>
        constexpr auto operator()(Xs&& xs, N const& n) const;
    };

    constexpr take_back_t take_back{};
#endif
BOOST_HANA_NAMESPACE_END

#endif // !BOOST_HANA_FWD_TAKE_BACK_HPP
