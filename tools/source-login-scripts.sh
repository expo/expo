#!/usr/bin/env bash

if [ -f /etc/profile ]; then
   # Define PS1 so that /etc/bashrc on macOS runs
   if [ -z "$PS1" ]; then
      PS1="$ "
   fi
   source /etc/profile > /dev/null
fi

if [ -f ~/.bash_profile ]; then
   source ~/.bash_profile > /dev/null
elif [ -f ~/.bash_login ]; then
   source ~/.bash_login > /dev/null
elif [ -f ~/.profile ]; then
   source ~/.profile > /dev/null
fi
