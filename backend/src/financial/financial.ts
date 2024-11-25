import {Request, RequestHandler, Response} from "express";
import OracleDB from "oracledb";
import dotenv from "dotenv";
dotenv.config();
import conexao from "../connection";
import { unescape } from "querystring";
import { AccountsManager } from "../accounts/accounts";
/*
tudo dentro desse módulo irá tratar de finanças na plataforma. Ex: 
Saldo de carteira, transferir dinheiro, 
*/

export namespace FinancialManager{

    type wallet={
        wallet_id: number | undefined,
        saldo: number,
        user_id: number 
    };

    export async function addTransferHistory(tipo: string, id_wallet: number, valor: number,){
        const connection = await conexao();

        let atualizarTransacao = await connection.execute(
            `INSERT INTO TRANSACAO(ID_TRANSACAO, FK_ID_WALLET, TIPO_TRANSACAO, DATA_TRANSACAO, HORA_TRANSACAO, VALOR)
                VALUES(SEQ_HIST_TRANSACAO.NEXTVAL, :id_wallet, :tipo, SYSDATE, SYSTIMESTAMP, :valor)`,
            {
                id_wallet: id_wallet,
                valor: valor,
                tipo: tipo
            }
        )
        connection.commit();
        console.log(`Histórico de transações atualizado. Valor:R$${valor} | Tipo:${tipo}`);
    }

    async function getWalletId(id: number): Promise<any>{
        const connection = await conexao();

        let buscarCarteira = await connection.execute(
            `SELECT * FROM WALLET WHERE ID_USUARIO = :id`,
            {
                id: id
            }
        )
        console.log("Buscando carteira", id);
        if(buscarCarteira && buscarCarteira.rows && buscarCarteira.rows.length > 0){
            console.log("Carteira encontrada", buscarCarteira.rows);
            return ((buscarCarteira.rows as any)[0][0]);
        }else{
            return null;
        }
    }

