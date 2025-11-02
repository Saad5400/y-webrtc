/**
 * Type definitions for y-webrtc
 * WebRTC provider for Yjs
 */

import type * as Y from 'yjs'
import type { Awareness } from 'y-protocols/awareness'
import type SimplePeer from 'simple-peer'

/**
 * Hooks for signaling adapter lifecycle events
 */
export interface SignalingAdapterHooks {
  /**
   * Called before connecting to the signaling server
   */
  onBeforeConnect?: (url: string) => void | Promise<void>

  /**
   * Called after successfully connecting to the signaling server
   */
  onAfterConnect?: (url: string) => void | Promise<void>

  /**
   * Called before disconnecting from the signaling server
   */
  onBeforeDisconnect?: () => void | Promise<void>

  /**
   * Called after disconnecting from the signaling server
   */
  onAfterDisconnect?: () => void | Promise<void>

  /**
   * Called before subscribing to topics
   */
  onBeforeSubscribe?: (topics: string[]) => void | Promise<void>

  /**
   * Called after subscribing to topics
   */
  onAfterSubscribe?: (topics: string[]) => void | Promise<void>

  /**
   * Called before unsubscribing from topics
   */
  onBeforeUnsubscribe?: (topics: string[]) => void | Promise<void>

  /**
   * Called after unsubscribing from topics
   */
  onAfterUnsubscribe?: (topics: string[]) => void | Promise<void>

  /**
   * Called before publishing a message. Can modify the message by returning a new topic/data object
   */
  onBeforePublish?: (topic: string, data: any) => void | { topic: string; data: any } | Promise<void | { topic: string; data: any }>

  /**
   * Called after publishing a message
   */
  onAfterPublish?: (topic: string, data: any) => void | Promise<void>

  /**
   * Called when a message is received
   */
  onMessage?: (message: { topic: string; data: any }) => void

  /**
   * Called when a connection error occurs
   */
  onConnectError?: (error: any) => void

  /**
   * Called when a disconnection error occurs
   */
  onDisconnectError?: (error: any) => void
}

/**
 * Base class for signaling adapters.
 * Adapters provide different ways to connect to signaling servers.
 */
export class SignalingAdapter {
  connected: boolean
  hooks: SignalingAdapterHooks

  constructor(hooks?: SignalingAdapterHooks)

  /**
   * Connect to the signaling server
   */
  connect(url: string): void | Promise<void>

  /**
   * Disconnect from the signaling server
   */
  disconnect(): void | Promise<void>

  /**
   * Subscribe to topics (rooms)
   */
  subscribe(topics: string[]): void | Promise<void>

  /**
   * Unsubscribe from topics (rooms)
   */
  unsubscribe(topics: string[]): void | Promise<void>

  /**
   * Publish a message to a topic
   */
  publish(topic: string, data: any): void | Promise<void>

  /**
   * Destroy the adapter and cleanup resources
   */
  destroy(): void

  /**
   * Add an event listener
   */
  on(name: string, f: (...args: any[]) => void): void

  /**
   * Add a one-time event listener
   */
  once(name: string, f: (...args: any[]) => void): void

  /**
   * Remove an event listener
   */
  off(name: string, f: (...args: any[]) => void): void

  /**
   * Emit an event
   */
  emit(name: string, args: any[]): void

  /**
   * Call a hook if it exists
   */
  _callHook(hookName: string, ...args: any[]): Promise<any>
}

/**
 * Default WebSocket-based signaling adapter.
 * This adapter maintains the same behavior as the original implementation.
 */
export class DefaultSignalingAdapter extends SignalingAdapter {
  ws: any | null
  url: string

  constructor(hooks?: SignalingAdapterHooks)

  /**
   * Protected method that performs the actual connection
   */
  protected _doConnect(url: string): void

  /**
   * Protected method that handles incoming messages
   */
  protected _handleMessage(message: { topic: string; data: any }): void

  /**
   * Protected method that performs the actual subscription
   */
  protected _doSubscribe(topics: string[]): void

  /**
   * Protected method that performs the actual unsubscription
   */
  protected _doUnsubscribe(topics: string[]): void

