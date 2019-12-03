// Boost.Geometry Index
//
// R-tree boxes validating visitor implementation
//
// Copyright (c) 2011-2015 Adam Wulkiewicz, Lodz, Poland.
//
// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_INDEX_DETAIL_RTREE_UTILITIES_ARE_BOXES_OK_HPP
#define BOOST_GEOMETRY_INDEX_DETAIL_RTREE_UTILITIES_ARE_BOXES_OK_HPP

#include <boost/geometry/algorithms/equals.hpp>
#include <boost/geometry/index/detail/rtree/node/node.hpp>

namespace boost { namespace geometry { namespace index { namespace detail { namespace rtree { namespace utilities {

namespace visitors {

template <typename Value, typename Options, typename Translator, typename Box, typename Allocators>
class are_boxes_ok
    : public rtree::visitor<Value, typename Options::parameters_type, Box, Allocators, typename Options::node_tag, true>::type
{
    typedef typename rtree::internal_node<Value, typename Options::parameters_type, Box, Allocators, typename Options::node_tag>::type internal_node;
    typedef typename rtree::leaf<Value, typename Options::parameters_type, Box, Allocators, typename Options::node_tag>::type leaf;

public:
    are_boxes_ok(Translator const& tr, bool exact_match)
        : result(false), m_tr(tr), m_is_root(true), m_exact_match(exact_match)
    {}

    void operator()(internal_node const& n)
    {
        typedef typename rtree::elements_type<internal_node>::type elements_type;
        elements_type const& elements = rtree::elements(n);

        if (elements.empty())
        {
            result = false;
            return;
        }

        Box box_bckup = m_box;
        bool is_root_bckup = m_is_root;

        m_is_root = false;

        for ( typename elements_type::const_iterator it = elements.begin();
              it != elements.end() ; ++it)
        {
            m_box = it->first;

            rtree::apply_visitor(*this, *it->second);

            if ( result == false )
                return;
        }

        m_box = box_bckup;
        m_is_root = is_root_bckup;

        Box box_exp = rtree::elements_box<Box>(elements.begin(), elements.end(), m_tr);
        
        if ( m_exact_match )
            result = m_is_root || geometry::equals(box_exp, m_box);
        else
            result = m_is_root || geometry::covered_by(box_exp, m_box);
    }

    void operator()(leaf const& n)
    {
        typedef typename rtree::elements_type<leaf>::type elements_type;
        elements_type const& elements = rtree::elements(n);

        // non-root node
        if (!m_is_root)
        {
            if ( elements.empty() )
            {
                result = false;
                return;
            }
        
            Box box_exp = rtree::values_box<Box>(elements.begin(), elements.end(), m_tr);

            if ( m_exact_match )
                result = geometry::equals(box_exp, m_box);
            else
                result = geometry::covered_by(box_exp, m_box);
        }
        else
            result = true;
    }

    bool result;

private:
    Translator const& m_tr;
    Box m_box;
    bool m_is_root;
    bool m_exact_match;
};

} // namespace visitors

template <typename Rtree> inline
bool are_boxes_ok(Rtree const& tree, bool exact_match = true)
{
    typedef utilities::view<Rtree> RTV;
    RTV rtv(tree);

    visitors::are_boxes_ok<
        typename RTV::value_type,
        typename RTV::options_type,
        typename RTV::translator_type,
        typename RTV::box_type,
        typename RTV::allocators_type
    > v(rtv.translator(), exact_match);
    
    rtv.apply_visitor(v);

    return v.result;
}

}}}}}} // namespace boost::geometry::index::detail::rtree::utilities

#endif // BOOST_GEOMETRY_INDEX_DETAIL_RTREE_UTILITIES_ARE_BOXES_OK_HPP
