// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2012 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2012 Mateusz Loskot, London, UK.

// This file was modified by Oracle on 2014-2016.
// Modifications copyright (c) 2014-2016 Oracle and/or its affiliates.

// Contributed and/or modified by Adam Wulkiewicz, on behalf of Oracle

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_STRATEGIES_STRATEGIES_HPP
#define BOOST_GEOMETRY_STRATEGIES_STRATEGIES_HPP


#include <boost/geometry/strategies/tags.hpp>

#include <boost/geometry/strategies/area.hpp>
#include <boost/geometry/strategies/buffer.hpp>
#include <boost/geometry/strategies/centroid.hpp>
#include <boost/geometry/strategies/compare.hpp>
#include <boost/geometry/strategies/convex_hull.hpp>
#include <boost/geometry/strategies/distance.hpp>
#include <boost/geometry/strategies/intersection.hpp>
#include <boost/geometry/strategies/intersection_strategies.hpp> // for backward compatibility
#include <boost/geometry/strategies/side.hpp>
#include <boost/geometry/strategies/transform.hpp>
#include <boost/geometry/strategies/within.hpp>

#include <boost/geometry/strategies/cartesian/area_surveyor.hpp>
#include <boost/geometry/strategies/cartesian/box_in_box.hpp>
#include <boost/geometry/strategies/cartesian/buffer_end_flat.hpp>
#include <boost/geometry/strategies/cartesian/buffer_end_round.hpp>
#include <boost/geometry/strategies/cartesian/buffer_join_miter.hpp>
#include <boost/geometry/strategies/cartesian/buffer_join_round.hpp>
#include <boost/geometry/strategies/cartesian/buffer_join_round_by_divide.hpp>
#include <boost/geometry/strategies/cartesian/buffer_point_circle.hpp>
#include <boost/geometry/strategies/cartesian/buffer_point_square.hpp>
#include <boost/geometry/strategies/cartesian/buffer_side_straight.hpp>
#include <boost/geometry/strategies/cartesian/centroid_average.hpp>
#include <boost/geometry/strategies/cartesian/centroid_bashein_detmer.hpp>
#include <boost/geometry/strategies/cartesian/centroid_weighted_length.hpp>
#include <boost/geometry/strategies/cartesian/distance_pythagoras.hpp>
#include <boost/geometry/strategies/cartesian/distance_pythagoras_point_box.hpp>
#include <boost/geometry/strategies/cartesian/distance_pythagoras_box_box.hpp>
#include <boost/geometry/strategies/cartesian/distance_projected_point.hpp>
#include <boost/geometry/strategies/cartesian/distance_projected_point_ax.hpp>
#include <boost/geometry/strategies/cartesian/point_in_box.hpp>
#include <boost/geometry/strategies/cartesian/point_in_poly_franklin.hpp>
#include <boost/geometry/strategies/cartesian/point_in_poly_crossings_multiply.hpp>
#include <boost/geometry/strategies/cartesian/side_by_triangle.hpp>

#include <boost/geometry/strategies/spherical/area_huiller.hpp>
#include <boost/geometry/strategies/spherical/distance_haversine.hpp>
#include <boost/geometry/strategies/spherical/distance_cross_track.hpp>
#include <boost/geometry/strategies/spherical/distance_cross_track_point_box.hpp>
#include <boost/geometry/strategies/spherical/compare_circular.hpp>
#include <boost/geometry/strategies/spherical/intersection.hpp>
#include <boost/geometry/strategies/spherical/ssf.hpp>

#include <boost/geometry/strategies/geographic/distance_andoyer.hpp>
#include <boost/geometry/strategies/geographic/distance_thomas.hpp>
#include <boost/geometry/strategies/geographic/distance_vincenty.hpp>
//#include <boost/geometry/strategies/geographic/side_andoyer.hpp>
//#include <boost/geometry/strategies/geographic/side_thomas.hpp>
//#include <boost/geometry/strategies/geographic/side_vincenty.hpp>

#include <boost/geometry/strategies/agnostic/buffer_distance_symmetric.hpp>
#include <boost/geometry/strategies/agnostic/buffer_distance_asymmetric.hpp>
#include <boost/geometry/strategies/agnostic/hull_graham_andrew.hpp>
#include <boost/geometry/strategies/agnostic/point_in_box_by_side.hpp>
#include <boost/geometry/strategies/agnostic/point_in_point.hpp>
#include <boost/geometry/strategies/agnostic/point_in_poly_winding.hpp>
#include <boost/geometry/strategies/agnostic/simplify_douglas_peucker.hpp>

#include <boost/geometry/strategies/agnostic/relate.hpp>

#include <boost/geometry/strategies/strategy_transform.hpp>

#include <boost/geometry/strategies/transform/matrix_transformers.hpp>
#include <boost/geometry/strategies/transform/map_transformer.hpp>
#include <boost/geometry/strategies/transform/inverse_transformer.hpp>


#endif // BOOST_GEOMETRY_STRATEGIES_STRATEGIES_HPP
