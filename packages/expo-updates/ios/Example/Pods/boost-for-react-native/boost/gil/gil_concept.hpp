/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://opensource.adobe.com/gil for most recent version including documentation.
*/

/*************************************************************************************************/

#ifndef GIL_CONCEPT_H
#define GIL_CONCEPT_H

////////////////////////////////////////////////////////////////////////////////////////
/// \file               
/// \brief Concept check classes for GIL concepts
/// \author Lubomir Bourdev and Hailin Jin \n
///         Adobe Systems Incorporated
/// \date   2005-2007 \n Last updated on February 12, 2007
///
////////////////////////////////////////////////////////////////////////////////////////

#include <functional>
#include "gil_config.hpp"
#include <boost/type_traits.hpp>
#include <boost/utility/enable_if.hpp>
#include <boost/concept_check.hpp>
#include <boost/iterator/iterator_concepts.hpp>
#include <boost/mpl/and.hpp>
#include <boost/mpl/size.hpp>

namespace boost { namespace gil {
template <typename T> struct channel_traits;
template <typename P> struct is_pixel;
template <typename dstT, typename srcT>
typename channel_traits<dstT>::value_type channel_convert(const srcT& val);
template <typename T> class point2;
template <std::size_t K, typename T> const T& axis_value(const point2<T>& p);
template <std::size_t K, typename T>       T& axis_value(      point2<T>& p);
template <typename ColorBase, int K> struct kth_element_type;
template <typename ColorBase, int K> struct kth_element_reference_type;
template <typename ColorBase, int K> struct kth_element_const_reference_type;
template <typename ColorBase, int K> struct kth_semantic_element_reference_type;
template <typename ColorBase, int K> struct kth_semantic_element_const_reference_type;
template <typename ColorBase> struct size;
template <typename ColorBase> struct element_type;
template <typename T> struct channel_type;
template <typename T> struct color_space_type;
template <typename T> struct channel_mapping_type;
template <typename T> struct is_planar;
template <typename T> struct num_channels;

template <typename It> struct const_iterator_type;
template <typename It> struct iterator_is_mutable;
template <typename It> struct is_iterator_adaptor;
template <typename It, typename NewBaseIt> struct iterator_adaptor_rebind;
template <typename It> struct iterator_adaptor_get_base;


// forward-declare at_c
namespace detail { template <typename Element, typename Layout, int K> struct homogeneous_color_base; }
template <int K, typename E, typename L, int N>
typename add_reference<E>::type                           at_c(      detail::homogeneous_color_base<E,L,N>& p);

template <int K, typename E, typename L, int N>
typename add_reference<typename add_const<E>::type>::type at_c(const detail::homogeneous_color_base<E,L,N>& p);

#if !defined(_MSC_VER)  || _MSC_VER > 1310
template <typename P, typename C, typename L> struct packed_pixel;
template <int K, typename P, typename C, typename L>
typename kth_element_reference_type<packed_pixel<P,C,L>, K>::type 
at_c(packed_pixel<P,C,L>& p);

template <int K, typename P, typename C, typename L>
typename kth_element_const_reference_type<packed_pixel<P,C,L>,K>::type 
at_c(const packed_pixel<P,C,L>& p);

template <typename B, typename C, typename L, bool M> struct bit_aligned_pixel_reference;

template <int K, typename B, typename C, typename L, bool M> inline
typename kth_element_reference_type<bit_aligned_pixel_reference<B,C,L,M>, K>::type
at_c(const bit_aligned_pixel_reference<B,C,L,M>& p);
#endif

// Forward-declare semantic_at_c
template <int K, typename ColorBase>
typename disable_if<is_const<ColorBase>,typename kth_semantic_element_reference_type<ColorBase,K>::type>::type semantic_at_c(ColorBase& p);
template <int K, typename ColorBase>
typename kth_semantic_element_const_reference_type<ColorBase,K>::type semantic_at_c(const ColorBase& p);

template <typename T> struct dynamic_x_step_type;
template <typename T> struct dynamic_y_step_type;
template <typename T> struct transposed_type;

namespace detail {
template <typename T>
void initialize_it(T& x) {}
} // namespace detail

template <typename T>
struct remove_const_and_reference : public remove_const<typename remove_reference<T>::type> {};

#ifdef BOOST_GIL_USE_CONCEPT_CHECK
    #define GIL_CLASS_REQUIRE(type_var, ns, concept) BOOST_CLASS_REQUIRE(type_var, ns, concept);
    template <typename C> void gil_function_requires() { function_requires<C>(); }
#else
    #define GIL_CLASS_REQUIRE(T,NS,C) 
    template <typename C> void gil_function_requires() {}
#endif

/// \ingroup BasicConcepts
/**
\code
auto concept DefaultConstructible<typename T> {
    T::T();    
};
\endcode
*/
template <typename T>
struct DefaultConstructible {
    void constraints() {
        function_requires<boost::DefaultConstructibleConcept<T> >();
    }
};

/// \ingroup BasicConcepts
/**
\codeauto concept CopyConstructible<typename T> {
    T::T(T);
    T::~T();
};
\endcode
*/
template <typename T>
struct CopyConstructible {
    void constraints() {
        function_requires<boost::CopyConstructibleConcept<T> >();
    }
};

/// \ingroup BasicConcepts
/**
\code
auto concept Assignable<typename T, typename U = T> {
    typename result_type;
    result_type operator=(T&, U);    
};
\endcode
*/
template <typename T>
struct Assignable {
    void constraints() {
        function_requires<boost::AssignableConcept<T> >();
    }
};
/// \ingroup BasicConcepts
/**
\code
auto concept EqualityComparable<typename T, typename U = T> {
    bool operator==(T x, T y);    
    bool operator!=(T x, T y) { return !(x==y); }
};
\endcode
*/
template <typename T>
struct EqualityComparable {
    void constraints() {
        function_requires<boost::EqualityComparableConcept<T> >();
    }
};

/// \ingroup BasicConcepts
/**
\code
concept SameType<typename T, typename U>;// unspecified
\endcode
*/

template <typename T, typename U>
struct SameType {
    void constraints() {
        BOOST_STATIC_ASSERT((boost::is_same<T,U>::value_core));
    }
};

/// \ingroup BasicConcepts
/**
\code
auto concept Swappable<typename T> {
    void swap(T&,T&);
};
\endcode
*/
template <typename T>
struct Swappable {
    void constraints() {
        using std::swap;
        swap(x,y);
    }
    T x,y;
};

/// \ingroup BasicConcepts
/**
\code
auto concept Regular<typename T> : DefaultConstructible<T>, CopyConstructible<T>, EqualityComparable<T>, 
                                   Assignable<T>, Swappable<T> {};
\endcode
*/

template <typename T>
struct Regular {
    void constraints() {
        gil_function_requires< boost::DefaultConstructibleConcept<T> >();
        gil_function_requires< boost::CopyConstructibleConcept<T> >();              
        gil_function_requires< boost::EqualityComparableConcept<T> >(); // ==, !=
        gil_function_requires< boost::AssignableConcept<T> >();
        gil_function_requires< Swappable<T> >();
    }
};

/// \ingroup BasicConcepts
/**
\code
auto concept Metafunction<typename T> {
    typename type;
};
\endcode
*/
template <typename T>
struct Metafunction {
    void constraints() {
        typedef typename T::type type;
    }
};
////////////////////////////////////////////////////////////////////////////////////////
//
//          POINT CONCEPTS
// 
////////////////////////////////////////////////////////////////////////////////////////

/// \brief N-dimensional point concept
/// \ingroup PointConcept
/**
\code
concept PointNDConcept<typename T> : Regular<T> {    
    // the type of a coordinate along each axis
    template <size_t K> struct axis; where Metafunction<axis>;
            
    const size_t num_dimensions;
    
    // accessor/modifier of the value of each axis.
    template <size_t K> const typename axis<K>::type& T::axis_value() const;
    template <size_t K>       typename axis<K>::type& T::axis_value();
};
\endcode
*/

template <typename P>
struct PointNDConcept {
    void constraints() {
        gil_function_requires< Regular<P> >();

        typedef typename P::value_type value_type;
        static const std::size_t N=P::num_dimensions; ignore_unused_variable_warning(N);
        typedef typename P::template axis<0>::coord_t FT;
        typedef typename P::template axis<N-1>::coord_t LT;
        FT ft=gil::axis_value<0>(point);
        axis_value<0>(point)=ft;
        LT lt=axis_value<N-1>(point);
        axis_value<N-1>(point)=lt;
    
        value_type v=point[0];  ignore_unused_variable_warning(v);
        point[0]=point[0];
    }
    P point;
};

/// \brief 2-dimensional point concept
/// \ingroup PointConcept
/**
\code
concept Point2DConcept<typename T> : PointNDConcept<T> {    
    where num_dimensions == 2;
    where SameType<axis<0>::type, axis<1>::type>;

    typename value_type = axis<0>::type;

    const value_type& operator[](const T&, size_t i);
          value_type& operator[](      T&, size_t i);

    value_type x,y;
};
\endcode
*/

template <typename P>
struct Point2DConcept {
    void constraints() {
        gil_function_requires< PointNDConcept<P> >();
        BOOST_STATIC_ASSERT(P::num_dimensions == 2);
        point.x=point.y;
        point[0]=point[1];
    }
    P point;
};

////////////////////////////////////////////////////////////////////////////////////////
//
//          ITERATOR MUTABILITY CONCEPTS
//
// Taken from boost's concept_check.hpp. Isolating mutability to result in faster compile time 
//
////////////////////////////////////////////////////////////////////////////////////////

namespace detail {
    template <class TT> // Preconditions: TT Models boost_concepts::ForwardTraversalConcept
    struct ForwardIteratorIsMutableConcept {
        void constraints() {
            *i++ = *i;         // require postincrement and assignment
        }
        TT i;
    };

    template <class TT> // Preconditions: TT Models boost::BidirectionalIteratorConcept
    struct BidirectionalIteratorIsMutableConcept {
        void constraints() {
            gil_function_requires< ForwardIteratorIsMutableConcept<TT> >();
            *i-- = *i;                  // require postdecrement and assignment
        }
        TT i;
    };

