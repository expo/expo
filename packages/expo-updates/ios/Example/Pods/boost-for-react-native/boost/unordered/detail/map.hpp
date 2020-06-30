
// Copyright (C) 2005-2016 Daniel James
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#include <boost/unordered/unordered_map_fwd.hpp>
#include <boost/unordered/detail/equivalent.hpp>
#include <boost/unordered/detail/unique.hpp>

namespace boost { namespace unordered { namespace detail {
    template <typename A, typename K, typename M, typename H, typename P>
    struct map
    {
        typedef boost::unordered::detail::map<A, K, M, H, P> types;

        typedef A allocator;
        typedef std::pair<K const, M> value_type;
        typedef H hasher;
        typedef P key_equal;
        typedef K key_type;

        typedef boost::unordered::detail::allocator_traits<allocator>
            traits;
        typedef boost::unordered::detail::pick_node<allocator, value_type> pick;
        typedef typename pick::node node;
        typedef typename pick::bucket bucket;
        typedef typename pick::link_pointer link_pointer;

        typedef boost::unordered::detail::table_impl<types> table;
        typedef boost::unordered::detail::map_extractor<key_type, value_type>
            extractor;

        typedef typename boost::unordered::detail::pick_policy<K>::type policy;

        typedef boost::unordered::iterator_detail::
            iterator<node> iterator;
        typedef boost::unordered::iterator_detail::
            c_iterator<node> c_iterator;
        typedef boost::unordered::iterator_detail::
            l_iterator<node, policy> l_iterator;
        typedef boost::unordered::iterator_detail::
            cl_iterator<node, policy> cl_iterator;
    };

    template <typename A, typename K, typename M, typename H, typename P>
    struct multimap
    {
        typedef boost::unordered::detail::multimap<A, K, M, H, P> types;

        typedef A allocator;
        typedef std::pair<K const, M> value_type;
        typedef H hasher;
        typedef P key_equal;
        typedef K key_type;

        typedef boost::unordered::detail::allocator_traits<allocator> traits;
        typedef boost::unordered::detail::pick_grouped_node<allocator,
                value_type> pick;
        typedef typename pick::node node;
        typedef typename pick::bucket bucket;
        typedef typename pick::link_pointer link_pointer;

        typedef boost::unordered::detail::grouped_table_impl<types> table;
        typedef boost::unordered::detail::map_extractor<key_type, value_type>
            extractor;

        typedef typename boost::unordered::detail::pick_policy<K>::type policy;

        typedef boost::unordered::iterator_detail::
            iterator<node> iterator;
        typedef boost::unordered::iterator_detail::
            c_iterator<node> c_iterator;
        typedef boost::unordered::iterator_detail::
            l_iterator<node, policy> l_iterator;
        typedef boost::unordered::iterator_detail::
            cl_iterator<node, policy> cl_iterator;
    };

}}}
