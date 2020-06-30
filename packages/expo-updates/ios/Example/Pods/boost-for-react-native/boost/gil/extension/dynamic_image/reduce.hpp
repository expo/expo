/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://opensource.adobe.com/gil for most recent version including documentation.
*/
/*************************************************************************************************/

#ifndef GIL_REDUCE_HPP
#define GIL_REDUCE_HPP

#include <boost/mpl/insert_range.hpp>
#include <boost/mpl/range_c.hpp>
#include <boost/mpl/vector_c.hpp>
#include <boost/mpl/back.hpp>
#include <boost/mpl/vector.hpp>
#include <boost/mpl/long.hpp>
#include <boost/mpl/logical.hpp>
#include <boost/mpl/transform.hpp>
#include <boost/mpl/insert.hpp>
#include <boost/mpl/transform.hpp>

#include "../../metafunctions.hpp"
#include "../../typedefs.hpp"
#include "dynamic_at_c.hpp"

////////////////////////////////////////////////////////////////////////////////////////
/// \file               
/// \brief Constructs for static-to-dynamic integer convesion
/// \author Lubomir Bourdev and Hailin Jin \n
///         Adobe Systems Incorporated
/// \date 2005-2007 \n Last updated on May 4, 2006
///
////////////////////////////////////////////////////////////////////////////////////////


#ifdef GIL_REDUCE_CODE_BLOAT


// Max number of cases in the cross-expension of binary operation for it to be reduced as unary
#define GIL_BINARY_REDUCE_LIMIT 226

namespace boost { namespace mpl {

///////////////////////////////////////////////////////
/// Mapping vector - represents the mapping of one type vector to another
///  It is not a full-blown MPL Random Access Type sequence; just has at_c and size implemented
///
/// SrcTypes, DstTypes: MPL Random Access Type Sequences
///
/// Implements size and at_c to behave as if this is an MPL vector of integers
///////////////////////////////////////////////////////

template <typename SrcTypes, typename DstTypes>
struct mapping_vector {};

template <typename SrcTypes, typename DstTypes, long K>
struct at_c<mapping_vector<SrcTypes,DstTypes>, K> {
    static const std::size_t value=size<DstTypes>::value - order<DstTypes, typename at_c<SrcTypes,K>::type>::type::value +1;
    typedef size_t<value> type;
};

template <typename SrcTypes, typename DstTypes>
struct size<mapping_vector<SrcTypes,DstTypes> > {
    typedef typename size<SrcTypes>::type type;
    static const std::size_t value=type::value;
};

///////////////////////////////////////////////////////
/// copy_to_vector - copies a sequence (mpl::set) to vector.
///
/// Temporary solution because I couldn't get mpl::copy to do this.
/// This is what I tried:
/// mpl::copy<SET, mpl::back_inserter<mpl::vector<> > >::type;
/// It works when SET is mpl::vector, but not when SET is mpl::set...
///////////////////////////////////////////////////////

namespace detail {
    template <typename SFirst, std::size_t NLeft>
    struct copy_to_vector_impl {
    private:
        typedef typename deref<SFirst>::type T;
        typedef typename next<SFirst>::type next;
        typedef typename copy_to_vector_impl<next, NLeft-1>::type rest;
    public:
        typedef typename push_front<rest, T>::type type;
    };

    template <typename SFirst> 
    struct copy_to_vector_impl<SFirst,1> {
        typedef vector<typename deref<SFirst>::type> type;
    };
}

template <typename Src>
struct copy_to_vector {
    typedef typename detail::copy_to_vector_impl<typename begin<Src>::type, size<Src>::value>::type type;
};

template <>
struct copy_to_vector<set<> > {
    typedef vector0<> type;
};

} } // boost::mpl