    template <class TT> // Preconditions: TT Models boost_concepts::RandomAccessTraversalConcept
    struct RandomAccessIteratorIsMutableConcept {
        void constraints() {
            gil_function_requires< BidirectionalIteratorIsMutableConcept<TT> >();
            typename std::iterator_traits<TT>::difference_type n=0; ignore_unused_variable_warning(n);
            i[n] = *i;                  // require element access and assignment
        }
        TT i;
    };
}   // namespace detail

////////////////////////////////////////////////////////////////////////////////////////
//
//         COLOR SPACE CONCEPTS
//
////////////////////////////////////////////////////////////////////////////////////////

/// \brief Color space type concept
/// \ingroup ColorSpaceAndLayoutConcept
/**
\code
concept ColorSpaceConcept<MPLRandomAccessSequence Cs> {
   // An MPL Random Access Sequence, whose elements are color tags
};
\endcode
*/
template <typename Cs>
struct ColorSpaceConcept {
    void constraints() {
        // An MPL Random Access Sequence, whose elements are color tags
    }
};

template <typename ColorSpace1, typename ColorSpace2>  // Models ColorSpaceConcept
struct color_spaces_are_compatible : public is_same<ColorSpace1,ColorSpace2> {};

/// \brief Two color spaces are compatible if they are the same
/// \ingroup ColorSpaceAndLayoutConcept
/**
\code
concept ColorSpacesCompatibleConcept<ColorSpaceConcept Cs1, ColorSpaceConcept Cs2> {
    where SameType<Cs1,Cs2>;
};
\endcode
*/
template <typename Cs1, typename Cs2>
struct ColorSpacesCompatibleConcept {
    void constraints() {
        BOOST_STATIC_ASSERT((color_spaces_are_compatible<Cs1,Cs2>::value));
    }
};

/// \brief Channel mapping concept
/// \ingroup ColorSpaceAndLayoutConcept
/**
\code
concept ChannelMappingConcept<MPLRandomAccessSequence CM> {
   // An MPL Random Access Sequence, whose elements model MPLIntegralConstant representing a permutation
};
\endcode
*/
template <typename CM>
struct ChannelMappingConcept {
    void constraints() {
        // An MPL Random Access Sequence, whose elements model MPLIntegralConstant representing a permutation
    }
};



////////////////////////////////////////////////////////////////////////////////////////
///
///         Channel CONCEPTS
///
////////////////////////////////////////////////////////////////////////////////////////

/// \ingroup ChannelConcept
/// \brief A channel is the building block of a color. Color is defined as a mixture of primary colors and a channel defines the degree to which each primary color is used in the mixture.
/**         
For example, in the RGB color space, using 8-bit unsigned channels, the color red is defined as [255 0 0], which means maximum of Red, and no Green and Blue.
    
Built-in scalar types, such as \p int and \p float, are valid GIL channels. In more complex scenarios, channels may be represented as bit ranges or even individual bits.
In such cases special classes are needed to represent the value and reference to a channel.
    
Channels have a traits class, \p channel_traits, which defines their associated types as well as their operating ranges.

\code
concept ChannelConcept<typename T> : EqualityComparable<T> {
    typename value_type      = T;        // use channel_traits<T>::value_type to access it
    typename reference       = T&;       // use channel_traits<T>::reference to access it
    typename pointer         = T*;       // use channel_traits<T>::pointer to access it
    typename const_reference = const T&; // use channel_traits<T>::const_reference to access it
    typename const_pointer   = const T*; // use channel_traits<T>::const_pointer to access it
    static const bool is_mutable;        // use channel_traits<T>::is_mutable to access it

    static T min_value();                // use channel_traits<T>::min_value to access it
    static T max_value();                // use channel_traits<T>::min_value to access it
};
\endcode
*/
template <typename T>
struct ChannelConcept {
    void constraints() {
        gil_function_requires< boost::EqualityComparableConcept<T> >(); 
        
        typedef typename channel_traits<T>::value_type v;
        typedef typename channel_traits<T>::reference r;
        typedef typename channel_traits<T>::pointer p;
        typedef typename channel_traits<T>::const_reference cr;
        typedef typename channel_traits<T>::const_pointer cp;

        channel_traits<T>::min_value();
        channel_traits<T>::max_value();
    }

     T c;
};

namespace detail {
    // Preconditions: T models ChannelConcept
    template <typename T>
    struct ChannelIsMutableConcept {
        void constraints() {
            c=c;
            using std::swap;
            swap(c,c);
        }
        T c;
    };
}

/// \brief A channel that allows for modifying its value
/// \ingroup ChannelConcept
/**
\code
concept MutableChannelConcept<ChannelConcept T> : Assignable<T>, Swappable<T> {};
\endcode
*/
template <typename T>
struct MutableChannelConcept {
    void constraints() {
        gil_function_requires<ChannelConcept<T> >();
        gil_function_requires<detail::ChannelIsMutableConcept<T> >();
    }
};

/// \brief A channel that supports default construction. 
/// \ingroup ChannelConcept
/**
\code
concept ChannelValueConcept<ChannelConcept T> : Regular<T> {}; 
\endcode
*/
template <typename T>
struct ChannelValueConcept {
    void constraints() {
        gil_function_requires<ChannelConcept<T> >();
        gil_function_requires<Regular<T> >();
    }
};


/// \brief Predicate metafunction returning whether two channels are compatible
/// \ingroup ChannelAlgorithm
///
/// Channels are considered compatible if their value types (ignoring constness and references) are the same.
/**
Example:

\code
BOOST_STATIC_ASSERT((channels_are_compatible<bits8, const bits8&>::value));
\endcode
*/
template <typename T1, typename T2>  // Models GIL Pixel
struct channels_are_compatible 
    : public is_same<typename channel_traits<T1>::value_type, typename channel_traits<T2>::value_type> {};

/// \brief Channels are compatible if their associated value types (ignoring constness and references) are the same
/// \ingroup ChannelConcept
/**
\code
concept ChannelsCompatibleConcept<ChannelConcept T1, ChannelConcept T2> {
    where SameType<T1::value_type, T2::value_type>;
};
\endcode
*/
template <typename T1, typename T2>
struct ChannelsCompatibleConcept {
    void constraints() {
        BOOST_STATIC_ASSERT((channels_are_compatible<T1,T2>::value));
    }
};

/// \brief A channel is convertible to another one if the \p channel_convert algorithm is defined for the two channels
///
/// Convertibility is non-symmetric and implies that one channel can be converted to another. Conversion is explicit and often lossy operation.
/// \ingroup ChannelConcept
/**
\code
concept ChannelConvertibleConcept<ChannelConcept SrcChannel, ChannelValueConcept DstChannel> {
    DstChannel channel_convert(const SrcChannel&);
};
\endcode
*/
template <typename SrcChannel, typename DstChannel>
struct ChannelConvertibleConcept {
    void constraints() {
        gil_function_requires<ChannelConcept<SrcChannel> >();
        gil_function_requires<MutableChannelConcept<DstChannel> >();
        dst=channel_convert<DstChannel,SrcChannel>(src); ignore_unused_variable_warning(dst);
    }
    SrcChannel src;
    DstChannel dst;
};





////////////////////////////////////////////////////////////////////////////////////////
///
///         COLOR BASE CONCEPTS
///
////////////////////////////////////////////////////////////////////////////////////////

/// \ingroup ColorBaseConcept
/// \brief A color base is a container of color elements (such as channels, channel references or channel pointers)
/** 
The most common use of color base is in the implementation of a pixel, in which case the color
elements are channel values. The color base concept, however, can be used in other scenarios. For example, a planar pixel has channels that are not
contiguous in memory. Its reference is a proxy class that uses a color base whose elements are channel references. Its iterator uses a color base
whose elements are channel iterators.

A color base must have an associated layout (which consists of a color space, as well as an ordering of the channels).
There are two ways to index the elements of a color base: A physical index corresponds to the way they are ordered in memory, and
a semantic index corresponds to the way the elements are ordered in their color space.
For example, in the RGB color space the elements are ordered as {red_t, green_t, blue_t}. For a color base with a BGR layout, the first element
in physical ordering is the blue element, whereas the first semantic element is the red one.
Models of \p ColorBaseConcept are required to provide the \p at_c<K>(ColorBase) function, which allows for accessing the elements based on their
physical order. GIL provides a \p semantic_at_c<K>(ColorBase) function (described later) which can operate on any model of ColorBaseConcept and returns
the corresponding semantic element.

\code
concept ColorBaseConcept<typename T> : CopyConstructible<T>, EqualityComparable<T> {
    // a GIL layout (the color space and element permutation)
    typename layout_t;     
        
    // The type of K-th element
    template <int K> struct kth_element_type;                 where Metafunction<kth_element_type>;
    
    // The result of at_c
    template <int K> struct kth_element_const_reference_type; where Metafunction<kth_element_const_reference_type>;        
    
    template <int K> kth_element_const_reference_type<T,K>::type at_c(T);

    // Copy-constructible and equality comparable with other compatible color bases
    template <ColorBaseConcept T2> where { ColorBasesCompatibleConcept<T,T2> } 
        T::T(T2);
    template <ColorBaseConcept T2> where { ColorBasesCompatibleConcept<T,T2> } 
        bool operator==(const T&, const T2&);
    template <ColorBaseConcept T2> where { ColorBasesCompatibleConcept<T,T2> } 
        bool operator!=(const T&, const T2&);

};
\endcode
*/

template <typename ColorBase>
struct ColorBaseConcept {
    void constraints() {
        gil_function_requires< CopyConstructible<ColorBase> >();
        gil_function_requires< EqualityComparable<ColorBase> >();

        typedef typename ColorBase::layout_t::color_space_t color_space_t;
        gil_function_requires<ColorSpaceConcept<color_space_t> >();

        typedef typename ColorBase::layout_t::channel_mapping_t channel_mapping_t;
        // TODO: channel_mapping_t must be an MPL RandomAccessSequence

        static const std::size_t num_elements = size<ColorBase>::value;

        typedef typename kth_element_type<ColorBase,num_elements-1>::type TN; 
        typedef typename kth_element_const_reference_type<ColorBase,num_elements-1>::type CR; 

#if !defined(_MSC_VER) || _MSC_VER > 1310
        CR cr=at_c<num_elements-1>(cb);  ignore_unused_variable_warning(cr);
#endif

        // functions that work for every pixel (no need to require them)
        semantic_at_c<0>(cb);
        semantic_at_c<num_elements-1>(cb);
        // also static_max(cb), static_min(cb), static_fill(cb,value), and all variations of static_for_each(), static_generate(), static_transform()
    }

