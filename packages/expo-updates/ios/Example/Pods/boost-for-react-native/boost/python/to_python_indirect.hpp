// Copyright David Abrahams 2002.
// Distributed under the Boost Software License, Version 1.0. (See
// accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)
#ifndef TO_PYTHON_INDIRECT_DWA200221_HPP
# define TO_PYTHON_INDIRECT_DWA200221_HPP

# include <boost/python/detail/prefix.hpp>

# include <boost/python/object/pointer_holder.hpp>
# include <boost/python/object/make_ptr_instance.hpp>

# include <boost/python/detail/none.hpp>

#ifndef BOOST_PYTHON_NO_PY_SIGNATURES
# include <boost/python/converter/pytype_function.hpp>
#endif

# include <boost/python/refcount.hpp>

# include <boost/type_traits/is_pointer.hpp>
# include <boost/type_traits/is_polymorphic.hpp>

# include <boost/mpl/bool.hpp>

# if defined(__ICL) && __ICL < 600 
#  include <boost/shared_ptr.hpp>
# else 
#  include <memory>
# endif

namespace boost { namespace python {

template <class T, class MakeHolder>
struct to_python_indirect
{
    template <class U>
    inline PyObject*
    operator()(U const& ref) const
    {
        return this->execute(const_cast<U&>(ref), is_pointer<U>());
    }
#ifndef BOOST_PYTHON_NO_PY_SIGNATURES
    inline PyTypeObject const*
    get_pytype()const
    {
        return converter::registered_pytype<T>::get_pytype();
    }
#endif
 private:
    template <class U>
    inline PyObject* execute(U* ptr, mpl::true_) const
    {
        // No special NULL treatment for references
        if (ptr == 0)
            return python::detail::none();
        else
            return this->execute(*ptr, mpl::false_());
    }
    
    template <class U>
    inline PyObject* execute(U const& x, mpl::false_) const
    {
        U* const p = &const_cast<U&>(x);
        if (is_polymorphic<U>::value)
        {
            if (PyObject* o = detail::wrapper_base_::owner(p))
                return incref(o);
        }
        return MakeHolder::execute(p);
    }
};

//
// implementations
//
namespace detail
{
  struct make_owning_holder
  {
      template <class T>
      static PyObject* execute(T* p)
      {
          // can't use auto_ptr with Intel 5 and VC6 Dinkum library
          // for some reason. We get link errors against the auto_ptr
          // copy constructor.
# if defined(__ICL) && __ICL < 600 
          typedef boost::shared_ptr<T> smart_pointer;
# elif __cplusplus < 201103L
          typedef std::auto_ptr<T> smart_pointer;
# else
          typedef std::unique_ptr<T> smart_pointer;
# endif
          typedef objects::pointer_holder<smart_pointer, T> holder_t;

          smart_pointer ptr(const_cast<T*>(p));
          return objects::make_ptr_instance<T, holder_t>::execute(ptr);
      }
  };

  struct make_reference_holder
  {
      template <class T>
      static PyObject* execute(T* p)
      {
          typedef objects::pointer_holder<T*, T> holder_t;
          T* q = const_cast<T*>(p);
          return objects::make_ptr_instance<T, holder_t>::execute(q);
      }
  };
}

}} // namespace boost::python

#endif // TO_PYTHON_INDIRECT_DWA200221_HPP
