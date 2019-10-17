// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2012-2014 Barend Gehrels, Amsterdam, the Netherlands.

// This file was modified by Oracle on 2016.
// Modifications copyright (c) 2016 Oracle and/or its affiliates.
// Contributed and/or modified by Adam Wulkiewicz, on behalf of Oracle

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_BUFFER_BUFFERED_PIECE_COLLECTION_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_BUFFER_BUFFERED_PIECE_COLLECTION_HPP

#include <algorithm>
#include <cstddef>
#include <set>

#include <boost/core/ignore_unused.hpp>
#include <boost/range.hpp>

#include <boost/geometry/core/assert.hpp>
#include <boost/geometry/core/coordinate_type.hpp>
#include <boost/geometry/core/point_type.hpp>

#include <boost/geometry/algorithms/comparable_distance.hpp>
#include <boost/geometry/algorithms/covered_by.hpp>
#include <boost/geometry/algorithms/envelope.hpp>
#include <boost/geometry/algorithms/is_convex.hpp>

#include <boost/geometry/strategies/buffer.hpp>

#include <boost/geometry/geometries/ring.hpp>

#include <boost/geometry/algorithms/detail/buffer/buffered_ring.hpp>
#include <boost/geometry/algorithms/detail/buffer/buffer_policies.hpp>
#include <boost/geometry/algorithms/detail/overlay/cluster_info.hpp>
#include <boost/geometry/algorithms/detail/buffer/get_piece_turns.hpp>
#include <boost/geometry/algorithms/detail/buffer/turn_in_piece_visitor.hpp>
#include <boost/geometry/algorithms/detail/buffer/turn_in_original_visitor.hpp>

#include <boost/geometry/algorithms/detail/disjoint/point_box.hpp>
#include <boost/geometry/algorithms/detail/overlay/add_rings.hpp>
#include <boost/geometry/algorithms/detail/overlay/assign_parents.hpp>
#include <boost/geometry/algorithms/detail/overlay/enrichment_info.hpp>
#include <boost/geometry/algorithms/detail/overlay/enrich_intersection_points.hpp>
#include <boost/geometry/algorithms/detail/overlay/ring_properties.hpp>
#include <boost/geometry/algorithms/detail/overlay/traversal_info.hpp>
#include <boost/geometry/algorithms/detail/overlay/traverse.hpp>
#include <boost/geometry/algorithms/detail/overlay/turn_info.hpp>
#include <boost/geometry/algorithms/detail/occupation_info.hpp>
#include <boost/geometry/algorithms/detail/partition.hpp>
#include <boost/geometry/algorithms/detail/sections/sectionalize.hpp>
#include <boost/geometry/algorithms/detail/sections/section_box_policies.hpp>

#include <boost/geometry/util/range.hpp>


