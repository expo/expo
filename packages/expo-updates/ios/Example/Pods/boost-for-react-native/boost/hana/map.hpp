/*!
@file
Defines `boost::hana::map`.

@copyright Louis Dionne 2013-2016
Distributed under the Boost Software License, Version 1.0.
(See accompanying file LICENSE.md or copy at http://boost.org/LICENSE_1_0.txt)
 */

#ifndef BOOST_HANA_MAP_HPP
#define BOOST_HANA_MAP_HPP

#include <boost/hana/fwd/map.hpp>

#include <boost/hana/all_of.hpp>
#include <boost/hana/basic_tuple.hpp>
#include <boost/hana/bool.hpp>
#include <boost/hana/concept/comparable.hpp>
#include <boost/hana/concept/constant.hpp>
#include <boost/hana/concept/product.hpp>
#include <boost/hana/config.hpp>
#include <boost/hana/contains.hpp>
#include <boost/hana/core/is_a.hpp>
#include <boost/hana/core/make.hpp>
#include <boost/hana/core/to.hpp>
#include <boost/hana/detail/decay.hpp>
#include <boost/hana/detail/fast_and.hpp>
#include <boost/hana/detail/has_duplicates.hpp>
#include <boost/hana/detail/hash_table.hpp>
#include <boost/hana/detail/operators/adl.hpp>
#include <boost/hana/detail/operators/comparable.hpp>
#include <boost/hana/detail/operators/searchable.hpp>
#include <boost/hana/equal.hpp>
#include <boost/hana/find.hpp>
#include <boost/hana/first.hpp>
#include <boost/hana/fold_left.hpp>
#include <boost/hana/functional/demux.hpp>
#include <boost/hana/functional/on.hpp>
#include <boost/hana/functional/partial.hpp>
#include <boost/hana/fwd/any_of.hpp>
#include <boost/hana/fwd/at_key.hpp>
#include <boost/hana/fwd/erase_key.hpp>
#include <boost/hana/fwd/is_subset.hpp>
#include <boost/hana/fwd/keys.hpp>
#include <boost/hana/insert.hpp>
#include <boost/hana/integral_constant.hpp>
#include <boost/hana/keys.hpp>
#include <boost/hana/length.hpp>
#include <boost/hana/optional.hpp>
#include <boost/hana/remove_if.hpp>
#include <boost/hana/second.hpp>
#include <boost/hana/unpack.hpp>
#include <boost/hana/value.hpp>

#include <cstddef>
#include <type_traits>
#include <utility>


