var scriptList = document.getElementsByTagName("script");
if (!scriptList || scriptList.length == 0) {
    chrome.runtime.sendMessage("loopeeicbkgacifdhhfncokeibepcpce",
        {
            from: "CRM",
            type: "ERROR",
            text: "Can not find script"
        }
    );
} else {
    var foundScript = false;
    for (var i = 0; i < scriptList.length; i++) {
        if (!scriptList[i].src) {
            var text = scriptList[i].innerHTML;
            if (text.indexOf("SUGAR.default_inbound_accnt_id") > -1) {
                text = text.match(/.*SUGAR\.default_inbound_accnt_id.*/ig)[0];
                chrome.runtime.sendMessage("loopeeicbkgacifdhhfncokeibepcpce",
                    {
                        from: "CRM",
                        type: "SUCCESS",
                        text: text
                    }
                );
                foundScript = true;
                break;
            }
        }
    }
    if (!foundScript) {
        chrome.runtime.sendMessage("loopeeicbkgacifdhhfncokeibepcpce",
            {
                from: "CRM",
                type: "ERROR",
                text: "Can not find script with SUGAR.default_inbound_accnt_id"
            }
        );
    }
}