namespace boost { namespace gil {


///////////////////////////////////////////////////////
/// 
/// unary_reduce, binary_reduce - given an MPL Random Access Sequence,
/// dynamically specified index to that container, the bits of an instance of the corresponding type and
/// a generic operation, invokes the operation on the given type
///
///////////////////////////////////////////////////////




///////////////////////////////////////////////////////
/// 
/// \brief Unary reduce.
///
/// Given a set of types and an operation, reduces each type in the set (to reduced_t), then removes duplicates (to unique_t)
/// To apply the operation, first constructs a lookup table that maps each element from Types to its place in unique_t and uses it to map
/// the index to anther index (in map_index). Then invokes apply_operation_base on the unique types with the new index.
///
///////////////////////////////////////////////////////

template <typename Types, typename Op>
struct unary_reduce_impl {
    typedef typename mpl::transform<Types, detail::reduce<Op, mpl::_1> >::type reduced_t;
    typedef typename mpl::copy<reduced_t, mpl::inserter<mpl::set<>, mpl::insert<mpl::_1,mpl::_2> > >::type unique_t;
    static const bool is_single=mpl::size<unique_t>::value==1;
};

template <typename Types, typename Op, bool IsSingle=unary_reduce_impl<Types,Op>::is_single>
struct unary_reduce : public unary_reduce_impl<Types,Op> {
    typedef typename unary_reduce_impl<Types,Op>::reduced_t reduced_t;
    typedef typename unary_reduce_impl<Types,Op>::unique_t unique_t;

    static unsigned short inline map_index(std::size_t index) {
        typedef typename mpl::mapping_vector<reduced_t, unique_t> indices_t;
        return gil::at_c<indices_t, unsigned short>(index);
    }
    template <typename Bits> GIL_FORCEINLINE static typename Op::result_type applyc(const Bits& bits, std::size_t index, Op op) {
        return apply_operation_basec<unique_t>(bits,map_index(index),op);
    }

    template <typename Bits> GIL_FORCEINLINE static typename Op::result_type apply(Bits& bits, std::size_t index, Op op) {
        return apply_operation_base<unique_t>(bits,map_index(index),op);
    }
};

template <typename Types, typename Op>
struct unary_reduce<Types,Op,true> : public unary_reduce_impl<Types,Op> {
    typedef typename unary_reduce_impl<Types,Op>::unique_t unique_t;
    static unsigned short inline map_index(std::size_t index) { return 0; }

    template <typename Bits> GIL_FORCEINLINE static typename Op::result_type applyc(const Bits& bits, std::size_t index, Op op) {
        return op(*gil_reinterpret_cast_c<const typename mpl::front<unique_t>::type*>(&bits));
    }

    template <typename Bits> GIL_FORCEINLINE static typename Op::result_type apply(Bits& bits, std::size_t index, Op op) {
        return op(*gil_reinterpret_cast<typename       mpl::front<unique_t>::type*>(&bits));
    }
};


///////////////////////////////////////////////////////
/// 
/// \brief Binary reduce.
///
/// Given two sets of types, Types1 and Types2, first performs unary reduction on each. Then checks if the product of their sizes is above
/// the GIL_BINARY_REDUCE_LIMIT limit. If so, the operation is too complex to be binary-reduced and uses a specialization of binary_reduce_impl
/// to simply call the binary apply_operation_base (which performs two nested 1D apply operations)
/// If the operation is not too complex, uses the other specialization of binary_reduce_impl to create a cross-product of the input types
/// and performs unary reduction on the result (bin_reduced_t). To apply the binary operation, it simply invokes a unary apply_operation_base
/// on the reduced cross-product types
///
///////////////////////////////////////////////////////

namespace detail {
    struct pair_generator {
        template <typename Vec2> struct apply {
            typedef std::pair<const typename mpl::at_c<Vec2,0>::type*, const typename mpl::at_c<Vec2,1>::type*> type;
        };
    };

    // When the types are not too large, applies reduce on their cross product
    template <typename Unary1, typename Unary2, typename Op, bool IsComplex>
    struct binary_reduce_impl {
    //private:
        typedef typename mpl::copy_to_vector<typename Unary1::unique_t>::type vec1_types;
        typedef typename mpl::copy_to_vector<typename Unary2::unique_t>::type vec2_types;

        typedef mpl::cross_vector<mpl::vector2<vec1_types, vec2_types>, pair_generator> BIN_TYPES;
        typedef unary_reduce<BIN_TYPES,Op> bin_reduced_t;
        
        static unsigned short inline map_index(std::size_t index1, std::size_t index2) {
            unsigned short r1=Unary1::map_index(index1);
            unsigned short r2=Unary2::map_index(index2);
            return bin_reduced_t::map_index(r2*mpl::size<vec1_types>::value + r1);
        }
    public:
        typedef typename bin_reduced_t::unique_t unique_t;

