## Technology Choices

### Backend — Express.js

I chose Express because I have used it in most of my projects and I'm more comfortable with it than Fastify.

### WebSockets — Socket.IO

I used Socket.IO because I have already worked with it in my Huddle project for real-time chat, typing indicators, and online status.

### Database — PostgreSQL

PostgreSQL fits well because the application has relationships between users, projects, tasks, activities, and notifications. I added indexes on frequently queried fields like projectId, assignedDeveloperId, status, priority, and dueDate.

### Background Jobs — BullMQ

I chose BullMQ because I have used it multiple times with Express and NestJS. It works well with Redis and is used here for the overdue-task scheduler.

### Setup

1. Clone the repository.
2. Create the `.env` file using `.env.example`.
3. Start all services including the API, PostgreSQL, and Redis:

   ```bash
   docker compose up -d
   ```

4. Seed the database:

   ```bash
   docker compose exec api npm run seed
   ```

To stop all services:

```bash
docker compose down
```

The seed creates the required users, projects, tasks, activity logs, and notifications for testing.
