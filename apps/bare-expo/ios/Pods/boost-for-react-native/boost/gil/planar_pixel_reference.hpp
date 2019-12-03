/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://stlab.adobe.com/gil for most recent version including documentation.
*/

/*************************************************************************************************/

#ifndef GIL_PLANAR_REF_H
#define GIL_PLANAR_REF_H

////////////////////////////////////////////////////////////////////////////////////////
/// \file               
/// \brief planar pixel reference class
/// \author Lubomir Bourdev and Hailin Jin \n
///         Adobe Systems Incorporated
/// \date   2005-2007 \n Last updated on September 28, 2006
///
////////////////////////////////////////////////////////////////////////////////////////

#include <boost/mpl/range_c.hpp>
#include "gil_config.hpp"
#include "gil_concept.hpp"
#include "color_base.hpp"
#include "channel.hpp"
#include "pixel.hpp"
#include "planar_pixel_iterator.hpp"

namespace boost { namespace gil {

/// \defgroup ColorBaseModelPlanarRef planar_pixel_reference 
/// \ingroup ColorBaseModel
/// \brief A homogeneous color base whose element is a channel reference. Models HomogeneousColorBaseConcept, HomogeneousPixelConcept.
/// This class is used as a reference proxy to a planar pixel.

/// \defgroup PixelModelPlanarRef planar_pixel_reference 
/// \ingroup PixelModel
/// \brief A reference proxy to a planar pixel. Models HomogeneousColorBaseConcept, HomogeneousPixelConcept.


/// \ingroup PixelModelPlanarRef ColorBaseModelPlanarRef PixelBasedModel
/// \brief A reference proxy to a planar pixel. Models: HomogeneousColorBaseConcept, HomogeneousPixelConcept
///
/// A reference to a planar pixel is a proxy class containing references to each of the corresponding channels.
/// 
template <typename ChannelReference, typename ColorSpace>        // ChannelReference is a channel reference (const or mutable)
struct planar_pixel_reference 
   : public detail::homogeneous_color_base<ChannelReference,layout<ColorSpace>,mpl::size<ColorSpace>::value> {
    typedef detail::homogeneous_color_base<ChannelReference,layout<ColorSpace>,mpl::size<ColorSpace>::value> parent_t;
private:
    // These three are only defined for homogeneous pixels
    typedef typename channel_traits<ChannelReference>::value_type      channel_t;
    typedef typename channel_traits<ChannelReference>::const_reference channel_const_reference;
public:
    BOOST_STATIC_CONSTANT(bool, is_mutable = channel_traits<ChannelReference>::is_mutable);
    typedef pixel<channel_t,layout<ColorSpace> >                       value_type;
    typedef planar_pixel_reference                                     reference;
    typedef planar_pixel_reference<channel_const_reference,ColorSpace> const_reference;

    planar_pixel_reference(ChannelReference v0, ChannelReference v1) : parent_t(v0,v1) {}
    planar_pixel_reference(ChannelReference v0, ChannelReference v1, ChannelReference v2) : parent_t(v0,v1,v2) {}
    planar_pixel_reference(ChannelReference v0, ChannelReference v1, ChannelReference v2, ChannelReference v3) : parent_t(v0,v1,v2,v3) {}
    planar_pixel_reference(ChannelReference v0, ChannelReference v1, ChannelReference v2, ChannelReference v3, ChannelReference v4) : parent_t(v0,v1,v2,v3,v4) {}
    planar_pixel_reference(ChannelReference v0, ChannelReference v1, ChannelReference v2, ChannelReference v3, ChannelReference v4, ChannelReference v5) : parent_t(v0,v1,v2,v3,v4,v5) {}

    template <typename P>                         planar_pixel_reference(const P& p)        : parent_t(p) { check_compatible<P>();}

    // PERFORMANCE_CHECK: Is this constructor necessary?
    template <typename ChannelV, typename Mapping>           
    planar_pixel_reference(pixel<ChannelV,layout<ColorSpace,Mapping> >& p)   : parent_t(p) { check_compatible<pixel<ChannelV,layout<ColorSpace,Mapping> > >();}

    // Construct at offset from a given location
    template <typename ChannelPtr> planar_pixel_reference(const planar_pixel_iterator<ChannelPtr,ColorSpace>& p, std::ptrdiff_t diff) : parent_t(p,diff) {}

    const planar_pixel_reference&                             operator=(const planar_pixel_reference& p)  const { static_copy(p,*this); return *this; }
    template <typename P> const planar_pixel_reference&       operator=(const P& p)           const { check_compatible<P>(); static_copy(p,*this); return *this; }

// This overload is necessary for a compiler implementing Core Issue 574
// to prevent generation of an implicit copy assignment operator (the reason
// for generating implicit copy assignment operator is that according to
// Core Issue 574, a cv-qualified assignment operator is not considered
// "copy assignment operator").
// EDG implemented Core Issue 574 starting with EDG Version 3.8. I'm not
// sure why they did it for a template member function as well.
#if BOOST_WORKAROUND(__HP_aCC, >= 61700) || BOOST_WORKAROUND(__INTEL_COMPILER, >= 1000)
    const planar_pixel_reference& operator=(const planar_pixel_reference& p) { static_copy(p,*this); return *this; }
    template <typename P> const planar_pixel_reference& operator=(const P& p) { check_compatible<P>(); static_copy(p,*this); return *this; }
#endif

    template <typename P> bool                    operator==(const P& p)    const { check_compatible<P>(); return static_equal(*this,p); }
    template <typename P> bool                    operator!=(const P& p)    const { return !(*this==p); }

    ChannelReference                              operator[](std::size_t i) const { return this->at_c_dynamic(i); }

    const planar_pixel_reference*     operator->()              const { return this; }
private:
    template <typename Pixel> static void check_compatible() { gil_function_requires<PixelsCompatibleConcept<Pixel,planar_pixel_reference> >(); }
};

/////////////////////////////
//  ColorBasedConcept
/////////////////////////////

template <typename ChannelReference, typename ColorSpace, int K>  
struct kth_element_type<planar_pixel_reference<ChannelReference,ColorSpace>, K> {
    typedef ChannelReference type;
};

template <typename ChannelReference, typename ColorSpace, int K>  
struct kth_element_reference_type<planar_pixel_reference<ChannelReference,ColorSpace>, K> {
    typedef ChannelReference type;
};

template <typename ChannelReference, typename ColorSpace, int K>  
struct kth_element_const_reference_type<planar_pixel_reference<ChannelReference,ColorSpace>, K> 
    : public add_reference<typename add_const<ChannelReference>::type> 
{
//    typedef typename channel_traits<ChannelReference>::const_reference type;
};

/////////////////////////////
//  PixelConcept
/////////////////////////////

/// \brief Metafunction predicate that flags planar_pixel_reference as a model of PixelConcept. Required by PixelConcept
/// \ingroup PixelModelPlanarRef
template <typename ChannelReference, typename ColorSpace>  
struct is_pixel< planar_pixel_reference<ChannelReference,ColorSpace> > : public mpl::true_{};

/////////////////////////////
//  HomogeneousPixelBasedConcept
/////////////////////////////

/// \brief Specifies the color space type of a planar pixel reference. Required by PixelBasedConcept
/// \ingroup PixelModelPlanarRef
template <typename ChannelReference, typename ColorSpace>  
struct color_space_type<planar_pixel_reference<ChannelReference,ColorSpace> > {
    typedef ColorSpace type;
}; 

/// \brief Specifies the color space type of a planar pixel reference. Required by PixelBasedConcept
/// \ingroup PixelModelPlanarRef
template <typename ChannelReference, typename ColorSpace>  
struct channel_mapping_type<planar_pixel_reference<ChannelReference,ColorSpace> > {
    typedef typename layout<ColorSpace>::channel_mapping_t type;
}; 

/// \brief Specifies that planar_pixel_reference represents a planar construct. Required by PixelBasedConcept
/// \ingroup PixelModelPlanarRef
template <typename ChannelReference, typename ColorSpace>  
struct is_planar<planar_pixel_reference<ChannelReference,ColorSpace> > : mpl::true_ {};

/// \brief Specifies the color space type of a planar pixel reference. Required by HomogeneousPixelBasedConcept
/// \ingroup PixelModelPlanarRef
template <typename ChannelReference, typename ColorSpace>  
struct channel_type<planar_pixel_reference<ChannelReference,ColorSpace> > {
    typedef typename channel_traits<ChannelReference>::value_type type;
}; 

} }  // namespace boost::gil

