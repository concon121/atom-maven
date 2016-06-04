#!/bin/bash

if [ $COVERAGE == true ]
then
    npm run coverage
    codeclimate-test-reporter < coverage/lcov.info
else
    curl -s https://raw.githubusercontent.com/atom/ci/master/build-package.sh | sh
    npm run quality
fi
