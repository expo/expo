
//          Copyright Oliver Kowalke 2014.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_CONTEXT_POOLED_pooled_fixedsize_H
#define BOOST_CONTEXT_POOLED_pooled_fixedsize_H

#include <atomic>
#include <cstddef>
#include <cstdlib>
#include <new>

#include <boost/assert.hpp>
#include <boost/config.hpp>
#include <boost/pool/pool.hpp>

#include <boost/context/detail/config.hpp>
#include <boost/context/stack_context.hpp>
#include <boost/context/stack_traits.hpp>

#if defined(BOOST_USE_VALGRIND)
#include <valgrind/valgrind.h>
#endif

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_PREFIX
#endif

namespace boost {
namespace context {

template< typename traitsT >
class basic_pooled_fixedsize_stack {
private:
    class storage {
    private:
        std::atomic< std::size_t >                                  use_count_;
        std::size_t                                                 stack_size_;
        boost::pool< boost::default_user_allocator_malloc_free >    storage_;

    public:
        storage( std::size_t stack_size, std::size_t next_size, std::size_t max_size) :
                use_count_( 0),
                stack_size_( stack_size),
                storage_( stack_size, next_size, max_size) {
            BOOST_ASSERT( traits_type::is_unbounded() || ( traits_type::maximum_size() >= stack_size_) );
        }

        stack_context allocate() {
            void * vp = storage_.malloc();
            if ( ! vp) {
                throw std::bad_alloc();
            }
            stack_context sctx;
            sctx.size = stack_size_;
            sctx.sp = static_cast< char * >( vp) + sctx.size;
#if defined(BOOST_USE_VALGRIND)
            sctx.valgrind_stack_id = VALGRIND_STACK_REGISTER( sctx.sp, vp);
#endif
            return sctx;
        }

        void deallocate( stack_context & sctx) BOOST_NOEXCEPT_OR_NOTHROW {
            BOOST_ASSERT( sctx.sp);
            BOOST_ASSERT( traits_type::is_unbounded() || ( traits_type::maximum_size() >= sctx.size) );

#if defined(BOOST_USE_VALGRIND)
            VALGRIND_STACK_DEREGISTER( sctx.valgrind_stack_id);
#endif
            void * vp = static_cast< char * >( sctx.sp) - sctx.size;
            storage_.free( vp);
        }

        friend void intrusive_ptr_add_ref( storage * s) noexcept {
            ++s->use_count_;
        }

        friend void intrusive_ptr_release( storage * s) noexcept {
            if ( 0 == --s->use_count_) {
                delete s;
            }
        }
    };

    intrusive_ptr< storage >    storage_;

public:
    typedef traitsT traits_type;

    basic_pooled_fixedsize_stack( std::size_t stack_size = traits_type::default_size(),
                           std::size_t next_size = 32,
                           std::size_t max_size = 0) BOOST_NOEXCEPT_OR_NOTHROW :
        storage_( new storage( stack_size, next_size, max_size) ) {
    }

    stack_context allocate() {
        return storage_->allocate();
    }

    void deallocate( stack_context & sctx) BOOST_NOEXCEPT_OR_NOTHROW {
        storage_->deallocate( sctx);
    }
};

typedef basic_pooled_fixedsize_stack< stack_traits >  pooled_fixedsize_stack;

}}

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_SUFFIX
#endif

#endif // BOOST_CONTEXT_POOLED_pooled_fixedsize_H
