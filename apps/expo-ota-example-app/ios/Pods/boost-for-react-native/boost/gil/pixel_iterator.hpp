/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://opensource.adobe.com/gil for most recent version including documentation.
*/

/*************************************************************************************************/

#ifndef GIL_PIXEL_ITERATOR_H
#define GIL_PIXEL_ITERATOR_H

////////////////////////////////////////////////////////////////////////////////////////
/// \file               
/// \brief pixel iterator support
/// \author Lubomir Bourdev and Hailin Jin \n
///         Adobe Systems Incorporated
/// \date   2005-2007 \n May 16, 2006
///
////////////////////////////////////////////////////////////////////////////////////////

#include <cassert>
#include <iterator>
#include "gil_config.hpp"
#include "gil_concept.hpp"
#include "utilities.hpp"
#include "pixel.hpp"

namespace boost { namespace gil {

//forwarded declaration (as this file is included in step_iterator.hpp)
template <typename Iterator>
class memory_based_step_iterator;

template <typename Iterator> struct dynamic_x_step_type;

/// \brief metafunction predicate determining whether the given iterator is a plain one or an adaptor over another iterator.
/// Examples of adaptors are the step iterator and the dereference iterator adaptor.
template <typename It>
struct is_iterator_adaptor : public mpl::false_{};

/// \brief returns the base iterator for a given iterator adaptor. Provide an specialization when introducing new iterator adaptors
template <typename It>
struct iterator_adaptor_get_base;

/// \brief Changes the base iterator of an iterator adaptor. Provide an specialization when introducing new iterator adaptors
template <typename It, typename NewBaseIt>
struct iterator_adaptor_rebind;

/// \brief Returns the type of an iterator just like the input iterator, except operating over immutable values
template <typename It>
struct const_iterator_type;

// The default implementation when the iterator is a C pointer is to use the standard constness semantics
template <typename T> struct const_iterator_type<      T*> { typedef const T* type; };
template <typename T> struct const_iterator_type<const T*> { typedef const T* type; };

/// \brief Metafunction predicate returning whether the given iterator allows for changing its values
/// \ingroup GILIsMutable
template <typename It>
struct iterator_is_mutable{};

// The default implementation when the iterator is a C pointer is to use the standard constness semantics
template <typename T> struct iterator_is_mutable<      T*> : public mpl::true_{};
template <typename T> struct iterator_is_mutable<const T*> : public mpl::false_{};

/// \defgroup PixelIteratorModelInterleavedPtr C pointer to a pixel
/// \ingroup PixelIteratorModel
/// \brief Iterators over interleaved pixels.
/// A C pointer to a model of PixelValueConcept is used as an iterator over interleaved pixels. Models PixelIteratorConcept, HomogeneousPixelBasedConcept, HasDynamicXStepTypeConcept, MemoryBasedIteratorConcept



/////////////////////////////
//  HasDynamicXStepTypeConcept
/////////////////////////////

/// \ingroup PixelIteratorModelInterleavedPtr 
template <typename Pixel>
struct dynamic_x_step_type<Pixel*> {
    typedef memory_based_step_iterator<Pixel*> type;
};

/// \ingroup PixelIteratorModelInterleavedPtr 
template <typename Pixel>
struct dynamic_x_step_type<const Pixel*> {
    typedef memory_based_step_iterator<const Pixel*> type;
};


/////////////////////////////
//  PixelBasedConcept
/////////////////////////////

template <typename Pixel> struct color_space_type<      Pixel*> : public color_space_type<Pixel> {};
template <typename Pixel> struct color_space_type<const Pixel*> : public color_space_type<Pixel> {};

template <typename Pixel> struct channel_mapping_type<      Pixel*> : public channel_mapping_type<Pixel> {};
template <typename Pixel> struct channel_mapping_type<const Pixel*> : public channel_mapping_type<Pixel> {};

template <typename Pixel> struct is_planar<      Pixel*> : public is_planar<Pixel> {};
template <typename Pixel> struct is_planar<const Pixel*> : public is_planar<Pixel> {};

/////////////////////////////
//  HomogeneousPixelBasedConcept
/////////////////////////////

template <typename Pixel> struct channel_type<Pixel*> : public channel_type<Pixel> {};
template <typename Pixel> struct channel_type<const Pixel*> : public channel_type<Pixel> {};

////////////////////////////////////////////////////////////////////////////////////////
///
/// Support for pixel iterator movement measured in memory units (bytes or bits) as opposed to pixel type. \n
/// Necessary to handle image row alignment and channel plane alignment.
///
////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////
//  MemoryBasedIteratorConcept
/////////////////////////////

template <typename T>
struct byte_to_memunit : public mpl::int_<1> {};

template <typename P>
inline std::ptrdiff_t memunit_step(const P*) { return sizeof(P); }

template <typename P>
inline std::ptrdiff_t memunit_distance(const P* p1, const P* p2) { 
    return (gil_reinterpret_cast_c<const unsigned char*>(p2)-gil_reinterpret_cast_c<const unsigned char*>(p1)); 
}

template <typename P>
inline void memunit_advance(P* &p, std::ptrdiff_t diff) { 
    p=(P*)((unsigned char*)(p)+diff);
}

template <typename P>
inline P* memunit_advanced(const P* p, std::ptrdiff_t diff) {
    return (P*)((char*)(p)+diff);
}

//  memunit_advanced_ref
//  (shortcut to advancing a pointer by a given number of memunits and taking the reference in case the compiler is not smart enough)

template <typename P>
inline P& memunit_advanced_ref(P* p, std::ptrdiff_t diff) {
    return *memunit_advanced(p,diff);
}

} }  // namespace boost::gil

#endif