    ColorBase cb;
};

/// \ingroup ColorBaseConcept
/// \brief Color base which allows for modifying its elements
/** 

\code
concept MutableColorBaseConcept<ColorBaseConcept T> : Assignable<T>, Swappable<T> {
    template <int K> struct kth_element_reference_type;       where Metafunction<kth_element_reference_type>;

    template <int K> kth_element_reference_type<kth_element_type<T,K>::type>::type at_c(T);
    
    template <ColorBaseConcept T2> where { ColorBasesCompatibleConcept<T,T2> } 
        T& operator=(T&, const T2&);
};
\endcode
*/
template <typename ColorBase>
struct MutableColorBaseConcept {
    void constraints() {
        gil_function_requires< ColorBaseConcept<ColorBase> >();
        gil_function_requires< Assignable<ColorBase> >();
        gil_function_requires< Swappable<ColorBase> >();

        typedef typename kth_element_reference_type<ColorBase, 0>::type CR; 

#if !defined(_MSC_VER) || _MSC_VER > 1310
        CR r=at_c<0>(cb);
        at_c<0>(cb)=r;
#endif
    }

    ColorBase cb;
};

/// \ingroup ColorBaseConcept
/// \brief Color base that also has a default-constructor. Refines Regular
/** 
\code
concept ColorBaseValueConcept<typename T> : MutableColorBaseConcept<T>, Regular<T> {
};
\endcode
*/
template <typename ColorBase>
struct ColorBaseValueConcept {
    void constraints() {
        gil_function_requires< MutableColorBaseConcept<ColorBase> >();
        gil_function_requires< Regular<ColorBase> >();
    }
};

/// \ingroup ColorBaseConcept
/// \brief Color base whose elements all have the same type
/** 
\code
concept HomogeneousColorBaseConcept<ColorBaseConcept CB> {
    // For all K in [0 ... size<C1>::value-1):
    //     where SameType<kth_element_type<CB,K>::type, kth_element_type<CB,K+1>::type>;    
    kth_element_const_reference_type<CB,0>::type dynamic_at_c(const CB&, std::size_t n) const;
};
\endcode
*/

template <typename ColorBase>
struct HomogeneousColorBaseConcept {
    void constraints() {
        gil_function_requires< ColorBaseConcept<ColorBase> >();

        static const std::size_t num_elements = size<ColorBase>::value;

        typedef typename kth_element_type<ColorBase,0>::type T0; 
        typedef typename kth_element_type<ColorBase,num_elements-1>::type TN; 

        BOOST_STATIC_ASSERT((is_same<T0,TN>::value));   // better than nothing
        typedef typename kth_element_const_reference_type<ColorBase,0>::type CRef0; 
        CRef0 e0=dynamic_at_c(cb,0);
    }
    ColorBase cb;
};

/// \ingroup ColorBaseConcept
/// \brief Homogeneous color base that allows for modifying its elements
/** 

\code
concept MutableHomogeneousColorBaseConcept<ColorBaseConcept CB> : HomogeneousColorBaseConcept<CB> {
    kth_element_reference_type<CB,0>::type dynamic_at_c(CB&, std::size_t n);
};
\endcode
*/

template <typename ColorBase>
struct MutableHomogeneousColorBaseConcept {
    void constraints() {
        gil_function_requires< ColorBaseConcept<ColorBase> >();
        gil_function_requires< HomogeneousColorBaseConcept<ColorBase> >();
        typedef typename kth_element_reference_type<ColorBase, 0>::type R0;
        R0 x=dynamic_at_c(cb,0);
        dynamic_at_c(cb,0) = dynamic_at_c(cb,0);
    }
    ColorBase cb;
};

/// \ingroup ColorBaseConcept
/// \brief Homogeneous color base that also has a default constructor. Refines Regular.
/** 

\code
concept HomogeneousColorBaseValueConcept<typename T> : MutableHomogeneousColorBaseConcept<T>, Regular<T> {
};
\endcode
*/

template <typename ColorBase>
struct HomogeneousColorBaseValueConcept {
    void constraints() {
        gil_function_requires< MutableHomogeneousColorBaseConcept<ColorBase> >();
        gil_function_requires< Regular<ColorBase> >();
    }
};


/// \ingroup ColorBaseConcept
/// \brief Two color bases are compatible if they have the same color space and their elements are compatible, semantic-pairwise.
/** 

\code
concept ColorBasesCompatibleConcept<ColorBaseConcept C1, ColorBaseConcept C2> {
    where SameType<C1::layout_t::color_space_t, C2::layout_t::color_space_t>;
    // also, for all K in [0 ... size<C1>::value):
    //     where Convertible<kth_semantic_element_type<C1,K>::type, kth_semantic_element_type<C2,K>::type>;
    //     where Convertible<kth_semantic_element_type<C2,K>::type, kth_semantic_element_type<C1,K>::type>;
};
\endcode
*/
template <typename ColorBase1, typename ColorBase2>
struct ColorBasesCompatibleConcept {
    void constraints() {
        BOOST_STATIC_ASSERT((is_same<typename ColorBase1::layout_t::color_space_t, 
                                     typename ColorBase2::layout_t::color_space_t>::value));
//        typedef typename kth_semantic_element_type<ColorBase1,0>::type e1;
//        typedef typename kth_semantic_element_type<ColorBase2,0>::type e2;
//        "e1 is convertible to e2"
    }
};






















////////////////////////////////////////////////////////////////////////////////////////
///
///         PIXEL CONCEPTS
///
////////////////////////////////////////////////////////////////////////////////////////

/// \brief Concept for all pixel-based GIL constructs, such as pixels, iterators, locators, views and images whose value type is a pixel
/// \ingroup PixelBasedConcept
/**
\code
concept PixelBasedConcept<typename T> {
    typename color_space_type<T>;     
        where Metafunction<color_space_type<T> >;
        where ColorSpaceConcept<color_space_type<T>::type>;
    typename channel_mapping_type<T>; 
        where Metafunction<channel_mapping_type<T> >;  
        where ChannelMappingConcept<channel_mapping_type<T>::type>;
    typename is_planar<T>;
        where Metafunction<is_planar<T> >;
        where SameType<is_planar<T>::type, bool>;
};
\endcode
*/
template <typename P>
struct PixelBasedConcept {
    void constraints() {
        typedef typename color_space_type<P>::type color_space_t;
        gil_function_requires<ColorSpaceConcept<color_space_t> >();
        typedef typename channel_mapping_type<P>::type channel_mapping_t;
        gil_function_requires<ChannelMappingConcept<channel_mapping_t> >();

        static const bool planar = is_planar<P>::type::value;   ignore_unused_variable_warning(planar);


        // This is not part of the concept, but should still work
        static const std::size_t nc = num_channels<P>::value;
        ignore_unused_variable_warning(nc);
    }
};

/// \brief Concept for homogeneous pixel-based GIL constructs
/// \ingroup PixelBasedConcept
/**
\code
concept HomogeneousPixelBasedConcept<PixelBasedConcept T> {
    typename channel_type<T>;         
        where Metafunction<channel_type<T> >;
        where ChannelConcept<channel_type<T>::type>;
};
\endcode
*/
template <typename P>
struct HomogeneousPixelBasedConcept {
    void constraints() {
        gil_function_requires<PixelBasedConcept<P> >();
        typedef typename channel_type<P>::type channel_t;
        gil_function_requires<ChannelConcept<channel_t> >();        
    }
};


/// \brief Pixel concept - A color base whose elements are channels
/// \ingroup PixelConcept
/**
\code
concept PixelConcept<typename P> : ColorBaseConcept<P>, PixelBasedConcept<P> {    
    where is_pixel<P>::type::value==true;
    // where for each K [0..size<P>::value-1]:
    //      ChannelConcept<kth_element_type<P,K> >;
        
    typename P::value_type;       where PixelValueConcept<value_type>;
    typename P::reference;        where PixelConcept<reference>;
    typename P::const_reference;  where PixelConcept<const_reference>;
    static const bool P::is_mutable;

    template <PixelConcept P2> where { PixelConcept<P,P2> } 
        P::P(P2);
    template <PixelConcept P2> where { PixelConcept<P,P2> } 
        bool operator==(const P&, const P2&);
    template <PixelConcept P2> where { PixelConcept<P,P2> } 
        bool operator!=(const P&, const P2&);
}; 
\endcode
*/

template <typename P>
struct PixelConcept {
    void constraints() {
        gil_function_requires<ColorBaseConcept<P> >();
        gil_function_requires<PixelBasedConcept<P> >();

        BOOST_STATIC_ASSERT((is_pixel<P>::value));
        static const bool is_mutable = P::is_mutable; ignore_unused_variable_warning(is_mutable);

        typedef typename P::value_type      value_type;
//      gil_function_requires<PixelValueConcept<value_type> >();

        typedef typename P::reference       reference;
        gil_function_requires<PixelConcept<typename remove_const_and_reference<reference>::type> >();

        typedef typename P::const_reference const_reference;
        gil_function_requires<PixelConcept<typename remove_const_and_reference<const_reference>::type> >();
    }
};


/// \brief Pixel concept that allows for changing its channels
/// \ingroup PixelConcept
/**
\code
concept MutablePixelConcept<PixelConcept P> : MutableColorBaseConcept<P> {
    where is_mutable==true;
};
\endcode
*/
template <typename P>
struct MutablePixelConcept {
    void constraints() {
        gil_function_requires<PixelConcept<P> >();
        BOOST_STATIC_ASSERT(P::is_mutable);
    }
};
/// \brief Homogeneous pixel concept
/// \ingroup PixelConcept
/**
\code
concept HomogeneousPixelConcept<PixelConcept P> : HomogeneousColorBaseConcept<P>, HomogeneousPixelBasedConcept<P> { 
    P::template element_const_reference_type<P>::type operator[](P p, std::size_t i) const { return dynamic_at_c(p,i); }
};
\endcode
*/
template <typename P>
struct HomogeneousPixelConcept {
    void constraints() {
        gil_function_requires<PixelConcept<P> >();
        gil_function_requires<HomogeneousColorBaseConcept<P> >();
        gil_function_requires<HomogeneousPixelBasedConcept<P> >();
        p[0];
    }
    P p;
};

/// \brief Homogeneous pixel concept that allows for changing its channels
/// \ingroup PixelConcept
/**
\code
concept MutableHomogeneousPixelConcept<HomogeneousPixelConcept P> : MutableHomogeneousColorBaseConcept<P> { 
    P::template element_reference_type<P>::type operator[](P p, std::size_t i) { return dynamic_at_c(p,i); }
};
\endcode
*/
template <typename P>
struct MutableHomogeneousPixelConcept {
    void constraints() {
        gil_function_requires<HomogeneousPixelConcept<P> >();
        gil_function_requires<MutableHomogeneousColorBaseConcept<P> >();
        p[0]=p[0];
    }
    P p;
};

/// \brief Pixel concept that is a Regular type
/// \ingroup PixelConcept
/**
\code
concept PixelValueConcept<PixelConcept P> : Regular<P> {
    where SameType<value_type,P>;
};    
\endcode
*/
template <typename P>
struct PixelValueConcept {
    void constraints() {
        gil_function_requires<PixelConcept<P> >();
        gil_function_requires<Regular<P> >();
    }
};

/// \brief Homogeneous pixel concept that is a Regular type
/// \ingroup PixelConcept
/**
\code
concept HomogeneousPixelValueConcept<HomogeneousPixelConcept P> : Regular<P> {
    where SameType<value_type,P>;
}; 
\endcode
*/
template <typename P>
struct HomogeneousPixelValueConcept {
    void constraints() {
        gil_function_requires<HomogeneousPixelConcept<P> >();
        gil_function_requires<Regular<P> >();
        BOOST_STATIC_ASSERT((is_same<P, typename P::value_type>::value));
    }
};

namespace detail {
    template <typename P1, typename P2, int K>
    struct channels_are_pairwise_compatible : public 
        mpl::and_<channels_are_pairwise_compatible<P1,P2,K-1>,
                         channels_are_compatible<typename kth_semantic_element_reference_type<P1,K>::type,
                                                 typename kth_semantic_element_reference_type<P2,K>::type> > {};
                                                 
