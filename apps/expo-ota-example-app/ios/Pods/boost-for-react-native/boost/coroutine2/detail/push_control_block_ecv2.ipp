
//          Copyright Oliver Kowalke 2014.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_COROUTINES2_DETAIL_PUSH_CONTROL_BLOCK_IPP
#define BOOST_COROUTINES2_DETAIL_PUSH_CONTROL_BLOCK_IPP

#include <algorithm>
#include <exception>
#include <memory>

#include <boost/assert.hpp>
#include <boost/config.hpp>

#include <boost/context/execution_context.hpp>

#include <boost/coroutine2/detail/config.hpp>
#include <boost/coroutine2/detail/forced_unwind.hpp>

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
    boost::context::execution_context< T * > ctx = std::move( cb->ctx);
    // destroy control structure
    cb->~control_block();
    // destroy coroutine's stack
    cb->state |= state_t::destroy;
    ctx( nullptr);
}

template< typename T >
template< typename StackAllocator, typename Fn >
push_coroutine< T >::control_block::control_block( context::preallocated palloc, StackAllocator salloc,
                                                   Fn && fn) :
#if defined(BOOST_NO_CXX14_GENERIC_LAMBDAS)
    ctx{ std::allocator_arg, palloc, salloc,
        std::move( 
         std::bind(
             [this]( typename std::decay< Fn >::type & fn_, boost::context::execution_context< T * > && ctx, T * data) mutable {
                // create synthesized pull_coroutine< T >
                typename pull_coroutine< T >::control_block synthesized_cb{ this, ctx };
                pull_coroutine< T > synthesized{ & synthesized_cb };
                other = & synthesized_cb;
                // set transferred value
                synthesized_cb.set( data);
                if ( state_t::none == ( state & state_t::destroy) ) {
                    try {
                        auto fn = std::move( fn_);
                        // call coroutine-fn with synthesized pull_coroutine as argument
                        fn( synthesized);
                    } catch ( boost::context::detail::forced_unwind const&) {
                        throw;
                    } catch (...) {
                        // store other exceptions in exception-pointer
                        except = std::current_exception();
                    }
                }
                // set termination flags
                state |= state_t::complete;
                // jump back to ctx
                auto result = other->ctx( nullptr);
                other->ctx = std::move( std::get< 0 >( result) );
                return std::move( other->ctx);
             },
             std::forward< Fn >( fn),
             std::placeholders::_1,
             std::placeholders::_2))},
#else
    ctx{ std::allocator_arg, palloc, salloc,
         [this,fn_=std::forward< Fn >( fn)]( boost::context::execution_context< T * > && ctx, T * data) mutable {
            // create synthesized pull_coroutine< T >
            typename pull_coroutine< T >::control_block synthesized_cb{ this, ctx };
            pull_coroutine< T > synthesized{ & synthesized_cb };
            other = & synthesized_cb;
            // set transferred value
            synthesized_cb.set( data);
            if ( state_t::none == ( state & state_t::destroy) ) {
                try {
                    auto fn = std::move( fn_);
                    // call coroutine-fn with synthesized pull_coroutine as argument
                    fn( synthesized);
                } catch ( boost::context::detail::forced_unwind const&) {
                    throw;
                } catch (...) {
                    // store other exceptions in exception-pointer
                    except = std::current_exception();
                }
            }
            // set termination flags
            state |= state_t::complete;
            // jump back to ctx
            auto result = other->ctx( nullptr);
            other->ctx = std::move( std::get< 0 >( result) );
            return std::move( other->ctx);
         }},
#endif
    other{ nullptr },
    state{ state_t::unwind },
    except{} {
}

