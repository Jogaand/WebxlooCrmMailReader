function save_options() {
    var checkNewMailDelay = document.getElementById('checkNewMailDelay').value;
    var showNotificationDelay = document.getElementById('showNotificationDelay').value;
    var refreshCacheDelay = document.getElementById('refreshCacheDelay').value;

    chrome.storage.sync.set({
        checkNewMailDelay: checkNewMailDelay,
        showNotificationDelay: showNotificationDelay,
        refreshCacheDelay: refreshCacheDelay
    });
}

function restore_options() {
    chrome.storage.sync.get({
        checkNewMailDelay: 60,
        showNotificationDelay: 1,
        refreshCacheDelay: 120
    }, function(items) {
        document.getElementById('checkNewMailDelay').value = items.checkNewMailDelay;
        document.getElementById('showNotificationDelay').value = items.showNotificationDelay;
        document.getElementById('refreshCacheDelay').value = items.refreshCacheDelay;
    });
}

function init() {
    restore_options();
    
    var btn = document.getElementById('save');
    btn.addEventListener('click', function(){
        save_options();
    });

    var elements = document.getElementsByTagName("*");
    Array.prototype.forEach.call(elements, function(el, i){
        var text = el.textContent;
        if (chrome.i18n.getMessage(text) != "" && el.childElementCount == 0) {
            el.textContent = chrome.i18n.getMessage(text);
        }
    });
}

document.addEventListener('DOMContentLoaded', init);