        template <typename Bits1, typename Bits2>
        static typename Op::result_type inline apply(const Bits1& bits1, std::size_t index1, const Bits2& bits2, std::size_t index2, Op op) {
            std::pair<const void*,const void*> pr(&bits1, &bits2);
            return apply_operation_basec<unique_t>(pr, map_index(index1,index2),op);
        }
    };

    // When the types are large performs a double-dispatch. Binary reduction is not done.
    template <typename Unary1, typename Unary2, typename Op>
    struct binary_reduce_impl<Unary1,Unary2,Op,true> {
        template <typename Bits1, typename Bits2>
        static typename Op::result_type inline apply(const Bits1& bits1, std::size_t index1, const Bits2& bits2, std::size_t index2, Op op) {
            return apply_operation_base<Unary1::unique_t,Unary2::unique_t>(bits1, index1, bits2, index2, op);
        }
    };
}


template <typename Types1, typename Types2, typename Op>
struct binary_reduce {
//private:
    typedef unary_reduce<Types1,Op> unary1_t;
    typedef unary_reduce<Types2,Op> unary2_t;

    static const std::size_t CROSS_SIZE = mpl::size<typename unary1_t::unique_t>::value * 
                                          mpl::size<typename unary2_t::unique_t>::value;

    typedef detail::binary_reduce_impl<unary1_t,unary2_t,Op, (CROSS_SIZE>GIL_BINARY_REDUCE_LIMIT)> impl;
public:
    template <typename Bits1, typename Bits2>
    static typename Op::result_type inline apply(const Bits1& bits1, std::size_t index1, const Bits2& bits2, std::size_t index2, Op op) {
        return impl::apply(bits1,index1,bits2,index2,op);
    }
};

template <typename Types, typename UnaryOp>
GIL_FORCEINLINE typename UnaryOp::result_type apply_operation(variant<Types>& arg, UnaryOp op) {
    return unary_reduce<Types,UnaryOp>::template apply(arg._bits, arg._index ,op);
}

template <typename Types, typename UnaryOp>
GIL_FORCEINLINE typename UnaryOp::result_type apply_operation(const variant<Types>& arg, UnaryOp op) {
    return unary_reduce<Types,UnaryOp>::template applyc(arg._bits, arg._index ,op);
}

template <typename Types1, typename Types2, typename BinaryOp>
GIL_FORCEINLINE typename BinaryOp::result_type apply_operation(const variant<Types1>& arg1, const variant<Types2>& arg2, BinaryOp op) {    
    return binary_reduce<Types1,Types2,BinaryOp>::template apply(arg1._bits, arg1._index, arg2._bits, arg2._index, op);
}

#undef GIL_BINARY_REDUCE_LIMIT

} }  // namespace gil


