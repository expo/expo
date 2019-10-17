// Copyright Daniel Wallin, David Abrahams 2005. Use, modification and
// distribution is subject to the Boost Software License, Version 1.0. (See
// accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_PARAMETER_TAGGED_ARGUMENT_050328_HPP
# define BOOST_PARAMETER_TAGGED_ARGUMENT_050328_HPP

# include <boost/parameter/aux_/void.hpp>
# include <boost/parameter/aux_/arg_list.hpp>
# include <boost/parameter/aux_/result_of0.hpp>
# include <boost/mpl/if.hpp>
# include <boost/mpl/apply_wrap.hpp>
# include <boost/mpl/and.hpp>
# include <boost/mpl/not.hpp>
# include <boost/type_traits/is_same.hpp>
# include <boost/type_traits/is_convertible.hpp>
# include <boost/type_traits/is_reference.hpp>

namespace boost { namespace parameter { namespace aux {

struct empty_arg_list;
struct arg_list_tag;

struct tagged_argument_base {};

// Holds a reference to an argument of type Arg associated with
// keyword Keyword
    
template <class Keyword, class Arg>
struct tagged_argument : tagged_argument_base
{
    typedef Keyword key_type;
    typedef Arg value_type;
    typedef Arg& reference;

    tagged_argument(reference x) : value(x) {}

    // A metafunction class that, given a keyword and a default
    // type, returns the appropriate result type for a keyword
    // lookup given that default
    struct binding
    {
        template <class KW, class Default, class Reference>
        struct apply
        {
          typedef typename mpl::eval_if<
                boost::is_same<KW, key_type>
              , mpl::if_<Reference, reference, value_type>
              , mpl::identity<Default>
          >::type type;
        };
    };

    // Comma operator to compose argument list without using parameters<>.
    // Useful for argument lists with undetermined length.
    template <class Keyword2, class Arg2>
    arg_list<
        tagged_argument<Keyword, Arg>
      , arg_list<tagged_argument<Keyword2, Arg2> > 
    >
    operator,(tagged_argument<Keyword2, Arg2> x) const
    {
        return arg_list<
            tagged_argument<Keyword, Arg>
          , arg_list<tagged_argument<Keyword2, Arg2> > 
        >(
            *this
          , arg_list<tagged_argument<Keyword2, Arg2> >(x, empty_arg_list())
        );
    }

    reference operator[](keyword<Keyword> const&) const
    {
        return value;
    }

# if defined(BOOST_NO_FUNCTION_TEMPLATE_ORDERING) || BOOST_WORKAROUND(__BORLANDC__, BOOST_TESTED_AT(0x564))
    template <class KW, class Default>
    Default& get_with_default(default_<KW,Default> const& x, int) const
    {
        return x.value;
    }

    template <class Default>
    reference get_with_default(default_<key_type,Default> const&, long) const
    {
        return value;
    }

    template <class KW, class Default>
    typename mpl::apply_wrap3<binding, KW, Default&, mpl::true_>::type
    operator[](default_<KW,Default> const& x) const
    {
        return get_with_default(x, 0L);
    }

    template <class KW, class F>
    typename result_of0<F>::type 
    get_with_lazy_default(lazy_default<KW,F> const& x, int) const
    {
        return x.compute_default();
    }

    template <class F>
    reference get_with_lazy_default(lazy_default<key_type,F> const&, long) const
    {
        return value;
    }

    template <class KW, class F>
    typename mpl::apply_wrap3<
        binding,KW
      , typename result_of0<F>::type
      , mpl::true_
    >::type
    operator[](lazy_default<KW,F> const& x) const
    {
        return get_with_lazy_default(x, 0L);
    }
# else
    template <class Default>
    reference operator[](default_<key_type,Default> const& ) const
    {
        return value;
    }

    template <class F>
    reference operator[](lazy_default<key_type,F> const& ) const
    {
        return value;
    }

    template <class KW, class Default>
    Default& operator[](default_<KW,Default> const& x) const
    {
        return x.value;
    }

    template <class KW, class F>
    typename result_of0<F>::type operator[](lazy_default<KW,F> const& x) const
    {
        return x.compute_default();
    }

    template <class ParameterRequirements>
    static typename ParameterRequirements::has_default
    satisfies(ParameterRequirements*);

    template <class HasDefault, class Predicate>
    static typename mpl::apply1<Predicate, value_type>::type
    satisfies(
        parameter_requirements<key_type,Predicate,HasDefault>*
    );
# endif

    reference value;
# if BOOST_WORKAROUND(BOOST_MSVC, BOOST_TESTED_AT(1310))
    // warning suppression
 private:
    void operator=(tagged_argument const&);
 public:    
# endif
    // MPL sequence support
    typedef tagged_argument type;            // Convenience for users
    typedef empty_arg_list tail_type;        // For the benefit of iterators
    typedef arg_list_tag tag; // For dispatching to sequence intrinsics
};

// Defines a metafunction, is_tagged_argument, that identifies
// tagged_argument specializations and their derived classes.
template <class T>
struct is_tagged_argument_aux
  : is_convertible<T*,tagged_argument_base const*>
{};

template <class T>
struct is_tagged_argument
  : mpl::and_<
        mpl::not_<is_reference<T> >
      , is_tagged_argument_aux<T>
    >
{};

}}} // namespace boost::parameter::aux

#endif // BOOST_PARAMETER_TAGGED_ARGUMENT_050328_HPP

