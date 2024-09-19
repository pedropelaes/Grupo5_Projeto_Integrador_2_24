import http from "http";

const port: number= 3000;

const server = http.createServer((req, resp)=>{
    if(req.url == "/signUp"){
        resp.writeHead(200,{'content-type':'text/plain'});
        resp.end('Tela de cadastro');
    }else if(req.url=="/login"){
        resp.writeHead(200,{'content-type':'text/plain'});
        resp.end('Tela de login');
    }else if(req.url=="/addNewEvent"){
        resp.writeHead(200,{'content-type':'text/plain'});
        resp.end('Criar novo evento');
    }else if(req.url=="/getEvents"){
        resp.writeHead(200,{'content-type':'text/plain'});
        resp.end('Mostrar eventos');
    }else if(req.url=="/deleteEvent"){
        resp.writeHead(200,{'content-type':'text/plain'});
        resp.end('Apagar eventos');
    }else if(req.url=="/evaluateNewEvent"){
        resp.writeHead(200,{'content-type':'text/plain'});
        resp.end('Avaliação de evento');
    }else if(req.url=="/addFunds"){
        resp.writeHead(200,{'content-type':'text/plain'});
        resp.end('Adicionar fundos');
    }else if(req.url=="/withdrawFunds"){
        resp.writeHead(200,{'content-type':'text/plain'});
        resp.end('Sacar os fundos');
    }else if(req.url=="/betOnEvent"){
        resp.writeHead(200,{'content-type':'text/plain'});
        resp.end('Apostar');
    }else if(req.url=="/finishEvent"){
        resp.writeHead(200,{'content-type':'text/plain'});
        resp.end('Finalizar aposta');
    }else if(req.url=="/searchEvent"){
        resp.writeHead(200,{'content-type':'text/plain'});
        resp.end('Buscar evento');
    }else{
        resp.writeHead(404,{'content-type':'text/plain'});
        resp.end('Nao encontrado');
    }
});

server.listen(port,()=>{
    console.log(`Servidor rodando na porta ${port}`);
});