/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://opensource.adobe.com/gil for most recent version including documentation.
*/

/*************************************************************************************************/

#ifndef GIL_METAFUNCTIONS_HPP
#define GIL_METAFUNCTIONS_HPP

////////////////////////////////////////////////////////////////////////////////////////
/// \file               
/// \brief metafunctions that construct types or return type properties
/// \author Lubomir Bourdev and Hailin Jin \n
///         Adobe Systems Incorporated
///
/// \date 2005-2007 \n Last updated on February 6, 2007
///
////////////////////////////////////////////////////////////////////////////////////////

#include <iterator>
#include <boost/mpl/accumulate.hpp>
#include <boost/mpl/back.hpp>
#include <boost/mpl/bool.hpp>
#include <boost/mpl/if.hpp>
#include <boost/mpl/pop_back.hpp>
#include <boost/mpl/push_back.hpp>
#include <boost/mpl/transform.hpp>
#include <boost/mpl/vector.hpp>
#include <boost/type_traits.hpp>
#include "gil_config.hpp"
#include "gil_concept.hpp"
#include "channel.hpp"

namespace boost { namespace gil {

// forward declarations
template <typename T, typename L> struct pixel;
template <typename BitField,typename ChannelRefVec,typename Layout> struct packed_pixel;
template <typename T, typename C> struct planar_pixel_reference;
template <typename IC, typename C> struct planar_pixel_iterator;
template <typename I> class memory_based_step_iterator;
template <typename I> class memory_based_2d_locator;
template <typename L> class image_view;
template <typename Pixel, bool IsPlanar, typename Alloc> class image;
template <typename T> struct channel_type;
template <typename T> struct color_space_type;
template <typename T> struct channel_mapping_type;
template <typename It> struct is_iterator_adaptor;
template <typename It> struct iterator_adaptor_get_base;
template <typename BitField, typename ChannelBitSizes, typename Layout, bool IsMutable> struct bit_aligned_pixel_reference;

//////////////////////////////////////////////////
///
///  TYPE ANALYSIS METAFUNCTIONS
///  Predicate metafunctions determining properties of GIL types
///
//////////////////////////////////////////////////


/// \defgroup GILIsBasic xxx_is_basic
/// \ingroup TypeAnalysis
/// \brief Determines if GIL constructs are basic. 
///    Basic constructs are the ones that can be generated with the type 
///    factory methods pixel_reference_type, iterator_type, locator_type, view_type and image_type
///    They can be mutable/immutable, planar/interleaved, step/nonstep. They must use GIL-provided models.

/// \brief Determines if a given pixel reference is basic
///    Basic references must use gil::pixel& (if interleaved), gil::planar_pixel_reference (if planar). They must use the standard constness rules. 
/// \ingroup GILIsBasic
template <typename PixelRef>        struct pixel_reference_is_basic                     : public mpl::false_ {};
template <typename T,  typename L>  struct pixel_reference_is_basic<      pixel<T,L>&>  : public mpl::true_ {};
template <typename T,  typename L>  struct pixel_reference_is_basic<const pixel<T,L>&>  : public mpl::true_ {};
template <typename TR, typename Cs> struct pixel_reference_is_basic<planar_pixel_reference<TR,Cs> > : public mpl::true_ {};
template <typename TR, typename Cs> struct pixel_reference_is_basic<const planar_pixel_reference<TR,Cs> > : public mpl::true_ {};


/// \brief Determines if a given pixel iterator is basic
///    Basic iterators must use gil::pixel (if interleaved), gil::planar_pixel_iterator (if planar) and gil::memory_based_step_iterator (if step). They must use the standard constness rules. 
/// \ingroup GILIsBasic
template <typename Iterator>
struct iterator_is_basic : public mpl::false_ {};
template <typename T, typename L>  // mutable   interleaved
struct iterator_is_basic<      pixel<T,L>*      > : public mpl::true_ {};
template <typename T, typename L>  // immutable interleaved
struct iterator_is_basic<const pixel<T,L>*      > : public mpl::true_ {};
template <typename T, typename Cs>  // mutable   planar
struct iterator_is_basic<planar_pixel_iterator<      T*,Cs> > : public mpl::true_ {};
template <typename T, typename Cs>    // immutable planar
struct iterator_is_basic<planar_pixel_iterator<const T*,Cs> > : public mpl::true_ {};
template <typename T, typename L>  // mutable   interleaved step
struct iterator_is_basic<memory_based_step_iterator<      pixel<T,L>*> > : public mpl::true_ {};
template <typename T, typename L>  // immutable interleaved step
struct iterator_is_basic<memory_based_step_iterator<const pixel<T,L>*> > : public mpl::true_ {};
template <typename T, typename Cs>  // mutable   planar step
struct iterator_is_basic<memory_based_step_iterator<planar_pixel_iterator<      T*,Cs> > > : public mpl::true_ {};
template <typename T, typename Cs>    // immutable planar step
struct iterator_is_basic<memory_based_step_iterator<planar_pixel_iterator<const T*,Cs> > > : public mpl::true_ {};


/// \ingroup GILIsBasic
/// \brief Determines if a given locator is basic. A basic locator is memory-based and has basic x_iterator and y_iterator
template <typename Loc> struct locator_is_basic : public mpl::false_ {};
template <typename Iterator> struct locator_is_basic<memory_based_2d_locator<memory_based_step_iterator<Iterator> > > : public iterator_is_basic<Iterator> {};

/// \ingroup GILIsBasic
/// \brief Basic views must be over basic locators
template <typename View> struct view_is_basic : public mpl::false_ {};
template <typename Loc> struct view_is_basic<image_view<Loc> > : public locator_is_basic<Loc> {};

/// \ingroup GILIsBasic
/// \brief Basic images must use basic views and std::allocator of char
template <typename Img> struct image_is_basic : public mpl::false_ {};
template <typename Pixel, bool IsPlanar, typename Alloc> struct image_is_basic<image<Pixel,IsPlanar,Alloc> > : public mpl::true_ {};


/// \defgroup GILIsStep xxx_is_step
/// \ingroup TypeAnalysis
/// \brief Determines if the given iterator/locator/view has a step that could be set dynamically

template <typename I> struct iterator_is_step;
namespace detail {
    template <typename It, bool IsBase, bool EqualsStepType> struct iterator_is_step_impl;
    // iterator that has the same type as its dynamic_x_step_type must be a step iterator
    template <typename It, bool IsBase> struct iterator_is_step_impl<It,IsBase,true> : public mpl::true_{};

