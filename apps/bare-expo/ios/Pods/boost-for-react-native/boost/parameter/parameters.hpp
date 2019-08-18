// Copyright David Abrahams, Daniel Wallin 2003. Use, modification and 
// distribution is subject to the Boost Software License, Version 1.0. 
// (See accompanying file LICENSE_1_0.txt or copy at 
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_PARAMETERS_031014_HPP
#define BOOST_PARAMETERS_031014_HPP

#include <boost/detail/is_xxx.hpp>

#include <boost/type_traits/is_const.hpp>

#include <boost/mpl/lambda.hpp>
#include <boost/mpl/apply.hpp>
#include <boost/mpl/always.hpp>
#include <boost/mpl/and.hpp>
#include <boost/mpl/or.hpp>
#include <boost/mpl/if.hpp>
#include <boost/mpl/identity.hpp>
#include <boost/mpl/not.hpp>
#include <boost/mpl/eval_if.hpp>
#include <boost/mpl/pair.hpp>

#include <boost/type_traits/is_same.hpp>
#include <boost/type_traits/remove_reference.hpp>

#include <boost/preprocessor/repetition/enum.hpp>
#include <boost/preprocessor/repetition/enum_params.hpp>
#include <boost/preprocessor/repetition/enum_trailing_params.hpp>
#include <boost/preprocessor/arithmetic/sub.hpp>
#include <boost/preprocessor/repetition/repeat.hpp>
#include <boost/preprocessor/repetition/enum_shifted.hpp>
#include <boost/preprocessor/repetition/enum_binary_params.hpp>
#include <boost/preprocessor/repetition/enum_shifted_params.hpp>
#include <boost/preprocessor/seq/elem.hpp>
#include <boost/preprocessor/iteration/iterate.hpp>
#include <boost/preprocessor/facilities/intercept.hpp>
#include <boost/preprocessor/cat.hpp>

#include <boost/parameter/aux_/arg_list.hpp>
#include <boost/parameter/aux_/yesno.hpp>
#include <boost/parameter/aux_/void.hpp>
#include <boost/parameter/aux_/default.hpp>
#include <boost/parameter/aux_/unwrap_cv_reference.hpp>
#include <boost/parameter/aux_/tagged_argument.hpp>
#include <boost/parameter/aux_/tag.hpp>
#include <boost/parameter/aux_/template_keyword.hpp>
#include <boost/parameter/aux_/set.hpp>
#include <boost/parameter/config.hpp>

namespace parameter_
{
  template <class T>
  struct unmatched_argument
  {
      BOOST_MPL_ASSERT((boost::is_same<T,void>));
      typedef int type;
  }; 
} // namespace parameter_

namespace boost {

template<class T> class reference_wrapper;

namespace parameter {

namespace aux { struct use_default {}; }

// These templates can be used to describe the treatment of particular
// named parameters for the purposes of overload elimination with
// SFINAE, by placing specializations in the parameters<...> list.  In
// order for a treated function to participate in overload resolution:
//
//   - all keyword tags wrapped in required<...> must have a matching
//     actual argument
//
//   - The actual argument type matched by every keyword tag
//     associated with a predicate must satisfy that predicate
//
// If a keyword k is specified without an optional<...> or
// required<...>, wrapper, it is treated as though optional<k> were
// specified.
//
// If a keyword k is specified with deduced<...>, that keyword
// will be automatically deduced from the argument list.
//
template <class Tag, class Predicate = aux::use_default>
struct required
{
    typedef Tag key_type;
    typedef Predicate predicate;
};

template <class Tag, class Predicate = aux::use_default>
struct optional
{
    typedef Tag key_type;
    typedef Predicate predicate;
};

template <class Tag>
struct deduced
{
    typedef Tag key_type;
};

namespace aux
{
  // Defines metafunctions, is_required and is_optional, that
  // identify required<...>, optional<...> and deduced<...> specializations.
  BOOST_DETAIL_IS_XXX_DEF(required, required, 2)
  BOOST_DETAIL_IS_XXX_DEF(optional, optional, 2)
  BOOST_DETAIL_IS_XXX_DEF(deduced_aux, deduced, 1)

