

//This is example of a function called from a different file
import { myFunction } from './example.js';
//Sendbird SDK code is cut and pasted from github
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
        let tabDetails = {type: event.data.type, tab_id: event.data.tabId};
        let replyMessage = { ...tabDetails    };
        try {
            replyMessage.sendbird  = evaluateSendbirdInitialization();
            switch (event.data.type) {
                case "new_tab_opened":
                    tabVisibility[event.data.tabId] = true;
                    const connectionEvaluationResult =  await evaluateConnectionToSendbird()
                    replyMessage.connection =  { status: sb.connectionState, message: connectionEvaluationResult }
                    break;
                case "tab_closed":
                    removeClosedTab(port);
                    replyMessage.connection =  { status: sb.connectionState, message: 'AFTER TAB CLOSED' };
                    break;
                case "tab_hidden":
                    tabVisibility[event.data.tabId] = false;
                    await handleTabVisibilityChange(false);
                    replyMessage.connection = { status: sb.connectionState, message: 'AFTER TAB VISIBILITY CHANGE' };
                    break;
                case "tab_visible":
                    tabVisibility[event.data.tabId] = true;
                    await handleTabVisibilityChange(true);
                    replyMessage.connection = { status: sb.connectionState, message: 'AFTER TAB VISIBILITY CHANGE' };
                    break;
                default:
                    console.log("SW: Fallback", event.data);
                    return;
            }
            replyMessage.tabCount = connectedTabs.length
            broadcastMessage(replyMessage);
        } catch (error) {
            handleErrorMessage(error, event.data.type);
        }
    };
}

async function handleTabVisibilityChange(isVisible) {
    await new Promise(r => setTimeout(r, 1000));
    if (!isVisible && !countVisibleTabs()) {
        sb.setBackgroundState();
    } else {
        sb.setForegroundState();
    }
}

function countVisibleTabs() {
    return Object.keys(tabVisibility).filter(tabId => tabVisibility[tabId]).length;
}

function broadcastMessage(message) {
    connectedTabs.forEach(port => port.postMessage(message));
}

function removeClosedTab(port) {
    if (connectedTabs.length === 1) sb.disconnect();
    const i = connectedTabs.indexOf(port);
    if (i > -1) connectedTabs.splice(i, 1);
}

async function evaluateConnectionToSendbird() {
    if (sb.connectionState !== 'OPEN' && !sb.currentUser) {
        await sb.connect(userId, userToken);
        return 'CONNECTED JUST NOW';
    }
    return 'ALREADY';
}
//Initialization
function evaluateSendbirdInitialization() {
    if (!sb) {
        sb = SendbirdChat.init({
            appId,
            modules: [new GroupChannelModule()],
            localCacheEnabled: true,
            appStateToggleEnabled: false
        });
        sb.addConnectionHandler('connectionHandler', connectionHandler);
        return { message: "NEW_INIT" };
    }
    return { message: "ALREADY_INITIALIZED." };
}

function handleErrorMessage(error, type) {
    const message = {
        error: true,
        message: error.message || "Unknown Error",
        is_connected_to_sendbird: false
    };
    broadcastMessage({ type: `${type}_error`, message });
}


const handlerActions = {
    onConnected: 'CONNECTED',
    onDisconnected: 'DISCONNECTED',
    onReconnectStarted: 'RECONNECT STARTED',
    onReconnectSucceeded: 'RECONNECT SUCCEEDED',
    onReconnectFailed: 'RECONNECT FAILED'
};

const connectionHandler = new ConnectionHandler(
    Object.fromEntries(
        Object.entries(handlerActions).map(([event, message]) => [
            event, () => {
                broadcastMessage({ type: "connection_handler", message: { error: false, status: sb.connectionState, message } });
            }
        ])
    )
);







