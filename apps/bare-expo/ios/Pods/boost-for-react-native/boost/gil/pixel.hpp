/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://opensource.adobe.com/gil for most recent version including documentation.
*/
/*************************************************************************************************/

#ifndef GIL_PIXEL_H
#define GIL_PIXEL_H

////////////////////////////////////////////////////////////////////////////////////////
/// \file               
/// \brief pixel class and related utilities
/// \author Lubomir Bourdev and Hailin Jin \n
///         Adobe Systems Incorporated
/// \date   2005-2007 \n Last updated on September 28, 2006
///
////////////////////////////////////////////////////////////////////////////////////////

#include <functional>
#include <boost/utility/enable_if.hpp>
#include <boost/mpl/bool.hpp>
#include <boost/mpl/front.hpp>
#include <boost/type_traits.hpp>
#include "gil_config.hpp"
#include "color_base.hpp"
#include "gil_concept.hpp"
#include "channel.hpp"
#include "metafunctions.hpp"
#include "utilities.hpp"
#include "color_base_algorithm.hpp"

namespace boost { namespace gil {

// Forward-declare gray_t
struct gray_color_t;
typedef mpl::vector1<gray_color_t> gray_t;
template <typename PixelBased> struct color_space_type;
template <typename PixelBased> struct channel_mapping_type;
template <typename PixelBased> struct channel_type;
template <typename PixelBased> struct is_planar;

template <typename PixelBased> struct color_space_type<const PixelBased> : public color_space_type<PixelBased> {};
template <typename PixelBased> struct channel_mapping_type<const PixelBased> : public channel_mapping_type<PixelBased> {};
template <typename PixelBased> struct channel_type<const PixelBased> : public channel_type<PixelBased> {};

template <typename PixelBased> struct is_planar : mpl::false_ {};
template <typename PixelBased> struct is_planar<const PixelBased> : public is_planar<PixelBased> {};


template <typename T> struct is_pixel : public mpl::false_{};
template <typename T> struct is_pixel<const T> : public is_pixel<T> {};

/// \ingroup PixelBasedAlgorithm
/// \brief Returns the number of channels of a pixel-based GIL construct
template <typename PixelBased>
struct num_channels : public mpl::size<typename color_space_type<PixelBased>::type> {}; 

/**
\addtogroup PixelBasedAlgorithm

Example:
\code
BOOST_STATIC_ASSERT((num_channels<rgb8_view_t>::value==3));
BOOST_STATIC_ASSERT((num_channels<cmyk16_planar_ptr_t>::value==4));

BOOST_STATIC_ASSERT((is_planar<rgb16_planar_image_t>::value));
BOOST_STATIC_ASSERT((is_same<color_space_type<rgb8_planar_ref_t>::type, rgb_t>::value));
BOOST_STATIC_ASSERT((is_same<channel_mapping_type<cmyk8_pixel_t>::type, 
                             channel_mapping_type<rgba8_pixel_t>::type>::value));
BOOST_STATIC_ASSERT((is_same<channel_type<bgr8_pixel_t>::type, bits8>::value));
\endcode
*/

/// \defgroup ColorBaseModelPixel pixel 
/// \ingroup ColorBaseModel
/// \brief A homogeneous color base whose element is a channel value. Models HomogeneousColorBaseValueConcept

/// \defgroup PixelModelPixel pixel 
/// \ingroup PixelModel
/// \brief A homogeneous pixel value. Models HomogeneousPixelValueConcept

/// \ingroup PixelModelPixel ColorBaseModelPixel PixelBasedModel
/// \brief Represents a pixel value (a container of channels). Models: HomogeneousColorBaseValueConcept, PixelValueConcept, HomogeneousPixelBasedConcept
/// 
/// A pixel is a set of channels defining the color at a given point in an image. Conceptually, a pixel is little more than a color base whose elements 
/// model \p ChannelConcept. The class \p pixel defines a simple, homogeneous pixel value. It is used to store 
/// the value of a color. The built-in C++ references to \p pixel, \p pixel& and \p const \p pixel& are used to represent a reference to a pixel
/// inside an interleaved image view (a view in which all channels are together in memory). Similarly, built-in pointer types \p pixel* and \p const \p pixel*
/// are used as the standard iterator over a row of interleaved homogeneous pixels. 
///
/// Since \p pixel inherits the properties of color base, assigning, equality comparison and copy-construcion are allowed between compatible pixels.
/// This means that an 8-bit RGB pixel may be assigned to an 8-bit BGR pixel, or to an 8-bit planar reference. The channels are properly paired semantically.
///
/// The single-channel (grayscale) instantiation of the class pixel, (i.e. \p pixel<T,gray_layout_t>) is also convertible to/from a channel value.
/// This allows grayscale pixels to be used in simpler expressions like *gray_pix1 = *gray_pix2  instead of more complicated at_c<0>(gray_pix1) = at_c<0>(gray_pix2)
/// or get_color<gray_color_t>(gray_pix1) = get_color<gray_color_t>(gray_pix2)

template <typename ChannelValue, typename Layout> // = mpl::range_c<int,0,ColorSpace::size> >
struct pixel : public detail::homogeneous_color_base<ChannelValue,Layout,mpl::size<typename Layout::color_space_t>::value> {
private:
    typedef ChannelValue channel_t;
    typedef detail::homogeneous_color_base<ChannelValue,Layout,mpl::size<typename Layout::color_space_t>::value> parent_t;
public:
    typedef pixel                               value_type;
    typedef value_type&                         reference;
    typedef const value_type&                   const_reference;
    BOOST_STATIC_CONSTANT(bool,                 is_mutable = channel_traits<channel_t>::is_mutable);

