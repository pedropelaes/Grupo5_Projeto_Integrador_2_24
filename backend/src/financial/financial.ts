import {Request, RequestHandler, Response} from "express";
/*
tudo dentro desse módulo irá tratar de finanças na plataforma. Ex: 
Saldo de carteira, transferir dinheiro, 
*/

export namespace FinancialManager{
    const w1:Wallet = {
        ownerEmail: "pedro@puc.edu.br",
        balance: 0
    }

    const w2: Wallet ={
        ownerEmail: "jose@puc.edu.br",
        balance: 1000
    }

    let walletDatabase: Wallet[] = [];
    walletDatabase.push(w1);
    walletDatabase.push(w2);
    
    export type Wallet={
        ownerEmail: string;
        balance: number;
    };

    export type deposit = {
        walletOwnerEmail: string;
        value: number;
    }
    
    export type InternarlWihdrawn ={
        walletEmailFrom: string;
        walletEmailTo: string;
        value: number;
    }
    
    export type ExternalWithdrawn = {
        walletEmailRequester: string;
        value: number;
    }

    export function getWalletBalance(email: string): number | undefined{
        let balance = undefined;
        walletDatabase.find(w=>{
            if(w.ownerEmail===email){
                balance = w.balance;
                return;
            }
        });
        return balance;
    }

    export const getWalletBalanceHandler: RequestHandler = (req: Request, res: Response) => {
        //implementar
    }
    /* 
    Ex1. Implementar o tratador da rota de saldo
    Ex2. Implementar o processo de transferencia de valor de uma conta para outra(verificando se tem SALDO).
    */

}