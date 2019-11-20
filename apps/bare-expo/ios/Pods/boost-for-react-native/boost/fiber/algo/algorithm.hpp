//          Copyright Oliver Kowalke 2013.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_FIBERS_ALGO_ALGORITHM_H
#define BOOST_FIBERS_ALGO_ALGORITHM_H

#include <cstddef>
#include <chrono>

#include <boost/config.hpp>
#include <boost/assert.hpp>

#include <boost/fiber/properties.hpp>
#include <boost/fiber/detail/config.hpp>

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_PREFIX
#endif

namespace boost {
namespace fibers {

class context;

namespace algo {

struct BOOST_FIBERS_DECL algorithm {
    virtual ~algorithm() {}

    virtual void awakened( context *) noexcept = 0;

    virtual context * pick_next() noexcept = 0;

    virtual bool has_ready_fibers() const noexcept = 0;

    virtual void suspend_until( std::chrono::steady_clock::time_point const&) noexcept = 0;

    virtual void notify() noexcept = 0;
};

class BOOST_FIBERS_DECL algorithm_with_properties_base : public algorithm {
public:
    // called by fiber_properties::notify() -- don't directly call
    virtual void property_change_( context * f, fiber_properties * props) noexcept = 0;

protected:
    static fiber_properties* get_properties( context * f) noexcept;
    static void set_properties( context * f, fiber_properties * p) noexcept;
};

template< typename PROPS >
struct algorithm_with_properties : public algorithm_with_properties_base {
    typedef algorithm_with_properties_base super;

    // Mark this override 'final': algorithm_with_properties subclasses
    // must override awakened() with properties parameter instead. Otherwise
    // you'd have to remember to start every subclass awakened() override
    // with: algorithm_with_properties<PROPS>::awakened(fb);
    virtual void awakened( context * f) noexcept override final {
        fiber_properties * props = super::get_properties( f);
        if ( nullptr == props) {
            // TODO: would be great if PROPS could be allocated on the new
            // fiber's stack somehow
            props = new_properties( f);
            // It is not good for new_properties() to return 0.
            BOOST_ASSERT_MSG(props, "new_properties() must return non-NULL");
            // new_properties() must return instance of (a subclass of) PROPS
            BOOST_ASSERT_MSG( dynamic_cast< PROPS * >( props),
                              "new_properties() must return properties class");
            super::set_properties( f, props);
        }
        // Set algo_ again every time this fiber becomes READY. That
        // handles the case of a fiber migrating to a new thread with a new
        // algorithm subclass instance.
        props->set_algorithm( this);

        // Okay, now forward the call to subclass override.
        awakened( f, properties(f) );
    }

    // subclasses override this method instead of the original awakened()
    virtual void awakened( context *, PROPS& ) noexcept = 0;

    // used for all internal calls
    PROPS & properties( context * f) noexcept {
        return static_cast< PROPS & >( * super::get_properties( f) );
    }

    // override this to be notified by PROPS::notify()
    virtual void property_change( context * f, PROPS & props) noexcept {
    }

    // implementation for algorithm_with_properties_base method
    void property_change_( context * f, fiber_properties * props ) noexcept override final {
        property_change( f, * static_cast< PROPS * >( props) );
    }

    // Override this to customize instantiation of PROPS, e.g. use a different
    // allocator. Each PROPS instance is associated with a particular
    // context.
    virtual fiber_properties * new_properties( context * f) {
        return new PROPS( f);
    }
};

}}}

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_SUFFIX
#endif

#endif // BOOST_FIBERS_ALGO_ALGORITHM_H
