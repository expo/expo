/*!
@file
Forward declares `boost::hana::map`.

@copyright Louis Dionne 2013-2016
Distributed under the Boost Software License, Version 1.0.
(See accompanying file LICENSE.md or copy at http://boost.org/LICENSE_1_0.txt)
 */

#ifndef BOOST_HANA_FWD_MAP_HPP
#define BOOST_HANA_FWD_MAP_HPP

#include <boost/hana/config.hpp>
#include <boost/hana/fwd/core/to.hpp>
#include <boost/hana/fwd/core/make.hpp>
#include <boost/hana/fwd/erase_key.hpp>
#include <boost/hana/fwd/insert.hpp>
#include <boost/hana/fwd/keys.hpp>

#include <utility>


BOOST_HANA_NAMESPACE_BEGIN
    //! Tag representing `hana::map`s.
    //! @relates hana::map
    struct map_tag { };

    //! @ingroup group-datatypes
    //! Basic associative container requiring unique, `Comparable` and
    //! `Hashable` keys.
    //!
    //! The order of the elements of the map is unspecified. Also, all the
    //! keys must be `Hashable`, and any two keys with equal hashes must be
    //! `Comparable` with each other at compile-time.
    //!
    //! Note that the actual representation of a `hana::map` is an implementation
    //! detail. As such, one should not assume anything more than what is
    //! explicitly documented as being part of the interface of a map,
    //! such as:
    //! - the presence of additional constructors
    //! - the presence of additional assignment operators
    //! - the fact that `hana::map<Pairs...>` is, or is not, a dependent type
    //!
    //! In particular, the last point is very important; `hana::map<Pairs...>`
    //! is only a shortcut for
    //! @code
    //!     decltype(hana::make_pair(std::declval<Pairs>()...))
    //! @endcode
    //! which is not something that can be pattern-matched on during template
    //! argument deduction, for example.
    //!
    //!
    //! Modeled concepts
    //! ----------------
    //! 1. `Comparable`\n
    //! Two maps are equal iff all their keys are equal and are associated
    //! to equal values.
    //! @include example/map/comparable.cpp
    //!
    //! 2. `Searchable`\n
    //! A map can be searched by its keys with a predicate yielding a
    //! compile-time `Logical`. Also note that `operator[]` can be used
    //! instead of `at_key`.
    //! @include example/map/searchable.cpp
    //!
    //! 3. `Foldable`\n
    //! Folding a map is equivalent to folding a list of the key/value pairs
    //! it contains. In particular, since that list is not guaranteed to be
    //! in any specific order, folding a map with an operation that is not
    //! both commutative and associative will yield non-deterministic behavior.
    //! @include example/map/foldable.cpp
    //!
    //!
    //! Conversion from any `Foldable`
    //! ------------------------------
    //! Any `Foldable` of `Product`s can be converted to a `hana::map` with
    //! `hana::to<hana::map_tag>` or, equivalently, `hana::to_map`. If the
    //! `Foldable` contains duplicate keys, only the value associated to the
    //! first occurence of each key is kept.
    //! @include example/map/to.cpp
    //!
    //!
    //! Example
    //! -------
    //! @include example/map/map.cpp
#ifdef BOOST_HANA_DOXYGEN_INVOKED
    template <typename ...Pairs>
    struct map {
        //! Default-construct a map. This constructor only exists when all the
        //! elements of the map are default-constructible.
        constexpr map() = default;

        //! Copy-construct a map from another map. This constructor only
        //! exists when all the elements of the map are copy-constructible.
        constexpr map(map const& other) = default;

        //! Move-construct a map from another map. This constructor only
        //! exists when all the elements of the map are move-constructible.
        constexpr map(map&& other) = default;

        //! Construct the map from the provided pairs. `P...` must be pairs of
        //! the same type (modulo ref and cv-qualifiers), and in the same order,
        //! as those appearing in `Pairs...`. The pairs provided to this
        //! constructor are emplaced into the map's storage using perfect
        //! forwarding.
        template <typename ...P>
        explicit constexpr map(P&& ...pairs);

        //! Equivalent to `hana::equal`
        template <typename X, typename Y>
        friend constexpr auto operator==(X&& x, Y&& y);

        //! Equivalent to `hana::not_equal`
        template <typename X, typename Y>
        friend constexpr auto operator!=(X&& x, Y&& y);

        //! Equivalent to `hana::at_key`
        template <typename Key>
        constexpr decltype(auto) operator[](Key&& key);
    };
