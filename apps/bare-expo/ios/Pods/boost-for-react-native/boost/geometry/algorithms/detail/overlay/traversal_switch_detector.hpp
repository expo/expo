// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2015-2016 Barend Gehrels, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_OVERLAY_TRAVERSAL_SWITCH_DETECTOR_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_OVERLAY_TRAVERSAL_SWITCH_DETECTOR_HPP

#include <cstddef>

#include <boost/range.hpp>

#include <boost/geometry/algorithms/detail/ring_identifier.hpp>
#include <boost/geometry/algorithms/detail/overlay/copy_segments.hpp>
#include <boost/geometry/algorithms/detail/overlay/cluster_info.hpp>
#include <boost/geometry/algorithms/detail/overlay/turn_info.hpp>
#include <boost/geometry/core/access.hpp>
#include <boost/geometry/core/assert.hpp>

namespace boost { namespace geometry
{

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace overlay
{

// Generic function (is this used somewhere else too?)
inline ring_identifier ring_id_by_seg_id(segment_identifier const& seg_id)
{
    return ring_identifier(seg_id.source_index, seg_id.multi_index, seg_id.ring_index);
}

template
<
    bool Reverse1,
    bool Reverse2,
    overlay_type OverlayType,
    typename Geometry1,
    typename Geometry2,
    typename Turns,
    typename Clusters,
    typename RobustPolicy,
    typename Visitor
>
struct traversal_switch_detector
{
    typedef typename boost::range_value<Turns>::type turn_type;
    typedef typename turn_type::turn_operation_type turn_operation_type;

    // For convenience
    typedef std::set<signed_size_type>::const_iterator set_iterator;

    inline traversal_switch_detector(Geometry1 const& geometry1, Geometry2 const& geometry2,
            Turns& turns, Clusters& clusters,
            RobustPolicy const& robust_policy, Visitor& visitor)
        : m_geometry1(geometry1)
        , m_geometry2(geometry2)
        , m_turns(turns)
        , m_clusters(clusters)
        , m_robust_policy(robust_policy)
        , m_visitor(visitor)
        , m_region_id(0)
    {

    }

    static inline bool connects_same_zone(turn_type const& turn)
    {
        if (turn.cluster_id == -1)
        {
            // If it is a uu/ii-turn (non clustered), it is never same zone
            return ! (turn.both(operation_union) || turn.both(operation_intersection));
        }

        // It is a cluster, check zones of both operations
        return turn.operations[0].enriched.zone
                == turn.operations[1].enriched.zone;
    }

    inline int get_region_id(turn_operation_type const& op) const
    {
        std::map<ring_identifier, int>::const_iterator it
                    = m_regions.find(ring_id_by_seg_id(op.seg_id));
        return it == m_regions.end() ? -1 : it->second;
    }

    void create_region(ring_identifier const& ring_id, std::set<signed_size_type> const& ring_turn_indices, int region_id = -1)
    {
        std::map<ring_identifier, int>::const_iterator it = m_regions.find(ring_id);
        if (it != m_regions.end())
        {
            // The ring is already gathered in a region, quit
            return;
        }
        if (region_id == -1)
        {
            region_id = m_region_id++;
        }

        // Assign this ring to specified region
        m_regions[ring_id] = region_id;
#if defined(BOOST_GEOMETRY_DEBUG_TRAVERSAL_SWITCH_DETECTOR)
        std::cout << " ADD " << ring_id << "  TO REGION " << region_id << std::endl;
#endif

        // Find connecting rings, recursively
        for (set_iterator sit = ring_turn_indices.begin();
             sit != ring_turn_indices.end(); ++sit)
        {
            signed_size_type const turn_index = *sit;
            turn_type const& turn = m_turns[turn_index];
            if (! connects_same_zone(turn))
            {
                // This is a non clustered uu/ii-turn, or a cluster connecting different 'zones'
                continue;
            }

            // This turn connects two rings (interior connected), create the
            // same region
            for (int op_index = 0; op_index < 2; op_index++)
            {
                turn_operation_type const& op = turn.operations[op_index];
                ring_identifier connected_ring_id = ring_id_by_seg_id(op.seg_id);
                if (connected_ring_id != ring_id)
                {
                    propagate_region(connected_ring_id, region_id);
                }
            }
        }
    }

    void check_turns_per_ring(ring_identifier const& ring_id,
            std::set<signed_size_type> const& ring_turn_indices)
    {
        bool only_turn_on_ring = true;
        if (ring_turn_indices.size() > 1)
        {
            // More turns on this ring. Only leave only_turn_on_ring true
            // if they are all of the same cluster
            int cluster_id = -1;
            for (set_iterator sit = ring_turn_indices.begin();
                 sit != ring_turn_indices.end(); ++sit)
            {
                turn_type const& turn = m_turns[*sit];
                if (turn.cluster_id == -1)
                {
                    // Unclustered turn - and there are 2 or more turns
                    // so the ring has different turns
                    only_turn_on_ring = false;
                    break;
                }

                // Clustered turn, check if it is the first or same as previous
                if (cluster_id == -1)
                {
                    cluster_id = turn.cluster_id;
                }
                else if (turn.cluster_id != cluster_id)
                {
                    only_turn_on_ring = false;
                    break;
                }
            }
        }

        // Assign result to matching operation (a turn is always on two rings)
        for (set_iterator sit = ring_turn_indices.begin();
             sit != ring_turn_indices.end(); ++sit)
        {
            turn_type& turn = m_turns[*sit];
            for (int i = 0; i < 2; i++)
            {
                turn_operation_type& op = turn.operations[i];
                if (ring_id_by_seg_id(op.seg_id) == ring_id)
                {
                    op.enriched.only_turn_on_ring = only_turn_on_ring;
                }
            }
        }
    }

    void propagate_region(ring_identifier const& ring_id, int region_id)
    {
        std::map<ring_identifier, std::set<signed_size_type> >::const_iterator it = m_turns_per_ring.find(ring_id);
        if (it != m_turns_per_ring.end())
        {
            create_region(ring_id, it->second, region_id);
        }
    }

    void iterate()
    {
#if defined(BOOST_GEOMETRY_DEBUG_TRAVERSAL_SWITCH_DETECTOR)
        std::cout << "SWITCH BEGIN ITERATION" << std::endl;
#endif

        // Collect turns per ring
        m_turns_per_ring.clear();
        m_regions.clear();
        m_region_id = 1;

        for (std::size_t turn_index = 0; turn_index < m_turns.size(); ++turn_index)
        {
            turn_type const& turn = m_turns[turn_index];

            for (int op_index = 0; op_index < 2; op_index++)
            {
                turn_operation_type const& op = turn.operations[op_index];
                m_turns_per_ring[ring_id_by_seg_id(op.seg_id)].insert(turn_index);
            }
        }

        // All rings having turns are in the map. Now iterate them
        for (std::map<ring_identifier, std::set<signed_size_type> >::const_iterator it
             = m_turns_per_ring.begin(); it != m_turns_per_ring.end(); ++it)
        {
            create_region(it->first, it->second);
            check_turns_per_ring(it->first, it->second);
        }

        // Now that all regions are filled, assign switch_source property
        // Iterate through all clusters
        for (typename Clusters::iterator it = m_clusters.begin(); it != m_clusters.end(); ++it)
        {
            cluster_info& cinfo = it->second;
            if (cinfo.open_count <= 1)
            {
                // Not a touching cluster
                continue;
            }

            // A touching cluster, gather regions
            std::set<int> regions;

            std::set<signed_size_type> const& ids = cinfo.turn_indices;

#if defined(BOOST_GEOMETRY_DEBUG_TRAVERSAL_SWITCH_DETECTOR)
                std::cout << "SWITCH EXAMINE CLUSTER " << it->first << std::endl;
#endif

            for (set_iterator sit = ids.begin(); sit != ids.end(); ++sit)
            {
                signed_size_type turn_index = *sit;
                turn_type const& turn = m_turns[turn_index];
                for (int oi = 0; oi < 2; oi++)
                {
                    int const region = get_region_id(turn.operations[oi]);
                    regions.insert(region);
                }
            }
            // Switch source if this cluster connects the same region
            cinfo.switch_source = regions.size() == 1;
        }

        // Iterate through all uu/ii turns (non-clustered)
        for (std::size_t turn_index = 0; turn_index < m_turns.size(); ++turn_index)
        {
            turn_type& turn = m_turns[turn_index];

            if (turn.discarded
                    || turn.blocked()
                    || turn.cluster_id >= 0
                    || ! (turn.both(operation_union) || turn.both(operation_intersection)))
            {
                // Skip discarded, blocked, non-uu/ii and clustered turns
                continue;
            }

            if (OverlayType == overlay_buffer)
            {
                // For deflate, the region approach does not work because many
                // pieces are outside the real polygons
                // TODO: implement this in another way for buffer
                // (because now buffer might output invalid geometries)
                continue;
            }

            int const region0 = get_region_id(turn.operations[0]);
            int const region1 = get_region_id(turn.operations[1]);

            // Switch sources for same region
            turn.switch_source = region0 == region1;
        }


#if defined(BOOST_GEOMETRY_DEBUG_TRAVERSAL_SWITCH_DETECTOR)
        std::cout << "SWITCH END ITERATION" << std::endl;

        for (std::size_t turn_index = 0; turn_index < m_turns.size(); ++turn_index)
        {
            turn_type const& turn = m_turns[turn_index];

            if ((turn.both(operation_union) || turn.both(operation_intersection))
                 && turn.cluster_id < 0)
            {
                std::cout << "UU/II SWITCH RESULT "
                             << turn_index << " -> "
                          << turn.switch_source << std::endl;
            }
        }

        for (typename Clusters::const_iterator it = m_clusters.begin(); it != m_clusters.end(); ++it)
        {
            cluster_info const& cinfo = it->second;
            if (cinfo.open_count > 1)
            {
                std::cout << "CL SWITCH RESULT " << it->first
                             << " -> " << cinfo.switch_source << std::endl;
            }
            else
            {
                std::cout << "CL SWITCH RESULT " << it->first
                          << " is not registered as open" << std::endl;
            }
        }
#endif

    }

private:

    Geometry1 const& m_geometry1;
    Geometry2 const& m_geometry2;
    Turns& m_turns;
    Clusters& m_clusters;
    RobustPolicy const& m_robust_policy;
    Visitor& m_visitor;

    std::map<ring_identifier, int> m_regions;
    std::map<ring_identifier, std::set<signed_size_type> > m_turns_per_ring;
    int m_region_id;

};

}} // namespace detail::overlay
#endif // DOXYGEN_NO_DETAIL

}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_OVERLAY_TRAVERSAL_SWITCH_DETECTOR_HPP
