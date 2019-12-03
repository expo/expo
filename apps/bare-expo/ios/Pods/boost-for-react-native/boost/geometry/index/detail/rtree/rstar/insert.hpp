// Boost.Geometry Index
//
// R-tree R*-tree insert algorithm implementation
//
// Copyright (c) 2011-2015 Adam Wulkiewicz, Lodz, Poland.
//
// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_INDEX_DETAIL_RTREE_RSTAR_INSERT_HPP
#define BOOST_GEOMETRY_INDEX_DETAIL_RTREE_RSTAR_INSERT_HPP

#include <boost/geometry/index/detail/algorithms/content.hpp>

namespace boost { namespace geometry { namespace index {

namespace detail { namespace rtree { namespace visitors {

namespace rstar {

template <typename Value, typename Options, typename Translator, typename Box, typename Allocators>
class remove_elements_to_reinsert
{
public:
    typedef typename rtree::node<Value, typename Options::parameters_type, Box, Allocators, typename Options::node_tag>::type node;
    typedef typename rtree::internal_node<Value, typename Options::parameters_type, Box, Allocators, typename Options::node_tag>::type internal_node;
    typedef typename rtree::leaf<Value, typename Options::parameters_type, Box, Allocators, typename Options::node_tag>::type leaf;

    typedef typename Options::parameters_type parameters_type;

    //typedef typename Allocators::internal_node_pointer internal_node_pointer;
    typedef internal_node * internal_node_pointer;

    template <typename ResultElements, typename Node>
    static inline void apply(ResultElements & result_elements,
                             Node & n,
                             internal_node_pointer parent,
                             size_t current_child_index,
                             parameters_type const& parameters,
                             Translator const& translator,
                             Allocators & allocators)
    {
        typedef typename rtree::elements_type<Node>::type elements_type;
        typedef typename elements_type::value_type element_type;
        typedef typename geometry::point_type<Box>::type point_type;
        // TODO: awulkiew - change second point_type to the point type of the Indexable?
        typedef typename
            geometry::default_comparable_distance_result<point_type>::type
                comparable_distance_type;

        elements_type & elements = rtree::elements(n);

        const size_t elements_count = parameters.get_max_elements() + 1;
        const size_t reinserted_elements_count = (::std::min)(parameters.get_reinserted_elements(), elements_count - parameters.get_min_elements());

        BOOST_GEOMETRY_INDEX_ASSERT(parent, "node shouldn't be the root node");
        BOOST_GEOMETRY_INDEX_ASSERT(elements.size() == elements_count, "unexpected elements number");
        BOOST_GEOMETRY_INDEX_ASSERT(0 < reinserted_elements_count, "wrong value of elements to reinsert");

        // calculate current node's center
        point_type node_center;
        geometry::centroid(rtree::elements(*parent)[current_child_index].first, node_center);

        // fill the container of centers' distances of children from current node's center
        typedef typename index::detail::rtree::container_from_elements_type<
            elements_type,
            std::pair<comparable_distance_type, element_type>
        >::type sorted_elements_type;

        sorted_elements_type sorted_elements;
        // If constructor is used instead of resize() MS implementation leaks here
        sorted_elements.reserve(elements_count);                                                         // MAY THROW, STRONG (V, E: alloc, copy)
        
        for ( typename elements_type::const_iterator it = elements.begin() ;
              it != elements.end() ; ++it )
        {
            point_type element_center;
            geometry::centroid( rtree::element_indexable(*it, translator), element_center);
            sorted_elements.push_back(std::make_pair(
                geometry::comparable_distance(node_center, element_center),
                *it));                                                                                  // MAY THROW (V, E: copy)
        }

        // sort elements by distances from center
        std::partial_sort(
            sorted_elements.begin(),
            sorted_elements.begin() + reinserted_elements_count,
            sorted_elements.end(),
            distances_dsc<comparable_distance_type, element_type>);                                                // MAY THROW, BASIC (V, E: copy)

        // copy elements which will be reinserted
        result_elements.clear();
        result_elements.reserve(reinserted_elements_count);                                             // MAY THROW, STRONG (V, E: alloc, copy)
        for ( typename sorted_elements_type::const_iterator it = sorted_elements.begin() ;
              it != sorted_elements.begin() + reinserted_elements_count ; ++it )
        {
            result_elements.push_back(it->second);                                                      // MAY THROW (V, E: copy)
        }

        BOOST_TRY
        {
            // copy remaining elements to the current node
            elements.clear();
            elements.reserve(elements_count - reinserted_elements_count);                                // SHOULDN'T THROW (new_size <= old size)
            for ( typename sorted_elements_type::const_iterator it = sorted_elements.begin() + reinserted_elements_count;
                  it != sorted_elements.end() ; ++it )
            {
                elements.push_back(it->second);                                                         // MAY THROW (V, E: copy)
            }
        }
        BOOST_CATCH(...)
        {
            elements.clear();

            for ( typename sorted_elements_type::iterator it = sorted_elements.begin() ;
                  it != sorted_elements.end() ; ++it )
            {
                destroy_element<Value, Options, Translator, Box, Allocators>::apply(it->second, allocators);
            }

            BOOST_RETHROW                                                                                 // RETHROW
        }
        BOOST_CATCH_END

        ::boost::ignore_unused_variable_warning(parameters);
    }

private:
    template <typename Distance, typename El>
    static inline bool distances_asc(
        std::pair<Distance, El> const& d1,
        std::pair<Distance, El> const& d2)
    {
        return d1.first < d2.first;
    }
    
