/*!
@file
Defines `boost::hana::sum`.

@copyright Louis Dionne 2013-2016
Distributed under the Boost Software License, Version 1.0.
(See accompanying file LICENSE.md or copy at http://boost.org/LICENSE_1_0.txt)
 */

#ifndef BOOST_HANA_SUM_HPP
#define BOOST_HANA_SUM_HPP

#include <boost/hana/fwd/sum.hpp>

#include <boost/hana/concept/foldable.hpp>
#include <boost/hana/concept/monoid.hpp>
#include <boost/hana/config.hpp>
#include <boost/hana/core/dispatch.hpp>
#include <boost/hana/fold_left.hpp>
#include <boost/hana/integral_constant.hpp> // required by fwd decl
#include <boost/hana/plus.hpp>
#include <boost/hana/zero.hpp>


BOOST_HANA_NAMESPACE_BEGIN
    template <typename M>
    struct sum_t {
    #ifndef BOOST_HANA_CONFIG_DISABLE_CONCEPT_CHECKS
        static_assert(hana::Monoid<M>::value,
        "hana::sum<M> requires 'M' to be a Monoid");
    #endif

        template <typename Xs>
        constexpr decltype(auto) operator()(Xs&& xs) const {
            using S = typename hana::tag_of<Xs>::type;
            using Sum = BOOST_HANA_DISPATCH_IF(sum_impl<S>,
                hana::Foldable<S>::value
            );

        #ifndef BOOST_HANA_CONFIG_DISABLE_CONCEPT_CHECKS
            static_assert(hana::Foldable<S>::value,
            "hana::sum<M>(xs) requires 'xs' to be Foldable");
        #endif

            return Sum::template apply<M>(static_cast<Xs&&>(xs));
        }
    };

    template <typename T, bool condition>
    struct sum_impl<T, when<condition>> : default_ {
        template <typename M, typename Xs>
        static constexpr decltype(auto) apply(Xs&& xs) {
            return hana::fold_left(static_cast<Xs&&>(xs), hana::zero<M>(), hana::plus);
        }
    };
BOOST_HANA_NAMESPACE_END

#endif // !BOOST_HANA_SUM_HPP
