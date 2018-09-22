
//          Copyright Oliver Kowalke 2013.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_FIBERS_PACKAGED_TASK_HPP
#define BOOST_FIBERS_PACKAGED_TASK_HPP

#include <algorithm>
#include <memory>
#include <type_traits>
#include <utility>

#include <boost/config.hpp>

#include <boost/fiber/detail/convert.hpp>
#include <boost/fiber/detail/disable_overload.hpp>
#include <boost/fiber/exceptions.hpp>
#include <boost/fiber/future/detail/task_base.hpp>
#include <boost/fiber/future/detail/task_object.hpp>
#include <boost/fiber/future/future.hpp>

namespace boost {
namespace fibers {

template< typename Signature >
class packaged_task;

template< typename R, typename ... Args >
class packaged_task< R( Args ... ) > {
private:
    typedef typename detail::task_base< R, Args ... >::ptr_t   ptr_t;

    bool            obtained_{ false };
    ptr_t           task_{};

public:
    constexpr packaged_task() noexcept = default;

    template< typename Fn,
              typename = detail::disable_overload< packaged_task, Fn >
    >
    explicit packaged_task( Fn && fn) : 
        packaged_task{ std::allocator_arg,
                       std::allocator< packaged_task >{},
                       std::forward< Fn >( fn)  } {
    }

    template< typename Fn,
              typename Allocator
    >
    explicit packaged_task( std::allocator_arg_t, Allocator const& alloc, Fn && fn) {
        typedef detail::task_object<
            typename std::decay< Fn >::type, Allocator, R, Args ...
        >                                       object_t;
        typedef std::allocator_traits<
            typename object_t::allocator_t
        >                                       traits_t;

        typename object_t::allocator_t a{ alloc };
        typename traits_t::pointer ptr{ traits_t::allocate( a, 1) };
        try {
            traits_t::construct( a, ptr, a, std::forward< Fn >( fn) );
        } catch (...) {
            traits_t::deallocate( a, ptr, 1);
            throw;
        }
        task_.reset( convert( ptr) );
    }

    ~packaged_task() {
        if ( task_) {
            task_->owner_destroyed();
        }
    }

    packaged_task( packaged_task const&) = delete;
    packaged_task & operator=( packaged_task const&) = delete;

    packaged_task( packaged_task && other) noexcept :
        obtained_{ other.obtained_ },
        task_{ std::move( other.task_)  } {
        other.obtained_ = false;
    }

    packaged_task & operator=( packaged_task && other) noexcept {
        if ( this == & other) return * this;
        packaged_task tmp{ std::move( other) };
        swap( tmp);
        return * this;
    }

    void swap( packaged_task & other) noexcept {
        std::swap( obtained_, other.obtained_);
        task_.swap( other.task_);
    }

    bool valid() const noexcept {
        return nullptr != task_.get();
    }

    future< R > get_future() {
        if ( obtained_) {
            throw future_already_retrieved{};
        }
        if ( ! valid() ) {
            throw packaged_task_uninitialized{};
        }
        obtained_ = true;
        return future< R >{
             boost::static_pointer_cast< detail::shared_state< R > >( task_) };
    }

    void operator()( Args ... args) {
        if ( ! valid() ) {
            throw packaged_task_uninitialized{};
        }
        task_->run( std::forward< Args >( args) ... );
    }

    void reset() {
        if ( ! valid() ) {
            throw packaged_task_uninitialized{};
        }
        packaged_task tmp;
        tmp.task_ = task_;
        task_ = tmp.task_->reset();
        obtained_ = false;
    }
};

template< typename Signature >
void swap( packaged_task< Signature > & l, packaged_task< Signature > & r) noexcept {
    l.swap( r);
}

}}

#endif // BOOST_FIBERS_PACKAGED_TASK_HPP
