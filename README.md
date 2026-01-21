#  Real-Time Collaborative Drawing Canvas

A multi-user real-time drawing application where multiple users can draw simultaneously on a shared canvas with global undo/redo support.

---

##  Features

- Real-time collaborative drawing using WebSockets
- Smooth freehand drawing with brush and eraser
- Color and stroke width selection
- Global undo/redo across all users
- Live cursor indicators
- User presence handling
- Late join synchronization
- Automatic reconnect support

---

##  Tech Stack

- **Frontend**: HTML, CSS, Vanilla JavaScript, Canvas API
- **Backend**: Node.js, Express
- **Real-time**: WebSocket (`ws`)
- **No external drawing libraries used**

---

##  Setup Instructions

```bash
npm install
npm run dev

