// Boost.Signals library

// Copyright Douglas Gregor 2001-2004. Use, modification and
// distribution is subject to the Boost Software License, Version
// 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

// For more information, see http://www.boost.org

#ifndef BOOST_SIGNALS_COMMON_HEADER
#define BOOST_SIGNALS_COMMON_HEADER

#ifndef BOOST_SIGNALS_NAMESPACE
#  define BOOST_SIGNALS_NAMESPACE signals
#endif

#include <boost/type_traits/conversion_traits.hpp>
#include <boost/ref.hpp>
#include <boost/signals/detail/config.hpp>

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_PREFIX
#endif

namespace boost {
  namespace BOOST_SIGNALS_NAMESPACE {
    namespace detail {
      // The unusable class is a placeholder for unused function arguments
      // It is also completely unusable except that it constructable from
      // anything. This helps compilers without partial specialization
      // handle slots returning void.
      struct unusable {
        unusable() {}
      };

      // Determine the result type of a slot call
      template<typename R>
      struct slot_result_type {
        typedef R type;
      };

      template<>
      struct slot_result_type<void> {
        typedef unusable type;
      };

      // Determine if the given type T is a signal
      class signal_base;

      template<typename T>
      struct is_signal {
        BOOST_STATIC_CONSTANT(bool,
          value = (is_convertible<T*, signal_base*>::value));
      };

      /*
       * The IF implementation is temporary code. When a Boost metaprogramming
       * library is introduced, Boost.Signals will use it instead.
       */
      namespace intimate {
        struct SelectThen
        {
          template<typename Then, typename Else>
          struct Result
          {
            typedef Then type;
          };
        };

        struct SelectElse
        {
          template<typename Then, typename Else>
          struct Result
          {
            typedef Else type;
          };
        };

        template<bool Condition>
        struct Selector
        {
          typedef SelectThen type;
        };

        template<>
        struct Selector<false>
        {
          typedef SelectElse type;
        };
      } // end namespace intimate

      template<bool Condition, typename Then, typename Else>
      struct IF
      {
        typedef typename intimate::Selector<Condition>::type select;
        typedef typename select::template Result<Then,Else>::type type;
      };

      // Determine if the incoming argument is a reference_wrapper
      template<typename T>
      struct is_ref
      {
        BOOST_STATIC_CONSTANT(bool, value = false);
      };

      template<typename T>
      struct is_ref<reference_wrapper<T> >
      {
        BOOST_STATIC_CONSTANT(bool, value = true);
      };

      // A slot can be a signal, a reference to a function object, or a
      // function object.
      struct signal_tag {};
      struct reference_tag {};
      struct value_tag {};

      // Classify the given slot as a signal, a reference-to-slot, or a
      // standard slot
      template<typename S>
      class get_slot_tag {
        typedef typename IF<(is_signal<S>::value),
                            signal_tag,
                            value_tag>::type signal_or_value;

      public:
        typedef typename IF<(is_ref<S>::value),
                            reference_tag,
                            signal_or_value>::type type;
      };

      // Forward declaration needed in lots of places
      class signal_base_impl;
      class bound_objects_visitor;
      class slot_base;
    } // end namespace detail
  } // end namespace BOOST_SIGNALS_NAMESPACE
} // end namespace boost

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_SUFFIX
#endif

#endif // BOOST_SIGNALS_COMMON_HEADER
