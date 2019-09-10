// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_OVERLAY_ASSIGN_PARENTS_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_OVERLAY_ASSIGN_PARENTS_HPP

#include <boost/range.hpp>

#include <boost/geometry/algorithms/area.hpp>
#include <boost/geometry/algorithms/envelope.hpp>
#include <boost/geometry/algorithms/expand.hpp>
#include <boost/geometry/algorithms/detail/partition.hpp>
#include <boost/geometry/algorithms/detail/overlay/get_ring.hpp>
#include <boost/geometry/algorithms/within.hpp>

#include <boost/geometry/geometries/box.hpp>

namespace boost { namespace geometry
{


#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace overlay
{



template
<
    typename Item,
    typename Geometry1, typename Geometry2,
    typename RingCollection
>
static inline bool within_selected_input(Item const& item2, ring_identifier const& ring_id,
        Geometry1 const& geometry1, Geometry2 const& geometry2,
        RingCollection const& collection)
{
    typedef typename geometry::tag<Geometry1>::type tag1;
    typedef typename geometry::tag<Geometry2>::type tag2;

    switch (ring_id.source_index)
    {
        case 0 :
            return geometry::within(item2.point,
                get_ring<tag1>::apply(ring_id, geometry1));
            break;
        case 1 :
            return geometry::within(item2.point,
                get_ring<tag2>::apply(ring_id, geometry2));
            break;
        case 2 :
            return geometry::within(item2.point,
                get_ring<void>::apply(ring_id, collection));
            break;
    }
    return false;
}


template <typename Point>
struct ring_info_helper
{
    typedef typename geometry::default_area_result<Point>::type area_type;

    ring_identifier id;
    area_type real_area;
    area_type abs_area;
    model::box<Point> envelope;

    inline ring_info_helper()
        : real_area(0), abs_area(0)
    {}

    inline ring_info_helper(ring_identifier i, area_type a)
        : id(i), real_area(a), abs_area(geometry::math::abs(a))
    {}
};


struct ring_info_helper_get_box
{
    template <typename Box, typename InputItem>
    static inline void apply(Box& total, InputItem const& item)
    {
        geometry::expand(total, item.envelope);
    }
};

struct ring_info_helper_ovelaps_box
{
    template <typename Box, typename InputItem>
    static inline bool apply(Box const& box, InputItem const& item)
    {
        return ! geometry::detail::disjoint::disjoint_box_box(box, item.envelope);
    }
};

template <typename Geometry1, typename Geometry2, typename Collection, typename RingMap>
struct assign_visitor
{
    typedef typename RingMap::mapped_type ring_info_type;

    Geometry1 const& m_geometry1;
    Geometry2 const& m_geometry2;
    Collection const& m_collection;
    RingMap& m_ring_map;
    bool m_check_for_orientation;


    inline assign_visitor(Geometry1 const& g1, Geometry2 const& g2, Collection const& c,
                RingMap& map, bool check)
        : m_geometry1(g1)
        , m_geometry2(g2)
        , m_collection(c)
        , m_ring_map(map)
        , m_check_for_orientation(check)
    {}

    template <typename Item>
    inline void apply(Item const& outer, Item const& inner, bool first = true)
    {
        if (first && outer.abs_area < inner.abs_area)
        {
            // Apply with reversed arguments
            apply(inner, outer, false);
            return;
        }

        if (m_check_for_orientation
         || (math::larger(outer.real_area, 0)
          && math::smaller(inner.real_area, 0)))
        {
            ring_info_type& inner_in_map = m_ring_map[inner.id];

            if (geometry::within(inner_in_map.point, outer.envelope)
               && within_selected_input(inner_in_map, outer.id, m_geometry1, m_geometry2, m_collection)
               )
            {
                // Assign a parent if there was no earlier parent, or the newly
                // found parent is smaller than the previous one
                if (inner_in_map.parent.source_index == -1
                    || outer.abs_area < inner_in_map.parent_area)
                {
                    inner_in_map.parent = outer.id;
                    inner_in_map.parent_area = outer.abs_area;
                }
            }
        }
    }
};




template
<
    typename Geometry1, typename Geometry2,
    typename RingCollection,
    typename RingMap
>
inline void assign_parents(Geometry1 const& geometry1,
            Geometry2 const& geometry2,
            RingCollection const& collection,
            RingMap& ring_map,
            bool check_for_orientation = false)
{
    typedef typename geometry::tag<Geometry1>::type tag1;
    typedef typename geometry::tag<Geometry2>::type tag2;

    typedef typename RingMap::mapped_type ring_info_type;
    typedef typename ring_info_type::point_type point_type;
    typedef model::box<point_type> box_type;

    typedef typename RingMap::iterator map_iterator_type;

    {
        typedef ring_info_helper<point_type> helper;
        typedef std::vector<helper> vector_type;
        typedef typename boost::range_iterator<vector_type const>::type vector_iterator_type;

        std::size_t count_total = ring_map.size();
        std::size_t count_positive = 0;
        std::size_t index_positive = 0; // only used if count_positive>0
        std::size_t index = 0;

        // Copy to vector (with new approach this might be obsolete as well, using the map directly)
        vector_type vector(count_total);

        for (map_iterator_type it = boost::begin(ring_map);
            it != boost::end(ring_map); ++it, ++index)
        {
            vector[index] = helper(it->first, it->second.get_area());
            helper& item = vector[index];
            switch(it->first.source_index)
            {
                case 0 :
                    geometry::envelope(get_ring<tag1>::apply(it->first, geometry1),
                            item.envelope);
                    break;
                case 1 :
                    geometry::envelope(get_ring<tag2>::apply(it->first, geometry2),
                            item.envelope);
                    break;
                case 2 :
                    geometry::envelope(get_ring<void>::apply(it->first, collection),
                            item.envelope);
                    break;
            }
            if (item.real_area > 0)
            {
                count_positive++;
                index_positive = index;
            }
        }

        if (! check_for_orientation)
        {
            if (count_positive == count_total)
            {
                // Optimization for only positive rings
                // -> no assignment of parents or reversal necessary, ready here.
                return;
            }

            if (count_positive == 1)
            {
                // Optimization for one outer ring
                // -> assign this as parent to all others (all interior rings)
                // In unions, this is probably the most occuring case and gives
                //    a dramatic improvement (factor 5 for star_comb testcase)
                ring_identifier id_of_positive = vector[index_positive].id;
                ring_info_type& outer = ring_map[id_of_positive];
                index = 0;
                for (vector_iterator_type it = boost::begin(vector);
                    it != boost::end(vector); ++it, ++index)
                {
                    if (index != index_positive)
                    {
                        ring_info_type& inner = ring_map[it->id];
                        inner.parent = id_of_positive;
                        outer.children.push_back(it->id);
                    }
                }
                return;
            }
        }

        assign_visitor
            <
                Geometry1, Geometry2,
                RingCollection, RingMap
            > visitor(geometry1, geometry2, collection, ring_map, check_for_orientation);

        geometry::partition
            <
                box_type, ring_info_helper_get_box, ring_info_helper_ovelaps_box
            >::apply(vector, visitor);
    }

    if (check_for_orientation)
    {
        for (map_iterator_type it = boost::begin(ring_map);
            it != boost::end(ring_map); ++it)
        {
            if (geometry::math::equals(it->second.get_area(), 0))
            {
                it->second.discarded = true;
            }
            else if (it->second.parent.source_index >= 0
                    && math::larger(it->second.get_area(), 0))
            {
                const ring_info_type& parent = ring_map[it->second.parent];

                if (math::larger(parent.area, 0))
                {
                    // Discard positive inner ring with positive parent
                    it->second.discarded = true;
                }
                // Remove parent ID from any positive inner ring
                it->second.parent.source_index = -1;
            }
            else if (it->second.parent.source_index < 0
                    && math::smaller(it->second.get_area(), 0))
            {
                // Reverse negative ring without parent
                it->second.reversed = true;
            }
        }
    }

    // Assign childlist
    for (map_iterator_type it = boost::begin(ring_map);
        it != boost::end(ring_map); ++it)
    {
        if (it->second.parent.source_index >= 0)
        {
            ring_map[it->second.parent].children.push_back(it->first);
        }
    }
}


// Version for one geometry (called by buffer)
template
<
    typename Geometry,
    typename RingCollection,
    typename RingMap
>
inline void assign_parents(Geometry const& geometry,
            RingCollection const& collection,
            RingMap& ring_map,
            bool check_for_orientation)
{
    // Call it with an empty geometry as second geometry (source_id == 1)
    // (ring_map should be empty for source_id==1)

    Geometry empty;
    assign_parents(geometry, empty, collection, ring_map, check_for_orientation);
}


}} // namespace detail::overlay
#endif // DOXYGEN_NO_DETAIL


}} // namespace geometry


#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_OVERLAY_ASSIGN_PARENTS_HPP
