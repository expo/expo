// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2015-2016, Oracle and/or its affiliates.

// Contributed and/or modified by Menelaos Karavelas, on behalf of Oracle
// Contributed and/or modified by Adam Wulkiewicz, on behalf of Oracle

// Licensed under the Boost Software License version 1.0.
// http://www.boost.org/users/license.html

#ifndef BOOST_GEOMETRY_UTIL_NORMALIZE_SPHEROIDAL_COORDINATES_HPP
#define BOOST_GEOMETRY_UTIL_NORMALIZE_SPHEROIDAL_COORDINATES_HPP

#include <boost/geometry/core/assert.hpp>
#include <boost/geometry/core/cs.hpp>
#include <boost/geometry/util/math.hpp>


namespace boost { namespace geometry
{

namespace math 
{

#ifndef DOXYGEN_NO_DETAIL
namespace detail
{


template <typename CoordinateType, typename Units>
struct constants_on_spheroid
{
    static inline CoordinateType period()
    {
        return math::two_pi<CoordinateType>();
    }

    static inline CoordinateType half_period()
    {
        return math::pi<CoordinateType>();
    }

    static inline CoordinateType min_longitude()
    {
        static CoordinateType const minus_pi = -math::pi<CoordinateType>();
        return minus_pi;
    }

    static inline CoordinateType max_longitude()
    {
        return math::pi<CoordinateType>();
    }

    static inline CoordinateType min_latitude()
    {
        static CoordinateType const minus_half_pi
            = -math::half_pi<CoordinateType>();
        return minus_half_pi;
    }

    static inline CoordinateType max_latitude()
    {
        return math::half_pi<CoordinateType>();
    }
};

template <typename CoordinateType>
struct constants_on_spheroid<CoordinateType, degree>
{
    static inline CoordinateType period()
    {
        return CoordinateType(360.0);
    }

    static inline CoordinateType half_period()
    {
        return CoordinateType(180.0);
    }

    static inline CoordinateType min_longitude()
    {
        return CoordinateType(-180.0);
    }

    static inline CoordinateType max_longitude()
    {
        return CoordinateType(180.0);
    }

    static inline CoordinateType min_latitude()
    {
        return CoordinateType(-90.0);
    }

    static inline CoordinateType max_latitude()
    {
        return CoordinateType(90.0);
    }
};


template <typename Units, typename CoordinateType>
class normalize_spheroidal_coordinates
{
    typedef constants_on_spheroid<CoordinateType, Units> constants;

protected:
    static inline CoordinateType normalize_up(CoordinateType const& value)
    {
        return
            math::mod(value + constants::half_period(), constants::period())
            - constants::half_period();            
    }

    static inline CoordinateType normalize_down(CoordinateType const& value)
    {
        return
            math::mod(value - constants::half_period(), constants::period())
            + constants::half_period();            
    }

public:
    static inline void apply(CoordinateType& longitude)
    {
        // normalize longitude
        if (math::equals(math::abs(longitude), constants::half_period()))
        {
            longitude = constants::half_period();
        }
        else if (longitude > constants::half_period())
        {
            longitude = normalize_up(longitude);
            if (math::equals(longitude, -constants::half_period()))
            {
                longitude = constants::half_period();
            }
        }
        else if (longitude < -constants::half_period())
        {
            longitude = normalize_down(longitude);
        }
    }