    template <typename P1, typename P2>
    struct channels_are_pairwise_compatible<P1,P2,-1> : public mpl::true_ {};
}

/// \brief Returns whether two pixels are compatible
///
/// Pixels are compatible if their channels and color space types are compatible. Compatible pixels can be assigned and copy constructed from one another.
/// \ingroup PixelAlgorithm
template <typename P1, typename P2>  // Models GIL Pixel
struct pixels_are_compatible 
    : public mpl::and_<typename color_spaces_are_compatible<typename color_space_type<P1>::type, 
                                                            typename color_space_type<P2>::type>::type, 
                       detail::channels_are_pairwise_compatible<P1,P2,num_channels<P1>::value-1> > {};

/// \brief  Concept for pixel compatibility
///    Pixels are compatible if their channels and color space types are compatible. Compatible pixels can be assigned and copy constructed from one another.
/// \ingroup PixelConcept
/**
\code
concept PixelsCompatibleConcept<PixelConcept P1, PixelConcept P2> : ColorBasesCompatibleConcept<P1,P2> {
    // where for each K [0..size<P1>::value):
    //    ChannelsCompatibleConcept<kth_semantic_element_type<P1,K>::type, kth_semantic_element_type<P2,K>::type>;
};
\endcode
*/
template <typename P1, typename P2> // precondition: P1 and P2 model PixelConcept
struct PixelsCompatibleConcept {
    void constraints() {
        BOOST_STATIC_ASSERT((pixels_are_compatible<P1,P2>::value));
    }
};

/// \brief Pixel convertible concept
///
/// Convertibility is non-symmetric and implies that one pixel can be converted to another, approximating the color. Conversion is explicit and sometimes lossy.
/// \ingroup PixelConcept
/**
\code
template <PixelConcept SrcPixel, MutablePixelConcept DstPixel>
concept PixelConvertibleConcept {
    void color_convert(const SrcPixel&, DstPixel&);
};
\endcode
*/
template <typename SrcP, typename DstP>
struct PixelConvertibleConcept {
    void constraints() {
        gil_function_requires<PixelConcept<SrcP> >();
        gil_function_requires<MutablePixelConcept<DstP> >();
        color_convert(src,dst);
    }
    SrcP src;
    DstP dst;
};

////////////////////////////////////////////////////////////////////////////////////////
///
///         DEREFERENCE ADAPTOR CONCEPTS
///
////////////////////////////////////////////////////////////////////////////////////////

/// \ingroup PixelDereferenceAdaptorConcept

/// \brief Represents a unary function object that can be invoked upon dereferencing a pixel iterator.
///
/// This can perform an arbitrary computation, such as color conversion or table lookup
/**
\code
concept PixelDereferenceAdaptorConcept<boost::UnaryFunctionConcept D>
  : DefaultConstructibleConcept<D>, CopyConstructibleConcept<D>, AssignableConcept<D>  {
    typename const_t;         where PixelDereferenceAdaptorConcept<const_t>;
    typename value_type;      where PixelValueConcept<value_type>;
    typename reference;         // may be mutable
    typename const_reference;   // must not be mutable
    static const bool D::is_mutable;

    where Convertible<value_type,result_type>;
};
\endcode
*/

template <typename D>
struct PixelDereferenceAdaptorConcept {
    void constraints() {
        gil_function_requires< boost::UnaryFunctionConcept<D, 
            typename remove_const_and_reference<typename D::result_type>::type, 
            typename D::argument_type> >();
        gil_function_requires< boost::DefaultConstructibleConcept<D> >();
        gil_function_requires< boost::CopyConstructibleConcept<D> >();              
        gil_function_requires< boost::AssignableConcept<D> >();

        gil_function_requires<PixelConcept<typename remove_const_and_reference<typename D::result_type>::type> >();

        typedef typename D::const_t const_t;
        gil_function_requires<PixelDereferenceAdaptorConcept<const_t> >();
        typedef typename D::value_type value_type;
        gil_function_requires<PixelValueConcept<value_type> >();
        typedef typename D::reference reference;                // == PixelConcept (if you remove const and reference)
        typedef typename D::const_reference const_reference;    // == PixelConcept (if you remove const and reference)

        const bool is_mutable=D::is_mutable; ignore_unused_variable_warning(is_mutable);
    }
    D d;
};

template <typename P>
struct PixelDereferenceAdaptorArchetype : public std::unary_function<P, P> {
    typedef PixelDereferenceAdaptorArchetype const_t;
    typedef typename remove_reference<P>::type value_type;
    typedef typename add_reference<P>::type reference;
    typedef reference const_reference;
    static const bool is_mutable=false;
    P operator()(P x) const { throw; }
};

////////////////////////////////////////////////////////////////////////////////////////
///
///         Pixel ITERATOR CONCEPTS
///
////////////////////////////////////////////////////////////////////////////////////////

/// \brief Concept for iterators, locators and views that can define a type just like the given iterator/locator/view, except it supports runtime specified step along the X navigation
/// \ingroup PixelIteratorConcept
/**
\code
concept HasDynamicXStepTypeConcept<typename T> {
    typename dynamic_x_step_type<T>;
        where Metafunction<dynamic_x_step_type<T> >;
};
\endcode
*/
template <typename T>
struct HasDynamicXStepTypeConcept {   
    void constraints() {
        typedef typename dynamic_x_step_type<T>::type type;
    }
};

/// \brief Concept for locators and views that can define a type just like the given locator or view, except it supports runtime specified step along the Y navigation
/// \ingroup PixelLocatorConcept
/**
\code
concept HasDynamicYStepTypeConcept<typename T> {
    typename dynamic_y_step_type<T>;
        where Metafunction<dynamic_y_step_type<T> >;
};
\endcode
*/
template <typename T>
struct HasDynamicYStepTypeConcept {   
    void constraints() {
        typedef typename dynamic_y_step_type<T>::type type;
    }
};


/// \brief Concept for locators and views that can define a type just like the given locator or view, except X and Y is swapped
/// \ingroup PixelLocatorConcept
/**
\code
concept HasTransposedTypeConcept<typename T> {
    typename transposed_type<T>;
        where Metafunction<transposed_type<T> >;
};
\endcode
*/
template <typename T>
struct HasTransposedTypeConcept {   
    void constraints() {
        typedef typename transposed_type<T>::type type;
    }
};

/// \defgroup PixelIteratorConceptPixelIterator PixelIteratorConcept
/// \ingroup PixelIteratorConcept
/// \brief STL iterator over pixels

/// \ingroup PixelIteratorConceptPixelIterator
/// \brief An STL random access traversal iterator over a model of PixelConcept.
/**
GIL's iterators must also provide the following metafunctions:
 - \p const_iterator_type<Iterator>:   Returns a read-only equivalent of \p Iterator
 - \p iterator_is_mutable<Iterator>:   Returns whether the given iterator is read-only or mutable
 - \p is_iterator_adaptor<Iterator>:   Returns whether the given iterator is an adaptor over another iterator. See IteratorAdaptorConcept for additional requirements of adaptors.

 \code
concept PixelIteratorConcept<typename Iterator> : boost_concepts::RandomAccessTraversalConcept<Iterator>, PixelBasedConcept<Iterator> {
    where PixelValueConcept<value_type>;
    typename const_iterator_type<It>::type;         
        where PixelIteratorConcept<const_iterator_type<It>::type>;
    static const bool  iterator_is_mutable<It>::type::value;          
    static const bool  is_iterator_adaptor<It>::type::value;   // is it an iterator adaptor
};
\endcode
*/
template <typename Iterator>
struct PixelIteratorConcept {   
    void constraints() {
        gil_function_requires<boost_concepts::RandomAccessTraversalConcept<Iterator> >();
        gil_function_requires<PixelBasedConcept<Iterator> >();
        
        typedef typename std::iterator_traits<Iterator>::value_type value_type;
        gil_function_requires<PixelValueConcept<value_type> >();
 
        typedef typename const_iterator_type<Iterator>::type const_t;
        static const bool is_mut = iterator_is_mutable<Iterator>::type::value; ignore_unused_variable_warning(is_mut);

        const_t const_it(it);  ignore_unused_variable_warning(const_it);  // immutable iterator must be constructible from (possibly mutable) iterator

        check_base(typename is_iterator_adaptor<Iterator>::type());
    }
    void check_base(mpl::false_) {}
    void check_base(mpl::true_) {
        typedef typename iterator_adaptor_get_base<Iterator>::type base_t;
        gil_function_requires<PixelIteratorConcept<base_t> >();
    }

