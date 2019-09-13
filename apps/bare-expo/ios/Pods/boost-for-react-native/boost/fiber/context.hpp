
//          Copyright Oliver Kowalke 2013.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_FIBERS_CONTEXT_H
#define BOOST_FIBERS_CONTEXT_H

#include <atomic>
#include <chrono>
#include <exception>
#include <functional>
#include <map>
#include <memory>
#include <type_traits>

#include <boost/assert.hpp>
#include <boost/config.hpp>
#include <boost/context/detail/apply.hpp>
#include <boost/context/execution_context.hpp>
#include <boost/context/stack_context.hpp>
#include <boost/intrusive/list.hpp>
#include <boost/intrusive/parent_from_member.hpp>
#include <boost/intrusive_ptr.hpp>
#include <boost/intrusive/set.hpp>

#include <boost/fiber/detail/config.hpp>
#include <boost/fiber/detail/data.hpp>
#include <boost/fiber/detail/decay_copy.hpp>
#include <boost/fiber/detail/fss.hpp>
#include <boost/fiber/detail/spinlock.hpp>
#include <boost/fiber/detail/wrap.hpp>
#include <boost/fiber/exceptions.hpp>
#include <boost/fiber/fixedsize_stack.hpp>
#include <boost/fiber/policy.hpp>
#include <boost/fiber/properties.hpp>
#include <boost/fiber/segmented_stack.hpp>
#include <boost/fiber/type.hpp>

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_PREFIX
#endif

#ifdef _MSC_VER
# pragma warning(push)
# pragma warning(disable:4251)
#endif

namespace boost {
namespace fibers {

class context;
class fiber;
class scheduler;

namespace detail {

struct wait_tag;
typedef intrusive::list_member_hook<
    intrusive::tag< wait_tag >,
    intrusive::link_mode<
        intrusive::auto_unlink
    >
>                                 wait_hook;
// declaration of the functor that converts between
// the context class and the wait-hook
struct wait_functor {
    // required types
    typedef wait_hook               hook_type;
    typedef hook_type           *   hook_ptr;
    typedef const hook_type     *   const_hook_ptr;
    typedef context                 value_type;
    typedef value_type          *   pointer;
    typedef const value_type    *   const_pointer;

    // required static functions
    static hook_ptr to_hook_ptr( value_type &value);
    static const_hook_ptr to_hook_ptr( value_type const& value);
    static pointer to_value_ptr( hook_ptr n);
    static const_pointer to_value_ptr( const_hook_ptr n);
};

struct ready_tag;
typedef intrusive::list_member_hook<
    intrusive::tag< ready_tag >,
    intrusive::link_mode<
        intrusive::auto_unlink
    >
>                                       ready_hook;

struct sleep_tag;
typedef intrusive::set_member_hook<
    intrusive::tag< sleep_tag >,
    intrusive::link_mode<
        intrusive::auto_unlink
    >
>                                       sleep_hook;

struct terminated_tag;
typedef intrusive::list_member_hook<
    intrusive::tag< terminated_tag >,
    intrusive::link_mode<
        intrusive::auto_unlink
    >
>                                       terminated_hook;

struct worker_tag;
typedef intrusive::list_member_hook<
    intrusive::tag< worker_tag >,
    intrusive::link_mode<
        intrusive::auto_unlink
    >
>                                       worker_hook;

}

struct main_context_t {};
const main_context_t main_context{};

struct dispatcher_context_t {};
const dispatcher_context_t dispatcher_context{};

struct worker_context_t {};
const worker_context_t worker_context{};

class BOOST_FIBERS_DECL context {
private:
    friend class scheduler;

    enum flag_t {
        flag_terminated = 1 << 1
    };

    struct fss_data {
        void                                *   vp{ nullptr };
        detail::fss_cleanup_function::ptr_t     cleanup_function{};

        fss_data() noexcept {
        }

        fss_data( void * vp_,
                  detail::fss_cleanup_function::ptr_t const& fn) noexcept :
            vp( vp_),
            cleanup_function( fn) {
            BOOST_ASSERT( cleanup_function);
        }

        void do_cleanup() {
            ( * cleanup_function)( vp);
        }
    };