    static inline void apply(CoordinateType& longitude,
                             CoordinateType& latitude,
                             bool normalize_poles = true)
    {
#ifdef BOOST_GEOMETRY_NORMALIZE_LATITUDE
        // normalize latitude
        if (math::larger(latitude, constants::half_period()))
        {
            latitude = normalize_up(latitude);
        }
        else if (math::smaller(latitude, -constants::half_period()))
        {
            latitude = normalize_down(latitude);
        }

        // fix latitude range
        if (latitude < constants::min_latitude())
        {
            latitude = -constants::half_period() - latitude;
            longitude -= constants::half_period();
        }
        else if (latitude > constants::max_latitude())
        {
            latitude = constants::half_period() - latitude;
            longitude -= constants::half_period();
        }
#endif // BOOST_GEOMETRY_NORMALIZE_LATITUDE

        // normalize longitude
        apply(longitude);

        // finally normalize poles
        if (normalize_poles)
        {
            if (math::equals(math::abs(latitude), constants::max_latitude()))
            {
                // for the north and south pole we set the longitude to 0
                // (works for both radians and degrees)
                longitude = CoordinateType(0);
            }
        }

#ifdef BOOST_GEOMETRY_NORMALIZE_LATITUDE
        BOOST_GEOMETRY_ASSERT(! math::larger(constants::min_latitude(), latitude));
        BOOST_GEOMETRY_ASSERT(! math::larger(latitude, constants::max_latitude()));
#endif // BOOST_GEOMETRY_NORMALIZE_LATITUDE

        BOOST_GEOMETRY_ASSERT(math::smaller(constants::min_longitude(), longitude));
        BOOST_GEOMETRY_ASSERT(! math::larger(longitude, constants::max_longitude()));
    }
};


} // namespace detail
#endif // DOXYGEN_NO_DETAIL


/*!
\brief Short utility to normalize the coordinates on a spheroid
\tparam Units The units of the coordindate system in the spheroid
\tparam CoordinateType The type of the coordinates
\param longitude Longitude
\param latitude Latitude
\ingroup utility
*/
template <typename Units, typename CoordinateType>
inline void normalize_spheroidal_coordinates(CoordinateType& longitude,
                                             CoordinateType& latitude)
{
    detail::normalize_spheroidal_coordinates
        <
            Units, CoordinateType
        >::apply(longitude, latitude);
}


/*!
\brief Short utility to normalize the longitude on a spheroid.
       Note that in general both coordinates should be normalized at once.
       This utility is suitable e.g. for normalization of the difference of longitudes.
\tparam Units The units of the coordindate system in the spheroid
\tparam CoordinateType The type of the coordinates
\param longitude Longitude
\ingroup utility
*/
template <typename Units, typename CoordinateType>
inline void normalize_longitude(CoordinateType& longitude)
{
    detail::normalize_spheroidal_coordinates
        <
            Units, CoordinateType
        >::apply(longitude);
}


/*!
\brief Short utility to calculate difference between two longitudes
       normalized in range (-180, 180].
\tparam Units The units of the coordindate system in the spheroid
\tparam CoordinateType The type of the coordinates
\param longitude1 Longitude 1
\param longitude2 Longitude 2
\ingroup utility
*/
template <typename Units, typename CoordinateType>
inline CoordinateType longitude_distance_signed(CoordinateType const& longitude1,
                                                CoordinateType const& longitude2)
{
    CoordinateType diff = longitude2 - longitude1;
    math::normalize_longitude<Units, CoordinateType>(diff);
    return diff;
}


/*!
\brief Short utility to calculate difference between two longitudes
       normalized in range [0, 360).
\tparam Units The units of the coordindate system in the spheroid
\tparam CoordinateType The type of the coordinates
\param longitude1 Longitude 1
\param longitude2 Longitude 2
\ingroup utility
*/
template <typename Units, typename CoordinateType>
inline CoordinateType longitude_distance_unsigned(CoordinateType const& longitude1,
                                                  CoordinateType const& longitude2)
{
    typedef math::detail::constants_on_spheroid
        <
            CoordinateType, Units
        > constants;

    CoordinateType const c0 = 0;
    CoordinateType diff = longitude_distance_signed<Units>(longitude1, longitude2);
    if (diff < c0) // (-180, 180] -> [0, 360)
    {
        diff += constants::period();
    }
    return diff;
}

} // namespace math


}} // namespace boost::geometry

#endif // BOOST_GEOMETRY_UTIL_NORMALIZE_SPHEROIDAL_COORDINATES_HPP
