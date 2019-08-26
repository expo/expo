// Copyright David Abrahams 2002.
// Distributed under the Boost Software License, Version 1.0. (See
// accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)
#ifndef MAKE_INSTANCE_DWA200296_HPP
# define MAKE_INSTANCE_DWA200296_HPP

# include <boost/python/detail/prefix.hpp>
# include <boost/python/object/instance.hpp>
# include <boost/python/converter/registered.hpp>
# include <boost/python/detail/decref_guard.hpp>
# include <boost/python/detail/none.hpp>
# include <boost/mpl/assert.hpp>
# include <boost/mpl/or.hpp>
# include <boost/type_traits/is_union.hpp>

namespace boost { namespace python { namespace objects { 

template <class T, class Holder, class Derived>
struct make_instance_impl
{
    typedef objects::instance<Holder> instance_t;
        
    template <class Arg>
    static inline PyObject* execute(Arg& x)
    {
        BOOST_MPL_ASSERT((mpl::or_<is_class<T>, is_union<T> >));

        PyTypeObject* type = Derived::get_class_object(x);

        if (type == 0)
            return python::detail::none();

        PyObject* raw_result = type->tp_alloc(
            type, objects::additional_instance_size<Holder>::value);
          
        if (raw_result != 0)
        {
            python::detail::decref_guard protect(raw_result);
            
            instance_t* instance = (instance_t*)raw_result;
            
            // construct the new C++ object and install the pointer
            // in the Python object.
            Derived::construct(&instance->storage, (PyObject*)instance, x)->install(raw_result);
              
            // Note the position of the internally-stored Holder,
            // for the sake of destruction
            Py_SIZE(instance) = offsetof(instance_t, storage);

            // Release ownership of the python object
            protect.cancel();
        }
        return raw_result;
    }
};
    

template <class T, class Holder>
struct make_instance
    : make_instance_impl<T, Holder, make_instance<T,Holder> >
{
    template <class U>
    static inline PyTypeObject* get_class_object(U&)
    {
        return converter::registered<T>::converters.get_class_object();
    }
    
    static inline Holder* construct(void* storage, PyObject* instance, reference_wrapper<T const> x)
    {
        return new (storage) Holder(instance, x);
    }
};
  

}}} // namespace boost::python::object

#endif // MAKE_INSTANCE_DWA200296_HPP
