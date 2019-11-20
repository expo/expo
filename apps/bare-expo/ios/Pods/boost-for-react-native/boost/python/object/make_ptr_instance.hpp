// Copyright David Abrahams 2002.
// Distributed under the Boost Software License, Version 1.0. (See
// accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)
#ifndef MAKE_PTR_INSTANCE_DWA200296_HPP
# define MAKE_PTR_INSTANCE_DWA200296_HPP

# include <boost/python/object/make_instance.hpp>
# include <boost/python/converter/registry.hpp>
# include <boost/type_traits/is_polymorphic.hpp>
# include <boost/get_pointer.hpp>
# include <boost/detail/workaround.hpp>
# include <typeinfo>

namespace boost { namespace python { namespace objects { 

template <class T, class Holder>
struct make_ptr_instance
    : make_instance_impl<T, Holder, make_ptr_instance<T,Holder> >
{
    template <class Arg>
    static inline Holder* construct(void* storage, PyObject*, Arg& x)
    {
#if __cplusplus < 201103L
      return new (storage) Holder(x);
#else
      return new (storage) Holder(std::move(x));
#endif
    }
    
    template <class Ptr>
    static inline PyTypeObject* get_class_object(Ptr const& x)
    {
        return get_class_object_impl(get_pointer(x));
    }
#ifndef BOOST_PYTHON_NO_PY_SIGNATURES
    static inline PyTypeObject const* get_pytype()
    {
        return converter::registered<T>::converters.get_class_object();
    }
#endif
 private:
    template <class U>
    static inline PyTypeObject* get_class_object_impl(U const volatile* p)
    {
        if (p == 0)
            return 0; // means "return None".

        PyTypeObject* derived = get_derived_class_object(
            BOOST_DEDUCED_TYPENAME is_polymorphic<U>::type(), p);
        
        if (derived)
            return derived;
        return converter::registered<T>::converters.get_class_object();
    }
    
    template <class U>
    static inline PyTypeObject* get_derived_class_object(mpl::true_, U const volatile* x)
    {
        converter::registration const* r = converter::registry::query(
            type_info(typeid(*get_pointer(x)))
        );
        return r ? r->m_class_object : 0;
    }
    
    template <class U>
    static inline PyTypeObject* get_derived_class_object(mpl::false_, U*)
    {
        return 0;
    }
};
  

}}} // namespace boost::python::object

#endif // MAKE_PTR_INSTANCE_DWA200296_HPP