    Iterator it;
};

namespace detail {
    template <typename Iterator>  // Preconditions: Iterator Models PixelIteratorConcept
    struct PixelIteratorIsMutableConcept {
        void constraints() {
            gil_function_requires<detail::RandomAccessIteratorIsMutableConcept<Iterator> >();
            typedef typename remove_reference<typename std::iterator_traits<Iterator>::reference>::type ref;
            typedef typename element_type<ref>::type channel_t;
            gil_function_requires<detail::ChannelIsMutableConcept<channel_t> >();
        }
    };
}

/// \brief Pixel iterator that allows for changing its pixel
/// \ingroup PixelIteratorConceptPixelIterator
/**
\code
concept MutablePixelIteratorConcept<PixelIteratorConcept Iterator> : MutableRandomAccessIteratorConcept<Iterator> {};

\endcode
*/
template <typename Iterator>
struct MutablePixelIteratorConcept {
    void constraints() {
        gil_function_requires<PixelIteratorConcept<Iterator> >();
        gil_function_requires<detail::PixelIteratorIsMutableConcept<Iterator> >();
    }
};

namespace detail {
    // Iterators that can be used as the base of memory_based_step_iterator require some additional functions
    template <typename Iterator>  // Preconditions: Iterator Models boost_concepts::RandomAccessTraversalConcept
    struct RandomAccessIteratorIsMemoryBasedConcept {
        void constraints() {
            std::ptrdiff_t bs=memunit_step(it);  ignore_unused_variable_warning(bs);
            it=memunit_advanced(it,3);
            std::ptrdiff_t bd=memunit_distance(it,it);  ignore_unused_variable_warning(bd);
            memunit_advance(it,3);
            // for performace you may also provide a customized implementation of memunit_advanced_ref
        }
        Iterator it;
    };
}

/// \defgroup PixelIteratorConceptStepIterator StepIteratorConcept
/// \ingroup PixelIteratorConcept
/// \brief Iterator that advances by a specified step

/// \brief Concept of a random-access iterator that can be advanced in memory units (bytes or bits)
/// \ingroup PixelIteratorConceptStepIterator
/**
\code
concept MemoryBasedIteratorConcept<boost_concepts::RandomAccessTraversalConcept Iterator> {
    typename byte_to_memunit<Iterator>; where metafunction<byte_to_memunit<Iterator> >;
    std::ptrdiff_t      memunit_step(const Iterator&);
    std::ptrdiff_t      memunit_distance(const Iterator& , const Iterator&);
    void                memunit_advance(Iterator&, std::ptrdiff_t diff);
    Iterator            memunit_advanced(const Iterator& p, std::ptrdiff_t diff) { Iterator tmp; memunit_advance(tmp,diff); return tmp; }
    Iterator::reference memunit_advanced_ref(const Iterator& p, std::ptrdiff_t diff) { return *memunit_advanced(p,diff); }
};
\endcode
*/
template <typename Iterator>
struct MemoryBasedIteratorConcept {
    void constraints() {
        gil_function_requires<boost_concepts::RandomAccessTraversalConcept<Iterator> >();
        gil_function_requires<detail::RandomAccessIteratorIsMemoryBasedConcept<Iterator> >();
    }
};

/// \brief Step iterator concept
///
/// Step iterators are iterators that have a set_step method
/// \ingroup PixelIteratorConceptStepIterator
/**
\code
concept StepIteratorConcept<boost_concepts::ForwardTraversalConcept Iterator> {
    template <Integral D> void Iterator::set_step(D step);
};
\endcode
*/
template <typename Iterator>
struct StepIteratorConcept {
    void constraints() {
        gil_function_requires<boost_concepts::ForwardTraversalConcept<Iterator> >();
        it.set_step(0);
    }
    Iterator it;
};


/// \brief Step iterator that allows for modifying its current value
///
/// \ingroup PixelIteratorConceptStepIterator
/**
\code
concept MutableStepIteratorConcept<Mutable_ForwardIteratorConcept Iterator> : StepIteratorConcept<Iterator> {};
\endcode
*/
template <typename Iterator>
struct MutableStepIteratorConcept {
    void constraints() {
        gil_function_requires<StepIteratorConcept<Iterator> >();
        gil_function_requires<detail::ForwardIteratorIsMutableConcept<Iterator> >();
    }
};

/// \defgroup PixelIteratorConceptIteratorAdaptor IteratorAdaptorConcept
/// \ingroup PixelIteratorConcept
/// \brief Adaptor over another iterator

/// \ingroup PixelIteratorConceptIteratorAdaptor
/// \brief Iterator adaptor is a forward iterator adapting another forward iterator.
/**
In addition to GIL iterator requirements, GIL iterator adaptors must provide the following metafunctions:
 - \p is_iterator_adaptor<Iterator>:             Returns \p mpl::true_
 - \p iterator_adaptor_get_base<Iterator>:       Returns the base iterator type
 - \p iterator_adaptor_rebind<Iterator,NewBase>: Replaces the base iterator with the new one

The adaptee can be obtained from the iterator via the "base()" method.

\code
concept IteratorAdaptorConcept<boost_concepts::ForwardTraversalConcept Iterator> {
    where SameType<is_iterator_adaptor<Iterator>::type, mpl::true_>;

    typename iterator_adaptor_get_base<Iterator>;
        where Metafunction<iterator_adaptor_get_base<Iterator> >;
        where boost_concepts::ForwardTraversalConcept<iterator_adaptor_get_base<Iterator>::type>;
    
    typename another_iterator; 
    typename iterator_adaptor_rebind<Iterator,another_iterator>::type;
        where boost_concepts::ForwardTraversalConcept<another_iterator>;
        where IteratorAdaptorConcept<iterator_adaptor_rebind<Iterator,another_iterator>::type>;

    const iterator_adaptor_get_base<Iterator>::type& Iterator::base() const;
};
\endcode
*/
template <typename Iterator>
struct IteratorAdaptorConcept {
    void constraints() {
        gil_function_requires<boost_concepts::ForwardTraversalConcept<Iterator> >();

        typedef typename iterator_adaptor_get_base<Iterator>::type base_t;
        gil_function_requires<boost_concepts::ForwardTraversalConcept<base_t> >();

        BOOST_STATIC_ASSERT(is_iterator_adaptor<Iterator>::value);
        typedef typename iterator_adaptor_rebind<Iterator, void*>::type rebind_t;

        base_t base=it.base();  ignore_unused_variable_warning(base);
    }
    Iterator it;
};

/// \brief Iterator adaptor that is mutable
/// \ingroup PixelIteratorConceptIteratorAdaptor
/**
\code
concept MutableIteratorAdaptorConcept<Mutable_ForwardIteratorConcept Iterator> : IteratorAdaptorConcept<Iterator> {};
\endcode
*/
template <typename Iterator>
struct MutableIteratorAdaptorConcept {
    void constraints() {
        gil_function_requires<IteratorAdaptorConcept<Iterator> >();
        gil_function_requires<detail::ForwardIteratorIsMutableConcept<Iterator> >();
    }
};

////////////////////////////////////////////////////////////////////////////////////////
///
///         LOCATOR CONCEPTS
///
////////////////////////////////////////////////////////////////////////////////////////

/// \defgroup LocatorNDConcept RandomAccessNDLocatorConcept
/// \ingroup PixelLocatorConcept
/// \brief N-dimensional locator

/// \defgroup Locator2DConcept RandomAccess2DLocatorConcept
/// \ingroup PixelLocatorConcept
/// \brief 2-dimensional locator

/// \defgroup PixelLocator2DConcept PixelLocatorConcept
/// \ingroup PixelLocatorConcept
/// \brief 2-dimensional locator over pixel data

/// \ingroup LocatorNDConcept
/// \brief N-dimensional locator over immutable values
/**
\code
concept RandomAccessNDLocatorConcept<Regular Loc> {    
    typename value_type;        // value over which the locator navigates
    typename reference;         // result of dereferencing
    typename difference_type; where PointNDConcept<difference_type>; // return value of operator-.
    typename const_t;           // same as Loc, but operating over immutable values
    typename cached_location_t; // type to store relative location (for efficient repeated access)
    typename point_t  = difference_type;
    
    static const size_t num_dimensions; // dimensionality of the locator
    where num_dimensions = point_t::num_dimensions;
    
    // The difference_type and iterator type along each dimension. The iterators may only differ in 
    // difference_type. Their value_type must be the same as Loc::value_type
    template <size_t D> struct axis {
        typename coord_t = point_t::axis<D>::coord_t;
        typename iterator; where RandomAccessTraversalConcept<iterator>; // iterator along D-th axis.
        where iterator::value_type == value_type;
    };

    // Defines the type of a locator similar to this type, except it invokes Deref upon dereferencing
    template <PixelDereferenceAdaptorConcept Deref> struct add_deref {
        typename type;        where RandomAccessNDLocatorConcept<type>;
        static type make(const Loc& loc, const Deref& deref);
    };
    
    Loc& operator+=(Loc&, const difference_type&);
    Loc& operator-=(Loc&, const difference_type&);
    Loc operator+(const Loc&, const difference_type&);
    Loc operator-(const Loc&, const difference_type&);
    
    reference operator*(const Loc&);
    reference operator[](const Loc&, const difference_type&);
 
    // Storing relative location for faster repeated access and accessing it   
    cached_location_t Loc::cache_location(const difference_type&) const;
    reference operator[](const Loc&,const cached_location_t&);
    
    // Accessing iterators along a given dimension at the current location or at a given offset
    template <size_t D> axis<D>::iterator&       Loc::axis_iterator();
    template <size_t D> axis<D>::iterator const& Loc::axis_iterator() const;
    template <size_t D> axis<D>::iterator        Loc::axis_iterator(const difference_type&) const;
};
\endcode
*/
template <typename Loc>
struct RandomAccessNDLocatorConcept {
    void constraints() {
        gil_function_requires< Regular<Loc> >();

        typedef typename Loc::value_type        value_type;
        typedef typename Loc::reference         reference;          // result of dereferencing
        typedef typename Loc::difference_type   difference_type;    // result of operator-(pixel_locator, pixel_locator)
        typedef typename Loc::cached_location_t cached_location_t;  // type used to store relative location (to allow for more efficient repeated access)
        typedef typename Loc::const_t           const_t;         // same as this type, but over const values
        typedef typename Loc::point_t           point_t;         // same as difference_type
        static const std::size_t N=Loc::num_dimensions; ignore_unused_variable_warning(N);
    
        typedef typename Loc::template axis<0>::iterator    first_it_type;
        typedef typename Loc::template axis<N-1>::iterator  last_it_type;
        gil_function_requires<boost_concepts::RandomAccessTraversalConcept<first_it_type> >();
        gil_function_requires<boost_concepts::RandomAccessTraversalConcept<last_it_type> >();

        // point_t must be an N-dimensional point, each dimension of which must have the same type as difference_type of the corresponding iterator
        gil_function_requires<PointNDConcept<point_t> >();
        BOOST_STATIC_ASSERT(point_t::num_dimensions==N);
        BOOST_STATIC_ASSERT((is_same<typename std::iterator_traits<first_it_type>::difference_type, typename point_t::template axis<0>::coord_t>::value));
        BOOST_STATIC_ASSERT((is_same<typename std::iterator_traits<last_it_type>::difference_type, typename point_t::template axis<N-1>::coord_t>::value));

        difference_type d;
        loc+=d;
        loc-=d;
        loc=loc+d;
        loc=loc-d;
        reference r1=loc[d];  ignore_unused_variable_warning(r1);
        reference r2=*loc;  ignore_unused_variable_warning(r2);
        cached_location_t cl=loc.cache_location(d);  ignore_unused_variable_warning(cl);
        reference r3=loc[d];  ignore_unused_variable_warning(r3);

        first_it_type fi=loc.template axis_iterator<0>();
        fi=loc.template axis_iterator<0>(d);
        last_it_type li=loc.template axis_iterator<N-1>();
        li=loc.template axis_iterator<N-1>(d);

        typedef PixelDereferenceAdaptorArchetype<typename Loc::value_type> deref_t;
        typedef typename Loc::template add_deref<deref_t>::type dtype;
        //gil_function_requires<RandomAccessNDLocatorConcept<dtype> >();    // infinite recursion
    }
    Loc loc;
};

/// \ingroup Locator2DConcept
/// \brief 2-dimensional locator over immutable values
/**
\code
concept RandomAccess2DLocatorConcept<RandomAccessNDLocatorConcept Loc> {
    where num_dimensions==2;
    where Point2DConcept<point_t>;
    
    typename x_iterator = axis<0>::iterator;
    typename y_iterator = axis<1>::iterator;
    typename x_coord_t  = axis<0>::coord_t;
    typename y_coord_t  = axis<1>::coord_t;
    
    // Only available to locators that have dynamic step in Y
    //Loc::Loc(const Loc& loc, y_coord_t);

    // Only available to locators that have dynamic step in X and Y
    //Loc::Loc(const Loc& loc, x_coord_t, y_coord_t, bool transposed=false);

    x_iterator&       Loc::x();
    x_iterator const& Loc::x() const;    
    y_iterator&       Loc::y();
    y_iterator const& Loc::y() const;    
    
    x_iterator Loc::x_at(const difference_type&) const;
    y_iterator Loc::y_at(const difference_type&) const;
    Loc Loc::xy_at(const difference_type&) const;
    
    // x/y versions of all methods that can take difference type
    x_iterator        Loc::x_at(x_coord_t, y_coord_t) const;
    y_iterator        Loc::y_at(x_coord_t, y_coord_t) const;
    Loc               Loc::xy_at(x_coord_t, y_coord_t) const;
    reference         operator()(const Loc&, x_coord_t, y_coord_t);
    cached_location_t Loc::cache_location(x_coord_t, y_coord_t) const;

    bool      Loc::is_1d_traversable(x_coord_t width) const;
    y_coord_t Loc::y_distance_to(const Loc& loc2, x_coord_t x_diff) const;
};
\endcode
*/
template <typename Loc>
struct RandomAccess2DLocatorConcept {
    void constraints() {
        gil_function_requires<RandomAccessNDLocatorConcept<Loc> >();
        BOOST_STATIC_ASSERT(Loc::num_dimensions==2);

        typedef typename dynamic_x_step_type<Loc>::type dynamic_x_step_t;
        typedef typename dynamic_y_step_type<Loc>::type dynamic_y_step_t;
        typedef typename transposed_type<Loc>::type     transposed_t;

        typedef typename Loc::cached_location_t   cached_location_t;
        gil_function_requires<Point2DConcept<typename Loc::point_t> >();

        typedef typename Loc::x_iterator x_iterator;
        typedef typename Loc::y_iterator y_iterator;
        typedef typename Loc::x_coord_t  x_coord_t;
        typedef typename Loc::y_coord_t  y_coord_t;

        x_coord_t xd=0; ignore_unused_variable_warning(xd);
        y_coord_t yd=0; ignore_unused_variable_warning(yd);

        typename Loc::difference_type d;
        typename Loc::reference r=loc(xd,yd);  ignore_unused_variable_warning(r);

        dynamic_x_step_t loc2(dynamic_x_step_t(), yd);
        dynamic_x_step_t loc3(dynamic_x_step_t(), xd, yd);

        typedef typename dynamic_y_step_type<typename dynamic_x_step_type<transposed_t>::type>::type dynamic_xy_step_transposed_t;
        dynamic_xy_step_transposed_t loc4(loc, xd,yd,true);

        bool is_contiguous=loc.is_1d_traversable(xd); ignore_unused_variable_warning(is_contiguous);
        loc.y_distance_to(loc, xd);

        loc=loc.xy_at(d);
        loc=loc.xy_at(xd,yd);

        x_iterator xit=loc.x_at(d);
        xit=loc.x_at(xd,yd);
        xit=loc.x();

        y_iterator yit=loc.y_at(d);
        yit=loc.y_at(xd,yd);
        yit=loc.y();

        cached_location_t cl=loc.cache_location(xd,yd);  ignore_unused_variable_warning(cl);
    }
    Loc loc;
};

/// \ingroup PixelLocator2DConcept
/// \brief GIL's 2-dimensional locator over immutable GIL pixels
/**
\code
concept PixelLocatorConcept<RandomAccess2DLocatorConcept Loc> {
    where PixelValueConcept<value_type>;
    where PixelIteratorConcept<x_iterator>;
    where PixelIteratorConcept<y_iterator>;
    where x_coord_t == y_coord_t;

    typename coord_t = x_coord_t;
};
\endcode
*/
template <typename Loc>
struct PixelLocatorConcept {
    void constraints() {
        gil_function_requires< RandomAccess2DLocatorConcept<Loc> >();
        gil_function_requires< PixelIteratorConcept<typename Loc::x_iterator> >();
        gil_function_requires< PixelIteratorConcept<typename Loc::y_iterator> >();
        typedef typename Loc::coord_t                      coord_t;
        BOOST_STATIC_ASSERT((is_same<typename Loc::x_coord_t, typename Loc::y_coord_t>::value));
    }
    Loc loc;
};

namespace detail {
    template <typename Loc> // preconditions: Loc Models RandomAccessNDLocatorConcept
    struct RandomAccessNDLocatorIsMutableConcept {
        void constraints() {
            gil_function_requires<detail::RandomAccessIteratorIsMutableConcept<typename Loc::template axis<0>::iterator> >();
            gil_function_requires<detail::RandomAccessIteratorIsMutableConcept<typename Loc::template axis<Loc::num_dimensions-1>::iterator> >();

            typename Loc::difference_type d; initialize_it(d);
            typename Loc::value_type v;initialize_it(v);
            typename Loc::cached_location_t cl=loc.cache_location(d);
            *loc=v;
            loc[d]=v;
            loc[cl]=v;
        }
        Loc loc;
    };

