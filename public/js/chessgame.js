const socket = io();
const chess=new Chess();
const boardElement=document.querySelector('.chessboard')

let draggedPiece=null;
let sourceSquare=null;
let playerRole=null;
document.getElementById("restartBtn").addEventListener("click", () => {
    socket.emit("restartGame");
});

const renderBoard=()=>{
    const board=chess.board();
    boardElement.innerHTML="";
    board.forEach((row,rowindex) => {
        row.forEach((square,squareindex)=>{
            const squareElement=document.createElement('div');
            squareElement.classList.add(
                'square',
                (rowindex+squareindex)%2===0 ?'light':'dark'
            );
            squareElement.dataset.row=rowindex;
            squareElement.dataset.col=squareindex;

            if(square){
                const pieceElement=document.createElement('div');
                pieceElement.classList.add('piece',square.color==='w'?'white':'black');
                pieceElement.innerText=getPieceUnicode(square);
                pieceElement.draggable=playerRole===square.color;
                pieceElement.addEventListener('touchstart', (e) => {
                    draggedPiece = pieceElement;
                    sourceSquare = { row: rowindex, col: squareindex };
                    e.preventDefault(); // Prevent scroll
                });

                squareElement.addEventListener('touchend', (e) => {
                    if (draggedPiece) {
                        const targetSource = {
                            row: parseInt(squareElement.dataset.row),
                            col: parseInt(squareElement.dataset.col),
                        };
                        handleMove(sourceSquare, targetSource);
                        draggedPiece = null;
                        sourceSquare = null;
                    }
                });

                pieceElement.addEventListener('dragstart',(e)=>{
                    if(pieceElement.draggable){
                        draggedPiece=pieceElement;
                        sourceSquare={row:rowindex,col:squareindex}
                        e.dataTransfer.setData('text/plain','');
                    }
                });
                pieceElement.addEventListener('dragend', (e) => {
                    draggedPiece=null;
                    sourceSquare=null;
                });
                squareElement.appendChild(pieceElement);
            }
            squareElement.addEventListener('dragover' ,function(e){
                e.preventDefault();
            });
            squareElement.addEventListener('drop',function(e){
                e.preventDefault();
                if(draggedPiece){
                    const targetSource={
                        row:parseInt(squareElement.dataset.row),
                        col:parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceSquare,targetSource)
                }
            });
                boardElement.appendChild(squareElement);
        });
    });
    if(playerRole==='b'){
        boardElement.classList.add("flipped")
    }
    else{
        boardElement.classList.remove("flipped")
    }
};  
const handleMove = (source, target) => {
    // Don't send move if source and target are same
    if (source.row === target.row && source.col === target.col) return;

    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q',
    };
    socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        p: "♟",
        r: "♜",
        n: "♞",
        b: "♝",
        q: "♛",
        k: "♚",
        P: "♙",
        R: "♖",
        N: "♘",
        B: "♗",
        Q: "♕",
        K: "♔",
    };

    const type = piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase();
    return unicodePieces[type] || "";
};

socket.on("playerRole",function(role){
    playerRole=role;
    renderBoard();
});
socket.on("spectatorRole",function(){
    playerRole=null;
    renderBoard();
});
socket.on("boardState",function(fen){
    chess.load(fen);
    renderBoard();
});
socket.on("move",function(move){
    chess.move(move);
    renderBoard();
});
renderBoard();
