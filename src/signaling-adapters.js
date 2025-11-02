/**
 * @module signaling-adapters
 */

import * as ws from 'lib0/websocket'
import * as map from 'lib0/map'
import * as error from 'lib0/error'
import { Observable } from 'lib0/observable'

/**
 * @typedef {Object} SignalingAdapterHooks
 * @property {function(string):void|Promise<void>} [onBeforeConnect] - Called before connecting
 * @property {function(string):void|Promise<void>} [onAfterConnect] - Called after connecting
 * @property {function():void|Promise<void>} [onBeforeDisconnect] - Called before disconnecting
 * @property {function():void|Promise<void>} [onAfterDisconnect] - Called after disconnecting
 * @property {function(Array<string>):void|Promise<void>} [onBeforeSubscribe] - Called before subscribing
 * @property {function(Array<string>):void|Promise<void>} [onAfterSubscribe] - Called after subscribing
 * @property {function(Array<string>):void|Promise<void>} [onBeforeUnsubscribe] - Called before unsubscribing
 * @property {function(Array<string>):void|Promise<void>} [onAfterUnsubscribe] - Called after unsubscribing
 * @property {function(string, any):(void|{topic:string,data:any}|Promise<void|{topic:string,data:any}>)} [onBeforePublish] - Called before publishing, can modify message
 * @property {function(string, any):void|Promise<void>} [onAfterPublish] - Called after publishing
 * @property {function({topic:string,data:any}):void} [onMessage] - Called when a message is received
 * @property {function(any):void} [onConnectError] - Called on connection error
 * @property {function(any):void} [onDisconnectError] - Called on disconnection error
 */

/**
 * Base class for signaling adapters.
 * Adapters provide different ways to connect to signaling servers.
 *
 * @extends Observable<string>
 */
export class SignalingAdapter extends Observable {
  /**
   * @param {SignalingAdapterHooks} [hooks] - Optional hooks for lifecycle events
   */
  constructor (hooks = {}) {
    super()
    /**
     * @type {boolean}
     */
    this.connected = false
    /**
     * @type {SignalingAdapterHooks}
     */
    this.hooks = hooks
  }

  /**
   * Call a hook if it exists, handling both sync and async functions
   * @param {string} hookName - Name of the hook to call
   * @param {...any} args - Arguments to pass to the hook
   * @returns {Promise<any>}
   */
  async _callHook (hookName, ...args) {
    const hook = this.hooks[hookName]
    if (typeof hook === 'function') {
      return await hook(...args)
    }
  }

  /**
   * Connect to the signaling server
   * @param {string} url - The URL of the signaling server
   */
  connect (url) {
    error.methodUnimplemented()
  }

  /**
   * Disconnect from the signaling server
   */
  disconnect () {
    error.methodUnimplemented()
  }

  /**
   * Subscribe to topics (rooms)
   * @param {Array<string>} topics - Array of topic names to subscribe to
   */
  subscribe (topics) {
    error.methodUnimplemented()
  }

  /**
   * Unsubscribe from topics (rooms)
   * @param {Array<string>} topics - Array of topic names to unsubscribe from
   */
  unsubscribe (topics) {
    error.methodUnimplemented()
  }

  /**
   * Publish a message to a topic
   * @param {string} topic - The topic to publish to
   * @param {any} data - The data to publish
   */
  publish (topic, data) {
    error.methodUnimplemented()
  }

  /**
   * Destroy the adapter and cleanup resources
   */
  destroy () {
    super.destroy()
  }
}

/**
 * Default WebSocket-based signaling adapter.
 * This adapter maintains the same behavior as the original implementation.
 *
 * @extends SignalingAdapter
 */
export class DefaultSignalingAdapter extends SignalingAdapter {
  /**
   * @param {SignalingAdapterHooks} [hooks] - Optional hooks for lifecycle events
   */
  constructor (hooks = {}) {
    super(hooks)
    /**
     * @type {ws.WebsocketClient | null}
     */
    this.ws = null
    /**
     * @type {string}
     */
    this.url = ''
  }

  /**
   * @param {string} url
   */
  async connect (url) {
    try {
      await this._callHook('onBeforeConnect', url)

      if (this.ws) {
        this.disconnect()
      }

      this.url = url
      await this._doConnect(url)

      await this._callHook('onAfterConnect', url)
    } catch (error) {
      await this._callHook('onConnectError', error)
      throw error
    }
  }

  /**
   * Protected method that performs the actual connection
   * Can be overridden by subclasses
   * @protected
   * @param {string} url
   */
  _doConnect (url) {
    this.ws = new ws.WebsocketClient(url)

    this.ws.on('connect', () => {
      this.connected = true
      this.emit('connect', [])
    })

    this.ws.on('disconnect', () => {
      this.connected = false
      this.emit('disconnect', [])
    })

    this.ws.on('message', (message) => {
      if (message.type === 'publish') {
        const msg = { topic: message.topic, data: message.data }
        this._handleMessage(msg)
      }
    })
  }

