
//          Copyright Oliver Kowalke 2014.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_COROUTINES2_DETAIL_PUSH_CONTROL_BLOCK_IPP
#define BOOST_COROUTINES2_DETAIL_PUSH_CONTROL_BLOCK_IPP

#include <algorithm>
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

// push_coroutine< T >

template< typename T >
void
push_coroutine< T >::control_block::destroy( control_block * cb) noexcept {
    boost::context::execution_context ctx = cb->ctx;
    // destroy control structure
    cb->state |= state_t::destroy;
    cb->~control_block();
}

template< typename T >
template< typename StackAllocator, typename Fn >
push_coroutine< T >::control_block::control_block( context::preallocated palloc, StackAllocator salloc,
                                                   Fn && fn) :
#if defined(BOOST_NO_CXX14_GENERIC_LAMBDAS)
    ctx{ std::allocator_arg, palloc, salloc,
        std::move( 
         std::bind(
                 [this]( typename std::decay< Fn >::type & fn_, boost::context::execution_context & ctx, void * vp) mutable noexcept {
                     // create synthesized pull_coroutine< T >
                     typename pull_coroutine< T >::control_block synthesized_cb{ this, ctx };
                     pull_coroutine< T > synthesized{ & synthesized_cb };
                     other = & synthesized_cb;
                     if ( state_t::none == ( state & state_t::destroy) ) {
                         try {
                             // jump back to ctor
                             T * t = static_cast< T * >( ctx() );
                             // set transferred value
                             synthesized_cb.set( t);
                             auto fn = std::move( fn_);
                             // call coroutine-fn with synthesized pull_coroutine as argument
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
                     BOOST_ASSERT_MSG( false, "push_coroutine is complete");
                 },
                 std::forward< Fn >( fn),
                 boost::context::execution_context::current(),
                 std::placeholders::_1))},
#else
    ctx{ std::allocator_arg, palloc, salloc,
         [this,fn_=decay_copy( std::forward< Fn >( fn) ),ctx=boost::context::execution_context::current()] (void *) mutable noexcept {
            // create synthesized pull_coroutine< T >
            typename pull_coroutine< T >::control_block synthesized_cb{ this, ctx };
            pull_coroutine< T > synthesized{ & synthesized_cb };
            other = & synthesized_cb;
            if ( state_t::none == ( state & state_t::destroy) ) {
                try {
                    // jump back to ctor
                    T * t = static_cast< T * >( ctx() );
                    // set transferred value
                    synthesized_cb.set( t);
                    auto fn = std::move( fn_);
                    // call coroutine-fn with synthesized pull_coroutine as argument
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
            BOOST_ASSERT_MSG( false, "push_coroutine is complete");
         }},
#endif
    other{ nullptr },
    state{ state_t::unwind },
    except{} {
    // enter coroutine-fn in order to get other set
    ctx();
}

template< typename T >
push_coroutine< T >::control_block::control_block( typename pull_coroutine< T >::control_block * cb,
                                                   boost::context::execution_context const& ctx_) noexcept :
    ctx{ ctx_ },
    other{ cb },
    state{ state_t::none },
    except{} {
}

template< typename T >
push_coroutine< T >::control_block::~control_block() {
    if ( state_t::none == ( state & state_t::complete) &&
         state_t::none != ( state & state_t::unwind) ) {
        // unwind coroutine stack
        other->ctx = boost::context::execution_context::current();
        ctx( context::exec_ontop_arg, unwind_coroutine);
    }
}

template< typename T >
void
push_coroutine< T >::control_block::deallocate() noexcept {
    if ( state_t::none != ( state & state_t::unwind) ) {
        destroy( this);
    }
}

template< typename T >
void
push_coroutine< T >::control_block::resume( T const& t) {
    other->ctx = boost::context::execution_context::current();
    // pass an pointer to other context
    ctx( const_cast< T * >( & t) );
    if ( except) {
        std::rethrow_exception( except);
    }
}

template< typename T >
void
push_coroutine< T >::control_block::resume( T && t) {
    other->ctx = boost::context::execution_context::current();
    // pass an pointer to other context
    ctx( std::addressof( t) );
    if ( except) {
        std::rethrow_exception( except);
    }
}

template< typename T >
bool
push_coroutine< T >::control_block::valid() const noexcept {
    return state_t::none == ( state & state_t::complete );
}


// push_coroutine< T & >

template< typename T >
void
push_coroutine< T & >::control_block::destroy( control_block * cb) noexcept {
    boost::context::execution_context ctx = cb->ctx;
    // destroy control structure
    cb->state |= state_t::destroy;
    cb->~control_block();
}

template< typename T >
template< typename StackAllocator, typename Fn >
push_coroutine< T & >::control_block::control_block( context::preallocated palloc, StackAllocator salloc,
                                                     Fn && fn) :
#if defined(BOOST_NO_CXX14_GENERIC_LAMBDAS)
    ctx{ std::allocator_arg, palloc, salloc,
        std::move( 
         std::bind(
                 [this]( typename std::decay< Fn >::type & fn_, boost::context::execution_context & ctx, void * vp) mutable noexcept {
                     // create synthesized pull_coroutine< T >
                     typename pull_coroutine< T & >::control_block synthesized_cb{ this, ctx };
                     pull_coroutine< T & > synthesized{ & synthesized_cb };
                     other = & synthesized_cb;
                     if ( state_t::none == ( state & state_t::destroy) ) {
                         try {
                             // jump back to ctor
                             T * t = static_cast< T * >( ctx() );
                             // set transferred value
                             synthesized_cb.t = t;
                             auto fn = std::move( fn_);
                             // call coroutine-fn with synthesized pull_coroutine as argument
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
                     BOOST_ASSERT_MSG( false, "push_coroutine is complete");
                 },
                 std::forward< Fn >( fn),
                 boost::context::execution_context::current(),
                 std::placeholders::_1))},
#else
    ctx{ std::allocator_arg, palloc, salloc,
         [this,fn_=decay_copy( std::forward< Fn >( fn) ),ctx=boost::context::execution_context::current()] (void *) mutable noexcept {
            // create synthesized pull_coroutine< T >
            typename pull_coroutine< T & >::control_block synthesized_cb{ this, ctx };
            pull_coroutine< T & > synthesized{ & synthesized_cb };
            other = & synthesized_cb;
            if ( state_t::none == ( state & state_t::destroy) ) {
                try {
                    // jump back to ctor
                    T * t = static_cast< T * >( ctx() );
                    // set transferred value
                    synthesized_cb.t = t;
                    auto fn = std::move( fn_);
                    // call coroutine-fn with synthesized pull_coroutine as argument
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
            BOOST_ASSERT_MSG( false, "push_coroutine is complete");
         }},
#endif
    other{ nullptr },
    state{ state_t::unwind },
    except{} {
    // enter coroutine-fn in order to get other set
    ctx();
}

template< typename T >
push_coroutine< T & >::control_block::control_block( typename pull_coroutine< T & >::control_block * cb,
                                                     boost::context::execution_context const& ctx_) noexcept :
    ctx{ ctx_ },
    other{ cb },
    state{ state_t::none },
    except{} {
}

template< typename T >
push_coroutine< T & >::control_block::~control_block() {
    if ( state_t::none == ( state & state_t::complete) &&
         state_t::none != ( state & state_t::unwind) ) {
        // unwind coroutine stack
        other->ctx = boost::context::execution_context::current();
        ctx( context::exec_ontop_arg, unwind_coroutine);
    }
}

template< typename T >
void
push_coroutine< T & >::control_block::deallocate() noexcept {
    if ( state_t::none != ( state & state_t::unwind) ) {
        destroy( this);
    }
}

template< typename T >
void
push_coroutine< T & >::control_block::resume( T & t) {
    other->ctx = boost::context::execution_context::current();
    // pass an pointer to other context
    ctx( const_cast< typename std::remove_const< T >::type * >( std::addressof( t) ) );
    if ( except) {
        std::rethrow_exception( except);
    }
}

template< typename T >
bool
push_coroutine< T & >::control_block::valid() const noexcept {
    return state_t::none == ( state & state_t::complete );
}


// push_coroutine< void >

inline
void
push_coroutine< void >::control_block::destroy( control_block * cb) noexcept {
    boost::context::execution_context ctx = cb->ctx;
    // destroy control structure
    cb->state |= state_t::destroy;
    cb->~control_block();
}

template< typename StackAllocator, typename Fn >
push_coroutine< void >::control_block::control_block( context::preallocated palloc, StackAllocator salloc, Fn && fn) :
#if defined(BOOST_NO_CXX14_GENERIC_LAMBDAS)
    ctx{ std::allocator_arg, palloc, salloc,
        std::move( 
            std::bind(
                [this]( typename std::decay< Fn >::type & fn_, boost::context::execution_context & ctx,
                        void * vp) mutable noexcept {
                    // create synthesized pull_coroutine< T >
                    typename pull_coroutine< void >::control_block synthesized_cb{ this, ctx };
                    pull_coroutine< void > synthesized{ & synthesized_cb };
                    other = & synthesized_cb;
                    if ( state_t::none == ( state & state_t::destroy) ) {
                        try {
                            // jump back to ctor
                            ctx();
                            auto fn = std::move( fn_);
                            // call coroutine-fn with synthesized pull_coroutine as argument
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
                    BOOST_ASSERT_MSG( false, "push_coroutine is complete");
                },
                std::forward< Fn >( fn),
                boost::context::execution_context::current(),
                std::placeholders::_1))},
#else
    ctx{ std::allocator_arg, palloc, salloc,
         [this,fn_=decay_copy( std::forward< Fn >( fn) ),ctx=boost::context::execution_context::current()] (void *) mutable noexcept {
            // create synthesized pull_coroutine< T >
            typename pull_coroutine< void >::control_block synthesized_cb{ this, ctx };
            pull_coroutine< void > synthesized{ & synthesized_cb };
            other = & synthesized_cb;
            if ( state_t::none == ( state & state_t::destroy) ) {
                try {
                    // jump back to ctor
                    ctx();
                    auto fn = std::move( fn_);
                    // call coroutine-fn with synthesized pull_coroutine as argument
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
            BOOST_ASSERT_MSG( false, "push_coroutine is complete");
         }},
#endif
    other{ nullptr },
    state{ state_t::unwind },
    except{} {
    // enter coroutine-fn in order to get other set
    ctx();
}

inline
push_coroutine< void >::control_block::control_block( pull_coroutine< void >::control_block * cb,
                                                      boost::context::execution_context const& ctx_) noexcept :
    ctx{ ctx_ },
    other{ cb },
    state{ state_t::none },
    except{} {
}

inline
push_coroutine< void >::control_block::~control_block() {
    if ( state_t::none == ( state & state_t::complete) &&
         state_t::none != ( state & state_t::unwind) ) {
        // unwind coroutine stack
        other->ctx = boost::context::execution_context::current();
        ctx( context::exec_ontop_arg, unwind_coroutine);
    }
}

inline
void
push_coroutine< void >::control_block::deallocate() noexcept {
    if ( state_t::none != ( state & state_t::unwind) ) {
        destroy( this);
    }
}

inline
void
push_coroutine< void >::control_block::resume() {
    other->ctx = boost::context::execution_context::current();
    ctx();
    if ( except) {
        std::rethrow_exception( except);
    }
}

inline
bool
push_coroutine< void >::control_block::valid() const noexcept {
    return state_t::none == ( state & state_t::complete );
}

}}}

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_SUFFIX
#endif

#endif // BOOST_COROUTINES2_DETAIL_PUSH_CONTROL_BLOCK_IPP
