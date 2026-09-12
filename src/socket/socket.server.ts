import { Server, type Socket } from "socket.io";
import http from "http";

import jwt from "jsonwebtoken";
import type { UserRole } from "../generated/prisma/enums.js";

export const ConnectedUsers = new Map<string, Socket>();
export let io: Server;

const socketServer = (
  httpServer: http.Server<
    typeof http.IncomingMessage,
    typeof http.ServerResponse
  >,
) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
    transports: ["websocket"],
    allowUpgrades: true,
    pingTimeout: 20000,
  });

  io.use((socket: Socket, next) => {
    try {
      const authorization = socket.handshake.auth.token;

      console.log("first", authorization);

      if (!authorization?.startsWith("Bearer ")) {
        return next(new Error("Unauthorized"));
      }

      const accessToken = authorization.split(" ")[1];
      console.log("accessToken", accessToken);

      if (!accessToken) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as {
        id: string;
        email: string;
        role: UserRole;
      };

      if (!decoded.id || !decoded.email || !decoded.role) {
        return next(new Error("Unauthorized"));
      }

      socket.data.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;

    console.log("connected", user.email);

    ConnectedUsers.set(user.id, socket);

    if (user.role === "ADMIN") {
      socket.join("admins");
    }

    emitActiveUsers(io);

    socket.on("disconnect", () => {
      console.log("disconnected", user.email);
      ConnectedUsers.delete(user.id);

      emitActiveUsers(io);
    });
  });
};

const emitActiveUsers = (io: Server) => {
  const users = Array.from(ConnectedUsers.keys());

  io.to("admins").emit("active-users", users);
};

export default socketServer;