template< typename T >
push_coroutine< T >::control_block::control_block( typename pull_coroutine< T >::control_block * cb,
                                                   boost::context::execution_context< T * > & ctx_) noexcept :
    ctx{ std::move( ctx_) },
    other{ cb },
    state{ state_t::none },
    except{} {
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
push_coroutine< T >::control_block::resume( T const& data) {
    // pass an pointer to other context
    auto result = ctx( const_cast< T * >( & data) );
    ctx = std::move( std::get< 0 >( result) );
    if ( except) {
        std::rethrow_exception( except);
    }
}

template< typename T >
void
push_coroutine< T >::control_block::resume( T && data) {
    // pass an pointer to other context
    auto result = ctx( std::addressof( data) );
    ctx = std::move( std::get< 0 >( result) );
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
    boost::context::execution_context< T * > ctx = std::move( cb->ctx);
    // destroy control structure
    cb->~control_block();
    // destroy coroutine's stack
    cb->state |= state_t::destroy;
    ctx( nullptr);
}

template< typename T >
template< typename StackAllocator, typename Fn >
push_coroutine< T & >::control_block::control_block( context::preallocated palloc, StackAllocator salloc,
                                                     Fn && fn) :
#if defined(BOOST_NO_CXX14_GENERIC_LAMBDAS)
    ctx{ std::allocator_arg, palloc, salloc,
        std::move( 
         std::bind(
             [this]( typename std::decay< Fn >::type & fn_, boost::context::execution_context< T * > && ctx, T * data) mutable {
                // create synthesized pull_coroutine< T & >
                typename pull_coroutine< T & >::control_block synthesized_cb{ this, ctx };
                pull_coroutine< T & > synthesized{ & synthesized_cb };
                other = & synthesized_cb;
                // set transferred value
                synthesized_cb.t = data;
                if ( state_t::none == ( state & state_t::destroy) ) {
                    try {
                        auto fn = std::move( fn_);
                        // call coroutine-fn with synthesized pull_coroutine as argument
                        fn( synthesized);
                    } catch ( boost::context::detail::forced_unwind const&) {
                        throw;
                    } catch (...) {
                        // store other exceptions in exception-pointer
                        except = std::current_exception();
                    }
                }
                // set termination flags
                state |= state_t::complete;
                // jump back to ctx
                auto result = other->ctx( nullptr);
                other->ctx = std::move( std::get< 0 >( result) );
                return std::move( other->ctx);
             },
             std::forward< Fn >( fn),
             std::placeholders::_1,
             std::placeholders::_2))},
#else
    ctx{ std::allocator_arg, palloc, salloc,
         [this,fn_=std::forward< Fn >( fn)]( boost::context::execution_context< T * > && ctx, T * data) mutable {
            // create synthesized pull_coroutine< T & >
            typename pull_coroutine< T & >::control_block synthesized_cb{ this, ctx };
            pull_coroutine< T & > synthesized{ & synthesized_cb };
            other = & synthesized_cb;
            // set transferred value
            synthesized_cb.t = data;
            if ( state_t::none == ( state & state_t::destroy) ) {
                try {
                    auto fn = std::move( fn_);
                    // call coroutine-fn with synthesized pull_coroutine as argument
                    fn( synthesized);
                } catch ( boost::context::detail::forced_unwind const&) {
                    throw;
                } catch (...) {
                    // store other exceptions in exception-pointer
                    except = std::current_exception();
                }
            }
            // set termination flags
            state |= state_t::complete;
            // jump back to ctx
            auto result = other->ctx( nullptr);
            other->ctx = std::move( std::get< 0 >( result) );
            return std::move( other->ctx);
         }},
#endif
    other{ nullptr },
    state{ state_t::unwind },
    except{} {
}

template< typename T >
push_coroutine< T & >::control_block::control_block( typename pull_coroutine< T & >::control_block * cb,
                                                     boost::context::execution_context< T * > & ctx_) noexcept :
    ctx{ std::move( ctx_) },
    other{ cb },
    state{ state_t::none },
    except{} {
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
    // pass an pointer to other context
    auto result = ctx( const_cast< typename std::remove_const< T >::type * >( std::addressof( t) ) );
    ctx = std::move( std::get< 0 >( result) );
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
    boost::context::execution_context< void > ctx = std::move( cb->ctx);
    // destroy control structure
    cb->~control_block();
    // destroy coroutine's stack
    cb->state |= state_t::destroy;
    ctx();
}

template< typename StackAllocator, typename Fn >
push_coroutine< void >::control_block::control_block( context::preallocated palloc, StackAllocator salloc, Fn && fn) :
#if defined(BOOST_NO_CXX14_GENERIC_LAMBDAS)
    ctx{ std::allocator_arg, palloc, salloc,
        std::move( 
         std::bind(
             [this]( typename std::decay< Fn >::type & fn_, boost::context::execution_context< void > && ctx) mutable {
                // create synthesized pull_coroutine< void >
                typename pull_coroutine< void >::control_block synthesized_cb{ this, ctx };
                pull_coroutine< void > synthesized{ & synthesized_cb };
                other = & synthesized_cb;
                if ( state_t::none == ( state & state_t::destroy) ) {
                    try {
                        auto fn = std::move( fn_);
                        // call coroutine-fn with synthesized pull_coroutine as argument
                        fn( synthesized);
                    } catch ( boost::context::detail::forced_unwind const&) {
                        throw;
                    } catch (...) {
                        // store other exceptions in exception-pointer
                        except = std::current_exception();
                    }
                }
                // set termination flags
                state |= state_t::complete;
                // jump back to ctx
                other->ctx = other->ctx();
                return std::move( other->ctx);
             },
             std::forward< Fn >( fn),
             std::placeholders::_1))},
#else
    ctx{ std::allocator_arg, palloc, salloc,
         [this,fn_=std::forward< Fn >( fn)]( boost::context::execution_context< void > && ctx) mutable {
            // create synthesized pull_coroutine< void >
            typename pull_coroutine< void >::control_block synthesized_cb{ this, ctx};
            pull_coroutine< void > synthesized{ & synthesized_cb };
            other = & synthesized_cb;
            if ( state_t::none == ( state & state_t::destroy) ) {
                try {
                    auto fn = std::move( fn_);
                    // call coroutine-fn with synthesized pull_coroutine as argument
                    fn( synthesized);
                } catch ( boost::context::detail::forced_unwind const&) {
                    throw;
                } catch (...) {
                    // store other exceptions in exception-pointer
                    except = std::current_exception();
                }
            }
            // set termination flags
            state |= state_t::complete;
            // jump back to ctx
            other->ctx = other->ctx();
            return std::move( other->ctx);
         }},
#endif
    other{ nullptr },
    state{ state_t::unwind },
    except{} {
}

inline
push_coroutine< void >::control_block::control_block( pull_coroutine< void >::control_block * cb,
                                                      boost::context::execution_context< void > & ctx_) noexcept :
    ctx{ std::move( ctx_) },
    other{ cb },
    state{ state_t::none },
    except{} {
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
    ctx = ctx();
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