  template <class S>
  struct is_deduced0
    : is_deduced_aux<
          typename S::key_type
      >::type
  {};

  template <class S>
  struct is_deduced
    : mpl::eval_if<
          mpl::or_<
              is_optional<S>, is_required<S>
          >
        , is_deduced0<S>
        , mpl::false_
      >::type
  {};

  //
  // key_type, has_default, and predicate --
  //
  // These metafunctions accept a ParameterSpec and extract the
  // keyword tag, whether or not a default is supplied for the
  // parameter, and the predicate that the corresponding actual
  // argument type is required match.
  //
  // a ParameterSpec is a specialization of either keyword<...>,
  // required<...>, optional<...>
  //

  // helper for key_type<...>, below.
  template <class T>
  struct get_tag_type0
  {
      typedef typename T::key_type type;
  };

  template <class T>
  struct get_tag_type
    : mpl::eval_if<
          is_deduced_aux<typename T::key_type>
        , get_tag_type0<typename T::key_type>
        , mpl::identity<typename T::key_type>
      >
  {};

  template <class T>
  struct tag_type
    : mpl::eval_if<
          mpl::or_<
              is_optional<T>
            , is_required<T>
          >
        , get_tag_type<T>
        , mpl::identity<T>
      >
  {};

  template <class T>
  struct has_default
    : mpl::not_<is_required<T> >
  {};

  // helper for get_predicate<...>, below
  template <class T>
  struct get_predicate_or_default
  {
      typedef T type;
  };

  template <>
  struct get_predicate_or_default<use_default>
  {
      typedef mpl::always<mpl::true_> type;
  };

  // helper for predicate<...>, below
  template <class T>
  struct get_predicate
  {
      typedef typename
          get_predicate_or_default<typename T::predicate>::type
      type;
  };

  template <class T>
  struct predicate
    : mpl::eval_if<
         mpl::or_<
              is_optional<T>
            , is_required<T>
          >
        , get_predicate<T>
        , mpl::identity<mpl::always<mpl::true_> >
      >
  {
  };


  // Converts a ParameterSpec into a specialization of
  // parameter_requirements.  We need to do this in order to get the
  // tag_type into the type in a way that can be conveniently matched
  // by a satisfies(...) member function in arg_list.
  template <class ParameterSpec>
  struct as_parameter_requirements
  {
      typedef parameter_requirements<
          typename tag_type<ParameterSpec>::type
        , typename predicate<ParameterSpec>::type
        , typename has_default<ParameterSpec>::type
      > type;
  };

  template <class T>
  struct is_named_argument
    : mpl::or_<
          is_template_keyword<T>
        , is_tagged_argument<T>
      >
  {};
  
  // Returns mpl::true_ iff the given ParameterRequirements are
  // satisfied by ArgList.
  template <class ArgList, class ParameterRequirements>
  struct satisfies
  {
#if BOOST_WORKAROUND(BOOST_MSVC, == 1310)
      // VC7.1 can't handle the sizeof() implementation below,
      // so we use this instead.
      typedef typename mpl::apply_wrap3<
          typename ArgList::binding
        , typename ParameterRequirements::keyword
        , void_
        , mpl::false_
      >::type bound;

      typedef typename mpl::eval_if<
          is_same<bound, void_>
        , typename ParameterRequirements::has_default
        , mpl::apply_wrap2<
              typename mpl::lambda<
                  typename ParameterRequirements::predicate, lambda_tag
              >::type
            , bound
            , ArgList
          >
      >::type type;
#else
      BOOST_STATIC_CONSTANT(
          bool, value = (
              sizeof(
                  aux::to_yesno(
                      ArgList::satisfies((ParameterRequirements*)0, (ArgList*)0)
                  )
              ) == sizeof(yes_tag)
          )
      );

      typedef mpl::bool_<satisfies::value> type;
#endif
  };

  // Returns mpl::true_ if the requirements of the given ParameterSpec
  // are satisfied by ArgList.
  template <class ArgList, class ParameterSpec>
  struct satisfies_requirements_of
    : satisfies<
          ArgList
        , typename as_parameter_requirements<ParameterSpec>::type
      >
  {};