    template <typename Distance, typename El>
    static inline bool distances_dsc(
        std::pair<Distance, El> const& d1,
        std::pair<Distance, El> const& d2)
    {
        return d1.first > d2.first;
    }
};

template <size_t InsertIndex, typename Element, typename Value, typename Options, typename Box, typename Allocators>
struct level_insert_elements_type
{
    typedef typename rtree::elements_type<
        typename rtree::internal_node<Value, typename Options::parameters_type, Box, Allocators, typename Options::node_tag>::type
    >::type type;
};

template <typename Value, typename Options, typename Box, typename Allocators>
struct level_insert_elements_type<0, Value, Value, Options, Box, Allocators>
{
    typedef typename rtree::elements_type<
        typename rtree::leaf<Value, typename Options::parameters_type, Box, Allocators, typename Options::node_tag>::type
    >::type type;
};

template <size_t InsertIndex, typename Element, typename Value, typename Options, typename Translator, typename Box, typename Allocators>
struct level_insert_base
    : public detail::insert<Element, Value, Options, Translator, Box, Allocators>
{
    typedef detail::insert<Element, Value, Options, Translator, Box, Allocators> base;
    typedef typename base::node node;
    typedef typename base::internal_node internal_node;
    typedef typename base::leaf leaf;

    typedef typename level_insert_elements_type<InsertIndex, Element, Value, Options, Box, Allocators>::type elements_type;
    typedef typename index::detail::rtree::container_from_elements_type<
        elements_type,
        typename elements_type::value_type
    >::type result_elements_type;

    typedef typename Options::parameters_type parameters_type;

    typedef typename Allocators::node_pointer node_pointer;
    typedef typename Allocators::size_type size_type;

    inline level_insert_base(node_pointer & root,
                             size_type & leafs_level,
                             Element const& element,
                             parameters_type const& parameters,
                             Translator const& translator,
                             Allocators & allocators,
                             size_type relative_level)
        : base(root, leafs_level, element, parameters, translator, allocators, relative_level)
        , result_relative_level(0)
    {}

    template <typename Node>
    inline void handle_possible_reinsert_or_split_of_root(Node &n)
    {
        BOOST_GEOMETRY_INDEX_ASSERT(result_elements.empty(), "reinsert should be handled only once for level");

        result_relative_level = base::m_leafs_level - base::m_traverse_data.current_level;

        // overflow
        if ( base::m_parameters.get_max_elements() < rtree::elements(n).size() )
        {
            // node isn't root node
            if ( !base::m_traverse_data.current_is_root() )
            {
                // NOTE: exception-safety
                // After an exception result_elements may contain garbage, don't use it
                rstar::remove_elements_to_reinsert<Value, Options, Translator, Box, Allocators>::apply(
                    result_elements, n,
                    base::m_traverse_data.parent, base::m_traverse_data.current_child_index,
                    base::m_parameters, base::m_translator, base::m_allocators);                            // MAY THROW, BASIC (V, E: alloc, copy)
            }
            // node is root node
            else
            {
                BOOST_GEOMETRY_INDEX_ASSERT(&n == &rtree::get<Node>(*base::m_root_node), "node should be the root node");
                base::split(n);                                                                             // MAY THROW (V, E: alloc, copy, N: alloc)
            }
        }
    }

    template <typename Node>
    inline void handle_possible_split(Node &n) const
    {
        // overflow
        if ( base::m_parameters.get_max_elements() < rtree::elements(n).size() )
        {
            base::split(n);                                                                                 // MAY THROW (V, E: alloc, copy, N: alloc)
        }
    }

    template <typename Node>
    inline void recalculate_aabb_if_necessary(Node const& n) const
    {
        if ( !result_elements.empty() && !base::m_traverse_data.current_is_root() )
        {
            // calulate node's new box
            recalculate_aabb(n);
        }
    }

    template <typename Node>
    inline void recalculate_aabb(Node const& n) const
    {
        base::m_traverse_data.current_element().first =
            elements_box<Box>(rtree::elements(n).begin(), rtree::elements(n).end(), base::m_translator);
    }

    inline void recalculate_aabb(leaf const& n) const
    {
        base::m_traverse_data.current_element().first =
            values_box<Box>(rtree::elements(n).begin(), rtree::elements(n).end(), base::m_translator);
    }

    size_type result_relative_level;
    result_elements_type result_elements;
};

template <size_t InsertIndex, typename Element, typename Value, typename Options, typename Translator, typename Box, typename Allocators>
struct level_insert
    : public level_insert_base<InsertIndex, Element, Value, Options, Translator, Box, Allocators>
{
    typedef level_insert_base<InsertIndex, Element, Value, Options, Translator, Box, Allocators> base;
    typedef typename base::node node;
    typedef typename base::internal_node internal_node;
    typedef typename base::leaf leaf;

    typedef typename Options::parameters_type parameters_type;

    typedef typename Allocators::node_pointer node_pointer;
    typedef typename Allocators::size_type size_type;

    inline level_insert(node_pointer & root,
                        size_type & leafs_level,
                        Element const& element,
                        parameters_type const& parameters,
                        Translator const& translator,
                        Allocators & allocators,
                        size_type relative_level)
        : base(root, leafs_level, element, parameters, translator, allocators, relative_level)
    {}

    inline void operator()(internal_node & n)
    {
        BOOST_GEOMETRY_INDEX_ASSERT(base::m_traverse_data.current_level < base::m_leafs_level, "unexpected level");

        if ( base::m_traverse_data.current_level < base::m_level )
        {
            // next traversing step
            base::traverse(*this, n);                                                                       // MAY THROW (E: alloc, copy, N: alloc)

            // further insert
            if ( 0 < InsertIndex )
            {
                BOOST_GEOMETRY_INDEX_ASSERT(0 < base::m_level, "illegal level value, level shouldn't be the root level for 0 < InsertIndex");

                if ( base::m_traverse_data.current_level == base::m_level - 1 )
                {
                    base::handle_possible_reinsert_or_split_of_root(n);                                     // MAY THROW (E: alloc, copy, N: alloc)
                }
            }
        }
        else
        {
            BOOST_GEOMETRY_INDEX_ASSERT(base::m_level == base::m_traverse_data.current_level, "unexpected level");

            BOOST_TRY
            {
                // push new child node
                rtree::elements(n).push_back(base::m_element);                                              // MAY THROW, STRONG (E: alloc, copy)
            }
            BOOST_CATCH(...)
            {
                // NOTE: exception-safety
                // if the insert fails above, the element won't be stored in the tree, so delete it

                rtree::visitors::destroy<Value, Options, Translator, Box, Allocators> del_v(base::m_element.second, base::m_allocators);
                rtree::apply_visitor(del_v, *base::m_element.second);

                BOOST_RETHROW                                                                                 // RETHROW
            }
            BOOST_CATCH_END

            // first insert
            if ( 0 == InsertIndex )
            {
                base::handle_possible_reinsert_or_split_of_root(n);                                         // MAY THROW (E: alloc, copy, N: alloc)
            }
            // not the first insert
            else
            {
                base::handle_possible_split(n);                                                             // MAY THROW (E: alloc, N: alloc)
            }
        }

        base::recalculate_aabb_if_necessary(n);
    }

    inline void operator()(leaf &)
    {
        BOOST_GEOMETRY_INDEX_ASSERT(false, "this visitor can't be used for a leaf");
    }
};

template <size_t InsertIndex, typename Value, typename Options, typename Translator, typename Box, typename Allocators>
struct level_insert<InsertIndex, Value, Value, Options, Translator, Box, Allocators>
    : public level_insert_base<InsertIndex, Value, Value, Options, Translator, Box, Allocators>
{
    typedef level_insert_base<InsertIndex, Value, Value, Options, Translator, Box, Allocators> base;
    typedef typename base::node node;
    typedef typename base::internal_node internal_node;
    typedef typename base::leaf leaf;

    typedef typename Options::parameters_type parameters_type;

    typedef typename Allocators::node_pointer node_pointer;
    typedef typename Allocators::size_type size_type;

    inline level_insert(node_pointer & root,
                        size_type & leafs_level,
                        Value const& v,
                        parameters_type const& parameters,
                        Translator const& translator,
                        Allocators & allocators,
                        size_type relative_level)
        : base(root, leafs_level, v, parameters, translator, allocators, relative_level)
    {}

    inline void operator()(internal_node & n)
    {
        BOOST_GEOMETRY_INDEX_ASSERT(base::m_traverse_data.current_level < base::m_leafs_level, "unexpected level");
        BOOST_GEOMETRY_INDEX_ASSERT(base::m_traverse_data.current_level < base::m_level, "unexpected level");

        // next traversing step
        base::traverse(*this, n);                                                                       // MAY THROW (V, E: alloc, copy, N: alloc)

        BOOST_GEOMETRY_INDEX_ASSERT(0 < base::m_level, "illegal level value, level shouldn't be the root level for 0 < InsertIndex");
        
        if ( base::m_traverse_data.current_level == base::m_level - 1 )
        {
            base::handle_possible_reinsert_or_split_of_root(n);                                         // MAY THROW (E: alloc, copy, N: alloc)
        }

        base::recalculate_aabb_if_necessary(n);
    }

    inline void operator()(leaf & n)
    {
        BOOST_GEOMETRY_INDEX_ASSERT(base::m_traverse_data.current_level == base::m_leafs_level,
                                    "unexpected level");
        BOOST_GEOMETRY_INDEX_ASSERT(base::m_level == base::m_traverse_data.current_level ||
                                    base::m_level == (std::numeric_limits<size_t>::max)(),
                                    "unexpected level");
        
        rtree::elements(n).push_back(base::m_element);                                                  // MAY THROW, STRONG (V: alloc, copy)

        base::handle_possible_split(n);                                                                 // MAY THROW (V: alloc, copy, N: alloc)
    }
};

template <typename Value, typename Options, typename Translator, typename Box, typename Allocators>
struct level_insert<0, Value, Value, Options, Translator, Box, Allocators>
    : public level_insert_base<0, Value, Value, Options, Translator, Box, Allocators>
{
    typedef level_insert_base<0, Value, Value, Options, Translator, Box, Allocators> base;
    typedef typename base::node node;
    typedef typename base::internal_node internal_node;
    typedef typename base::leaf leaf;

    typedef typename Options::parameters_type parameters_type;

    typedef typename Allocators::node_pointer node_pointer;
    typedef typename Allocators::size_type size_type;

    inline level_insert(node_pointer & root,
                        size_type & leafs_level,
                        Value const& v,
                        parameters_type const& parameters,
                        Translator const& translator,
                        Allocators & allocators,
                        size_type relative_level)
        : base(root, leafs_level, v, parameters, translator, allocators, relative_level)
    {}

    inline void operator()(internal_node & n)
    {
        BOOST_GEOMETRY_INDEX_ASSERT(base::m_traverse_data.current_level < base::m_leafs_level,
                                    "unexpected level");
        BOOST_GEOMETRY_INDEX_ASSERT(base::m_traverse_data.current_level < base::m_level,
                                    "unexpected level");

        // next traversing step
        base::traverse(*this, n);                                                                       // MAY THROW (V: alloc, copy, N: alloc)

        base::recalculate_aabb_if_necessary(n);
    }

    inline void operator()(leaf & n)
    {
        BOOST_GEOMETRY_INDEX_ASSERT(base::m_traverse_data.current_level == base::m_leafs_level,
                                    "unexpected level");
        BOOST_GEOMETRY_INDEX_ASSERT(base::m_level == base::m_traverse_data.current_level ||
                                    base::m_level == (std::numeric_limits<size_t>::max)(),
                                    "unexpected level");

        rtree::elements(n).push_back(base::m_element);                                                  // MAY THROW, STRONG (V: alloc, copy)

        base::handle_possible_reinsert_or_split_of_root(n);                                             // MAY THROW (V: alloc, copy, N: alloc)
        
        base::recalculate_aabb_if_necessary(n);
    }
};

} // namespace rstar

// R*-tree insert visitor
// After passing the Element to insert visitor the Element is managed by the tree
// I.e. one should not delete the node passed to the insert visitor after exception is thrown
// because this visitor may delete it
template <typename Element, typename Value, typename Options, typename Translator, typename Box, typename Allocators>
class insert<Element, Value, Options, Translator, Box, Allocators, insert_reinsert_tag>
    : public rtree::visitor<Value, typename Options::parameters_type, Box, Allocators, typename Options::node_tag, false>::type
{
    typedef typename Options::parameters_type parameters_type;

    typedef typename rtree::node<Value, parameters_type, Box, Allocators, typename Options::node_tag>::type node;
    typedef typename rtree::internal_node<Value, parameters_type, Box, Allocators, typename Options::node_tag>::type internal_node;
    typedef typename rtree::leaf<Value, parameters_type, Box, Allocators, typename Options::node_tag>::type leaf;

    typedef typename Allocators::node_pointer node_pointer;
    typedef typename Allocators::size_type size_type;

public:
    inline insert(node_pointer & root,
                  size_type & leafs_level,
                  Element const& element,
                  parameters_type const& parameters,
                  Translator const& translator,
                  Allocators & allocators,
                  size_type relative_level = 0)
        : m_root(root), m_leafs_level(leafs_level), m_element(element)
        , m_parameters(parameters), m_translator(translator)
        , m_relative_level(relative_level), m_allocators(allocators)
    {}

    inline void operator()(internal_node & n)
    {
        boost::ignore_unused(n);
        BOOST_GEOMETRY_INDEX_ASSERT(&n == &rtree::get<internal_node>(*m_root), "current node should be the root");

        // Distinguish between situation when reinserts are required and use adequate visitor, otherwise use default one
        if ( m_parameters.get_reinserted_elements() > 0 )
        {
            rstar::level_insert<0, Element, Value, Options, Translator, Box, Allocators> lins_v(
                m_root, m_leafs_level, m_element, m_parameters, m_translator, m_allocators, m_relative_level);

            rtree::apply_visitor(lins_v, *m_root);                                                              // MAY THROW (V, E: alloc, copy, N: alloc)

            if ( !lins_v.result_elements.empty() )
            {
                recursive_reinsert(lins_v.result_elements, lins_v.result_relative_level);                       // MAY THROW (V, E: alloc, copy, N: alloc)
            }
        }
        else
        {
            visitors::insert<Element, Value, Options, Translator, Box, Allocators, insert_default_tag> ins_v(
                m_root, m_leafs_level, m_element, m_parameters, m_translator, m_allocators, m_relative_level);

            rtree::apply_visitor(ins_v, *m_root); 
        }
    }

    inline void operator()(leaf & n)
    {
        boost::ignore_unused(n);
        BOOST_GEOMETRY_INDEX_ASSERT(&n == &rtree::get<leaf>(*m_root), "current node should be the root");

        // Distinguish between situation when reinserts are required and use adequate visitor, otherwise use default one
        if ( m_parameters.get_reinserted_elements() > 0 )
        {
            rstar::level_insert<0, Element, Value, Options, Translator, Box, Allocators> lins_v(
                m_root, m_leafs_level, m_element, m_parameters, m_translator, m_allocators, m_relative_level);

            rtree::apply_visitor(lins_v, *m_root);                                                              // MAY THROW (V, E: alloc, copy, N: alloc)

            // we're in the root, so root should be split and there should be no elements to reinsert
            BOOST_GEOMETRY_INDEX_ASSERT(lins_v.result_elements.empty(), "unexpected state");
        }
        else
        {
            visitors::insert<Element, Value, Options, Translator, Box, Allocators, insert_default_tag> ins_v(
                m_root, m_leafs_level, m_element, m_parameters, m_translator, m_allocators, m_relative_level);

            rtree::apply_visitor(ins_v, *m_root); 
        }
    }

private:
    template <typename Elements>
    inline void recursive_reinsert(Elements & elements, size_t relative_level)
    {
        typedef typename Elements::value_type element_type;

        // reinsert children starting from the minimum distance
        typename Elements::reverse_iterator it = elements.rbegin();
        for ( ; it != elements.rend() ; ++it)
        {
            rstar::level_insert<1, element_type, Value, Options, Translator, Box, Allocators> lins_v(
                m_root, m_leafs_level, *it, m_parameters, m_translator, m_allocators, relative_level);

            BOOST_TRY
            {
                rtree::apply_visitor(lins_v, *m_root);                                                          // MAY THROW (V, E: alloc, copy, N: alloc)
            }
            BOOST_CATCH(...)
            {
                ++it;
                for ( ; it != elements.rend() ; ++it)
                    rtree::destroy_element<Value, Options, Translator, Box, Allocators>::apply(*it, m_allocators);
                BOOST_RETHROW                                                                                     // RETHROW
            }
            BOOST_CATCH_END

            BOOST_GEOMETRY_INDEX_ASSERT(relative_level + 1 == lins_v.result_relative_level, "unexpected level");

            // non-root relative level
            if ( lins_v.result_relative_level < m_leafs_level && !lins_v.result_elements.empty())
            {
                recursive_reinsert(lins_v.result_elements, lins_v.result_relative_level);                   // MAY THROW (V, E: alloc, copy, N: alloc)
            }
        }
    }

    node_pointer & m_root;
    size_type & m_leafs_level;
    Element const& m_element;

    parameters_type const& m_parameters;
    Translator const& m_translator;

    size_type m_relative_level;

    Allocators & m_allocators;
};

}}} // namespace detail::rtree::visitors

}}} // namespace boost::geometry::index

#endif // BOOST_GEOMETRY_INDEX_DETAIL_RTREE_RSTAR_INSERT_HPP
