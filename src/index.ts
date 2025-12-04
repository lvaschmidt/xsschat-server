import http from "http";
import { Server, Socket } from "socket.io";
import 'dotenv/config';
import { answer } from "./llm";

// Configuration
interface Config {
  port: number;
}

const config: Config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 80,
};

// const surveil = Boolean(process.env.SURVEIL)

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

    socket.on("rejoin", (data: RoomData) => {
      if (data.name) {
        room = data.room;
        name = data.name;
        socket.join(room);
        console.log(`${name.substr(0, 20)} rejoined room ${room.substr(0, 20)}.`)
      }
    });

    socket.on("ping", () => socket.emit("pong"));

    socket.on(
      "message",
      async (msg: { value: string; name: string; type: string }) => {
        if (room) {
          io.to(room).emit("message", msg);
          if (msg.value.startsWith("/ai ")) {
            const query = msg.value.substring(4);
            let firstBreak = query.indexOf('\n');
            let breakpoint = query.length < 80 ? 0 : (firstBreak > -1 ? Math.min(firstBreak, 80) : 80)
            const shortQuery = breakpoint ? query.substring(0, breakpoint) + "..." : query
            io.to(room).emit("message", { type: "chat", name: "AI™", value: `> ${shortQuery}\n${await answer(query)}` })
          } else if (msg.value.startsWith("/oom")) {
            let numbers = msg.value.split(" ").slice(1).map((n) => parseFloat(n)).filter((n) => !isNaN(n));
            if (numbers[0] && numbers[1]) {
              const result = Math.abs(Math.log10(numbers[0] / numbers[1]));
              io.to(room).emit("message", { type: "chat", name: "AI™", value: `The oom between ${numbers[0]} and ${numbers[1]} is ${result.toFixed(2)}.` });
            } else {
              io.to(room).emit("message", { type: "chat", name: "AI™", value: `That's not numbers you idiot.` });
            }
          }
          // if (surveil) {
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