    typedef std::map< uintptr_t, fss_data >     fss_data_t;

#if ! defined(BOOST_FIBERS_NO_ATOMICS)
    std::atomic< std::size_t >                      use_count_{ 0 };
    std::atomic< unsigned int >                     flags_;
    std::atomic< type >                             type_;
    std::atomic< scheduler * >                      scheduler_{ nullptr };
#else
    std::size_t                                     use_count_{ 0 };
    unsigned int                                    flags_;
    type                                            type_;
    scheduler                                   *   scheduler_{ nullptr };
#endif
    launch                                          policy_{ launch::post };
#if (BOOST_EXECUTION_CONTEXT==1)
    boost::context::execution_context               ctx_;
#else
    boost::context::execution_context< detail::data_t * >   ctx_;
#endif

    void resume_( detail::data_t &) noexcept;
    void set_ready_( context *) noexcept;

#if (BOOST_EXECUTION_CONTEXT==1)
    template< typename Fn, typename Tpl >
    void run_( Fn && fn_, Tpl && tpl_, detail::data_t * dp) noexcept {
        {
            // fn and tpl must be destroyed before calling set_terminated()
            typename std::decay< Fn >::type fn = std::forward< Fn >( fn_);
            typename std::decay< Tpl >::type tpl = std::forward< Tpl >( tpl_);
            if ( nullptr != dp->lk) {
                dp->lk->unlock();
            } else if ( nullptr != dp->ctx) {
                active()->set_ready_( dp->ctx);
            }
            boost::context::detail::apply( std::move( fn), std::move( tpl) );
        }
        // terminate context
        set_terminated();
        BOOST_ASSERT_MSG( false, "fiber already terminated");
    }
#else
    template< typename Fn, typename Tpl >
    boost::context::execution_context< detail::data_t * >
    run_( boost::context::execution_context< detail::data_t * > && ctx, Fn && fn_, Tpl && tpl_, detail::data_t * dp) noexcept {
        {
            // fn and tpl must be destroyed before calling set_terminated()
            typename std::decay< Fn >::type fn = std::forward< Fn >( fn_);
            typename std::decay< Tpl >::type tpl = std::forward< Tpl >( tpl_);
            // update execution_context of calling fiber
            dp->from->ctx_ = std::move( ctx);
            if ( nullptr != dp->lk) {
                dp->lk->unlock();
            } else if ( nullptr != dp->ctx) {
                active()->set_ready_( dp->ctx);
            }
            boost::context::detail::apply( std::move( fn), std::move( tpl) );
        }
        // terminate context
        return set_terminated();
    }
#endif

public:
    detail::ready_hook                      ready_hook_{};
    detail::sleep_hook                      sleep_hook_{};
    detail::terminated_hook                 terminated_hook_{};
    detail::wait_hook                       wait_hook_{};
    detail::worker_hook                     worker_hook_{};
    std::atomic< context * >                remote_nxt_{ nullptr };
    std::chrono::steady_clock::time_point   tp_{ (std::chrono::steady_clock::time_point::max)() };

    typedef intrusive::list<
        context,
        intrusive::function_hook< detail::wait_functor >,
        intrusive::constant_time_size< false > >   wait_queue_t;

private:
    fss_data_t                              fss_data_{};
    wait_queue_t                            wait_queue_{};
    detail::spinlock                        splk_{};
    fiber_properties                    *   properties_{ nullptr };

public:
    class id {
    private:
        context  *   impl_{ nullptr };

    public:
        id() noexcept {
        }

        explicit id( context * impl) noexcept :
            impl_( impl) {
        }

        bool operator==( id const& other) const noexcept {
            return impl_ == other.impl_;
        }

        bool operator!=( id const& other) const noexcept {
            return impl_ != other.impl_;
        }

        bool operator<( id const& other) const noexcept {
            return impl_ < other.impl_;
        }

        bool operator>( id const& other) const noexcept {
            return other.impl_ < impl_;
        }

        bool operator<=( id const& other) const noexcept {
            return ! ( * this > other);
        }

        bool operator>=( id const& other) const noexcept {
            return ! ( * this < other);
        }

        template< typename charT, class traitsT >
        friend std::basic_ostream< charT, traitsT > &
        operator<<( std::basic_ostream< charT, traitsT > & os, id const& other) {
            if ( nullptr != other.impl_) {
                return os << other.impl_;
            } else {
                return os << "{not-valid}";
            }
        }

        explicit operator bool() const noexcept {
            return nullptr != impl_;
        }

        bool operator!() const noexcept {
            return nullptr == impl_;
        }
    };

    static context * active() noexcept;

    static void reset_active() noexcept;

    // main fiber context
    explicit context( main_context_t) noexcept;

    // dispatcher fiber context
    context( dispatcher_context_t, boost::context::preallocated const&,
             default_stack const&, scheduler *);

