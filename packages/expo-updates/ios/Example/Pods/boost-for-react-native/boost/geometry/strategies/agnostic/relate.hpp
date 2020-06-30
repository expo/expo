// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2014-2015 Oracle and/or its affiliates.

// Contributed and/or modified by Adam Wulkiewicz, on behalf of Oracle

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_STRATEGY_AGNOSTIC_RELATE_HPP
#define BOOST_GEOMETRY_STRATEGY_AGNOSTIC_RELATE_HPP

#include <boost/geometry/algorithms/relate.hpp>


namespace boost { namespace geometry
{

namespace strategy { namespace relate
{

template <typename Geometry1, typename Geometry2, typename StaticMask>
struct relate
{
    static inline bool apply(Geometry1 const& geometry1, Geometry2 const& geometry2)
    {
        return geometry::relate(geometry1, geometry2, StaticMask());
    }
};

} // namespace relate

namespace within
{

#ifndef DOXYGEN_NO_STRATEGY_SPECIALIZATIONS

namespace services
{


template <typename Geometry1, typename Geometry2, typename AnyTag1, typename AnyTag2, typename AnyCS>
struct default_strategy<AnyTag1, AnyTag2, AnyTag1, AnyTag2, AnyCS, AnyCS, Geometry1, Geometry2>
{
    typedef strategy::relate::relate
        <
            Geometry1,
            Geometry2,
            typename detail::de9im::static_mask_within_type
                <
                    Geometry1, Geometry2
                >::type
        > type;
};

template <typename Geometry1, typename Geometry2, typename AnyTag1, typename AnyTag2, typename AnyCS>
struct default_strategy<AnyTag1, AnyTag2, AnyTag1, areal_tag, AnyCS, AnyCS, Geometry1, Geometry2>
{
    typedef strategy::relate::relate
        <
            Geometry1,
            Geometry2,
            typename detail::de9im::static_mask_within_type
                <
                    Geometry1, Geometry2
                >::type
        > type;
};


} // namespace services

#endif


}} // namespace strategy::within



#ifndef DOXYGEN_NO_STRATEGY_SPECIALIZATIONS
namespace strategy { namespace covered_by { namespace services
{


template <typename Geometry1, typename Geometry2, typename AnyTag1, typename AnyTag2, typename AnyCS>
struct default_strategy<AnyTag1, AnyTag2, AnyTag1, AnyTag2, AnyCS, AnyCS, Geometry1, Geometry2>
{
    typedef strategy::relate::relate
        <
            Geometry1,
            Geometry2,
            typename detail::de9im::static_mask_covered_by_type
                <
                    Geometry1, Geometry2
                >::type
        > type;
};

template <typename Geometry1, typename Geometry2, typename AnyTag1, typename AnyTag2, typename AnyCS>
struct default_strategy<AnyTag1, AnyTag2, AnyTag1, areal_tag, AnyCS, AnyCS, Geometry1, Geometry2>
{
    typedef strategy::relate::relate
        <
            Geometry1,
            Geometry2,
            typename detail::de9im::static_mask_covered_by_type
                <
                    Geometry1, Geometry2
                >::type
        > type;
};


}}} // namespace strategy::covered_by::services
#endif


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_STRATEGY_AGNOSTIC_RELATE_HPP
