# Hooks and Customization Guide

This document explains the new hooks and customization features added to y-webrtc.

## Overview

The provider and adapters now support lifecycle hooks and protected methods that can be overridden, making it easier to customize behavior and integrate with your application.

## WebrtcProvider Hooks

### Available Hooks

The `WebrtcProvider` accepts a `hooks` option that allows you to register callbacks for various lifecycle events:

```typescript
interface WebrtcProviderHooks {
  // Connection lifecycle
  onBeforeConnect?: () => void | Promise<void>
  onAfterConnect?: () => void | Promise<void>
  onBeforeDisconnect?: () => void | Promise<void>
  onAfterDisconnect?: () => void | Promise<void>

  // Status events
  onStatusChange?: (event: { connected: boolean }) => void
  onSynced?: (event: { synced: boolean }) => void
  onPeersChange?: (event: PeersEvent) => void

  // Room and peer events
  onRoomReady?: (room: Room) => void
  onPeerConnect?: (peerId: string) => void
  onPeerDisconnect?: (peerId: string) => void
}
```

### Usage Example

```javascript
import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'

const doc = new Y.Doc()

const provider = new WebrtcProvider('my-room', doc, {
  signaling: ['wss://signaling-server.com'],
  hooks: {
    onBeforeConnect: async () => {
      console.log('About to connect...')
      // Perform setup tasks
    },

    onAfterConnect: async () => {
      console.log('Connected!')
      // Initialize post-connection features
    },

    onPeerConnect: (peerId) => {
      console.log(`Peer ${peerId} connected`)
      // Track peer connections
    },

    onPeerDisconnect: (peerId) => {
      console.log(`Peer ${peerId} disconnected`)
      // Handle peer disconnection
    },

    onSynced: (event) => {
      if (event.synced) {
        console.log('Document is synced with all peers')
      }
    },

    onPeersChange: (event) => {
      console.log('Peers changed:', {
        added: event.added,
        removed: event.removed,
        webrtcPeers: event.webrtcPeers,
        bcPeers: event.bcPeers
      })
    }
  }
})
```

### Extending WebrtcProvider

You can also extend the `WebrtcProvider` class to override methods:

```javascript
class CustomWebrtcProvider extends WebrtcProvider {
  constructor(roomName, doc, opts) {
    super(roomName, doc, opts)
  }

  // Override connect behavior
  async connect() {
    console.log('Custom connect logic')
    await super.connect()
  }
}
```

## Signaling Adapter Hooks

### Available Hooks

All signaling adapters (including custom ones) support these hooks:

```typescript
interface SignalingAdapterHooks {
  // Connection lifecycle
  onBeforeConnect?: (url: string) => void | Promise<void>
  onAfterConnect?: (url: string) => void | Promise<void>
  onBeforeDisconnect?: () => void | Promise<void>
  onAfterDisconnect?: () => void | Promise<void>

  // Subscription lifecycle
  onBeforeSubscribe?: (topics: string[]) => void | Promise<void>
  onAfterSubscribe?: (topics: string[]) => void | Promise<void>
  onBeforeUnsubscribe?: (topics: string[]) => void | Promise<void>
  onAfterUnsubscribe?: (topics: string[]) => void | Promise<void>

  // Message handling
  onBeforePublish?: (topic: string, data: any) => void | { topic: string; data: any } | Promise<void | { topic: string; data: any }>
  onAfterPublish?: (topic: string, data: any) => void | Promise<void>
  onMessage?: (message: { topic: string; data: any }) => void

  // Error handling
  onConnectError?: (error: any) => void
  onDisconnectError?: (error: any) => void
}
```

### Usage Example

```javascript
import { DefaultSignalingAdapter, WebrtcProvider } from 'y-webrtc'

// Create an adapter with hooks
const adapter = new DefaultSignalingAdapter({
  onBeforeConnect: (url) => {
    console.log(`Connecting to ${url}...`)
  },

  onAfterConnect: (url) => {
    console.log(`Connected to ${url}`)
  },

  onBeforePublish: (topic, data) => {
    console.log(`Publishing to ${topic}`)
    // You can modify the message here
    return {
      topic,
      data: { ...data, timestamp: Date.now() }
    }
  },

  onMessage: (message) => {
    console.log('Received message:', message)
  },

  onConnectError: (error) => {
    console.error('Connection error:', error)
  }
})

const provider = new WebrtcProvider('my-room', doc, {
  signaling: [adapter]
})
```

### Laravel Echo Adapter Hooks

The Laravel Echo adapter also supports all hooks:

```javascript
import Echo from 'laravel-echo'
import { LaravelEchoAdapter, WebrtcProvider } from 'y-webrtc'

const echo = new Echo({
  broadcaster: 'pusher',
  key: 'your-key',
  cluster: 'your-cluster'
})

const adapter = new LaravelEchoAdapter(echo, {
  onBeforeSubscribe: (topics) => {
    console.log('Subscribing to:', topics)
  },

  onMessage: (message) => {
    console.log('Message from Laravel:', message)
  }
})

const provider = new WebrtcProvider('my-room', doc, {
  signaling: [adapter]
})
```

## Extending Signaling Adapters

You can extend the adapter classes to override protected methods:

### Extending DefaultSignalingAdapter

