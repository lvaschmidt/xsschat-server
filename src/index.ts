import http from "http";
import { Server, Socket } from "socket.io";
import * as dotenv from "dotenv";
import { answer } from "./llm";

// Configuration
interface Config {
  port: number;
}

const config: Config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 80,
};

interface RoomData {
  room: string;
  name: string;
}

// Configure and init Socket.IO
function configureSocketIO(server: http.Server): Server {
  const io = new Server(server, {
    maxHttpBufferSize: 1e8,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    perMessageDeflate: true,
  });

  io.on("connection", (socket: Socket) => {
    let room: string | null = null;
    let name: string | null = null;

    socket.on("join", (data: RoomData) => {
      if (data.name) {
        room = data.room;
        name = data.name;
        socket.join(room);
        io.to(room).emit("user-connected", `${name} has connected.`);
        console.log(`${name.substr(0, 20)} joined room ${room.substr(0, 20)}.`)
      }
    });

    socket.on(
      "message",
      async (msg: { value: string; name: string; type: string }) => {
        if (room) {
          io.to(room).emit("message", msg);
          if (msg.value.startsWith("/ai ")) {
            const query = msg.value.substring(4)
            io.to(room).emit("message", { type: "chat", name: "AI™", value: `> ${query}\n${await answer(query)}` })
          }
          // if (process.env.NODE_ENV == "development") {
          //   console.log(`${msg.name}: ${msg.value}`);
          // }
        }
      }
    );

    socket.on("disconnect", (reason) => {
      if (room && name) {
        io.to(room).emit("user-disconnected", `${name} has disconnected.`);
        console.log(`${name.substr(0, 20)} disconnected from room ${room.substr(0, 20)}.`)
      }
    });
  });

  return io;
}

// Main function
async function main() {
  dotenv.config();
  const httpServer = http.createServer(async (req, res) => {
    if (req.url === "/health") {
      res.writeHead(200);
      res.end("Server is up.");
    }
  });

  const io = configureSocketIO(httpServer);

  httpServer.listen(config.port, () => {
    console.log(`Socket.IO server running on port ${config.port}!`);
  });
}

main();
