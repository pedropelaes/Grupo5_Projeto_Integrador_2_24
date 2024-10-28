import express from "express";
import {Request, Response, Router} from "express";
import { AccountsManager } from "./accounts/accounts";
import { FinancialManager } from "./financial/financial";
import { EventsManager } from "./events/events";


const port = 3000; 
const server = express();
const routes = Router();

// definir as rotas. 
// a rota tem um verbo/método http (GET, POST, PUT, DELETE)
routes.get('/', (req: Request, res: Response)=>{
    res.statusCode = 403;
    res.send('Acesso não permitido. Rota default não definida.');
});

routes.get('/login',AccountsManager.loginHandler, (req: Request, res: Response)=>{
    res.statusCode = 200;
    res.send('Aaadsadida.');
    AccountsManager.loginHandler
});

// vamos organizar as rotas em outro local 
routes.post('/signUp', AccountsManager.signUpHandler);
routes.post('/login',AccountsManager.loginHandler);
routes.post('/addNewEvent', EventsManager.createEventHandler);
routes.post('/getEvents', EventsManager.getEventHandler);
routes.post('/deleteEvent', EventsManager.deleteEventHandler);
routes.post('/evaluateNewEvent', EventsManager.evaluateNewEventHandler);
routes.post('/addFunds', FinancialManager.addFundsHandler);
routes.post('/withdrawFunds', FinancialManager.withdrawFundsHandler);
routes.post('/betOnEvent', EventsManager.betOnEventHandler);
routes.post('/finishEvent', EventsManager.finishEventHandler);
routes.post('/searchEvent', EventsManager.searchEventHandler);


server.use(routes);

server.listen(port, ()=>{
    console.log(`Server is running on: ${port}`);
})