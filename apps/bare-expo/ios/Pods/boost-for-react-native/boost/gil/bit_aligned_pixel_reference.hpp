/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://stlab.adobe.com/gil for most recent version including documentation.
*/

/*************************************************************************************************/

#ifndef GIL_BIT_ALIGNED_PIXEL_REFERENCE_HPP
#define GIL_BIT_ALIGNED_PIXEL_REFERENCE_HPP

////////////////////////////////////////////////////////////////////////////////////////
/// \file               
/// \brief A model of a heterogeneous pixel that is not byte aligned. Examples are bitmap (1-bit pixels) or 6-bit RGB (222)
/// \author Lubomir Bourdev and Hailin Jin \n
///         Adobe Systems Incorporated
/// \date   2005-2007 \n Last updated on September 28, 2006
///
////////////////////////////////////////////////////////////////////////////////////////

#include <functional>
#include <boost/mpl/accumulate.hpp>
#include <boost/mpl/at.hpp>
#include <boost/mpl/bool.hpp>
#include <boost/mpl/if.hpp>
#include <boost/mpl/plus.hpp>
#include <boost/mpl/push_back.hpp>
#include <boost/mpl/vector.hpp>
#include "gil_config.hpp"
#include "pixel.hpp"
#include "channel.hpp"

namespace boost { namespace gil {

/////////////////////////////
//  bit_range
//
//  Represents a range of bits that can span multiple consecutive bytes. The range has a size fixed at compile time, but the offset is specified at run time.
/////////////////////////////
 
template <int RangeSize, bool Mutable>
class bit_range {
public:
    typedef typename mpl::if_c<Mutable,unsigned char,const unsigned char>::type byte_t;
    typedef std::ptrdiff_t difference_type;
    template <int RS, bool M> friend class bit_range;
private:
    byte_t* _current_byte;   // the starting byte of the bit range
    int     _bit_offset;     // offset from the beginning of the current byte. 0<=_bit_offset<=7

public:
    bit_range() : _current_byte(NULL), _bit_offset(0) {}
    bit_range(byte_t* current_byte, int bit_offset) : _current_byte(current_byte), _bit_offset(bit_offset) { assert(bit_offset>=0 && bit_offset<8); } 

    bit_range(const bit_range& br) : _current_byte(br._current_byte), _bit_offset(br._bit_offset) {}
    template <bool M> bit_range(const bit_range<RangeSize,M>& br) : _current_byte(br._current_byte), _bit_offset(br._bit_offset) {}

    bit_range& operator=(const bit_range& br) { _current_byte = br._current_byte; _bit_offset=br._bit_offset; return *this; }
    bool operator==(const bit_range& br) const { return  _current_byte==br._current_byte && _bit_offset==br._bit_offset; }

    bit_range& operator++() {
        _current_byte += (_bit_offset+RangeSize) / 8;
        _bit_offset    = (_bit_offset+RangeSize) % 8;
        return *this;
    }
    bit_range& operator--() { bit_advance(-RangeSize); return *this; }

