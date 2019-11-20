/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://opensource.adobe.com/gil for most recent version including documentation.
*/
/*************************************************************************************************/

#ifndef GIL_IMAGE_VIEW_H
#define GIL_IMAGE_VIEW_H

////////////////////////////////////////////////////////////////////////////////////////
/// \file               
/// \brief image view class
/// \author Lubomir Bourdev and Hailin Jin \n
///         Adobe Systems Incorporated
/// \date 2005-2007 \n Last updated on February 12, 2007
///
////////////////////////////////////////////////////////////////////////////////////////

#include <cstddef>
#include <iterator>
#include "gil_config.hpp"
#include "iterator_from_2d.hpp"

//#ifdef _MSC_VER
//#pragma warning(push)
//#pragma warning(disable : 4244)     // conversion from 'gil::image<V,Alloc>::coord_t' to 'int', possible loss of data (visual studio compiler doesn't realize that the two types are the same)
//#endif

namespace boost { namespace gil {

////////////////////////////////////////////////////////////////////////////////////////
/// \class image_view
/// \ingroup ImageViewModel PixelBasedModel
/// \brief A lightweight object that interprets memory as a 2D array of pixels. Models ImageViewConcept,PixelBasedConcept,HasDynamicXStepTypeConcept,HasDynamicYStepTypeConcept,HasTransposedTypeConcept
///
/// Image view consists of a pixel 2D locator (defining the mechanism for navigating in 2D)
/// and the image dimensions.
///
/// Image views to images are what ranges are to STL containers. They are lightweight objects,
/// that don't own the pixels. It is the user's responsibility that the underlying data remains
/// valid for the lifetime of the image view.
///
/// Similar to iterators and ranges, constness of views does not extend to constness of pixels. 
/// A const \p image_view does not allow changing its location in memory (resizing, moving) but does 
/// not prevent one from changing the pixels. The latter requires an image view whose value_type
/// is const.
///
/// Images have interfaces consistent with STL 1D random access containers, so they can be used
/// directly in STL algorithms like:
/// \code
///  std::fill(img.begin(), img.end(), red_pixel);
/// \endcode
///
/// In addition, horizontal, vertical and 2D random access iterators are provided.
///
/// Note also that \p image_view does not require that its element type be a pixel. It could be
/// instantiated with a locator whose \p value_type models only \p Regular. In this case the image
/// view models the weaker RandomAccess2DImageViewConcept, and does not model PixelBasedConcept.
/// Many generic algorithms don't require the elements to be pixels.
///
////////////////////////////////////////////////////////////////////////////////////////
template <typename Loc>     // Models 2D Pixel Locator
class image_view {
public:

// typedefs required by ConstRandomAccessNDImageViewConcept
    static const std::size_t num_dimensions=2;
    typedef typename Loc::value_type                 value_type;
    typedef typename Loc::reference                  reference;       // result of dereferencing
    typedef typename Loc::coord_t                    coord_t;      // 1D difference type (same for all dimensions)
    typedef coord_t                                  difference_type; // result of operator-(1d_iterator,1d_iterator)
    typedef typename Loc::point_t                    point_t;
    typedef Loc                                      locator;
    typedef image_view<typename Loc::const_t>        const_t;      // same as this type, but over const values
    template <std::size_t D> struct axis {
        typedef typename Loc::template axis<D>::coord_t  coord_t;     // difference_type along each dimension
        typedef typename Loc::template axis<D>::iterator iterator;       // 1D iterator type along each dimension
    };
    typedef iterator_from_2d<Loc>                    iterator;       // 1D iterator type for each pixel left-to-right inside top-to-bottom
    typedef std::reverse_iterator<iterator>          reverse_iterator;
    typedef std::size_t                              size_type;

// typedefs required by ConstRandomAccess2DImageViewConcept
    typedef locator                                  xy_locator;
    typedef typename xy_locator::x_iterator          x_iterator;     // pixel iterator along a row
    typedef typename xy_locator::y_iterator          y_iterator;     // pixel iterator along a column
    typedef typename xy_locator::x_coord_t           x_coord_t;
    typedef typename xy_locator::y_coord_t           y_coord_t;

    template <typename Deref> struct add_deref {
        typedef image_view<typename Loc::template add_deref<Deref>::type> type;
        static type make(const image_view<Loc>& iv, const Deref& d) { return type(iv.dimensions(), Loc::template add_deref<Deref>::make(iv.pixels(),d)); }
    };

    image_view() : _dimensions(0,0) {}
    template <typename View> image_view(const View& iv)                                    : _dimensions(iv.dimensions()), _pixels(iv.pixels()) {}

    template <typename L2> image_view(const point_t& sz            , const L2& loc)        : _dimensions(sz),          _pixels(loc) {}
    template <typename L2> image_view(coord_t width, coord_t height, const L2& loc)        : _dimensions(x_coord_t(width),y_coord_t(height)), _pixels(loc) {}

