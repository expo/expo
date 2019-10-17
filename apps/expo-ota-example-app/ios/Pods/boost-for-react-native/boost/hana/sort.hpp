/*!
@file
Defines `boost::hana::sort`.

@copyright Louis Dionne 2013-2016
Distributed under the Boost Software License, Version 1.0.
(See accompanying file LICENSE.md or copy at http://boost.org/LICENSE_1_0.txt)
 */

#ifndef BOOST_HANA_SORT_HPP
#define BOOST_HANA_SORT_HPP

#include <boost/hana/fwd/sort.hpp>

#include <boost/hana/at.hpp>
#include <boost/hana/concept/sequence.hpp>
#include <boost/hana/config.hpp>
#include <boost/hana/core/dispatch.hpp>
#include <boost/hana/core/make.hpp>
#include <boost/hana/detail/nested_by.hpp> // required by fwd decl
#include <boost/hana/length.hpp>
#include <boost/hana/less.hpp>

#include <utility> // std::declval, std::index_sequence


BOOST_HANA_NAMESPACE_BEGIN
    //! @cond
    template <typename Xs, typename Predicate>
    constexpr auto sort_t::operator()(Xs&& xs, Predicate&& pred) const {
        using S = typename hana::tag_of<Xs>::type;
        using Sort = BOOST_HANA_DISPATCH_IF(sort_impl<S>,
            hana::Sequence<S>::value
        );

    #ifndef BOOST_HANA_CONFIG_DISABLE_CONCEPT_CHECKS
        static_assert(hana::Sequence<S>::value,
        "hana::sort(xs, predicate) requires 'xs' to be a Sequence");
    #endif

        return Sort::apply(static_cast<Xs&&>(xs),
                           static_cast<Predicate&&>(pred));
    }

    template <typename Xs>
    constexpr auto sort_t::operator()(Xs&& xs) const {
        using S = typename hana::tag_of<Xs>::type;
        using Sort = BOOST_HANA_DISPATCH_IF(sort_impl<S>,
            hana::Sequence<S>::value
        );

    #ifndef BOOST_HANA_CONFIG_DISABLE_CONCEPT_CHECKS
        static_assert(hana::Sequence<S>::value,
        "hana::sort(xs) requires 'xs' to be a Sequence");
    #endif

        return Sort::apply(static_cast<Xs&&>(xs));
    }
    //! @endcond

    namespace detail {
        template <typename Xs, typename Pred>
        struct sort_predicate {
            template <std::size_t I, std::size_t J>
            using apply = decltype(std::declval<Pred>()(
                hana::at_c<I>(std::declval<Xs>()),
                hana::at_c<J>(std::declval<Xs>())
            ));
        };

        template <typename Pred, std::size_t Insert, bool IsInsertionPoint,
                  typename Left,
                  std::size_t ...Right>
        struct insert;

        // We did not find the insertion point; continue processing elements
        // recursively.
        template <
            typename Pred, std::size_t Insert,
            std::size_t ...Left,
            std::size_t Right1, std::size_t Right2, std::size_t ...Right
        >
        struct insert<Pred, Insert, false,
                      std::index_sequence<Left...>,
                      Right1, Right2, Right...
        > {
            using type = typename insert<
                Pred, Insert, (bool)Pred::template apply<Insert, Right2>::value,
                std::index_sequence<Left..., Right1>,
                Right2, Right...
            >::type;
        };

        // We did not find the insertion point, but there is only one element
        // left. We insert at the end of the list, and we're done.
        template <typename Pred, std::size_t Insert, std::size_t ...Left, std::size_t Last>
        struct insert<Pred, Insert, false, std::index_sequence<Left...>, Last> {
            using type = std::index_sequence<Left..., Last, Insert>;
        };

        // We found the insertion point, we're done.
        template <typename Pred, std::size_t Insert, std::size_t ...Left, std::size_t ...Right>
        struct insert<Pred, Insert, true, std::index_sequence<Left...>, Right...> {
            using type = std::index_sequence<Left..., Insert, Right...>;
        };


        template <typename Pred, typename Result, std::size_t ...T>
        struct insertion_sort_impl;

        template <typename Pred,
                  std::size_t Result1, std::size_t ...Result,
                  std::size_t T, std::size_t ...Ts>
        struct insertion_sort_impl<Pred, std::index_sequence<Result1, Result...>, T, Ts...> {
            using type = typename insertion_sort_impl<
                Pred,
                typename insert<
                    Pred, T, (bool)Pred::template apply<T, Result1>::value,
                    std::index_sequence<>,
                    Result1, Result...
                >::type,
                Ts...
            >::type;
        };

        template <typename Pred, std::size_t T, std::size_t ...Ts>
        struct insertion_sort_impl<Pred, std::index_sequence<>, T, Ts...> {
            using type = typename insertion_sort_impl<
                Pred, std::index_sequence<T>, Ts...
            >::type;
        };

        template <typename Pred, typename Result>
        struct insertion_sort_impl<Pred, Result> {
            using type = Result;
        };

        template <typename Pred, typename Indices>
        struct sort_helper;

        template <typename Pred, std::size_t ...i>
        struct sort_helper<Pred, std::index_sequence<i...>> {
            using type = typename insertion_sort_impl<
                Pred, std::index_sequence<>, i...
            >::type;
        };
    } // end namespace detail

    template <typename S, bool condition>
    struct sort_impl<S, when<condition>> : default_ {
        template <typename Xs, std::size_t ...i>
        static constexpr auto apply_impl(Xs&& xs, std::index_sequence<i...>) {
            return hana::make<S>(hana::at_c<i>(static_cast<Xs&&>(xs))...);
        }

        template <typename Xs, typename Pred>
        static constexpr auto apply(Xs&& xs, Pred const&) {
            constexpr std::size_t Len = decltype(hana::length(xs))::value;
            using Indices = typename detail::sort_helper<
                detail::sort_predicate<Xs&&, Pred>,
                std::make_index_sequence<Len>
            >::type;

            return apply_impl(static_cast<Xs&&>(xs), Indices{});
        }

        template <typename Xs>
        static constexpr auto apply(Xs&& xs)
        { return sort_impl::apply(static_cast<Xs&&>(xs), hana::less); }
    };
BOOST_HANA_NAMESPACE_END

#endif // !BOOST_HANA_SORT_HPP
