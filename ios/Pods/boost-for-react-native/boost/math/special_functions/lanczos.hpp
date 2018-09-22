//  (C) Copyright John Maddock 2006.
//  Use, modification and distribution are subject to the
//  Boost Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_MATH_SPECIAL_FUNCTIONS_LANCZOS
#define BOOST_MATH_SPECIAL_FUNCTIONS_LANCZOS

#ifdef _MSC_VER
#pragma once
#endif

#include <boost/config.hpp>
#include <boost/math/tools/big_constant.hpp>
#include <boost/mpl/if.hpp>
#include <boost/limits.hpp>
#include <boost/cstdint.hpp>
#include <boost/math/tools/rational.hpp>
#include <boost/math/policies/policy.hpp>
#include <boost/mpl/less_equal.hpp>

#include <limits.h>

namespace boost{ namespace math{ namespace lanczos{

//
// Individual lanczos approximations start here.
//
// Optimal values for G for each N are taken from
// http://web.mala.bc.ca/pughg/phdThesis/phdThesis.pdf,
// as are the theoretical error bounds.
//
// Constants calculated using the method described by Godfrey
// http://my.fit.edu/~gabdo/gamma.txt and elaborated by Toth at
// http://www.rskey.org/gamma.htm using NTL::RR at 1000 bit precision.
//
// Begin with a small helper to force initialization of constants prior
// to main.  This makes the constant initialization thread safe, even
// when called with a user-defined number type.
//
template <class Lanczos, class T>
struct lanczos_initializer
{
   struct init
   {
      init()
      {
         T t(1);
         Lanczos::lanczos_sum(t);
         Lanczos::lanczos_sum_expG_scaled(t);
         Lanczos::lanczos_sum_near_1(t);
         Lanczos::lanczos_sum_near_2(t);
         Lanczos::g();
      }
      void force_instantiate()const{}
   };
   static const init initializer;
   static void force_instantiate()
   {
      initializer.force_instantiate();
   }
};
template <class Lanczos, class T>
typename lanczos_initializer<Lanczos, T>::init const lanczos_initializer<Lanczos, T>::initializer;
//
// Lanczos Coefficients for N=6 G=5.581
// Max experimental error (with arbitary precision arithmetic) 9.516e-12
// Generated with compiler: Microsoft Visual C++ version 8.0 on Win32 at Mar 23 2006
//
struct lanczos6 : public mpl::int_<35>
{
   //
   // Produces slightly better than float precision when evaluated at
   // double precision:
   //
   template <class T>
   static T lanczos_sum(const T& z)
   {
      lanczos_initializer<lanczos6, T>::force_instantiate(); // Ensure our constants get initialized before main()
      static const T num[6] = {
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 35, 8706.349592549009182288174442774377925882)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 35, 8523.650341121874633477483696775067709735)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 35, 3338.029219476423550899999750161289306564)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 35, 653.6424994294008795995653541449610986791)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 35, 63.99951844938187085666201263218840287667)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 35, 2.506628274631006311133031631822390264407))
      };
      static const BOOST_MATH_INT_TABLE_TYPE(T, boost::uint16_t) denom[6] = {
         static_cast<boost::uint16_t>(0u),
         static_cast<boost::uint16_t>(24u),
         static_cast<boost::uint16_t>(50u),
         static_cast<boost::uint16_t>(35u),
         static_cast<boost::uint16_t>(10u),
         static_cast<boost::uint16_t>(1u)
      };
      return boost::math::tools::evaluate_rational(num, denom, z);
   }

   template <class T>
   static T lanczos_sum_expG_scaled(const T& z)
   {
      lanczos_initializer<lanczos6, T>::force_instantiate(); // Ensure our constants get initialized before main()
      static const T num[6] = {
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 35, 32.81244541029783471623665933780748627823)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 35, 32.12388941444332003446077108933558534361)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 35, 12.58034729455216106950851080138931470954)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 35, 2.463444478353241423633780693218408889251)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 35, 0.2412010548258800231126240760264822486599)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 35, 0.009446967704539249494420221613134244048319))
      };
      static const BOOST_MATH_INT_TABLE_TYPE(T, boost::uint16_t) denom[6] = {
         static_cast<boost::uint16_t>(0u),
         static_cast<boost::uint16_t>(24u),
         static_cast<boost::uint16_t>(50u),
         static_cast<boost::uint16_t>(35u),
         static_cast<boost::uint16_t>(10u),
         static_cast<boost::uint16_t>(1u)
      };
      return boost::math::tools::evaluate_rational(num, denom, z);
   }


   template<class T>
   static T lanczos_sum_near_1(const T& dz)
   {
      lanczos_initializer<lanczos6, T>::force_instantiate(); // Ensure our constants get initialized before main()
      static const T d[5] = {
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 35, 2.044879010930422922760429926121241330235)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 35, -2.751366405578505366591317846728753993668)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 35, 1.02282965224225004296750609604264824677)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 35, -0.09786124911582813985028889636665335893627)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 35, 0.0009829742267506615183144364420540766510112)),
      };
      T result = 0;
      for(unsigned k = 1; k <= sizeof(d)/sizeof(d[0]); ++k)
      {
         result += (-d[k-1]*dz)/(k*dz + k*k);
      }
      return result;
   }

   template<class T>
   static T lanczos_sum_near_2(const T& dz)
   {
      lanczos_initializer<lanczos6, T>::force_instantiate(); // Ensure our constants get initialized before main()
      static const T d[5] = {
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 35, 5.748142489536043490764289256167080091892)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 35, -7.734074268282457156081021756682138251825)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 35, 2.875167944990511006997713242805893543947)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 35, -0.2750873773533504542306766137703788781776)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 35, 0.002763134585812698552178368447708846850353)),
      };
      T result = 0;
      T z = dz + 2;
      for(unsigned k = 1; k <= sizeof(d)/sizeof(d[0]); ++k)
      {
         result += (-d[k-1]*dz)/(z + k*z + k*k - 1);
      }
      return result;
   }

   static double g(){ return 5.581000000000000405009359383257105946541; }
};