  // Tags a deduced argument Arg with the keyword tag of Spec using TagFn.
  // Returns the tagged argument and the mpl::set<> UsedArgs with the
  // tag of Spec inserted.
  template <class UsedArgs, class Spec, class Arg, class TagFn>
  struct tag_deduced
  {
      typedef mpl::pair<
          typename mpl::apply_wrap2<TagFn, typename tag_type<Spec>::type, Arg>::type
        , typename aux::insert_<UsedArgs, typename tag_type<Spec>::type>::type
      > type;
  };

  template <
      class Argument
    , class ArgumentPack
    , class DeducedArgs
    , class UsedArgs
    , class TagFn
  >
  struct deduce_tag;

  // Tag type passed to MPL lambda.
  struct lambda_tag;

  // Helper for deduce_tag<> below.
  template <
      class Argument
    , class ArgumentPack
    , class DeducedArgs
    , class UsedArgs
    , class TagFn
  >
  struct deduce_tag0
  {
      typedef typename DeducedArgs::spec spec;

      typedef typename mpl::apply_wrap2<
          typename mpl::lambda<
              typename spec::predicate, lambda_tag
          >::type
        , Argument
        , ArgumentPack
      >::type condition;

      // Deduced parameter matches several arguments.

      BOOST_MPL_ASSERT((
          mpl::not_<mpl::and_<
              condition
            , aux::has_key_<UsedArgs, typename tag_type<spec>::type>
          > >
      ));

      typedef typename mpl::eval_if<
          condition
        , tag_deduced<UsedArgs, spec, Argument, TagFn>
        , deduce_tag<Argument, ArgumentPack, typename DeducedArgs::tail, UsedArgs, TagFn>
      >::type type;
  };

  // Tries to deduced a keyword tag for a given Argument.
  // Returns an mpl::pair<> consisting of the tagged_argument<>, 
  // and an mpl::set<> where the new tag has been inserted.
  //
  //  Argument: The argument type to be tagged.
  //
  //  ArgumentPack: The ArgumentPack built so far.
  //
  //  DeducedArgs: A specialization of deduced_item<> (see below).
  //               A list containing only the deduced ParameterSpecs.
  //
  //  UsedArgs: An mpl::set<> containing the keyword tags used so far.
  //
  //  TagFn: A metafunction class used to tag positional or deduced
  //         arguments with a keyword tag.

  template <
      class Argument
    , class ArgumentPack
    , class DeducedArgs
    , class UsedArgs
    , class TagFn
  >
  struct deduce_tag
  {
      typedef typename mpl::eval_if<
          is_same<DeducedArgs, void_>
        , mpl::pair<void_, UsedArgs>
        , deduce_tag0<Argument, ArgumentPack, DeducedArgs, UsedArgs, TagFn>
      >::type type;
  };

  template <
      class List
    , class DeducedArgs
    , class TagFn
    , class Positional
    , class UsedArgs
    , class ArgumentPack
    , class Error
  >
  struct make_arg_list_aux;

  // Inserts Tagged::key_type into the UserArgs set.
  // Extra indirection to lazily evaluate Tagged::key_type.
  template <class UsedArgs, class Tagged>
  struct insert_tagged
  {
      typedef typename aux::insert_<
          UsedArgs, typename Tagged::key_type
      >::type type;
  };

  // Borland needs the insane extra-indirection workaround below
  // so that it doesn't magically drop the const qualifier from
  // the argument type.

