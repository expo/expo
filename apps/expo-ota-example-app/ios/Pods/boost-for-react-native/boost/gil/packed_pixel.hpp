/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://opensource.adobe.com/gil for most recent version including documentation.
*/

/*************************************************************************************************/

#ifndef GIL_PACKED_PIXEL_H
#define GIL_PACKED_PIXEL_H

////////////////////////////////////////////////////////////////////////////////////////
/// \file               
/// \brief A model of a heterogeneous pixel whose channels are bit ranges. For example 16-bit RGB in '565' format
/// \author Lubomir Bourdev and Hailin Jin \n
///         Adobe Systems Incorporated
/// \date   2005-2009 \n Last updated on February 20, 2009
///
////////////////////////////////////////////////////////////////////////////////////////

#include <functional>
#include <boost/utility/enable_if.hpp>
#include <boost/mpl/bool.hpp>
#include <boost/mpl/front.hpp>
#include "gil_config.hpp"
#include "pixel.hpp"

namespace boost { namespace gil {

/// \defgroup ColorBaseModelPackedPixel packed_pixel 
/// \ingroup ColorBaseModel
/// \brief A heterogeneous color base whose elements are reference proxies to channels in a pixel. Models ColorBaseValueConcept. This class is used to model packed pixels, such as 16-bit packed RGB.

/**
\defgroup PixelModelPackedPixel packed_pixel 
\ingroup PixelModel
\brief A heterogeneous pixel used to represent packed pixels with non-byte-aligned channels. Models PixelValueConcept

Example:
\code
typedef packed_pixel_type<uint16_t, mpl::vector3_c<unsigned,5,6,5>, rgb_layout_t>::type rgb565_pixel_t;
BOOST_STATIC_ASSERT((sizeof(rgb565_pixel_t)==2));

rgb565_pixel_t r565;
get_color(r565,red_t())   = 31;
get_color(r565,green_t()) = 63;
get_color(r565,blue_t())  = 31;
assert(r565 == rgb565_pixel_t((uint16_t)0xFFFF));    
\endcode
*/

/// \ingroup ColorBaseModelPackedPixel PixelModelPackedPixel PixelBasedModel
/// \brief Heterogeneous pixel value whose channel references can be constructed from the pixel bitfield and their index. Models ColorBaseValueConcept, PixelValueConcept, PixelBasedConcept
/// Typical use for this is a model of a packed pixel (like 565 RGB)
template <typename BitField,      // A type that holds the bits of the pixel. Typically an integral type, like boost::uint16_t
          typename ChannelRefVec, // An MPL vector whose elements are packed channels. They must be constructible from BitField. GIL uses packed_channel_reference
          typename Layout>        // Layout defining the color space and ordering of the channels. Example value: rgb_layout_t
struct packed_pixel {
    BitField _bitfield;

    typedef Layout                layout_t;
    typedef packed_pixel          value_type;
    typedef value_type&           reference;
    typedef const value_type&     const_reference;

    BOOST_STATIC_CONSTANT(bool, is_mutable = channel_traits<typename mpl::front<ChannelRefVec>::type>::is_mutable);

    packed_pixel(){}
    explicit packed_pixel(const BitField& bitfield) : _bitfield(bitfield) {}

    // Construct from another compatible pixel type
    packed_pixel(const packed_pixel& p) : _bitfield(p._bitfield) {}
    template <typename P> packed_pixel(const P& p, typename enable_if_c<is_pixel<P>::value>::type* d=0)            { check_compatible<P>(); static_copy(p,*this); }   
    packed_pixel(int chan0, int chan1) : _bitfield(0) { 
        BOOST_STATIC_ASSERT((num_channels<packed_pixel>::value==2)); 
        at_c<0>(*this)=chan0; at_c<1>(*this)=chan1; 
    } 
    packed_pixel(int chan0, int chan1, int chan2) : _bitfield(0) { 
        BOOST_STATIC_ASSERT((num_channels<packed_pixel>::value==3)); 
        gil::at_c<0>(*this)=chan0; gil::at_c<1>(*this)=chan1; gil::at_c<2>(*this)=chan2; 
    } 
    packed_pixel(int chan0, int chan1, int chan2, int chan3) : _bitfield(0) { 
        BOOST_STATIC_ASSERT((num_channels<packed_pixel>::value==4)); 
        gil::at_c<0>(*this)=chan0; gil::at_c<1>(*this)=chan1; gil::at_c<2>(*this)=chan2; gil::at_c<3>(*this)=chan3; 
    } 
    packed_pixel(int chan0, int chan1, int chan2, int chan3, int chan4) : _bitfield(0) { 
        BOOST_STATIC_ASSERT((num_channels<packed_pixel>::value==5)); 
        gil::at_c<0>(*this)=chan0; gil::at_c<1>(*this)=chan1; gil::at_c<2>(*this)=chan2; gil::at_c<3>(*this)=chan3; gil::at_c<4>(*this)=chan4;
    } 

    packed_pixel& operator=(const packed_pixel& p)     { _bitfield=p._bitfield; return *this; }

