# Message Chunking Implementation

## Overview
This implementation adds automatic message chunking to the y-webrtc library. All messages sent through WebRTC connections and broadcast channels are now automatically chunked if they exceed a configurable size limit.

## Configuration
- **CHUNK_SIZE**: Set to `10 * 1000` bytes (~9.5KB)
- **Message Type**: New `messageChunk` (value: 5) added for chunk identification

## Key Features

### 1. Unified Chunking Logic
All messages are processed through the same chunking mechanism - no code duplication:
- Messages ≤ CHUNK_SIZE: Sent as-is (single chunk)
- Messages > CHUNK_SIZE: Automatically split into multiple chunks

### 2. Chunk Format
Each chunk contains:
- **Message Type**: `messageChunk` (5)
- **Chunk ID**: UUID to group related chunks
- **Part Index**: Current chunk number (0-based)
- **Total Parts**: Total number of chunks
- **Chunk Data**: The actual data segment

### 3. Implementation Points

#### Sending (Chunking)
- `createChunks(message)`: Splits messages into chunks
- Applied to:
  - `sendWebrtcConn()`: Direct peer-to-peer WebRTC messages
  - `broadcastWebrtcConn()`: Broadcast to all WebRTC peers
  - `broadcastBcMessage()`: Broadcast channel messages (chunked before encryption)

#### Receiving (Reassembly)
- `reassembleChunk(peerId, data)`: Reassembles chunks
- Applied to:
  - WebRTC peer data handler (`peer.on('data')` in `WebrtcConn`)
  - Broadcast channel subscriber (`_bcSubscriber` in `Room`)

### 4. Chunk Buffer Management
- Chunks are stored in a hierarchical Map structure: `peerId -> chunkId -> chunks[]`
- Automatic cleanup after reassembly
- Non-chunked messages pass through unchanged
- **Safety checks**: Explicit null/undefined checks to prevent runtime errors during reassembly

## Flow Diagram

```
Sending:
Message → createChunks() → [chunk1, chunk2, ...] → Send each chunk

Receiving:
Receive chunk → reassembleChunk() → {
  if not complete: return null (wait for more)
  if complete: return reassembled message
}
```

## Benefits
1. **Transparent**: No changes needed to higher-level code
2. **Efficient**: Small messages sent without overhead
3. **Reliable**: Proper reassembly with chunk tracking and null-safety checks
4. **Consistent**: Same logic for all message types (sync, awareness, etc.)
5. **Memory Safe**: Automatic cleanup of chunk buffers
6. **Robust**: Handles edge cases like undefined chunks and race conditions

## Testing Recommendations
1. Test with small messages (< 10KB) - should work as before
2. Test with large messages (> 10KB) - should be chunked automatically
3. Test with very large messages (> 100KB) - multiple chunks
4. Test concurrent operations with multiple peers
5. Verify broadcast channel chunking with encryption
