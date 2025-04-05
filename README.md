**AIRAWARE BACKEND SERVER**

**Installation**

1. Clone this repository:
   `git clone https://github.com/ence03/Airaware-Backend.git`
   `cd backend`

2. Install dependencies:
   `npm install`

3. Run the server in development mode:
   `npm run dev`

**WebSockets Support**

- **Socket.io** is used for handling real-time communication
- **WS (Websocket)** is also avialable for lightweight Websocket connections

**Authentication**

- **User passwords** are hashed using **bcryptjs**
- **JWT(JSON Web Token)** is used for secure authentication

**API Endpoints Example**

**Method**          **Endpoint**        **Description**
POST                  /api/login           User login