    void bit_advance(difference_type num_bits) {
        int new_offset = int(_bit_offset+num_bits);
        _current_byte += new_offset / 8;
        _bit_offset    = new_offset % 8;
        if (_bit_offset<0) {
            _bit_offset+=8;
            --_current_byte;
        }
    }
    difference_type bit_distance_to(const bit_range& b) const {
        return (b.current_byte() - current_byte())*8 + b.bit_offset()-bit_offset();
    }
    byte_t* current_byte() const { return _current_byte; }
    int     bit_offset()   const { return _bit_offset; }
};


/// \defgroup ColorBaseModelNonAlignedPixel bit_aligned_pixel_reference 
/// \ingroup ColorBaseModel
/// \brief A heterogeneous color base representing pixel that may not be byte aligned, i.e. it may correspond to a bit range that does not start/end at a byte boundary. Models ColorBaseConcept.

/**
\defgroup PixelModelNonAlignedPixel bit_aligned_pixel_reference 
\ingroup PixelModel
\brief A heterogeneous pixel reference used to represent non-byte-aligned pixels. Models PixelConcept

Example:
\code
unsigned char data=0;

// A mutable reference to a 6-bit BGR pixel in "123" format (1 bit for red, 2 bits for green, 3 bits for blue)
typedef const bit_aligned_pixel_reference<unsigned char, mpl::vector3_c<int,1,2,3>, rgb_layout_t, true>  rgb123_ref_t;

// create the pixel reference at bit offset 2
// (i.e. red = [2], green = [3,4], blue = [5,6,7] bits)
rgb123_ref_t ref(&data, 2); 
get_color(ref, red_t()) = 1;
assert(data == 0x04);
get_color(ref, green_t()) = 3;
assert(data == 0x1C);
get_color(ref, blue_t()) = 7;
assert(data == 0xFC);
\endcode
*/
/// \ingroup ColorBaseModelNonAlignedPixel PixelModelNonAlignedPixel PixelBasedModel
/// \brief Heterogeneous pixel reference corresponding to non-byte-aligned bit range. Models ColorBaseConcept, PixelConcept, PixelBasedConcept
template <typename BitField,
          typename ChannelBitSizes,  // MPL integral vector defining the number of bits for each channel. For example, for 565RGB, vector_c<int,5,6,5>
          typename Layout, 
          bool IsMutable>
struct bit_aligned_pixel_reference {
    BOOST_STATIC_CONSTANT(int, bit_size = (mpl::accumulate<ChannelBitSizes, mpl::int_<0>, mpl::plus<mpl::_1, mpl::_2> >::type::value));
    typedef boost::gil::bit_range<bit_size,IsMutable>                                           bit_range_t;
    typedef BitField                                                                bitfield_t;  
    typedef typename mpl::if_c<IsMutable,unsigned char*,const unsigned char*>::type data_ptr_t;

    typedef Layout layout_t;

    typedef typename packed_pixel_type<bitfield_t,ChannelBitSizes,Layout>::type       value_type;
    typedef const bit_aligned_pixel_reference                                         reference;
    typedef const bit_aligned_pixel_reference<BitField,ChannelBitSizes,Layout,false>  const_reference;

    BOOST_STATIC_CONSTANT(bool, is_mutable = IsMutable);

    bit_aligned_pixel_reference(){}
    bit_aligned_pixel_reference(data_ptr_t data_ptr, int bit_offset)   : _bit_range(data_ptr, bit_offset) {}
    explicit bit_aligned_pixel_reference(const bit_range_t& bit_range) : _bit_range(bit_range) {}
    template <bool IsMutable2> bit_aligned_pixel_reference(const bit_aligned_pixel_reference<BitField,ChannelBitSizes,Layout,IsMutable2>& p) : _bit_range(p._bit_range) {}

    // Grayscale references can be constructed from the channel reference
    explicit bit_aligned_pixel_reference(const typename kth_element_type<bit_aligned_pixel_reference,0>::type channel0) : _bit_range(static_cast<data_ptr_t>(&channel0), channel0.first_bit()) {
        BOOST_STATIC_ASSERT((num_channels<bit_aligned_pixel_reference>::value==1));
    }

    // Construct from another compatible pixel type
    bit_aligned_pixel_reference(const bit_aligned_pixel_reference& p) : _bit_range(p._bit_range) {}
    template <typename BF, typename CR> bit_aligned_pixel_reference(packed_pixel<BF,CR,Layout>& p) : _bit_range(static_cast<data_ptr_t>(&gil::at_c<0>(p)), gil::at_c<0>(p).first_bit()) {
        check_compatible<packed_pixel<BF,CR,Layout> >();
    }