    template <typename P> packed_pixel& operator=(const P& p)        { assign(p, mpl::bool_<is_pixel<P>::value>()); return *this; } 
    template <typename P> bool          operator==(const P& p) const { return equal(p, mpl::bool_<is_pixel<P>::value>()); } 

    template <typename P> bool operator!=(const P& p) const { return !(*this==p); }

private:
    template <typename Pixel> static void check_compatible() { gil_function_requires<PixelsCompatibleConcept<Pixel,packed_pixel> >(); }
    template <typename Pixel> void assign(const Pixel& p, mpl::true_)       { check_compatible<Pixel>(); static_copy(p,*this); } 
    template <typename Pixel> bool  equal(const Pixel& p, mpl::true_) const { check_compatible<Pixel>(); return static_equal(*this,p); } 

// Support for assignment/equality comparison of a channel with a grayscale pixel
    static void check_gray() {  BOOST_STATIC_ASSERT((is_same<typename Layout::color_space_t, gray_t>::value)); }
    template <typename Channel> void assign(const Channel& chan, mpl::false_)       { check_gray(); at_c<0>(*this)=chan; }
    template <typename Channel> bool equal (const Channel& chan, mpl::false_) const { check_gray(); return at_c<0>(*this)==chan; }
public:
    packed_pixel&  operator= (int chan)       { check_gray(); at_c<0>(*this)=chan; return *this; }
    bool           operator==(int chan) const { check_gray(); return at_c<0>(*this)==chan; }
};

/////////////////////////////
//  ColorBasedConcept
/////////////////////////////

template <typename BitField, typename ChannelRefVec, typename Layout, int K>  
struct kth_element_type<packed_pixel<BitField,ChannelRefVec,Layout>,K> : public mpl::at_c<ChannelRefVec,K> {};

template <typename BitField, typename ChannelRefVec, typename Layout, int K>  
struct kth_element_reference_type<packed_pixel<BitField,ChannelRefVec,Layout>,K> : public mpl::at_c<ChannelRefVec,K> {};

template <typename BitField, typename ChannelRefVec, typename Layout, int K>  
struct kth_element_const_reference_type<packed_pixel<BitField,ChannelRefVec,Layout>,K> {
    typedef typename channel_traits<typename mpl::at_c<ChannelRefVec,K>::type>::const_reference type;
};

template <int K, typename P, typename C, typename L> inline
typename kth_element_reference_type<packed_pixel<P,C,L>, K>::type 
at_c(packed_pixel<P,C,L>& p) { 
    return typename kth_element_reference_type<packed_pixel<P,C,L>, K>::type(&p._bitfield); 
}

template <int K, typename P, typename C, typename L> inline
typename kth_element_const_reference_type<packed_pixel<P,C,L>, K>::type 
at_c(const packed_pixel<P,C,L>& p) { 
    return typename kth_element_const_reference_type<packed_pixel<P,C,L>, K>::type(&p._bitfield);
}

/////////////////////////////
//  PixelConcept
/////////////////////////////

// Metafunction predicate that flags packed_pixel as a model of PixelConcept. Required by PixelConcept
template <typename BitField, typename ChannelRefVec, typename Layout>  
struct is_pixel<packed_pixel<BitField,ChannelRefVec,Layout> > : public mpl::true_{};

/////////////////////////////
//  PixelBasedConcept
/////////////////////////////

template <typename P, typename C, typename Layout>
struct color_space_type<packed_pixel<P,C,Layout> > {
    typedef typename Layout::color_space_t type;
}; 

template <typename P, typename C, typename Layout>
struct channel_mapping_type<packed_pixel<P,C,Layout> > {
    typedef typename Layout::channel_mapping_t type;
}; 

template <typename P, typename C, typename Layout>
struct is_planar<packed_pixel<P,C,Layout> > : mpl::false_ {}; 


////////////////////////////////////////////////////////////////////////////////
///
/// Support for interleaved iterators over packed pixel
///
////////////////////////////////////////////////////////////////////////////////

/// \defgroup PixelIteratorModelPackedInterleavedPtr Pointer to packed_pixel<P,CR,Layout>
/// \ingroup PixelIteratorModel
/// \brief Iterators over interleaved pixels.
/// The pointer packed_pixel<P,CR,Layout>* is used as an iterator over interleaved pixels of packed format. Models PixelIteratorConcept, HasDynamicXStepTypeConcept, MemoryBasedIteratorConcept

template <typename P, typename C, typename L>  
struct iterator_is_mutable<packed_pixel<P,C,L>*> : public mpl::bool_<packed_pixel<P,C,L>::is_mutable> {};
template <typename P, typename C, typename L>  
struct iterator_is_mutable<const packed_pixel<P,C,L>*> : public mpl::false_ {};



} }  // namespace boost::gil

namespace boost {
    template <typename P, typename C, typename L>
    struct has_trivial_constructor<gil::packed_pixel<P,C,L> > : public has_trivial_constructor<P> {};
}
#endif