namespace boost { namespace mpl {
///////////////////////////////////////////////////////
/// \brief Represents the virtual cross-product of the types generated from VecOfVecs.
/// \ingroup CrossVector
/// INPUT: 
///   VecOfVecs - a vector of vector types. For example [ [A1,A2,A3], [B1,B2], [C1,C2,C3,C4] ]
///       Each element must be a non-empty mpl vector
///   TypeGen - a metafunction that generates a type from a vector of types, each of which can be
///       selected from the corresponding vector in VecOfVecs. For example, [A1, B2, C4]
///       
/// Represents the virtual cross-product of the types generated from VecOfVecs.
/// For example, [ TypeGen[A1,B1,C1], TypeGen[A2,B1,C1], TypeGen[A3,B1,C1],
///                TypeGen[A1,B2,C1], TypeGen[A2,B2,C1], TypeGen[A3,B2,C1],
///                TypeGen[A1,B1,C2], TypeGen[A2,B1,C2], TypeGen[A3,B1,C2], ... ]
/// 
/// Models an immutable MPL Random Access Sequence
/// Traversal, random-access, etc, is defined, but mutable operations, 
///  such as push_back and pop_front are not supported
///////////////////////////////////////////////////////

template <typename VecOfVecs, typename TypeGen>
struct cross_vector {};

/// \brief Iterator of cross_vector
/// \ingroup CrossVectorIterator
template <typename VecOfVecs, typename TypeGen, std::size_t K>
struct cross_iterator {
    typedef mpl::random_access_iterator_tag category;
};

///////////////////////////////////////////////////////
/// Implementation of the iterator functions of cross vector
///////////////////////////////////////////////////////

/// \brief Dereferences a cross-vector iterator
/// \ingroup CrossVectorIterator
/// Creates a vector of the sizes of each type vector in VecOfVecs, then uses it as a basis
/// to represent the iterator's position K as a vector of indices. Extracts the corresponding type of 
/// each input vector and passes the element types to the type generation function, which returns the dereferenced type
template <typename VecOfVecs, typename TypeGen, std::size_t K>
struct deref<cross_iterator<VecOfVecs,TypeGen,K> > {
private:
    typedef typename detail::select_subvector_c<VecOfVecs, K>::type DerefTypes;
public:
    typedef typename TypeGen::template apply<DerefTypes>::type type;
};

/// \brief Increments a cross-vector iterator.
/// \ingroup CrossVectorIterator
template <typename VecOfVecs, typename TypeGen, std::size_t K>
struct next<cross_iterator<VecOfVecs,TypeGen,K> > {
    typedef cross_iterator<VecOfVecs,TypeGen,K+1> type;
};

/// \brief Decrements a cross-vector iterator.
/// \ingroup CrossVectorIterator
template <typename VecOfVecs, typename TypeGen, std::size_t K>
struct prior<cross_iterator<VecOfVecs,TypeGen,K> > {
    typedef cross_iterator<VecOfVecs,TypeGen,K-1> type;
};

/// \brief Advances a cross-vector iterator.
/// \ingroup CrossVectorIterator
template <typename VecOfVecs, typename TypeGen, std::size_t K, typename Distance>
struct advance<cross_iterator<VecOfVecs,TypeGen,K>, Distance > {
    typedef cross_iterator<VecOfVecs,TypeGen,K+Distance::value> type;
};

/// \brief Computes the distance between two cross-vector iterator-s.
/// \ingroup CrossVectorIterator
// (shortened the names of the template arguments - otherwise doxygen cannot parse this...)
template <typename VecOfVecs, typename TypeGen, std::size_t K1, std::size_t K2>
struct distance<cross_iterator<VecOfVecs,TypeGen,K1>, cross_iterator<VecOfVecs,TypeGen,K2> > {
    typedef size_t<K2-K1> type;
};

///////////////////////////////////////////////////////
/// Implementation of cross vector
///////////////////////////////////////////////////////
/// \brief Computes the size of a cross vector as the product of the sizes of all vectors in VecOfVecs
/// \ingroup CrossVector
template <typename VecOfVecs, typename TypeGen>
struct size<cross_vector<VecOfVecs,TypeGen> > {
    typedef typename fold<VecOfVecs, size_t<1>, times<_1, size<_2> > >::type type;
    static const std::size_t value=type::value;
};

/// \brief Determines whether a cross vector is empty
/// \ingroup CrossVector
template <typename VecOfVecs, typename TypeGen>
struct empty<cross_vector<VecOfVecs,TypeGen> > {
    typedef typename empty<VecOfVecs>::type type;
};

/// \brief Returns the K-th element of a cross vector
/// \ingroup CrossVector
template <typename VecOfVecs, typename TypeGen, typename K>
struct at<cross_vector<VecOfVecs,TypeGen>, K> {
private:
    typedef cross_iterator<VecOfVecs,TypeGen,K::value> KthIterator;
public:
    typedef typename deref<KthIterator>::type type;
};

/// \brief Returns an iterator to the first element of a cross vector
/// \ingroup CrossVector
template <typename VecOfVecs, typename TypeGen>
struct begin<cross_vector<VecOfVecs,TypeGen> > {
    typedef cross_iterator<VecOfVecs,TypeGen,0> type;
};

/// \brief Returns an iterator to the last element of a cross vector
/// \ingroup CrossVector
template <typename VecOfVecs, typename TypeGen>
struct end<cross_vector<VecOfVecs,TypeGen> > {
private:
    typedef cross_vector<VecOfVecs,TypeGen> this_t;
public:
    typedef cross_iterator<VecOfVecs,TypeGen,size<this_t>::value> type;
};

/// \brief Returns the first element of a cross vector
/// \ingroup CrossVector
template <typename VecOfVecs, typename TypeGen>
struct front<cross_vector<VecOfVecs,TypeGen> > {
private:
    typedef cross_vector<VecOfVecs,TypeGen> this_t;
public:
    typedef typename deref<typename begin<this_t>::type>::type type;
};

/// \brief Returns the last element of a cross vector
/// \ingroup CrossVector
template <typename VecOfVecs, typename TypeGen>
struct back<cross_vector<VecOfVecs,TypeGen> > {
private:
    typedef cross_vector<VecOfVecs,TypeGen> this_t;
    typedef typename size<this_t>::type            size;
    typedef typename minus<size, size_t<1> >::type last_index;
public:
    typedef typename at<this_t, last_index>::type type;
};

/// \brief Transforms the elements of a cross vector
/// \ingroup CrossVector
template <typename VecOfVecs, typename TypeGen, typename OPP>
struct transform<cross_vector<VecOfVecs,TypeGen>, OPP > {
    typedef typename lambda<OPP>::type Op;
    struct adapter {
        template <typename Elements> 
        struct apply {
            typedef typename TypeGen::template apply<Elements>::type orig_t;
            typedef typename Op::template apply<orig_t>::type type;
        };
    };
    typedef cross_vector<VecOfVecs, adapter > type; 
};

} } // boost::mpl