    template <typename Loc> // preconditions: Loc Models RandomAccess2DLocatorConcept
    struct RandomAccess2DLocatorIsMutableConcept {
        void constraints() {
            gil_function_requires<detail::RandomAccessNDLocatorIsMutableConcept<Loc> >();
            typename Loc::x_coord_t xd=0; ignore_unused_variable_warning(xd);
            typename Loc::y_coord_t yd=0; ignore_unused_variable_warning(yd);
            typename Loc::value_type v; initialize_it(v);
            loc(xd,yd)=v;
        }
        Loc loc;
    };
}

/// \ingroup LocatorNDConcept
/// \brief N-dimensional locator over mutable pixels
/**
\code
concept MutableRandomAccessNDLocatorConcept<RandomAccessNDLocatorConcept Loc> {    
    where Mutable<reference>;
};
\endcode
*/
template <typename Loc>
struct MutableRandomAccessNDLocatorConcept {
    void constraints() {
        gil_function_requires<RandomAccessNDLocatorConcept<Loc> >();
        gil_function_requires<detail::RandomAccessNDLocatorIsMutableConcept<Loc> >();
    }
};

/// \ingroup Locator2DConcept
/// \brief 2-dimensional locator over mutable pixels
/**
\code
concept MutableRandomAccess2DLocatorConcept<RandomAccess2DLocatorConcept Loc> : MutableRandomAccessNDLocatorConcept<Loc> {};
\endcode
*/
template <typename Loc>
struct MutableRandomAccess2DLocatorConcept {
    void constraints() {
        gil_function_requires< RandomAccess2DLocatorConcept<Loc> >();
        gil_function_requires<detail::RandomAccess2DLocatorIsMutableConcept<Loc> >();
    }
};

/// \ingroup PixelLocator2DConcept
/// \brief GIL's 2-dimensional locator over mutable GIL pixels
/**
\code
concept MutablePixelLocatorConcept<PixelLocatorConcept Loc> : MutableRandomAccess2DLocatorConcept<Loc> {};
\endcode
*/
template <typename Loc>
struct MutablePixelLocatorConcept {
    void constraints() {
        gil_function_requires<PixelLocatorConcept<Loc> >();
        gil_function_requires<detail::RandomAccess2DLocatorIsMutableConcept<Loc> >();
    }
};

////////////////////////////////////////////////////////////////////////////////////////
///
///         IMAGE VIEW CONCEPTS
///
////////////////////////////////////////////////////////////////////////////////////////

/// \defgroup ImageViewNDConcept ImageViewNDLocatorConcept
/// \ingroup ImageViewConcept
/// \brief N-dimensional range

/// \defgroup ImageView2DConcept ImageView2DConcept
/// \ingroup ImageViewConcept
/// \brief 2-dimensional range

/// \defgroup PixelImageViewConcept ImageViewConcept
/// \ingroup ImageViewConcept
/// \brief 2-dimensional range over pixel data

/// \ingroup ImageViewNDConcept
/// \brief N-dimensional view over immutable values
/**
\code
concept RandomAccessNDImageViewConcept<Regular View> {
    typename value_type;
    typename reference;       // result of dereferencing
    typename difference_type; // result of operator-(iterator,iterator) (1-dimensional!)
    typename const_t;  where RandomAccessNDImageViewConcept<View>; // same as View, but over immutable values
    typename point_t;  where PointNDConcept<point_t>; // N-dimensional point
    typename locator;  where RandomAccessNDLocatorConcept<locator>; // N-dimensional locator.
    typename iterator; where RandomAccessTraversalConcept<iterator>; // 1-dimensional iterator over all values
    typename reverse_iterator; where RandomAccessTraversalConcept<reverse_iterator>; 
    typename size_type;       // the return value of size()

    // Equivalent to RandomAccessNDLocatorConcept::axis
    template <size_t D> struct axis {
        typename coord_t = point_t::axis<D>::coord_t;
        typename iterator; where RandomAccessTraversalConcept<iterator>;   // iterator along D-th axis.
        where SameType<coord_t, iterator::difference_type>;
        where SameType<iterator::value_type,value_type>;
    };

    // Defines the type of a view similar to this type, except it invokes Deref upon dereferencing
    template <PixelDereferenceAdaptorConcept Deref> struct add_deref {
        typename type;        where RandomAccessNDImageViewConcept<type>;
        static type make(const View& v, const Deref& deref);
    };

    static const size_t num_dimensions = point_t::num_dimensions;
    
    // Create from a locator at the top-left corner and dimensions
    View::View(const locator&, const point_type&);
    
    size_type        View::size()       const; // total number of elements
    reference        operator[](View, const difference_type&) const; // 1-dimensional reference
    iterator         View::begin()      const;
    iterator         View::end()        const;
    reverse_iterator View::rbegin()     const;
    reverse_iterator View::rend()       const;
    iterator         View::at(const point_t&);
    point_t          View::dimensions() const; // number of elements along each dimension
    bool             View::is_1d_traversable() const;   // can an iterator over the first dimension visit each value? I.e. are there gaps between values?

    // iterator along a given dimension starting at a given point
    template <size_t D> View::axis<D>::iterator View::axis_iterator(const point_t&) const;

    reference operator()(View,const point_t&) const;
};
\endcode
*/
template <typename View>
struct RandomAccessNDImageViewConcept {
    void constraints() {
        gil_function_requires< Regular<View> >();

        typedef typename View::value_type       value_type;
        typedef typename View::reference        reference;       // result of dereferencing
        typedef typename View::difference_type  difference_type; // result of operator-(1d_iterator,1d_iterator)
        typedef typename View::const_t          const_t;         // same as this type, but over const values
        typedef typename View::point_t          point_t;         // N-dimensional point
        typedef typename View::locator          locator;         // N-dimensional locator
        typedef typename View::iterator         iterator;
        typedef typename View::reverse_iterator reverse_iterator;
        typedef typename View::size_type        size_type;
        static const std::size_t N=View::num_dimensions;
    
        gil_function_requires<RandomAccessNDLocatorConcept<locator> >();
        gil_function_requires<boost_concepts::RandomAccessTraversalConcept<iterator> >();
        gil_function_requires<boost_concepts::RandomAccessTraversalConcept<reverse_iterator> >();

        typedef typename View::template axis<0>::iterator   first_it_type;
        typedef typename View::template axis<N-1>::iterator last_it_type;
        gil_function_requires<boost_concepts::RandomAccessTraversalConcept<first_it_type> >();
        gil_function_requires<boost_concepts::RandomAccessTraversalConcept<last_it_type> >();

//        BOOST_STATIC_ASSERT((typename std::iterator_traits<first_it_type>::difference_type, typename point_t::template axis<0>::coord_t>::value));
//        BOOST_STATIC_ASSERT((typename std::iterator_traits< last_it_type>::difference_type, typename point_t::template axis<N-1>::coord_t>::value));

        // point_t must be an N-dimensional point, each dimension of which must have the same type as difference_type of the corresponding iterator
        gil_function_requires<PointNDConcept<point_t> >();
        BOOST_STATIC_ASSERT(point_t::num_dimensions==N);
        BOOST_STATIC_ASSERT((is_same<typename std::iterator_traits<first_it_type>::difference_type, typename point_t::template axis<0>::coord_t>::value));
        BOOST_STATIC_ASSERT((is_same<typename std::iterator_traits<last_it_type>::difference_type, typename point_t::template axis<N-1>::coord_t>::value));

        point_t p;
        locator lc;
        iterator it;
        reverse_iterator rit;
        difference_type d; detail::initialize_it(d); ignore_unused_variable_warning(d);

        View(p,lc); // view must be constructible from a locator and a point

        p=view.dimensions();
        lc=view.pixels();
        size_type sz=view.size();  ignore_unused_variable_warning(sz);
        bool is_contiguous=view.is_1d_traversable(); ignore_unused_variable_warning(is_contiguous);

        it=view.begin();
        it=view.end();
        rit=view.rbegin();
        rit=view.rend();

        reference r1=view[d]; ignore_unused_variable_warning(r1);    // 1D access 
        reference r2=view(p); ignore_unused_variable_warning(r2);    // 2D access

        // get 1-D iterator of any dimension at a given pixel location
        first_it_type fi=view.template axis_iterator<0>(p); ignore_unused_variable_warning(fi);
        last_it_type li=view.template axis_iterator<N-1>(p); ignore_unused_variable_warning(li);

        typedef PixelDereferenceAdaptorArchetype<typename View::value_type> deref_t;
        typedef typename View::template add_deref<deref_t>::type dtype;
    }
    View view;
};

/// \ingroup ImageView2DConcept
/// \brief 2-dimensional view over immutable values
/**
\code
concept RandomAccess2DImageViewConcept<RandomAccessNDImageViewConcept View> {
    where num_dimensions==2;

    typename x_iterator = axis<0>::iterator;
    typename y_iterator = axis<1>::iterator;
    typename x_coord_t  = axis<0>::coord_t;
    typename y_coord_t  = axis<1>::coord_t;
    typename xy_locator = locator;
    
    x_coord_t View::width()  const;
    y_coord_t View::height() const;
    
    // X-navigation
    x_iterator View::x_at(const point_t&) const;
    x_iterator View::row_begin(y_coord_t) const;
    x_iterator View::row_end  (y_coord_t) const;

    // Y-navigation
    y_iterator View::y_at(const point_t&) const;
    y_iterator View::col_begin(x_coord_t) const;
    y_iterator View::col_end  (x_coord_t) const;
       
    // navigating in 2D
    xy_locator View::xy_at(const point_t&) const;

    // (x,y) versions of all methods taking point_t    
    View::View(x_coord_t,y_coord_t,const locator&);
    iterator View::at(x_coord_t,y_coord_t) const;
    reference operator()(View,x_coord_t,y_coord_t) const;
    xy_locator View::xy_at(x_coord_t,y_coord_t) const;
    x_iterator View::x_at(x_coord_t,y_coord_t) const;
    y_iterator View::y_at(x_coord_t,y_coord_t) const;
};
\endcode
*/
template <typename View>
struct RandomAccess2DImageViewConcept {
    void constraints() {
        gil_function_requires<RandomAccessNDImageViewConcept<View> >();
        BOOST_STATIC_ASSERT(View::num_dimensions==2);

        // TODO: This executes the requirements for RandomAccessNDLocatorConcept again. Fix it to improve compile time
        gil_function_requires<RandomAccess2DLocatorConcept<typename View::locator> >();

        typedef typename dynamic_x_step_type<View>::type  dynamic_x_step_t;
        typedef typename dynamic_y_step_type<View>::type  dynamic_y_step_t;
        typedef typename transposed_type<View>::type      transposed_t;

        typedef typename View::x_iterator x_iterator;
        typedef typename View::y_iterator y_iterator;
        typedef typename View::x_coord_t  x_coord_t;
        typedef typename View::y_coord_t  y_coord_t;
        typedef typename View::xy_locator xy_locator;

        x_coord_t xd=0; ignore_unused_variable_warning(xd);
        y_coord_t yd=0; ignore_unused_variable_warning(yd);
        x_iterator xit;
        y_iterator yit;
        typename View::point_t d;

        View(xd,yd,xy_locator());       // constructible with width, height, 2d_locator

        xy_locator lc=view.xy_at(xd,yd);
        lc=view.xy_at(d);

        typename View::reference r=view(xd,yd);  ignore_unused_variable_warning(r);
        xd=view.width();
        yd=view.height();

        xit=view.x_at(d);
        xit=view.x_at(xd,yd);
        xit=view.row_begin(xd);
        xit=view.row_end(xd);

        yit=view.y_at(d);
        yit=view.y_at(xd,yd);
        yit=view.col_begin(xd);
        yit=view.col_end(xd);
    }
    View view;
};


/// \ingroup PixelImageViewConcept
/// \brief GIL's 2-dimensional view over immutable GIL pixels
/**
\code
concept ImageViewConcept<RandomAccess2DImageViewConcept View> {
    where PixelValueConcept<value_type>;
    where PixelIteratorConcept<x_iterator>;        
    where PixelIteratorConcept<y_iterator>;
    where x_coord_t == y_coord_t;
    
    typename coord_t = x_coord_t;

    std::size_t View::num_channels() const;
};
\endcode
*/
template <typename View>
struct ImageViewConcept {
    void constraints() {
        gil_function_requires<RandomAccess2DImageViewConcept<View> >();

        // TODO: This executes the requirements for RandomAccess2DLocatorConcept again. Fix it to improve compile time
        gil_function_requires<PixelLocatorConcept<typename View::xy_locator> >();
        
        BOOST_STATIC_ASSERT((is_same<typename View::x_coord_t, typename View::y_coord_t>::value));

        typedef typename View::coord_t           coord_t;      // 1D difference type (same for all dimensions)
        std::size_t num_chan = view.num_channels(); ignore_unused_variable_warning(num_chan);
    }
    View view;
};


namespace detail {
    template <typename View>    // Preconditions: View Models RandomAccessNDImageViewConcept
    struct RandomAccessNDImageViewIsMutableConcept {
        void constraints() {
            gil_function_requires<detail::RandomAccessNDLocatorIsMutableConcept<typename View::locator> >();

            gil_function_requires<detail::RandomAccessIteratorIsMutableConcept<typename View::iterator> >();
            gil_function_requires<detail::RandomAccessIteratorIsMutableConcept<typename View::reverse_iterator> >();
            gil_function_requires<detail::RandomAccessIteratorIsMutableConcept<typename View::template axis<0>::iterator> >();
            gil_function_requires<detail::RandomAccessIteratorIsMutableConcept<typename View::template axis<View::num_dimensions-1>::iterator> >();

            typename View::difference_type diff; initialize_it(diff); ignore_unused_variable_warning(diff);
            typename View::point_t pt;
            typename View::value_type v; initialize_it(v);

            view[diff]=v;
            view(pt)=v;
        }
        View view;
    };

