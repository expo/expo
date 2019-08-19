// Boost.Geometry (aka GGL, Generic Geometry Library)

// Copyright (c) 2007-2012 Barend Gehrels, Amsterdam, the Netherlands.
// Copyright (c) 2008-2012 Bruno Lalande, Paris, France.
// Copyright (c) 2009-2012 Mateusz Loskot, London, UK.

// Parts of Boost.Geometry are redesigned from Geodan's Geographic Library
// (geolib/GGL), copyright (c) 1995-2010 Geodan, Amsterdam, the Netherlands.

// Use, modification and distribution is subject to the Boost Software License,
// Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_GEOMETRY_ITERATORS_CLOSING_ITERATOR_HPP
#define BOOST_GEOMETRY_ITERATORS_CLOSING_ITERATOR_HPP

#include <boost/range.hpp>
#include <boost/iterator.hpp>
#include <boost/iterator/iterator_facade.hpp>
#include <boost/iterator/iterator_categories.hpp>



namespace boost { namespace geometry
{

/*!
\brief Iterator which iterates through a range, but adds first element at end of the range
\tparam Range range on which this class is based on
\ingroup iterators
\note It's const iterator treating the Range as one containing non-mutable elements.
        For both "closing_iterator<Range> and "closing_iterator<Range const>
        const reference is always returned when dereferenced.
\note This class is normally used from "closeable_view" if Close==true
*/
template <typename Range>
struct closing_iterator
    : public boost::iterator_facade
    <
        closing_iterator<Range>,
        typename boost::range_value<Range>::type const,
        boost::random_access_traversal_tag
    >
{
    typedef typename boost::range_difference<Range>::type difference_type;

    /// Constructor including the range it is based on
    explicit inline closing_iterator(Range& range)
        : m_range(&range)
        , m_iterator(boost::begin(range))
        , m_end(boost::end(range))
        , m_size(static_cast<difference_type>(boost::size(range)))
        , m_index(0)
    {}

    /// Constructor to indicate the end of a range
    explicit inline closing_iterator(Range& range, bool)
        : m_range(&range)
        , m_iterator(boost::end(range))
        , m_end(boost::end(range))
        , m_size(static_cast<difference_type>(boost::size(range)))
        , m_index((m_size == 0) ? 0 : m_size + 1)
    {}

    /// Default constructor
    explicit inline closing_iterator()
        : m_range(NULL)
        , m_size(0)
        , m_index(0)
    {}

private:
    friend class boost::iterator_core_access;

    inline typename boost::range_value<Range>::type const& dereference() const
    {
        return *m_iterator;
    }

    inline difference_type distance_to(closing_iterator<Range> const& other) const
    {
        return other.m_index - this->m_index;
    }

    inline bool equal(closing_iterator<Range> const& other) const
    {
        return this->m_range == other.m_range
            && this->m_index == other.m_index;
    }

    inline void increment()
    {
        if (++m_index < m_size)
        {
            ++m_iterator;
        }
        else
        {
            update_iterator();
        }
    }

    inline void decrement()
    {
        if (m_index-- < m_size)
        {
            --m_iterator;
        }
        else
        {
            update_iterator();
        }
    }

    inline void advance(difference_type n)
    {
        if (m_index < m_size && m_index + n < m_size)
        {
            m_index += n;
            m_iterator += n;
        }
        else
        {
            m_index += n;
            update_iterator();
        }
    }

    inline void update_iterator()
    {
        this->m_iterator = m_index <= m_size
            ? boost::begin(*m_range) + (m_index % m_size)
            : boost::end(*m_range)
            ;
    }

    Range* m_range;
    typename boost::range_iterator<Range>::type m_iterator;
    typename boost::range_iterator<Range>::type m_end;
    difference_type m_size;
    difference_type m_index;
};


}} // namespace boost::geometry


#endif // BOOST_GEOMETRY_ITERATORS_CLOSING_ITERATOR_HPP
