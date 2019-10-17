// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2015 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2015 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2015 Mateusz Loskot, London, UK.
// Copyright (c) 2014-2015 Adam Wulkiewicz, Lodz, Poland.

// This file was modified by Oracle on 2013, 2014, 2015.
// Modifications copyright (c) 2013-2015 Oracle and/or its affiliates.

// Contributed and/or modified by Adam Wulkiewicz, on behalf of Oracle
// Contributed and/or modified by Menelaos Karavelas, on behalf of Oracle

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ALGORITHMS_DETAIL_SECTIONS_SECTIONALIZE_HPP
#define BOOST_GEOMETRY_ALGORITHMS_DETAIL_SECTIONS_SECTIONALIZE_HPP

#include <cstddef>
#include <vector>

#include <boost/concept/requires.hpp>
#include <boost/mpl/assert.hpp>
#include <boost/mpl/vector_c.hpp>
#include <boost/range.hpp>
#include <boost/static_assert.hpp>

#include <boost/geometry/algorithms/assign.hpp>
#include <boost/geometry/algorithms/envelope.hpp>
#include <boost/geometry/algorithms/expand.hpp>

#include <boost/geometry/algorithms/detail/interior_iterator.hpp>
#include <boost/geometry/algorithms/detail/recalculate.hpp>
#include <boost/geometry/algorithms/detail/ring_identifier.hpp>
#include <boost/geometry/algorithms/detail/signed_size_type.hpp>

#include <boost/geometry/core/access.hpp>
#include <boost/geometry/core/closure.hpp>
#include <boost/geometry/core/exterior_ring.hpp>
#include <boost/geometry/core/point_order.hpp>
#include <boost/geometry/core/tags.hpp>

#include <boost/geometry/geometries/concepts/check.hpp>
#include <boost/geometry/util/math.hpp>
#include <boost/geometry/policies/robustness/no_rescale_policy.hpp>
#include <boost/geometry/policies/robustness/robust_point_type.hpp>
#include <boost/geometry/views/closeable_view.hpp>
#include <boost/geometry/views/reversible_view.hpp>
#include <boost/geometry/geometries/segment.hpp>

#include <boost/geometry/algorithms/detail/expand_by_epsilon.hpp>

namespace boost { namespace geometry
{


/*!
    \brief Structure containing section information
    \details Section information consists of a bounding box, direction
        information (if it is increasing or decreasing, per dimension),
        index information (begin-end, ring, multi) and the number of
        segments in this section

    \tparam Box box-type
    \tparam DimensionCount number of dimensions for this section
    \ingroup sectionalize
 */
template
<
    typename Box,
    std::size_t DimensionCount
>
struct section
{
    typedef Box box_type;
    static std::size_t const dimension_count = DimensionCount;

    int directions[DimensionCount];
    ring_identifier ring_id;
    Box bounding_box;

    // NOTE: size_type could be passed as template parameter
    // NOTE: these probably also could be of type std::size_t
    signed_size_type begin_index;
    signed_size_type end_index;
    std::size_t count;
    std::size_t range_count;
    bool duplicate;
    signed_size_type non_duplicate_index;

    bool is_non_duplicate_first;
    bool is_non_duplicate_last;

    inline section()
        : begin_index(-1)
        , end_index(-1)
        , count(0)
        , range_count(0)
        , duplicate(false)
        , non_duplicate_index(-1)
        , is_non_duplicate_first(false)
        , is_non_duplicate_last(false)
    {
        assign_inverse(bounding_box);
        for (std::size_t i = 0; i < DimensionCount; i++)
        {
            directions[i] = 0;
        }
    }
};


/*!
    \brief Structure containing a collection of sections
    \note Derived from a vector, proves to be faster than of deque
    \note vector might be templated in the future
    \ingroup sectionalize
 */
template <typename Box, std::size_t DimensionCount>
struct sections : std::vector<section<Box, DimensionCount> >
{
    typedef Box box_type;
    static std::size_t const value = DimensionCount;
};


#ifndef DOXYGEN_NO_DETAIL
namespace detail { namespace sectionalize
{

template
<
    typename DimensionVector,
    std::size_t Index,
    std::size_t Count
>
struct get_direction_loop
{
    typedef typename boost::mpl::at_c<DimensionVector, Index>::type dimension;