#else
    template <typename ...Pairs>
    using map = decltype(hana::make<map_tag>(std::declval<Pairs>()...));
#endif

    //! Function object for creating a `hana::map`.
    //! @relates hana::map
    //!
    //! Given zero or more `Product`s representing key/value associations,
    //! `make<map_tag>` returns a `hana::map` associating these keys to these
    //! values.
    //!
    //! `make<map_tag>` requires all the keys to be unique and to have
    //! different hashes. If you need to create a map with duplicate keys
    //! or with keys whose hashes might collide, use `hana::to_map` or
    //! insert `(key, value)` pairs to an empty map successively. However,
    //! be aware that doing so will be much more compile-time intensive than
    //! using `make<map_tag>`, because the uniqueness of keys will have to be
    //! enforced.
    //!
    //!
    //! Example
    //! -------
    //! @include example/map/make.cpp
#ifdef BOOST_HANA_DOXYGEN_INVOKED
    template <>
    constexpr auto make<map_tag> = [](auto&& ...pairs) {
        return map<implementation_defined>{forwarded(pairs)...};
    };
#endif

    //! Alias to `make<map_tag>`; provided for convenience.
    //! @relates hana::map
    //!
    //!
    //! Example
    //! -------
    //! @include example/map/make.cpp
    constexpr auto make_map = make<map_tag>;

    //! Equivalent to `to<map_tag>`; provided for convenience.
    //! @relates hana::map
    constexpr auto to_map = to<map_tag>;

    //! Returns a `Sequence` of the keys of the map, in unspecified order.
    //! @relates hana::map
    //!
    //!
    //! Example
    //! -------
    //! @include example/map/keys.cpp
#ifdef BOOST_HANA_DOXYGEN_INVOKED
    constexpr auto keys = [](auto&& map) {
        return implementation_defined;
    };
#endif

    //! Returns a `Sequence` of the values of the map, in unspecified order.
    //! @relates hana::map
    //!
    //!
    //! Example
    //! -------
    //! @include example/map/values.cpp
#ifdef BOOST_HANA_DOXYGEN_INVOKED
    constexpr auto values = [](auto&& map) -> decltype(auto) {
        return implementation_defined;
    };
#else
    struct values_t {
        template <typename Map>
        constexpr decltype(auto) operator()(Map&& map) const;
    };

    constexpr values_t values{};
#endif

    //! Inserts a new key/value pair in a map.
    //! @relates hana::map
    //!
    //! Given a `(key, value)` pair, `insert` inserts this new pair into a
    //! map. If the map already contains this key, nothing is done and the
    //! map is returned as-is.
    //!
    //!
    //! @param map
    //! The map in which to insert a `(key,value)` pair.
    //!
    //! @param pair
    //! An arbitrary `Product` representing a `(key, value)` pair to insert
    //! in the map. The `key` must be compile-time `Comparable`.
    //!
    //!
    //! Example
    //! -------
    //! @include example/map/insert.cpp
#ifdef BOOST_HANA_DOXYGEN_INVOKED
    constexpr auto insert = [](auto&& map, auto&& pair) {
        return tag-dispatched;
    };
#endif

    //! Removes a key/value pair from a map.
    //! @relates hana::map
    //!
    //! Returns a new `hana::map` containing all the elements of the original,
    //! except for the `(key, value)` pair whose `key` compares `equal`
    //! to the given key. If the map does not contain such an element,
    //! a new map equal to the original is returned.
    //!
    //!
    //! @param map
    //! The map in which to erase a `key`.
    //!
    //! @param key
    //! A key to remove from the map. It must be compile-time `Comparable`.
    //!
    //!
    //! Example
    //! -------
    //! @include example/map/erase_key.cpp
#ifdef BOOST_HANA_DOXYGEN_INVOKED
    constexpr auto erase_key = [](auto&& map, auto&& key) {
        return tag-dispatched;
    };
#endif
BOOST_HANA_NAMESPACE_END

#endif // !BOOST_HANA_FWD_MAP_HPP