    // worker fiber context
    template< typename StackAlloc,
              typename Fn,
              typename Tpl
    >
    context( worker_context_t,
             launch policy,
             boost::context::preallocated palloc, StackAlloc salloc,
             Fn && fn, Tpl && tpl) :
        use_count_{ 1 }, // fiber instance or scheduler owner
        flags_{ 0 },
        type_{ type::worker_context },
        policy_{ policy },
#if (BOOST_EXECUTION_CONTEXT==1)
# if defined(BOOST_NO_CXX14_GENERIC_LAMBDAS)
        ctx_{ std::allocator_arg, palloc, salloc,
              detail::wrap(
                  [this]( typename std::decay< Fn >::type & fn, typename std::decay< Tpl >::type & tpl,
                          boost::context::execution_context & ctx, void * vp) mutable noexcept {
                        run_( std::move( fn), std::move( tpl), static_cast< detail::data_t * >( vp) );
                  },
                  std::forward< Fn >( fn),
                  std::forward< Tpl >( tpl),
                  boost::context::execution_context::current() )
              }
# else
        ctx_{ std::allocator_arg, palloc, salloc,
              [this,fn=detail::decay_copy( std::forward< Fn >( fn) ),tpl=std::forward< Tpl >( tpl),
               ctx=boost::context::execution_context::current()] (void * vp) mutable noexcept {
                    run_( std::move( fn), std::move( tpl), static_cast< detail::data_t * >( vp) );
              }}
# endif
#else
# if defined(BOOST_NO_CXX14_GENERIC_LAMBDAS)
        ctx_{ std::allocator_arg, palloc, salloc,
              detail::wrap(
                  [this]( typename std::decay< Fn >::type & fn, typename std::decay< Tpl >::type & tpl,
                          boost::context::execution_context< detail::data_t * > && ctx, detail::data_t * dp) mutable noexcept {
                        return run_( std::forward< boost::context::execution_context< detail::data_t * > >( ctx), std::move( fn), std::move( tpl), dp);
                  },
                  std::forward< Fn >( fn),
                  std::forward< Tpl >( tpl) )}

# else
        ctx_{ std::allocator_arg, palloc, salloc,
              [this,fn=detail::decay_copy( std::forward< Fn >( fn) ),tpl=std::forward< Tpl >( tpl)]
               (boost::context::execution_context< detail::data_t * > && ctx, detail::data_t * dp) mutable noexcept {
                    return run_( std::forward< boost::context::execution_context< detail::data_t * > >( ctx), std::move( fn), std::move( tpl), dp);
              }}
# endif
#endif
    {}

    context( context const&) = delete;
    context & operator=( context const&) = delete;

    virtual ~context();

    scheduler * get_scheduler() const noexcept {
#if ! defined(BOOST_FIBERS_NO_ATOMICS)
        return scheduler_.load( std::memory_order_relaxed);
#else
        return scheduler_;
#endif
    }

    id get_id() const noexcept;

    void resume() noexcept;
    void resume( detail::spinlock_lock &) noexcept;
    void resume( context *) noexcept;

    void suspend() noexcept;
    void suspend( detail::spinlock_lock &) noexcept;

#if (BOOST_EXECUTION_CONTEXT==1)
    void set_terminated() noexcept;
#else
    boost::context::execution_context< detail::data_t * > suspend_with_cc() noexcept;
    boost::context::execution_context< detail::data_t * > set_terminated() noexcept;
#endif
    void join();

    void yield() noexcept;

    bool wait_until( std::chrono::steady_clock::time_point const&) noexcept;
    bool wait_until( std::chrono::steady_clock::time_point const&,
                     detail::spinlock_lock &) noexcept;

    void set_ready( context *) noexcept;

    bool is_context( type t) const noexcept {
        return type::none != ( type_ & t);
    }

    bool is_terminated() const noexcept {
        return 0 != ( flags_ & flag_terminated);
    }

    void * get_fss_data( void const * vp) const;

    void set_fss_data(
        void const * vp,
        detail::fss_cleanup_function::ptr_t const& cleanup_fn,
        void * data,
        bool cleanup_existing);

    void set_properties( fiber_properties * props) noexcept;

    fiber_properties * get_properties() const noexcept {
        return properties_;
    }

    launch get_policy() const noexcept {
        return policy_;
    }

    bool ready_is_linked() const noexcept;

    bool sleep_is_linked() const noexcept;

    bool terminated_is_linked() const noexcept;

    bool wait_is_linked() const noexcept;

    bool worker_is_linked() const noexcept;