    // base iterator can never be a step iterator
    template <typename It> struct iterator_is_step_impl<It,true,false> : public mpl::false_{};

    // for an iterator adaptor, see if its base is step
    template <typename It> struct iterator_is_step_impl<It,false,false> 
        : public iterator_is_step<typename iterator_adaptor_get_base<It>::type>{};
}

/// \ingroup GILIsStep
/// \brief Determines if the given iterator has a step that could be set dynamically
template <typename I> struct iterator_is_step 
    : public detail::iterator_is_step_impl<I, 
        !is_iterator_adaptor<I>::type::value,
        is_same<I,typename dynamic_x_step_type<I>::type>::value >{};

/// \ingroup GILIsStep
/// \brief Determines if the given locator has a horizontal step that could be set dynamically
template <typename L> struct locator_is_step_in_x : public iterator_is_step<typename L::x_iterator> {}; 

/// \ingroup GILIsStep
/// \brief Determines if the given locator has a vertical step that could be set dynamically
template <typename L> struct locator_is_step_in_y : public iterator_is_step<typename L::y_iterator> {}; 

/// \ingroup GILIsStep
/// \brief Determines if the given view has a horizontal step that could be set dynamically
template <typename V> struct view_is_step_in_x : public locator_is_step_in_x<typename V::xy_locator> {}; 

/// \ingroup GILIsStep
/// \brief Determines if the given view has a vertical step that could be set dynamically
template <typename V> struct view_is_step_in_y : public locator_is_step_in_y<typename V::xy_locator> {}; 

/// \brief Determines whether the given pixel reference is a proxy class or a native C++ reference
/// \ingroup TypeAnalysis
template <typename PixelReference>
struct pixel_reference_is_proxy
    : public mpl::not_<is_same<typename remove_const_and_reference<PixelReference>::type,
                               typename remove_const_and_reference<PixelReference>::type::value_type> > {};

/// \brief Given a model of a pixel, determines whether the model represents a pixel reference (as opposed to pixel value)
/// \ingroup TypeAnalysis
template <typename Pixel>
struct pixel_is_reference : public mpl::or_<is_reference<Pixel>, pixel_reference_is_proxy<Pixel> > {};

/// \defgroup GILIsMutable xxx_is_mutable
/// \ingroup TypeAnalysis
/// \brief Determines if the given pixel reference/iterator/locator/view is mutable (i.e. its pixels can be changed)

/// \ingroup GILIsMutable
/// \brief Determines if the given pixel reference is mutable (i.e. its channels can be changed)
///
/// Note that built-in C++ references obey the const qualifier but reference proxy classes do not.
template <typename R> struct pixel_reference_is_mutable : public mpl::bool_<remove_reference<R>::type::is_mutable> {};
template <typename R> struct pixel_reference_is_mutable<const R&>
    : public mpl::and_<pixel_reference_is_proxy<R>, pixel_reference_is_mutable<R> > {};

/// \ingroup GILIsMutable
/// \brief Determines if the given locator is mutable (i.e. its pixels can be changed)
template <typename L> struct locator_is_mutable : public iterator_is_mutable<typename L::x_iterator> {};
/// \ingroup GILIsMutable
/// \brief Determines if the given view is mutable (i.e. its pixels can be changed)
template <typename V> struct view_is_mutable : public iterator_is_mutable<typename V::x_iterator> {};


//////////////////////////////////////////////////
///
///  TYPE FACTORY METAFUNCTIONS
///  Metafunctions returning GIL types from other GIL types
///
//////////////////////////////////////////////////

/// \defgroup TypeFactoryFromElements xxx_type
/// \ingroup TypeFactory
/// \brief Returns the type of a homogeneous GIL construct given its elements (channel, layout, whether it is planar, step, mutable, etc.)

/// \defgroup TypeFactoryFromPixel xxx_type_from_pixel
/// \ingroup TypeFactory
/// \brief Returns the type of a GIL construct given its pixel type, whether it is planar, step, mutable, etc.

/// \defgroup TypeFactoryDerived derived_xxx_type
/// \ingroup TypeFactory
/// \brief Returns the type of a homogeneous GIL construct given a related construct by changing some of its properties

/// \ingroup TypeFactoryFromElements
/// \brief Returns the type of a homogeneous pixel reference given the channel type, layout, whether it operates on planar data and whether it is mutable
template <typename T, typename L, bool IsPlanar=false, bool IsMutable=true> struct pixel_reference_type{};
template <typename T, typename L> struct pixel_reference_type<T,L,false,true > { typedef pixel<T,L>& type; };
template <typename T, typename L> struct pixel_reference_type<T,L,false,false> { typedef const pixel<T,L>& type; };
template <typename T, typename L> struct pixel_reference_type<T,L,true,true> { typedef const planar_pixel_reference<typename channel_traits<T>::reference,typename color_space_type<L>::type> type; };       // TODO: Assert M=identity
template <typename T, typename L> struct pixel_reference_type<T,L,true,false> { typedef const planar_pixel_reference<typename channel_traits<T>::const_reference,typename color_space_type<L>::type> type; };// TODO: Assert M=identity

/// \ingroup TypeFactoryFromPixel
/// \brief Returns the type of a pixel iterator given the pixel type, whether it operates on planar data, whether it is a step iterator, and whether it is mutable
template <typename Pixel, bool IsPlanar=false, bool IsStep=false, bool IsMutable=true> struct iterator_type_from_pixel{};
template <typename Pixel> struct iterator_type_from_pixel<Pixel,false,false,true > { typedef Pixel* type; };
template <typename Pixel> struct iterator_type_from_pixel<Pixel,false,false,false> { typedef const Pixel* type; };
template <typename Pixel> struct iterator_type_from_pixel<Pixel,true,false,true> { 
    typedef planar_pixel_iterator<typename channel_traits<typename channel_type<Pixel>::type>::pointer,typename color_space_type<Pixel>::type> type; 
};
template <typename Pixel> struct iterator_type_from_pixel<Pixel,true,false,false> { 
    typedef planar_pixel_iterator<typename channel_traits<typename channel_type<Pixel>::type>::const_pointer,typename color_space_type<Pixel>::type> type; 
};
template <typename Pixel, bool IsPlanar, bool IsMutable> struct iterator_type_from_pixel<Pixel,IsPlanar,true,IsMutable> { 
    typedef memory_based_step_iterator<typename iterator_type_from_pixel<Pixel,IsPlanar,false,IsMutable>::type> type; 
};

/// \ingroup TypeFactoryFromElements
/// \brief Returns the type of a homogeneous iterator given the channel type, layout, whether it operates on planar data, whether it is a step iterator, and whether it is mutable
template <typename T, typename L, bool IsPlanar=false, bool IsStep=false, bool IsMutable=true> struct iterator_type{};
template <typename T, typename L> struct iterator_type<T,L,false,false,true > { typedef pixel<T,L>* type; };
template <typename T, typename L> struct iterator_type<T,L,false,false,false> { typedef const pixel<T,L>* type; };
template <typename T, typename L> struct iterator_type<T,L,true,false,true> { typedef planar_pixel_iterator<T*,typename L::color_space_t> type; };               // TODO: Assert M=identity
template <typename T, typename L> struct iterator_type<T,L,true,false,false> { typedef planar_pixel_iterator<const T*,typename L::color_space_t> type; };        // TODO: Assert M=identity
template <typename T, typename L, bool IsPlanar, bool IsMutable> struct iterator_type<T,L,IsPlanar,true,IsMutable> { 
    typedef memory_based_step_iterator<typename iterator_type<T,L,IsPlanar,false,IsMutable>::type> type; 
};

/// \brief Given a pixel iterator defining access to pixels along a row, returns the types of the corresponding built-in step_iterator, xy_locator, image_view
/// \ingroup TypeFactory
template <typename XIterator> 
struct type_from_x_iterator {
    typedef memory_based_step_iterator<XIterator>    step_iterator_t;
    typedef memory_based_2d_locator<step_iterator_t> xy_locator_t;
    typedef image_view<xy_locator_t>                     view_t;
};

namespace detail {
    template <typename BitField, typename FirstBit, typename NumBits>
    struct packed_channel_reference_type {
        typedef const packed_channel_reference<BitField,FirstBit::value,NumBits::value,true> type;
    };

