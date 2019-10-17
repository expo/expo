/*=============================================================================
    Copyright (c) 2007 Tobias Schwinger
  
    Use modification and distribution are subject to the Boost Software 
    License, Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).
==============================================================================*/

#ifndef BOOST_FUNCTIONAL_FACTORY_HPP_INCLUDED
#   ifndef BOOST_PP_IS_ITERATING

#     include <boost/preprocessor/iteration/iterate.hpp>
#     include <boost/preprocessor/repetition/enum_params.hpp>
#     include <boost/preprocessor/repetition/enum_binary_params.hpp>

#     include <new>
#     include <boost/pointee.hpp>
#     include <boost/get_pointer.hpp>
#     include <boost/non_type.hpp>
#     include <boost/type_traits/remove_cv.hpp>

#     if defined(BOOST_FUNCTIONAL_FACTORY_SUPPORT_NONE_T)
#       include <boost/none_t.hpp>
#     endif

#     ifndef BOOST_FUNCTIONAL_FACTORY_MAX_ARITY
#       define BOOST_FUNCTIONAL_FACTORY_MAX_ARITY 10
#     elif BOOST_FUNCTIONAL_FACTORY_MAX_ARITY < 3
#       undef  BOOST_FUNCTIONAL_FACTORY_MAX_ARITY
#       define BOOST_FUNCTIONAL_FACTORY_MAX_ARITY 3
#     endif

namespace boost
{
    enum factory_alloc_propagation
    {
        factory_alloc_for_pointee_and_deleter,
        factory_passes_alloc_to_smart_pointer
    };

#if defined(BOOST_FUNCTIONAL_FACTORY_SUPPORT_NONE_T)
    template< typename Pointer, class Allocator = boost::none_t,
        factory_alloc_propagation AP = factory_alloc_for_pointee_and_deleter >
    class factory;
#else
    template< typename Pointer, class Allocator = void,
        factory_alloc_propagation AP = factory_alloc_for_pointee_and_deleter >
    class factory;
#endif

    //----- ---- --- -- - -  -   -

    template< typename Pointer, factory_alloc_propagation AP >
    class factory<Pointer, void, AP>
    {
      public:
        typedef typename boost::remove_cv<Pointer>::type result_type;
        typedef typename boost::pointee<result_type>::type value_type;

        factory()
        { }

#     define BOOST_PP_FILENAME_1 <boost/functional/factory.hpp>
#     define BOOST_PP_ITERATION_LIMITS (0,BOOST_FUNCTIONAL_FACTORY_MAX_ARITY)
#     include BOOST_PP_ITERATE()
    };

#if defined(BOOST_FUNCTIONAL_FACTORY_SUPPORT_NONE_T)
    template< typename Pointer, factory_alloc_propagation AP >
    class factory<Pointer, boost::none_t, AP>
        : public factory<Pointer, void, AP>
    {};
#endif

    template< class Pointer, class Allocator, factory_alloc_propagation AP >
    class factory
        : private Allocator::template rebind< typename boost::pointee<
            typename boost::remove_cv<Pointer>::type >::type >::other
    {
      public:
        typedef typename boost::remove_cv<Pointer>::type result_type;
        typedef typename boost::pointee<result_type>::type value_type;

        typedef typename Allocator::template rebind<value_type>::other
            allocator_type;

        explicit factory(allocator_type const & a = allocator_type())
          : allocator_type(a)
        { }

      private:

        struct deleter
            : allocator_type
        {
            inline deleter(allocator_type const& that) 
              : allocator_type(that)
            { }

            allocator_type& get_allocator() const
            {
                return *const_cast<allocator_type*>(
                    static_cast<allocator_type const*>(this));
            }

            void operator()(value_type* ptr) const
            {
                if (!! ptr) ptr->~value_type();
                const_cast<allocator_type*>(static_cast<allocator_type const*>(
                    this))->deallocate(ptr,1);
            }
        };

        inline allocator_type& get_allocator() const
        {
            return *const_cast<allocator_type*>(
                static_cast<allocator_type const*>(this));
        }

        inline result_type make_pointer(value_type* ptr, boost::non_type<
            factory_alloc_propagation,factory_passes_alloc_to_smart_pointer>)
        const
        {
            return result_type(ptr,deleter(this->get_allocator()));
        }
        inline result_type make_pointer(value_type* ptr, boost::non_type<
            factory_alloc_propagation,factory_alloc_for_pointee_and_deleter>)
        const
        {
            return result_type(ptr,deleter(this->get_allocator()),
                this->get_allocator());
        }

      public:

#     define BOOST_TMP_MACRO
#     define BOOST_PP_FILENAME_1 <boost/functional/factory.hpp>
#     define BOOST_PP_ITERATION_LIMITS (0,BOOST_FUNCTIONAL_FACTORY_MAX_ARITY)
#     include BOOST_PP_ITERATE()
#     undef BOOST_TMP_MACRO
    };

    template< typename Pointer, class Allocator, factory_alloc_propagation AP > 
    class factory<Pointer&, Allocator, AP>;
    // forbidden, would create a dangling reference
}

#     define BOOST_FUNCTIONAL_FACTORY_HPP_INCLUDED
#   else // defined(BOOST_PP_IS_ITERATING)
#     define N BOOST_PP_ITERATION()
#     if !defined(BOOST_TMP_MACRO)
#       if N > 0
    template< BOOST_PP_ENUM_PARAMS(N, typename T) >
#       endif
    inline result_type operator()(BOOST_PP_ENUM_BINARY_PARAMS(N,T,& a)) const
    {
        return result_type( new value_type(BOOST_PP_ENUM_PARAMS(N,a)) );
    }
#     else // defined(BOOST_TMP_MACRO)
#       if N > 0
    template< BOOST_PP_ENUM_PARAMS(N, typename T) >
#       endif
    inline result_type operator()(BOOST_PP_ENUM_BINARY_PARAMS(N,T,& a)) const
    {
        value_type* memory = this->get_allocator().allocate(1);
        try
        { 
            return make_pointer(
                new(memory) value_type(BOOST_PP_ENUM_PARAMS(N,a)),
                boost::non_type<factory_alloc_propagation,AP>() );
        }
        catch (...) { this->get_allocator().deallocate(memory,1); throw; }
    }
#     endif
#     undef N
#   endif // defined(BOOST_PP_IS_ITERATING)

#endif // include guard