//
// Lanczos Coefficients for N=11 G=10.900511
// Max experimental error (with arbitary precision arithmetic) 2.16676e-19
// Generated with compiler: Microsoft Visual C++ version 8.0 on Win32 at Mar 23 2006
//
struct lanczos11 : public mpl::int_<60>
{
   //
   // Produces slightly better than double precision when evaluated at
   // extended-double precision:
   //
   template <class T>
   static T lanczos_sum(const T& z)
   {
      lanczos_initializer<lanczos11, T>::force_instantiate(); // Ensure our constants get initialized before main()
      static const T num[11] = {
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 38474670393.31776828316099004518914832218)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 36857665043.51950660081971227404959150474)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 15889202453.72942008945006665994637853242)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 4059208354.298834770194507810788393801607)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 680547661.1834733286087695557084801366446)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 78239755.00312005289816041245285376206263)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 6246580.776401795264013335510453568106366)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 341986.3488721347032223777872763188768288)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 12287.19451182455120096222044424100527629)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 261.6140441641668190791708576058805625502)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 2.506628274631000502415573855452633787834))
      };
      static const BOOST_MATH_INT_TABLE_TYPE(T, boost::uint32_t) denom[11] = {
         static_cast<boost::uint32_t>(0u),
         static_cast<boost::uint32_t>(362880u),
         static_cast<boost::uint32_t>(1026576u),
         static_cast<boost::uint32_t>(1172700u),
         static_cast<boost::uint32_t>(723680u),
         static_cast<boost::uint32_t>(269325u),
         static_cast<boost::uint32_t>(63273u),
         static_cast<boost::uint32_t>(9450u),
         static_cast<boost::uint32_t>(870u),
         static_cast<boost::uint32_t>(45u),
         static_cast<boost::uint32_t>(1u)
      };
      return boost::math::tools::evaluate_rational(num, denom, z);
   }

   template <class T>
   static T lanczos_sum_expG_scaled(const T& z)
   {
      lanczos_initializer<lanczos11, T>::force_instantiate(); // Ensure our constants get initialized before main()
      static const T num[11] = {
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 709811.662581657956893540610814842699825)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 679979.847415722640161734319823103390728)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 293136.785721159725251629480984140341656)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 74887.5403291467179935942448101441897121)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 12555.29058241386295096255111537516768137)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 1443.42992444170669746078056942194198252)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 115.2419459613734722083208906727972935065)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 6.30923920573262762719523981992008976989)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 0.2266840463022436475495508977579735223818)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 0.004826466289237661857584712046231435101741)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 0.4624429436045378766270459638520555557321e-4))
      };
      static const BOOST_MATH_INT_TABLE_TYPE(T, boost::uint32_t) denom[11] = {
         static_cast<boost::uint32_t>(0u),
         static_cast<boost::uint32_t>(362880u),
         static_cast<boost::uint32_t>(1026576u),
         static_cast<boost::uint32_t>(1172700u),
         static_cast<boost::uint32_t>(723680u),
         static_cast<boost::uint32_t>(269325u),
         static_cast<boost::uint32_t>(63273u),
         static_cast<boost::uint32_t>(9450u),
         static_cast<boost::uint32_t>(870u),
         static_cast<boost::uint32_t>(45u),
         static_cast<boost::uint32_t>(1u)
      };
      return boost::math::tools::evaluate_rational(num, denom, z);
   }


   template<class T>
   static T lanczos_sum_near_1(const T& dz)
   {
      lanczos_initializer<lanczos11, T>::force_instantiate(); // Ensure our constants get initialized before main()
      static const T d[10] = {
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 4.005853070677940377969080796551266387954)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, -13.17044315127646469834125159673527183164)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 17.19146865350790353683895137079288129318)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, -11.36446409067666626185701599196274701126)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 4.024801119349323770107694133829772634737)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, -0.7445703262078094128346501724255463005006)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 0.06513861351917497265045550019547857713172)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, -0.00217899958561830354633560009312512312758)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 0.17655204574495137651670832229571934738e-4)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, -0.1036282091079938047775645941885460820853e-7)),
      };
      T result = 0;
      for(unsigned k = 1; k <= sizeof(d)/sizeof(d[0]); ++k)
      {
         result += (-d[k-1]*dz)/(k*dz + k*k);
      }
      return result;
   }

   template<class T>
   static T lanczos_sum_near_2(const T& dz)
   {
      lanczos_initializer<lanczos11, T>::force_instantiate(); // Ensure our constants get initialized before main()
      static const T d[10] = {
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 19.05889633808148715159575716844556056056)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, -62.66183664701721716960978577959655644762)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 81.7929198065004751699057192860287512027)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, -54.06941772964234828416072865069196553015)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 19.14904664790693019642068229478769661515)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, -3.542488556926667589704590409095331790317)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 0.3099140334815639910894627700232804503017)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, -0.01036716187296241640634252431913030440825)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, 0.8399926504443119927673843789048514017761e-4)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 60, -0.493038376656195010308610694048822561263e-7)),
      };
      T result = 0;
      T z = dz + 2;
      for(unsigned k = 1; k <= sizeof(d)/sizeof(d[0]); ++k)
      {
         result += (-d[k-1]*dz)/(z + k*z + k*k - 1);
      }
      return result;
   }

   static double g(){ return 10.90051099999999983936049829935654997826; }
};

