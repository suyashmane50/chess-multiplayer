const express=require('express');
const app=express();
const socket=require('socket.io');
const http=require('http');
const {Chess}=require('chess.js');
const path=require('path');
const { log } = require('console');

const server=http.createServer(app);
const io=socket(server);

const chess=new Chess();
let player={};
let currentPlayer="w";

app.set("view engine",'ejs')
app.use(express.static(path.join(__dirname,'public')));

app.get('/', (req,res)=>{
    res.render('index',{title:'Chess Game'})
});

io.on('connection',function(uniqueSocket){
    console.log('connected');
    if(!player.white){
        player.white=uniqueSocket.id;
        uniqueSocket.emit('playerRole','w')
    }else if(!player.black){
        player.black=uniqueSocket.id;
        uniqueSocket.emit('playerRole','b')
    }else{
        uniqueSocket.emit('spectatorRole')
    }
     uniqueSocket.on("restartGame", () => {
        chess.reset(); // Reset the board
        io.emit("boardState", chess.fen()); // Send fresh board state to all
        console.log("Game restarted");
    });
    uniqueSocket.on('disconnect',function(){
        if(uniqueSocket.id===player.white){
            delete player.white;
        } else if(uniqueSocket.id===player.black){
            delete player.black;
        }
    });
    uniqueSocket.on('move',(move=>{
        try{
            if(chess.turn==='w'&& uniqueSocket.id !==player.white)return
            if(chess.turn==='b'&& uniqueSocket.id !==player.black)return
            const result=chess.move(move);
            if(result){
                currentPlayer=chess.turn();
                io.emit('move',move);
                io.emit('boardState',chess.fen());
            }else{
                console.log("Invalid Move: ",move);
                uniqueSocket.emit("Invalid Move: ",move);
            }
        }catch(err) {
            console.log("Server error during move:", err);
            uniqueSocket.emit("invalidMove", move);
        }
    }));    

});
server.listen(3000,function(req,res){
    console.log('working')
});