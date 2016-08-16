#!/bin/bash

if [ -f /etc/profile ]; then
   source /etc/profile > /dev/null
fi

if [ -f ~/.bash_profile ]; then
   source ~/.bash_profile > /dev/null
fi

if [ -f ~/.bash_login ]; then
   source ~/.bash_login > /dev/null
fi

if [ -f ~/.profile ]; then
   source ~/.profile > /dev/null
fi