  /**
   * Protected method that performs the actual publishing
   */
  protected _doPublish(topic: string, data: any): void
}

/**
 * Laravel Echo signaling adapter.
 * Allows using Laravel Echo as the signaling backend.
 */
export class LaravelEchoAdapter extends SignalingAdapter {
  /**
   * @param echo - Laravel Echo instance
   * @param hooks - Optional hooks for lifecycle events
   */
  constructor(echo: any, hooks?: SignalingAdapterHooks)

  echo: any
  channels: Map<string, any>
  readyChannels: Set<string>
  messageQueue: Map<string, any[]>
  shouldConnect: boolean

  /**
   * Protected method to get the channel name for a topic
   */
  protected _getChannelName(topic: string): string

  /**
   * Protected method that handles incoming messages
   */
  protected _handleMessage(message: { topic: string; data: any }): void

  /**
   * Protected method that performs the actual subscription for a single topic
   */
  protected _doSubscribe(topic: string): void

  /**
   * Protected method that performs the actual unsubscription for a single topic
   */
  protected _doUnsubscribe(topic: string): void

  /**
   * Protected method that performs the actual publishing
   */
  protected _doPublish(topic: string, data: any): void
}

/**
 * Configuration for signaling adapters
 */
export interface SignalingAdapterConfig {
  type: 'default' | 'echo'
  url?: string
  echo?: any
  hooks?: SignalingAdapterHooks
}

/**
 * Create a signaling adapter from configuration
 */
export function createSignalingAdapter(config: SignalingAdapterConfig | SignalingAdapter | string): SignalingAdapter

/**
 * Hooks for WebrtcProvider lifecycle events
 */
export interface WebrtcProviderHooks {
  /**
   * Called before the provider connects
   */
  onBeforeConnect?: () => void | Promise<void>

  /**
   * Called after the provider connects
   */
  onAfterConnect?: () => void | Promise<void>

  /**
   * Called before the provider disconnects
   */
  onBeforeDisconnect?: () => void | Promise<void>

  /**
   * Called after the provider disconnects
   */
  onAfterDisconnect?: () => void | Promise<void>

  /**
   * Called when connection status changes
   */
  onStatusChange?: (event: StatusEvent) => void

  /**
   * Called when sync status changes
   */
  onSynced?: (event: SyncedEvent) => void

  /**
   * Called when peers change
   */
  onPeersChange?: (event: PeersEvent) => void

  /**
   * Called when the room is ready
   */
  onRoomReady?: (room: Room) => void

  /**
   * Called when a peer connects
   */
  onPeerConnect?: (peerId: string) => void

  /**
   * Called when a peer disconnects
   */
  onPeerDisconnect?: (peerId: string) => void
}

/**
 * Options for WebrtcProvider
 */
export interface ProviderOptions {
  /**
   * Array of signaling server URLs or adapter instances
   * @default ['wss://y-webrtc-eu.fly.dev']
   */
  signaling?: Array<string | SignalingAdapter>

  /**
   * Password for encrypted rooms
   */
  password?: string | null

  /**
   * Awareness instance to use
   */
  awareness?: Awareness

  /**
   * Maximum number of WebRTC connections
   * @default 20 + random(0-15)
   */
  maxConns?: number

  /**
   * Whether to filter broadcast channel connections
   * @default true
   */
  filterBcConns?: boolean

  /**
   * SimplePeer options
   * @see https://github.com/feross/simple-peer#peer--new-peeropts
   */
  peerOpts?: SimplePeer.Options

  /**
   * Lifecycle hooks for the provider
   */
  hooks?: WebrtcProviderHooks
}

/**
 * WebRTC connection
 */
export class WebrtcConn {
  constructor(
    signalingConn: SignalingConn,
    initiator: boolean,
    remotePeerId: string,
    room: Room
  )

  signalingConn: SignalingConn
  remotePeerId: string
  room: Room
  closed: boolean
  connected: boolean
  synced: boolean
  peer: SimplePeer.Instance

  destroy(): void
}

/**
 * Room for managing WebRTC connections
 */
