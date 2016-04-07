(function WebxlooCrmMailReader() {
    var requestTimeout = 1000 * 10;  // 10 seconds
    var crmDomain      = "http://crm.webxloo.com";
    var crmEmailPath   = "module=Emails";
    var crmAnyPath     = "*";

    //<editor-fold desc="Helper">
    function getCrmDomain() {
        return crmDomain;
    }

    function getCrmEmailPath() {
        return crmEmailPath;
    }

    function getCrmTabFilterEmail() {
        return '*://' + getCrmDomain().replace(/^https?\:\/\//, '') + '/*' + getCrmEmailPath() + '*';
    }

    function getCrmTabFilterAny() {
        return '*://' + getCrmDomain().replace(/^https?\:\/\//, '') + '/*';
    }

    function getCrmEmailAdditionalParams(sugarAccountId) {
        return ""
            .concat('ieId=', sugarAccountId, '&')
            .concat('to_pdf=', 'true', '&')
            .concat('module=', 'Emails', '&')
            .concat('action=', 'EmailUIAjax', '&')
            .concat('emailUIAction=', 'getMessageList', '&')
            .concat('mbox=', 'INBOX', '&')
            .concat('forceRefresh=', false)
            ;
    }

    function getCrmRefreshCacheAdditionalParams() {
        return ""
            .concat('sugar_body_only=', true, '&')
            .concat('to_pdf=', true, '&')
            .concat('module=', 'Emails', '&')
            .concat('action=', 'EmailUIAjax', '&')
            .concat('emailUIAction=', 'checkEmail', '&')
            .concat('all=', true)
            ;
    }

    function getCrmMailUrl() {
        return getCrmDomain() + '/?' + getCrmEmailPath();
    }

    //</editor-fold>

    //<editor-fold desc="ExtensionIcon">
    function ExtensionIcon() {
        this.isLoading = false;
    }

    ExtensionIcon.prototype.setText = function (text) {
        chrome.browserAction.setBadgeBackgroundColor({color: [208, 0, 24, 255]});
        chrome.browserAction.setBadgeText({
            text: text ? text : ""
        });
    };

    ExtensionIcon.prototype.setState = function (state) {
        if (state) {
            switch (state.toLowerCase()) {
                case 'loading':
                    this.setLoading(true);
                    break;
                case 'active':
                    this.setIcon('webxloocrmmailreader_logged_in.png');
                    break;
                case 'inactive':
                    this.setIcon('webxloocrmmailreader_not_logged_in.png');
                    break;
            }
        }
    };

    ExtensionIcon.prototype.setLoading = function (state) {
        this.isLoading   = state;
        var canvasWidth  = 128;
        var canvasHeight = 128;
        var lines        = 16;
        var start        = new Date();

        var canvas    = document.createElement('canvas');
        canvas.width  = canvasWidth;
        canvas.height = canvasHeight;
        var context   = canvas.getContext('2d');

        var draw = function () {
            var rotation = parseInt(((new Date() - start) / 1000) * lines) / lines;
            context.save();
            context.clearRect(0, 0, canvasWidth, canvasHeight);
            context.translate(canvasWidth / 2, canvasHeight / 2);
            context.rotate(Math.PI * 2 * rotation);
            for (var i = 0; i < lines; i++) {
                context.beginPath();
                context.rotate(Math.PI * 2 / lines);
                context.moveTo(canvasWidth / 10, 0);
                context.lineTo(canvasWidth / 2, 0);
                context.lineWidth   = canvasWidth / 30;
                context.strokeStyle = "rgba(0,0,0," + i / lines + ")";
                context.stroke();
            }

            chrome.browserAction.setIcon({
                imageData: context.getImageData(0, 0, canvasWidth, canvasHeight)
            });

            context.restore();
            return false;
        };

        var that    = this;
        var delay   = 1000 / 30;
        var timerId = window.setTimeout(
            function tick() {
                window.clearTimeout(timerId);
                if (that.isLoading) {
                    draw();
                    timerId = window.setTimeout(tick, delay);
                }
                return false;
            },
            delay
        );
    };

    ExtensionIcon.prototype.setIcon = function (icon) {
        this.isLoading = false;
        chrome.browserAction.setIcon({path: icon});
    };
    //</editor-fold>

    //<editor-fold desc="ExtensionNotification">
    function ExtensionNotification() {
        this.notificationId = 'webxloocrmmailreader_notification_id';
        this.defaultIcon    = 'main_icon.png';
    }

    ExtensionNotification.prototype.formatItems = function (list) {
        var res = "";
        /*if (list && list.length > 0) {
         list.forEach(function(currentValue, index) {
         if (currentValue.seen == '0' && res,length == 0) {
         res =  "".concat(
         (currentValue.from ? "From: " + currentValue.from : ""), "\n",
         (currentValue.to_addrs ? "To: " + currentValue.to_addrs : ""), "\n",
         (currentValue.subject ? "Subject: " + currentValue.subject : ""), "\n"
         );

         }
         });
         }*/
        return res;
    };

    ExtensionNotification.prototype.show = function (title, message, list, callback) {
        chrome.notifications.create(
            this.notificationId,
            {
                type     : 'basic',
                iconUrl  : this.defaultIcon,
                title    : title,
                eventTime: Date.now(),
                message  : message + "\n" + this.formatItems(list)
            }
        );

        chrome.notifications.onClicked.addListener(function (notificationId) {
            chrome.notifications.clear(notificationId);
            if (callback) {
                callback();
            }
        });
    };

    var showNotificationPeriodicallyTimerId = null;
    function showNotificationPeriodically(that, title, message, list, delay, callback) {
        console.log('Notification showed');

        window.clearTimeout(showNotificationPeriodicallyTimerId);
        chrome.notifications.clear(that.notificationId);

        chrome.notifications.create(
            that.notificationId,
            {
                type     : 'basic',
                iconUrl  : that.defaultIcon,
                title    : title,
                eventTime: Date.now(),
                message  : message + "\n" + that.formatItems(list)
            }
        );

        chrome.notifications.onClicked.addListener(function (notificationId) {
            window.clearTimeout(showNotificationPeriodicallyTimerId);
            chrome.notifications.clear(notificationId);
            if (callback) {
                callback();
            }
        });

        showNotificationPeriodicallyTimerId = window.setTimeout(showNotificationPeriodically, delay, that, title, message, list, delay, callback);
        return false;
    }

    ExtensionNotification.prototype.showPeriodically = function (title, message, list, delay, callback) {
        var that    = this;
        showNotificationPeriodically(that, title, message, list, delay, callback);
    };
    //</editor-fold>

    //<editor-fold desc="ExtensionTabs">
    function ExtensionTabs() {
    }

    ExtensionTabs.prototype.find = function (params) {
        if (!params) {
            params = {};
        }

        if (params.onBefore) {
            params.onBefore();
        }

        var found = false;
        chrome.tabs.query({url: params.url}, function (tabs) {
            if (tabs && tabs.length > 0) {
                found = true;
            }
            if (found) {
                if (params.onSuccess) {
                    params.onSuccess(tabs[0]);
                }
            } else {
                if (params.onError) {
                    params.onError();
                }
            }
            if (params.onFinish) {
                params.onFinish();
            }

            return false;
        });
    };

    ExtensionTabs.prototype.get = function (params) {
        if (!params) {
            params = {};
        }

        if (params.onBefore) {
            params.onBefore();
        }

        var found = false;
        chrome.tabs.get(params.tabId, function (tab) {
            if (tab) {
                found = true;
            }
            if (found) {
                if (params.onSuccess) {
                    params.onSuccess(tab);
                }
            } else {
                if (params.onError) {
                    params.onError();
                }
            }
            if (params.onFinish) {
                params.onFinish();
            }

            return false;
        });
    };

    ExtensionTabs.prototype.new = function (params) {
        if (!params) {
            params = {};
        }

        if (params.onBefore) {
            params.onBefore();
        }

        var found = false;
        chrome.tabs.create({url: params.url}, function (tab) {
            if (tab) {
                found = true;
            }
            if (found) {
                if (params.onSuccess) {
                    params.onSuccess(tab);
                }
            } else {
                if (params.onError) {
                    params.onError();
                }
            }
            if (params.onFinish) {
                params.onFinish();
            }

            return false;
        });
    };

    ExtensionTabs.prototype.activate = function (params) {
        if (!params) {
            params = {};
        }

        if (params.onBefore) {
            params.onBefore();
        }

        var found = false;

        this.get({
            tabId    : params.tabId,
            onSuccess: function (tab) {
                if (params && params.hasOwnProperty('focused')) {
                    chrome.windows.update(
                        tab.windowId,
                        {
                            focused: params.focused
                        }
                    );
                }
                chrome.tabs.update(
                    tab.id,
                    {
                        highlighted: (params.highlighted ? params.highlighted : true),
                        active     : (params.active ? params.active : true)
                    }
                );

                if (params.onSuccess) {
                    params.onSuccess(tab);
                }

                if (params.onFinish) {
                    params.onFinish();
                }
            }
        });
    };
    //</editor-fold>

    //<editor-fold desc="ExtensionOptions">
    function ExtensionOptions() {
        this.defaults = {
            reloadCacheTimeout   : 120,
            checkNewMailDelay    : 60,
            showNotificationDelay: 120
        };

        this.load();
    }

    ExtensionOptions.prototype.get = function (paramName) {
        var res = -1;
        if (this.hasOwnProperty(paramName)) {
            res = this[paramName];
        } else if (this.defaults.hasOwnProperty(paramName)) {
            res = this.defaults[paramName];
        }

        return res * 1000;
    };

    ExtensionOptions.prototype.load = function (params) {
        if (!params) {
            params = {};
        }

        if (params.onBefore) {
            params.onBefore();
        }

        var that = this;
        chrome.storage.sync.get({
            checkNewMailDelay    : this.defaults.checkNewMailDelay,
            showNotificationDelay: this.defaults.showNotificationDelay,
            refreshCacheDelay    : this.defaults.reloadCacheTimeout
        }, function (items) {
            that.reloadCacheTimeout    = (items.refreshCacheDelay ? items.refreshCacheDelay : that.defaults.reloadCacheTimeout);
            that.checkNewMailDelay     = (items.checkNewMailDelay ? items.checkNewMailDelay : that.defaults.checkNewMailDelay);
            that.showNotificationDelay = (items.showNotificationDelay ? items.showNotificationDelay : that.defaults.showNotificationDelay);

            if (params.onSuccess) {
                params.onSuccess(items);
            }

            if (params.onFinish) {
                params.onFinish();
            }
        });

    };

    ExtensionOptions.prototype.addListener = function (params) {
        if (!params) {
            params = {};
        }

        var that = this;
        chrome.storage.onChanged.addListener(function (changes, namespace) {
            that.reloadCacheTimeout = (
                changes['refreshCacheDelay'] && changes['refreshCacheDelay'].newValue
                    ? changes['refreshCacheDelay'].newValue
                    : that.defaults.reloadCacheTimeout
            );

            that.checkNewMailDelay = (
                changes['checkNewMailDelay'] && changes['checkNewMailDelay'].newValue
                    ? changes['checkNewMailDelay'].newValue
                    : that.defaults.checkNewMailDelay
            );

            that.showNotificationDelay = (
                changes['showNotificationDelay'] && changes['showNotificationDelay'].newValue
                    ? changes['showNotificationDelay'].newValue
                    : that.defaults.showNotificationDelay
            );

            if (params.onSuccess) {
                params.onSuccess();
            }
        });
    };
    //</editor-fold>

    //<editor-fold desc="ExtensionCore">
    function ExtensionCore() {
        this.extensionTabs         = new ExtensionTabs();
        this.extensionIcon         = new ExtensionIcon();
        this.extensionNotification = new ExtensionNotification();
        this.extensionOptions      = new ExtensionOptions();

        this.tabFilter = {
            emailUrl: getCrmTabFilterEmail(),
            anyUrl  : getCrmTabFilterAny()
        };

    }

    ExtensionCore.prototype.init = function () {

    };

    ExtensionCore.prototype.getAccountId = function (params) {
        if (params.onBefore) {
            params.onBefore();
        }
        this.extensionTabs.find({
            url      : this.tabFilter.emailUrl,
            onSuccess: function (tab) {
                chrome.runtime.onMessage.addListener(function listener(request) {
                    var found = false;
                    var res   = "";
                    if (request && request.from && request.from == "CRM") {
                        res = request.text;
                        if (request.type && request.type == "SUCCESS") {
                            if (res.length > 0) {
                                res = res.split('=');
                                if (res && res.length > 1) {
                                    res = res[1].trim();
                                    res = (new RegExp(/^['"](.*)?['"]/, 'ig')).exec(res);
                                    if (res && res.length > 1) {
                                        found = true;
                                    }
                                }
                            }
                        }

                        if (found) {
                            if (params.onSuccess) {
                                params.onSuccess(res[1]);
                            }
                        } else {
                            if (params.onError) {
                                params.onError(res);
                            }
                        }

                        if (params.onFinish) {
                            params.onFinish();
                        }
                    }
                    chrome.runtime.onMessage.removeListener(listener);
                });
                chrome.tabs.executeScript(
                    tab.id,
                    {
                        file: 'page.js'
                    }
                );
            },
            onError  : (params.onError ? params.onError : null),
            onFinish : (params.onFinish ? params.onFinish : null),
            onBefore : (params.onBefore ? params.onBefore : null)
        });
    };

    ExtensionCore.prototype.sendRequestToCrm = function (params) {
        if (!params) {
            params = {};
        }
        if (params.onBefore) {
            params.onBefore();
        }

        var xhr          = new XMLHttpRequest();
        var abortTimerId = window.setTimeout(function () {
            xhr.abort();
        }, requestTimeout);

        var requestFailureCount = 0;

        function handleSuccess(response) {
            requestFailureCount = 0;
            window.clearTimeout(abortTimerId);
            if (params.onSuccess) {
                params.onSuccess(response);
            }
            if (params.onFinish) {
                params.onFinish();
            }
        }

        var invokedErrorCallback = false;

        function handleError() {
            ++requestFailureCount;
            window.clearTimeout(abortTimerId);
            if (params.onError && !invokedErrorCallback) {
                params.onError();

                if (params.onFinish) {
                    params.onFinish();
                }
            }
            invokedErrorCallback = true;
        }

        try {
            xhr.onreadystatechange = function () {
                if (xhr.readyState != 4) {
                    return;
                }

                if (xhr.response) {
                    try {
                        var res = JSON.parse(xhr.response);
                        handleSuccess(res);
                    } catch (err) {
                        handleError(err);
                    }
                }
            };

            xhr.onerror = function (error) {
                handleError();
            };

            xhr.open(
                (params.type ? params.type : "GET"),
                (params.url ? params.url : ""),
                (params.async ? params.async : true)
            );
            var data = undefined;
            if (params.type.toUpperCase() == "POST" && params && params.data) {
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
                data = params.data;
            }
            xhr.send(data);
        } catch (e) {
            console.error(chrome.i18n.getMessage("webxloocrmmailreader_exception", e));
            handleError();
        }
    };

    ExtensionCore.prototype.refreshCache = function (params) {
        // onBefore, onSuccess, onError, onFinish
        if (!params) {
            params = {};
        }
        if (params.onBefore) {
            params.onBefore();
        }

        var that = this;
        that.sendRequestToCrm({
            type     : 'POST',
            url      : getCrmDomain(),
            async    : true,
            data     : getCrmRefreshCacheAdditionalParams(),
            onSuccess: function (response) {
                if (params.onSuccess) {
                    params.onSuccess(response);
                }
            },
            onError  : (params.onError ? params.onError : null),
            onFinish : (params.onFinish ? params.onFinish : null)
        });
    };

    ExtensionCore.prototype.getUnreadEmailCount = function (params) {
        // onBefore, onSuccess, onError, onFinish
        if (!params) {
            params = {};
        }
        if (params.onBefore) {
            params.onBefore();
        }

        var that = this;
        this.getAccountId({
            onSuccess: function (ieId) {
                that.sendRequestToCrm({
                    type     : 'GET',
                    url      : getCrmMailUrl() + '&' + getCrmEmailAdditionalParams(ieId),
                    async    : true,
                    onSuccess: function (response) {
                        if (params.onSuccess) {
                            params.onSuccess(response.UnreadCount, response);
                        }
                    },
                    onError  : (params.onError ? params.onError : null),
                    onFinish : (params.onFinish ? params.onFinish : null)
                });
            },
            onError  : function () {
                if (params.onError) {
                    params.onError();
                }
                if (params.onFinish) {
                    params.onFinish();
                }
            }
        });
    };
    //</editor-fold>

    //<editor-fold desc="Main function">
    var extensionCore = new ExtensionCore();
    var worked        = false;
    var showed        = false;
    var showedError   = false;

    function worker(refreshCache) {
        /*console.log('Fired:', (refreshCache ? refreshCache : 'false'));*/
        /*if (worked) {
            return;
        }*/
        worked = true;
        if (!refreshCache) {
            extensionCore.extensionIcon.setState('loading');
            extensionCore.getUnreadEmailCount({
                onSuccess: function (newEmailsCount) {
                    extensionCore.extensionIcon.setState('active');
                    extensionCore.extensionIcon.setText(newEmailsCount > 0 ? newEmailsCount : "");

                    if (newEmailsCount > 0) {
                        if (showed) {
                            return;
                        }
                        showed = true;

                        extensionCore.extensionNotification.showPeriodically(
                            chrome.i18n.getMessage("webxloocrmmailreader_name"),
                            chrome.i18n.getMessage("webxloocrmmailreader_notification_text", newEmailsCount),
                            [],
                            extensionCore.extensionOptions.get('showNotificationDelay'),
                            function () {
                                showed = false;
                                extensionCore.extensionTabs.find({
                                    url      : extensionCore.tabFilter.emailUrl,
                                    onSuccess: function (tab) {
                                        extensionCore.extensionTabs.activate({
                                            tabId      : tab.id,
                                            focused    : true,
                                            active     : true,
                                            highlighted: true
                                        });
                                    }
                                });
                            }
                        );
                    }
                    worked = false;
                },
                onFinish : function () {
                    worked = false;
                },
                onError  : function () {
                    extensionCore.extensionIcon.setState('inactive');
                    extensionCore.extensionIcon.setText();

                    extensionCore.extensionNotification.show(
                        chrome.i18n.getMessage("webxloocrmmailreader_name"),
                        chrome.i18n.getMessage("webxloocrmmailreader_notification_error"),
                        [],
                        /*extensionCore.extensionOptions.get('showNotificationDelay'),*/
                        function () {
                            extensionCore.extensionTabs.find({
                                url      : extensionCore.tabFilter.anyUrl,
                                onSuccess: function (tab) {
                                    extensionCore.extensionTabs.activate({
                                        tabId      : tab.id,
                                        focused    : true,
                                        active     : true,
                                        highlighted: true
                                    });
                                },
                                onError  : function () {
                                    extensionCore.extensionTabs.new({
                                        url: extensionCore.tabFilter.emailUrl
                                    });
                                }
                            });
                        }
                    );

                    worked = false;
                }
            });
        } else {
            extensionCore.refreshCache({
                onSuccess: function (newEmailsCount) {
                    var sss = 1;
                }
            });
        }
    }

    //</editor-fold>

    //<editor-fold desc="Events">
    chrome.runtime.onInstalled.addListener(function () {
        worker();
    });
    chrome.browserAction.onClicked.addListener(function () {
        worker();
    });

    extensionCore.extensionOptions.addListener(/*{
     onSuccess: function () {
     // ToDo: Refresh timers after receive new parameters
     startWorkers(extensionCore);
     }
     }*/);

    extensionCore.extensionOptions.load({
        onSuccess: function () {
            startWorkers(extensionCore);
        }
    });

    chrome.alarms.create('watchdog', {periodInMinutes: 1});
    chrome.alarms.onAlarm.addListener(function (alarm) {
        if (alarm && alarm.name == 'watchdog') {
            /*worker();*/
        }
    });

    var timerId = null;

    function checkNewMail() {
        window.clearTimeout(timerId);
        console.log('checkNewMailDelay', extensionCore.extensionOptions.get('checkNewMailDelay'));
        worker();
        timerId = window.setTimeout(checkNewMail, extensionCore.extensionOptions.get('checkNewMailDelay'));
    }

    var forceRefreshTimerId = null;

    function reloadCache() {
        window.clearTimeout(forceRefreshTimerId);
        console.log('reloadCacheTimeout', extensionCore.extensionOptions.get('reloadCacheTimeout'));
        worker(true);
        forceRefreshTimerId = window.setTimeout(reloadCache, extensionCore.extensionOptions.get('reloadCacheTimeout'));
    }

    function startWorkers(extensionCore) {
        /*window.clearTimeout(timerId);*/
        window.clearTimeout(timerId);
        checkNewMail();

        window.clearTimeout(forceRefreshTimerId);
        reloadCache();
    }

    startWorkers(extensionCore);
    //</editor-fold>

})();
