#!/bin/bash

cd verificationServer && node enrollAdmin.js && node registerUser.js && cd ..
cd server && node enrollAdmin.js && node registerUser.js