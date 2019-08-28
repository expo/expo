// Boost.Geometry Index
//
// R-tree destroying visitor implementation
//
// Copyright (c) 2011-2014 Adam Wulkiewicz, Lodz, Poland.
//
// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_INDEX_DETAIL_RTREE_VISITORS_DELETE_HPP
#define BOOST_GEOMETRY_INDEX_DETAIL_RTREE_VISITORS_DELETE_HPP

namespace boost { namespace geometry { namespace index {

namespace detail { namespace rtree { namespace visitors {

template <typename Value, typename Options, typename Translator, typename Box, typename Allocators>
class destroy
    : public rtree::visitor<Value, typename Options::parameters_type, Box, Allocators, typename Options::node_tag, false>::type
{
public:
    typedef typename rtree::node<Value, typename Options::parameters_type, Box, Allocators, typename Options::node_tag>::type node;
    typedef typename rtree::internal_node<Value, typename Options::parameters_type, Box, Allocators, typename Options::node_tag>::type internal_node;
    typedef typename rtree::leaf<Value, typename Options::parameters_type, Box, Allocators, typename Options::node_tag>::type leaf;

    typedef typename Allocators::node_pointer node_pointer;

    inline destroy(node_pointer root_node, Allocators & allocators)
        : m_current_node(root_node)
        , m_allocators(allocators)
    {}

    inline void operator()(internal_node & n)
    {
        BOOST_GEOMETRY_INDEX_ASSERT(&n == &rtree::get<internal_node>(*m_current_node), "invalid pointers");

        node_pointer node_to_destroy = m_current_node;

        typedef typename rtree::elements_type<internal_node>::type elements_type;
        elements_type & elements = rtree::elements(n);

        for (typename elements_type::iterator it = elements.begin();
             it != elements.end(); ++it)
        {
            m_current_node = it->second;
            rtree::apply_visitor(*this, *m_current_node);
            it->second = 0;
        }

        rtree::destroy_node<Allocators, internal_node>::apply(m_allocators, node_to_destroy);
    }

    inline void operator()(leaf & l)
    {
        boost::ignore_unused(l);
        BOOST_GEOMETRY_INDEX_ASSERT(&l == &rtree::get<leaf>(*m_current_node), "invalid pointers");

        rtree::destroy_node<Allocators, leaf>::apply(m_allocators, m_current_node);
    }

private:
    node_pointer m_current_node;
    Allocators & m_allocators;
};

}}} // namespace detail::rtree::visitors

}}} // namespace boost::geometry::index

#endif // BOOST_GEOMETRY_INDEX_DETAIL_RTREE_VISITORS_DELETE_HPP