```javascript
class CustomSignalingAdapter extends DefaultSignalingAdapter {
  constructor(hooks) {
    super(hooks)
  }

  // Override connection logic
  _doConnect(url) {
    console.log('Custom connection logic')
    super._doConnect(url)
  }

  // Override message handling
  _handleMessage(message) {
    console.log('Custom message processing')
    // Transform or filter messages
    if (message.data.type === 'custom') {
      // Handle custom messages
      return
    }
    super._handleMessage(message)
  }

  // Override publish logic
  _doPublish(topic, data) {
    console.log('Custom publish logic')
    // Add metadata, compress, encrypt, etc.
    super._doPublish(topic, data)
  }
}
```

### Extending LaravelEchoAdapter

```javascript
class CustomEchoAdapter extends LaravelEchoAdapter {
  constructor(echo, hooks) {
    super(echo, hooks)
  }

  // Override channel naming
  _getChannelName(topic) {
    // Custom channel naming strategy
    return `my-app.${topic}`
  }

  // Override subscription logic
  _doSubscribe(topic) {
    console.log(`Custom subscribe for ${topic}`)
    super._doSubscribe(topic)
  }

  // Override message handling
  _handleMessage(message) {
    // Filter or transform messages
    console.log('Processing message:', message)
    super._handleMessage(message)
  }
}
```

## Advanced Use Cases

### Logging and Monitoring

```javascript
const provider = new WebrtcProvider('my-room', doc, {
  hooks: {
    onStatusChange: (event) => {
      // Send to analytics
      analytics.track('provider-status', event)
    },

    onPeerConnect: (peerId) => {
      // Track peer connections
      analytics.track('peer-connect', { peerId })
    }
  }
})
```

### Custom Authentication

```javascript
const adapter = new DefaultSignalingAdapter({
  onBeforeConnect: async (url) => {
    // Get auth token
    const token = await getAuthToken()
    // Could modify URL or store token for later use
  },

  onBeforePublish: (topic, data) => {
    // Add authentication to messages
    return {
      topic,
      data: {
        ...data,
        auth: getAuthToken()
      }
    }
  }
})
```

### Message Filtering

```javascript
class FilteredAdapter extends DefaultSignalingAdapter {
  _handleMessage(message) {
    // Filter out unwanted messages
    if (this.shouldIgnore(message)) {
      return
    }
    super._handleMessage(message)
  }

  shouldIgnore(message) {
    // Custom filtering logic
    return message.data.spam === true
  }
}
```

### Custom Signaling Backend

```javascript
import { SignalingAdapter } from 'y-webrtc'

class WebSocketAdapter extends SignalingAdapter {
  constructor(hooks = {}) {
    super(hooks)
    this.ws = null
  }

  async connect(url) {
    await this._callHook('onBeforeConnect', url)

    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      this.connected = true
      this.emit('connect', [])
      this._callHook('onAfterConnect', url)
    }

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      this._callHook('onMessage', message)
      this.emit('message', [message])
    }

    this.ws.onerror = (error) => {
      this._callHook('onConnectError', error)
    }
  }

  async disconnect() {
    await this._callHook('onBeforeDisconnect')
    this.ws.close()
    this.connected = false
    await this._callHook('onAfterDisconnect')
  }

  async subscribe(topics) {
    await this._callHook('onBeforeSubscribe', topics)
    this.ws.send(JSON.stringify({ type: 'subscribe', topics }))
    await this._callHook('onAfterSubscribe', topics)
  }

  async unsubscribe(topics) {
    await this._callHook('onBeforeUnsubscribe', topics)
    this.ws.send(JSON.stringify({ type: 'unsubscribe', topics }))
    await this._callHook('onAfterUnsubscribe', topics)
  }

  async publish(topic, data) {
    const result = await this._callHook('onBeforePublish', topic, data)
    if (result) {
      topic = result.topic
      data = result.data
    }

    this.ws.send(JSON.stringify({ type: 'publish', topic, data }))

    await this._callHook('onAfterPublish', topic, data)
  }

  destroy() {
    this.disconnect()
    super.destroy()
  }
}
```

## Protected Methods Available for Override

### DefaultSignalingAdapter

- `_doConnect(url)` - Perform the actual connection
- `_handleMessage(message)` - Process incoming messages
- `_doSubscribe(topics)` - Perform subscription
- `_doUnsubscribe(topics)` - Perform unsubscription
- `_doPublish(topic, data)` - Perform publish

### LaravelEchoAdapter

- `_getChannelName(topic)` - Get the channel name for a topic
- `_handleMessage(message)` - Process incoming messages
- `_doSubscribe(topic)` - Subscribe to a single topic
- `_doUnsubscribe(topic)` - Unsubscribe from a single topic
- `_doPublish(topic, data)` - Publish to a topic

## Backward Compatibility

All hooks are optional, and the default behavior remains unchanged. Existing code will continue to work without any modifications.

```javascript
// This still works exactly as before
const provider = new WebrtcProvider('my-room', doc, {
  signaling: ['wss://signaling-server.com']
})

// And so does this
const adapter = new DefaultSignalingAdapter()
```

## TypeScript Support

All hooks and interfaces are fully typed, providing excellent IDE support and type safety:

```typescript
import { WebrtcProvider, WebrtcProviderHooks, SignalingAdapterHooks } from 'y-webrtc'

const providerHooks: WebrtcProviderHooks = {
  onPeerConnect: (peerId: string) => {
    console.log(peerId)
  }
}

const provider = new WebrtcProvider('my-room', doc, {
  hooks: providerHooks
})
```
