#ifndef BOOST_SMART_PTR_DETAIL_SP_COUNTED_BASE_SOLARIS_HPP_INCLUDED
#define BOOST_SMART_PTR_DETAIL_SP_COUNTED_BASE_SOLARIS_HPP_INCLUDED

//
//  detail/sp_counted_base_solaris.hpp
//   based on: detail/sp_counted_base_w32.hpp
//
//  Copyright (c) 2001, 2002, 2003 Peter Dimov and Multi Media Ltd.
//  Copyright 2004-2005 Peter Dimov
//  Copyright 2006 Michael van der Westhuizen
//
//  Distributed under the Boost Software License, Version 1.0. (See
//  accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt)
//
//
//  Lock-free algorithm by Alexander Terekhov
//
//  Thanks to Ben Hitchings for the #weak + (#shared != 0)
//  formulation
//

#include <boost/detail/sp_typeinfo.hpp>
#include <atomic.h>

namespace boost
{

namespace detail
{

class sp_counted_base
{
private:

    sp_counted_base( sp_counted_base const & );
    sp_counted_base & operator= ( sp_counted_base const & );

    uint32_t use_count_;        // #shared
    uint32_t weak_count_;       // #weak + (#shared != 0)

public:

    sp_counted_base(): use_count_( 1 ), weak_count_( 1 )
    {
    }

    virtual ~sp_counted_base() // nothrow
    {
    }

    // dispose() is called when use_count_ drops to zero, to release
    // the resources managed by *this.

    virtual void dispose() = 0; // nothrow

    // destroy() is called when weak_count_ drops to zero.

    virtual void destroy() // nothrow
    {
        delete this;
    }

    virtual void * get_deleter( sp_typeinfo const & ti ) = 0;
    virtual void * get_untyped_deleter() = 0;

    void add_ref_copy()
    {
        atomic_inc_32( &use_count_ );
    }

    bool add_ref_lock() // true on success
    {
        for( ;; )
        {
            uint32_t tmp = static_cast< uint32_t const volatile& >( use_count_ );
            if( tmp == 0 ) return false;
            if( atomic_cas_32( &use_count_, tmp, tmp + 1 ) == tmp ) return true;
        }
    }

    void release() // nothrow
    {
        if( atomic_dec_32_nv( &use_count_ ) == 0 )
        {
            dispose();
            weak_release();
        }
    }

    void weak_add_ref() // nothrow
    {
        atomic_inc_32( &weak_count_ );
    }

    void weak_release() // nothrow
    {
        if( atomic_dec_32_nv( &weak_count_ ) == 0 )
        {
            destroy();
        }
    }

    long use_count() const // nothrow
    {
        return static_cast<long const volatile &>( use_count_ );
    }
};

} // namespace detail

} // namespace boost

#endif  // #ifndef BOOST_SMART_PTR_DETAIL_SP_COUNTED_BASE_SOLARIS_HPP_INCLUDED
