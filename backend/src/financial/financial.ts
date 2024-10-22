import {Request, RequestHandler, Response} from "express";
import OracleDB from "oracledb";
import dotenv from "dotenv";
dotenv.config();
import conexao from "../connection";
import { unescape } from "querystring";
/*
tudo dentro desse módulo irá tratar de finanças na plataforma. Ex: 
Saldo de carteira, transferir dinheiro, 
*/

export namespace FinancialManager{

    export type wallet={
        wallet_id: number | undefined,
        saldo: number,
        user_id: number 
    };

    export async function getWallet(id: number): Promise<wallet[] | null>{
        const connection = await conexao();

        let buscarCarteira = await connection.execute(
            `SELECT * FROM WALLET WHERE ID_USUARIO = :id`,
            {
                id: id
            },
            {outFormat: OracleDB.OUT_FORMAT_OBJECT}
        )
        console.log("Buscando carteira", id);
        if(buscarCarteira && buscarCarteira.rows && buscarCarteira.rows.length > 0){
            console.log("Carteira encontrada", buscarCarteira.rows);
            return buscarCarteira.rows as wallet[];
        }else{
            return null;
        }
    }

    export async function addWallet(wallet: wallet){
        const connection = await conexao();

        let criarCarteira = await connection.execute(
            `INSERT INTO WALLET(ID_WALLET, SALDO, ID_USUARIO) VALUES(SEQ_WALLET.NEXTVAL, 0, :id_usuario)`,
            {
                id_usuario: wallet.user_id
            }
        )
        connection.commit();
        console.log("Carteira criada", criarCarteira);
    }
    
    export async function addFunds(wallet: wallet): Promise<number | null>{
        const connection = await conexao();

        let adicionarFundos = await connection.execute(
            `UPDATE WALLET
                SET SALDO = SALDO + :saldo
                WHERE ID_USUARIO = :id`,
                {
                    saldo: wallet.saldo,
                    id: wallet.user_id
                }
        )
        connection.commit();
        console.log("Fundos adicionados", adicionarFundos);
        return wallet.saldo as number;
    }
    
    export const addFundsHandler: RequestHandler = async (req: Request, res: Response) => {
        const fNumCartao = req.get("numero_do_cartao");
        const fCod = req.get("cvv");
        const fDataValidade = req.get("data_validade");
        const fNomeTitular = req.get("nome_titular");
        const fId = req.get("id");
        const fSaldo = req.get("saldo");

        const SALDO = fSaldo ? parseInt(fSaldo, 10): undefined;
        const ID = fId ? parseInt(fId, 10): undefined;

        if (fNumCartao && fCod && fDataValidade && fNomeTitular && ID && SALDO){
            const newWallet: wallet = {
                wallet_id: undefined,
                saldo: SALDO,
                user_id: ID
            }
            const carteira = await getWallet(ID);
            if(carteira !== null){
                const saldo = await addFunds(newWallet);
                res.statusCode = 200;
                res.send(`Saldo alterado. Adicionado ${saldo}`)
            }else{
                addWallet(newWallet);
                const saldo = await addFunds(newWallet);
                res.statusCode = 200;
                res.send(`Carteira criada e saldo alterado. Adicionado ${saldo}`)
            }
        }else{
            res.statusCode = 400;
            res.send("Parâmetros inválidos ou faltantes.");
        }
    }

    export async function withdrawnFunds(wallet_id: number, valor: number, modo: number): Promise<number | null>{
        //1 pra aposta, 2 pra saque
        const connection = await conexao();
        const checarFundos = await connection.execute(
            `SELECT SALDO FROM WALLET WHERE ID_WALLET = :wallet_id`,
            {wallet_id: wallet_id}
        );

        const saldoConta = (checarFundos.rows as any)[0][0];
        if(modo === 2){
            if(saldoConta !== undefined && saldoConta >= valor && valor <= 101000){
                let retirarFundos = await connection.execute(
                    `UPDATE WALLET
                        SET SALDO = SALDO - :valor
                        WHERE ID_WALLET = :wallet_id`,
                        {
                            valor: valor,
                            wallet_id: wallet_id
                        }
                )
                connection.commit();
                if(valor <= 100){
                    valor = valor - (valor*0.04);
                    console.log("Taxa: 4%"); 
                }else if(valor <=1000){
                    valor = valor - (valor*0.03);
                    console.log("Taxa: 3%"); 
                }else if(valor <=5000){
                    valor = valor - (valor*0.02);
                    console.log("Taxa: 2%"); 
                }else if(valor <=100000){
                    valor = valor - (valor*0.01);
                    console.log("Taxa: 1%"); 
                }

                console.log(`Valor sacado: ${valor}| Id da carteira: ${wallet_id}.` );
                return valor;
            }else if(saldoConta !== undefined && saldoConta >= valor && valor > 101000){
                console.log(`Valor limite de saque excedido. Valor:${valor}`);
                return valor;
            }else{
                console.log(`Impossivel sacar, saldo insuficiente.`);
                return null;
            }
        }else if(modo === 1){
            if(saldoConta !== undefined && saldoConta >= valor){
                let retirarFundos = await connection.execute(
                    `UPDATE WALLET
                        SET SALDO = SALDO - :valor
                        WHERE ID_WALLET = :wallet_id`,
                        {
                            valor: valor,
                            wallet_id: wallet_id
                        }
                )
                connection.commit();
                console.log(`Aposta realizada. Valor: ${valor}`);
                return valor;
            }else{
                console.log(`Erro ao realizar aposta. Saldo excedido.`);
                return null;
            }
        } 
        console.log(`Erro.`);
        return null;
    }

    export const withdrawFundsHandler: RequestHandler = async (req: Request, res: Response) => {
        const wValue = req.get("valor");
        const wIdWallet = req.get("id_carteira");

        const valor = wValue ? parseFloat(wValue): undefined;
        const id = wIdWallet ? parseInt(wIdWallet, 10): undefined;

        if (valor && id){
            const saldoRetirado = await withdrawnFunds(id, valor, 2);
            res.statusCode = 200;
            if(saldoRetirado !== null && saldoRetirado <= 101000){
                res.send(`Fundos retirados. Valor: R$${saldoRetirado}`);
            }else if(saldoRetirado !== null && saldoRetirado > 101000){
                res.send(`Valor limite de saque excedido(R$101.000)`);
            }else{
                res.send(`Erro ao retirar fundos.`)
            }
        }else{
            res.statusCode = 400;
            res.send("Parâmetros inválidos ou faltantes.");
        }
    }

}