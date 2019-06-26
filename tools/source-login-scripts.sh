#!/usr/bin/env bash

if [ -f /etc/profile ]; then
   source /etc/profile > /dev/null
fi

if [ -f ~/.bash_profile ]; then
   source ~/.bash_profile > /dev/null
elif [ -f ~/.bash_login ]; then
   source ~/.bash_login > /dev/null
elif [ -f ~/.profile ]; then
   source ~/.profile > /dev/null
fi