    const bit_aligned_pixel_reference& operator=(const bit_aligned_pixel_reference& p) const { static_copy(p,*this); return *this; }
    template <typename P> const bit_aligned_pixel_reference& operator=(const P& p) const { assign(p, mpl::bool_<is_pixel<P>::value>()); return *this; } 

    template <typename P> bool operator==(const P& p) const { return equal(p, mpl::bool_<is_pixel<P>::value>()); } 
    template <typename P> bool operator!=(const P& p) const { return !(*this==p); }

    const bit_aligned_pixel_reference* operator->()    const { return this; }

    const bit_range_t& bit_range() const { return _bit_range; }
private:
    mutable bit_range_t _bit_range;
    template <typename B, typename C, typename L, bool M> friend struct bit_aligned_pixel_reference;

    template <typename Pixel> static void check_compatible() { gil_function_requires<PixelsCompatibleConcept<Pixel,bit_aligned_pixel_reference> >(); }

    template <typename Pixel> void assign(const Pixel& p, mpl::true_) const { check_compatible<Pixel>(); static_copy(p,*this); } 
    template <typename Pixel> bool  equal(const Pixel& p, mpl::true_) const { check_compatible<Pixel>(); return static_equal(*this,p); } 

private:
    static void check_gray() {  BOOST_STATIC_ASSERT((is_same<typename Layout::color_space_t, gray_t>::value)); }
    template <typename Channel> void assign(const Channel& chan, mpl::false_) const { check_gray(); gil::at_c<0>(*this)=chan; }
    template <typename Channel> bool equal (const Channel& chan, mpl::false_) const { check_gray(); return gil::at_c<0>(*this)==chan; }
};

/////////////////////////////
//  ColorBasedConcept
/////////////////////////////

template <typename BitField, typename ChannelBitSizes, typename L, bool IsMutable, int K>  
struct kth_element_type<bit_aligned_pixel_reference<BitField,ChannelBitSizes,L,IsMutable>, K> {
public:
    typedef const packed_dynamic_channel_reference<BitField, mpl::at_c<ChannelBitSizes,K>::type::value, IsMutable> type;
};

template <typename B, typename C, typename L, bool M, int K>  
struct kth_element_reference_type<bit_aligned_pixel_reference<B,C,L,M>, K>
    : public kth_element_type<bit_aligned_pixel_reference<B,C,L,M>, K> {};

template <typename B, typename C, typename L, bool M, int K>  
struct kth_element_const_reference_type<bit_aligned_pixel_reference<B,C,L,M>, K>
    : public kth_element_type<bit_aligned_pixel_reference<B,C,L,M>, K> {};


namespace detail {
    // returns sum of IntegralVector[0] ... IntegralVector[K-1]
    template <typename IntegralVector, int K> 
    struct sum_k : public mpl::plus<sum_k<IntegralVector,K-1>, typename mpl::at_c<IntegralVector,K-1>::type > {};

