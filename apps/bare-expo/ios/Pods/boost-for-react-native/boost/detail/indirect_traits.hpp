// Copyright David Abrahams 2002.
// Distributed under the Boost Software License, Version 1.0. (See
// accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)
#ifndef INDIRECT_TRAITS_DWA2002131_HPP
# define INDIRECT_TRAITS_DWA2002131_HPP
# include <boost/type_traits/is_function.hpp>
# include <boost/type_traits/is_reference.hpp>
# include <boost/type_traits/is_pointer.hpp>
# include <boost/type_traits/is_class.hpp>
# include <boost/type_traits/is_const.hpp>
# include <boost/type_traits/is_volatile.hpp>
# include <boost/type_traits/is_member_function_pointer.hpp>
# include <boost/type_traits/is_member_pointer.hpp>
# include <boost/type_traits/remove_cv.hpp>
# include <boost/type_traits/remove_reference.hpp>
# include <boost/type_traits/remove_pointer.hpp>

# include <boost/detail/workaround.hpp>

# include <boost/mpl/eval_if.hpp>
# include <boost/mpl/if.hpp>
# include <boost/mpl/bool.hpp>
# include <boost/mpl/and.hpp>
# include <boost/mpl/not.hpp>
# include <boost/mpl/aux_/lambda_support.hpp>


namespace boost { namespace detail {

namespace indirect_traits {

template <class T>
struct is_reference_to_const : mpl::false_
{
};

template <class T>
struct is_reference_to_const<T const&> : mpl::true_
{
};

#   if defined(BOOST_MSVC) && _MSC_FULL_VER <= 13102140 // vc7.01 alpha workaround
template<class T>
struct is_reference_to_const<T const volatile&> : mpl::true_
{
};
#   endif 

template <class T>
struct is_reference_to_function : mpl::false_
{
};

template <class T>
struct is_reference_to_function<T&> : is_function<T>
{
};

template <class T>
struct is_pointer_to_function : mpl::false_
{
};

// There's no such thing as a pointer-to-cv-function, so we don't need
// specializations for those
template <class T>
struct is_pointer_to_function<T*> : is_function<T>
{
};

template <class T>
struct is_reference_to_member_function_pointer_impl : mpl::false_
{
};

template <class T>
struct is_reference_to_member_function_pointer_impl<T&>
    : is_member_function_pointer<typename remove_cv<T>::type>
{
};


template <class T>
struct is_reference_to_member_function_pointer
    : is_reference_to_member_function_pointer_impl<T>
{
    BOOST_MPL_AUX_LAMBDA_SUPPORT(1,is_reference_to_member_function_pointer,(T))
};

template <class T>
struct is_reference_to_function_pointer_aux
    : mpl::and_<
          is_reference<T>
        , is_pointer_to_function<
              typename remove_cv<
                  typename remove_reference<T>::type
              >::type
          >
      >
{
    // There's no such thing as a pointer-to-cv-function, so we don't need specializations for those
};

template <class T>
struct is_reference_to_function_pointer
    : mpl::if_<
          is_reference_to_function<T>
        , mpl::false_
        , is_reference_to_function_pointer_aux<T>
     >::type
{
};

template <class T>
struct is_reference_to_non_const
    : mpl::and_<
          is_reference<T>
        , mpl::not_<
             is_reference_to_const<T>
          >
      >
{
};

template <class T>
struct is_reference_to_volatile : mpl::false_
{
};

template <class T>
struct is_reference_to_volatile<T volatile&> : mpl::true_
{
};

#   if defined(BOOST_MSVC) && _MSC_FULL_VER <= 13102140 // vc7.01 alpha workaround
template <class T>
struct is_reference_to_volatile<T const volatile&> : mpl::true_
{
};
#   endif 


template <class T>
struct is_reference_to_pointer : mpl::false_
{
};

template <class T>
struct is_reference_to_pointer<T*&> : mpl::true_
{
};

template <class T>
struct is_reference_to_pointer<T* const&> : mpl::true_
{
};

template <class T>
struct is_reference_to_pointer<T* volatile&> : mpl::true_
{
};

template <class T>
struct is_reference_to_pointer<T* const volatile&> : mpl::true_
{
};

template <class T>
struct is_reference_to_class
    : mpl::and_<
          is_reference<T>
        , is_class<
              typename remove_cv<
                  typename remove_reference<T>::type
              >::type
          >
      >
{
    BOOST_MPL_AUX_LAMBDA_SUPPORT(1,is_reference_to_class,(T))
};

template <class T>
struct is_pointer_to_class
    : mpl::and_<
          is_pointer<T>
        , is_class<
              typename remove_cv<
                  typename remove_pointer<T>::type
              >::type
          >
      >
{
    BOOST_MPL_AUX_LAMBDA_SUPPORT(1,is_pointer_to_class,(T))
};


}

using namespace indirect_traits;

}} // namespace boost::python::detail

#endif // INDIRECT_TRAITS_DWA2002131_HPP