  template <
      class List
    , class DeducedArgs
    , class TagFn
    , class Positional
    , class UsedArgs
    , class ArgumentPack
#if BOOST_WORKAROUND(__BORLANDC__, BOOST_TESTED_AT(0x564))
    , class argument
#endif
    , class Error
  >
#if BOOST_WORKAROUND(__BORLANDC__, BOOST_TESTED_AT(0x564))
  struct make_arg_list00
#else
  struct make_arg_list0
#endif
  {
#if !BOOST_WORKAROUND(__BORLANDC__, BOOST_TESTED_AT(0x564))
      typedef typename List::arg argument;
#endif
      typedef typename List::spec parameter_spec;
      typedef typename tag_type<parameter_spec>::type tag_;

      typedef is_named_argument<argument> is_tagged;

      // If this argument is either explicitly tagged or a deduced
      // parameter, we turn off positional matching.
      typedef mpl::and_<
          mpl::not_<
              mpl::or_<is_deduced<parameter_spec>, is_tagged> 
          > 
        , Positional
      > positional;

      // If this parameter is explicitly tagged we add it to the
      // used-parmeters set. We only really need to add parameters
      // that are deduced, but we would need a way to check if
      // a given tag corresponds to a deduced parameter spec.
      typedef typename mpl::eval_if<
          is_tagged
        , insert_tagged<UsedArgs, argument>
        , mpl::identity<UsedArgs>
      >::type used_args;

      // If this parameter is neither explicitly tagged, nor
      // positionally matched; deduce the tag from the deduced
      // parameter specs.
      typedef typename mpl::eval_if<
          mpl::or_<is_tagged, positional>
        , mpl::pair<void_, used_args>
        , deduce_tag<argument, ArgumentPack, DeducedArgs, used_args, TagFn>
      >::type deduced_data;

      // If this parameter is explicitly tagged..
      typedef typename mpl::eval_if<
          is_tagged
        , mpl::identity<argument>                        // .. just use it
        , mpl::eval_if<                                  // .. else, if positional matching is turned on..
                positional
              , mpl::apply_wrap2<TagFn, tag_, argument>  // .. tag it positionally
              , mpl::first<deduced_data>                 // .. else, use the deduced tag
          >
      >::type tagged;

      // We build the arg_list incrementally as we go, prepending new
      // nodes.

      typedef typename mpl::if_<
          mpl::and_<
              is_same<Error, void_>
            , is_same<tagged, void_>
          >
        , parameter_::unmatched_argument<argument>
        , void_
      >::type error;

      typedef typename mpl::if_<
          is_same<tagged, void_>
        , ArgumentPack
        , arg_list<tagged, ArgumentPack>
      >::type argument_pack;

      typedef typename make_arg_list_aux<
          typename List::tail
        , DeducedArgs
        , TagFn
        , positional
        , typename deduced_data::second
        , argument_pack
        , error
      >::type type;
  };

#if BOOST_WORKAROUND(__BORLANDC__, BOOST_TESTED_AT(0x564))
  template <
      class List
    , class DeducedArgs
    , class TagFn
    , class Positional
    , class UsedArgs
    , class ArgumentPack
    , class Error
  >
  struct make_arg_list0
  {
      typedef typename mpl::eval_if<
          typename List::is_arg_const
        , make_arg_list00<
              List
            , DeducedArgs
            , TagFn
            , Positional
            , UsedArgs
            , ArgumentPack
            , typename List::arg const
            , Error
          >
        , make_arg_list00<
              List
            , DeducedArgs
            , TagFn
            , Positional
            , UsedArgs
            , ArgumentPack
            , typename List::arg
            , Error
          >
      >::type type;
  };
#endif

  // Returns an ArgumentPack where the list of arguments has
  // been tagged with keyword tags.
  //
  //   List: A specialization of item<> (see below). Contains
  //         both the ordered ParameterSpecs, and the given arguments.
  //
  //   DeducedArgs: A specialization of deduced_item<> (see below).
  //                A list containing only the deduced ParameterSpecs.
  //
  //   TagFn: A metafunction class used to tag positional or deduced
  //          arguments with a keyword tag.
  //
  //   Position: An mpl::bool_<> specialization indicating if positional
  //             matching is to be performed.
  //
  //   DeducedSet: An mpl::set<> containing the keyword tags used so far.
  //
  //   ArgumentPack: The ArgumentPack built so far. This is initially an
  //                 empty_arg_list and is built incrementally.
  //

