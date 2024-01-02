# Sendbird in a Shared Worker Example

Service runs a very simple version of Sendbird Core SDK v4 in a Shared worker. This service does not work with Sendbird's UIKit.

- Provides comprehensive messaging example between tabs the shared worker and back in the context of Sendbird connectivity.
- Maintains a single connection to Sendbird in the SharedWorker regardless of tabs opened.
- Makes certain to disconnect when all tabs are closed.
- Handles changes in tab visibility including setting background state when no target tabs are visible.
- Handles rapid tab switching by not disconnecting during tab switch over.
- Handles duplicate tab events by not disconnecting during tab creation.
- Applies Sendbird’s own Connection Handler which also messages to all target tabs changes in the Sendbird connection, both during tab visibility changes and independently of tab visibility.
- Provides videos outlining the concepts.


## Getting Started

Add modules

```bash
npm install
```

Build web page using Parcel (hot reload)

```bash
npm run build
```

Build SharedWorker using Rollup (No hot reload)

```bash
npm run build-worker
```


### Prerequisites

Node.js v18 + 

### Walk through video

Description of service and how to use it
https://youtu.be/mKaI8Ok2AuI

code walkthrough
https://youtu.be/9fK_XX4OQQg