    template <typename IntegralVector> struct sum_k<IntegralVector,0> : public mpl::int_<0> {};
}

// at_c required by MutableColorBaseConcept
template <int K, typename BitField, typename ChannelBitSizes, typename L, bool Mutable> inline
typename kth_element_reference_type<bit_aligned_pixel_reference<BitField,ChannelBitSizes,L,Mutable>,K>::type
at_c(const bit_aligned_pixel_reference<BitField,ChannelBitSizes,L,Mutable>& p) { 
    typedef bit_aligned_pixel_reference<BitField,ChannelBitSizes,L,Mutable> pixel_t;
    typedef typename kth_element_reference_type<pixel_t,K>::type channel_t;
    typedef typename pixel_t::bit_range_t bit_range_t;

    bit_range_t bit_range(p.bit_range());
    bit_range.bit_advance(detail::sum_k<ChannelBitSizes,K>::value);

    return channel_t(bit_range.current_byte(), bit_range.bit_offset()); 
}

/////////////////////////////
//  PixelConcept
/////////////////////////////

/// Metafunction predicate that flags bit_aligned_pixel_reference as a model of PixelConcept. Required by PixelConcept
template <typename B, typename C, typename L, bool M>  
struct is_pixel<bit_aligned_pixel_reference<B,C,L,M> > : public mpl::true_{};

/////////////////////////////
//  PixelBasedConcept
/////////////////////////////

template <typename B, typename C, typename L, bool M>
struct color_space_type<bit_aligned_pixel_reference<B,C,L,M> > {
    typedef typename L::color_space_t type;
}; 

template <typename B, typename C, typename L, bool M>
struct channel_mapping_type<bit_aligned_pixel_reference<B,C,L,M> > {
    typedef typename L::channel_mapping_t type;
}; 

template <typename B, typename C, typename L, bool M>
struct is_planar<bit_aligned_pixel_reference<B,C,L,M> > : mpl::false_ {}; 

/////////////////////////////
//  pixel_reference_type
/////////////////////////////

namespace detail {
    // returns a vector containing K copies of the type T
    template <unsigned K, typename T> struct k_copies;
    template <typename T> struct k_copies<0,T> {
        typedef mpl::vector0<> type;
    };
    template <unsigned K, typename T> struct k_copies : public mpl::push_back<typename k_copies<K-1,T>::type, T> {};
}

// Constructs a homogeneous bit_aligned_pixel_reference given a channel reference
template <typename BitField, int NumBits, typename Layout> 
struct pixel_reference_type<const packed_dynamic_channel_reference<BitField,NumBits,false>, Layout, false, false> {
private:
    typedef typename mpl::size<typename Layout::color_space_t>::type size_t;
    typedef typename detail::k_copies<size_t::value,mpl::integral_c<unsigned,NumBits> >::type channel_bit_sizes_t;
public:
    typedef bit_aligned_pixel_reference<BitField, channel_bit_sizes_t, Layout, false> type;
};

// Same but for the mutable case. We cannot combine the mutable and read-only cases because this triggers ambiguity
template <typename BitField, int NumBits, typename Layout> 
struct pixel_reference_type<const packed_dynamic_channel_reference<BitField,NumBits,true>, Layout, false, true> {
private:
    typedef typename mpl::size<typename Layout::color_space_t>::type size_t;
    typedef typename detail::k_copies<size_t::value,mpl::integral_c<unsigned,NumBits> >::type channel_bit_sizes_t;
public:
    typedef bit_aligned_pixel_reference<BitField, channel_bit_sizes_t, Layout, true> type;
};

} }  // namespace boost::gil

namespace std {
// We are forced to define swap inside std namespace because on some platforms (Visual Studio 8) STL calls swap qualified.
// swap with 'left bias': 
// - swap between proxy and anything
// - swap between value type and proxy
// - swap between proxy and proxy
// Having three overloads allows us to swap between different (but compatible) models of PixelConcept

template <typename B, typename C, typename L, typename R> inline
void swap(const boost::gil::bit_aligned_pixel_reference<B,C,L,true> x, R& y) { 
    boost::gil::swap_proxy<typename boost::gil::bit_aligned_pixel_reference<B,C,L,true>::value_type>(x,y); 
}


template <typename B, typename C, typename L> inline
void swap(typename boost::gil::bit_aligned_pixel_reference<B,C,L,true>::value_type& x, const boost::gil::bit_aligned_pixel_reference<B,C,L,true> y) { 
    boost::gil::swap_proxy<typename boost::gil::bit_aligned_pixel_reference<B,C,L,true>::value_type>(x,y); 
}


template <typename B, typename C, typename L> inline
void swap(const boost::gil::bit_aligned_pixel_reference<B,C,L,true> x, const boost::gil::bit_aligned_pixel_reference<B,C,L,true> y) { 
    boost::gil::swap_proxy<typename boost::gil::bit_aligned_pixel_reference<B,C,L,true>::value_type>(x,y); 
}
}   // namespace std
#endif