namespace std {
// We are forced to define swap inside std namespace because on some platforms (Visual Studio 8) STL calls swap qualified.
// swap with 'left bias': 
// - swap between proxy and anything
// - swap between value type and proxy
// - swap between proxy and proxy
// Having three overloads allows us to swap between different (but compatible) models of PixelConcept

/// \brief  swap for planar_pixel_reference
/// \ingroup PixelModelPlanarRef
template <typename CR, typename CS, typename R> inline
void swap(const boost::gil::planar_pixel_reference<CR,CS> x, R& y) { 
    boost::gil::swap_proxy<typename boost::gil::planar_pixel_reference<CR,CS>::value_type>(x,y); 
}


/// \brief  swap for planar_pixel_reference
/// \ingroup PixelModelPlanarRef
template <typename CR, typename CS> inline
void swap(typename boost::gil::planar_pixel_reference<CR,CS>::value_type& x, const boost::gil::planar_pixel_reference<CR,CS> y) { 
    boost::gil::swap_proxy<typename boost::gil::planar_pixel_reference<CR,CS>::value_type>(x,y); 
}


/// \brief  swap for planar_pixel_reference
/// \ingroup PixelModelPlanarRef
template <typename CR, typename CS> inline
void swap(const boost::gil::planar_pixel_reference<CR,CS> x, const boost::gil::planar_pixel_reference<CR,CS> y) { 
    boost::gil::swap_proxy<typename boost::gil::planar_pixel_reference<CR,CS>::value_type>(x,y); 
}
}   // namespace std

#endif
