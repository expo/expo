// Boost.Geometry Index
//
// R-tree nodes
//
// Copyright (c) 2011-2015 Adam Wulkiewicz, Lodz, Poland.
//
// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_INDEX_DETAIL_RTREE_NODE_NODE_HPP
#define BOOST_GEOMETRY_INDEX_DETAIL_RTREE_NODE_NODE_HPP

#include <boost/container/vector.hpp>
#include <boost/geometry/index/detail/varray.hpp>

#include <boost/geometry/index/detail/rtree/node/concept.hpp>
#include <boost/geometry/index/detail/rtree/node/pairs.hpp>
#include <boost/geometry/index/detail/rtree/node/node_elements.hpp>
#include <boost/geometry/index/detail/rtree/node/scoped_deallocator.hpp>

//#include <boost/geometry/index/detail/rtree/node/weak_visitor.hpp>
//#include <boost/geometry/index/detail/rtree/node/weak_dynamic.hpp>
//#include <boost/geometry/index/detail/rtree/node/weak_static.hpp>

#include <boost/geometry/index/detail/rtree/node/variant_visitor.hpp>
#include <boost/geometry/index/detail/rtree/node/variant_dynamic.hpp>
#include <boost/geometry/index/detail/rtree/node/variant_static.hpp>

#include <boost/geometry/index/detail/rtree/node/subtree_destroyer.hpp>

#include <boost/geometry/algorithms/expand.hpp>

#include <boost/geometry/index/detail/rtree/visitors/is_leaf.hpp>

#include <boost/geometry/index/detail/algorithms/bounds.hpp>
#include <boost/geometry/index/detail/is_bounding_geometry.hpp>

namespace boost { namespace geometry { namespace index {

namespace detail { namespace rtree {

// elements box

template <typename Box, typename FwdIter, typename Translator>
inline Box elements_box(FwdIter first, FwdIter last, Translator const& tr)
{
    Box result;
    
    // Only here to suppress 'uninitialized local variable used' warning
    // until the suggestion below is not implemented
    geometry::assign_inverse(result);

    //BOOST_GEOMETRY_INDEX_ASSERT(first != last, "non-empty range required");
    // NOTE: this is not elegant temporary solution,
    //       reference to box could be passed as parameter and bool returned
    if ( first == last )
        return result;

    detail::bounds(element_indexable(*first, tr), result);
    ++first;

    for ( ; first != last ; ++first )
        geometry::expand(result, element_indexable(*first, tr));

    return result;
}

// Enlarge bounds of a leaf node WRT epsilon if needed.
// It's because Points and Segments are compared WRT machine epsilon.
// This ensures that leafs bounds correspond to the stored elements.
// NOTE: this is done only if the Indexable is not a Box
//       in the future don't do it also for NSphere
template <typename Box, typename FwdIter, typename Translator>
inline Box values_box(FwdIter first, FwdIter last, Translator const& tr)
{
    typedef typename std::iterator_traits<FwdIter>::value_type element_type;
    BOOST_MPL_ASSERT_MSG((is_leaf_element<element_type>::value),
                         SHOULD_BE_CALLED_ONLY_FOR_LEAF_ELEMENTS,
                         (element_type));

    Box result = elements_box<Box>(first, last, tr);

#ifdef BOOST_GEOMETRY_INDEX_EXPERIMENTAL_ENLARGE_BY_EPSILON
    if (BOOST_GEOMETRY_CONDITION((
        ! is_bounding_geometry
            <
                typename indexable_type<Translator>::type
            >::value)))
    {
        geometry::detail::expand_by_epsilon(result);
    }
#endif

    return result;
}

// destroys subtree if the element is internal node's element
template <typename Value, typename Options, typename Translator, typename Box, typename Allocators>
struct destroy_element
{
    typedef typename Options::parameters_type parameters_type;

    typedef typename rtree::internal_node<Value, parameters_type, Box, Allocators, typename Options::node_tag>::type internal_node;
    typedef typename rtree::leaf<Value, parameters_type, Box, Allocators, typename Options::node_tag>::type leaf;

    typedef rtree::subtree_destroyer<Value, Options, Translator, Box, Allocators> subtree_destroyer;

    inline static void apply(typename internal_node::elements_type::value_type & element, Allocators & allocators)
    {
         subtree_destroyer dummy(element.second, allocators);
         element.second = 0;
    }

    inline static void apply(typename leaf::elements_type::value_type &, Allocators &) {}
};

// destroys stored subtrees if internal node's elements are passed
template <typename Value, typename Options, typename Translator, typename Box, typename Allocators>
struct destroy_elements
{
    template <typename Range>
    inline static void apply(Range & elements, Allocators & allocators)
    {
        apply(boost::begin(elements), boost::end(elements), allocators);
    }

    template <typename It>
    inline static void apply(It first, It last, Allocators & allocators)
    {
        typedef boost::mpl::bool_<
            boost::is_same<
                Value, typename std::iterator_traits<It>::value_type
            >::value
        > is_range_of_values;

        apply_dispatch(first, last, allocators, is_range_of_values());
    }

private:
    template <typename It>
    inline static void apply_dispatch(It first, It last, Allocators & allocators,
                                      boost::mpl::bool_<false> const& /*is_range_of_values*/)
    {
        typedef rtree::subtree_destroyer<Value, Options, Translator, Box, Allocators> subtree_destroyer;

        for ( ; first != last ; ++first )
        {
            subtree_destroyer dummy(first->second, allocators);
            first->second = 0;
        }
    }

    template <typename It>
    inline static void apply_dispatch(It /*first*/, It /*last*/, Allocators & /*allocators*/,
                                      boost::mpl::bool_<true> const& /*is_range_of_values*/)
    {}
};

// clears node, deletes all subtrees stored in node
template <typename Value, typename Options, typename Translator, typename Box, typename Allocators>
struct clear_node
{
    typedef typename Options::parameters_type parameters_type;

    typedef typename rtree::node<Value, parameters_type, Box, Allocators, typename Options::node_tag>::type node;
    typedef typename rtree::internal_node<Value, parameters_type, Box, Allocators, typename Options::node_tag>::type internal_node;
    typedef typename rtree::leaf<Value, parameters_type, Box, Allocators, typename Options::node_tag>::type leaf;

    inline static void apply(node & node, Allocators & allocators)
    {
        rtree::visitors::is_leaf<Value, Options, Box, Allocators> ilv;
        rtree::apply_visitor(ilv, node);
        if ( ilv.result )
        {
            apply(rtree::get<leaf>(node), allocators);
        }
        else
        {
            apply(rtree::get<internal_node>(node), allocators);
        }
    }

    inline static void apply(internal_node & internal_node, Allocators & allocators)
    {
        destroy_elements<Value, Options, Translator, Box, Allocators>::apply(rtree::elements(internal_node), allocators);
        rtree::elements(internal_node).clear();
    }

    inline static void apply(leaf & leaf, Allocators &)
    {
        rtree::elements(leaf).clear();
    }
};

template <typename Container, typename Iterator>
void move_from_back(Container & container, Iterator it)
{
    BOOST_GEOMETRY_INDEX_ASSERT(!container.empty(), "cannot copy from empty container");
    Iterator back_it = container.end();
    --back_it;
    if ( it != back_it )
    {
        *it = boost::move(*back_it);                                                             // MAY THROW (copy)
    }
}

}} // namespace detail::rtree

}}} // namespace boost::geometry::index

#endif // BOOST_GEOMETRY_INDEX_DETAIL_RTREE_NODE_NODE_HPP
