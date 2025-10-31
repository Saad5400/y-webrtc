/**
 * @module signaling-adapters
 */

import * as ws from 'lib0/websocket'
import * as map from 'lib0/map'
import * as error from 'lib0/error'
import { Observable } from 'lib0/observable'

/**
 * Base class for signaling adapters.
 * Adapters provide different ways to connect to signaling servers.
 *
 * @extends Observable<string>
 */
export class SignalingAdapter extends Observable {
  constructor () {
    super()
    /**
     * @type {boolean}
     */
    this.connected = false
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
  constructor () {
    super()
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
  connect (url) {
    if (this.ws) {
      this.disconnect()
    }

    this.url = url
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
        this.emit('message', [{ topic: message.topic, data: message.data }])
      }
    })
  }

  disconnect () {
    if (this.ws) {
      this.ws.disconnect()
      this.ws = null
    }
    this.connected = false
  }

  /**
   * @param {Array<string>} topics
   */
  subscribe (topics) {
    if (this.ws && this.connected) {
      this.ws.send({ type: 'subscribe', topics })
    }
  }

  /**
   * @param {Array<string>} topics
   */
  unsubscribe (topics) {
    if (this.ws && this.connected) {
      this.ws.send({ type: 'unsubscribe', topics })
    }
  }

  /**
   * @param {string} topic
   * @param {any} data
   */
  publish (topic, data) {
    if (this.ws && this.connected) {
      this.ws.send({ type: 'publish', topic, data })
    }
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
   */
  constructor (echoInstance) {
    super()
    /**
     * @type {any}
     */
    this.echo = echoInstance
    /**
     * @type {Map<string, any>}
     */
    this.channels = new Map()
    /**
     * @type {boolean}
     */
    this.shouldConnect = false
  }

  /**
   * @param {string} url - Not used for Echo, but kept for interface compatibility
   */
  connect (url) {
    this.shouldConnect = true
    this.connected = true
    // Echo maintains its own connection, so we just mark as connected
    // and emit the connect event
    setTimeout(() => {
      this.emit('connect', [])
    }, 0)
  }

  disconnect () {
    this.shouldConnect = false
    this.connected = false
    // Leave all channels
    this.channels.forEach((channel, topic) => {
      this.echo.leave(this._getChannelName(topic))
    })
    this.channels.clear()
    this.emit('disconnect', [])
  }

  /**
   * Get the channel name for a topic
   * @param {string} topic
   * @returns {string}
   */
  _getChannelName (topic) {
    // Use private channel for y-webrtc rooms
    // You can customize this based on your Laravel setup
    return `private-y-webrtc.${topic}`
  }

  /**
   * @param {Array<string>} topics
   */
  subscribe (topics) {
    if (!this.shouldConnect || !this.echo) return

    topics.forEach(topic => {
      if (this.channels.has(topic)) return

      const channelName = this._getChannelName(topic)
      const channel = this.echo.private(channelName)

      // Listen for signaling messages
      channel.listen('.signaling', (event) => {
        this.emit('message', [{ topic, data: event.data }])
      })

      // Also support whisper for peer-to-peer messages
      channel.listenForWhisper('signaling', (event) => {
        this.emit('message', [{ topic, data: event }])
      })

      this.channels.set(topic, channel)
    })
  }

  /**
   * @param {Array<string>} topics
   */
  unsubscribe (topics) {
    topics.forEach(topic => {
      const channel = this.channels.get(topic)
      if (channel) {
        this.echo.leave(this._getChannelName(topic))
        this.channels.delete(topic)
      }
    })
  }

  /**
   * @param {string} topic
   * @param {any} data
   */
  publish (topic, data) {
    const channel = this.channels.get(topic)
    if (channel) {
      // Use whisper to send messages to other clients
      // This doesn't go through the server's event broadcasting system
      channel.whisper('signaling', data)
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
 * @param {string | SignalingAdapter | { type: 'default' | 'echo', url?: string, echo?: any }} config
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
    switch (config.type) {
      case 'echo':
        if (!config.echo) {
          throw new Error('Laravel Echo instance is required for LaravelEchoAdapter')
        }
        return new LaravelEchoAdapter(config.echo)
      case 'default':
      default:
        return new DefaultSignalingAdapter()
    }
  }

  // Default to DefaultSignalingAdapter
  return new DefaultSignalingAdapter()
}
