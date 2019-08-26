
//          Copyright Oliver Kowalke 2014.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_COROUTINES2_DETAIL_PULL_CONTROL_BLOCK_IPP
#define BOOST_COROUTINES2_DETAIL_PULL_CONTROL_BLOCK_IPP

#include <exception>
#include <functional>
#include <memory>

#include <boost/assert.hpp>
#include <boost/config.hpp>

#include <boost/context/execution_context.hpp>

#include <boost/coroutine2/detail/config.hpp>
#include <boost/coroutine2/detail/decay_copy.hpp>
#include <boost/coroutine2/detail/forced_unwind.hpp>
#include <boost/coroutine2/detail/state.hpp>

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_PREFIX
#endif

namespace boost {
namespace coroutines2 {
namespace detail {

// pull_coroutine< T >

template< typename T >
void
pull_coroutine< T >::control_block::destroy( control_block * cb) noexcept {
    boost::context::execution_context ctx = cb->ctx;
    // destroy control structure
    cb->state |= state_t::destroy;
    cb->~control_block();
}

template< typename T >
template< typename StackAllocator, typename Fn >
pull_coroutine< T >::control_block::control_block( context::preallocated palloc, StackAllocator salloc,
                                                   Fn && fn) :
#if defined(BOOST_NO_CXX14_GENERIC_LAMBDAS)
    ctx{ std::allocator_arg, palloc, salloc,
        std::move( 
         std::bind(
                 [this]( typename std::decay< Fn >::type & fn_, boost::context::execution_context & ctx, void *) mutable noexcept {
                     // create synthesized push_coroutine< T >
                     typename push_coroutine< T >::control_block synthesized_cb{ this, ctx };
                     push_coroutine< T > synthesized{ & synthesized_cb };
                     other = & synthesized_cb;
                     if ( state_t::none == ( state & state_t::destroy) ) {
                         try {
                             auto fn = std::move( fn_);
                             // call coroutine-fn with synthesized push_coroutine as argument
                             fn( synthesized);
                         } catch ( forced_unwind const&) {
                             // do nothing for unwinding exception
                         } catch (...) {
                             // store other exceptions in exception-pointer
                             except = std::current_exception();
                         }
                     }
                     // set termination flags
                     state |= state_t::complete;
                     // jump back to ctx
                     other->ctx();
                     BOOST_ASSERT_MSG( false, "pull_coroutine is complete");
                 },
                 std::forward< Fn >( fn),
                 boost::context::execution_context::current(),
                 std::placeholders::_1))},
#else
    ctx{ std::allocator_arg, palloc, salloc,
         [this,fn_=decay_copy( std::forward< Fn >( fn) ),ctx=boost::context::execution_context::current()] (void *) mutable noexcept {
            // create synthesized push_coroutine< T >
            typename push_coroutine< T >::control_block synthesized_cb{ this, ctx };
            push_coroutine< T > synthesized{ & synthesized_cb };
            other = & synthesized_cb;
            if ( state_t::none == ( state & state_t::destroy) ) {
                try {
                    auto fn = std::move( fn_);
                    // call coroutine-fn with synthesized push_coroutine as argument
                    fn( synthesized);
                } catch ( forced_unwind const&) {
                    // do nothing for unwinding exception
                } catch (...) {
                    // store other exceptions in exception-pointer
                    except = std::current_exception();
                }
            }
            // set termination flags
            state |= state_t::complete;
            // jump back to ctx
            other->ctx();
            BOOST_ASSERT_MSG( false, "pull_coroutine is complete");
         }},
#endif
    other{ nullptr },
    state{ state_t::unwind },
    except{},
    bvalid{ false },
    storage{} {
    // enter coroutine-fn in order to have first value available after ctor (of `*this`) returns
    set( static_cast< T * >( ctx() ) );
}

template< typename T >
pull_coroutine< T >::control_block::control_block( typename push_coroutine< T >::control_block * cb,
                                                   boost::context::execution_context const& ctx_) noexcept :
    ctx{ ctx_ },
    other{ cb },
    state{ state_t::none },
    except{},
    bvalid{ false },
    storage{} {
}

template< typename T >
pull_coroutine< T >::control_block::~control_block() {
    if ( state_t::none == ( state & state_t::complete) &&
         state_t::none != ( state & state_t::unwind) ) {
        // unwind coroutine stack
        other->ctx = boost::context::execution_context::current();
        ctx( context::exec_ontop_arg, unwind_coroutine);
    }
    // destroy data if it set
    if ( bvalid) {
        reinterpret_cast< T * >( std::addressof( storage) )->~T();
    }
}

template< typename T >
void
pull_coroutine< T >::control_block::deallocate() noexcept {
    if ( state_t::none != ( state & state_t::unwind) ) {
        destroy( this);
    }
}

template< typename T >
void
pull_coroutine< T >::control_block::resume() {
    other->ctx = boost::context::execution_context::current();
    set( static_cast< T * >( ctx() ) );
    if ( except) {
        std::rethrow_exception( except);
    }
}

template< typename T >
void
pull_coroutine< T >::control_block::set( T * t) {
    // destroy data if it set
    if ( bvalid) {
        reinterpret_cast< T * >( std::addressof( storage) )->~T();
    }
    if ( nullptr != t) {
        ::new ( static_cast< void * >( std::addressof( storage) ) ) T( std::move( * t) );
        bvalid = true;
    } else {
        bvalid = false;
    }
}

template< typename T >
T &
pull_coroutine< T >::control_block::get() noexcept  {
    return * reinterpret_cast< T * >( std::addressof( storage) );
}

template< typename T >
bool
pull_coroutine< T >::control_block::valid() const noexcept {
    return nullptr != other && state_t::none == ( state & state_t::complete) && bvalid;
}


// pull_coroutine< T & >

template< typename T >
void
pull_coroutine< T & >::control_block::destroy( control_block * cb) noexcept {
    boost::context::execution_context ctx = cb->ctx;
    // destroy control structure
    cb->state |= state_t::destroy;
    cb->~control_block();
}

template< typename T >
template< typename StackAllocator, typename Fn >
pull_coroutine< T & >::control_block::control_block( context::preallocated palloc, StackAllocator salloc,
                                                     Fn && fn) :
#if defined(BOOST_NO_CXX14_GENERIC_LAMBDAS)
    ctx{ std::allocator_arg, palloc, salloc,
        std::move( 
         std::bind(
                 [this]( typename std::decay< Fn >::type & fn_, boost::context::execution_context & ctx, void *) mutable noexcept {
                     // create synthesized push_coroutine< T >
                     typename push_coroutine< T & >::control_block synthesized_cb{ this, ctx };
                     push_coroutine< T & > synthesized{ & synthesized_cb };
                     other = & synthesized_cb;
                     if ( state_t::none == ( state & state_t::destroy) ) {
                         try {
                             auto fn = std::move( fn_);
                             // call coroutine-fn with synthesized push_coroutine as argument
                             fn( synthesized);
                         } catch ( forced_unwind const&) {
                            // do nothing for unwinding exception
                         } catch (...) {
                             // store other exceptions in exception-pointer
                             except = std::current_exception();
                         }
                     }
                     // set termination flags
                     state |= state_t::complete;
                     // jump back to ctx
                     other->ctx();
                     BOOST_ASSERT_MSG( false, "pull_coroutine is complete");
                 },
                 std::forward< Fn >( fn),
                 boost::context::execution_context::current(),
                 std::placeholders::_1))},
#else
    ctx{ std::allocator_arg, palloc, salloc,
         [this,fn_=decay_copy( std::forward< Fn >( fn) ),ctx=boost::context::execution_context::current()] (void *) mutable noexcept {
            // create synthesized push_coroutine< T >
            typename push_coroutine< T & >::control_block synthesized_cb{ this, ctx };
            push_coroutine< T & > synthesized{ & synthesized_cb };
            other = & synthesized_cb;
            if ( state_t::none == ( state & state_t::destroy) ) {
                try {
                    auto fn = std::move( fn_);
                    // call coroutine-fn with synthesized push_coroutine as argument
                    fn( synthesized);
                } catch ( forced_unwind const&) {
                    // do nothing for unwinding exception
                } catch (...) {
                    // store other exceptions in exception-pointer
                    except = std::current_exception();
                }
            }
            // set termination flags
            state |= state_t::complete;
            // jump back to ctx
            other->ctx();
            BOOST_ASSERT_MSG( false, "pull_coroutine is complete");
         }},
#endif
    other{ nullptr },
    state{ state_t::unwind },
    except{},
    t{ nullptr } {
    // enter coroutine-fn in order to have first value available after ctor (of `*this`) returns
    t = static_cast< T * >( ctx() );
}

template< typename T >
pull_coroutine< T & >::control_block::control_block( typename push_coroutine< T & >::control_block * cb,
                                                     boost::context::execution_context const& ctx_) noexcept :
    ctx{ ctx_ },
    other{ cb },
    state{ state_t::none },
    except{},
    t( nullptr) {
}

template< typename T >
pull_coroutine< T & >::control_block::~control_block() {
    if ( state_t::none == ( state & state_t::complete) &&
         state_t::none != ( state & state_t::unwind) ) {
        // unwind coroutine stack
        other->ctx = boost::context::execution_context::current();
        ctx( context::exec_ontop_arg, unwind_coroutine);
    }
}

template< typename T >
void
pull_coroutine< T & >::control_block::deallocate() noexcept {
    if ( state_t::none != ( state & state_t::unwind) ) {
        destroy( this);
    }
}

template< typename T >
void
pull_coroutine< T & >::control_block::resume() {
    other->ctx = boost::context::execution_context::current();
    t = static_cast< T * >( ctx() );
    if ( except) {
        std::rethrow_exception( except);
    }
}

template< typename T >
T &
pull_coroutine< T & >::control_block::get() noexcept  {
    return * static_cast< T * >( t);
}

template< typename T >
bool
pull_coroutine< T & >::control_block::valid() const noexcept {
    return nullptr != other && state_t::none == ( state & state_t::complete) && nullptr != t;
}


// pull_coroutine< void >

inline
void
pull_coroutine< void >::control_block::destroy( control_block * cb) noexcept {
    boost::context::execution_context ctx = cb->ctx;
    // destroy control structure
    cb->state |= state_t::destroy;
    cb->~control_block();
}

template< typename StackAllocator, typename Fn >
pull_coroutine< void >::control_block::control_block( context::preallocated palloc, StackAllocator salloc,
                                                      Fn && fn) :
#if defined(BOOST_NO_CXX14_GENERIC_LAMBDAS)
    ctx{ std::allocator_arg, palloc, salloc,
        std::move( 
         std::bind(
                 [this]( typename std::decay< Fn >::type & fn_, boost::context::execution_context & ctx, void *) mutable noexcept {
                     // create synthesized push_coroutine< T >
                     typename push_coroutine< void >::control_block synthesized_cb{ this, ctx };
                     push_coroutine< void > synthesized{ & synthesized_cb };
                     other = & synthesized_cb;
                     if ( state_t::none == ( state & state_t::destroy) ) {
                         try {
                             auto fn = std::move( fn_);
                             // call coroutine-fn with synthesized push_coroutine as argument
                             fn( synthesized);
                         } catch ( forced_unwind const&) {
                            // do nothing for unwinding exception
                         } catch (...) {
                             // store other exceptions in exception-pointer
                             except = std::current_exception();
                         }
                     }
                     // set termination flags
                     state |= state_t::complete;
                     // jump back to ctx
                     other->ctx();
                     BOOST_ASSERT_MSG( false, "pull_coroutine is complete");
                 },
                 std::forward< Fn >( fn),
                 boost::context::execution_context::current(),
                 std::placeholders::_1))},
#else
    ctx{ std::allocator_arg, palloc, salloc,
         [this,fn_=decay_copy( std::forward< Fn >( fn) ),ctx=boost::context::execution_context::current()] (void *) mutable noexcept {
            // create synthesized push_coroutine< T >
            typename push_coroutine< void >::control_block synthesized_cb{ this, ctx };
            push_coroutine< void > synthesized{ & synthesized_cb };
            other = & synthesized_cb;
            if ( state_t::none == ( state & state_t::destroy) ) {
                try {
                    auto fn = std::move( fn_);
                    // call coroutine-fn with synthesized push_coroutine as argument
                    fn( synthesized);
                } catch ( forced_unwind const&) {
                    // do nothing for unwinding exception
                } catch (...) {
                    // store other exceptions in exception-pointer
                    except = std::current_exception();
                }
            }
            // set termination flags
            state |= state_t::complete;
            // jump back to ctx
            other->ctx();
            BOOST_ASSERT_MSG( false, "pull_coroutine is complete");
         }},
#endif
    other{ nullptr },
    state{ state_t::unwind },
    except{} {
    // enter coroutine-fn in order to have first value available after ctor returns
    ctx();
}

inline
pull_coroutine< void >::control_block::control_block( push_coroutine< void >::control_block * cb,
                                                      boost::context::execution_context const& ctx_) noexcept :
    ctx{ ctx_ },
    other{ cb },
    state{ state_t::none },
    except{} {
}

inline
pull_coroutine< void >::control_block::~control_block() {
    if ( state_t::none == ( state & state_t::complete) &&
         state_t::none != ( state & state_t::unwind) ) {
        // unwind coroutine stack
        other->ctx = boost::context::execution_context::current();
        ctx( context::exec_ontop_arg, unwind_coroutine);
    }
}

inline
void
pull_coroutine< void >::control_block::deallocate() noexcept {
    if ( state_t::none != ( state & state_t::unwind) ) {
        destroy( this);
    }
}

inline
void
pull_coroutine< void >::control_block::resume() {
    other->ctx = boost::context::execution_context::current();
    ctx();
    if ( except) {
        std::rethrow_exception( except);
    }
}

inline
bool
pull_coroutine< void >::control_block::valid() const noexcept {
    return nullptr != other && state_t::none == ( state & state_t::complete);
}

}}}

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_SUFFIX
#endif

#endif // BOOST_COROUTINES2_DETAIL_PULL_CONTROL_BLOCK_IPP