    template <typename BitField, typename ChannelBitSizesVector>
    class packed_channel_references_vector_type {
        // If ChannelBitSizesVector is mpl::vector<int,7,7,2>
        // Then first_bits_vector will be mpl::vector<int,0,7,14,16>
        typedef typename mpl::accumulate<ChannelBitSizesVector, mpl::vector1<mpl::int_<0> >, 
            mpl::push_back<mpl::_1, mpl::plus<mpl::back<mpl::_1>, mpl::_2> > >::type first_bits_vector;
    public:
        typedef typename mpl::transform<typename mpl::pop_back<first_bits_vector>::type, ChannelBitSizesVector,
               packed_channel_reference_type<BitField, mpl::_1,mpl::_2> >::type type;
    };

}

/// \ingroup TypeFactoryFromElements
/// \brief Returns the type of a packed pixel given its bitfield type, the bit size of its channels and its layout.
///
/// A packed pixel has channels that cover bit ranges but itself is byte aligned. RGB565 pixel is an example.
///
/// The size of ChannelBitSizeVector must equal the number of channels in the given layout
/// The sum of bit sizes for all channels must be less than or equal to the number of bits in BitField (and cannot exceed 64).
///  If it is less than the number of bits in BitField, the last bits will be unused.
template <typename BitField, typename ChannelBitSizeVector, typename Layout>
struct packed_pixel_type {
    typedef packed_pixel<BitField, typename detail::packed_channel_references_vector_type<BitField,ChannelBitSizeVector>::type, Layout> type;
};

/// \defgroup TypeFactoryPacked packed_image_type,bit_aligned_image_type
/// \ingroup TypeFactoryFromElements
/// \brief Returns the type of an image whose channels are not byte-aligned. 
/// 
/// A packed image is an image whose pixels are byte aligned, such as "rgb565". <br>
/// A bit-aligned image is an image whose pixels are not byte aligned, such as "rgb222". <br>
/// 
/// The sum of the bit sizes of all channels cannot exceed 64.

/// \ingroup TypeFactoryPacked
/// \brief Returns the type of an interleaved packed image: an image whose channels may not be byte-aligned, but whose pixels are byte aligned.
template <typename BitField, typename ChannelBitSizeVector, typename Layout, typename Alloc=std::allocator<unsigned char> >
struct packed_image_type {
    typedef image<typename packed_pixel_type<BitField,ChannelBitSizeVector,Layout>::type,false,Alloc> type;
};

/// \ingroup TypeFactoryPacked
/// \brief Returns the type of a single-channel image given its bitfield type, the bit size of its channel and its layout
template <typename BitField, unsigned Size1, typename Layout, typename Alloc=std::allocator<unsigned char> >
struct packed_image1_type : public packed_image_type<BitField, mpl::vector1_c<unsigned, Size1>, Layout, Alloc> {};

/// \ingroup TypeFactoryPacked
/// \brief Returns the type of a two channel image given its bitfield type, the bit size of its channels and its layout
template <typename BitField, unsigned Size1, unsigned Size2, typename Layout, typename Alloc=std::allocator<unsigned char> >
struct packed_image2_type : public packed_image_type<BitField, mpl::vector2_c<unsigned, Size1, Size2>, Layout, Alloc> {};

/// \ingroup TypeFactoryPacked
/// \brief Returns the type of a three channel image given its bitfield type, the bit size of its channels and its layout
template <typename BitField, unsigned Size1, unsigned Size2, unsigned Size3, typename Layout, typename Alloc=std::allocator<unsigned char> >
struct packed_image3_type : public packed_image_type<BitField, mpl::vector3_c<unsigned, Size1, Size2, Size3>, Layout, Alloc> {};

/// \ingroup TypeFactoryPacked
/// \brief Returns the type of a four channel image given its bitfield type, the bit size of its channels and its layout
template <typename BitField, unsigned Size1, unsigned Size2, unsigned Size3, unsigned Size4, typename Layout, typename Alloc=std::allocator<unsigned char> >
struct packed_image4_type : public packed_image_type<BitField, mpl::vector4_c<unsigned, Size1, Size2, Size3, Size4>, Layout, Alloc> {};

/// \ingroup TypeFactoryPacked
/// \brief Returns the type of a five channel image given its bitfield type, the bit size of its channels and its layout
template <typename BitField, unsigned Size1, unsigned Size2, unsigned Size3, unsigned Size4, unsigned Size5, typename Layout, typename Alloc=std::allocator<unsigned char> >
struct packed_image5_type : public packed_image_type<BitField, mpl::vector5_c<unsigned, Size1, Size2, Size3, Size4, Size5>, Layout, Alloc> {};


/// \ingroup TypeFactoryPacked
/// \brief Returns the type of a packed image whose pixels may not be byte aligned. For example, an "rgb222" image is bit-aligned because its pixel spans six bits.
///
/// Note that the alignment parameter in the constructor of bit-aligned images is in bit units. For example, if you want to construct a bit-aligned
/// image whose rows are byte-aligned, use 8 as the alignment parameter, not 1.

template <typename ChannelBitSizeVector, typename Layout, typename Alloc=std::allocator<unsigned char> >
struct bit_aligned_image_type {
private:
    BOOST_STATIC_CONSTANT(int, bit_size = (mpl::accumulate<ChannelBitSizeVector, mpl::int_<0>, mpl::plus<mpl::_1, mpl::_2> >::type::value));
    typedef typename detail::min_fast_uint<bit_size+7>::type                        bitfield_t;  
    typedef const bit_aligned_pixel_reference<bitfield_t, ChannelBitSizeVector, Layout, true> bit_alignedref_t;
public:
    typedef image<bit_alignedref_t,false,Alloc> type;
};

/// \ingroup TypeFactoryPacked
/// \brief Returns the type of a single-channel bit-aligned image given the bit size of its channel and its layout
template <unsigned Size1, typename Layout, typename Alloc=std::allocator<unsigned char> >
struct bit_aligned_image1_type : public bit_aligned_image_type<mpl::vector1_c<unsigned, Size1>, Layout, Alloc> {};

/// \ingroup TypeFactoryPacked
/// \brief Returns the type of a two channel bit-aligned image given the bit size of its channels and its layout
template <unsigned Size1, unsigned Size2, typename Layout, typename Alloc=std::allocator<unsigned char> >
struct bit_aligned_image2_type : public bit_aligned_image_type<mpl::vector2_c<unsigned, Size1, Size2>, Layout, Alloc> {};

/// \ingroup TypeFactoryPacked
/// \brief Returns the type of a three channel bit-aligned image given the bit size of its channels and its layout
template <unsigned Size1, unsigned Size2, unsigned Size3, typename Layout, typename Alloc=std::allocator<unsigned char> >
struct bit_aligned_image3_type : public bit_aligned_image_type<mpl::vector3_c<unsigned, Size1, Size2, Size3>, Layout, Alloc> {};

/// \ingroup TypeFactoryPacked
/// \brief Returns the type of a four channel bit-aligned image given the bit size of its channels and its layout
template <unsigned Size1, unsigned Size2, unsigned Size3, unsigned Size4, typename Layout, typename Alloc=std::allocator<unsigned char> >
struct bit_aligned_image4_type : public bit_aligned_image_type<mpl::vector4_c<unsigned, Size1, Size2, Size3, Size4>, Layout, Alloc> {};

/// \ingroup TypeFactoryPacked
/// \brief Returns the type of a five channel bit-aligned image given the bit size of its channels and its layout
template <unsigned Size1, unsigned Size2, unsigned Size3, unsigned Size4, unsigned Size5, typename Layout, typename Alloc=std::allocator<unsigned char> >
struct bit_aligned_image5_type : public bit_aligned_image_type<mpl::vector5_c<unsigned, Size1, Size2, Size3, Size4, Size5>, Layout, Alloc> {};



/// \ingroup TypeFactoryFromElements
/// \brief Returns the type of a homogeneous pixel given the channel type and layout
template <typename Channel, typename Layout> 
struct pixel_value_type {
    typedef pixel<Channel,Layout> type;     // by default use gil::pixel. Specializations are provided for 
};

// Specializations for packed channels
template <typename BitField, int NumBits, bool IsMutable, typename Layout> 
struct pixel_value_type<      packed_dynamic_channel_reference<BitField,NumBits,IsMutable>,Layout> :
    public packed_pixel_type<BitField, mpl::vector1_c<unsigned,NumBits>, Layout> {};
template <typename BitField, int NumBits, bool IsMutable, typename Layout> 
struct pixel_value_type<const packed_dynamic_channel_reference<BitField,NumBits,IsMutable>,Layout> :
    public packed_pixel_type<BitField, mpl::vector1_c<unsigned,NumBits>, Layout> {};

template <typename BitField, int FirstBit, int NumBits, bool IsMutable, typename Layout> 
struct pixel_value_type<      packed_channel_reference<BitField,FirstBit,NumBits,IsMutable>,Layout> :
    public packed_pixel_type<BitField, mpl::vector1_c<unsigned,NumBits>, Layout> {};
template <typename BitField, int FirstBit, int NumBits, bool IsMutable, typename Layout> 
struct pixel_value_type<const packed_channel_reference<BitField,FirstBit,NumBits,IsMutable>,Layout> :
    public packed_pixel_type<BitField, mpl::vector1_c<unsigned,NumBits>, Layout> {};

template <int NumBits, typename Layout> 
struct pixel_value_type<packed_channel_value<NumBits>,Layout> :
    public packed_pixel_type<typename detail::min_fast_uint<NumBits>::type, mpl::vector1_c<unsigned,NumBits>, Layout> {};


/// \ingroup TypeFactoryFromElements
/// \brief Returns the type of a homogeneous locator given the channel type, layout, whether it operates on planar data and whether it has a step horizontally
template <typename T, typename L, bool IsPlanar=false, bool IsStepX=false, bool IsMutable=true> 
struct locator_type {
    typedef typename type_from_x_iterator<typename iterator_type<T,L,IsPlanar,IsStepX,IsMutable>::type>::xy_locator_type type;
};

/// \ingroup TypeFactoryFromElements
/// \brief Returns the type of a homogeneous view given the channel type, layout, whether it operates on planar data and whether it has a step horizontally
template <typename T, typename L, bool IsPlanar=false, bool IsStepX=false, bool IsMutable=true> 
struct view_type {
    typedef typename type_from_x_iterator<typename iterator_type<T,L,IsPlanar,IsStepX,IsMutable>::type>::view_t type;
};

/// \ingroup TypeFactoryFromElements
/// \brief Returns the type of a homogeneous image given the channel type, layout, and whether it operates on planar data
template <typename T, typename L, bool IsPlanar=false, typename Alloc=std::allocator<unsigned char> > 
struct image_type {
    typedef image<pixel<T,L>, IsPlanar, Alloc> type;
};

/// \ingroup TypeFactoryFromPixel
/// \brief Returns the type of a view the pixel type, whether it operates on planar data and whether it has a step horizontally
template <typename Pixel, bool IsPlanar=false, bool IsStepX=false, bool IsMutable=true> 
struct view_type_from_pixel {
    typedef typename type_from_x_iterator<typename iterator_type_from_pixel<Pixel,IsPlanar,IsStepX,IsMutable>::type>::view_t type;
};


/// \brief Constructs a pixel reference type from a source pixel reference type by changing some of the properties.
/// \ingroup TypeFactoryDerived
///  Use use_default for the properties of the source view that you want to keep
template <typename Ref, typename T=use_default, typename L=use_default, typename IsPlanar=use_default, typename IsMutable=use_default>
class derived_pixel_reference_type {
    typedef typename remove_reference<Ref>::type pixel_t;
    typedef typename  mpl::if_<is_same<T, use_default>, typename channel_type<pixel_t>::type,     T >::type channel_t;
    typedef typename  mpl::if_<is_same<L, use_default>, 
        layout<typename color_space_type<pixel_t>::type, typename channel_mapping_type<pixel_t>::type>, L>::type           layout_t;
    static const bool mut   =mpl::if_<is_same<IsMutable,use_default>, pixel_reference_is_mutable<Ref>, IsMutable>::type::value;
    static const bool planar=mpl::if_<is_same<IsPlanar,use_default>,  is_planar<pixel_t>,  IsPlanar>::type::value;
public:
    typedef typename pixel_reference_type<channel_t, layout_t, planar, mut>::type type;
};

/// \brief Constructs a pixel iterator type from a source pixel iterator type by changing some of the properties.
/// \ingroup TypeFactoryDerived
///  Use use_default for the properties of the source view that you want to keep
template <typename Iterator, typename T=use_default, typename L=use_default, typename IsPlanar=use_default, typename IsStep=use_default, typename IsMutable=use_default>
class derived_iterator_type {
    typedef typename  mpl::if_<is_same<T ,use_default>, typename channel_type<Iterator>::type,     T >::type channel_t;
    typedef typename  mpl::if_<is_same<L,use_default>, 
        layout<typename color_space_type<Iterator>::type, typename channel_mapping_type<Iterator>::type>, L>::type layout_t;

