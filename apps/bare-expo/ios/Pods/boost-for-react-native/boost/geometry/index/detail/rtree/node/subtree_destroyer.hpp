// Boost.Geometry Index
//
// R-tree subtree scoped destroyer
//
// Copyright (c) 2011-2015 Adam Wulkiewicz, Lodz, Poland.
//
// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_INDEX_DETAIL_RTREE_NODE_SUBTREE_DESTROYED_HPP
#define BOOST_GEOMETRY_INDEX_DETAIL_RTREE_NODE_SUBTREE_DESTROYED_HPP

#include <boost/geometry/index/detail/rtree/visitors/destroy.hpp>

namespace boost { namespace geometry { namespace index {

namespace detail { namespace rtree {

template <typename Value, typename Options, typename Translator, typename Box, typename Allocators>
class subtree_destroyer
{
    typedef typename rtree::node<Value, typename Options::parameters_type, Box, Allocators, typename Options::node_tag>::type node;
    typedef typename Allocators::node_pointer pointer;

    subtree_destroyer(subtree_destroyer const&);
    subtree_destroyer & operator=(subtree_destroyer const&);

public:
    subtree_destroyer(pointer ptr, Allocators & allocators)
        : m_ptr(ptr)
        , m_allocators(allocators)
    {}

    ~subtree_destroyer()
    {
        reset();
    }

    void reset(pointer ptr = 0)
    {
        if ( m_ptr && m_ptr != ptr )
        {
            detail::rtree::visitors::destroy<Value, Options, Translator, Box, Allocators> del_v(m_ptr, m_allocators);
            detail::rtree::apply_visitor(del_v, *m_ptr);
        }
        m_ptr = ptr;
    }

    void release()
    {
        m_ptr = 0;
    }

    pointer get() const
    {
        return m_ptr;
    }

    node & operator*() const
    {
        return *m_ptr;
    }

    pointer operator->() const
    {
        return m_ptr;
    }

private:
    pointer m_ptr;
    Allocators & m_allocators;
};

}} // namespace detail::rtree

}}} // namespace boost::geometry::index

#endif // BOOST_GEOMETRY_INDEX_DETAIL_RTREE_NODE_SUBTREE_DESTROYED_HPP