namespace boost { namespace gil {

template <typename Types, typename T> struct type_to_index;
template <typename V> struct view_is_basic;
struct rgb_t;
struct lab_t;
struct hsb_t;
struct cmyk_t;
struct rgba_t;
struct error_t;


namespace detail {
    ////////////////////////////////////////////////////////
    ////
    ////   Generic reduce operation
    ////
    ////////////////////////////////////////////////////////
    template <typename Op, typename T>
    struct reduce {
        typedef T type;
    };

    ////////////////////////////////////////////////////////
    ////
    ////   Unary reduce_view operation. Splits into basic and non-basic views.
    ////   Algorithm-specific reduce should specialize for basic views
    ////
    ////////////////////////////////////////////////////////

    template <typename Op, typename View, bool IsBasic>
    struct reduce_view_basic {
        typedef View type;
    };

    template <typename Op, typename Loc>
    struct reduce<Op, image_view<Loc> > 
        : public reduce_view_basic<Op,image_view<Loc>,view_is_basic<image_view<Loc> >::value> {};
 
    ////////////////////////////////////////////////////////
    ////
    ////   Unary reduce_image operation. Splits into basic and non-basic images.
    ////   Algorithm-specific reduce should specialize for basic images
    ////
    ////////////////////////////////////////////////////////

    template <typename Op, typename Img, bool IsBasic>
    struct reduce_image_basic {
        typedef Img type;
    };

    template <typename Op, typename V, typename Alloc>
    struct reduce<Op, image<V,Alloc> > : public reduce_image_basic<Op,image<V,Alloc>,image_is_basic<image<V,Alloc> >::value > {};

    ////////////////////////////////////////////////////////
    ////
    ////   Binary reduce_view operation. Splits into basic and non-basic views.
    ////   Algorithm-specific reduce should specialize for basic views
    ////
    ////////////////////////////////////////////////////////

    template <typename Op, typename V1, typename V2, bool AreBasic>
    struct reduce_views_basic {
        typedef std::pair<const V1*, const V2*> type;
    };

    template <typename Op, typename L1, typename L2>
    struct reduce<Op, std::pair<const image_view<L1>*, const image_view<L2>*> > 
        : public reduce_views_basic<Op,image_view<L1>,image_view<L2>,
                 mpl::and_<view_is_basic<image_view<L1> >, view_is_basic<image_view<L2> > >::value >
    {};


    ////////////////////////////////////////////////////////
    ////
    ////   Color space unary reduce operation. Reduce a color space to a base with the same number of channels
    ////
    ////////////////////////////////////////////////////////

    template <typename Cs>
    struct reduce_color_space {
        typedef Cs type;
    };

    template <> struct reduce_color_space<lab_t> { typedef rgb_t type; };
    template <> struct reduce_color_space<hsb_t> { typedef rgb_t type; };
    template <> struct reduce_color_space<cmyk_t> { typedef rgba_t type; };

