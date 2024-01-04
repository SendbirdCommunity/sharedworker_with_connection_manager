

//This is example of a function called from a different file
import { myFunction } from './example.js';
//Sendbird code is cut and pasted from github
//https://raw.githubusercontent.com/sendbird/sendbird-chat-sdk-javascript/main/sendbird.min.js
//In the copied code add "export" in front of  var Sendbird
import {Sendbird} from "./sendbirdchat.min.js";
//main thread port from the browser. Gets set in onconnect
let { SendbirdChat, GroupChannelModule, GroupChannelHandler, ConnectionHandler } = Sendbird

const appId = "73B15A69-B61D-4159-99E0-B2BE8C6CEBA6";
const userId = "user1";
const userToken = "";
let sb = null;

//This can be seen in the worker console.
//Worker console is visible here "chrome://inspect/#workers"
let port = null;
const connectedTabs = [];
const tabVisibility = {};
let connections = 0;

//onconnect Comes with the ShardWorker API
onconnect = function(e) {
    const port = e.ports[0];
    connections++;
    connectedTabs.push(port);

    port.onmessage = async function (event) {
        let message = {type: event.data.type, tab_id: event.data.tabId};
        try {
            switch (event.data.type) {
                case "new_tab_opened":
                    tabVisibility[event.data.tabId] = true;
                    message = {...message, ...initSendbird()};
                    message.connection = await evaluateConnectionToSendbird();
                    break;
                case "tab_closed":
                    removeClosedTab(port);
                    message.remainingTabs = connectedTabs.length;
                    message.connection = {error: false, status: sb.connectionState, message: 'AFTER TAB CLOSED'};
                    break;
                case "tab_hidden":
                    tabVisibility[event.data.tabId] = false;
                    message = await handleTabVisibilityChange(message, false);
                    break;
                case "tab_visible":
                    tabVisibility[event.data.tabId] = true;
                    sb.setForegroundState();
                    message = await handleTabVisibilityChange(message, true);
                    break;
                default:
                    console.log("SW: Fallback", event.data);
                    return;
            }
            broadcastMessage(message);
        } catch (error) {
            handleErrorMessage(error, event.data.type);
        }
    };
}

async function handleTabVisibilityChange(message, isVisible) {
    const visibleTabCount = countVisibleTabs();
    if (!isVisible && visibleTabCount === 0) {
        await checkAndHandleAllTabsHidden();
    }
    message.remainingTabs = connectedTabs.length;
    message.visibleTabCount = visibleTabCount;
    message.connection = { error: false, status: sb.connectionState, message: 'AFTER TAB VISIBILITY CHANGE' };
    return message;
}

function countVisibleTabs() {
    return Object.keys(tabVisibility).filter(tabId => tabVisibility[tabId]).length;
}

async function checkAndHandleAllTabsHidden() {
    // Wait a short while to see if a tab comes back into view handles switching tabs quickly.
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (countVisibleTabs() === 0) {
        console.log("No visible tabs. Disconnecting");
        sb.setBackgroundState();
    }
}


function broadcastMessage(message) {
    connectedTabs.forEach(port => {
        port.postMessage(message);
    });
}

function removeClosedTab(port) {
    connectedTabs.length === 1 && sb.disconnect();
    console.log("SENDBIRD CONNECTION STATE IS NOW: ", sb.connectionState);
    console.log(`${connectedTabs.length} connected tabs`);
    const index = connectedTabs.indexOf(port);
    if (index > -1) {
        connectedTabs.splice(index, 1);
    }
}

async function evaluateConnectionToSendbird() {
    console.log(sb.connectionState);
    if (sb.connectionState !== 'OPEN' && !sb.currentUser) {
        try {
            await sb.connect(userId, userToken);
            console.log(sb.connectionState)
            return { error: false, status: sb.connectionState, message: `JUST NOW` };
        } catch (error) {
            throw error;
        }
    }
    return { error: false, status: sb.connectionState, message: `ALREADY` };
}

function initSendbird() {
    if (!sb) {
        try {

            sb = SendbirdChat.init({
                appId,
                modules: [new GroupChannelModule()],
                localCacheEnabled: true,
                appStateToggleEnabled: false

            });
            sb.addConnectionHandler('connectionHandler', connectionHandler);
            return { error: false, message: "NEW_INIT" };
        } catch (error) {
            throw error;
        }
    }
    return { error: false, message: `ALREADY_INITIALIZED. ${connectedTabs.length} tabs open` };
}

function handleErrorMessage(error, type) {
    const message = {
        error: true,
        message: error.message || "Unknown Error",
        is_connected_to_sendbird: false
    };
    broadcastMessage({ type: `${type}_ack`, message });
}


const connectionHandler = new ConnectionHandler({
    onConnected: () => {
        console.log("Connected");
        broadcastMessage({ type: "connection_handler", message: { error: false, status: sb.connectionState, message: 'CONNECTED' } });
    },
    onDisconnected: () => {
        console.log("Disconnected");
        broadcastMessage({ type: "connection_handler", message: { error: false, status: sb.connectionState, message: 'DISCONNECTED' } });
    },
    onReconnectStarted: () => {
        console.log("Reconnect Started");
        broadcastMessage({ type: "connection_handler", message: { error: false, status: sb.connectionState, message: 'RECONNECT STARTED' } });
    },
    onReconnectSucceeded: () => {
        console.log("Reconnect Succeeded");
        broadcastMessage({ type: "connection_handler", message: { error: false, status: sb.connectionState, message: 'RECONNECT SUCCEEDED' } });
    },
    onReconnectFailed: () => {
        console.log("Reconnect Failed");
        broadcastMessage({ type: "connection_handler", message: { error: false, status: sb.connectionState, message: 'RECONNECT FAILED' } });
    }
});







