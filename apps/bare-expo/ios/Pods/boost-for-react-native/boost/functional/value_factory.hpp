/*=============================================================================
    Copyright (c) 2007 Tobias Schwinger
  
    Use modification and distribution are subject to the Boost Software 
    License, Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).
==============================================================================*/

#ifndef BOOST_FUNCTIONAL_VALUE_FACTORY_HPP_INCLUDED
#   ifndef BOOST_PP_IS_ITERATING

#     include <boost/preprocessor/iteration/iterate.hpp>
#     include <boost/preprocessor/repetition/enum_params.hpp>
#     include <boost/preprocessor/repetition/enum_binary_params.hpp>

#     include <new>
#     include <boost/pointee.hpp>
#     include <boost/get_pointer.hpp>
#     include <boost/non_type.hpp>
#     include <boost/type_traits/remove_cv.hpp>

#     ifndef BOOST_FUNCTIONAL_VALUE_FACTORY_MAX_ARITY
#       define BOOST_FUNCTIONAL_VALUE_FACTORY_MAX_ARITY 10
#     elif BOOST_FUNCTIONAL_VALUE_FACTORY_MAX_ARITY < 3
#       undef  BOOST_FUNCTIONAL_VALUE_FACTORY_MAX_ARITY
#       define BOOST_FUNCTIONAL_VALUE_FACTORY_MAX_ARITY 3
#     endif

namespace boost
{
    template< typename T >
    class value_factory;

    //----- ---- --- -- - -  -   -

    template< typename T >
    class value_factory
    {
      public:
        typedef T result_type;

        value_factory()
        { }

#     define BOOST_PP_FILENAME_1 <boost/functional/value_factory.hpp>
#     define BOOST_PP_ITERATION_LIMITS (0,BOOST_FUNCTIONAL_VALUE_FACTORY_MAX_ARITY)
#     include BOOST_PP_ITERATE()
    };

    template< typename T > class value_factory<T&>;
    // forbidden, would create a dangling reference
}
#     define BOOST_FUNCTIONAL_VALUE_FACTORY_HPP_INCLUDED
#   else // defined(BOOST_PP_IS_ITERATING)

#     define N BOOST_PP_ITERATION()
#     if N > 0
    template< BOOST_PP_ENUM_PARAMS(N, typename T) >
#     endif
    inline result_type operator()(BOOST_PP_ENUM_BINARY_PARAMS(N,T,& a)) const
    {
        return result_type(BOOST_PP_ENUM_PARAMS(N,a));
    }
#     undef N

#   endif // defined(BOOST_PP_IS_ITERATING)

#endif // include guard