//
// Lanczos Coefficients for N=13 G=13.144565
// Max experimental error (with arbitary precision arithmetic) 9.2213e-23
// Generated with compiler: Microsoft Visual C++ version 8.0 on Win32 at Mar 23 2006
//
struct lanczos13 : public mpl::int_<72>
{
   //
   // Produces slightly better than extended-double precision when evaluated at
   // higher precision:
   //
   template <class T>
   static T lanczos_sum(const T& z)
   {
      lanczos_initializer<lanczos13, T>::force_instantiate(); // Ensure our constants get initialized before main()
      static const T num[13] = {
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 44012138428004.60895436261759919070125699)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 41590453358593.20051581730723108131357995)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 18013842787117.99677796276038389462742949)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 4728736263475.388896889723995205703970787)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 837910083628.4046470415724300225777912264)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 105583707273.4299344907359855510105321192)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 9701363618.494999493386608345339104922694)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 654914397.5482052641016767125048538245644)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 32238322.94213356530668889463945849409184)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 1128514.219497091438040721811544858643121)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 26665.79378459858944762533958798805525125)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 381.8801248632926870394389468349331394196)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 2.506628274631000502415763426076722427007))
      };
      static const BOOST_MATH_INT_TABLE_TYPE(T, boost::uint32_t) denom[13] = {
         static_cast<boost::uint32_t>(0u),
         static_cast<boost::uint32_t>(39916800u),
         static_cast<boost::uint32_t>(120543840u),
         static_cast<boost::uint32_t>(150917976u),
         static_cast<boost::uint32_t>(105258076u),
         static_cast<boost::uint32_t>(45995730u),
         static_cast<boost::uint32_t>(13339535u),
         static_cast<boost::uint32_t>(2637558u),
         static_cast<boost::uint32_t>(357423u),
         static_cast<boost::uint32_t>(32670u),
         static_cast<boost::uint32_t>(1925u),
         static_cast<boost::uint32_t>(66u),
         static_cast<boost::uint32_t>(1u)
      };
      return boost::math::tools::evaluate_rational(num, denom, z);
   }

   template <class T>
   static T lanczos_sum_expG_scaled(const T& z)
   {
      lanczos_initializer<lanczos13, T>::force_instantiate(); // Ensure our constants get initialized before main()
      static const T num[13] = {
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 86091529.53418537217994842267760536134841)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 81354505.17858011242874285785316135398567)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 35236626.38815461910817650960734605416521)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 9249814.988024471294683815872977672237195)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 1639024.216687146960253839656643518985826)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 206530.8157641225032631778026076868855623)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 18976.70193530288915698282139308582105936)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 1281.068909912559479885759622791374106059)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 63.06093343420234536146194868906771599354)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 2.207470909792527638222674678171050209691)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 0.05216058694613505427476207805814960742102)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 0.0007469903808915448316510079585999893674101)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 0.4903180573459871862552197089738373164184e-5))
      };
      static const BOOST_MATH_INT_TABLE_TYPE(T, boost::uint32_t) denom[13] = {
         static_cast<boost::uint32_t>(0u),
         static_cast<boost::uint32_t>(39916800u),
         static_cast<boost::uint32_t>(120543840u),
         static_cast<boost::uint32_t>(150917976u),
         static_cast<boost::uint32_t>(105258076u),
         static_cast<boost::uint32_t>(45995730u),
         static_cast<boost::uint32_t>(13339535u),
         static_cast<boost::uint32_t>(2637558u),
         static_cast<boost::uint32_t>(357423u),
         static_cast<boost::uint32_t>(32670u),
         static_cast<boost::uint32_t>(1925u),
         static_cast<boost::uint32_t>(66u),
         static_cast<boost::uint32_t>(1u)
      };
      return boost::math::tools::evaluate_rational(num, denom, z);
   }


   template<class T>
   static T lanczos_sum_near_1(const T& dz)
   {
      lanczos_initializer<lanczos13, T>::force_instantiate(); // Ensure our constants get initialized before main()
      static const T d[12] = {
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 4.832115561461656947793029596285626840312)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, -19.86441536140337740383120735104359034688)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 33.9927422807443239927197864963170585331)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, -31.41520692249765980987427413991250886138)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 17.0270866009599345679868972409543597821)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, -5.5077216950865501362506920516723682167)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 1.037811741948214855286817963800439373362)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, -0.106640468537356182313660880481398642811)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 0.005276450526660653288757565778182586742831)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, -0.0001000935625597121545867453746252064770029)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 0.462590910138598083940803704521211569234e-6)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, -0.1735307814426389420248044907765671743012e-9)),
      };
      T result = 0;
      for(unsigned k = 1; k <= sizeof(d)/sizeof(d[0]); ++k)
      {
         result += (-d[k-1]*dz)/(k*dz + k*k);
      }
      return result;
   }

   template<class T>
   static T lanczos_sum_near_2(const T& dz)
   {
      lanczos_initializer<lanczos13, T>::force_instantiate(); // Ensure our constants get initialized before main()
      static const T d[12] = {
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 26.96979819614830698367887026728396466395)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, -110.8705424709385114023884328797900204863)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 189.7258846119231466417015694690434770085)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, -175.3397202971107486383321670769397356553)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 95.03437648691551457087250340903980824948)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, -30.7406022781665264273675797983497141978)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 5.792405601630517993355102578874590410552)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, -0.5951993240669148697377539518639997795831)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 0.02944979359164017509944724739946255067671)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, -0.0005586586555377030921194246330399163602684)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, 0.2581888478270733025288922038673392636029e-5)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 72, -0.9685385411006641478305219367315965391289e-9)),
      };
      T result = 0;
      T z = dz + 2;
      for(unsigned k = 1; k <= sizeof(d)/sizeof(d[0]); ++k)
      {
         result += (-d[k-1]*dz)/(z + k*z + k*k - 1);
      }
      return result;
   }

   static double g(){ return 13.1445650000000000545696821063756942749; }
};

