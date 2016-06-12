#!/bin/bash

npm install

if [ $COVERAGE == true ]
then
    npm run coverage
    codeclimate-test-reporter < coverage/lcov.info
    codacy-coverage < coverage/lcov.info
else
    npm test
    npm run quality
fi