    template <typename Segment>
    static inline void apply(Segment const& seg,
                int directions[Count])
    {
        typedef typename coordinate_type<Segment>::type coordinate_type;

        coordinate_type const diff =
            geometry::get<1, dimension::value>(seg)
          - geometry::get<0, dimension::value>(seg);

        coordinate_type zero = coordinate_type();
        directions[Index] = diff > zero ? 1 : diff < zero ? -1 : 0;

        get_direction_loop
        <
            DimensionVector,
            Index + 1,
            Count
        >::apply(seg, directions);
    }
};

template <typename DimensionVector, std::size_t Count>
struct get_direction_loop<DimensionVector, Count, Count>
{
    template <typename Segment>
    static inline void apply(Segment const&, int [Count])
    {}
};

//! Copy one static array to another
template <typename T, std::size_t Index, std::size_t Count>
struct copy_loop
{
    static inline void apply(T const source[Count], T target[Count])
    {
        target[Index] = source[Index];
        copy_loop<T, Index + 1, Count>::apply(source, target);
    }
};

template <typename T, std::size_t Count>
struct copy_loop<T, Count, Count>
{
    static inline void apply(T const [Count], T [Count])
    {}
};

//! Compare two static arrays
template <typename T, std::size_t Index, std::size_t Count>
struct compare_loop
{
    static inline bool apply(T const array1[Count], T const array2[Count])
    {
        return array1[Index] != array2[Index]
            ? false
            : compare_loop
                <
                    T, Index + 1, Count
                >::apply(array1, array2);
    }
};

template <typename T, std::size_t Count>
struct compare_loop<T, Count, Count>
{
    static inline bool apply(T const [Count], T const [Count])
    {

        return true;
    }
};


template <std::size_t Dimension, std::size_t DimensionCount>
struct check_duplicate_loop
{
    template <typename Segment>
    static inline bool apply(Segment const& seg)
    {
        if (! geometry::math::equals
                (
                    geometry::get<0, Dimension>(seg),
                    geometry::get<1, Dimension>(seg)
                )
            )
        {
            return false;
        }

        return check_duplicate_loop
        <
                Dimension + 1, DimensionCount
        >::apply(seg);
    }
};

template <std::size_t DimensionCount>
struct check_duplicate_loop<DimensionCount, DimensionCount>
{
    template <typename Segment>
    static inline bool apply(Segment const&)
    {
        return true;
    }
};

//! Assign a value to a static array
template <typename T, std::size_t Index, std::size_t Count>
struct assign_loop
{
    static inline void apply(T dims[Count], T const value)
    {
        dims[Index] = value;
        assign_loop<T, Index + 1, Count>::apply(dims, value);
    }
};

template <typename T, std::size_t Count>
struct assign_loop<T, Count, Count>
{
    static inline void apply(T [Count], T const)
    {
    }
};

template <typename CSTag>
struct box_first_in_section
{
    template <typename Box, typename Point>
    static inline void apply(Box & box, Point const& prev, Point const& curr)
    {
        geometry::model::referring_segment<Point const> seg(prev, curr);
        geometry::envelope(seg, box);
    }
};

template <>
struct box_first_in_section<cartesian_tag>
{
    template <typename Box, typename Point>
    static inline void apply(Box & box, Point const& prev, Point const& curr)
    {
        geometry::envelope(prev, box);
        geometry::expand(box, curr);
    }
};

template <typename CSTag>
struct box_next_in_section
{
    template <typename Box, typename Point>
    static inline void apply(Box & box, Point const& prev, Point const& curr)
    {
        geometry::model::referring_segment<Point const> seg(prev, curr);
        geometry::expand(box, seg);
    }
};

template <>
struct box_next_in_section<cartesian_tag>
{
    template <typename Box, typename Point>
    static inline void apply(Box & box, Point const& , Point const& curr)
    {
        geometry::expand(box, curr);
    }
};

/// @brief Helper class to create sections of a part of a range, on the fly
template
<
    typename Point,
    typename DimensionVector
>
struct sectionalize_part
{
    static const std::size_t dimension_count
        = boost::mpl::size<DimensionVector>::value;