//
// Lanczos Coefficients for N=22 G=22.61891
// Max experimental error (with arbitary precision arithmetic) 2.9524e-38
// Generated with compiler: Microsoft Visual C++ version 8.0 on Win32 at Mar 23 2006
//
struct lanczos22 : public mpl::int_<120>
{
   //
   // Produces slightly better than 128-bit long-double precision when 
   // evaluated at higher precision:
   //
   template <class T>
   static T lanczos_sum(const T& z)
   {
      lanczos_initializer<lanczos22, T>::force_instantiate(); // Ensure our constants get initialized before main()
      static const T num[22] = {
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 46198410803245094237463011094.12173081986)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 43735859291852324413622037436.321513777)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 19716607234435171720534556386.97481377748)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 5629401471315018442177955161.245623932129)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 1142024910634417138386281569.245580222392)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 175048529315951173131586747.695329230778)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 21044290245653709191654675.41581372963167)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 2033001410561031998451380.335553678782601)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 160394318862140953773928.8736211601848891)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 10444944438396359705707.48957290388740896)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 565075825801617290121.1466393747967538948)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 25475874292116227538.99448534450411942597)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 957135055846602154.6720835535232270205725)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 29874506304047462.23662392445173880821515)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 769651310384737.2749087590725764959689181)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 16193289100889.15989633624378404096011797)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 273781151680.6807433264462376754578933261)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 3630485900.32917021712188739762161583295)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 36374352.05577334277856865691538582936484)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 258945.7742115532455441786924971194951043)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 1167.501919472435718934219997431551246996)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 2.50662827463100050241576528481104525333))
      };
      static const BOOST_MATH_INT_TABLE_TYPE(T, boost::uint64_t) denom[22] = {
         BOOST_MATH_INT_VALUE_SUFFIX(0, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(2432902008176640000, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(8752948036761600000, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(13803759753640704000, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(12870931245150988800, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(8037811822645051776, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(3599979517947607200, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(1206647803780373360, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(311333643161390640, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(63030812099294896, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(10142299865511450, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(1307535010540395, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(135585182899530, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(11310276995381, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(756111184500, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(40171771630, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(1672280820, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(53327946, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(1256850, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(20615, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(210, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(1, uLL)
      };
      return boost::math::tools::evaluate_rational(num, denom, z);
   }

   template <class T>
   static T lanczos_sum_expG_scaled(const T& z)
   {
      lanczos_initializer<lanczos22, T>::force_instantiate(); // Ensure our constants get initialized before main()
      static const T num[22] = {
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 6939996264376682180.277485395074954356211)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 6570067992110214451.87201438870245659384)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 2961859037444440551.986724631496417064121)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 845657339772791245.3541226499766163431651)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 171556737035449095.2475716923888737881837)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 26296059072490867.7822441885603400926007)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 3161305619652108.433798300149816829198706)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 305400596026022.4774396904484542582526472)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 24094681058862.55120507202622377623528108)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 1569055604375.919477574824168939428328839)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 84886558909.02047889339710230696942513159)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 3827024985.166751989686050643579753162298)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 143782298.9273215199098728674282885500522)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 4487794.24541641841336786238909171265944)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 115618.2025760830513505888216285273541959)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 2432.580773108508276957461757328744780439)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 41.12782532742893597168530008461874360191)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 0.5453771709477689805460179187388702295792)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 0.005464211062612080347167337964166505282809)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 0.388992321263586767037090706042788910953e-4)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 0.1753839324538447655939518484052327068859e-6)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 0.3765495513732730583386223384116545391759e-9))
      };
      static const BOOST_MATH_INT_TABLE_TYPE(T, boost::uint64_t) denom[22] = {
         BOOST_MATH_INT_VALUE_SUFFIX(0, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(2432902008176640000, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(8752948036761600000, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(13803759753640704000, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(12870931245150988800, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(8037811822645051776, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(3599979517947607200, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(1206647803780373360, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(311333643161390640, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(63030812099294896, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(10142299865511450, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(1307535010540395, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(135585182899530, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(11310276995381, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(756111184500, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(40171771630, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(1672280820, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(53327946, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(1256850, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(20615, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(210, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(1, uLL)
      };
      return boost::math::tools::evaluate_rational(num, denom, z);
   }


   template<class T>
   static T lanczos_sum_near_1(const T& dz)
   {
      lanczos_initializer<lanczos22, T>::force_instantiate(); // Ensure our constants get initialized before main()
      static const T d[21] = {
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 8.318998691953337183034781139546384476554)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, -63.15415991415959158214140353299240638675)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 217.3108224383632868591462242669081540163)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, -448.5134281386108366899784093610397354889)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 619.2903759363285456927248474593012711346)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, -604.1630177420625418522025080080444177046)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 428.8166750424646119935047118287362193314)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, -224.6988753721310913866347429589434550302)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 87.32181627555510833499451817622786940961)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, -25.07866854821128965662498003029199058098)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 5.264398125689025351448861011657789005392)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, -0.792518936256495243383586076579921559914)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 0.08317448364744713773350272460937904691566)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, -0.005845345166274053157781068150827567998882)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 0.0002599412126352082483326238522490030412391)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, -0.6748102079670763884917431338234783496303e-5)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 0.908824383434109002762325095643458603605e-7)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, -0.5299325929309389890892469299969669579725e-9)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 0.994306085859549890267983602248532869362e-12)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, -0.3499893692975262747371544905820891835298e-15)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 0.7260746353663365145454867069182884694961e-20)),
      };
      T result = 0;
      for(unsigned k = 1; k <= sizeof(d)/sizeof(d[0]); ++k)
      {
         result += (-d[k-1]*dz)/(k*dz + k*k);
      }
      return result;
   }

   template<class T>
   static T lanczos_sum_near_2(const T& dz)
   {
      lanczos_initializer<lanczos22, T>::force_instantiate(); // Ensure our constants get initialized before main()
      static const T d[21] = {
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 75.39272007105208086018421070699575462226)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, -572.3481967049935412452681346759966390319)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 1969.426202741555335078065370698955484358)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, -4064.74968778032030891520063865996757519)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 5612.452614138013929794736248384309574814)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, -5475.357667500026172903620177988213902339)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 3886.243614216111328329547926490398103492)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, -2036.382026072125407192448069428134470564)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 791.3727954936062108045551843636692287652)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, -227.2808432388436552794021219198885223122)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 47.70974355562144229897637024320739257284)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, -7.182373807798293545187073539819697141572)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 0.7537866989631514559601547530490976100468)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, -0.05297470142240154822658739758236594717787)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 0.00235577330936380542539812701472320434133)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, -0.6115613067659273118098229498679502138802e-4)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 0.8236417010170941915758315020695551724181e-6)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, -0.4802628430993048190311242611330072198089e-8)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 0.9011113376981524418952720279739624707342e-11)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, -0.3171854152689711198382455703658589996796e-14)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 120, 0.6580207998808093935798753964580596673177e-19)),
      };
      T result = 0;
      T z = dz + 2;
      for(unsigned k = 1; k <= sizeof(d)/sizeof(d[0]); ++k)
      {
         result += (-d[k-1]*dz)/(z + k*z + k*k - 1);
      }
      return result;
   }

   static double g(){ return 22.61890999999999962710717227309942245483; }
};

//
// Lanczos Coefficients for N=6 G=1.428456135094165802001953125
// Max experimental error (with arbitary precision arithmetic) 8.111667e-8
// Generated with compiler: Microsoft Visual C++ version 8.0 on Win32 at Mar 23 2006
//
struct lanczos6m24 : public mpl::int_<24>
{
   //
   // Use for float precision, when evaluated as a float:
   //
   template <class T>
   static T lanczos_sum(const T& z)
   {
      static const T num[6] = {
         static_cast<T>(58.52061591769095910314047740215847630266L),
         static_cast<T>(182.5248962595894264831189414768236280862L),
         static_cast<T>(211.0971093028510041839168287718170827259L),
         static_cast<T>(112.2526547883668146736465390902227161763L),
         static_cast<T>(27.5192015197455403062503721613097825345L),
         static_cast<T>(2.50662858515256974113978724717473206342L)
      };
      static const BOOST_MATH_INT_TABLE_TYPE(T, boost::uint16_t) denom[6] = {
         static_cast<boost::uint16_t>(0u),
         static_cast<boost::uint16_t>(24u),
         static_cast<boost::uint16_t>(50u),
         static_cast<boost::uint16_t>(35u),
         static_cast<boost::uint16_t>(10u),
         static_cast<boost::uint16_t>(1u)
      };
      return boost::math::tools::evaluate_rational(num, denom, z);
   }

   template <class T>
   static T lanczos_sum_expG_scaled(const T& z)
   {
      static const T num[6] = {
         static_cast<T>(14.0261432874996476619570577285003839357L),
         static_cast<T>(43.74732405540314316089531289293124360129L),
         static_cast<T>(50.59547402616588964511581430025589038612L),
         static_cast<T>(26.90456680562548195593733429204228910299L),
         static_cast<T>(6.595765571169314946316366571954421695196L),
         static_cast<T>(0.6007854010515290065101128585795542383721L)
      };
      static const BOOST_MATH_INT_TABLE_TYPE(T, boost::uint16_t) denom[6] = {
         static_cast<boost::uint16_t>(0u),
         static_cast<boost::uint16_t>(24u),
         static_cast<boost::uint16_t>(50u),
         static_cast<boost::uint16_t>(35u),
         static_cast<boost::uint16_t>(10u),
         static_cast<boost::uint16_t>(1u)
      };
      return boost::math::tools::evaluate_rational(num, denom, z);
   }


   template<class T>
   static T lanczos_sum_near_1(const T& dz)
   {
      static const T d[5] = {
         static_cast<T>(0.4922488055204602807654354732674868442106L),
         static_cast<T>(0.004954497451132152436631238060933905650346L),
         static_cast<T>(-0.003374784572167105840686977985330859371848L),
         static_cast<T>(0.001924276018962061937026396537786414831385L),
         static_cast<T>(-0.00056533046336427583708166383712907694434L),
      };
      T result = 0;
      for(unsigned k = 1; k <= sizeof(d)/sizeof(d[0]); ++k)
      {
         result += (-d[k-1]*dz)/(k*dz + k*k);
      }
      return result;
   }

