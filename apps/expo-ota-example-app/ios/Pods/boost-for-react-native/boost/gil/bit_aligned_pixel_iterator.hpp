/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://opensource.adobe.com/gil for most recent version including documentation.
*/

/*************************************************************************************************/

#ifndef GIL_BIT_ALIGNED_PIXEL_ITERATOR_HPP
#define GIL_BIT_ALIGNED_PIXEL_ITERATOR_HPP

////////////////////////////////////////////////////////////////////////////////////////
/// \file               
/// \brief A model of a heterogeneous pixel that is not byte aligned. Examples are bitmap (1-bit pixels) or 6-bit RGB (222)
/// \author Lubomir Bourdev and Hailin Jin \n
///         Adobe Systems Incorporated
/// \date   2005-2007 \n Last updated on September 28, 2006
///
////////////////////////////////////////////////////////////////////////////////////////

#include <functional>
#include <boost/iterator/iterator_facade.hpp>
#include "gil_config.hpp"
#include "bit_aligned_pixel_reference.hpp"
#include "pixel_iterator.hpp"

namespace boost { namespace gil {

/// \defgroup PixelIteratorNonAlignedPixelIterator bit_aligned_pixel_iterator
/// \ingroup PixelIteratorModel
/// \brief An iterator over non-byte-aligned pixels. Models PixelIteratorConcept, PixelBasedConcept, MemoryBasedIteratorConcept, HasDynamicXStepTypeConcept

////////////////////////////////////////////////////////////////////////////////////////
/// \brief An iterator over non-byte-aligned pixels. Models PixelIteratorConcept, PixelBasedConcept, MemoryBasedIteratorConcept, HasDynamicXStepTypeConcept
///
/// An iterator over pixels that correspond to non-byte-aligned bit ranges. Examples of such pixels are single bit grayscale pixel, or a 6-bit RGB 222 pixel.
/// 
/// \ingroup PixelIteratorNonAlignedPixelIterator PixelBasedModel

template <typename NonAlignedPixelReference>
struct bit_aligned_pixel_iterator : public iterator_facade<bit_aligned_pixel_iterator<NonAlignedPixelReference>,
                                                  typename NonAlignedPixelReference::value_type,
                                                  std::random_access_iterator_tag,
                                                  const NonAlignedPixelReference,
                                                  typename NonAlignedPixelReference::bit_range_t::difference_type> {
private:
    typedef iterator_facade<bit_aligned_pixel_iterator<NonAlignedPixelReference>,
                            typename NonAlignedPixelReference::value_type,
                            std::random_access_iterator_tag,
                            const NonAlignedPixelReference,
                            typename NonAlignedPixelReference::bit_range_t::difference_type> parent_t;
    template <typename Ref> friend struct bit_aligned_pixel_iterator;

    typedef typename NonAlignedPixelReference::bit_range_t bit_range_t;
public:
    typedef typename parent_t::difference_type             difference_type;
    typedef typename parent_t::reference                   reference;

    bit_aligned_pixel_iterator() {}
    bit_aligned_pixel_iterator(const bit_aligned_pixel_iterator& p) : _bit_range(p._bit_range) {}
    bit_aligned_pixel_iterator& operator=(const bit_aligned_pixel_iterator& p) { _bit_range=p._bit_range; return *this; }

    template <typename Ref> bit_aligned_pixel_iterator(const bit_aligned_pixel_iterator<Ref>& p) : _bit_range(p._bit_range) {}

    bit_aligned_pixel_iterator(reference* ref) : _bit_range(ref->bit_range()) {}
    explicit bit_aligned_pixel_iterator(typename bit_range_t::byte_t* data, int bit_offset=0) : _bit_range(data,bit_offset) {}

    /// For some reason operator[] provided by iterator_adaptor returns a custom class that is convertible to reference
    /// We require our own reference because it is registered in iterator_traits
    reference operator[](difference_type d) const { bit_aligned_pixel_iterator it=*this; it.advance(d); return *it; }

    reference operator->()         const { return **this; }
    const bit_range_t& bit_range() const { return _bit_range; }
          bit_range_t& bit_range()       { return _bit_range; }
private:
    bit_range_t _bit_range;
    BOOST_STATIC_CONSTANT(int, bit_size = NonAlignedPixelReference::bit_size);

    friend class boost::iterator_core_access;
    reference dereference()     const { return NonAlignedPixelReference(_bit_range); }
    void increment()                  { ++_bit_range; }
    void decrement()                  { --_bit_range; }
    void advance(difference_type d)   { _bit_range.bit_advance(d*bit_size); }

    difference_type distance_to(const bit_aligned_pixel_iterator& it) const { return _bit_range.bit_distance_to(it._bit_range) / bit_size; }
    bool equal(const bit_aligned_pixel_iterator& it) const { return _bit_range==it._bit_range; }
};

template <typename NonAlignedPixelReference> 
struct const_iterator_type<bit_aligned_pixel_iterator<NonAlignedPixelReference> > { 
    typedef bit_aligned_pixel_iterator<typename NonAlignedPixelReference::const_reference> type; 
};

template <typename NonAlignedPixelReference> 
struct iterator_is_mutable<bit_aligned_pixel_iterator<NonAlignedPixelReference> > : public mpl::bool_<NonAlignedPixelReference::is_mutable> {};

template <typename NonAlignedPixelReference> 
struct is_iterator_adaptor<bit_aligned_pixel_iterator<NonAlignedPixelReference> > : public mpl::false_ {};

/////////////////////////////
//  PixelBasedConcept
/////////////////////////////

template <typename NonAlignedPixelReference>
struct color_space_type<bit_aligned_pixel_iterator<NonAlignedPixelReference> > : public color_space_type<NonAlignedPixelReference> {};

template <typename NonAlignedPixelReference>
struct channel_mapping_type<bit_aligned_pixel_iterator<NonAlignedPixelReference> > : public channel_mapping_type<NonAlignedPixelReference> {};

template <typename NonAlignedPixelReference>
struct is_planar<bit_aligned_pixel_iterator<NonAlignedPixelReference> > : public is_planar<NonAlignedPixelReference> {}; // == false

/////////////////////////////
//  MemoryBasedIteratorConcept
/////////////////////////////

template <typename NonAlignedPixelReference>
struct byte_to_memunit<bit_aligned_pixel_iterator<NonAlignedPixelReference> > : public mpl::int_<8> {};

template <typename NonAlignedPixelReference>
inline std::ptrdiff_t memunit_step(const bit_aligned_pixel_iterator<NonAlignedPixelReference>&) { 
    return NonAlignedPixelReference::bit_size; 
}

template <typename NonAlignedPixelReference>
inline std::ptrdiff_t memunit_distance(const bit_aligned_pixel_iterator<NonAlignedPixelReference>& p1, const bit_aligned_pixel_iterator<NonAlignedPixelReference>& p2) { 
    return (p2.bit_range().current_byte() - p1.bit_range().current_byte())*8 + p2.bit_range().bit_offset() - p1.bit_range().bit_offset(); 
}

template <typename NonAlignedPixelReference>
inline void memunit_advance(bit_aligned_pixel_iterator<NonAlignedPixelReference>& p, std::ptrdiff_t diff) { 
    p.bit_range().bit_advance(diff);
}

template <typename NonAlignedPixelReference>
inline bit_aligned_pixel_iterator<NonAlignedPixelReference> memunit_advanced(const bit_aligned_pixel_iterator<NonAlignedPixelReference>& p, std::ptrdiff_t diff) {
    bit_aligned_pixel_iterator<NonAlignedPixelReference> ret=p;
    memunit_advance(ret, diff);
    return ret;
}

template <typename NonAlignedPixelReference> inline
NonAlignedPixelReference memunit_advanced_ref(bit_aligned_pixel_iterator<NonAlignedPixelReference> it, std::ptrdiff_t diff) {
    return *memunit_advanced(it,diff);
}
/////////////////////////////
//  HasDynamicXStepTypeConcept
/////////////////////////////

template <typename NonAlignedPixelReference>
struct dynamic_x_step_type<bit_aligned_pixel_iterator<NonAlignedPixelReference> > {
    typedef memory_based_step_iterator<bit_aligned_pixel_iterator<NonAlignedPixelReference> > type;
};

/////////////////////////////
//  iterator_type_from_pixel
/////////////////////////////

template <typename B, typename C, typename L, bool M>
struct iterator_type_from_pixel<const bit_aligned_pixel_reference<B,C,L,M>,false,false,false> {
    typedef bit_aligned_pixel_iterator<bit_aligned_pixel_reference<B,C,L,false> > type;
};

template <typename B, typename C, typename L, bool M>
struct iterator_type_from_pixel<const bit_aligned_pixel_reference<B,C,L,M>,false,false,true> {
    typedef bit_aligned_pixel_iterator<bit_aligned_pixel_reference<B,C,L,true> > type;
};

template <typename B, typename C, typename L, bool M, bool IsPlanar, bool IsStep, bool IsMutable>
struct iterator_type_from_pixel<bit_aligned_pixel_reference<B,C,L,M>,IsPlanar,IsStep,IsMutable>
    : public iterator_type_from_pixel<const bit_aligned_pixel_reference<B,C,L,M>,IsPlanar,IsStep,IsMutable> {};

} }  // namespace boost::gil

namespace std {

// It is important to provide an overload of uninitialized_copy for bit_aligned_pixel_iterator. The default STL implementation calls placement new,
// which is not defined for bit_aligned_pixel_iterator. 
template <typename NonAlignedPixelReference>
boost::gil::bit_aligned_pixel_iterator<NonAlignedPixelReference> uninitialized_copy(boost::gil::bit_aligned_pixel_iterator<NonAlignedPixelReference> first, 
                                                                                   boost::gil::bit_aligned_pixel_iterator<NonAlignedPixelReference> last,
                                                                                   boost::gil::bit_aligned_pixel_iterator<NonAlignedPixelReference> dst) {
    return std::copy(first,last,dst);
}

}   // namespace std
#endif