    template <typename View>    // preconditions: View Models RandomAccessNDImageViewConcept
    struct RandomAccess2DImageViewIsMutableConcept {
        void constraints() {        
            gil_function_requires<detail::RandomAccessNDImageViewIsMutableConcept<View> >();
            typename View::x_coord_t xd=0; ignore_unused_variable_warning(xd);
            typename View::y_coord_t yd=0; ignore_unused_variable_warning(yd);
            typename View::value_type v; initialize_it(v);
            view(xd,yd)=v;
        }
        View view;
    };

    template <typename View>    // preconditions: View Models ImageViewConcept
    struct PixelImageViewIsMutableConcept {
        void constraints() {        
            gil_function_requires<detail::RandomAccess2DImageViewIsMutableConcept<View> >();
        }
    };
}

/// \ingroup ImageViewNDConcept
/// \brief N-dimensional view over mutable values
/**
\code
concept MutableRandomAccessNDImageViewConcept<RandomAccessNDImageViewConcept View> {
    where Mutable<reference>;
};
\endcode
*/
template <typename View>
struct MutableRandomAccessNDImageViewConcept {
    void constraints() {
        gil_function_requires<RandomAccessNDImageViewConcept<View> >();
        gil_function_requires<detail::RandomAccessNDImageViewIsMutableConcept<View> >();
    }
};

/// \ingroup ImageView2DConcept
/// \brief 2-dimensional view over mutable values
/**
\code
concept MutableRandomAccess2DImageViewConcept<RandomAccess2DImageViewConcept View> : MutableRandomAccessNDImageViewConcept<View> {};
\endcode
*/
template <typename View>
struct MutableRandomAccess2DImageViewConcept {
    void constraints() {
        gil_function_requires<RandomAccess2DImageViewConcept<View> >();
        gil_function_requires<detail::RandomAccess2DImageViewIsMutableConcept<View> >();
    }
};

/// \ingroup PixelImageViewConcept
/// \brief GIL's 2-dimensional view over mutable GIL pixels
/**
\code
concept MutableImageViewConcept<ImageViewConcept View> : MutableRandomAccess2DImageViewConcept<View> {};
\endcode
*/
template <typename View>
struct MutableImageViewConcept {
    void constraints() {
        gil_function_requires<ImageViewConcept<View> >();
        gil_function_requires<detail::PixelImageViewIsMutableConcept<View> >();
    }
};

/// \brief Returns whether two views are compatible
///
/// Views are compatible if their pixels are compatible. Compatible views can be assigned and copy constructed from one another.
template <typename V1, typename V2>  // Model ImageViewConcept
struct views_are_compatible : public pixels_are_compatible<typename V1::value_type, typename V2::value_type> {};

/// \brief Views are compatible if they have the same color spaces and compatible channel values. Constness and layout are not important for compatibility
/// \ingroup ImageViewConcept
/**
\code
concept ViewsCompatibleConcept<ImageViewConcept V1, ImageViewConcept V2> {
    where PixelsCompatibleConcept<V1::value_type, P2::value_type>;
};
\endcode
*/
template <typename V1, typename V2>
struct ViewsCompatibleConcept {
    void constraints() {
        BOOST_STATIC_ASSERT((views_are_compatible<V1,V2>::value));
    }
};


////////////////////////////////////////////////////////////////////////////////////////
///
///         IMAGE CONCEPTS
///
////////////////////////////////////////////////////////////////////////////////////////


/// \ingroup ImageConcept
/// \brief N-dimensional container of values
/**
\code
concept RandomAccessNDImageConcept<typename Img> : Regular<Img> {
    typename view_t; where MutableRandomAccessNDImageViewConcept<view_t>;
    typename const_view_t = view_t::const_t;
    typename point_t      = view_t::point_t;
    typename value_type   = view_t::value_type;
    typename allocator_type;

    Img::Img(point_t dims, std::size_t alignment=1);
    Img::Img(point_t dims, value_type fill_value, std::size_t alignment);
    
    void Img::recreate(point_t new_dims, std::size_t alignment=1);
    void Img::recreate(point_t new_dims, value_type fill_value, std::size_t alignment);

    const point_t&        Img::dimensions() const;
    const const_view_t&   const_view(const Img&);
    const view_t&         view(Img&);
};
\endcode
*/
template <typename Img>
struct RandomAccessNDImageConcept {
    void constraints() {
        gil_function_requires<Regular<Img> >();

        typedef typename Img::view_t       view_t;
        gil_function_requires<MutableRandomAccessNDImageViewConcept<view_t> >();

        typedef typename Img::const_view_t const_view_t;
        typedef typename Img::value_type   pixel_t;

        typedef typename Img::point_t        point_t;
        gil_function_requires<PointNDConcept<point_t> >();

        const_view_t cv = const_view(img); ignore_unused_variable_warning(cv);
        view_t       v  = view(img);       ignore_unused_variable_warning(v);

        pixel_t fill_value;
        point_t pt=img.dimensions();
        Img im1(pt);
        Img im2(pt,1);
        Img im3(pt,fill_value,1);
        img.recreate(pt);
        img.recreate(pt,1);
        img.recreate(pt,fill_value,1);
    }
    Img img;
};


/// \ingroup ImageConcept
/// \brief 2-dimensional container of values
/**
\code
concept RandomAccess2DImageConcept<RandomAccessNDImageConcept Img> {
    typename x_coord_t = const_view_t::x_coord_t;
    typename y_coord_t = const_view_t::y_coord_t;
    
    Img::Img(x_coord_t width, y_coord_t height, std::size_t alignment=1);
    Img::Img(x_coord_t width, y_coord_t height, value_type fill_value, std::size_t alignment);

    x_coord_t Img::width() const;
    y_coord_t Img::height() const;
    
    void Img::recreate(x_coord_t width, y_coord_t height, std::size_t alignment=1);
    void Img::recreate(x_coord_t width, y_coord_t height, value_type fill_value, std::size_t alignment);
};
\endcode
*/
template <typename Img>
struct RandomAccess2DImageConcept {
    void constraints() {
        gil_function_requires<RandomAccessNDImageConcept<Img> >();
        typedef typename Img::x_coord_t  x_coord_t;
        typedef typename Img::y_coord_t  y_coord_t;
        typedef typename Img::value_type value_t;

        gil_function_requires<MutableRandomAccess2DImageViewConcept<typename Img::view_t> >();

        x_coord_t w=img.width();
        y_coord_t h=img.height();
        value_t fill_value;
        Img im1(w,h);
        Img im2(w,h,1);
        Img im3(w,h,fill_value,1);
        img.recreate(w,h);
        img.recreate(w,h,1);
        img.recreate(w,h,fill_value,1);
    }
    Img img;
};

/// \ingroup ImageConcept
/// \brief 2-dimensional image whose value type models PixelValueConcept
/**
\code 
concept ImageConcept<RandomAccess2DImageConcept Img> {
    where MutableImageViewConcept<view_t>;
    typename coord_t  = view_t::coord_t;
};
\endcode
*/
template <typename Img>
struct ImageConcept {
    void constraints() {
        gil_function_requires<RandomAccess2DImageConcept<Img> >();
        gil_function_requires<MutableImageViewConcept<typename Img::view_t> >();
        typedef typename Img::coord_t        coord_t;
        BOOST_STATIC_ASSERT(num_channels<Img>::value == mpl::size<typename color_space_type<Img>::type>::value);

        BOOST_STATIC_ASSERT((is_same<coord_t, typename Img::x_coord_t>::value));
        BOOST_STATIC_ASSERT((is_same<coord_t, typename Img::y_coord_t>::value));
    }
    Img img;
};


} }  // namespace boost::gil

#endif
