#!/usr/bin/perl -w
#
# Boost.Signals library

# Copyright Douglas Gregor 2001-2003. Use, modification and
# distribution is subject to the Boost Software License, Version
# 1.0. (See accompanying file LICENSE_1_0.txt or copy at
# http://www.boost.org/LICENSE_1_0.txt)

# For more information, see http://www.boost.org
use English;

if ($#ARGV < 0) {
  print "Usage: perl gen_signal_N <number of arguments>\n";
  exit;
}


$totalNumArgs = $ARGV[0];
for ($numArgs = 0; $numArgs <= $totalNumArgs; ++$numArgs) {
  open OUT, ">signal$numArgs.hpp";
  print OUT "// Boost.Signals library\n";
  print OUT "//\n";
  print OUT "// Copyright (C) 2001 Doug Gregor (gregod\@cs.rpi.edu)\n";
  print OUT "//\n";
  print OUT "// Permission to copy, use, sell and distribute this software is granted\n";
  print OUT "// provided this copyright notice appears in all copies.\n";
  print OUT "// Permission to modify the code and to distribute modified code is granted\n";
  print OUT "// provided this copyright notice appears in all copies, and a notice\n";
  print OUT "// that the code was modified is included with the copyright notice.\n";
  print OUT "//\n";
  print OUT "// This software is provided \"as is\" without express or implied warranty,\n";
  print OUT "// and with no claim as to its suitability for any purpose.\n";
  print OUT " \n";
  print OUT "// For more information, see http://www.boost.org\n";
  print OUT "\n";
  print OUT "#ifndef BOOST_SIGNALS_SIGNAL" . $numArgs . "_HEADER\n";
  print OUT "#define BOOST_SIGNALS_SIGNAL" , $numArgs . "_HEADER\n";
  print OUT "\n";
  print OUT "#define BOOST_SIGNALS_NUM_ARGS $numArgs\n";

  $templateParms = "";
  for ($i = 1; $i <= $numArgs; ++$i) {
    if ($i > 1) {
      $templateParms .= ", ";
    }
    $templateParms .= "typename T$i";
  }
  print OUT "#define BOOST_SIGNALS_TEMPLATE_PARMS $templateParms\n";

  $_ = $templateParms;
  s/typename //g;
  $templateArgs = $_;
  print OUT "#define BOOST_SIGNALS_TEMPLATE_ARGS $templateArgs\n";

  $parms = "";
  for ($i = 1; $i <= $numArgs; ++$i) {
    if ($i > 1) {
      $parms .= ", ";
    }
    $parms .= "T$i a$i";
  }
  print OUT "#define BOOST_SIGNALS_PARMS $parms\n";

  $args = "";
  for ($i = 1; $i <= $numArgs; ++$i) {
    if ($i > 1) {
      $args .= ", ";
    }
    $args .= "a$i";
  }
  print OUT "#define BOOST_SIGNALS_ARGS $args\n";

  $boundArgs = "";
  for ($i = 1; $i <= $numArgs; ++$i) {
    if ($i > 1) {
      $boundArgs .= ", ";
    }
    $boundArgs .= "args->a$i";
  }
  print OUT "#define BOOST_SIGNALS_BOUND_ARGS $boundArgs\n";

  $argsAsMembers = "";
  for ($i = 1; $i <= $numArgs; ++$i) {
    $argsAsMembers .= "T$i a$i;";
  }
  print OUT "#define BOOST_SIGNALS_ARGS_AS_MEMBERS $argsAsMembers\n";

  $copyParms = "";
  for ($i = 1; $i <= $numArgs; ++$i) {
    if ($i > 1) {
      $copyParms .= ", ";
    }
    $copyParms .= "T$i ia$i";
  }
  print OUT "#define BOOST_SIGNALS_COPY_PARMS $copyParms\n";

  $initArgs = "";
  if ($numArgs > 0) {
      $initArgs = ":";
  }
  for ($i = 1; $i <= $numArgs; ++$i) {
    if ($i > 1) {
      $initArgs .= ", ";
    }
    $initArgs .= "a$i(ia$i)";
  }
  print OUT "#define BOOST_SIGNALS_INIT_ARGS $initArgs\n";

  $argTypes = "";
  for ($i = 1; $i <= $numArgs; ++$i) {
    $argTypes .= "typedef T$i arg". ($i+1) . "_type; ";
  }

  print OUT "#define BOOST_SIGNALS_ARG_TYPES $argTypes\n";
  print OUT "\n";
  print OUT "#include <boost/signals/signal_template.hpp>\n";
  print OUT "\n";
  print OUT "#undef BOOST_SIGNALS_ARG_TYPES\n";
  print OUT "#undef BOOST_SIGNALS_INIT_ARGS\n";
  print OUT "#undef BOOST_SIGNALS_COPY_PARMS\n";
  print OUT "#undef BOOST_SIGNALS_ARGS_AS_MEMBERS\n";
  print OUT "#undef BOOST_SIGNALS_BOUND_ARGS\n";
  print OUT "#undef BOOST_SIGNALS_ARGS\n";
  print OUT "#undef BOOST_SIGNALS_PARMS\n";
  print OUT "#undef BOOST_SIGNALS_TEMPLATE_ARGS\n";
  print OUT "#undef BOOST_SIGNALS_TEMPLATE_PARMS\n";
  print OUT "#undef BOOST_SIGNALS_NUM_ARGS\n";
  print OUT "\n";
  print OUT "#endif // BOOST_SIGNALS_SIGNAL" . $numArgs . "_HEADER\n";
  close OUT;
}