export class Room {
  peerId: string
  doc: Y.Doc
  provider: WebrtcProvider
  awareness: Awareness
  webrtcConns: Set<WebrtcConn>
  bcConns: Set<any>
  mux: any
  key: CryptoKey | null

  connect(): void
  disconnect(): void
  destroy(): void
}

/**
 * Signaling connection
 */
export class SignalingConn {
  constructor(urlOrAdapter: string | SignalingAdapter, key: string | SignalingAdapter)

  adapter: SignalingAdapter
  key: string | SignalingAdapter
  providers: Set<WebrtcProvider>

  disconnect(): void
  destroy(): void
}

/**
 * Status event
 */
export interface StatusEvent {
  connected: boolean
}

/**
 * Synced event
 */
export interface SyncedEvent {
  synced: boolean
}

/**
 * Peers event
 */
export interface PeersEvent {
  added: string[]
  removed: string[]
  webrtcPeers: string[]
  bcPeers: string[]
}

/**
 * WebRTC provider for Yjs
 *
 * @example
 * ```typescript
 * import * as Y from 'yjs'
 * import { WebrtcProvider } from 'y-webrtc'
 *
 * const doc = new Y.Doc()
 * const provider = new WebrtcProvider('my-room-name', doc, {
 *   signaling: ['wss://y-webrtc.example.com']
 * })
 *
 * provider.on('status', (event) => {
 *   console.log(event.connected)
 * })
 * ```
 */
export class WebrtcProvider {
  /**
   * @param roomName - The name of the room to join
   * @param doc - The Yjs document to sync
   * @param opts - Provider options
   */
  constructor(roomName: string, doc: Y.Doc, opts?: ProviderOptions)

  roomName: string
  doc: Y.Doc
  filterBcConns: boolean
  awareness: Awareness
  shouldConnect: boolean
  signalingUrls: Array<string | SignalingAdapter>
  signalingConns: SignalingConn[]
  maxConns: number
  peerOpts: SimplePeer.Options
  hooks: WebrtcProviderHooks
  key: Promise<CryptoKey | null>
  room: Room | null

  /**
   * Indicates whether the provider is looking for other peers.
   *
   * Other peers can be found via signaling servers or via broadcastchannel (cross browser-tab
   * communication). You never know when you are connected to all peers. You also don't know if
   * there are other peers. connected doesn't mean that you are connected to any physical peers
   * working on the same resource as you. It does not change unless you call provider.disconnect()
   */
  readonly connected: boolean

  /**
   * Connect to peers
   */
  connect(): Promise<void>

  /**
   * Disconnect from peers
   */
  disconnect(): Promise<void>

  /**
   * Destroy the provider and cleanup resources
   */
  destroy(): void

  /**
   * Call a hook if it exists
   */
  _callHook(hookName: string, ...args: any[]): Promise<any>

  /**
   * Add an event listener
   *
   * @example
   * ```typescript
   * provider.on('status', (event) => {
   *   console.log('connected:', event.connected)
   * })
   *
   * provider.on('synced', (event) => {
   *   console.log('synced:', event.synced)
   * })
   *
   * provider.on('peers', (event) => {
   *   console.log('added:', event.added)
   *   console.log('removed:', event.removed)
   *   console.log('webrtcPeers:', event.webrtcPeers)
   *   console.log('bcPeers:', event.bcPeers)
   * })
   * ```
   */
  on(name: 'status', f: (event: StatusEvent) => void): void
  on(name: 'synced', f: (event: SyncedEvent) => void): void
  on(name: 'peers', f: (event: PeersEvent) => void): void
  on(name: string, f: (...args: any[]) => void): void

  /**
   * Add a one-time event listener
   */
  once(name: 'status', f: (event: StatusEvent) => void): void
  once(name: 'synced', f: (event: SyncedEvent) => void): void
  once(name: 'peers', f: (event: PeersEvent) => void): void
  once(name: string, f: (...args: any[]) => void): void

  /**
   * Remove an event listener
   */
  off(name: 'status', f: (event: StatusEvent) => void): void
  off(name: 'synced', f: (event: SyncedEvent) => void): void
  off(name: 'peers', f: (event: PeersEvent) => void): void
  off(name: string, f: (...args: any[]) => void): void
}
