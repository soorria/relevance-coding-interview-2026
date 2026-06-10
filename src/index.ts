import express from "express";
import { loadAllLogs } from "./load-logs";

console.log("Starting application");

const PORT = 3000;

function bootstrap() {
  const logs = loadAllLogs();

  const app = express();
  // Middlewares
  // app.use()

  app.get("/", (req, res) => {
    res.send("Service UP!");
  });

  app.get("/users", (req, res) => {
    res.send([]);
  });

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

bootstrap();