    async function addWallet(wallet: wallet){
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
    
    async function addFunds(wallet: wallet): Promise<number | null>{
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
        await addTransferHistory("DEPÓSITO", (await getWalletId(wallet.user_id) as unknown as number), wallet.saldo);
        return wallet.saldo as number;
    }
    
    export const addFundsHandler: RequestHandler = async (req: Request, res: Response) => {
        const fNumCartao = req.get("numero_do_cartao");
        const fCod = req.get("cvv");
        const fDataValidade = req.get("data_validade");
        const fNomeTitular = req.get("nome_titular");
        const fSaldo = req.get("saldo");
        
        const SALDO = fSaldo ? parseInt(fSaldo, 10): undefined;

        if (fNumCartao && fCod && fDataValidade && fNomeTitular && SALDO){
            if(await AccountsManager.checkToken(AccountsManager.last_token as string)){
                const ID: number = ( await AccountsManager.checkToken(AccountsManager.last_token as string) as unknown as number);
                const newWallet: wallet = {
                    wallet_id: undefined,
                    saldo: SALDO,
                    user_id: ID
                }
                const id_carteira = await getWalletId(ID);
                
                if(id_carteira !== null){
                    const saldo = await addFunds(newWallet);
                    res.statusCode = 200;
                    res.send(`Saldo alterado. Adicionado ${saldo}`)
                }else{
                    await addWallet(newWallet);
                    const saldo = await addFunds(newWallet);
                    res.statusCode = 200;
                    res.send(`Carteira criada e saldo alterado. Adicionado ${saldo}`)
                }
            }else{
                res.statusCode = 401;
                res.send(`Permissão negada.`);
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

        let checarTotalSaqueDia = await connection.execute(
            `SELECT SUM(VALOR)
             FROM TRANSACAO
             WHERE FK_ID_WALLET = :id_wallet 
             AND TRUNC(DATA_TRANSACAO) = TRUNC(SYSDATE)
             AND TIPO_TRANSACAO = 'SAQUE'`,
            {id_wallet: wallet_id}
        )

        if((checarTotalSaqueDia.rows as any)[0][0] + valor > 101000){
            console.log("Valor limite de saque diario excedido.")
            return null;
        }
        console.log((checarFundos.rows as any));
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
                await addTransferHistory("SAQUE", wallet_id, valor);
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

        const valor = wValue ? parseFloat(wValue): undefined;

        if (valor){
            if(await AccountsManager.checkToken(AccountsManager.last_token as string)){
                const id = (await AccountsManager.checkToken(AccountsManager.last_token as string) as unknown as number);
                console.log(id);
                const id_carteira = await getWalletId(id);
                const saldoRetirado = await withdrawnFunds(id_carteira, valor, 2);
                if(saldoRetirado !== null && saldoRetirado <= 101000){
                    res.statusCode = 200;
                    res.send(`Fundos retirados. Valor: R$${saldoRetirado}`);
                }else if(saldoRetirado !== null && saldoRetirado > 101000){
                    res.statusCode = 422;
                    res.send(`Valor limite de saque excedido(R$101.000)`);
                }else{
                    res.statusCode = 422;
                    res.send(`Erro ao retirar fundos. Valor não permitido.`)
                }
            }else{
                res.statusCode = 401;
                res.send("Permissão negada.");
            }
        }else{
            res.statusCode = 400;
            res.send("Parâmetros inválidos ou faltantes.");
        }
    }

    async function getWalletInfo(token: string | null): Promise<any>{
        if(token == null){
            return false;
        }else{
            const connection = await conexao();

            const getUserId = await connection.execute(
                `SELECT ID_USUARIO FROM USUARIO WHERE TOKEN_SESSAO = :token`,
                {token: token}
            )
            console.log(`User id: ${getUserId.rows}`);
            const user_id = (getUserId.rows as any)[0][0]
            const id_carteira = await getWalletId(user_id)
            console.log(`Wallet id: ${id_carteira} ${typeof id_carteira}`);

            const getFinancialInfo = await connection.execute(
                `SELECT TO_CHAR(w.SALDO, '9999999990.00'), ht.ID_TRANSACAO, ht.TIPO_TRANSACAO, TO_CHAR(ht.DATA_TRANSACAO, 'DD-MM-YYYY'), TO_CHAR(ht.HORA_TRANSACAO, 'HH24:MI:SS'), ht.VALOR
                FROM WALLET w
                        JOIN TRANSACAO ht ON w.ID_WALLET = ht.FK_ID_WALLET
                WHERE w.ID_WALLET = :id_wallet
                ORDER BY ht.DATA_TRANSACAO DESC, ht.HORA_TRANSACAO DESC`,
                
                {id_wallet: id_carteira}
            )
            //0-saldo 1-id_Transacao 2-tipo 3-data 4-hora 5-valor

            const getBetsInfo = await connection.execute(
                `SELECT TO_CHAR(a.DATA_APOSTA, 'DD-MM-YYYY'), TO_CHAR(ha.HORA_APOSTA, 'HH24:MI:SS'), e.TITULO, a.VALOR, 
                 CASE 
                    WHEN a.OPCAO_APOSTA = 1 THEN 'Sim'
                    WHEN a.OPCAO_APOSTA = 0 THEN 'Não'
                 END AS OPCAO_APOSTA
                 FROM APOSTA a
                    JOIN EVENTOS e ON a.FK_ID_EVENTO = e.ID_EVENTO
                 WHERE a.FK_ID_USUARIO = :id_user
                 ORDER BY a.DATA_APOSTA DESC, a.HORA_APOSTA DESC`,
                {id_user: user_id}
            )
            //0-data 1-hora 2-titulo 3-valor 4-escolha
            
            return{ 
                financialInfo: getFinancialInfo.rows as any, 
                betsInfo: getBetsInfo.rows as any 
            };
        }

    }

    export const walletHandler: RequestHandler = async (req: Request, res: Response) => {
        const token = AccountsManager.last_token;
        const result = await getWalletInfo(token);
        console.log(result);
        if(result === false){
            res.statusCode = 401;
            res.send(`Login não executado`);
        }else{
            res.status(200).json(result);

        }
    }

}