#ifndef BOOST_PP_IS_ITERATING
// Copyright David Abrahams 2002.
// Distributed under the Boost Software License, Version 1.0. (See
// accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)
# ifndef TYPE_LIST_IMPL_NO_PTS_DWA2002913_HPP
#  define TYPE_LIST_IMPL_NO_PTS_DWA2002913_HPP

#  include <boost/python/detail/type_list.hpp>

#  include <boost/preprocessor/enum_params.hpp>
#  include <boost/preprocessor/enum_params_with_a_default.hpp>
#  include <boost/preprocessor/cat.hpp>
#  include <boost/preprocessor/repeat.hpp>
#  include <boost/preprocessor/empty.hpp>
#  include <boost/preprocessor/iterate.hpp>
#  include <boost/mpl/void.hpp>

namespace boost { namespace python { namespace detail { 

template< typename T >
struct is_list_arg
{
    enum { value = true };
};

template<>
struct is_list_arg<mpl::void_>
{
    enum { value = false };
};

template<int> struct type_list_impl_chooser;

#  define BOOST_PYTHON_LIST_ACTUAL_PARAMS BOOST_PP_ENUM_PARAMS_Z(1,BOOST_PYTHON_LIST_SIZE,T)
#  define BOOST_PYTHON_LIST_FORMAL_PARAMS BOOST_PP_ENUM_PARAMS_Z(1,BOOST_PYTHON_LIST_SIZE,class T)

#  define BOOST_PP_ITERATION_PARAMS_1                                                           \
        (3, (0, BOOST_PYTHON_LIST_SIZE, <boost/python/detail/type_list_impl_no_pts.hpp>))
#  include BOOST_PP_ITERATE()

#  define BOOST_PYTHON_PLUS() +
#  define BOOST_PYTHON_IS_LIST_ARG(z, n, data)          \
    BOOST_PP_IF(n, BOOST_PYTHON_PLUS, BOOST_PP_EMPTY)() \
    is_list_arg< BOOST_PP_CAT(T,n) >::value
    
template<
    BOOST_PYTHON_LIST_FORMAL_PARAMS
    >
struct type_list_count_args
{
    enum { value =
           BOOST_PP_REPEAT_1(BOOST_PYTHON_LIST_SIZE, BOOST_PYTHON_IS_LIST_ARG, _)
    };
};

template<
    BOOST_PYTHON_LIST_FORMAL_PARAMS
    >
struct type_list_impl
{
    typedef type_list_count_args< BOOST_PYTHON_LIST_ACTUAL_PARAMS > arg_num_;
    typedef typename detail::type_list_impl_chooser< arg_num_::value >
    ::template result_< BOOST_PYTHON_LIST_ACTUAL_PARAMS >::type type;
};

template<
    BOOST_PP_ENUM_PARAMS_WITH_A_DEFAULT(BOOST_PYTHON_LIST_SIZE, class T, mpl::void_)
    >
struct type_list
    : detail::type_list_impl< BOOST_PYTHON_LIST_ACTUAL_PARAMS >::type
{
    typedef typename detail::type_list_impl<
        BOOST_PYTHON_LIST_ACTUAL_PARAMS
        >::type type;
};

#  undef BOOST_PYTHON_IS_LIST_ARG
#  undef BOOST_PYTHON_PLUS
#  undef BOOST_PYTHON_LIST_FORMAL_PARAMS
#  undef BOOST_PYTHON_LIST_ACTUAL_PARAMS

}}} // namespace boost::python::detail

# endif // TYPE_LIST_IMPL_NO_PTS_DWA2002913_HPP

#else // BOOST_PP_IS_ITERATING

# define N BOOST_PP_ITERATION()

template<>
struct type_list_impl_chooser<N>
{
    template<
        BOOST_PYTHON_LIST_FORMAL_PARAMS
        >
    struct result_
    {
        typedef typename BOOST_PP_CAT(mpl::vector,N)<
            BOOST_PP_ENUM_PARAMS(N, T)
            >::type type;
    };
};

# undef N

#endif // BOOST_PP_IS_ITERATING 