   template<class T>
   static T lanczos_sum_near_2(const T& dz)
   {
      static const T d[5] = {
         static_cast<T>(0.6534966888520080645505805298901130485464L),
         static_cast<T>(0.006577461728560758362509168026049182707101L),
         static_cast<T>(-0.004480276069269967207178373559014835978161L),
         static_cast<T>(0.00255461870648818292376982818026706528842L),
         static_cast<T>(-0.000750517993690428370380996157470900204524L),
      };
      T result = 0;
      T z = dz + 2;
      for(unsigned k = 1; k <= sizeof(d)/sizeof(d[0]); ++k)
      {
         result += (-d[k-1]*dz)/(z + k*z + k*k - 1);
      }
      return result;
   }

   static double g(){ return 1.428456135094165802001953125; }
};

//
// Lanczos Coefficients for N=13 G=6.024680040776729583740234375
// Max experimental error (with arbitary precision arithmetic) 1.196214e-17
// Generated with compiler: Microsoft Visual C++ version 8.0 on Win32 at Mar 23 2006
//
struct lanczos13m53 : public mpl::int_<53>
{
   //
   // Use for double precision, when evaluated as a double:
   //
   template <class T>
   static T lanczos_sum(const T& z)
   {
      static const T num[13] = {
         static_cast<T>(23531376880.41075968857200767445163675473L),
         static_cast<T>(42919803642.64909876895789904700198885093L),
         static_cast<T>(35711959237.35566804944018545154716670596L),
         static_cast<T>(17921034426.03720969991975575445893111267L),
         static_cast<T>(6039542586.35202800506429164430729792107L),
         static_cast<T>(1439720407.311721673663223072794912393972L),
         static_cast<T>(248874557.8620541565114603864132294232163L),
         static_cast<T>(31426415.58540019438061423162831820536287L),
         static_cast<T>(2876370.628935372441225409051620849613599L),
         static_cast<T>(186056.2653952234950402949897160456992822L),
         static_cast<T>(8071.672002365816210638002902272250613822L),
         static_cast<T>(210.8242777515793458725097339207133627117L),
         static_cast<T>(2.506628274631000270164908177133837338626L)
      };
      static const BOOST_MATH_INT_TABLE_TYPE(T, boost::uint32_t) denom[13] = {
         static_cast<boost::uint32_t>(0u),
         static_cast<boost::uint32_t>(39916800u),
         static_cast<boost::uint32_t>(120543840u),
         static_cast<boost::uint32_t>(150917976u),
         static_cast<boost::uint32_t>(105258076u),
         static_cast<boost::uint32_t>(45995730u),
         static_cast<boost::uint32_t>(13339535u),
         static_cast<boost::uint32_t>(2637558u),
         static_cast<boost::uint32_t>(357423u),
         static_cast<boost::uint32_t>(32670u),
         static_cast<boost::uint32_t>(1925u),
         static_cast<boost::uint32_t>(66u),
         static_cast<boost::uint32_t>(1u)
      };
      return boost::math::tools::evaluate_rational(num, denom, z);
   }

   template <class T>
   static T lanczos_sum_expG_scaled(const T& z)
   {
      static const T num[13] = {
         static_cast<T>(56906521.91347156388090791033559122686859L),
         static_cast<T>(103794043.1163445451906271053616070238554L),
         static_cast<T>(86363131.28813859145546927288977868422342L),
         static_cast<T>(43338889.32467613834773723740590533316085L),
         static_cast<T>(14605578.08768506808414169982791359218571L),
         static_cast<T>(3481712.15498064590882071018964774556468L),
         static_cast<T>(601859.6171681098786670226533699352302507L),
         static_cast<T>(75999.29304014542649875303443598909137092L),
         static_cast<T>(6955.999602515376140356310115515198987526L),
         static_cast<T>(449.9445569063168119446858607650988409623L),
         static_cast<T>(19.51992788247617482847860966235652136208L),
         static_cast<T>(0.5098416655656676188125178644804694509993L),
         static_cast<T>(0.006061842346248906525783753964555936883222L)
      };
      static const BOOST_MATH_INT_TABLE_TYPE(T, boost::uint32_t) denom[13] = {
         static_cast<boost::uint32_t>(0u),
         static_cast<boost::uint32_t>(39916800u),
         static_cast<boost::uint32_t>(120543840u),
         static_cast<boost::uint32_t>(150917976u),
         static_cast<boost::uint32_t>(105258076u),
         static_cast<boost::uint32_t>(45995730u),
         static_cast<boost::uint32_t>(13339535u),
         static_cast<boost::uint32_t>(2637558u),
         static_cast<boost::uint32_t>(357423u),
         static_cast<boost::uint32_t>(32670u),
         static_cast<boost::uint32_t>(1925u),
         static_cast<boost::uint32_t>(66u),
         static_cast<boost::uint32_t>(1u)
      };
      return boost::math::tools::evaluate_rational(num, denom, z);
   }


   template<class T>
   static T lanczos_sum_near_1(const T& dz)
   {
      static const T d[12] = {
         static_cast<T>(2.208709979316623790862569924861841433016L),
         static_cast<T>(-3.327150580651624233553677113928873034916L),
         static_cast<T>(1.483082862367253753040442933770164111678L),
         static_cast<T>(-0.1993758927614728757314233026257810172008L),
         static_cast<T>(0.004785200610085071473880915854204301886437L),
         static_cast<T>(-0.1515973019871092388943437623825208095123e-5L),
         static_cast<T>(-0.2752907702903126466004207345038327818713e-7L),
         static_cast<T>(0.3075580174791348492737947340039992829546e-7L),
         static_cast<T>(-0.1933117898880828348692541394841204288047e-7L),
         static_cast<T>(0.8690926181038057039526127422002498960172e-8L),
         static_cast<T>(-0.2499505151487868335680273909354071938387e-8L),
         static_cast<T>(0.3394643171893132535170101292240837927725e-9L),
      };
      T result = 0;
      for(unsigned k = 1; k <= sizeof(d)/sizeof(d[0]); ++k)
      {
         result += (-d[k-1]*dz)/(k*dz + k*k);
      }
      return result;
   }

