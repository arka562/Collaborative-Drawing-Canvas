Real-Time Collaborative Drawing Canvas – System Architecture
Fundamental Concept

Instead of syncing raw pixel data, the system exchanges drawing actions.
Every stroke is handled as a standalone, immutable operation that can be replayed in the same order on all clients to ensure consistency.

Canvas Rendering Approach

The frontend separates responsibilities across multiple canvas layers to improve performance and visual stability:

Base Canvas: Renders finalized and verified drawing operations

Live Preview Canvas: Displays strokes currently being drawn by the local user

Cursor Overlay Canvas: Shows real-time cursor positions of other participants

This layered approach reduces unnecessary redraws and prevents screen flicker during updates.

Real-Time Synchronization Model

Communication is handled through WebSocket connections for low-latency updates

Users see their strokes immediately using optimistic rendering

The backend validates and sequences all drawing operations, acting as the authoritative coordinator

This design guarantees smooth collaboration while maintaining a single, consistent drawing state across all connected users.

StrokeOperation {
id: string
userId: string
tool: "brush" | "eraser"
color: string
width: number
points: { x: number, y: number }[]
timestamp: number
undone: boolean
}
