
//          Copyright Oliver Kowalke 2014.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_COROUTINES2_DETAIL_PULL_CONTROL_BLOCK_IPP
#define BOOST_COROUTINES2_DETAIL_PULL_CONTROL_BLOCK_IPP

#include <algorithm>
#include <exception>
#include <memory>
#include <tuple>

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

// pull_coroutine< T >

template< typename T >
void
pull_coroutine< T >::control_block::destroy( control_block * cb) noexcept {
    boost::context::execution_context< T * > ctx = std::move( cb->ctx);
    // destroy control structure
    cb->~control_block();
    // destroy coroutine's stack
    cb->state |= state_t::destroy;
    ctx( nullptr);
}

template< typename T >
template< typename StackAllocator, typename Fn >
pull_coroutine< T >::control_block::control_block( context::preallocated palloc, StackAllocator salloc,
                                                   Fn && fn) :
#if defined(BOOST_NO_CXX14_GENERIC_LAMBDAS)
    ctx{ std::allocator_arg, palloc, salloc,
        std::move(
         std::bind(
             [this]( typename std::decay< Fn >::type & fn_, boost::context::execution_context< T * > && ctx, T *) mutable {
                // create synthesized push_coroutine< T >
                typename push_coroutine< T >::control_block synthesized_cb{ this, ctx };
                push_coroutine< T > synthesized{ & synthesized_cb };
                other = & synthesized_cb;
                if ( state_t::none == ( state & state_t::destroy) ) {
                    try {
                        auto fn = std::move( fn_);
                        // call coroutine-fn with synthesized push_coroutine as argument
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
         [this,fn_=std::forward< Fn >( fn)]( boost::context::execution_context< T * > && ctx, T *) mutable {
            // create synthesized push_coroutine< T >
            typename push_coroutine< T >::control_block synthesized_cb{ this, ctx };
            push_coroutine< T > synthesized{ & synthesized_cb };
            other = & synthesized_cb;
            if ( state_t::none == ( state & state_t::destroy) ) {
                try {
                    auto fn = std::move( fn_);
                    // call coroutine-fn with synthesized push_coroutine as argument
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
    except{},
    bvalid{ false },
    storage{} {
    // enter coroutine-fn in order to have first value available after ctor (of `*this`) returns
    resume();
}

template< typename T >
pull_coroutine< T >::control_block::control_block( typename push_coroutine< T >::control_block * cb,
                                                   boost::context::execution_context< T * > & ctx_) noexcept :
    ctx{ std::move( ctx_) },
    other{ cb },
    state{ state_t::none },
    except{},
    bvalid{ false },
    storage{} {
}

template< typename T >
pull_coroutine< T >::control_block::~control_block() {
    // destroy data if set
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
    auto result = ctx( nullptr);
    ctx = std::move( std::get< 0 >( result) );
    set( std::get< 1 >( result) );
    if ( except) {
        std::rethrow_exception( except);
    }
}

template< typename T >
void
pull_coroutine< T >::control_block::set( T * t) {
    // destroy data if set
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
pull_coroutine< T >::control_block::get() noexcept {
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
    boost::context::execution_context< T * > ctx = std::move( cb->ctx);
    // destroy control structure
    cb->~control_block();
    // destroy coroutine's stack
    cb->state |= state_t::destroy;
    ctx( nullptr);
}

template< typename T >
template< typename StackAllocator, typename Fn >
pull_coroutine< T & >::control_block::control_block( context::preallocated palloc, StackAllocator salloc,
                                                     Fn && fn) :
#if defined(BOOST_NO_CXX14_GENERIC_LAMBDAS)
    ctx{ std::allocator_arg, palloc, salloc,
        std::move(
         std::bind(
             [this]( typename std::decay< Fn >::type & fn_, boost::context::execution_context< T *> && ctx, T *) mutable {
                // create synthesized push_coroutine< T & >
                typename push_coroutine< T & >::control_block synthesized_cb{ this, ctx };
                push_coroutine< T & > synthesized{ & synthesized_cb };
                other = & synthesized_cb;
                if ( state_t::none == ( state & state_t::destroy) ) {
                    try {
                        auto fn = std::move( fn_);
                        // call coroutine-fn with synthesized push_coroutine as argument
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
         [this,fn_=std::forward< Fn >( fn)]( boost::context::execution_context< T * > && ctx, T *) mutable {
            // create synthesized push_coroutine< T & >
            typename push_coroutine< T & >::control_block synthesized_cb{ this, ctx };
            push_coroutine< T & > synthesized{ & synthesized_cb };
            other = & synthesized_cb;
            if ( state_t::none == ( state & state_t::destroy) ) {
                try {
                    auto fn = std::move( fn_);
                    // call coroutine-fn with synthesized push_coroutine as argument
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
    except{},
    t{ nullptr } {
    // enter coroutine-fn in order to have first value available after ctor (of `*this`) returns
    resume();
}

template< typename T >
pull_coroutine< T & >::control_block::control_block( typename push_coroutine< T & >::control_block * cb,
                                                     boost::context::execution_context< T * > & ctx_) noexcept :
    ctx{ std::move( ctx_) },
    other{ cb },
    state{ state_t::none },
    except{},
    t{ nullptr } {
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
    auto result = ctx( nullptr);
    ctx = std::move( std::get< 0 >( result) );
    t = std::get< 1 >( result);
    if ( except) {
        std::rethrow_exception( except);
    }
}

template< typename T >
T &
pull_coroutine< T & >::control_block::get() noexcept {
    return * t;
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
    boost::context::execution_context< void > ctx = std::move( cb->ctx);
    // destroy control structure
    cb->~control_block();
    // destroy coroutine's stack
    cb->state |= state_t::destroy;
    ctx();
}

template< typename StackAllocator, typename Fn >
pull_coroutine< void >::control_block::control_block( context::preallocated palloc, StackAllocator salloc,
                                                      Fn && fn) :
#if defined(BOOST_NO_CXX14_GENERIC_LAMBDAS)
    ctx{ std::allocator_arg, palloc, salloc,
        std::move(
         std::bind(
             [this]( typename std::decay< Fn >::type & fn_, boost::context::execution_context< void > && ctx) mutable {
                // create synthesized push_coroutine< void >
                typename push_coroutine< void >::control_block synthesized_cb{ this, ctx };
                push_coroutine< void > synthesized{ & synthesized_cb };
                other = & synthesized_cb;
                if ( state_t::none == ( state & state_t::destroy) ) {
                    try {
                        auto fn = std::move( fn_);
                        // call coroutine-fn with synthesized push_coroutine as argument
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
            // create synthesized push_coroutine< void >
            typename push_coroutine< void >::control_block synthesized_cb{ this, ctx };
            push_coroutine< void > synthesized{ & synthesized_cb };
            other = & synthesized_cb;
            if ( state_t::none == ( state & state_t::destroy) ) {
                try {
                    auto fn = std::move( fn_);
                    // call coroutine-fn with synthesized push_coroutine as argument
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
    // enter coroutine-fn in order to have first value available after ctor (of `*this`) returns
    resume();
}

inline
pull_coroutine< void >::control_block::control_block( push_coroutine< void >::control_block * cb,
                                                      boost::context::execution_context< void > & ctx_) noexcept :
    ctx{ std::move( ctx_) },
    other{ cb },
    state{ state_t::none },
    except{} {
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
    ctx = ctx();
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