  /**
   * Protected method that handles incoming messages
   * Can be overridden by subclasses
   * @protected
   * @param {{topic: string, data: any}} message
   */
  _handleMessage (message) {
    this._callHook('onMessage', message)
    this.emit('message', [message])
  }

  async disconnect () {
    try {
      await this._callHook('onBeforeDisconnect')

      if (this.ws) {
        this.ws.disconnect()
        this.ws = null
      }
      this.connected = false

      await this._callHook('onAfterDisconnect')
    } catch (error) {
      await this._callHook('onDisconnectError', error)
      throw error
    }
  }

  /**
   * @param {Array<string>} topics
   */
  async subscribe (topics) {
    await this._callHook('onBeforeSubscribe', topics)

    if (this.ws && this.connected) {
      this._doSubscribe(topics)
    }

    await this._callHook('onAfterSubscribe', topics)
  }

  /**
   * Protected method that performs the actual subscription
   * Can be overridden by subclasses
   * @protected
   * @param {Array<string>} topics
   */
  _doSubscribe (topics) {
    this.ws.send({ type: 'subscribe', topics })
  }

  /**
   * @param {Array<string>} topics
   */
  async unsubscribe (topics) {
    await this._callHook('onBeforeUnsubscribe', topics)

    if (this.ws && this.connected) {
      this._doUnsubscribe(topics)
    }

    await this._callHook('onAfterUnsubscribe', topics)
  }

  /**
   * Protected method that performs the actual unsubscription
   * Can be overridden by subclasses
   * @protected
   * @param {Array<string>} topics
   */
  _doUnsubscribe (topics) {
    this.ws.send({ type: 'unsubscribe', topics })
  }

  /**
   * @param {string} topic
   * @param {any} data
   */
  async publish (topic, data) {
    // Call onBeforePublish hook which can modify the message
    const result = await this._callHook('onBeforePublish', topic, data)
    if (result && typeof result === 'object' && 'topic' in result && 'data' in result) {
      topic = result.topic
      data = result.data
    }

    if (this.ws && this.connected) {
      this._doPublish(topic, data)
    }

    await this._callHook('onAfterPublish', topic, data)
  }

  /**
   * Protected method that performs the actual publishing
   * Can be overridden by subclasses
   * @protected
   * @param {string} topic
   * @param {any} data
   */
  _doPublish (topic, data) {
    this.ws.send({ type: 'publish', topic, data })
  }

  destroy () {
    this.disconnect()
    super.destroy()
  }
}

/**
 * Laravel Echo adapter for signaling.
 * This adapter allows using Laravel Echo as the signaling mechanism.
 *
 * @extends SignalingAdapter
 */
export class LaravelEchoAdapter extends SignalingAdapter {
  /**
   * @param {any} echoInstance - Laravel Echo instance
   * @param {SignalingAdapterHooks} [hooks] - Optional hooks for lifecycle events
   */
  constructor (echoInstance, hooks = {}) {
    super(hooks)
    /**
     * @type {any}
     */
    this.echo = echoInstance
    /**
     * @type {Map<string, any>}
     */
    this.channels = new Map()
    /**
     * @type {Set<string>}
     */
    this.readyChannels = new Set()
    /**
     * @type {Map<string, Array<any>>}
     */
    this.messageQueue = new Map()
    /**
     * @type {boolean}
     */
    this.shouldConnect = false
  }

  /**
   * @param {string} url - Not used for Echo, but kept for interface compatibility
   */
  async connect (url) {
    try {
      await this._callHook('onBeforeConnect', url)

      this.shouldConnect = true
      this.connected = true
      // Echo maintains its own connection, so we just mark as connected
      // and emit the connect event
      setTimeout(() => {
        this.emit('connect', [])
      }, 0)

      await this._callHook('onAfterConnect', url)
    } catch (error) {
      await this._callHook('onConnectError', error)
      throw error
    }
  }

  async disconnect () {
    try {
      await this._callHook('onBeforeDisconnect')

      this.shouldConnect = false
      this.connected = false
      // Leave all channels
      this.channels.forEach((channel, topic) => {
        this.echo.leave(this._getChannelName(topic))
      })
      this.channels.clear()
      this.readyChannels.clear()
      this.messageQueue.clear()
      this.emit('disconnect', [])

      await this._callHook('onAfterDisconnect')
    } catch (error) {
      await this._callHook('onDisconnectError', error)
      throw error
    }
  }

  /**
   * Get the channel name for a topic
   * Protected method that can be overridden by subclasses
   * @protected
   * @param {string} topic
   * @returns {string}
   */
  _getChannelName (topic) {
    // Use private channel for y-webrtc rooms
    // You can customize this based on your Laravel setup
    return `y-webrtc.${topic}`
  }