    template <typename View> image_view& operator=(const View& iv)  { _pixels=iv.pixels(); _dimensions=iv.dimensions(); return *this; }
    image_view& operator=(const image_view& iv)                     { _pixels=iv.pixels(); _dimensions=iv.dimensions(); return *this; }

    template <typename View> bool operator==(const View& v) const   { return pixels()==v.pixels() && dimensions()==v.dimensions(); }
    template <typename View> bool operator!=(const View& v) const   { return !(*this==v); }

    template <typename L2> friend void swap(image_view<L2>& x, image_view<L2>& y);

    const point_t&   dimensions()            const { return _dimensions; }
    const locator&   pixels()                const { return _pixels; }
    x_coord_t        width()                 const { return dimensions().x; }
    y_coord_t        height()                const { return dimensions().y; }
    std::size_t      num_channels()          const { return gil::num_channels<value_type>::value; }
    bool             is_1d_traversable()     const { return _pixels.is_1d_traversable(width()); }

    //\{@
    /// \name 1D navigation
    size_type           size()               const { return width()*height(); }  
    iterator            begin()              const { return iterator(_pixels,_dimensions.x); }
    iterator            end()                const { return begin()+(difference_type)size(); }    // potential performance problem!
    reverse_iterator    rbegin()             const { return reverse_iterator(end()); }
    reverse_iterator    rend()               const { return reverse_iterator(begin()); }
    reference operator[](difference_type i)  const { return begin()[i]; }        // potential performance problem!
    iterator            at(difference_type i)const { return begin()+i; }
    iterator            at(const point_t& p) const { return begin()+p.y*width()+p.x; }
    iterator            at(x_coord_t x, y_coord_t y)const { return begin()+y*width()+x; }

    //\}@

    //\{@
    /// \name 2-D navigation
    reference operator()(const point_t& p)        const { return _pixels(p.x,p.y); }
    reference operator()(x_coord_t x, y_coord_t y)const { return _pixels(x,y); }
    template <std::size_t D> typename axis<D>::iterator axis_iterator(const point_t& p) const { return _pixels.axis_iterator<D>(p); }
    xy_locator xy_at(x_coord_t x, y_coord_t y)    const { return _pixels+point_t(x_coord_t(x),y_coord_t(y)); }
    locator    xy_at(const point_t& p)            const { return _pixels+p; }
    //\}@

    //\{@
    /// \name X navigation
    x_iterator x_at(x_coord_t x, y_coord_t y)     const { return _pixels.x_at(x,y); }
    x_iterator x_at(const point_t& p)             const { return _pixels.x_at(p); }
    x_iterator row_begin(y_coord_t y)             const { return x_at(0,y); }
    x_iterator row_end(y_coord_t y)               const { return x_at(width(),y); }
    //\}@

    //\{@
    /// \name Y navigation
    y_iterator y_at(x_coord_t x, y_coord_t y)     const { return xy_at(x,y).y(); }
    y_iterator y_at(const point_t& p)             const { return xy_at(p).y(); }
    y_iterator col_begin(x_coord_t x)             const { return y_at(x,0); }
    y_iterator col_end(x_coord_t x)               const { return y_at(x,height()); }
    //\}@

private:
    template <typename L2> friend class image_view;

    point_t    _dimensions;
    xy_locator _pixels;
};

template <typename L2> 
inline void swap(image_view<L2>& x, image_view<L2>& y) { 
    using std::swap;
    swap(x._dimensions,y._dimensions); 
    swap(x._pixels, y._pixels);            // TODO: Extend further
}

/////////////////////////////
//  PixelBasedConcept
/////////////////////////////

template <typename L>
struct channel_type<image_view<L> > : public channel_type<L> {}; 

template <typename L>
struct color_space_type<image_view<L> > : public color_space_type<L> {}; 

template <typename L>
struct channel_mapping_type<image_view<L> > : public channel_mapping_type<L> {}; 

template <typename L>
struct is_planar<image_view<L> > : public is_planar<L> {}; 

/////////////////////////////
//  HasDynamicXStepTypeConcept
/////////////////////////////

template <typename L>
struct dynamic_x_step_type<image_view<L> > {
    typedef image_view<typename dynamic_x_step_type<L>::type> type;
};

/////////////////////////////
//  HasDynamicYStepTypeConcept
/////////////////////////////

template <typename L>
struct dynamic_y_step_type<image_view<L> > {
    typedef image_view<typename dynamic_y_step_type<L>::type> type;
};

/////////////////////////////
//  HasTransposedTypeConcept
/////////////////////////////

template <typename L>
struct transposed_type<image_view<L> > {
    typedef image_view<typename transposed_type<L>::type> type;
};

} }  // namespace boost::gil

//#ifdef _MSC_VER
//#pragma warning(pop)
//#endif

#endif
