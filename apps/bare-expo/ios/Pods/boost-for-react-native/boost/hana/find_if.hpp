/*!
@file
Defines `boost::hana::find_if`.

@copyright Louis Dionne 2013-2016
Distributed under the Boost Software License, Version 1.0.
(See accompanying file LICENSE.md or copy at http://boost.org/LICENSE_1_0.txt)
 */

#ifndef BOOST_HANA_FIND_IF_HPP
#define BOOST_HANA_FIND_IF_HPP

#include <boost/hana/fwd/find_if.hpp>

#include <boost/hana/accessors.hpp>
#include <boost/hana/at.hpp>
#include <boost/hana/bool.hpp>
#include <boost/hana/concept/iterable.hpp>
#include <boost/hana/concept/searchable.hpp>
#include <boost/hana/concept/sequence.hpp>
#include <boost/hana/concept/struct.hpp>
#include <boost/hana/config.hpp>
#include <boost/hana/core/dispatch.hpp>
#include <boost/hana/detail/decay.hpp>
#include <boost/hana/drop_while.hpp>
#include <boost/hana/first.hpp>
#include <boost/hana/front.hpp>
#include <boost/hana/functional/compose.hpp>
#include <boost/hana/is_empty.hpp>
#include <boost/hana/length.hpp>
#include <boost/hana/not.hpp>
#include <boost/hana/optional.hpp>
#include <boost/hana/second.hpp>
#include <boost/hana/transform.hpp>

#include <cstddef>
#include <utility>


BOOST_HANA_NAMESPACE_BEGIN
    //! @cond
    template <typename Xs, typename Pred>
    constexpr auto find_if_t::operator()(Xs&& xs, Pred&& pred) const {
        using S = typename hana::tag_of<Xs>::type;
        using FindIf = BOOST_HANA_DISPATCH_IF(find_if_impl<S>,
            hana::Searchable<S>::value
        );

    #ifndef BOOST_HANA_CONFIG_DISABLE_CONCEPT_CHECKS
        static_assert(hana::Searchable<S>::value,
        "hana::find_if(xs, pred) requires 'xs' to be a Searchable");
    #endif

        return FindIf::apply(static_cast<Xs&&>(xs), static_cast<Pred&&>(pred));
    }
    //! @endcond

    template <typename S, bool condition>
    struct find_if_impl<S, when<condition>> : default_ {
        template <typename ...Args>
        static constexpr auto apply(Args&& ...) = delete;
    };

    namespace detail {
        template <typename Xs, typename Pred, std::size_t i, std::size_t N, bool Done>
        struct advance_until;

        template <typename Xs, typename Pred, std::size_t i, std::size_t N>
        struct advance_until<Xs, Pred, i, N, false>
            : advance_until<Xs, Pred, i + 1, N, static_cast<bool>(detail::decay<decltype(
                std::declval<Pred>()(hana::at_c<i>(std::declval<Xs>()))
            )>::type::value)>
        { };

        template <typename Xs, typename Pred, std::size_t N>
        struct advance_until<Xs, Pred, N, N, false> {
            template <typename Ys>
            static constexpr auto apply(Ys&&) {
                return hana::nothing;
            }
        };

        template <typename Xs, typename Pred, std::size_t i, std::size_t N>
        struct advance_until<Xs, Pred, i, N, true> {
            template <typename Ys>
            static constexpr auto apply(Ys&& ys) {
                return hana::just(hana::at_c<i - 1>(static_cast<Ys&&>(ys)));
            }
        };
    }

    template <typename S>
    struct find_if_impl<S, when<Sequence<S>::value>> {
        template <typename Xs, typename Pred>
        static constexpr auto apply(Xs&& xs, Pred&&) {
            constexpr std::size_t N = decltype(hana::length(xs))::value;
            return detail::advance_until<Xs&&, Pred&&, 0, N, false>::apply(
                static_cast<Xs&&>(xs)
            );
        }
    };

    template <typename It>
    struct find_if_impl<It, when<hana::Iterable<It>::value && !Sequence<It>::value>> {
        template <typename Xs, typename Pred>
        static constexpr auto find_if_helper(Xs&& xs, Pred&& pred, hana::true_) {
            return hana::just(hana::front(
                hana::drop_while(static_cast<Xs&&>(xs),
                    hana::compose(hana::not_, static_cast<Pred&&>(pred)))
            ));
        }

        template <typename Xs, typename Pred>
        static constexpr auto find_if_helper(Xs&&, Pred&&, hana::false_) {
            return hana::nothing;
        }

        template <typename Xs, typename Pred>
        static constexpr auto apply(Xs&& xs, Pred&& pred) {
            constexpr bool found = !decltype(
                hana::is_empty(hana::drop_while(static_cast<Xs&&>(xs),
                    hana::compose(hana::not_, static_cast<Pred&&>(pred))))
            )::value;
            return find_if_impl::find_if_helper(static_cast<Xs&&>(xs),
                                                static_cast<Pred&&>(pred),
                                                hana::bool_<found>{});
        }
    };

    template <typename T, std::size_t N>
    struct find_if_impl<T[N]> {
        template <typename Xs>
        static constexpr auto find_if_helper(Xs&&, hana::false_)
        { return hana::nothing; }

        template <typename Xs>
        static constexpr auto find_if_helper(Xs&& xs, hana::true_)
        { return hana::just(static_cast<Xs&&>(xs)[0]); }

        template <typename Xs, typename Pred>
        static constexpr auto apply(Xs&& xs, Pred&& pred) {
            return find_if_helper(static_cast<Xs&&>(xs),
                hana::bool_c<decltype(
                    static_cast<Pred&&>(pred)(static_cast<Xs&&>(xs)[0])
                )::value>
            );
        }
    };

    namespace struct_detail {
        template <typename X>
        struct get_member {
            X x;
            template <typename Member>
            constexpr decltype(auto) operator()(Member&& member) && {
                return hana::second(static_cast<Member&&>(member))(
                    static_cast<X&&>(x)
                );
            }
        };
    }

    template <typename S>
    struct find_if_impl<S, when<hana::Struct<S>::value>> {
        template <typename X, typename Pred>
        static constexpr decltype(auto) apply(X&& x, Pred&& pred) {
            return hana::transform(
                hana::find_if(hana::accessors<S>(),
                    hana::compose(static_cast<Pred&&>(pred), hana::first)
                ),
                struct_detail::get_member<X>{static_cast<X&&>(x)}
            );
        }
    };
BOOST_HANA_NAMESPACE_END

#endif // !BOOST_HANA_FIND_IF_HPP