   template<class T>
   static T lanczos_sum_near_2(const T& dz)
   {
      static const T d[12] = {
         static_cast<T>(6.565936202082889535528455955485877361223L),
         static_cast<T>(-9.8907772644920670589288081640128194231L),
         static_cast<T>(4.408830289125943377923077727900630927902L),
         static_cast<T>(-0.5926941084905061794445733628891024027949L),
         static_cast<T>(0.01422519127192419234315002746252160965831L),
         static_cast<T>(-0.4506604409707170077136555010018549819192e-5L),
         static_cast<T>(-0.8183698410724358930823737982119474130069e-7L),
         static_cast<T>(0.9142922068165324132060550591210267992072e-7L),
         static_cast<T>(-0.5746670642147041587497159649318454348117e-7L),
         static_cast<T>(0.2583592566524439230844378948704262291927e-7L),
         static_cast<T>(-0.7430396708998719707642735577238449585822e-8L),
         static_cast<T>(0.1009141566987569892221439918230042368112e-8L),
      };
      T result = 0;
      T z = dz + 2;
      for(unsigned k = 1; k <= sizeof(d)/sizeof(d[0]); ++k)
      {
         result += (-d[k-1]*dz)/(z + k*z + k*k - 1);
      }
      return result;
   }

   static double g(){ return 6.024680040776729583740234375; }
};

//
// Lanczos Coefficients for N=17 G=12.2252227365970611572265625
// Max experimental error (with arbitary precision arithmetic) 2.7699e-26
// Generated with compiler: Microsoft Visual C++ version 8.0 on Win32 at Mar 23 2006
//
struct lanczos17m64 : public mpl::int_<64>
{
   //
   // Use for extended-double precision, when evaluated as an extended-double:
   //
   template <class T>
   static T lanczos_sum(const T& z)
   {
      lanczos_initializer<lanczos17m64, T>::force_instantiate(); // Ensure our constants get initialized before main()
      static const T num[17] = {
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 553681095419291969.2230556393350368550504)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 731918863887667017.2511276782146694632234)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 453393234285807339.4627124634539085143364)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 174701893724452790.3546219631779712198035)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 46866125995234723.82897281620357050883077)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 9281280675933215.169109622777099699054272)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 1403600894156674.551057997617468721789536)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 165345984157572.7305349809894046783973837)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 15333629842677.31531822808737907246817024)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 1123152927963.956626161137169462874517318)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 64763127437.92329018717775593533620578237)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 2908830362.657527782848828237106640944457)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 99764700.56999856729959383751710026787811)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 2525791.604886139959837791244686290089331)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 44516.94034970167828580039370201346554872)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 488.0063567520005730476791712814838113252)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 2.50662827463100050241576877135758834683))
      };
      static const BOOST_MATH_INT_TABLE_TYPE(T, boost::uint64_t) denom[17] = {
         BOOST_MATH_INT_VALUE_SUFFIX(0, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(1307674368000, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(4339163001600, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(6165817614720, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(5056995703824, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(2706813345600, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(1009672107080, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(272803210680, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(54631129553, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(8207628000, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(928095740, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(78558480, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(4899622, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(218400, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(6580, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(120, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(1, uLL)
      };
      return boost::math::tools::evaluate_rational(num, denom, z);
   }

   template <class T>
   static T lanczos_sum_expG_scaled(const T& z)
   {
      lanczos_initializer<lanczos17m64, T>::force_instantiate(); // Ensure our constants get initialized before main()
      static const T num[17] = {
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 2715894658327.717377557655133124376674911)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 3590179526097.912105038525528721129550434)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 2223966599737.814969312127353235818710172)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 856940834518.9562481809925866825485883417)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 229885871668.749072933597446453399395469)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 45526171687.54610815813502794395753410032)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 6884887713.165178784550917647709216424823)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 811048596.1407531864760282453852372777439)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 75213915.96540822314499613623119501704812)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 5509245.417224265151697527957954952830126)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 317673.5368435419126714931842182369574221)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 14268.27989845035520147014373320337523596)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 489.3618720403263670213909083601787814792)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 12.38941330038454449295883217865458609584)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 0.2183627389504614963941574507281683147897)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 0.002393749522058449186690627996063983095463)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 0.1229541408909435212800785616808830746135e-4))
      };
      static const BOOST_MATH_INT_TABLE_TYPE(T, boost::uint64_t) denom[17] = {
         BOOST_MATH_INT_VALUE_SUFFIX(0, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(1307674368000, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(4339163001600, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(6165817614720, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(5056995703824, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(2706813345600, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(1009672107080, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(272803210680, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(54631129553, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(8207628000, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(928095740, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(78558480, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(4899622, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(218400, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(6580, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(120, uLL),
         BOOST_MATH_INT_VALUE_SUFFIX(1, uLL)
      };
      return boost::math::tools::evaluate_rational(num, denom, z);
   }


   template<class T>
   static T lanczos_sum_near_1(const T& dz)
   {
      lanczos_initializer<lanczos17m64, T>::force_instantiate(); // Ensure our constants get initialized before main()
      static const T d[16] = {
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 4.493645054286536365763334986866616581265)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, -16.95716370392468543800733966378143997694)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 26.19196892983737527836811770970479846644)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, -21.3659076437988814488356323758179283908)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 9.913992596774556590710751047594507535764)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, -2.62888300018780199210536267080940382158)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 0.3807056693542503606384861890663080735588)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, -0.02714647489697685807340312061034730486958)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 0.0007815484715461206757220527133967191796747)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, -0.6108630817371501052576880554048972272435e-5)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 0.5037380238864836824167713635482801545086e-8)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, -0.1483232144262638814568926925964858237006e-13)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 0.1346609158752142460943888149156716841693e-14)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, -0.660492688923978805315914918995410340796e-15)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 0.1472114697343266749193617793755763792681e-15)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, -0.1410901942033374651613542904678399264447e-16)),
      };
      T result = 0;
      for(unsigned k = 1; k <= sizeof(d)/sizeof(d[0]); ++k)
      {
         result += (-d[k-1]*dz)/(k*dz + k*k);
      }
      return result;
   }

   template<class T>
   static T lanczos_sum_near_2(const T& dz)
   {
      lanczos_initializer<lanczos17m64, T>::force_instantiate(); // Ensure our constants get initialized before main()
      static const T d[16] = {
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 23.56409085052261327114594781581930373708)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, -88.92116338946308797946237246006238652361)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 137.3472822086847596961177383569603988797)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, -112.0400438263562152489272966461114852861)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 51.98768915202973863076166956576777843805)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, -13.78552090862799358221343319574970124948)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 1.996371068830872830250406773917646121742)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, -0.1423525874909934506274738563671862576161)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 0.004098338646046865122459664947239111298524)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, -0.3203286637326511000882086573060433529094e-4)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 0.2641536751640138646146395939004587594407e-7)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, -0.7777876663062235617693516558976641009819e-13)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 0.7061443477097101636871806229515157914789e-14)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, -0.3463537849537988455590834887691613484813e-14)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, 0.7719578215795234036320348283011129450595e-15)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 64, -0.7398586479708476329563577384044188912075e-16)),
      };
      T result = 0;
      T z = dz + 2;
      for(unsigned k = 1; k <= sizeof(d)/sizeof(d[0]); ++k)
      {
         result += (-d[k-1]*dz)/(z + k*z + k*k - 1);
      }
      return result;
   }

   static double g(){ return 12.2252227365970611572265625; }
};

