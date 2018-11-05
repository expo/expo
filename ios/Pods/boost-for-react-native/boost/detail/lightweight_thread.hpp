#ifndef BOOST_DETAIL_LIGHTWEIGHT_THREAD_HPP_INCLUDED
#define BOOST_DETAIL_LIGHTWEIGHT_THREAD_HPP_INCLUDED

// MS compatible compilers support #pragma once

#if defined(_MSC_VER) && (_MSC_VER >= 1020)
# pragma once
#endif

//  boost/detail/lightweight_thread.hpp
//
//  Copyright (c) 2002 Peter Dimov and Multi Media Ltd.
//  Copyright (c) 2008 Peter Dimov
//
//  Distributed under the Boost Software License, Version 1.0.
//  See accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt

#include <boost/config.hpp>
#include <memory>
#include <cerrno>

// pthread_create, pthread_join

#if defined( BOOST_HAS_PTHREADS )

#include <pthread.h>

#else

#include <windows.h>
#include <process.h>

typedef HANDLE pthread_t;

int pthread_create( pthread_t * thread, void const *, unsigned (__stdcall * start_routine) (void*), void* arg )
{
    HANDLE h = (HANDLE)_beginthreadex( 0, 0, start_routine, arg, 0, 0 );

    if( h != 0 )
    {
        *thread = h;
        return 0;
    }
    else
    {
        return EAGAIN;
    }
}

int pthread_join( pthread_t thread, void ** /*value_ptr*/ )
{
    ::WaitForSingleObject( thread, INFINITE );
    ::CloseHandle( thread );
    return 0;
}

#endif

// template<class F> int lw_thread_create( pthread_t & pt, F f );

namespace boost
{

namespace detail
{

class lw_abstract_thread
{
public:

    virtual ~lw_abstract_thread() {}
    virtual void run() = 0;
};

#if defined( BOOST_HAS_PTHREADS )

extern "C" void * lw_thread_routine( void * pv )
{
    std::auto_ptr<lw_abstract_thread> pt( static_cast<lw_abstract_thread *>( pv ) );

    pt->run();

    return 0;
}

#else

unsigned __stdcall lw_thread_routine( void * pv )
{
    std::auto_ptr<lw_abstract_thread> pt( static_cast<lw_abstract_thread *>( pv ) );

    pt->run();

    return 0;
}

#endif

template<class F> class lw_thread_impl: public lw_abstract_thread
{
public:

    explicit lw_thread_impl( F f ): f_( f )
    {
    }

    void run()
    {
        f_();
    }

private:

    F f_;
};

template<class F> int lw_thread_create( pthread_t & pt, F f )
{
    std::auto_ptr<lw_abstract_thread> p( new lw_thread_impl<F>( f ) );

    int r = pthread_create( &pt, 0, lw_thread_routine, p.get() );

    if( r == 0 )
    {
        p.release();
    }

    return r;
}

} // namespace detail
} // namespace boost

#endif // #ifndef BOOST_DETAIL_LIGHTWEIGHT_THREAD_HPP_INCLUDED