  template <
      class List
    , class DeducedArgs
    , class TagFn
    , class Positional
    , class DeducedSet
    , class ArgumentPack
    , class Error
  >
  struct make_arg_list_aux
  {
      typedef typename mpl::eval_if<
          is_same<List, void_>
        , mpl::identity<mpl::pair<ArgumentPack, Error> >
        , make_arg_list0<List, DeducedArgs, TagFn, Positional, DeducedSet, ArgumentPack, Error>
      >::type type;
  };

  // VC6.5 was choking on the default parameters for make_arg_list_aux, so
  // this just forwards to that adding in the defaults.
  template <
      class List
    , class DeducedArgs
    , class TagFn
    , class EmitErrors = mpl::true_
  >
  struct make_arg_list
  {
      typedef typename make_arg_list_aux<
          List, DeducedArgs, TagFn, mpl::true_, aux::set0, empty_arg_list, void_
      >::type type;
  };

  // A parameter spec item typelist.
  template <class Spec, class Arg, class Tail = void_>
  struct item
  {
      typedef Spec spec;

#if BOOST_WORKAROUND(__BORLANDC__, BOOST_TESTED_AT(0x564))
      typedef is_const<Arg> is_arg_const;
#endif

      typedef Arg arg;
      typedef Tail tail;
  };

  template <class Spec, class Arg, class Tail>
  struct make_item
  {
      typedef item<Spec, Arg, typename Tail::type> type;
  };

  // Creates a item typelist.
  template <class Spec, class Arg, class Tail>
  struct make_items
  {
      typedef typename mpl::eval_if<
          is_same<Arg, void_>
        , mpl::identity<void_>
        , make_item<Spec, Arg, Tail>
      >::type type;
  };

  // A typelist that stored deduced parameter specs.
  template <class ParameterSpec, class Tail = void_>
  struct deduced_item
  {
      typedef ParameterSpec spec;
      typedef Tail tail;
  };

  // Evaluate Tail and construct deduced_item list.
  template <class Spec, class Tail>
  struct make_deduced_item
  {
      typedef deduced_item<Spec, typename Tail::type> type;
  };

  template <class Spec, class Tail>
  struct make_deduced_items
  {
      typedef typename mpl::eval_if<
          is_same<Spec, void_>
        , mpl::identity<void_>
        , mpl::eval_if<
              is_deduced<Spec>
            , make_deduced_item<Spec, Tail>
            , Tail
          >
      >::type type;
  };

  // Generates:
  //
  //   make<
  //       parameter_spec#0, argument_type#0
  //     , make<
  //           parameter_spec#1, argument_type#1
  //         , ... mpl::identity<aux::empty_arg_list>
  //    ...>
  //   >
#define BOOST_PARAMETER_make_arg_list(z, n, names)      \
      BOOST_PP_SEQ_ELEM(0,names)<                       \
          BOOST_PP_CAT(BOOST_PP_SEQ_ELEM(1,names), n),  \
          BOOST_PP_CAT(BOOST_PP_SEQ_ELEM(2,names), n), 

#define BOOST_PARAMETER_right_angle(z, n, text) >

#define BOOST_PARAMETER_build_arg_list(n, make, parameter_spec, argument_type)      \
  BOOST_PP_REPEAT(                                                                  \
      n, BOOST_PARAMETER_make_arg_list, (make)(parameter_spec)(argument_type))      \
      mpl::identity<void_>                                                          \
  BOOST_PP_REPEAT(n, BOOST_PARAMETER_right_angle, _)

#define BOOST_PARAMETER_make_deduced_list(z, n, names)  \
      BOOST_PP_SEQ_ELEM(0,names)<                       \
          BOOST_PP_CAT(BOOST_PP_SEQ_ELEM(1,names), n),

#define BOOST_PARAMETER_build_deduced_list(n, make, parameter_spec)                 \
  BOOST_PP_REPEAT(                                                                  \
      n, BOOST_PARAMETER_make_deduced_list, (make)(parameter_spec))                 \
  mpl::identity<void_>                                                              \
  BOOST_PP_REPEAT(n, BOOST_PARAMETER_right_angle, _)

  struct tag_keyword_arg
  {
      template <class K, class T>
      struct apply
        : tag<K,T>
      {};
  };