    /*
    ////////////////////////////////////////////////////////
    ////
    ////   Color space binary reduce operation. Given a source and destination color spaces, 
    ////   returns a reduced source and destination color spaces that have the same mapping of channels
    ////
    ////   Precondition: The two color spaces must be compatible (i.e. must have the same set of channels)
    ////////////////////////////////////////////////////////

    template <typename Vec, int Basis, int VecSize> 
    struct type_vec_to_integer_impl {
        typedef typename mpl::back<Vec>::type     last;
        typedef typename mpl::pop_back<Vec>::type rest;
        static const int value = type_vec_to_integer_impl<rest, Basis, VecSize-1>::value * Basis + last::value;
    };

    template <typename Vec, int Basis> 
    struct type_vec_to_integer_impl<Vec,Basis,0> {
        static const int value=0;
    };

    template <typename Vec, int Basis=10>
    struct type_vec_to_integer {
        static const int value = type_vec_to_integer_impl<Vec,Basis, mpl::size<Vec>::value>::value;
    };

    // Given two color spaces and the mapping of the channels between them, returns the reduced pair of color spaces
    // The default version performs no reduction
    template <typename SrcColorSpace, typename DstColorSpace, int Mapping>
    struct reduce_color_spaces_impl {
        typedef SrcColorSpace first_t;
        typedef DstColorSpace second_t;
    };

    // 012: RGB-RGB, bgr-bgr, lab-lab, hsb-hsb
    template <typename SrcColorSpace, typename DstColorSpace>
    struct reduce_color_spaces_impl<SrcColorSpace,DstColorSpace,12> {
        typedef rgb_t first_t;
        typedef rgb_t second_t;
    };

    // 210: RGB-bgr, bgr-RGB
    template <typename SrcColorSpace, typename DstColorSpace>
    struct reduce_color_spaces_impl<SrcColorSpace,DstColorSpace,210> {
        typedef rgb_t first_t;
        typedef bgr_t second_t;
    };

    // 0123: RGBA-RGBA, bgra-bgra, argb-argb, abgr-abgr cmyk-cmyk
    template <typename SrcColorSpace, typename DstColorSpace>
    struct reduce_color_spaces_impl<SrcColorSpace,DstColorSpace,123> {
        typedef rgba_t first_t;
        typedef rgba_t second_t;
    };

    // 3210: RGBA-abgr, bgra-argb, argb-bgra, abgr-RGBA
    template <typename SrcColorSpace, typename DstColorSpace>
    struct reduce_color_spaces_impl<SrcColorSpace,DstColorSpace,3210> {
        typedef rgba_t first_t;
        typedef abgr_t second_t;
    };

    // 1230: RGBA-argb, bgra-abgr
    template <typename SrcColorSpace, typename DstColorSpace>
    struct reduce_color_spaces_impl<SrcColorSpace,DstColorSpace,1230> {
        typedef rgba_t first_t;
        typedef argb_t second_t;
    };

    // 2103: RGBA-bgra, bgra-RGBA (uses subclass to ensure that base color space is not reduced to derived)
    template <typename SrcColorSpace, typename DstColorSpace>
    struct reduce_color_spaces_impl<SrcColorSpace,DstColorSpace,2103> {
        typedef rgba_t first_t;
        typedef bgra_t second_t;
    };

    // 3012: argb-RGBA, abgr-bgra
    template <typename SrcColorSpace, typename DstColorSpace>
    struct reduce_color_spaces_impl<SrcColorSpace,DstColorSpace,3012> {
        typedef argb_t first_t;
        typedef rgba_t second_t;
    };

    // 0321: argb-abgr, abgr-argb
    template <typename SrcColorSpace, typename DstColorSpace>
    struct reduce_color_spaces_impl<SrcColorSpace,DstColorSpace,321> {
        typedef argb_t first_t;
        typedef abgr_t second_t;
    };

    template <typename SrcColorSpace, typename DstColorSpace>
    struct reduce_color_spaces {
        typedef typename channel_order<SrcColorSpace>::type src_order_t;
        typedef typename channel_order<DstColorSpace>::type dst_order_t;
        typedef typename mpl::transform<src_order_t, type_to_index<dst_order_t,mpl::_1> >::type mapping;
        static const int mapping_val = type_vec_to_integer<mapping>::value;
        
        typedef typename reduce_color_spaces_impl<SrcColorSpace,DstColorSpace,mapping_val>::first_t  _first_t;
        typedef typename reduce_color_spaces_impl<SrcColorSpace,DstColorSpace,mapping_val>::second_t _second_t;
        typedef typename mpl::and_<color_space_is_base<DstColorSpace>, mpl::not_< color_space_is_base<_second_t> > > swap_t;
    public:
        typedef typename mpl::if_<swap_t, _second_t, _first_t>::type first_t;
        typedef typename mpl::if_<swap_t, _first_t, _second_t>::type second_t;
    };
*/
// TODO: Use the old code for reduce_color_spaces above to do color layout reduction
    template <typename SrcLayout, typename DstLayout>
    struct reduce_color_layouts {
        typedef SrcLayout first_t;
        typedef DstLayout second_t;
    };

