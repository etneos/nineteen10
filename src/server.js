
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

let waitingPlayer = null;

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('Nuovo client connesso:', socket.id);

    socket.on('setNickname', (nickname) => {
        socket.nickname = nickname;

        if (waitingPlayer) {
            const room = 'room-' + socket.id + '-' + waitingPlayer.id;
            socket.join(room);
            waitingPlayer.join(room);

            io.to(room).emit('startGame', {
                players: [waitingPlayer.nickname, socket.nickname],
                room
            });

            waitingPlayer = null;
        } else {
            waitingPlayer = socket;
            socket.emit('waiting');
        }
    });

    socket.on('gameAction', ({ room, action }) => {
        socket.to(room).emit('gameAction', action);
    });

    socket.on('disconnect', () => {
        if (waitingPlayer === socket) {
            waitingPlayer = null;
        }
        console.log('Client disconnesso:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server avviato su http://localhost:${PORT}`);
});
