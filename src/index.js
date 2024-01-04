const generateTabId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const displayTabId = (tabId) => {
    const tabIdElement = document.getElementById('tab-id');
    tabIdElement.innerText = tabId;
}

if (!!window.SharedWorker) {
    try {
        const scriptURL = new URL('../bundle.js', import.meta.url);
        scriptURL.search = '';
        const worker = new SharedWorker(scriptURL.toString(), 'sharedWorker');
        const tabId = generateTabId();
        displayTabId(tabId);

        worker.port.start();
        worker.port.postMessage({ type: "new_tab_opened", tabId });
        worker.port.onmessage = function (e) {
            handleWorkerMessages(e);
        };
        setupEventListeners(worker.port, tabId);
    } catch (error) {
        console.error("Shared Worker initialization error:", error);
    }
} else {
    console.warn('Your browser does not support Shared Workers.');
}

function handleWorkerMessages(e) {
    const messageType = e.data.type;
    switch (messageType) {
        case "new_tab_opened":
        case "tab_closed":
        case "tab_hidden":
        case "tab_visible":
            console.log("SharedWorker: MY CONNECTION MANAGER \n", JSON.stringify(e.data, null, 2));
            break;
        case "connection_handler":
            console.log("SharedWorker: SENDBIRD CONNECTION HANDLER \n", JSON.stringify(e.data, null, 2));
            //From here handle the different states of the connection. If the connection is CLOSED consider reconnecting.
            break;
        default:
            console.warn("FROM SW (Fallback):", e.data);
            break;
    }
}

function setupEventListeners(workerPort, tabId) {

    window.addEventListener('beforeunload', function() {
        workerPort.postMessage({ type: 'tab_closed', tabId });
    });

    window.addEventListener("visibilitychange", function() {

        const messageType = document.hidden ? 'tab_hidden' : 'tab_visible';
        console.log(`Tab is now ${document.hidden ? "hidden" : "visible"}`);
        workerPort.postMessage({ type: messageType, tabId });
    });
}