    template
    <
        typename Iterator,
        typename RobustPolicy,
        typename Sections
    >
    static inline void apply(Sections& sections,
                             Iterator begin, Iterator end,
                             RobustPolicy const& robust_policy,
                             ring_identifier ring_id,
                             std::size_t max_count)
    {
        boost::ignore_unused_variable_warning(robust_policy);

        typedef typename boost::range_value<Sections>::type section_type;
        BOOST_STATIC_ASSERT
            (
                (static_cast<std::size_t>(section_type::dimension_count)
                 == static_cast<std::size_t>(boost::mpl::size<DimensionVector>::value))
            );

        typedef typename geometry::robust_point_type
        <
            Point,
            RobustPolicy
        >::type robust_point_type;

        std::size_t const count = std::distance(begin, end);
        if (count == 0)
        {
            return;
        }

        signed_size_type index = 0;
        signed_size_type ndi = 0; // non duplicate index
        section_type section;

        bool mark_first_non_duplicated = true;
        std::size_t last_non_duplicate_index = sections.size();

        Iterator it = begin;
        robust_point_type previous_robust_point;
        geometry::recalculate(previous_robust_point, *it, robust_policy);
        
        for(Iterator previous = it++;
            it != end;
            ++previous, ++it, index++)
        {
            robust_point_type current_robust_point;
            geometry::recalculate(current_robust_point, *it, robust_policy);
            model::referring_segment<robust_point_type> robust_segment(
                    previous_robust_point, current_robust_point);

            int direction_classes[dimension_count] = {0};
            get_direction_loop
            <
                DimensionVector, 0, dimension_count
            >::apply(robust_segment, direction_classes);

            // if "dir" == 0 for all point-dimensions, it is duplicate.
            // Those sections might be omitted, if wished, lateron
            bool duplicate = false;

            if (direction_classes[0] == 0)
            {
                // Recheck because ALL dimensions should be checked,
                // not only first one.
                // (dimension_count might be < dimension<P>::value)
                if (check_duplicate_loop
                    <
                        0, geometry::dimension<Point>::type::value
                    >::apply(robust_segment)
                    )
                {
                    duplicate = true;

                    // Change direction-info to force new section
                    // Note that wo consecutive duplicate segments will generate
                    // only one duplicate-section.
                    // Actual value is not important as long as it is not -1,0,1
                    assign_loop
                    <
                        int, 0, dimension_count
                    >::apply(direction_classes, -99);
                }
            }

            if (section.count > 0
                && (! compare_loop
                        <
                            int, 0, dimension_count
                        >::apply(direction_classes, section.directions)
                    || section.count > max_count)
                )
            {
                if (! section.duplicate)
                {
                    last_non_duplicate_index = sections.size();
                }

                sections.push_back(section);
                section = section_type();
            }

            if (section.count == 0)
            {
                section.begin_index = index;
                section.ring_id = ring_id;
                section.duplicate = duplicate;
                section.non_duplicate_index = ndi;
                section.range_count = count;

                if (mark_first_non_duplicated && ! duplicate)
                {
                    section.is_non_duplicate_first = true;
                    mark_first_non_duplicated = false;
                }

                copy_loop
                    <
                        int, 0, dimension_count
                    >::apply(direction_classes, section.directions);

                // In cartesian this is envelope of previous point expanded with current point
                // in non-cartesian this is envelope of a segment
                box_first_in_section<typename cs_tag<robust_point_type>::type>
                    ::apply(section.bounding_box, previous_robust_point, current_robust_point);
            }
            else
            {
                // In cartesian this is expand with current point
                // in non-cartesian this is expand with a segment
                box_next_in_section<typename cs_tag<robust_point_type>::type>
                    ::apply(section.bounding_box, previous_robust_point, current_robust_point);
            }

            section.end_index = index + 1;
            section.count++;
            if (! duplicate)
            {
                ndi++;
            }
            previous_robust_point = current_robust_point;
        }

        // Add last section if applicable
        if (section.count > 0)
        {
            if (! section.duplicate)
            {
                last_non_duplicate_index = sections.size();
            }

            sections.push_back(section);
        }

        if (last_non_duplicate_index < sections.size()
            && ! sections[last_non_duplicate_index].duplicate)
        {
            sections[last_non_duplicate_index].is_non_duplicate_last = true;
        }
    }
};


template
<
    closure_selector Closure,
    bool Reverse,
    typename Point,
    typename DimensionVector
>
struct sectionalize_range
{
    template
    <
        typename Range,
        typename RobustPolicy,
        typename Sections
    >
    static inline void apply(Range const& range,
                             RobustPolicy const& robust_policy,
                             Sections& sections,
                             ring_identifier ring_id,
                             std::size_t max_count)
    {
        typedef typename closeable_view<Range const, Closure>::type cview_type;
        typedef typename reversible_view
        <
            cview_type const,
            Reverse ? iterate_reverse : iterate_forward
        >::type view_type;

        cview_type cview(range);
        view_type view(cview);

        std::size_t const n = boost::size(view);
        if (n == 0)
        {
            // Zero points, no section
            return;
        }

        if (n == 1)
        {
            // Line with one point ==> no sections
            return;
        }

        sectionalize_part<Point, DimensionVector>::apply(sections,
            boost::begin(view), boost::end(view),
            robust_policy, ring_id, max_count);
    }
};

template
<
    bool Reverse,
    typename DimensionVector
>
struct sectionalize_polygon
{
    template
    <
        typename Polygon,
        typename RobustPolicy,
        typename Sections
    >
    static inline void apply(Polygon const& poly,
                RobustPolicy const& robust_policy,
                Sections& sections,
                ring_identifier ring_id, std::size_t max_count)
    {
        typedef typename point_type<Polygon>::type point_type;
        typedef sectionalize_range
        <
                closure<Polygon>::value, Reverse,
                point_type, DimensionVector
        > per_range;

        ring_id.ring_index = -1;
        per_range::apply(exterior_ring(poly), robust_policy, sections, ring_id, max_count);

        ring_id.ring_index++;
        typename interior_return_type<Polygon const>::type
            rings = interior_rings(poly);
        for (typename detail::interior_iterator<Polygon const>::type
                it = boost::begin(rings); it != boost::end(rings); ++it, ++ring_id.ring_index)
        {
            per_range::apply(*it, robust_policy, sections, ring_id, max_count);
        }
    }
};

template <typename DimensionVector>
struct sectionalize_box
{
    template
    <
        typename Box,
        typename RobustPolicy,
        typename Sections
    >
    static inline void apply(Box const& box,
                RobustPolicy const& robust_policy,
                Sections& sections,
                ring_identifier const& ring_id, std::size_t max_count)
    {
        typedef typename point_type<Box>::type point_type;

        assert_dimension<Box, 2>();

        // Add all four sides of the 2D-box as separate section.
        // Easiest is to convert it to a polygon.
        // However, we don't have the polygon type
        // (or polygon would be a helper-type).
        // Therefore we mimic a linestring/std::vector of 5 points

        // TODO: might be replaced by assign_box_corners_oriented
        // or just "convert"
        point_type ll, lr, ul, ur;
        geometry::detail::assign_box_corners(box, ll, lr, ul, ur);

        std::vector<point_type> points;
        points.push_back(ll);
        points.push_back(ul);
        points.push_back(ur);
        points.push_back(lr);
        points.push_back(ll);

        sectionalize_range
        <
                closed, false,
            point_type,
            DimensionVector
        >::apply(points, robust_policy, sections,
                 ring_id, max_count);
    }
};

template <typename DimensionVector, typename Policy>
struct sectionalize_multi
{
    template
    <
        typename MultiGeometry,
        typename RobustPolicy,
        typename Sections
    >
    static inline void apply(MultiGeometry const& multi,
                RobustPolicy const& robust_policy,
                Sections& sections, ring_identifier ring_id, std::size_t max_count)
    {
        ring_id.multi_index = 0;
        for (typename boost::range_iterator<MultiGeometry const>::type
                    it = boost::begin(multi);
            it != boost::end(multi);
            ++it, ++ring_id.multi_index)
        {
            Policy::apply(*it, robust_policy, sections, ring_id, max_count);
        }
    }
};

template <typename Sections>
inline void enlarge_sections(Sections& sections)
{
    // Robustness issue. Increase sections a tiny bit such that all points are really within (and not on border)
    // Reason: turns might, rarely, be missed otherwise (case: "buffer_mp1")
    // Drawback: not really, range is now completely inside the section. Section is a tiny bit too large,
    // which might cause (a small number) of more comparisons
    
    // NOTE: above is old comment to the not used code expanding the Boxes by relaxed_epsilon(10)
    
    // Enlarge sections by scaled epsilon, this should be consistent with math::equals().
    // Points and Segments are equal-compared WRT machine epsilon, but Boxes aren't
    // Enlarging Boxes ensures that they correspond to the bound objects,
    // Segments in this case, since Sections are collections of Segments.
    for (typename boost::range_iterator<Sections>::type it = boost::begin(sections);
        it != boost::end(sections);
        ++it)
    {
        detail::expand_by_epsilon(it->bounding_box);
    }
}


}} // namespace detail::sectionalize
#endif // DOXYGEN_NO_DETAIL


#ifndef DOXYGEN_NO_DISPATCH
namespace dispatch
{

template
<
    typename Tag,
    typename Geometry,
    bool Reverse,
    typename DimensionVector
>
struct sectionalize
{
    BOOST_MPL_ASSERT_MSG
        (
            false, NOT_OR_NOT_YET_IMPLEMENTED_FOR_THIS_GEOMETRY_TYPE
            , (types<Geometry>)
        );
};

template
<
    typename Box,
    bool Reverse,
    typename DimensionVector
>
struct sectionalize<box_tag, Box, Reverse, DimensionVector>
    : detail::sectionalize::sectionalize_box<DimensionVector>
{};

template
<
    typename LineString,
    typename DimensionVector
>
struct sectionalize
    <
        linestring_tag,
        LineString,
        false,
        DimensionVector
    >
    : detail::sectionalize::sectionalize_range
        <
            closed, false,
            typename point_type<LineString>::type,
            DimensionVector
        >
{};

template
<
    typename Ring,
    bool Reverse,
    typename DimensionVector
>
struct sectionalize<ring_tag, Ring, Reverse, DimensionVector>
    : detail::sectionalize::sectionalize_range
        <
            geometry::closure<Ring>::value, Reverse,
            typename point_type<Ring>::type,
            DimensionVector
        >
{};

template
<
    typename Polygon,
    bool Reverse,
    typename DimensionVector
>
struct sectionalize<polygon_tag, Polygon, Reverse, DimensionVector>
    : detail::sectionalize::sectionalize_polygon
        <
            Reverse, DimensionVector
        >
{};

template
<
    typename MultiPolygon,
    bool Reverse,
    typename DimensionVector
>
struct sectionalize<multi_polygon_tag, MultiPolygon, Reverse, DimensionVector>
    : detail::sectionalize::sectionalize_multi
        <
            DimensionVector,
            detail::sectionalize::sectionalize_polygon
                <
                    Reverse,
                    DimensionVector
                >
        >

{};

template
<
    typename MultiLinestring,
    bool Reverse,
    typename DimensionVector
>
struct sectionalize<multi_linestring_tag, MultiLinestring, Reverse, DimensionVector>
    : detail::sectionalize::sectionalize_multi
        <
            DimensionVector,
            detail::sectionalize::sectionalize_range
                <
                    closed, false,
                    typename point_type<MultiLinestring>::type,
                    DimensionVector
                >
        >

{};

} // namespace dispatch
#endif


/*!
    \brief Split a geometry into monotonic sections
    \ingroup sectionalize
    \tparam Geometry type of geometry to check
    \tparam Sections type of sections to create
    \param geometry geometry to create sections from
    \param robust_policy policy to handle robustness issues
    \param sections structure with sections
    \param source_index index to assign to the ring_identifiers
    \param max_count maximal number of points per section
        (defaults to 10, this seems to give the fastest results)

 */
template
<
    bool Reverse,
    typename DimensionVector,
    typename Geometry,
    typename Sections,
    typename RobustPolicy
>
inline void sectionalize(Geometry const& geometry,
                RobustPolicy const& robust_policy,
                Sections& sections,
                int source_index = 0,
                std::size_t max_count = 10)
{
    concepts::check<Geometry const>();

    typedef typename boost::range_value<Sections>::type section_type;

    // Compiletime check for point type of section boxes
    // and point type related to robust policy
    typedef typename geometry::coordinate_type
    <
        typename section_type::box_type
    >::type ctype1;
    typedef typename geometry::coordinate_type
    <
        typename geometry::robust_point_type
        <
            typename geometry::point_type<Geometry>::type,
            RobustPolicy
        >::type
    >::type ctype2;

    BOOST_MPL_ASSERT((boost::is_same<ctype1, ctype2>));


    sections.clear();

    ring_identifier ring_id;
    ring_id.source_index = source_index;

    dispatch::sectionalize
        <
            typename tag<Geometry>::type,
            Geometry,
            Reverse,
            DimensionVector
        >::apply(geometry, robust_policy, sections, ring_id, max_count);

    detail::sectionalize::enlarge_sections(sections);
}


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_ALGORITHMS_DETAIL_SECTIONS_SECTIONALIZE_HPP