namespace boost { namespace geometry
{


#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace buffer
{

enum segment_relation_code
{
    segment_relation_on_left,
    segment_relation_on_right,
    segment_relation_within,
    segment_relation_disjoint
};

/*
 *  Terminology
 *
 *  Suppose we make a buffer (using blocked corners) of this rectangle:
 *
 *         +-------+
 *         |       |
 *         |  rect |
 *         |       |
 *         +-------+
 *
 * For the sides we get these four buffered side-pieces (marked with s)
 * and four buffered corner pieces (marked with c)
 *
 *     c---+---s---+---c
 *     |   | piece |   |     <- see below for details of the middle top-side-piece
 *     +---+-------+---+
 *     |   |       |   |
 *     s   |  rect |   s     <- two side pieces left/right of rect
 *     |   |       |   |
 *     +---+-------+---+
 *     |   | piece |   |     <- one side-piece below, and two corner pieces
 *     c---+---s---+---c
 *
 *  The outer part of the picture above, using all pieces,
 *    form together the offsetted ring (marked with o below)
 *  The 8 pieces are part of the piece collection and use for inside-checks
 *  The inner parts form (using 1 or 2 points per piece, often co-located)
 *    form together the robust_polygons (marked with r below)
 *  The remaining piece-segments are helper-segments (marked with h)
 *
 *     ooooooooooooooooo
 *     o   h       h   o
 *     ohhhrrrrrrrrrhhho
 *     o   r       r   o
 *     o   r       r   o
 *     o   r       r   o
 *     ohhhrrrrrrrrrhhho
 *     o   h       h   o
 *     ooooooooooooooooo
 *
 */


template <typename Ring, typename RobustPolicy>
struct buffered_piece_collection
{
    typedef buffered_piece_collection<Ring, RobustPolicy> this_type;

    typedef typename geometry::point_type<Ring>::type point_type;
    typedef typename geometry::coordinate_type<Ring>::type coordinate_type;
    typedef typename geometry::robust_point_type
    <
        point_type,
        RobustPolicy
    >::type robust_point_type;

    // Robust ring/polygon type, always clockwise
    typedef geometry::model::ring<robust_point_type> robust_ring_type;
    typedef geometry::model::box<robust_point_type> robust_box_type;

    typedef typename default_comparable_distance_result
        <
            robust_point_type
        >::type robust_comparable_radius_type;

    typedef typename strategy::side::services::default_strategy
        <
            typename cs_tag<point_type>::type
        >::type side_strategy;

    typedef typename geometry::rescale_policy_type
        <
            typename geometry::point_type<Ring>::type
        >::type rescale_policy_type;

    typedef typename geometry::segment_ratio_type
    <
        point_type,
        RobustPolicy
    >::type segment_ratio_type;

    typedef buffer_turn_info
    <
        point_type,
        robust_point_type,
        segment_ratio_type
    > buffer_turn_info_type;

    typedef buffer_turn_operation
    <
        point_type,
        segment_ratio_type
    > buffer_turn_operation_type;

    typedef std::vector<buffer_turn_info_type> turn_vector_type;

    struct robust_turn
    {
        std::size_t turn_index;
        int operation_index;
        robust_point_type point;
        segment_identifier seg_id;
        segment_ratio_type fraction;
    };

    struct piece
    {
        typedef robust_ring_type piece_robust_ring_type;
        typedef geometry::section<robust_box_type, 1> section_type;

        strategy::buffer::piece_type type;
        signed_size_type index;

        signed_size_type left_index; // points to previous piece of same ring
        signed_size_type right_index; // points to next piece of same ring

        // The next two members (1, 2) form together a complete clockwise ring
        // for each piece (with one dupped point)
        // The complete clockwise ring is also included as a robust ring (3)

        // 1: half, part of offsetted_rings
        segment_identifier first_seg_id;
        signed_size_type last_segment_index; // no segment-identifier - it is the same as first_seg_id
        signed_size_type offsetted_count; // part in robust_ring which is part of offsetted ring

#if defined(BOOST_GEOMETRY_BUFFER_USE_HELPER_POINTS)
        // 2: half, not part of offsetted rings - part of robust ring
        std::vector<point_type> helper_points; // 4 points for side, 3 points for join - 0 points for flat-end
#endif

        bool is_convex;
        bool is_monotonic_increasing[2]; // 0=x, 1=y
        bool is_monotonic_decreasing[2]; // 0=x, 1=y

        // Monotonic sections of pieces around points
        std::vector<section_type> sections;

        // Robust representations
        // 3: complete ring
        robust_ring_type robust_ring;

        robust_box_type robust_envelope;
        robust_box_type robust_offsetted_envelope;

        std::vector<robust_turn> robust_turns; // Used only in insert_rescaled_piece_turns - we might use a map instead

        robust_point_type robust_center;
        robust_comparable_radius_type robust_min_comparable_radius;
        robust_comparable_radius_type robust_max_comparable_radius;

        piece()
            : type(strategy::buffer::piece_type_unknown)
            , index(-1)
            , left_index(-1)
            , right_index(-1)
            , last_segment_index(-1)
            , offsetted_count(-1)
            , is_convex(false)
            , robust_min_comparable_radius(0)
            , robust_max_comparable_radius(0)
        {
            is_monotonic_increasing[0] = false;
            is_monotonic_increasing[1] = false;
            is_monotonic_decreasing[0] = false;
            is_monotonic_decreasing[1] = false;
        }
    };

    struct robust_original
    {
        typedef robust_ring_type original_robust_ring_type;
        typedef geometry::sections<robust_box_type, 1> sections_type;

        inline robust_original()
            : m_is_interior(false)
            , m_has_interiors(true)
        {}

        inline robust_original(robust_ring_type const& ring,
                bool is_interior, bool has_interiors)
            : m_ring(ring)
            , m_is_interior(is_interior)
            , m_has_interiors(has_interiors)
        {
            geometry::envelope(m_ring, m_box);

            // create monotonic sections in x-dimension
            // The dimension is critical because the direction is later used
            // in the optimization for within checks using winding strategy
            // and this strategy is scanning in x direction.
            typedef boost::mpl::vector_c<std::size_t, 0> dimensions;
            geometry::sectionalize<false, dimensions>(m_ring,
                    detail::no_rescale_policy(), m_sections);
        }

        robust_ring_type m_ring;
        robust_box_type m_box;
        sections_type m_sections;

        bool m_is_interior;
        bool m_has_interiors;
    };

    typedef std::vector<piece> piece_vector_type;

    piece_vector_type m_pieces;
    turn_vector_type m_turns;
    signed_size_type m_first_piece_index;

    buffered_ring_collection<buffered_ring<Ring> > offsetted_rings; // indexed by multi_index
    std::vector<robust_original> robust_originals; // robust representation of the original(s)
    robust_ring_type current_robust_ring;
    buffered_ring_collection<Ring> traversed_rings;
    segment_identifier current_segment_id;

    // Specificly for offsetted rings around points
    // but also for large joins with many points
    typedef geometry::sections<robust_box_type, 2> sections_type;
    sections_type monotonic_sections;

    // Define the clusters, mapping cluster_id -> turns
    typedef std::map
        <
            signed_size_type,
            detail::overlay::cluster_info
        > cluster_type;

    cluster_type m_clusters;


    RobustPolicy const& m_robust_policy;

    struct redundant_turn
    {
        inline bool operator()(buffer_turn_info_type const& turn) const
        {
            return turn.remove_on_multi;
        }
    };

    buffered_piece_collection(RobustPolicy const& robust_policy)
        : m_first_piece_index(-1)
        , m_robust_policy(robust_policy)
    {}


#if defined(BOOST_GEOMETRY_BUFFER_ENLARGED_CLUSTERS)
    // Will (most probably) be removed later
    template <typename OccupationMap>
    inline void adapt_mapped_robust_point(OccupationMap const& map,
            buffer_turn_info_type& turn, int distance) const
    {
        for (int x = -distance; x <= distance; x++)
        {
            for (int y = -distance; y <= distance; y++)
            {
                robust_point_type rp = turn.robust_point;
                geometry::set<0>(rp, geometry::get<0>(rp) + x);
                geometry::set<1>(rp, geometry::get<1>(rp) + y);
                if (map.find(rp) != map.end())
                {
                    turn.mapped_robust_point = rp;
                    return;
                }
            }
        }
    }
#endif

    inline void get_occupation(
#if defined(BOOST_GEOMETRY_BUFFER_ENLARGED_CLUSTERS)
        int distance = 0
#endif
    )
    {
        typedef occupation_info<angle_info<robust_point_type, coordinate_type> >
                buffer_occupation_info;

        typedef std::map
        <
            robust_point_type,
            buffer_occupation_info,
            geometry::less<robust_point_type>
        > occupation_map_type;

        occupation_map_type occupation_map;

        // 1: Add all intersection points to occupation map
        typedef typename boost::range_iterator<turn_vector_type>::type
            iterator_type;

        for (iterator_type it = boost::begin(m_turns);
            it != boost::end(m_turns);
            ++it)
        {
            if (it->location == location_ok)
            {
#if defined(BOOST_GEOMETRY_BUFFER_ENLARGED_CLUSTERS)
                if (distance > 0 && ! occupation_map.empty())
                {
                    adapt_mapped_robust_point(occupation_map, *it, distance);
                }
#endif
                occupation_map[it->get_robust_point()].count++;
            }
        }

        // Remove all points with one or more u/u points from the map
        // (Alternatively, we could NOT do this here and change all u/u
        // behaviour in overlay. Currently nothing is done: each polygon is
        // just followed there. We could also always switch polygons there. For
        // buffer behaviour, where 3 pieces might meet of which 2 (or more) form
        // a u/u turn, this last option would have been better, probably).
        for (iterator_type it = boost::begin(m_turns);
            it != boost::end(m_turns);
            ++it)
        {
            if (it->both(detail::overlay::operation_union))
            {
                typename occupation_map_type::iterator mit =
                            occupation_map.find(it->get_robust_point());

                if (mit != occupation_map.end())
                {
                    occupation_map.erase(mit);
                }
            }
        }

        // 2: Remove all points from map which has only one
        typename occupation_map_type::iterator it = occupation_map.begin();
        while (it != occupation_map.end())
        {
            if (it->second.count <= 1)
            {
                typename occupation_map_type::iterator to_erase = it;
                ++it;
                occupation_map.erase(to_erase);
            }
            else
            {
                ++it;
            }
        }

        if (occupation_map.empty())
        {
            return;
        }

        // 3: Add vectors (incoming->intersection-point,
        //                 intersection-point -> outgoing)
        //    for all (co-located) points still present in the map

        for (iterator_type it = boost::begin(m_turns);
            it != boost::end(m_turns);
            ++it)
        {
            typename occupation_map_type::iterator mit =
                        occupation_map.find(it->get_robust_point());

            if (mit != occupation_map.end())
            {
                buffer_occupation_info& info = mit->second;
                for (int i = 0; i < 2; i++)
                {
                    add_incoming_and_outgoing_angles(it->get_robust_point(), *it,
                                m_pieces,
                                i, it->operations[i].seg_id,
                                info);
                }

                it->count_on_multi++;
            }
        }

#if defined(BOOST_GEOMETRY_BUFFER_ENLARGED_CLUSTERS)
        // X: Check rounding issues
        if (distance == 0)
        {
            for (typename occupation_map_type::const_iterator it = occupation_map.begin();
                it != occupation_map.end(); ++it)
            {
                if (it->second.has_rounding_issues(it->first))
                {
                    if(distance == 0)
                    {
                        get_occupation(distance + 1);
                        return;
                    }
                }
            }
        }
#endif

        // Get left turns from all clusters
        for (typename occupation_map_type::iterator it = occupation_map.begin();
            it != occupation_map.end(); ++it)
        {
            it->second.get_left_turns(it->first, m_turns);
        }
    }

    inline void classify_turns(bool linear)
    {
        for (typename boost::range_iterator<turn_vector_type>::type it =
            boost::begin(m_turns); it != boost::end(m_turns); ++it)
        {
            if (it->count_within > 0)
            {
                it->location = inside_buffer;
            }
            if (it->count_on_original_boundary > 0 && ! linear)
            {
                it->location = inside_buffer;
            }
#if ! defined(BOOST_GEOMETRY_BUFFER_USE_SIDE_OF_INTERSECTION)
            if (it->count_within_near_offsetted > 0)
            {
                // Within can have in rare cases a rounding issue. We don't discard this
                // point, so it can be used to continue started rings in traversal. But
                // will never start a new ring from this type of points.
                it->operations[0].enriched.startable = false;
                it->operations[1].enriched.startable = false;
            }
#endif
        }
    }

    template <typename DistanceStrategy>
    inline void check_remaining_points(DistanceStrategy const& distance_strategy)
    {
        // Check if a turn is inside any of the originals

        turn_in_original_visitor<turn_vector_type> visitor(m_turns);
        geometry::partition
            <
                robust_box_type,
                turn_get_box, turn_in_original_ovelaps_box,
                original_get_box, original_ovelaps_box,
                include_turn_policy, detail::partition::include_all_policy
            >::apply(m_turns, robust_originals, visitor);

        bool const deflate = distance_strategy.negative();

        for (typename boost::range_iterator<turn_vector_type>::type it =
            boost::begin(m_turns); it != boost::end(m_turns); ++it)
        {
            buffer_turn_info_type& turn = *it;
            if (turn.location == location_ok)
            {
                if (deflate && turn.count_in_original <= 0)
                {
                    // For deflate: it is not in original, discard
                    turn.location = location_discard;
                }
                else if (! deflate && turn.count_in_original > 0)
                {
                    // For inflate: it is in original, discard
                    turn.location = location_discard;
                }
            }
        }
    }

    inline bool assert_indices_in_robust_rings() const
    {
        geometry::equal_to<robust_point_type> comparator;
        for (typename boost::range_iterator<turn_vector_type const>::type it =
            boost::begin(m_turns); it != boost::end(m_turns); ++it)
        {
            for (int i = 0; i < 2; i++)
            {
                robust_point_type const &p1
                    = m_pieces[it->operations[i].piece_index].robust_ring
                              [it->operations[i].index_in_robust_ring];
                robust_point_type const &p2 = it->robust_point;
                if (! comparator(p1, p2))
                {
                    return false;
                }
            }
        }
        return true;
    }

    inline void insert_rescaled_piece_turns()
    {
        // Add rescaled turn points to corresponding pieces
        // (after this, each turn occurs twice)
        std::size_t index = 0;
        for (typename boost::range_iterator<turn_vector_type>::type it =
            boost::begin(m_turns); it != boost::end(m_turns); ++it, ++index)
        {
            geometry::recalculate(it->robust_point, it->point, m_robust_policy);
#if defined(BOOST_GEOMETRY_BUFFER_ENLARGED_CLUSTERS)
            it->mapped_robust_point = it->robust_point;
#endif

            robust_turn turn;
            it->turn_index = index;
            turn.turn_index = index;
            turn.point = it->robust_point;
            for (int i = 0; i < 2; i++)
            {
                turn.operation_index = i;
                turn.seg_id = it->operations[i].seg_id;
                turn.fraction = it->operations[i].fraction;

                piece& pc = m_pieces[it->operations[i].piece_index];
                pc.robust_turns.push_back(turn);

                // Take into account for the box (intersection points should fall inside,
                // but in theory they can be one off because of rounding
                geometry::expand(pc.robust_envelope, it->robust_point);
                geometry::expand(pc.robust_offsetted_envelope, it->robust_point);
            }
        }

#if ! defined(BOOST_GEOMETRY_BUFFER_USE_SIDE_OF_INTERSECTION)
        // Insert all rescaled turn-points into these rings, to form a
        // reliable integer-based ring. All turns can be compared (inside) to this
        // rings to see if they are inside.

        for (typename boost::range_iterator<piece_vector_type>::type
                it = boost::begin(m_pieces); it != boost::end(m_pieces); ++it)
        {
            piece& pc = *it;
            signed_size_type piece_segment_index = pc.first_seg_id.segment_index;
            if (! pc.robust_turns.empty())
            {
                if (pc.robust_turns.size() > 1u)
                {
                    std::sort(pc.robust_turns.begin(), pc.robust_turns.end(), buffer_operation_less());
                }
                // Walk through them, in reverse to insert at right index
                signed_size_type index_offset = static_cast<signed_size_type>(pc.robust_turns.size()) - 1;
                for (typename boost::range_reverse_iterator<const std::vector<robust_turn> >::type
                        rit = boost::const_rbegin(pc.robust_turns);
                    rit != boost::const_rend(pc.robust_turns);
                    ++rit, --index_offset)
                {
                    signed_size_type const index_in_vector = 1 + rit->seg_id.segment_index - piece_segment_index;
                    BOOST_GEOMETRY_ASSERT
                    (
                        index_in_vector > 0
                        && index_in_vector < pc.offsetted_count
                    );

                    pc.robust_ring.insert(boost::begin(pc.robust_ring) + index_in_vector, rit->point);
                    pc.offsetted_count++;

                    m_turns[rit->turn_index].operations[rit->operation_index].index_in_robust_ring = index_in_vector + index_offset;
                }
            }
        }

        BOOST_GEOMETRY_ASSERT(assert_indices_in_robust_rings());
#endif
    }

    template <std::size_t Dimension>
    static inline void determine_monotonicity(piece& pc,
            robust_point_type const& current,
            robust_point_type const& next)
    {
        if (geometry::get<Dimension>(current) >= geometry::get<Dimension>(next))
        {
            pc.is_monotonic_increasing[Dimension] = false;
        }
        if (geometry::get<Dimension>(current) <= geometry::get<Dimension>(next))
        {
            pc.is_monotonic_decreasing[Dimension] = false;
        }
    }

    static inline void determine_properties(piece& pc)
    {
        pc.is_monotonic_increasing[0] = true;
        pc.is_monotonic_increasing[1] = true;
        pc.is_monotonic_decreasing[0] = true;
        pc.is_monotonic_decreasing[1] = true;

        pc.is_convex = geometry::is_convex(pc.robust_ring);

        if (pc.offsetted_count < 2)
        {
            return;
        }

        typename robust_ring_type::const_iterator current = pc.robust_ring.begin();
        typename robust_ring_type::const_iterator next = current + 1;

        for (signed_size_type i = 1; i < pc.offsetted_count; i++)
        {
            determine_monotonicity<0>(pc, *current, *next);
            determine_monotonicity<1>(pc, *current, *next);
            current = next;
            ++next;
        }
    }

    void determine_properties()
    {
        for (typename piece_vector_type::iterator it = boost::begin(m_pieces);
            it != boost::end(m_pieces);
            ++it)
        {
            determine_properties(*it);
        }
    }

    inline void reverse_negative_robust_rings()
    {
        for (typename piece_vector_type::iterator it = boost::begin(m_pieces);
            it != boost::end(m_pieces);
            ++it)
        {
            piece& pc = *it;
            if (geometry::area(pc.robust_ring) < 0)
            {
                // Rings can be ccw:
                // - in a concave piece
                // - in a line-buffer with a negative buffer-distance
                std::reverse(pc.robust_ring.begin(), pc.robust_ring.end());
            }
        }
    }

    inline void prepare_buffered_point_piece(piece& pc)
    {
        // create monotonic sections in y-dimension
        typedef boost::mpl::vector_c<std::size_t, 1> dimensions;
        geometry::sectionalize<false, dimensions>(pc.robust_ring,
                detail::no_rescale_policy(), pc.sections);

        // Determine min/max radius
        typedef geometry::model::referring_segment<robust_point_type const>
            robust_segment_type;

        typename robust_ring_type::const_iterator current = pc.robust_ring.begin();
        typename robust_ring_type::const_iterator next = current + 1;

        for (signed_size_type i = 1; i < pc.offsetted_count; i++)
        {
            robust_segment_type s(*current, *next);
            robust_comparable_radius_type const d
                = geometry::comparable_distance(pc.robust_center, s);

            if (i == 1 || d < pc.robust_min_comparable_radius)
            {
                pc.robust_min_comparable_radius = d;
            }
            if (i == 1 || d > pc.robust_max_comparable_radius)
            {
                pc.robust_max_comparable_radius = d;
            }

            current = next;
            ++next;
        }
    }

    inline void prepare_buffered_point_pieces()
    {
        for (typename piece_vector_type::iterator it = boost::begin(m_pieces);
            it != boost::end(m_pieces);
            ++it)
        {
            if (it->type == geometry::strategy::buffer::buffered_point)
            {
                prepare_buffered_point_piece(*it);
            }
        }
    }

    inline void get_turns()
    {
        for(typename boost::range_iterator<sections_type>::type it
                = boost::begin(monotonic_sections);
            it != boost::end(monotonic_sections);
            ++it)
        {
            enlarge_box(it->bounding_box, 1);
        }

        {
            // Calculate the turns
            piece_turn_visitor
                <
                    piece_vector_type,
                    buffered_ring_collection<buffered_ring<Ring> >,
                    turn_vector_type,
                    RobustPolicy
                > visitor(m_pieces, offsetted_rings, m_turns, m_robust_policy);

            geometry::partition
                <
                    robust_box_type,
                    detail::section::get_section_box,
                    detail::section::overlaps_section_box
                >::apply(monotonic_sections, visitor);
        }

        insert_rescaled_piece_turns();

        reverse_negative_robust_rings();

        determine_properties();

        prepare_buffered_point_pieces();

        {
            // Check if it is inside any of the pieces
            turn_in_piece_visitor
                <
                    turn_vector_type, piece_vector_type
                > visitor(m_turns, m_pieces);

            geometry::partition
                <
                    robust_box_type,
                    turn_get_box, turn_ovelaps_box,
                    piece_get_box, piece_ovelaps_box
                >::apply(m_turns, m_pieces, visitor);

        }
    }

    inline void start_new_ring()
    {
        signed_size_type const n = static_cast<signed_size_type>(offsetted_rings.size());
        current_segment_id.source_index = 0;
        current_segment_id.multi_index = n;
        current_segment_id.ring_index = -1;
        current_segment_id.segment_index = 0;

        offsetted_rings.resize(n + 1);
        current_robust_ring.clear();

        m_first_piece_index = static_cast<signed_size_type>(boost::size(m_pieces));
    }

    inline void abort_ring()
    {
        // Remove all created pieces for this ring, sections, last offsetted
        while (! m_pieces.empty()
               && m_pieces.back().first_seg_id.multi_index
               == current_segment_id.multi_index)
        {
            m_pieces.erase(m_pieces.end() - 1);
        }

        while (! monotonic_sections.empty()
               && monotonic_sections.back().ring_id.multi_index
               == current_segment_id.multi_index)
        {
            monotonic_sections.erase(monotonic_sections.end() - 1);
        }

        offsetted_rings.erase(offsetted_rings.end() - 1);
        current_robust_ring.clear();

        m_first_piece_index = -1;
    }

    inline void update_closing_point()
    {
        BOOST_GEOMETRY_ASSERT(! offsetted_rings.empty());
        buffered_ring<Ring>& added = offsetted_rings.back();
        if (! boost::empty(added))
        {
            range::back(added) = range::front(added);
        }
    }

    inline void update_last_point(point_type const& p,
            buffered_ring<Ring>& ring)
    {
        // For the first point of a new piece, and there were already
        // points in the offsetted ring, for some piece types the first point
        // is a duplicate of the last point of the previous piece.

        // TODO: disable that, that point should not be added

        // For now, it is made equal because due to numerical instability,
        // it can be a tiny bit off, possibly causing a self-intersection

        BOOST_GEOMETRY_ASSERT(boost::size(m_pieces) > 0);
        if (! ring.empty()
            && current_segment_id.segment_index
                == m_pieces.back().first_seg_id.segment_index)
        {
            ring.back() = p;
        }
    }

    inline void set_piece_center(point_type const& center)
    {
        BOOST_GEOMETRY_ASSERT(! m_pieces.empty());
        geometry::recalculate(m_pieces.back().robust_center, center,
                m_robust_policy);
    }

    inline void finish_ring(strategy::buffer::result_code code,
                            bool is_interior = false, bool has_interiors = false)
    {
        if (code == strategy::buffer::result_error_numerical)
        {
            abort_ring();
            return;
        }

        if (m_first_piece_index == -1)
        {
            return;
        }

        if (m_first_piece_index < static_cast<signed_size_type>(boost::size(m_pieces)))
        {
            // If piece was added
            // Reassign left-of-first and right-of-last
            geometry::range::at(m_pieces, m_first_piece_index).left_index
                    = static_cast<signed_size_type>(boost::size(m_pieces)) - 1;
            geometry::range::back(m_pieces).right_index = m_first_piece_index;
        }
        m_first_piece_index = -1;

        update_closing_point();

        if (! current_robust_ring.empty())
        {
            BOOST_GEOMETRY_ASSERT
            (
                geometry::equals(current_robust_ring.front(),
                    current_robust_ring.back())
            );

            robust_originals.push_back(
                robust_original(current_robust_ring,
                    is_interior, has_interiors));
        }
    }

    inline void set_current_ring_concave()
    {
        BOOST_GEOMETRY_ASSERT(boost::size(offsetted_rings) > 0);
        offsetted_rings.back().has_concave = true;
    }

    inline signed_size_type add_point(point_type const& p)
    {
        BOOST_GEOMETRY_ASSERT(boost::size(offsetted_rings) > 0);

        buffered_ring<Ring>& current_ring = offsetted_rings.back();
        update_last_point(p, current_ring);

        current_segment_id.segment_index++;
        current_ring.push_back(p);
        return static_cast<signed_size_type>(current_ring.size());
    }

    //-------------------------------------------------------------------------

    inline piece& create_piece(strategy::buffer::piece_type type,
            bool decrease_segment_index_by_one)
    {
        if (type == strategy::buffer::buffered_concave)
        {
            offsetted_rings.back().has_concave = true;
        }

        piece pc;
        pc.type = type;
        pc.index = static_cast<signed_size_type>(boost::size(m_pieces));

        current_segment_id.piece_index = pc.index;

        pc.first_seg_id = current_segment_id;


        // Assign left/right (for first/last piece per ring they will be re-assigned later)
        pc.left_index = pc.index - 1;
        pc.right_index = pc.index + 1;

        std::size_t const n = boost::size(offsetted_rings.back());
        pc.first_seg_id.segment_index = decrease_segment_index_by_one ? n - 1 : n;
        pc.last_segment_index = pc.first_seg_id.segment_index;

        m_pieces.push_back(pc);
        return m_pieces.back();
    }

    inline void init_rescale_piece(piece& pc, std::size_t helper_points_size)
    {
        if (pc.first_seg_id.segment_index < 0)
        {
            // This indicates an error situation: an earlier piece was empty
            // It currently does not happen
            // std::cout << "EMPTY " << pc.type << " " << pc.index << " " << pc.first_seg_id.multi_index << std::endl;
            pc.offsetted_count = 0;
            return;
        }

        BOOST_GEOMETRY_ASSERT(pc.first_seg_id.multi_index >= 0);
        BOOST_GEOMETRY_ASSERT(pc.last_segment_index >= 0);

        pc.offsetted_count = pc.last_segment_index - pc.first_seg_id.segment_index;
        BOOST_GEOMETRY_ASSERT(pc.offsetted_count >= 0);

        pc.robust_ring.reserve(pc.offsetted_count + helper_points_size);

        // Add rescaled offsetted segments
        {
            buffered_ring<Ring> const& ring = offsetted_rings[pc.first_seg_id.multi_index];

            typedef typename boost::range_iterator<const buffered_ring<Ring> >::type it_type;
            for (it_type it = boost::begin(ring) + pc.first_seg_id.segment_index;
                it != boost::begin(ring) + pc.last_segment_index;
                ++it)
            {
                robust_point_type point;
                geometry::recalculate(point, *it, m_robust_policy);
                pc.robust_ring.push_back(point);
            }
        }
    }

    inline robust_point_type add_helper_point(piece& pc, const point_type& point)
    {
#if defined(BOOST_GEOMETRY_BUFFER_USE_HELPER_POINTS)
        pc.helper_points.push_back(point);
#endif

        robust_point_type rob_point;
        geometry::recalculate(rob_point, point, m_robust_policy);
        pc.robust_ring.push_back(rob_point);
        return rob_point;
    }

    // TODO: this is shared with sectionalize, move to somewhere else (assign?)
    template <typename Box, typename Value>
    inline void enlarge_box(Box& box, Value value)
    {
        geometry::set<0, 0>(box, geometry::get<0, 0>(box) - value);
        geometry::set<0, 1>(box, geometry::get<0, 1>(box) - value);
        geometry::set<1, 0>(box, geometry::get<1, 0>(box) + value);
        geometry::set<1, 1>(box, geometry::get<1, 1>(box) + value);
    }

    inline void calculate_robust_envelope(piece& pc)
    {
        if (pc.offsetted_count == 0)
        {
            return;
        }

        geometry::envelope(pc.robust_ring, pc.robust_envelope);

        geometry::assign_inverse(pc.robust_offsetted_envelope);
        for (signed_size_type i = 0; i < pc.offsetted_count; i++)
        {
            geometry::expand(pc.robust_offsetted_envelope, pc.robust_ring[i]);
        }

        // Take roundings into account, enlarge boxes with 1 integer
        enlarge_box(pc.robust_envelope, 1);
        enlarge_box(pc.robust_offsetted_envelope, 1);
    }

    inline void sectionalize(piece& pc)
    {

        buffered_ring<Ring> const& ring = offsetted_rings.back();

        typedef geometry::detail::sectionalize::sectionalize_part
        <
            point_type,
            boost::mpl::vector_c<std::size_t, 0, 1> // x,y dimension
        > sectionalizer;

        // Create a ring-identifier. The source-index is the piece index
        // The multi_index is as in this collection (the ring), but not used here
        // The ring_index is not used
        ring_identifier ring_id(pc.index, pc.first_seg_id.multi_index, -1);

        sectionalizer::apply(monotonic_sections,
            boost::begin(ring) + pc.first_seg_id.segment_index,
            boost::begin(ring) + pc.last_segment_index,
            m_robust_policy,
            ring_id, 10);
    }

    inline void finish_piece(piece& pc)
    {
        init_rescale_piece(pc, 0u);
        calculate_robust_envelope(pc);
        sectionalize(pc);
    }

    inline void finish_piece(piece& pc,
                    const point_type& point1,
                    const point_type& point2,
                    const point_type& point3)
    {
        init_rescale_piece(pc, 3u);
        if (pc.offsetted_count == 0)
        {
            return;
        }

        add_helper_point(pc, point1);
        robust_point_type mid_point = add_helper_point(pc, point2);
        add_helper_point(pc, point3);
        calculate_robust_envelope(pc);
        sectionalize(pc);

        current_robust_ring.push_back(mid_point);
    }

    inline void finish_piece(piece& pc,
                    const point_type& point1,
                    const point_type& point2,
                    const point_type& point3,
                    const point_type& point4)
    {
        init_rescale_piece(pc, 4u);
        add_helper_point(pc, point1);
        robust_point_type mid_point2 = add_helper_point(pc, point2);
        robust_point_type mid_point1 = add_helper_point(pc, point3);
        add_helper_point(pc, point4);
        sectionalize(pc);
        calculate_robust_envelope(pc);

        // Add mid-points in other order to current helper_ring
        current_robust_ring.push_back(mid_point1);
        current_robust_ring.push_back(mid_point2);
    }

    inline void add_piece(strategy::buffer::piece_type type, point_type const& p,
            point_type const& b1, point_type const& b2)
    {
        piece& pc = create_piece(type, false);
        add_point(b1);
        pc.last_segment_index = add_point(b2);
        finish_piece(pc, b2, p, b1);
    }

    template <typename Range>
    inline void add_range_to_piece(piece& pc, Range const& range, bool add_front)
    {
        BOOST_GEOMETRY_ASSERT(boost::size(range) != 0u);

        typename Range::const_iterator it = boost::begin(range);

        // If it follows a non-join (so basically the same piece-type) point b1 should be added.
        // There should be two intersections later and it should be discarded.
        // But for now we need it to calculate intersections
        if (add_front)
        {
            add_point(*it);
        }

        for (++it; it != boost::end(range); ++it)
        {
            pc.last_segment_index = add_point(*it);
        }
    }


    template <typename Range>
    inline void add_piece(strategy::buffer::piece_type type, Range const& range,
            bool decrease_segment_index_by_one)
    {
        piece& pc = create_piece(type, decrease_segment_index_by_one);

        if (boost::size(range) > 0u)
        {
            add_range_to_piece(pc, range, offsetted_rings.back().empty());
        }
        finish_piece(pc);
    }

    template <typename Range>
    inline void add_side_piece(point_type const& p1, point_type const& p2,
            Range const& range, bool first)
    {
        BOOST_GEOMETRY_ASSERT(boost::size(range) >= 2u);

        piece& pc = create_piece(strategy::buffer::buffered_segment, ! first);
        add_range_to_piece(pc, range, first);
        finish_piece(pc, range.back(), p2, p1, range.front());
    }

    template <typename Range>
    inline void add_piece(strategy::buffer::piece_type type,
            point_type const& p, Range const& range)
    {
        piece& pc = create_piece(type, true);

        if (boost::size(range) > 0u)
        {
            add_range_to_piece(pc, range, offsetted_rings.back().empty());
            finish_piece(pc, range.back(), p, range.front());
        }
        else
        {
            finish_piece(pc);
        }
    }

    template <typename EndcapStrategy, typename Range>
    inline void add_endcap(EndcapStrategy const& strategy, Range const& range,
            point_type const& end_point)
    {
        boost::ignore_unused(strategy);

        if (range.empty())
        {
            return;
        }
        strategy::buffer::piece_type pt = strategy.get_piece_type();
        if (pt == strategy::buffer::buffered_flat_end)
        {
            // It is flat, should just be added, without helper segments
            add_piece(pt, range, true);
        }
        else
        {
            // Normal case, it has an "inside", helper segments should be added
            add_piece(pt, end_point, range);
        }
    }

    //-------------------------------------------------------------------------

    inline void enrich()
    {
        typedef typename strategy::side::services::default_strategy
        <
            typename cs_tag<Ring>::type
        >::type side_strategy_type;

        enrich_intersection_points<false, false, overlay_buffer>(m_turns,
                    m_clusters, offsetted_rings, offsetted_rings,
                    m_robust_policy, side_strategy_type());
    }

    // Discards all rings which do have not-OK intersection points only.
    // Those can never be traversed and should not be part of the output.
    inline void discard_rings()
    {
        for (typename boost::range_iterator<turn_vector_type const>::type it =
            boost::begin(m_turns); it != boost::end(m_turns); ++it)
        {
            if (it->location != location_ok)
            {
                offsetted_rings[it->operations[0].seg_id.multi_index].has_discarded_intersections = true;
                offsetted_rings[it->operations[1].seg_id.multi_index].has_discarded_intersections = true;
            }
            else
            {
                offsetted_rings[it->operations[0].seg_id.multi_index].has_accepted_intersections = true;
                offsetted_rings[it->operations[1].seg_id.multi_index].has_accepted_intersections = true;
            }
        }
    }

    inline bool point_coveredby_original(point_type const& point)
    {
        robust_point_type any_point;
        geometry::recalculate(any_point, point, m_robust_policy);

        signed_size_type count_in_original = 0;

        // Check of the robust point of this outputted ring is in
        // any of the robust original rings
        // This can go quadratic if the input has many rings, and there
        // are many untouched deflated rings around
        for (typename std::vector<robust_original>::const_iterator it
            = robust_originals.begin();
            it != robust_originals.end();
            ++it)
        {
            robust_original const& original = *it;
            if (detail::disjoint::disjoint_point_box(any_point,
                    original.m_box))
            {
                continue;
            }

            int const geometry_code
                = detail::within::point_in_geometry(any_point,
                    original.m_ring);

            if (geometry_code == -1)
            {
                // Outside, continue
                continue;
            }

            // Apply for possibly nested interior rings
            if (original.m_is_interior)
            {
                count_in_original--;
            }
            else if (original.m_has_interiors)
            {
                count_in_original++;
            }
            else
            {
                // Exterior ring without interior rings
                return true;
            }
        }
        return count_in_original > 0;
    }

    // For a deflate, all rings around inner rings which are untouched
    // (no intersections/turns) and which are OUTSIDE the original should
    // be discarded
    inline void discard_nonintersecting_deflated_rings()
    {
        for(typename buffered_ring_collection<buffered_ring<Ring> >::iterator it
            = boost::begin(offsetted_rings);
            it != boost::end(offsetted_rings);
            ++it)
        {
            buffered_ring<Ring>& ring = *it;
            if (! ring.has_intersections()
                && boost::size(ring) > 0u
                && geometry::area(ring) < 0)
            {
                if (! point_coveredby_original(geometry::range::front(ring)))
                {
                    ring.is_untouched_outside_original = true;
                }
            }
        }
    }

    inline void block_turns()
    {
        // To fix left-turn issues like #rt_u13
        // But currently it causes more other issues than it fixes
//        m_turns.erase
//            (
//                std::remove_if(boost::begin(m_turns), boost::end(m_turns),
//                                redundant_turn()),
//                boost::end(m_turns)
//            );

        for (typename boost::range_iterator<turn_vector_type>::type it =
            boost::begin(m_turns); it != boost::end(m_turns); ++it)
        {
            buffer_turn_info_type& turn = *it;
            if (turn.location != location_ok)
            {
                // Discard this turn (don't set it to blocked to avoid colocated
                // clusters being discarded afterwards
                turn.discarded = true;
            }
        }
    }

    inline void traverse()
    {
        typedef detail::overlay::traverse
            <
                false, false,
                buffered_ring_collection<buffered_ring<Ring> >,
                buffered_ring_collection<buffered_ring<Ring > >,
                overlay_buffer,
                backtrack_for_buffer
            > traverser;

        traversed_rings.clear();
        buffer_overlay_visitor visitor;
        traverser::apply(offsetted_rings, offsetted_rings,
                        m_robust_policy, m_turns, traversed_rings,
                        m_clusters, visitor);
    }

    inline void reverse()
    {
        for(typename buffered_ring_collection<buffered_ring<Ring> >::iterator it = boost::begin(offsetted_rings);
            it != boost::end(offsetted_rings);
            ++it)
        {
            if (! it->has_intersections())
            {
                std::reverse(it->begin(), it->end());
            }
        }
        for (typename boost::range_iterator<buffered_ring_collection<Ring> >::type
                it = boost::begin(traversed_rings);
                it != boost::end(traversed_rings);
                ++it)
        {
            std::reverse(it->begin(), it->end());
        }

    }

    template <typename GeometryOutput, typename OutputIterator>
    inline OutputIterator assign(OutputIterator out) const
    {
        typedef detail::overlay::ring_properties<point_type> properties;

        std::map<ring_identifier, properties> selected;

        // Select all rings which do not have any self-intersection
        // Inner rings, for deflate, which do not have intersections, and
        // which are outside originals, are skipped
        // (other ones should be traversed)
        signed_size_type index = 0;
        for(typename buffered_ring_collection<buffered_ring<Ring> >::const_iterator it = boost::begin(offsetted_rings);
            it != boost::end(offsetted_rings);
            ++it, ++index)
        {
            if (! it->has_intersections()
                && ! it->is_untouched_outside_original)
            {
                properties p = properties(*it);
                if (p.valid)
                {
                    ring_identifier id(0, index, -1);
                    selected[id] = p;
                }
            }
        }

        // Select all created rings
        index = 0;
        for (typename boost::range_iterator<buffered_ring_collection<Ring> const>::type
                it = boost::begin(traversed_rings);
                it != boost::end(traversed_rings);
                ++it, ++index)
        {
            properties p = properties(*it);
            if (p.valid)
            {
                ring_identifier id(2, index, -1);
                selected[id] = p;
            }
        }

        detail::overlay::assign_parents(offsetted_rings, traversed_rings, selected, true);
        return detail::overlay::add_rings<GeometryOutput>(selected, offsetted_rings, traversed_rings, out);
    }

};


}} // namespace detail::buffer
#endif // DOXYGEN_NO_DETAIL


}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_BUFFER_BUFFERED_PIECE_COLLECTION_HPP
