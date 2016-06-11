#!/bin/bash

if [ $COVERAGE == true ]
then
    npm install
    npm run coverage
    codeclimate-test-reporter < coverage/lcov.info
    codacy-coverage < coverage/lcov.info
else
    jasmine-focused spec
    npm run quality
fi