//
// Lanczos Coefficients for N=24 G=20.3209821879863739013671875
// Max experimental error (with arbitary precision arithmetic) 1.0541e-38
// Generated with compiler: Microsoft Visual C++ version 8.0 on Win32 at Mar 23 2006
//
struct lanczos24m113 : public mpl::int_<113>
{
   //
   // Use for long-double precision, when evaluated as an long-double:
   //
   template <class T>
   static T lanczos_sum(const T& z)
   {
      lanczos_initializer<lanczos24m113, T>::force_instantiate(); // Ensure our constants get initialized before main()
      static const T num[24] = {
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 2029889364934367661624137213253.22102954656825019111612712252027267955023987678816620961507)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 2338599599286656537526273232565.2727349714338768161421882478417543004440597874814359063158)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 1288527989493833400335117708406.3953711906175960449186720680201425446299360322830739180195)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 451779745834728745064649902914.550539158066332484594436145043388809847364393288132164411521)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 113141284461097964029239556815.291212318665536114012605167994061291631013303788706545334708)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 21533689802794625866812941616.7509064680880468667055339259146063256555368135236149614592432)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 3235510315314840089932120340.71494940111731241353655381919722177496659303550321056514776757)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 393537392344185475704891959.081297108513472083749083165179784098220158201055270548272414314)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 39418265082950435024868801.5005452240816902251477336582325944930252142622315101857742955673)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 3290158764187118871697791.05850632319194734270969161036889516414516566453884272345518372696)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 230677110449632078321772.618245845856640677845629174549731890660612368500786684333975350954)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 13652233645509183190158.5916189185218250859402806777406323001463296297553612462737044693697)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 683661466754325350495.216655026531202476397782296585200982429378069417193575896602446904762)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 28967871782219334117.0122379171041074970463982134039409352925258212207710168851968215545064)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 1036104088560167006.2022834098572346459442601718514554488352117620272232373622553429728555)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 31128490785613152.8380102669349814751268126141105475287632676569913936040772990253369753962)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 779327504127342.536207878988196814811198475410572992436243686674896894543126229424358472541)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 16067543181294.643350688789124777020407337133926174150582333950666044399234540521336771876)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 268161795520.300916569439413185778557212729611517883948634711190170998896514639936969855484)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 3533216359.10528191668842486732408440112703691790824611391987708562111396961696753452085068)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 35378979.5479656110614685178752543826919239614088343789329169535932709470588426584501652577)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 253034.881362204346444503097491737872930637147096453940375713745904094735506180552724766444)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 1151.61895453463992438325318456328526085882924197763140514450975619271382783957699017875304)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 2.50662827463100050241576528481104515966515623051532908941425544355490413900497467936202516))
      };
      static const T denom[24] = {
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 0.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 0.112400072777760768e22)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 0.414847677933545472e22)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 6756146673770930688000.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 6548684852703068697600.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 4280722865357147142912.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 2021687376910682741568.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 720308216440924653696.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 199321978221066137360.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 43714229649594412832.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 7707401101297361068.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 1103230881185949736.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 129006659818331295.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 12363045847086207.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 971250460939913.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 62382416421941.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 3256091103430.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 136717357942.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 4546047198.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 116896626.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 2240315.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 30107.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 253.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 1.0))
      };
      return boost::math::tools::evaluate_rational(num, denom, z);
   }

   template <class T>
   static T lanczos_sum_expG_scaled(const T& z)
   {
      lanczos_initializer<lanczos24m113, T>::force_instantiate(); // Ensure our constants get initialized before main()
      static const T num[24] = {
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 3035162425359883494754.02878223286972654682199012688209026810841953293372712802258398358538)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 3496756894406430103600.16057175075063458536101374170860226963245118484234495645518505519827)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 1926652656689320888654.01954015145958293168365236755537645929361841917596501251362171653478)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 675517066488272766316.083023742440619929434602223726894748181327187670231286180156444871912)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 169172853104918752780.086262749564831660238912144573032141700464995906149421555926000038492)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 32197935167225605785.6444116302160245528783954573163541751756353183343357329404208062043808)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 4837849542714083249.37587447454818124327561966323276633775195138872820542242539845253171632)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 588431038090493242.308438203986649553459461798968819276505178004064031201740043314534404158)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 58939585141634058.6206417889192563007809470547755357240808035714047014324843817783741669733)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 4919561837722192.82991866530802080996138070630296720420704876654726991998309206256077395868)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 344916580244240.407442753122831512004021081677987651622305356145640394384006997569631719101)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 20413302960687.8250598845969238472629322716685686993835561234733641729957841485003560103066)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 1022234822943.78400752460970689311934727763870970686747383486600540378889311406851534545789)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 43313787191.9821354846952908076307094286897439975815501673706144217246093900159173598852503)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 1549219505.59667418528481770869280437577581951167003505825834192510436144666564648361001914)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 46544421.1998761919380541579358096705925369145324466147390364674998568485110045455014967149)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 1165278.06807504975090675074910052763026564833951579556132777702952882101173607903881127542)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 24024.759267256769471083727721827405338569868270177779485912486668586611981795179894572115)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 400.965008113421955824358063769761286758463521789765880962939528760888853281920872064838918)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 5.28299015654478269617039029170846385138134929147421558771949982217659507918482272439717603)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 0.0528999024412510102409256676599360516359062802002483877724963720047531347449011629466149805)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 0.000378346710654740685454266569593414561162134092347356968516522170279688139165340746957511115)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 0.172194142179211139195966608011235161516824700287310869949928393345257114743230967204370963e-5)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 0.374799931707148855771381263542708435935402853962736029347951399323367765509988401336565436e-8))
      };
      static const T denom[24] = {
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 0.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 0.112400072777760768e22)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 0.414847677933545472e22)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 6756146673770930688000.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 6548684852703068697600.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 4280722865357147142912.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 2021687376910682741568.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 720308216440924653696.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 199321978221066137360.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 43714229649594412832.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 7707401101297361068.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 1103230881185949736.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 129006659818331295.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 12363045847086207.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 971250460939913.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 62382416421941.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 3256091103430.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 136717357942.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 4546047198.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 116896626.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 2240315.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 30107.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 253.0)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 1.0))
      };
      return boost::math::tools::evaluate_rational(num, denom, z);
   }


   template<class T>
   static T lanczos_sum_near_1(const T& dz)
   {
      lanczos_initializer<lanczos24m113, T>::force_instantiate(); // Ensure our constants get initialized before main()
      static const T d[23] = {
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 7.4734083002469026177867421609938203388868806387315406134072298925733950040583068760685908)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, -50.4225805042247530267317342133388132970816607563062253708655085754357843064134941138154171)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 152.288200621747008570784082624444625293884063492396162110698238568311211546361189979357019)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, -271.894959539150384169327513139846971255640842175739337449692360299099322742181325023644769)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 319.240102980202312307047586791116902719088581839891008532114107693294261542869734803906793)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, -259.493144143048088289689500935518073716201741349569864988870534417890269467336454358361499)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 149.747518319689708813209645403067832020714660918583227716408482877303972685262557460145835)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, -61.9261301009341333289187201425188698128684426428003249782448828881580630606817104372760037)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 18.3077524177286961563937379403377462608113523887554047531153187277072451294845795496072365)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, -3.82011322251948043097070160584761236869363471824695092089556195047949392738162970152230254)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 0.549382685505691522516705902336780999493262538301283190963770663549981309645795228539620711)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, -0.0524814679715180697633723771076668718265358076235229045603747927518423453658004287459638024)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 0.00315392664003333528534120626687784812050217700942910879712808180705014754163256855643360698)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, -0.000110098373127648510519799564665442121339511198561008748083409549601095293123407080388658329)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 0.19809382866681658224945717689377373458866950897791116315219376038432014207446832310901893e-5)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, -0.152278977408600291408265615203504153130482270424202400677280558181047344681214058227949755e-7)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 0.364344768076106268872239259083188037615571711218395765792787047015406264051536972018235217e-10)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, -0.148897510480440424971521542520683536298361220674662555578951242811522959610991621951203526e-13)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 0.261199241161582662426512749820666625442516059622425213340053324061794752786482115387573582e-18)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, -0.780072664167099103420998436901014795601783313858454665485256897090476089641613851903791529e-24)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 0.303465867587106629530056603454807425512962762653755513440561256044986695349304176849392735e-24)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, -0.615420597971283870342083342286977366161772327800327789325710571275345878439656918541092056e-25)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 0.499641233843540749369110053005439398774706583601830828776209650445427083113181961630763702e-26)),
      };
      T result = 0;
      for(unsigned k = 1; k <= sizeof(d)/sizeof(d[0]); ++k)
      {
         result += (-d[k-1]*dz)/(k*dz + k*k);
      }
      return result;
   }

   template<class T>
   static T lanczos_sum_near_2(const T& dz)
   {
      lanczos_initializer<lanczos24m113, T>::force_instantiate(); // Ensure our constants get initialized before main()
      static const T d[23] = {
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 61.4165001061101455341808888883960361969557848005400286332291451422461117307237198559485365)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, -414.372973678657049667308134761613915623353625332248315105320470271523320700386200587519147)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 1251.50505818554680171298972755376376836161706773644771875668053742215217922228357204561873)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, -2234.43389421602399514176336175766511311493214354568097811220122848998413358085613880612158)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 2623.51647746991904821899989145639147785427273427135380151752779100215839537090464785708684)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, -2132.51572435428751962745870184529534443305617818870214348386131243463614597272260797772423)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 1230.62572059218405766499842067263311220019173335523810725664442147670956427061920234820189)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, -508.90919151163744999377586956023909888833335885805154492270846381061182696305011395981929)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 150.453184562246579758706538566480316921938628645961177699894388251635886834047343195475395)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, -31.3937061525822497422230490071156186113405446381476081565548185848237169870395131828731397)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 4.51482916590287954234936829724231512565732528859217337795452389161322923867318809206313688)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, -0.431292919341108177524462194102701868233551186625103849565527515201492276412231365776131952)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 0.0259189820815586225636729971503340447445001375909094681698918294680345547092233915092128323)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, -0.000904788882557558697594884691337532557729219389814315972435534723829065673966567231504429712)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 0.162793589759218213439218473348810982422449144393340433592232065020562974405674317564164312e-4)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, -0.125142926178202562426432039899709511761368233479483128438847484617555752948755923647214487e-6)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 0.299418680048132583204152682950097239197934281178261879500770485862852229898797687301941982e-9)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, -0.122364035267809278675627784883078206654408225276233049012165202996967011873995261617995421e-12)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 0.21465364366598631597052073538883430194257709353929022544344097235100199405814005393447785e-17)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, -0.641064035802907518396608051803921688237330857546406669209280666066685733941549058513986818e-23)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 0.249388374622173329690271566855185869111237201309011956145463506483151054813346819490278951e-23)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, -0.505752900177513489906064295001851463338022055787536494321532352380960774349054239257683149e-24)),
         static_cast<T>(BOOST_MATH_BIG_CONSTANT(T, 113, 0.410605371184590959139968810080063542546949719163227555918846829816144878123034347778284006e-25)),
      };
      T result = 0;
      T z = dz + 2;
      for(unsigned k = 1; k <= sizeof(d)/sizeof(d[0]); ++k)
      {
         result += (-d[k-1]*dz)/(z + k*z + k*k - 1);
      }
      return result;
   }

   static double g(){ return 20.3209821879863739013671875; }
};


