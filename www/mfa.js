    /*
     *
     * Licensed to the Apache Software Foundation (ASF) under one
     * or more contributor license agreements.  See the NOTICE file
     * distributed with this work for additional information
     * regarding copyright ownership.  The ASF licenses this file
     * to you under the Apache License, Version 2.0 (the
     * "License"); you may not use this file except in compliance
     * with the License.  You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing,
     * software distributed under the License is distributed on an
     * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
     * KIND, either express or implied.  See the License for the
     * specific language governing permissions and limitations
     * under the License.
     *
     */

    var exec = require('cordova/exec');
    var channel = require('cordova/channel');


    var MFA = {
        subscribe: function () {
            let url = "https://meydailysap.meyerwerft.de/logincheck";
            //let options = "location=no,toolbar=no,clearcache=yes,clearsessioncache=yes";
            let options = "location=no,toolbar=no,clearcache=no,clearsessioncache=no";
            
            setTimeout(()=>{
                let ref = cordova.InAppBrowser.open(url, '_blank', options);
                ref.addEventListener('exit', MFA.exitHandler.bind(this, ref));
                ref.addEventListener('loadstop', MFA.loadStopHandler.bind(this, ref));
                // ref.addEventListener('loaderror', MFA.loadErrorHandler.bind(this, ref)); // comment this line if using iOS + self-signed http certificate

            }, 2000)
        },
        afterClear: function () {
            let url = "https://meydailysap.meyerwerft.de/logincheck";
            //let options = "location=no,toolbar=no,clearcache=yes,clearsessioncache=yes";
            let options = "location=no,toolbar=no,clearcache=no,clearsessioncache=no,hidden=yes";
            
            let ref = cordova.InAppBrowser.open(url, '_blank', options);
            ref.addEventListener('exit', MFA.exitHandler.bind(this, ref));
            ref.addEventListener('loadstop', MFA.loadStopHandler.bind(this, ref));
            // ref.addEventListener('loaderror', MFA.loadErrorHandler.bind(this, ref)); // comment this line if using iOS + self-signed http certificate

        },
        onOnline: function () {
            let url = "https://meydailysap.meyerwerft.de/logincheck";
            let options = "location=no,toolbar=no,clearcache=no,clearsessioncache=no";

            let ref = cordova.InAppBrowser.open(url, '_blank', options);
            ref.addEventListener('exit', MFA.exitHandler.bind(this, ref));
            ref.addEventListener('loadstop', MFA.loadStopHandler.bind(this, ref));
            // ref.addEventListener('loaderror', MFA.loadErrorHandler.bind(this, ref)); // comment this line if using iOS + self-signed http certificate 
       },
        loadStopHandler: function (ref) {
            // Search for Ping
            ref.executeScript({
                    code: "document.title === 'Logon Success Message';"
                },
                function (values) {
                    var error = true;
                    var errorScript = '';
                    var aPing = values[0];

                    // Ping found
                    if (aPing) {
                        found = true;
                        ref.close();
                        console.log("Ping found");
                        sap.ui.core.BusyIndicator.hide();
                        ref.removeEventListener('loadstop', MFA.loadStopHandler);

                        if (typeof successCallback == 'function') {
                            successCallback(error);
                            AppCache.enablePasscode = origEnablePasscode; // restore the value
                        }

                    }

                    if (!error) { // if error found do not submit credentials again

                        // Autocomplete
                        ref.executeScript({
                            code: formScript
                        }, function (values) {
                            console.log("Submitted credentials " + repetitions);
                        });
                    }


                    // Search for Errors
                    if (errorScript != '') {
                        setTimeout(function () {

                            ref.executeScript({
                                    code: errorScript
                                },
                                function (values) {
                                    var errorText = values[0];

                                    if (errorText !== '' && errorText != null) {
                                        error = true;
                                        sap.ui.core.BusyIndicator.hide();
                                        console.log("Error found");

                                        if (AppCache.BDCshowProcess === 'N') {
                                            ref.removeEventListener('loadstop', MFA.loadStopHandler);
                                            ref.removeEventListener('loaderror', MFA.loadErrorHandler);
                                            ref.removeEventListener('exit', MFA.exitHandler);
                                            ref.close();
                                        } else {
                                            AppCache.enablePasscode = false; // do not store Auth if user corrects in window
                                            ref.show();
                                        }

                                        if (typeof errorCallback == 'function') {
                                            errorCallback(errorText);
                                        }

                                    }
                                });

                        }, 1000);
                    }

                    //repetitions++;

                });

        },

        exitHandler: function (ref) {
            error = true;
            sap.ui.core.BusyIndicator.hide();

            console.log("Exit");
            ref.removeEventListener('loadstop', MFA.loadStopHandler);
            ref.removeEventListener('loaderror', MFA.loadErrorHandler);
            ref.removeEventListener('exit', MFA.exitHandler);
            ref.close();
        },

        loadErrorHandler: function (params, ref) {
            error = true;
            sap.ui.core.BusyIndicator.hide();

            console.log("Load Error: " + params.message);
            ref.removeEventListener('loadstop', MFA.loadStopHandler);
            ref.removeEventListener('loaderror', MFA.loadErrorHandler);
            ref.removeEventListener('exit', MFA.exitHandler);
            ref.close();

            if (typeof errorCallback == 'function') {
                errorCallback(params.message);
            }
        }
    }


channel.onCordovaReady.subscribe(MFA.subscribe);

    module.exports = MFA;