  /**
   * Protected method that handles incoming messages
   * Can be overridden by subclasses
   * @protected
   * @param {{topic: string, data: any}} message
   */
  _handleMessage (message) {
    this._callHook('onMessage', message)
    this.emit('message', [message])
  }

  /**
   * @param {Array<string>} topics
   */
  async subscribe (topics) {
    await this._callHook('onBeforeSubscribe', topics)

    if (!this.shouldConnect || !this.echo) {
      await this._callHook('onAfterSubscribe', topics)
      return
    }

    topics.forEach(topic => {
      if (this.channels.has(topic)) return

      this._doSubscribe(topic)
    })

    await this._callHook('onAfterSubscribe', topics)
  }

  /**
   * Protected method that performs the actual subscription for a single topic
   * Can be overridden by subclasses
   * @protected
   * @param {string} topic
   */
  _doSubscribe (topic) {
    const channelName = this._getChannelName(topic)
    const channel = this.echo.private(channelName)

    // Wait for subscription to be ready before allowing whispers
    channel.subscribed(() => {
      this.readyChannels.add(topic)

      // Flush any queued messages
      const queuedMessages = this.messageQueue.get(topic) || []
      queuedMessages.forEach(data => {
        channel.whisper('signaling', data)
      })
      this.messageQueue.delete(topic)
    })

    // Handle subscription errors
    channel.error((error) => {
      console.error(`LaravelEchoAdapter: Error subscribing to ${channelName}:`, error)
    })

    // Listen for signaling messages
    channel.listen('.signaling', (event) => {
      this._handleMessage({ topic, data: event.data })
    })

    // Also support whisper for peer-to-peer messages
    channel.listenForWhisper('signaling', (event) => {
      this._handleMessage({ topic, data: event })
    })

    this.channels.set(topic, channel)
  }

  /**
   * @param {Array<string>} topics
   */
  async unsubscribe (topics) {
    await this._callHook('onBeforeUnsubscribe', topics)

    topics.forEach(topic => {
      this._doUnsubscribe(topic)
    })

    await this._callHook('onAfterUnsubscribe', topics)
  }

  /**
   * Protected method that performs the actual unsubscription for a single topic
   * Can be overridden by subclasses
   * @protected
   * @param {string} topic
   */
  _doUnsubscribe (topic) {
    const channel = this.channels.get(topic)
    if (channel) {
      this.echo.leave(this._getChannelName(topic))
      this.channels.delete(topic)
      this.readyChannels.delete(topic)
      this.messageQueue.delete(topic)
    }
  }

  /**
   * @param {string} topic
   * @param {any} data
   */
  async publish (topic, data) {
    // Call onBeforePublish hook which can modify the message
    const result = await this._callHook('onBeforePublish', topic, data)
    if (result && typeof result === 'object' && 'topic' in result && 'data' in result) {
      topic = result.topic
      data = result.data
    }

    this._doPublish(topic, data)

    await this._callHook('onAfterPublish', topic, data)
  }

  /**
   * Protected method that performs the actual publishing
   * Can be overridden by subclasses
   * @protected
   * @param {string} topic
   * @param {any} data
   */
  _doPublish (topic, data) {
    const channel = this.channels.get(topic)
    if (!channel) return

    // Only whisper if the channel subscription is ready
    if (this.readyChannels.has(topic)) {
      channel.whisper('signaling', data)
    } else {
      // Queue the message until subscription is ready
      if (!this.messageQueue.has(topic)) {
        this.messageQueue.set(topic, [])
      }
      this.messageQueue.get(topic).push(data)
    }
  }

  destroy () {
    this.disconnect()
    super.destroy()
  }
}

/**
 * Factory function to create a signaling adapter from configuration
 *
 * @param {string | SignalingAdapter | { type: 'default' | 'echo', url?: string, echo?: any, hooks?: SignalingAdapterHooks }} config
 * @returns {SignalingAdapter}
 */
export function createSignalingAdapter (config) {
  // If it's already an adapter instance, return it
  if (config instanceof SignalingAdapter) {
    return config
  }

  // If it's a string, treat it as a URL for the default adapter
  if (typeof config === 'string') {
    return new DefaultSignalingAdapter()
  }

  // If it's a configuration object
  if (typeof config === 'object' && config !== null) {
    const hooks = config.hooks || {}
    switch (config.type) {
      case 'echo':
        if (!config.echo) {
          throw new Error('Laravel Echo instance is required for LaravelEchoAdapter')
        }
        return new LaravelEchoAdapter(config.echo, hooks)
      case 'default':
      default:
        return new DefaultSignalingAdapter(hooks)
    }
  }

  // Default to DefaultSignalingAdapter
  return new DefaultSignalingAdapter()
}
