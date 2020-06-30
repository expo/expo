/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://opensource.adobe.com/gil for most recent version including documentation.
*/

/*************************************************************************************************/

#ifndef GIL_CMYK_H
#define GIL_CMYK_H

////////////////////////////////////////////////////////////////////////////////////////
/// \file
/// \brief Support for CMYK color space and variants
/// \author Lubomir Bourdev and Hailin Jin \n
///         Adobe Systems Incorporated
/// \date 2005-2007 \n Last updated on October 10, 2007
////////////////////////////////////////////////////////////////////////////////////////

#include <cstddef>
#include "gil_config.hpp"
#include "metafunctions.hpp"
#include <boost/mpl/range_c.hpp>
#include <boost/mpl/vector_c.hpp>

namespace boost { namespace gil {


/// \addtogroup ColorNameModel
/// \{

/// \brief Cyan
struct cyan_t {};    

/// \brief Magenta
struct magenta_t {};

/// \brief Yellow
struct yellow_t {}; 

/// \brief Black
struct black_t {};
/// \}

/// \ingroup ColorSpaceModel
typedef mpl::vector4<cyan_t,magenta_t,yellow_t,black_t>  cmyk_t;

/// \ingroup LayoutModel
typedef layout<cmyk_t> cmyk_layout_t;

/// \ingroup ImageViewConstructors
/// \brief from raw CMYK planar data
template <typename IC>
inline typename type_from_x_iterator<planar_pixel_iterator<IC,cmyk_t> >::view_t
planar_cmyk_view(std::size_t width, std::size_t height, IC c, IC m, IC y, IC k, std::ptrdiff_t rowsize_in_bytes) {
    typedef typename type_from_x_iterator<planar_pixel_iterator<IC,cmyk_t> >::view_t RView;
    return RView(width, height, typename RView::locator(planar_pixel_iterator<IC,cmyk_t>(c,m,y,k), rowsize_in_bytes));
}

} }  // namespace gil

#endif
