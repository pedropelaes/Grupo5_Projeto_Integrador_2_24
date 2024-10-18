import {Request, RequestHandler, Response} from "express";
import OracleDB from "oracledb";
import dotenv from "dotenv";
dotenv.config();
import conexao from "../connection";
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

}