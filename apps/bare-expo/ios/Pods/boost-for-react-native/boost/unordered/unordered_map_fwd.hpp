
// Copyright (C) 2008-2011 Daniel James.
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_UNORDERED_MAP_FWD_HPP_INCLUDED
#define BOOST_UNORDERED_MAP_FWD_HPP_INCLUDED

#include <boost/config.hpp>
#if defined(BOOST_HAS_PRAGMA_ONCE)
#pragma once
#endif

#include <memory>
#include <functional>
#include <boost/functional/hash_fwd.hpp>
#include <boost/unordered/detail/fwd.hpp>

namespace boost
{
    namespace unordered
    {
        template <class K,
            class T,
            class H = boost::hash<K>,
            class P = std::equal_to<K>,
            class A = std::allocator<std::pair<const K, T> > >
        class unordered_map;

        template <class K, class T, class H, class P, class A>
        inline bool operator==(unordered_map<K, T, H, P, A> const&,
            unordered_map<K, T, H, P, A> const&);
        template <class K, class T, class H, class P, class A>
        inline bool operator!=(unordered_map<K, T, H, P, A> const&,
            unordered_map<K, T, H, P, A> const&);
        template <class K, class T, class H, class P, class A>
        inline void swap(unordered_map<K, T, H, P, A>&,
                unordered_map<K, T, H, P, A>&);

        template <class K,
            class T,
            class H = boost::hash<K>,
            class P = std::equal_to<K>,
            class A = std::allocator<std::pair<const K, T> > >
        class unordered_multimap;

        template <class K, class T, class H, class P, class A>
        inline bool operator==(unordered_multimap<K, T, H, P, A> const&,
            unordered_multimap<K, T, H, P, A> const&);
        template <class K, class T, class H, class P, class A>
        inline bool operator!=(unordered_multimap<K, T, H, P, A> const&,
            unordered_multimap<K, T, H, P, A> const&);
        template <class K, class T, class H, class P, class A>
        inline void swap(unordered_multimap<K, T, H, P, A>&,
                unordered_multimap<K, T, H, P, A>&);
    }

    using boost::unordered::unordered_map;
    using boost::unordered::unordered_multimap;
    using boost::unordered::swap;
    using boost::unordered::operator==;
    using boost::unordered::operator!=;
}

#endif