    ////////////////////////////////////////////////////////
    ////
    ////   Reduce for copy_pixels
    ////
    ////////////////////////////////////////////////////////

    struct copy_pixels_fn;

    /*
    // 1D reduce for copy_pixels reduces the channel to mutable and the color space to its base with same dimensions
    template <typename View>
    struct reduce_view_basic<copy_pixels_fn,View,true> {
    private:
        typedef typename reduce_color_space<typename View::color_space_t>::type Cs;    // reduce the color space
        typedef layout<Cs, typename View::channel_mapping_t> layout_t;
    public:
        typedef typename derived_view_type<View, use_default, layout_t, use_default, use_default, mpl::true_>::type type;
    };
*/
    // Incompatible views cannot be used in copy_pixels - will throw std::bad_cast
    template <typename V1, typename V2, bool Compatible> 
    struct reduce_copy_pixop_compat {
        typedef error_t type;
    };
    
    // For compatible basic views, reduce their color spaces based on their channel mapping. 
    // Make the source immutable and the destination mutable (they should already be that way)
    template <typename V1, typename V2>
    struct reduce_copy_pixop_compat<V1,V2,true> {
        typedef layout<typename V1::color_space_t, typename V1::channel_mapping_t> layout1;
        typedef layout<typename V2::color_space_t, typename V2::channel_mapping_t> layout2;

        typedef typename reduce_color_layouts<layout1,layout2>::first_t L1;
        typedef typename reduce_color_layouts<layout1,layout2>::second_t L2;

        typedef typename derived_view_type<V1, use_default, L1, use_default, use_default, use_default, mpl::false_>::type DV1;
        typedef typename derived_view_type<V2, use_default, L2, use_default, use_default, use_default, mpl::true_ >::type DV2;
        
        typedef std::pair<const DV1*, const DV2*> type;
    };
    
    // The general 2D version branches into compatible and incompatible views
    template <typename V1, typename V2>
    struct reduce_views_basic<copy_pixels_fn, V1, V2, true>
        : public reduce_copy_pixop_compat<V1, V2, mpl::and_<views_are_compatible<V1,V2>, view_is_mutable<V2> >::value > {
    };

    ////////////////////////////////////////////////////////
    ////
    ////   Reduce for variant destructor (basic views have no destructor)
    ////
    ////////////////////////////////////////////////////////

    struct destructor_op;
    template <typename View> struct reduce_view_basic<destructor_op,View,true> { typedef gray8_view_t type; };

    ////////////////////////////////////////////////////////
    ////
    ////   Reduce for get_dimensions (basic views and images have the same structure and the dimensions are contained at the beginning)
    ////
    ////////////////////////////////////////////////////////
    
    struct any_type_get_dimensions;
    template <typename View> struct reduce_view_basic<any_type_get_dimensions,View,true> { typedef gray8_view_t type; };
    template <typename Img>  struct reduce_image_basic<any_type_get_dimensions,Img,true> { typedef gray8_image_t type; };

    ////////////////////////////////////////////////////////
    ////
    ////   Reduce for get_num_channels (only color space matters)
    ////
    ////////////////////////////////////////////////////////
    
    struct any_type_get_num_channels;
    template <typename View> struct reduce_view_basic<any_type_get_num_channels,View,true> { 
        typedef typename View::color_space_t::base Cs;
        typedef typename view_type<bits8,typename reduce_color_space<Cs>::type>::type type; 
    };
    template <typename Img>  struct reduce_image_basic<any_type_get_num_channels,Img,true> { 
        typedef typename Img::color_space_t::base Cs;
        typedef typename image_type<bits8,typename reduce_color_space<Cs>::type>::type type; 
    };

    ////////////////////////////////////////////////////////
    ////
    ////   Reduce for resample_pixels (same as copy_pixels)
    ////
    ////////////////////////////////////////////////////////
    
