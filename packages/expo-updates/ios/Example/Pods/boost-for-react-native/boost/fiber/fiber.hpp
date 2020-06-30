
//          Copyright Oliver Kowalke 2013.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_FIBERS_FIBER_H
#define BOOST_FIBERS_FIBER_H

#include <algorithm>
#include <exception>
#include <memory>
#include <utility>

#include <boost/assert.hpp>
#include <boost/config.hpp>
#include <boost/intrusive_ptr.hpp>

#include <boost/fiber/detail/config.hpp>
#include <boost/fiber/detail/disable_overload.hpp>
#include <boost/fiber/context.hpp>
#include <boost/fiber/fixedsize_stack.hpp>
#include <boost/fiber/policy.hpp>
#include <boost/fiber/properties.hpp>
#include <boost/fiber/segmented_stack.hpp>

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_PREFIX
#endif

#ifdef _MSC_VER
# pragma warning(push)
# pragma warning(disable:4251)
#endif

namespace boost {
namespace fibers {

class BOOST_FIBERS_DECL fiber {
private:
    friend class context;

    typedef intrusive_ptr< context >  ptr_t;

    ptr_t       impl_{};

    void start_() noexcept;

public:
    typedef context::id    id;

    fiber() noexcept = default;

    template< typename Fn,
              typename ... Args,
              typename = detail::disable_overload< fiber, Fn >
    >
    fiber( Fn && fn, Args && ... args) :
        fiber{ launch::post,
               std::allocator_arg, default_stack(),
               std::forward< Fn >( fn), std::forward< Args >( args) ... } {
    }

    template< typename Fn,
              typename ... Args,
              typename = detail::disable_overload< fiber, Fn >
    >
    fiber( launch policy, Fn && fn, Args && ... args) :
        fiber{ policy,
               std::allocator_arg, default_stack(),
               std::forward< Fn >( fn), std::forward< Args >( args) ... } {
    }

    template< typename StackAllocator,
              typename Fn,
              typename ... Args
    >
    fiber( std::allocator_arg_t, StackAllocator salloc, Fn && fn, Args && ... args) :
        fiber{ launch::post,
               std::allocator_arg, salloc,
               std::forward< Fn >( fn), std::forward< Args >( args) ... } {
    }

    template< typename StackAllocator,
              typename Fn,
              typename ... Args
    >
    fiber( launch policy, std::allocator_arg_t, StackAllocator salloc, Fn && fn, Args && ... args) :
        impl_{ make_worker_context( policy, salloc, std::forward< Fn >( fn), std::forward< Args >( args) ... ) } {
        start_();
    }

    ~fiber() {
        if ( joinable() ) {
            std::terminate();
        }
    }

    fiber( fiber const&) = delete;
    fiber & operator=( fiber const&) = delete;

    fiber( fiber && other) noexcept :
        impl_{} {
        impl_.swap( other.impl_);
    }

    fiber & operator=( fiber && other) noexcept {
        if ( joinable() ) {
            std::terminate();
        }
        if ( this == & other) return * this;
        impl_.swap( other.impl_);
        return * this;
    }

    void swap( fiber & other) noexcept {
        impl_.swap( other.impl_);
    }

    id get_id() const noexcept {
        return impl_ ? impl_->get_id() : id();
    }

    bool joinable() const noexcept {
        return nullptr != impl_;
    }

    void join();

    void detach();

    template< typename PROPS >
    PROPS & properties() {
        auto props = impl_->get_properties();
        BOOST_ASSERT_MSG(props, "fiber::properties not set");
        return dynamic_cast< PROPS & >( * props );
    }
};

inline
bool operator<( fiber const& l, fiber const& r) noexcept {
    return l.get_id() < r.get_id();
}

inline
void swap( fiber & l, fiber & r) noexcept {
    return l.swap( r);
}

}}

#ifdef _MSC_VER
# pragma warning(pop)
#endif

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_SUFFIX
#endif

#endif // BOOST_FIBERS_FIBER_H
