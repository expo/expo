// Boost.Signals library

// Copyright Douglas Gregor 2001-2004. Use, modification and
// distribution is subject to the Boost Software License, Version
// 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

// For more information, see http://www.boost.org

#ifndef BOOST_SIGNALS_SLOT_HEADER
#define BOOST_SIGNALS_SLOT_HEADER

#include <boost/signals/detail/signals_common.hpp>
#include <boost/signals/connection.hpp>
#include <boost/signals/trackable.hpp>
#include <boost/visit_each.hpp>
#include <boost/shared_ptr.hpp>
#include <cassert>

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_PREFIX
#endif

namespace boost {
  namespace BOOST_SIGNALS_NAMESPACE {
    namespace detail {
      class BOOST_SIGNALS_DECL slot_base {
        // We would have to enumerate all of the signalN classes here as
        // friends to make this private (as it otherwise should be). We can't
        // name all of them because we don't know how many there are.
      public:
        struct data_t {
          std::vector<const trackable*> bound_objects;
          connection watch_bound_objects;
        };
        shared_ptr<data_t> get_data() const { return data; }

        // Get the set of bound objects
        std::vector<const trackable*>& get_bound_objects() const
        { return data->bound_objects; }

        // Determine if this slot is still "active", i.e., all of the bound
        // objects still exist
        bool is_active() const 
        { return data->watch_bound_objects.connected(); }

      protected:
        // Create a connection for this slot
        void create_connection();

        shared_ptr<data_t> data;

      private:
        static void bound_object_destructed(void*, void*) {}
      };
    } // end namespace detail

    // Get the slot so that it can be copied
    template<typename F>
    reference_wrapper<const F>
    get_invocable_slot(const F& f, BOOST_SIGNALS_NAMESPACE::detail::signal_tag)
      { return reference_wrapper<const F>(f); }

    template<typename F>
    const F&
    get_invocable_slot(const F& f, BOOST_SIGNALS_NAMESPACE::detail::reference_tag)
      { return f; }

    template<typename F>
    const F&
    get_invocable_slot(const F& f, BOOST_SIGNALS_NAMESPACE::detail::value_tag)
      { return f; }

    // Get the slot so that it can be inspected for trackable objects
    template<typename F>
    const F&
    get_inspectable_slot(const F& f, BOOST_SIGNALS_NAMESPACE::detail::signal_tag)
      { return f; }

    template<typename F>
    const F&
    get_inspectable_slot(const reference_wrapper<F>& f, BOOST_SIGNALS_NAMESPACE::detail::reference_tag)
      { return f.get(); }

    template<typename F>
    const F&
    get_inspectable_slot(const F& f, BOOST_SIGNALS_NAMESPACE::detail::value_tag)
      { return f; }

    // Determines the type of the slot - is it a signal, a reference to a
    // slot or just a normal slot.
    template<typename F>
    typename BOOST_SIGNALS_NAMESPACE::detail::get_slot_tag<F>::type
    tag_type(const F&)
    {
      typedef typename BOOST_SIGNALS_NAMESPACE::detail::get_slot_tag<F>::type
        the_tag_type;
      the_tag_type tag = the_tag_type();
      return tag;
    }

  } // end namespace BOOST_SIGNALS_NAMESPACE

  template<typename SlotFunction>
  class slot : public BOOST_SIGNALS_NAMESPACE::detail::slot_base {
    typedef BOOST_SIGNALS_NAMESPACE::detail::slot_base inherited;
    typedef typename inherited::data_t data_t;

  public:
    template<typename F>
    slot(const F& f) : slot_function(BOOST_SIGNALS_NAMESPACE::get_invocable_slot(f, BOOST_SIGNALS_NAMESPACE::tag_type(f)))
    {
      this->data.reset(new data_t);

      // Visit each of the bound objects and store them for later use
      // An exception thrown here will allow the basic_connection to be
      // destroyed when this goes out of scope, and no other connections
      // have been made.
      BOOST_SIGNALS_NAMESPACE::detail::bound_objects_visitor 
        do_bind(this->data->bound_objects);
      visit_each(do_bind, 
                 BOOST_SIGNALS_NAMESPACE::get_inspectable_slot
                   (f, BOOST_SIGNALS_NAMESPACE::tag_type(f)));
      create_connection();
    }

#ifdef __BORLANDC__
    template<typename F>
    slot(F* f) : slot_function(f)
    {
      this->data.reset(new data_t);
      create_connection();
    }
#endif // __BORLANDC__

    // We would have to enumerate all of the signalN classes here as friends
    // to make this private (as it otherwise should be). We can't name all of
    // them because we don't know how many there are.
  public:
    // Get the slot function to call the actual slot
    const SlotFunction& get_slot_function() const { return slot_function; }

    void release() const { data->watch_bound_objects.set_controlling(false); }

  private:
    slot(); // no default constructor
    slot& operator=(const slot&); // no assignment operator

    SlotFunction slot_function;
  };
} // end namespace boost

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_SUFFIX
#endif

#endif // BOOST_SIGNALS_SLOT_HEADER
