// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2015 Barend Gehrels, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_OVERLAY_HANDLE_COLOCATIONS_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_OVERLAY_HANDLE_COLOCATIONS_HPP

#include <cstddef>
#include <algorithm>
#include <map>
#include <vector>

#include <boost/core/ignore_unused.hpp>
#include <boost/range.hpp>
#include <boost/geometry/core/point_order.hpp>
#include <boost/geometry/algorithms/detail/overlay/cluster_info.hpp>
#include <boost/geometry/algorithms/detail/overlay/do_reverse.hpp>
#include <boost/geometry/algorithms/detail/overlay/overlay_type.hpp>
#include <boost/geometry/algorithms/detail/overlay/sort_by_side.hpp>
#include <boost/geometry/algorithms/detail/overlay/turn_info.hpp>
#include <boost/geometry/algorithms/detail/ring_identifier.hpp>
#include <boost/geometry/algorithms/detail/overlay/segment_identifier.hpp>

#if defined(BOOST_GEOMETRY_DEBUG_HANDLE_COLOCATIONS)
#  include <iostream>
#  include <boost/geometry/algorithms/detail/overlay/debug_turn_info.hpp>
#  include <boost/geometry/io/wkt/wkt.hpp>
#  define BOOST_GEOMETRY_DEBUG_IDENTIFIER
#endif