    template <typename Sampler, typename MapFn> struct resample_pixels_fn;

    template <typename S, typename M, typename V, bool IsBasic> 
    struct reduce_view_basic<resample_pixels_fn<S,M>, V, IsBasic> : public reduce_view_basic<copy_pixels_fn, V, IsBasic> {};

    template <typename S, typename M, typename V1, typename V2, bool IsBasic> 
    struct reduce_views_basic<resample_pixels_fn<S,M>, V1, V2, IsBasic> : public reduce_views_basic<copy_pixels_fn, V1, V2, IsBasic> {};

    ////////////////////////////////////////////////////////
    ////
    ////   Reduce for copy_and_convert_pixels
    ////   (the only reduction could be made when views are compatible and have the same mapping, planarity and stepness)
    ////
    ////////////////////////////////////////////////////////

    
    template <typename CC> class copy_and_convert_pixels_fn;

    // the only thing for 1D reduce is making them all mutable...
    template <typename CC, typename View, bool IsBasic> 
    struct reduce_view_basic<copy_and_convert_pixels_fn<CC>, View, IsBasic> 
        : public derived_view_type<View, use_default, use_default, use_default, use_default, mpl::true_> {
    };

    // For 2D reduce, if they have the same channels and color spaces (i.e. the same pixels) then copy_and_convert is just copy.
    // In this case, reduce their common color space. In general make the first immutable and the second mutable
    template <typename CC, typename V1, typename V2, bool AreBasic> 
    struct reduce_views_basic<copy_and_convert_pixels_fn<CC>, V1, V2, AreBasic> {
        typedef is_same<typename V1::pixel_t, typename V2::pixel_t> Same;

        typedef reduce_color_space<typename V1::color_space_t::base> CsR;
        typedef typename mpl::if_<Same, typename CsR::type, typename V1::color_space_t>::type Cs1;
        typedef typename mpl::if_<Same, typename CsR::type, typename V2::color_space_t>::type Cs2;

        typedef typename derived_view_type<V1, use_default, layout<Cs1, typename V1::channel_mapping_t>, use_default, use_default, mpl::false_>::type DV1;
        typedef typename derived_view_type<V2, use_default, layout<Cs2, typename V2::channel_mapping_t>, use_default, use_default, mpl::true_ >::type DV2;
        
        typedef std::pair<const DV1*, const DV2*> type;
    };


    //integral_image_generator
    //resize_clobber_image_fnobj
    //image_default_construct_fnobj
    //fill_converted_pixels_fn
    //bind(gil::detail::copy_pixels_fn(), _1, dst)
    //bind(gil::detail::copy_pixels_fn(), src,_1)
    
    //bind(detail::copy_and_convert_pixels_fn(), _1, dst)
    //bind(detail::copy_and_convert_pixels_fn(), src, _1)
    //gil::detail::fill_pixels_fn<Value>(val)
    
    //detail::copy_construct_in_place_fn<base_t>
    //detail::equal_to_fn<typename variant<Types>::base_t>

    //detail::any_image_get_view<typename any_image<Types>::view_t>
    //detail::any_image_get_const_view<typename any_image<Types>::view_t>
    //detail::flipped_up_down_view_fn<any_image_view<ViewTypes> >
    //detail::flipped_left_right_view_fn<typename any_image_view<ViewTypes>::dynamic_step_t>
    //detail::tranposed_view_fn<typename any_image_view<ViewTypes>::dynamic_step_t>
    //detail::rotated90cw_view_fn<typename any_image_view<ViewTypes>::dynamic_step_t>
    //detail::rotated90ccw_view_fn<typename any_image_view<ViewTypes>::dynamic_step_t>
    //detail::rotated180_view_fn<typename any_image_view<ViewTypes>::dynamic_step_t>
    //detail::subimage_view_fn<any_image_view<ViewTypes> >
    //detail::subsampled_view_fn<typename any_image_view<ViewTypes>::dynamic_step_t>
    //detail::nth_channel_view_fn<typename nth_channel_view_type<any_image_view<ViewTypes> >
    //detail::color_converted_view_fn<DstP,typename color_convert_view_type<any_image_view<ViewTypes>, DstP>::type >
}

} }  // namespace boost::gil

#endif // GIL_REDUCE_CODE_BLOAT


#endif