BOOST_HANA_NAMESPACE_BEGIN
    //////////////////////////////////////////////////////////////////////////
    // operators
    //////////////////////////////////////////////////////////////////////////
    namespace detail {
        template <>
        struct comparable_operators<map_tag> {
            static constexpr bool value = true;
        };
    }

    //////////////////////////////////////////////////////////////////////////
    // map
    //////////////////////////////////////////////////////////////////////////
    //! @cond
    namespace detail {
        template <typename HashTable, typename Storage>
        struct map_impl
            : detail::searchable_operators<map_impl<HashTable, Storage>>
            , detail::operators::adl<map_impl<HashTable, Storage>>
        {
            using hash_table_type = HashTable;
            using storage_type = Storage;

            Storage storage;

            using hana_tag = map_tag;

            template <typename ...P, typename = typename std::enable_if<
                std::is_same<
                    Storage,
                    hana::basic_tuple<typename detail::decay<P>::type...>
                >::value
            >::type>
            explicit constexpr map_impl(P&& ...pairs)
                : storage{static_cast<P&&>(pairs)...}
            { }

            explicit constexpr map_impl(Storage&& xs)
                : storage(static_cast<Storage&&>(xs))
            { }

            constexpr map_impl() = default;
            constexpr map_impl(map_impl const& other) = default;
            constexpr map_impl(map_impl&& other) = default;
        };
        //! @endcond

        template <typename Storage>
        struct KeyAtIndex {
            template <std::size_t i>
            using apply = decltype(hana::first(hana::get_impl<i>(std::declval<Storage>())));
        };
    }

    //////////////////////////////////////////////////////////////////////////
    // make<map_tag>
    //////////////////////////////////////////////////////////////////////////
    template <>
    struct make_impl<map_tag> {
        template <typename ...Pairs>
        static constexpr auto apply(Pairs&& ...pairs) {
#if defined(BOOST_HANA_CONFIG_ENABLE_DEBUG_MODE)
            static_assert(detail::fast_and<hana::Product<Pairs>::value...>::value,
            "hana::make_map(pairs...) requires all the 'pairs' to be Products");

            static_assert(detail::fast_and<
                hana::Comparable<decltype(hana::first(pairs))>::value...
            >::value,
            "hana::make_map(pairs...) requires all the keys to be Comparable");

            static_assert(detail::fast_and<
                hana::Constant<
                    decltype(hana::equal(hana::first(pairs), hana::first(pairs)))
                >::value...
            >::value,
            "hana::make_map(pairs...) requires all the keys to be "
            "Comparable at compile-time");

            //! @todo
            //! This can be implemented more efficiently by doing the check
            //! inside each bucket instead.
            static_assert(!detail::has_duplicates<decltype(hana::first(pairs))...>::value,
            "hana::make_map({keys, values}...) requires all the keys to be unique");

            static_assert(!detail::has_duplicates<decltype(hana::hash(hana::first(pairs)))...>::value,
            "hana::make_map({keys, values}...) requires all the keys to have different hashes");
#endif

            using Storage = hana::basic_tuple<typename detail::decay<Pairs>::type...>;
            using HashTable = typename detail::make_hash_table<
                detail::KeyAtIndex<Storage>::template apply, sizeof...(Pairs)
            >::type;

            return detail::map_impl<HashTable, Storage>{
                hana::make_basic_tuple(static_cast<Pairs&&>(pairs)...)
            };
        }
    };

    //////////////////////////////////////////////////////////////////////////
    // keys
    //////////////////////////////////////////////////////////////////////////
    template <>
    struct keys_impl<map_tag> {
        template <typename Map>
        static constexpr decltype(auto) apply(Map&& map) {
            return hana::transform(static_cast<Map&&>(map).storage, hana::first);
        }
    };

    //////////////////////////////////////////////////////////////////////////
    // values
    //////////////////////////////////////////////////////////////////////////
    //! @cond
    template <typename Map>
    constexpr decltype(auto) values_t::operator()(Map&& map) const {
        return hana::transform(static_cast<Map&&>(map).storage, hana::second);
    }
    //! @endcond

    //////////////////////////////////////////////////////////////////////////
    // insert
    //////////////////////////////////////////////////////////////////////////
    template <>
    struct insert_impl<map_tag> {
        template <typename Map, typename Pair>
        static constexpr auto helper(Map&& map, Pair&& pair, ...) {
            using RawMap = typename std::remove_reference<Map>::type;
            using HashTable = typename RawMap::hash_table_type;
            using NewHashTable = typename detail::bucket_insert<
                HashTable,
                decltype(hana::first(pair)),
                decltype(hana::length(map.storage))::value
            >::type;

            using NewStorage = decltype(
                hana::append(static_cast<Map&&>(map).storage, static_cast<Pair&&>(pair))
            );
            return detail::map_impl<NewHashTable, NewStorage>(
                hana::append(static_cast<Map&&>(map).storage, static_cast<Pair&&>(pair))
            );
        }

        template <typename Map, typename Pair, std::size_t i>
        static constexpr auto
        helper(Map&& map, Pair&&,
               hana::optional<std::integral_constant<std::size_t, i>>)
        {
            return static_cast<Map&&>(map);
        }

        //! @todo
        //! Here, we insert only if the key is not already in the map.
        //! This should be handled by `bucket_insert`, and that would also
        //! be more efficient.
        template <typename Map, typename Pair>
        static constexpr auto apply(Map&& map, Pair&& pair) {
            using RawMap = typename std::remove_reference<Map>::type;
            using Storage = typename RawMap::storage_type;
            using HashTable = typename RawMap::hash_table_type;
            using Key = decltype(hana::first(pair));
            using MaybeIndex = typename detail::find_index<
              HashTable, Key, detail::KeyAtIndex<Storage>::template apply
            >::type;
            return helper(static_cast<Map&&>(map), static_cast<Pair&&>(pair), MaybeIndex{});
        }
    };

    //////////////////////////////////////////////////////////////////////////
    // erase_key
    //////////////////////////////////////////////////////////////////////////
    template <>
    struct erase_key_impl<map_tag> {
        //! @todo
        //! We could implement some kind of `bucket_erase` metafunction
        //! that would be much more efficient than this.
        template <typename Map, typename Key>
        static constexpr auto
        erase_key_helper(Map&& map, Key const&, hana::false_) {
            return static_cast<Map&&>(map);
        }

        template <typename Map, typename Key>
        static constexpr auto
        erase_key_helper(Map&& map, Key const& key, hana::true_) {
            return hana::unpack(
                hana::remove_if(static_cast<Map&&>(map).storage,
                                hana::on(hana::equal.to(key), hana::first)),
                hana::make_map
            );
        }

        template <typename Map, typename Key>
        static constexpr auto apply(Map&& map, Key const& key) {
            constexpr bool contains = hana::value<decltype(hana::contains(map, key))>();
            return erase_key_helper(static_cast<Map&&>(map), key,
                                    hana::bool_c<contains>);
        }
    };

    //////////////////////////////////////////////////////////////////////////
    // Comparable
    //////////////////////////////////////////////////////////////////////////
    template <>
    struct equal_impl<map_tag, map_tag> {
        template <typename M1, typename M2>
        static constexpr auto equal_helper(M1 const&, M2 const&, hana::false_) {
            return hana::false_c;
        }

        template <typename M1, typename M2>
        static constexpr auto equal_helper(M1 const& m1, M2 const& m2, hana::true_) {
            return hana::all_of(hana::keys(m1), hana::demux(equal)(
                hana::partial(hana::find, m1),
                hana::partial(hana::find, m2)
            ));
        }

        template <typename M1, typename M2>
        static constexpr auto apply(M1 const& m1, M2 const& m2) {
            return equal_impl::equal_helper(m1, m2, hana::bool_c<
                decltype(hana::length(m1.storage))::value ==
                decltype(hana::length(m2.storage))::value
            >);
        }
    };

    //////////////////////////////////////////////////////////////////////////
    // Searchable
    //////////////////////////////////////////////////////////////////////////
    template <>
    struct find_impl<map_tag> {
        template <typename Map>
        static constexpr auto find_helper(Map&&, ...) {
            return hana::nothing;
        }

        template <typename Map, std::size_t i>
        static constexpr auto
        find_helper(Map&& map, hana::optional<std::integral_constant<std::size_t, i>>) {
            return hana::just(hana::second(hana::at_c<i>(static_cast<Map&&>(map).storage)));
        }

        template <typename Map, typename Key>
        static constexpr auto apply(Map&& map, Key const&) {
            using RawMap = typename std::remove_reference<Map>::type;
            using Storage = typename RawMap::storage_type;
            using HashTable = typename RawMap::hash_table_type;
            using MaybeIndex = typename detail::find_index<
              HashTable, Key, detail::KeyAtIndex<Storage>::template apply
            >::type;
            return find_helper(static_cast<Map&&>(map), MaybeIndex{});
        }
    };

    template <>
    struct find_if_impl<map_tag> {
        template <typename M, typename Pred>
        static constexpr auto apply(M&& map, Pred&& pred) {
            return hana::transform(
                hana::find_if(static_cast<M&&>(map).storage,
                    hana::compose(static_cast<Pred&&>(pred), hana::first)),
                hana::second
            );
        }
    };

    template <>
    struct any_of_impl<map_tag> {
        template <typename M, typename Pred>
        static constexpr auto apply(M const& map, Pred const& pred)
        { return hana::any_of(hana::keys(map), pred); }
    };

    template <>
    struct is_subset_impl<map_tag, map_tag> {
        template <typename Ys>
        struct all_contained {
            Ys const& ys;
            template <typename ...X>
            constexpr auto operator()(X const& ...x) const {
                return hana::bool_c<detail::fast_and<
                    hana::value<decltype(hana::contains(ys, x))>()...
                >::value>;
            }
        };

        template <typename Xs, typename Ys>
        static constexpr auto apply(Xs const& xs, Ys const& ys) {
            auto ys_keys = hana::keys(ys);
            return hana::unpack(hana::keys(xs), all_contained<decltype(ys_keys)>{ys_keys});
        }
    };

    template <>
    struct at_key_impl<map_tag> {
        template <typename Map, typename Key>
        static constexpr decltype(auto) apply(Map&& map, Key const&) {
            using RawMap = typename std::remove_reference<Map>::type;
            using HashTable = typename RawMap::hash_table_type;
            using Storage = typename RawMap::storage_type;
            using MaybeIndex = typename detail::find_index<
                HashTable, Key, detail::KeyAtIndex<Storage>::template apply
            >::type;
            static_assert(!decltype(hana::is_nothing(MaybeIndex{}))::value,
                "hana::at_key(map, key) requires the 'key' to be present in the 'map'");
            constexpr std::size_t index = decltype(*MaybeIndex{}){}();
            return hana::second(hana::at_c<index>(static_cast<Map&&>(map).storage));
        }
    };

    //////////////////////////////////////////////////////////////////////////
    // Foldable
    //////////////////////////////////////////////////////////////////////////
    template <>
    struct unpack_impl<map_tag> {
        template <typename M, typename F>
        static constexpr decltype(auto) apply(M&& map, F&& f) {
            return hana::unpack(static_cast<M&&>(map).storage,
                                static_cast<F&&>(f));
        }
    };

    //////////////////////////////////////////////////////////////////////////
    // Construction from a Foldable
    //////////////////////////////////////////////////////////////////////////
    template <typename F>
    struct to_impl<map_tag, F, when<hana::Foldable<F>::value>> {
        template <typename Xs>
        static constexpr decltype(auto) apply(Xs&& xs) {
            return hana::fold_left(
                static_cast<Xs&&>(xs), hana::make_map(), hana::insert
            );
        }
    };
BOOST_HANA_NAMESPACE_END

#endif // !BOOST_HANA_MAP_HPP
