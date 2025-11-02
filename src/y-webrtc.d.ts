/**
 * Type definitions for y-webrtc
 * WebRTC provider for Yjs
 */

import type * as Y from 'yjs'
import type { Awareness } from 'y-protocols/awareness'
import type SimplePeer from 'simple-peer'

/**
 * Base class for signaling adapters.
 * Adapters provide different ways to connect to signaling servers.
 */
export class SignalingAdapter {
  connected: boolean

  /**
   * Connect to the signaling server
   */
  connect(url: string): void

  /**
   * Disconnect from the signaling server
   */
  disconnect(): void

  /**
   * Subscribe to topics (rooms)
   */
  subscribe(topics: string[]): void

  /**
   * Unsubscribe from topics (rooms)
   */
  unsubscribe(topics: string[]): void

  /**
   * Publish a message to a topic
   */
  publish(topic: string, data: any): void

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
}

/**
 * Default WebSocket-based signaling adapter.
 * This adapter maintains the same behavior as the original implementation.
 */
export class DefaultSignalingAdapter extends SignalingAdapter {
  ws: any | null
  url: string
}

/**
 * Laravel Echo signaling adapter.
 * Allows using Laravel Echo as the signaling backend.
 */
export class LaravelEchoAdapter extends SignalingAdapter {
  /**
   * @param echo - Laravel Echo instance
   * @param channelName - The name of the channel to use for signaling
   */
  constructor(echo: any, channelName?: string)

  echo: any
  channelName: string
  channel: any | null
}

/**
 * Configuration for signaling adapters
 */
export interface SignalingAdapterConfig {
  type: 'default' | 'laravel-echo'
  url?: string
  echo?: any
  channelName?: string
}

/**
 * Create a signaling adapter from configuration
 */
export function createSignalingAdapter(config: SignalingAdapterConfig | string): SignalingAdapter

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
  connect(): void

  /**
   * Disconnect from peers
   */
  disconnect(): void

  /**
   * Destroy the provider and cleanup resources
   */
  destroy(): void

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
