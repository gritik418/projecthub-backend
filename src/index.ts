import express from "express";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import projectRoutes from "./routes/project.routes.js";
import clientRoutes from "./routes/client.routes.js";
import taskRoutes from "./routes/task.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

import cookieParser from "cookie-parser";
import cors from "cors";
import http from "http";

import { startTaskJobs } from "./jobs/task.job.js";
import "./workers/task.worker.js";
import socketServer from "./socket/socket.server.js";

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 8000;

socketServer(server);

app.use(
  cors({
    origin: [process.env.FRONTEND_URL!],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/project", projectRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/task", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);

await startTaskJobs();

server.listen(port, () => {
  console.log(`App served at port: ${port}`);
});
