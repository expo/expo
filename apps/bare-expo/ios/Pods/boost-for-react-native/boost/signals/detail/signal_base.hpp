// Boost.Signals library

// Copyright Douglas Gregor 2001-2004. Use, modification and
// distribution is subject to the Boost Software License, Version
// 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

// For more information, see http://www.boost.org

#ifndef BOOST_SIGNALS_SIGNAL_BASE_HEADER
#define BOOST_SIGNALS_SIGNAL_BASE_HEADER

#include <boost/signals/detail/config.hpp>
#include <boost/signals/detail/signals_common.hpp>
#include <boost/signals/detail/named_slot_map.hpp>
#include <boost/signals/connection.hpp>
#include <boost/signals/trackable.hpp>
#include <boost/signals/slot.hpp>
#include <boost/smart_ptr.hpp>
#include <boost/noncopyable.hpp>
#include <boost/function/function2.hpp>
#include <utility>
#include <vector>

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_PREFIX
#endif

namespace boost {
  namespace BOOST_SIGNALS_NAMESPACE {
    namespace detail {
      // Must be constructed before calling the slots, because it safely
      // manages call depth
      class BOOST_SIGNALS_DECL call_notification {
      public:
        call_notification(const shared_ptr<signal_base_impl>&);
        ~call_notification();

        shared_ptr<signal_base_impl> impl;
      };

      // Implementation of base class for all signals. It handles the
      // management of the underlying slot lists.
      class BOOST_SIGNALS_DECL signal_base_impl {
      public:
        friend class call_notification;

        typedef function2<bool, stored_group, stored_group> compare_type;

        // Make sure that an exception does not cause the "clearing" flag to
        // remain set
        class temporarily_set_clearing {
        public:
          temporarily_set_clearing(signal_base_impl* b) : base(b)
          {
            base->flags.clearing = true;
          }

          ~temporarily_set_clearing()
          {
            base->flags.clearing = false;
          }

        private:
          signal_base_impl* base;
        };

        friend class temporarily_set_clearing;

        signal_base_impl(const compare_type&, const any&);
        ~signal_base_impl();

        // Disconnect all slots connected to this signal
        void disconnect_all_slots();

        // Are there any connected slots?
        bool empty() const;

        // The number of connected slots
        std::size_t num_slots() const;

        // Disconnect all slots in the given group
        void disconnect(const stored_group&);

        // We're being notified that a slot has disconnected
        static void slot_disconnected(void* obj, void* data);

        connection connect_slot(const any& slot,
                                const stored_group& name,
                                shared_ptr<slot_base::data_t> data,
                                connect_position at);

      private:
        // Remove all of the slots that have been marked "disconnected"
        void remove_disconnected_slots() const;

      public:
        // Our call depth when invoking slots (> 1 when we have a loop)
        mutable int call_depth;

        struct {
          // True if some slots have disconnected, but we were not able to
          // remove them from the list of slots because there are valid
          // iterators into the slot list
          mutable bool delayed_disconnect:1;

          // True if we are disconnecting all disconnected slots
          bool clearing:1;
        } flags;

        // Slots
        mutable named_slot_map slots_;
        any combiner_;

        // Types
        typedef named_slot_map::iterator iterator;
      };

      class BOOST_SIGNALS_DECL signal_base : public noncopyable {
      public:
        typedef signal_base_impl::compare_type compare_type;

        friend class call_notification;

        signal_base(const compare_type& comp, const any& combiner);
        ~signal_base();

      public:
        // Disconnect all slots connected to this signal
        void disconnect_all_slots() { impl->disconnect_all_slots(); }

        // Are there any connected slots?
        bool empty() const { return impl->empty(); }

        // How many slots are connected?
        std::size_t num_slots() const { return impl->num_slots(); }

      protected:
        connection connect_slot(const any& slot,
                                const stored_group& name,
                                shared_ptr<slot_base::data_t> data,
                                connect_position at)
        {
          return impl->connect_slot(slot, name, data, at);
        }

        typedef named_slot_map::iterator iterator;

        shared_ptr<signal_base_impl> impl;
      };
    } // end namespace detail
  } // end namespace BOOST_SIGNALS_NAMESPACE
} // end namespace boost

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_SUFFIX
#endif

#endif // BOOST_SIGNALS_SIGNAL_BASE_HEADER