    template< typename List >
    void ready_link( List & lst) noexcept {
        static_assert( std::is_same< typename List::value_traits::hook_type, detail::ready_hook >::value, "not a ready-queue");
        lst.push_back( * this);
    }

    template< typename Set >
    void sleep_link( Set & set) noexcept {
        static_assert( std::is_same< typename Set::value_traits::hook_type,detail::sleep_hook >::value, "not a sleep-queue");
        set.insert( * this);
    }

    template< typename List >
    void terminated_link( List & lst) noexcept {
        static_assert( std::is_same< typename List::value_traits::hook_type, detail::terminated_hook >::value, "not a terminated-queue");
        lst.push_back( * this);
    }

    template< typename List >
    void wait_link( List & lst) noexcept {
        static_assert( std::is_same< typename List::value_traits::hook_type, detail::wait_hook >::value, "not a wait-queue");
        lst.push_back( * this);
    }

    template< typename List >
    void worker_link( List & lst) noexcept {
        static_assert( std::is_same< typename List::value_traits::hook_type, detail::worker_hook >::value, "not a worker-queue");
        lst.push_back( * this);
    }

    void ready_unlink() noexcept;

    void sleep_unlink() noexcept;

    void wait_unlink() noexcept;

    void worker_unlink() noexcept;

    void detach() noexcept;

    void attach( context *) noexcept;

    friend void intrusive_ptr_add_ref( context * ctx) noexcept {
        BOOST_ASSERT( nullptr != ctx);
        ++ctx->use_count_;
    }

    friend void intrusive_ptr_release( context * ctx) noexcept {
        BOOST_ASSERT( nullptr != ctx);
        if ( 0 == --ctx->use_count_) {
#if (BOOST_EXECUTION_CONTEXT==1)
            boost::context::execution_context ec( ctx->ctx_);
            // destruct context
            // deallocates stack (execution_context is ref counted)
            ctx->~context();
#else
            boost::context::execution_context< detail::data_t * > cc( std::move( ctx->ctx_) );
            // destruct context
            ctx->~context();
            // deallocated stack
            cc( nullptr);
#endif
        }
    }
};

inline
bool operator<( context const& l, context const& r) noexcept {
    return l.get_id() < r.get_id();
}

template< typename StackAlloc, typename Fn, typename ... Args >
static intrusive_ptr< context > make_worker_context( launch policy,
                                                     StackAlloc salloc,
                                                     Fn && fn, Args && ... args) {
    boost::context::stack_context sctx = salloc.allocate();
#if defined(BOOST_NO_CXX14_CONSTEXPR) || defined(BOOST_NO_CXX11_STD_ALIGN)
    // reserve space for control structure
    const std::size_t size = sctx.size - sizeof( context);
    void * sp = static_cast< char * >( sctx.sp) - sizeof( context);
#else
    constexpr std::size_t func_alignment = 64; // alignof( context);
    constexpr std::size_t func_size = sizeof( context);
    // reserve space on stack
    void * sp = static_cast< char * >( sctx.sp) - func_size - func_alignment;
    // align sp pointer
    std::size_t space = func_size + func_alignment;
    sp = std::align( func_alignment, func_size, sp, space);
    BOOST_ASSERT( nullptr != sp);
    // calculate remaining size
    const std::size_t size = sctx.size - ( static_cast< char * >( sctx.sp) - static_cast< char * >( sp) );
#endif
    // placement new of context on top of fiber's stack
    return intrusive_ptr< context >( 
            ::new ( sp) context(
                worker_context,
                policy,
                boost::context::preallocated( sp, size, sctx),
                salloc,
                std::forward< Fn >( fn),
                std::make_tuple( std::forward< Args >( args) ... ) ) );
}

namespace detail {

inline
wait_functor::hook_ptr wait_functor::to_hook_ptr( wait_functor::value_type & value) {
    return & value.wait_hook_;
}

inline
wait_functor::const_hook_ptr wait_functor::to_hook_ptr( wait_functor::value_type const& value) {
    return & value.wait_hook_;
}

inline
wait_functor::pointer wait_functor::to_value_ptr( wait_functor::hook_ptr n) {
    return intrusive::get_parent_from_member< context >( n, & context::wait_hook_);
}

inline
wait_functor::const_pointer wait_functor::to_value_ptr( wait_functor::const_hook_ptr n) {
    return intrusive::get_parent_from_member< context >( n, & context::wait_hook_);
}

}}}

#ifdef _MSC_VER
# pragma warning(pop)
#endif

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_SUFFIX
#endif

#endif // BOOST_FIBERS_CONTEXT_H