    pixel(){}
    explicit pixel(channel_t v) : parent_t(v) {}  // sets all channels to v
    pixel(channel_t v0, channel_t v1)                                                         : parent_t(v0,v1) {}
    pixel(channel_t v0, channel_t v1, channel_t v2)                                           : parent_t(v0,v1,v2) {}
    pixel(channel_t v0, channel_t v1, channel_t v2, channel_t v3)                             : parent_t(v0,v1,v2,v3) {}
    pixel(channel_t v0, channel_t v1, channel_t v2, channel_t v3, channel_t v4)               : parent_t(v0,v1,v2,v3,v4) {}
    pixel(channel_t v0, channel_t v1, channel_t v2, channel_t v3, channel_t v4, channel_t v5) : parent_t(v0,v1,v2,v3,v4,v5) {}

    pixel(const pixel& p) : parent_t(p) {}
    pixel&                       operator=(const pixel& p)       { static_copy(p,*this); return *this; }

    // Construct from another compatible pixel type
    template <typename Pixel>    pixel(const Pixel& p, typename enable_if_c<is_pixel<Pixel>::value>::type* dummy = 0) : parent_t(p) { 
        check_compatible<Pixel>();
    }   

    template <typename P> pixel& operator=(const P& p)           { assign(p, mpl::bool_<is_pixel<P>::value>()); return *this; } 
    template <typename P> bool   operator==(const P& p)    const { return equal(p, mpl::bool_<is_pixel<P>::value>()); } 

    template <typename P> bool   operator!=(const P& p)    const { return !(*this==p); }

    // homogeneous pixels have operator[]
    typename channel_traits<channel_t>::reference       operator[](std::size_t i)       { return dynamic_at_c(*this,i); }
    typename channel_traits<channel_t>::const_reference operator[](std::size_t i) const { return dynamic_at_c(*this,i); }
private:
    template <typename Pixel> void assign(const Pixel& p, mpl::true_)       { check_compatible<Pixel>(); static_copy(p,*this); } 
    template <typename Pixel> bool  equal(const Pixel& p, mpl::true_) const { check_compatible<Pixel>(); return static_equal(*this,p); } 

    template <typename Pixel> void check_compatible() const { gil_function_requires<PixelsCompatibleConcept<Pixel,pixel> >(); }

// Support for assignment/equality comparison of a channel with a grayscale pixel

private:
    static void check_gray() {  BOOST_STATIC_ASSERT((is_same<typename Layout::color_space_t, gray_t>::value)); }
    template <typename Channel> void assign(const Channel& chan, mpl::false_)       { check_gray(); gil::at_c<0>(*this)=chan; }
    template <typename Channel> bool equal (const Channel& chan, mpl::false_) const { check_gray(); return gil::at_c<0>(*this)==chan; }
public:
    pixel&  operator= (channel_t chan)       { check_gray(); gil::at_c<0>(*this)=chan; return *this; }
    bool    operator==(channel_t chan) const { check_gray(); return gil::at_c<0>(*this)==chan; }
};

/////////////////////////////
//  ColorBasedConcept
/////////////////////////////

template <typename ChannelValue, typename Layout, int K>  
struct kth_element_type<pixel<ChannelValue,Layout>, K> {
    typedef ChannelValue type;
};

template <typename ChannelValue, typename Layout, int K>  
struct kth_element_reference_type<pixel<ChannelValue,Layout>, K> {
    typedef typename channel_traits<ChannelValue>::reference type;
};

template <typename ChannelValue, typename Layout, int K>  
struct kth_element_reference_type<const pixel<ChannelValue,Layout>, K> {
    typedef typename channel_traits<ChannelValue>::const_reference type;
};

template <typename ChannelValue, typename Layout, int K>  
struct kth_element_const_reference_type<pixel<ChannelValue,Layout>, K> {
    typedef typename channel_traits<ChannelValue>::const_reference type;
};

/////////////////////////////
//  PixelConcept
/////////////////////////////

template <typename ChannelValue, typename Layout> 
struct is_pixel<pixel<ChannelValue,Layout> > : public mpl::true_{};

/////////////////////////////
//  HomogeneousPixelBasedConcept
/////////////////////////////

template <typename ChannelValue, typename Layout>
struct color_space_type<pixel<ChannelValue,Layout> > {
    typedef typename Layout::color_space_t type;
}; 

template <typename ChannelValue, typename Layout>
struct channel_mapping_type<pixel<ChannelValue,Layout> > {
    typedef typename Layout::channel_mapping_t type;
}; 

template <typename ChannelValue, typename Layout>
struct is_planar<pixel<ChannelValue,Layout> > : public mpl::false_ {};

template <typename ChannelValue, typename Layout>
struct channel_type<pixel<ChannelValue,Layout> > {
    typedef ChannelValue type;
}; 

} }  // namespace boost::gil

namespace boost {
    template <typename ChannelValue, typename Layout> 
    struct has_trivial_constructor<gil::pixel<ChannelValue,Layout> > : public has_trivial_constructor<ChannelValue> {};
}
#endif