//
// placeholder for no lanczos info available:
//
struct undefined_lanczos : public mpl::int_<INT_MAX - 1> { };

#if 0
#ifndef BOOST_NO_LIMITS_COMPILE_TIME_CONSTANTS
#define BOOST_MATH_FLT_DIGITS ::std::numeric_limits<float>::digits
#define BOOST_MATH_DBL_DIGITS ::std::numeric_limits<double>::digits
#define BOOST_MATH_LDBL_DIGITS ::std::numeric_limits<long double>::digits
#else
#define BOOST_MATH_FLT_DIGITS FLT_MANT_DIG
#define BOOST_MATH_DBL_DIGITS DBL_MANT_DIG
#define BOOST_MATH_LDBL_DIGITS LDBL_MANT_DIG
#endif
#endif

typedef mpl::list<
   lanczos6m24, 
/*   lanczos6, */
   lanczos13m53, 
/*   lanczos13, */
   lanczos17m64, 
   lanczos24m113, 
   lanczos22, 
   undefined_lanczos> lanczos_list;

template <class Real, class Policy>
struct lanczos
{
   typedef typename mpl::if_<
      typename mpl::less_equal<
         typename policies::precision<Real, Policy>::type,
         mpl::int_<0>
      >::type,
      mpl::int_<INT_MAX - 2>,
      typename policies::precision<Real, Policy>::type
   >::type target_precision;

   typedef typename mpl::deref<typename mpl::find_if<
      lanczos_list, 
      mpl::less_equal<target_precision, mpl::_1> >::type>::type type;
};

} // namespace lanczos
} // namespace math
} // namespace boost

#if !defined(_CRAYC) && !defined(__CUDACC__) && (!defined(__GNUC__) || (__GNUC__ > 3) || ((__GNUC__ == 3) && (__GNUC_MINOR__ > 3)))
#if (defined(_M_IX86_FP) && (_M_IX86_FP >= 2)) || defined(__SSE2__) || defined(_M_AMD64) || defined(_M_X64)
#include <boost/math/special_functions/detail/lanczos_sse2.hpp>
#endif
#endif

#endif // BOOST_MATH_SPECIAL_FUNCTIONS_LANCZOS