    static const bool mut   =mpl::if_<is_same<IsMutable,use_default>, iterator_is_mutable<Iterator>, IsMutable>::type::value;
    static const bool planar=mpl::if_<is_same<IsPlanar,use_default>,         is_planar<Iterator>,  IsPlanar>::type::value;
    static const bool step  =mpl::if_<is_same<IsStep  ,use_default>,  iterator_is_step<Iterator>,    IsStep>::type::value;
public:
    typedef typename iterator_type<channel_t, layout_t, planar, step, mut>::type type;
};

/// \brief Constructs an image view type from a source view type by changing some of the properties.
/// \ingroup TypeFactoryDerived
///  Use use_default for the properties of the source view that you want to keep
template <typename View, typename T=use_default, typename L=use_default, typename IsPlanar=use_default, typename StepX=use_default, typename IsMutable=use_default>
class derived_view_type {
    typedef typename  mpl::if_<is_same<T ,use_default>, typename channel_type<View>::type, T>::type channel_t;
    typedef typename  mpl::if_<is_same<L,use_default>, 
        layout<typename color_space_type<View>::type, typename channel_mapping_type<View>::type>, L>::type layout_t;
    static const bool mut   =mpl::if_<is_same<IsMutable,use_default>, view_is_mutable<View>, IsMutable>::type::value;
    static const bool planar=mpl::if_<is_same<IsPlanar,use_default>,  is_planar<View>,  IsPlanar>::type::value;
    static const bool step  =mpl::if_<is_same<StepX ,use_default>,  view_is_step_in_x<View>,StepX>::type::value;
public:
    typedef typename view_type<channel_t, layout_t, planar, step, mut>::type type;
};

/// \brief Constructs a homogeneous image type from a source image type by changing some of the properties.
/// \ingroup TypeFactoryDerived
///  Use use_default for the properties of the source image that you want to keep
template <typename Image, typename T=use_default, typename L=use_default, typename IsPlanar=use_default>
class derived_image_type {
    typedef typename  mpl::if_<is_same<T ,use_default>, typename channel_type<Image>::type,     T >::type channel_t;
    typedef typename  mpl::if_<is_same<L,use_default>, 
        layout<typename color_space_type<Image>::type, typename channel_mapping_type<Image>::type>, L>::type layout_t;
    static const bool planar=mpl::if_<is_same<IsPlanar,use_default>,  is_planar<Image>,  IsPlanar>::type::value;
public:
    typedef typename image_type<channel_t, layout_t, planar>::type type;
};




} }  // namespace boost::gil

#endif