namespace boost { namespace geometry
{

#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace overlay
{

template <typename SegmentRatio>
struct segment_fraction
{
    segment_identifier seg_id;
    SegmentRatio fraction;

    segment_fraction(segment_identifier const& id, SegmentRatio const& fr)
        : seg_id(id)
        , fraction(fr)
    {}

    segment_fraction()
    {}

    bool operator<(segment_fraction<SegmentRatio> const& other) const
    {
        return seg_id == other.seg_id
                ? fraction < other.fraction
                : seg_id < other.seg_id;
    }

};

struct turn_operation_index
{
    turn_operation_index(signed_size_type ti = -1,
                         signed_size_type oi = -1)
        : turn_index(ti)
        , op_index(oi)
    {}

    signed_size_type turn_index;
    signed_size_type op_index; // only 0,1
};


template <typename Turns>
struct less_by_fraction_and_type
{
    inline less_by_fraction_and_type(Turns const& turns)
        : m_turns(turns)
    {
    }

    inline bool operator()(turn_operation_index const& left,
                           turn_operation_index const& right) const
    {
        typedef typename boost::range_value<Turns>::type turn_type;
        typedef typename turn_type::turn_operation_type turn_operation_type;

        turn_type const& left_turn = m_turns[left.turn_index];
        turn_type const& right_turn = m_turns[right.turn_index];
        turn_operation_type const& left_op
                = left_turn.operations[left.op_index];

        turn_operation_type const& right_op
                = right_turn.operations[right.op_index];

        if (! (left_op.fraction == right_op.fraction))
        {
            return left_op.fraction < right_op.fraction;
        }

        // Order xx first - used to discard any following colocated turn
        bool const left_both_xx = left_turn.both(operation_blocked);
        bool const right_both_xx = right_turn.both(operation_blocked);
        if (left_both_xx && ! right_both_xx)
        {
            return true;
        }
        if (! left_both_xx && right_both_xx)
        {
            return false;
        }

        bool const left_both_uu = left_turn.both(operation_union);
        bool const right_both_uu = right_turn.both(operation_union);
        if (left_both_uu && ! right_both_uu)
        {
            return true;
        }
        if (! left_both_uu && right_both_uu)
        {
            return false;
        }

        turn_operation_type const& left_other_op
                = left_turn.operations[1 - left.op_index];

        turn_operation_type const& right_other_op
                = right_turn.operations[1 - right.op_index];

        // Fraction is the same, now sort on ring id, first outer ring,
        // then interior rings
        return left_other_op.seg_id < right_other_op.seg_id;
    }

private:
    Turns const& m_turns;
};

template <typename Operation, typename ClusterPerSegment>
inline signed_size_type get_cluster_id(Operation const& op, ClusterPerSegment const& cluster_per_segment)
{
    typedef typename ClusterPerSegment::key_type segment_fraction_type;

    segment_fraction_type seg_frac(op.seg_id, op.fraction);
    typename ClusterPerSegment::const_iterator it
            = cluster_per_segment.find(seg_frac);

    if (it == cluster_per_segment.end())
    {
        return -1;
    }
    return it->second;
}

template <typename Operation, typename ClusterPerSegment>
inline void add_cluster_id(Operation const& op,
    ClusterPerSegment& cluster_per_segment, signed_size_type id)
{
    typedef typename ClusterPerSegment::key_type segment_fraction_type;

    segment_fraction_type seg_frac(op.seg_id, op.fraction);

    cluster_per_segment[seg_frac] = id;
}

template <typename Turn, typename ClusterPerSegment>
inline signed_size_type add_turn_to_cluster(Turn const& turn,
        ClusterPerSegment& cluster_per_segment, signed_size_type& cluster_id)
{
    signed_size_type cid0 = get_cluster_id(turn.operations[0], cluster_per_segment);
    signed_size_type cid1 = get_cluster_id(turn.operations[1], cluster_per_segment);

    if (cid0 == -1 && cid1 == -1)
    {
        ++cluster_id;
        add_cluster_id(turn.operations[0], cluster_per_segment, cluster_id);
        add_cluster_id(turn.operations[1], cluster_per_segment, cluster_id);
        return cluster_id;
    }
    else if (cid0 == -1 && cid1 != -1)
    {
        add_cluster_id(turn.operations[0], cluster_per_segment, cid1);
        return cid1;
    }
    else if (cid0 != -1 && cid1 == -1)
    {
        add_cluster_id(turn.operations[1], cluster_per_segment, cid0);
        return cid0;
    }
    else if (cid0 == cid1)
    {
        // Both already added to same cluster, no action
        return cid0;
    }

    // Both operations.seg_id/fraction were already part of any cluster, and
    // these clusters are not the same. Merge of two clusters is necessary
#if defined(BOOST_GEOMETRY_DEBUG_HANDLE_COLOCATIONS)
    std::cout << " TODO: merge " << cid0 << " and " << cid1 << std::endl;
#endif
    return cid0;
}

template
<
    typename Turns,
    typename ClusterPerSegment,
    typename Operations,
    typename Geometry1,
    typename Geometry2
>
inline void handle_colocation_cluster(Turns& turns,
        signed_size_type& cluster_id,
        ClusterPerSegment& cluster_per_segment,
        Operations const& operations,
        Geometry1 const& /*geometry1*/, Geometry2 const& /*geometry2*/)
{
    typedef typename boost::range_value<Turns>::type turn_type;
    typedef typename turn_type::turn_operation_type turn_operation_type;

    std::vector<turn_operation_index>::const_iterator vit = operations.begin();

    turn_operation_index ref_toi = *vit;
    signed_size_type ref_id = -1;

    for (++vit; vit != operations.end(); ++vit)
    {
        turn_type& ref_turn = turns[ref_toi.turn_index];
        turn_operation_type const& ref_op
                = ref_turn.operations[ref_toi.op_index];

        turn_operation_index const& toi = *vit;
        turn_type& turn = turns[toi.turn_index];
        turn_operation_type const& op = turn.operations[toi.op_index];

        BOOST_ASSERT(ref_op.seg_id == op.seg_id);

        if (ref_op.fraction == op.fraction)
        {
            turn_operation_type const& other_op = turn.operations[1 - toi.op_index];

            if (ref_id == -1)
            {
                ref_id = add_turn_to_cluster(ref_turn, cluster_per_segment, cluster_id);
            }
            BOOST_ASSERT(ref_id != -1);

            // ref_turn (both operations) are already added to cluster,
            // so also "op" is already added to cluster,
            // We only need to add other_op
            signed_size_type id = get_cluster_id(other_op, cluster_per_segment);
            if (id != -1 && id != ref_id)
            {
            }
            else if (id == -1)
            {
                // Add to same cluster
                add_cluster_id(other_op, cluster_per_segment, ref_id);
                id = ref_id;
            }

            // In case of colocated xx turns, all other turns may NOT be
            // followed at all. xx cannot be discarded (otherwise colocated
            // turns are followed).
            if (ref_turn.both(operation_blocked))
            {
                turn.discarded = true;
                // We can either set or not set colocated because it is not effective on blocked turns
            }
        }
        else
        {
            // Not on same fraction on this segment
            // assign for next
            ref_toi = toi;
            ref_id = -1;
        }
    }
}

template
<
    typename Turns,
    typename Clusters,
    typename ClusterPerSegment
>
inline void assign_cluster_to_turns(Turns& turns,
        Clusters& clusters,
        ClusterPerSegment const& cluster_per_segment)
{
    typedef typename boost::range_value<Turns>::type turn_type;
    typedef typename turn_type::turn_operation_type turn_operation_type;
    typedef typename ClusterPerSegment::key_type segment_fraction_type;

    signed_size_type turn_index = 0;
    for (typename boost::range_iterator<Turns>::type it = turns.begin();
         it != turns.end(); ++it, ++turn_index)
    {
        turn_type& turn = *it;

        if (turn.discarded)
        {
            // They were processed (to create proper map) but will not be added
            // This might leave a cluster with only 1 turn, which will be fixed
            // afterwards
            continue;
        }

        for (int i = 0; i < 2; i++)
        {
            turn_operation_type const& op = turn.operations[i];
            segment_fraction_type seg_frac(op.seg_id, op.fraction);
            typename ClusterPerSegment::const_iterator it = cluster_per_segment.find(seg_frac);
            if (it != cluster_per_segment.end())
            {
#if defined(BOOST_GEOMETRY_DEBUG_HANDLE_COLOCATIONS)
                if (turn.cluster_id != -1
                        && turn.cluster_id != it->second)
                {
                    std::cout << " CONFLICT " << std::endl;
                }
#endif
                turn.cluster_id = it->second;
                clusters[turn.cluster_id].turn_indices.insert(turn_index);
            }
        }
    }
}

template
<
    typename Turns,
    typename Clusters
>
inline void remove_clusters(Turns& turns, Clusters& clusters)
{
    typename Clusters::iterator it = clusters.begin();
    while (it != clusters.end())
    {
        // Hold iterator and increase. We can erase cit, this keeps the
        // iterator valid (cf The standard associative-container erase idiom)
        typename Clusters::iterator current_it = it;
        ++it;

        std::set<signed_size_type> const& turn_indices
                = current_it->second.turn_indices;
        if (turn_indices.size() == 1)
        {
            signed_size_type turn_index = *turn_indices.begin();
            turns[turn_index].cluster_id = -1;
            clusters.erase(current_it);
        }
    }
}

template <typename Turn, typename IdSet>
inline void discard_ie_turn(Turn& turn, IdSet& ids, signed_size_type id)
{
    turn.discarded = true;
    turn.cluster_id = -1;
    // To remove it later from clusters
    ids.insert(id);
}

template <bool Reverse>
inline bool is_interior(segment_identifier const& seg_id)
{
    return Reverse ? seg_id.ring_index == -1 : seg_id.ring_index >= 0;
}

template <bool Reverse0, bool Reverse1>
inline bool is_ie_turn(segment_identifier const& ext_seg_0,
                       segment_identifier const& ext_seg_1,
                       segment_identifier const& int_seg_0,
                       segment_identifier const& other_seg_1)
{
    // Compares two segment identifiers from two turns (external / one internal)

    // From first turn [0], both are from same polygon (multi_index),
    // one is exterior (-1), the other is interior (>= 0),
    // and the second turn [1] handles the same ring

    // For difference, where the rings are processed in reversal, all interior
    // rings become exterior and vice versa. But also the multi property changes:
    // rings originally from the same multi should now be considered as from
    // different multi polygons.
    // But this is not always the case, and at this point hard to figure out
    // (not yet implemented, TODO)

    bool const same_multi0 = ! Reverse0
                             && ext_seg_0.multi_index == int_seg_0.multi_index;

    bool const same_multi1 = ! Reverse1
                             && ext_seg_1.multi_index == other_seg_1.multi_index;

    boost::ignore_unused(same_multi1);

    return same_multi0
            && same_multi1
            && ! is_interior<Reverse0>(ext_seg_0)
            && is_interior<Reverse0>(int_seg_0)
            && ext_seg_1.ring_index == other_seg_1.ring_index;

    // The other way round is tested in another call
}

template
<
    bool Reverse0, bool Reverse1, // Reverse interpretation interior/exterior
    typename Turns,
    typename Clusters
>
inline void discard_interior_exterior_turns(Turns& turns, Clusters& clusters)
{
    typedef std::set<signed_size_type>::const_iterator set_iterator;
    typedef typename boost::range_value<Turns>::type turn_type;

    std::set<signed_size_type> ids_to_remove;

    for (typename Clusters::iterator cit = clusters.begin();
         cit != clusters.end(); ++cit)
    {
        cluster_info& cinfo = cit->second;
        std::set<signed_size_type>& ids = cinfo.turn_indices;

        ids_to_remove.clear();

        for (set_iterator it = ids.begin(); it != ids.end(); ++it)
        {
            turn_type& turn = turns[*it];
            segment_identifier const& seg_0 = turn.operations[0].seg_id;
            segment_identifier const& seg_1 = turn.operations[1].seg_id;

            if (turn.both(operation_intersection)
                    && Reverse0 == Reverse1)
            {
                if (   is_interior<Reverse0>(seg_0)
                    && is_interior<Reverse1>(seg_1))
                {
                    // ii touch with, two interior rings
                    discard_ie_turn(turn, ids_to_remove, *it);
                }

                continue;
            }

            if (! (turn.both(operation_union)
                   || turn.combination(operation_union, operation_blocked)))
            {
                // Not a uu/ux, so cannot be colocated with a iu turn
                continue;
            }

            for (set_iterator int_it = ids.begin(); int_it != ids.end(); ++int_it)
            {
                if (*it == *int_it)
                {
                    continue;
                }

                // Turn with, possibly, an interior ring involved
                turn_type& int_turn = turns[*int_it];
                segment_identifier const& int_seg_0 = int_turn.operations[0].seg_id;
                segment_identifier const& int_seg_1 = int_turn.operations[1].seg_id;

                if (is_ie_turn<Reverse0, Reverse1>(seg_0, seg_1, int_seg_0, int_seg_1))
                {
                    discard_ie_turn(int_turn, ids_to_remove, *int_it);
                }
                if (is_ie_turn<Reverse1, Reverse0>(seg_1, seg_0, int_seg_1, int_seg_0))
                {
                    discard_ie_turn(int_turn, ids_to_remove, *int_it);
                }
            }
        }

        // Erase from the ids (which cannot be done above)
        for (set_iterator sit = ids_to_remove.begin();
             sit != ids_to_remove.end(); ++sit)
        {
            ids.erase(*sit);
        }
    }
}


// Checks colocated turns and flags combinations of uu/other, possibly a
// combination of a ring touching another geometry's interior ring which is
// tangential to the exterior ring

// This function can be extended to replace handle_tangencies: at each
// colocation incoming and outgoing vectors should be inspected

template
<
    bool Reverse1, bool Reverse2,
    typename Turns,
    typename Clusters,
    typename Geometry1,
    typename Geometry2
>
inline bool handle_colocations(Turns& turns, Clusters& clusters,
        Geometry1 const& geometry1, Geometry2 const& geometry2)
{
    typedef std::map
        <
            segment_identifier,
            std::vector<turn_operation_index>
        > map_type;

    // Create and fill map on segment-identifier Map is sorted on seg_id,
    // meaning it is sorted on ring_identifier too. This means that exterior
    // rings are handled first. If there is a colocation on the exterior ring,
    // that information can be used for the interior ring too
    map_type map;

    int index = 0;
    for (typename boost::range_iterator<Turns>::type
            it = boost::begin(turns);
         it != boost::end(turns);
         ++it, ++index)
    {
        map[it->operations[0].seg_id].push_back(turn_operation_index(index, 0));
        map[it->operations[1].seg_id].push_back(turn_operation_index(index, 1));
    }

    // Check if there are multiple turns on one or more segments,
    // if not then nothing is to be done
    bool colocations = 0;
    for (typename map_type::const_iterator it = map.begin();
         it != map.end();
         ++it)
    {
        if (it->second.size() > 1u)
        {
            colocations = true;
            break;
        }
    }

    if (! colocations)
    {
        return false;
    }

    // Sort all vectors, per same segment
    less_by_fraction_and_type<Turns> less(turns);
    for (typename map_type::iterator it = map.begin();
         it != map.end(); ++it)
    {
        std::sort(it->second.begin(), it->second.end(), less);
    }

    typedef typename boost::range_value<Turns>::type turn_type;
    typedef typename turn_type::segment_ratio_type segment_ratio_type;

    typedef std::map
        <
            segment_fraction<segment_ratio_type>,
            signed_size_type
        > cluster_per_segment_type;

    cluster_per_segment_type cluster_per_segment;
    signed_size_type cluster_id = 0;

    for (typename map_type::const_iterator it = map.begin();
         it != map.end(); ++it)
    {
        if (it->second.size() > 1u)
        {
            handle_colocation_cluster(turns, cluster_id, cluster_per_segment,
                it->second, geometry1, geometry2);
        }
    }

    assign_cluster_to_turns(turns, clusters, cluster_per_segment);
    discard_interior_exterior_turns
        <
            do_reverse<geometry::point_order<Geometry1>::value>::value != Reverse1,
            do_reverse<geometry::point_order<Geometry2>::value>::value != Reverse2
        >(turns, clusters);
    remove_clusters(turns, clusters);

#if defined(BOOST_GEOMETRY_DEBUG_HANDLE_COLOCATIONS)
    std::cout << "*** Colocations " << map.size() << std::endl;
    for (typename map_type::const_iterator it = map.begin();
         it != map.end(); ++it)
    {
        std::cout << it->first << std::endl;
        for (std::vector<turn_operation_index>::const_iterator vit
             = it->second.begin(); vit != it->second.end(); ++vit)
        {
            turn_operation_index const& toi = *vit;
            std::cout << geometry::wkt(turns[toi.turn_index].point)
                << std::boolalpha
                << " discarded=" << turns[toi.turn_index].discarded
                << " colocated=" << turns[toi.turn_index].colocated
                << " " << operation_char(turns[toi.turn_index].operations[0].operation)
                << " "  << turns[toi.turn_index].operations[0].seg_id
                << " "  << turns[toi.turn_index].operations[0].fraction
                << " // " << operation_char(turns[toi.turn_index].operations[1].operation)
                << " "  << turns[toi.turn_index].operations[1].seg_id
                << " "  << turns[toi.turn_index].operations[1].fraction
                << std::endl;
        }
    }
#endif // DEBUG

    return true;
}


struct is_turn_index
{
    is_turn_index(signed_size_type index)
        : m_index(index)
    {}

    template <typename Indexed>
    inline bool operator()(Indexed const& indexed) const
    {
        // Indexed is a indexed_turn_operation<Operation>
        return indexed.turn_index == m_index;
    }

    std::size_t m_index;
};


template
<
    bool Reverse1, bool Reverse2,
    typename Turns,
    typename Clusters,
    typename Geometry1,
    typename Geometry2
>
inline void gather_cluster_properties(Clusters& clusters, Turns& turns,
        operation_type for_operation,
        Geometry1 const& geometry1, Geometry2 const& geometry2)
{
    typedef typename boost::range_value<Turns>::type turn_type;
    typedef typename turn_type::point_type point_type;
    typedef typename turn_type::turn_operation_type turn_operation_type;

    // Define sorter, sorting counter-clockwise such that polygons are on the
    // right side
    typedef sort_by_side::side_sorter
        <
            Reverse1, Reverse2, point_type, std::less<int>
        > sbs_type;

    for (typename Clusters::iterator mit = clusters.begin();
         mit != clusters.end(); ++mit)
    {
        cluster_info& cinfo = mit->second;
        std::set<signed_size_type> const& ids = cinfo.turn_indices;
        if (ids.empty())
        {
            continue;
        }

        sbs_type sbs;
        point_type turn_point; // should be all the same for all turns in cluster

        bool first = true;
        for (typename std::set<signed_size_type>::const_iterator sit = ids.begin();
             sit != ids.end(); ++sit)
        {
            signed_size_type turn_index = *sit;
            turn_type const& turn = turns[turn_index];
            if (first)
            {
                turn_point = turn.point;
            }
            for (int i = 0; i < 2; i++)
            {
                turn_operation_type const& op = turn.operations[i];
                sbs.add(op, turn_index, i, geometry1, geometry2, first);
                first = false;
            }
        }
        sbs.apply(turn_point);

        sbs.find_open();
        sbs.assign_zones(for_operation);

        // Unset the startable flag for all 'closed' zones
        for (std::size_t i = 0; i < sbs.m_ranked_points.size(); i++)
        {
            const typename sbs_type::rp& ranked = sbs.m_ranked_points[i];
            turn_type& turn = turns[ranked.turn_index];
            turn_operation_type& op = turn.operations[ranked.operation_index];

            if (ranked.direction != sort_by_side::dir_to)
            {
                continue;
            }

            op.enriched.count_left = ranked.count_left;
            op.enriched.count_right = ranked.count_right;
            op.enriched.zone = ranked.zone;

            if ((for_operation == operation_union
                    && ranked.count_left != 0)
             || (for_operation == operation_intersection
                    && ranked.count_right != 2))
            {
                op.enriched.startable = false;
            }
        }

        cinfo.open_count = sbs.open_count(for_operation);
    }
}


}} // namespace detail::overlay
#endif //DOXYGEN_NO_DETAIL


}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_OVERLAY_HANDLE_COLOCATIONS_HPP
