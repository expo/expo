// Boost.Geometry Index
//
// R-tree auto deallocator
//
// Copyright (c) 2011-2013 Adam Wulkiewicz, Lodz, Poland.
//
// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_INDEX_DETAIL_RTREE_NODE_AUTO_DEALLOCATOR_HPP
#define BOOST_GEOMETRY_INDEX_DETAIL_RTREE_NODE_AUTO_DEALLOCATOR_HPP

namespace boost { namespace geometry { namespace index {

namespace detail { namespace rtree {

template <typename Alloc>
class auto_deallocator
{
    auto_deallocator(auto_deallocator const&);
    auto_deallocator & operator=(auto_deallocator const&);
public:
    typedef typename Alloc::pointer pointer;
    inline auto_deallocator(Alloc & a, pointer p) : m_alloc(a), m_ptr(p) {}
    inline ~auto_deallocator() { if ( m_ptr ) boost::container::allocator_traits<Alloc>::deallocate(m_alloc, m_ptr, 1); }
    inline void release() { m_ptr = 0; }
    inline pointer ptr() { return m_ptr; }
private:
    Alloc & m_alloc;
    pointer m_ptr;
};

}} // namespace detail::rtree

}}} // namespace boost::geometry::index

#endif // BOOST_GEOMETRY_INDEX_DETAIL_RTREE_NODE_AUTO_DEALLOCATOR_HPP