  struct tag_template_keyword_arg
  {
      template <class K, class T>
      struct apply
      {
          typedef template_keyword<K,T> type;
      };
  };

} // namespace aux

#define BOOST_PARAMETER_FORWARD_TYPEDEF(z, i, names) \
    typedef BOOST_PP_CAT(BOOST_PP_SEQ_ELEM(0,names),i) BOOST_PP_CAT(BOOST_PP_SEQ_ELEM(1,names),i);

#define BOOST_PARAMETER_FORWARD_TYPEDEFS(n, src, dest) \
    BOOST_PP_REPEAT(n, BOOST_PARAMETER_FORWARD_TYPEDEF, (src)(dest))


#define BOOST_PARAMETER_TEMPLATE_ARGS(z, n, text) class BOOST_PP_CAT(PS, n) = void_

template<
     class PS0
   , BOOST_PP_ENUM_SHIFTED(BOOST_PARAMETER_MAX_ARITY, BOOST_PARAMETER_TEMPLATE_ARGS, _)
>
struct parameters
{
#undef BOOST_PARAMETER_TEMPLATE_ARGS

    typedef typename BOOST_PARAMETER_build_deduced_list(
        BOOST_PARAMETER_MAX_ARITY, aux::make_deduced_items, PS
    )::type deduced_list;

    // if the elements of NamedList match the criteria of overload
    // resolution, returns a type which can be constructed from
    // parameters.  Otherwise, this is not a valid metafunction (no nested
    // ::type).


#if ! defined(BOOST_NO_SFINAE) && ! BOOST_WORKAROUND(__BORLANDC__, BOOST_TESTED_AT(0x592))
    // If NamedList satisfies the PS0, PS1, ..., this is a
    // metafunction returning parameters.  Otherwise it 
    // has no nested ::type.
    template <class ArgumentPackAndError>
    struct match_base
      : mpl::if_<
            // mpl::and_<
            //    aux::satisfies_requirements_of<NamedList,PS0>
            //  , mpl::and_<
            //       aux::satisfies_requirements_of<NamedList,PS1>...
            //           ..., mpl::true_
            // ...> >
            
# define BOOST_PARAMETER_satisfies(z, n, text)                                      \
            mpl::and_<                                                              \
                aux::satisfies_requirements_of<                                     \
                    typename mpl::first<ArgumentPackAndError>::type                 \
                  , BOOST_PP_CAT(PS, n)>                                            \
                  ,
            mpl::and_<
                is_same<typename mpl::second<ArgumentPackAndError>::type, void_>
              , BOOST_PP_REPEAT(BOOST_PARAMETER_MAX_ARITY, BOOST_PARAMETER_satisfies, _)
                mpl::true_
                BOOST_PP_REPEAT(BOOST_PARAMETER_MAX_ARITY, BOOST_PARAMETER_right_angle, _)
            >

# undef BOOST_PARAMETER_satisfies

          , mpl::identity<parameters>
          , void_
        >
    {};
#endif
    
    // Specializations are to be used as an optional argument to
    // eliminate overloads via SFINAE
    template<
#if BOOST_WORKAROUND(__BORLANDC__, BOOST_TESTED_AT(0x564))
        // Borland simply can't handle default arguments in member
        // class templates.  People wishing to write portable code can
        // explicitly specify BOOST_PARAMETER_MAX_ARITY arguments
        BOOST_PP_ENUM_PARAMS(BOOST_PARAMETER_MAX_ARITY, class A)
#else 
        BOOST_PP_ENUM_BINARY_PARAMS(
            BOOST_PARAMETER_MAX_ARITY, class A, = void_ BOOST_PP_INTERCEPT
        )
#endif
    >
    struct match
# if ! defined(BOOST_NO_SFINAE) && ! BOOST_WORKAROUND(__BORLANDC__, BOOST_TESTED_AT(0x592))
      : match_base<
            typename aux::make_arg_list<
                typename BOOST_PARAMETER_build_arg_list(
                    BOOST_PARAMETER_MAX_ARITY, aux::make_items, PS, A
                )::type
              , deduced_list
              , aux::tag_keyword_arg
              , mpl::false_ // Don't emit errors when doing SFINAE
            >::type
        >::type
    {};
# else
    { 
        typedef parameters<
            BOOST_PP_ENUM_PARAMS(BOOST_PARAMETER_MAX_ARITY, PS)
        > type; 
    };
# endif

