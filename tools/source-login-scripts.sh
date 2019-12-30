#!/usr/bin/env bash

if [ -f /etc/profile ]; then
   source /etc/profile
fi

if [ -f ~/.bash_profile ]; then
   source ~/.bash_profile
elif [ -f ~/.bash_login ]; then
   source ~/.bash_login
elif [ -f ~/.profile ]; then
   source ~/.profile
fi

if [ -e ~/.nix-profile/etc/profile.d/nix.sh ]; then . ~/.nix-profile/etc/profile.d/nix.sh; fi