    // Metafunction that returns an ArgumentPack.

    // TODO, bind has to instantiate the error type in the result
    // of make_arg_list.

    template <
#if BOOST_WORKAROUND(__BORLANDC__, BOOST_TESTED_AT(0x564))
        // Borland simply can't handle default arguments in member
        // class templates.  People wishing to write portable code can
        // explicitly specify BOOST_PARAMETER_MAX_ARITY arguments
        BOOST_PP_ENUM_PARAMS(BOOST_PARAMETER_MAX_ARITY, class A)
#else 
        BOOST_PP_ENUM_BINARY_PARAMS(
            BOOST_PARAMETER_MAX_ARITY, class A, = void_ BOOST_PP_INTERCEPT
        )
#endif            
    >
    struct bind
    {
        typedef typename aux::make_arg_list<
            typename BOOST_PARAMETER_build_arg_list(
                BOOST_PARAMETER_MAX_ARITY, aux::make_items, PS, A
            )::type
          , deduced_list
          , aux::tag_template_keyword_arg
        >::type result;

        typedef typename mpl::first<result>::type type;
    };

    BOOST_PARAMETER_FORWARD_TYPEDEFS(BOOST_PARAMETER_MAX_ARITY, PS, parameter_spec)

    //
    // The function call operator is used to build an arg_list that
    // labels the positional parameters and maintains whatever other
    // tags may have been specified by the caller.
    //
    // !!!NOTE!!!
    //
    // The make_arg_list<> produces a reversed arg_list, so
    // we need to pass the arguments to its constructor
    // reversed.
    //
    aux::empty_arg_list operator()() const
    {
       return aux::empty_arg_list();
    }

    template<class A0>
    typename mpl::first<
        typename aux::make_arg_list<
            aux::item<
                PS0,A0
            >
          , deduced_list
          , aux::tag_keyword_arg
        >::type
    >::type
    operator()(A0& a0) const
    {
        typedef typename aux::make_arg_list<
            aux::item<
                PS0,A0
            >
          , deduced_list
          , aux::tag_keyword_arg
        >::type result;

        typedef typename mpl::first<result>::type result_type;
        typedef typename mpl::second<result>::type error;
        error();

        return result_type(
            a0
            // , void_(), void_(), void_() ...
            BOOST_PP_ENUM_TRAILING_PARAMS(
                BOOST_PP_SUB(BOOST_PARAMETER_MAX_ARITY, 1)
              , aux::void_reference() BOOST_PP_INTERCEPT)
        );
    }

    template<class A0, class A1>
    typename mpl::first<
        typename aux::make_arg_list<
            aux::item<
                PS0,A0
              , aux::item<
                    PS1,A1
                >
            >
          , deduced_list
          , aux::tag_keyword_arg
        >::type
    >::type
    operator()(A0& a0, A1& a1) const
    {
        typedef typename aux::make_arg_list<
            aux::item<
                PS0,A0
              , aux::item<
                    PS1,A1
                >
            >
          , deduced_list
          , aux::tag_keyword_arg
        >::type result;

        typedef typename mpl::first<result>::type result_type;
        typedef typename mpl::second<result>::type error;
        error();

        return result_type(
            a1,a0
            // , void_(), void_() ...
            BOOST_PP_ENUM_TRAILING_PARAMS(
                BOOST_PP_SUB(BOOST_PARAMETER_MAX_ARITY, 2)
              , aux::void_reference() BOOST_PP_INTERCEPT)
        );
    }

    // Higher arities are handled by the preprocessor
#define BOOST_PP_ITERATION_PARAMS_1 (3,( \
        3,BOOST_PARAMETER_MAX_ARITY,<boost/parameter/aux_/overloads.hpp> \
    ))
#include BOOST_PP_ITERATE()

};

} // namespace parameter

} // namespace boost

#endif // BOOST_PARAMETERS_031014_HPP

