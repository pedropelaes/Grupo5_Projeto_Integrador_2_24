import {Request, RequestHandler, Response} from "express";
import OracleDB, { dbObjectAsPojo } from "oracledb";
import dotenv from 'dotenv';
import { getActiveResourcesInfo } from "process";
import { escape } from "querystring";
import conexao from "../connection";
import { FinancialManager } from "../financial/financial";
import { AccountsManager } from "../accounts/accounts";
import { fstat } from "fs";
dotenv.config();

export namespace EventsManager {
    export type event={
        id_evento: number | undefined,
        titulo: string,
        descricao: string,
        data_inicio: string,
        data_fim: string,
        data_evento: string,
        status: string | undefined,
        valor_cota: number,
    }
    
    export async function salvarevento(event: event){

    const connection= await conexao()

        let criareventos = await connection.execute(
            `INSERT INTO EVENTOS(ID_EVENTO, TITULO, DESCRICAO, DATA_INICIO, DATA_FIM, DATA_EVENTO, STATUS, VALORCOTA, QUANTIDADECOTAS, TOTAL_APOSTA) 
            VALUES(SEQ_EVENTO.NEXTVAL, UPPER(:titulo), UPPER(:descricao), :data_inicio, :data_fim, :data_evento, 'em analise', :valor_cota, 0, 0)`,
            {
                titulo: event.titulo,
                descricao: event.descricao,
                data_inicio: event.data_inicio,
                data_fim: event.data_fim,
                data_evento: event.data_evento,
                valor_cota: event.valor_cota
            },
        )
        connection.commit();
        console.log("Evento criado e cadastrado no banco,", criareventos);
    }
    
    export const createEventHandler: RequestHandler=(req: Request, res:Response)=>{
        const eTitulo = req.get("titulo");
        const eDesc = req.get("descricao");
        const eDataInicio = req.get("datainicio");
        const eDataFim = req.get("datafim");
        const eDataEvento = req.get("dataevento");
        const eValorCota = req.get("cota");

        const VC = eValorCota ? parseInt(eValorCota, 10): undefined; //converte a requisição do valor da cota para numero   
        
        if(eTitulo && eDesc && eDataInicio && eDataFim && eDataEvento  && VC !== undefined && VC > 1){
            const novoevento:event = {
                id_evento: undefined,
                titulo: eTitulo,
                descricao: eDesc,
                data_inicio: eDataInicio,
                data_fim: eDataFim,
                data_evento: eDataEvento,
                status: undefined,
                valor_cota: VC
            }
            salvarevento(novoevento);
            res.statusCode = 200;
            res.send(`Novo evento criado. Titulo: ${eTitulo}`);
        }else{
            res.statusCode=400;
            res.send("Parâmetros invalidos ou faltantes.");
        }
    }

    export async function getEvent(busca: string, req:string): Promise<event[] | null>{
        const connection= await conexao()
        let buscarevento;
        if(req === "status"){
            buscarevento = await connection.execute(
                `SELECT * FROM EVENTOS WHERE STATUS = :status`,
                {
                    status: busca,
                },
                {outFormat: OracleDB.OUT_FORMAT_OBJECT}
            ) 
        }else if(req === "titulo"){
            buscarevento = await connection.execute(
                `SELECT * FROM EVENTOS WHERE TITULO = :titulo`,
                {
                    titulo: busca,
                },
                {outFormat: OracleDB.OUT_FORMAT_OBJECT}
            ) 
        }
        
        console.log("Busca: ", busca);
        if(buscarevento && buscarevento.rows && buscarevento.rows.length > 0){
            return buscarevento.rows as event[];
        }else{
            return null;
        }
    }

    export const getEventHandler: RequestHandler=async(req: Request, res:Response)=>{
        const gStatus = req.get("status");
        const gTitulo = req.get("titulo");

        if(gStatus ){
            const busca = await getEvent(gStatus, "status");
            res.status(200).json({"Resultado da busca":busca});
        }else if(gTitulo){
            const busca = await getEvent(gTitulo, "titulo");
            res.status(200).json({"Resultado da busca":busca});
        }
        else{
            res.statusCode=400;
            res.send("Parâmetros invalidos ou faltantes");
        }
    }

    export async function deletarEvento(titulo: string){
        const connection= await conexao()
        const apagarEvento = await connection.execute(
            `UPDATE EVENTOS 
                SET STATUS = 'Apagado' 
                WHERE TITULO = :titulo `,
        {
            titulo: titulo,
        })
        connection.commit();
        console.log("Evento apagado. ", apagarEvento);
    }

    export const deleteEventHandler: RequestHandler=(req: Request, res:Response)=>{
        const dTitulo = req.get("titulo");
        
        if(dTitulo){
            deletarEvento(dTitulo);
            res.statusCode = 200;
            res.send(`Evento deletado. Titulo: ${dTitulo}`);
        }else{
            res.statusCode = 400;
            res.send("Parâmetros invalidos ou faltantes");
        }
    }

    export async function evaluateEvent(id:number, evaluate:string): Promise<any>{
        const connection= await conexao()
        if(evaluate === "aprovado"){
            const avaliarEvento = await connection.execute(
                `UPDATE EVENTOS 
                    SET STATUS = 'APROVADO' 
                    WHERE ID_EVENTO = :id_evento `,
                {
                    id_evento: id,
                }
            )
            console.log("Aposta aprovada.");
            connection.commit();
            return true;
        }
        else if(evaluate === "reprovado"){
            const avaliarEvento = await connection.execute(
                `UPDATE EVENTOS 
                    SET STATUS = 'REPROVADO' 
                    WHERE ID_EVENTO = :id_evento `,
                {
                    id_evento: id,
                }
            )   
            console.log("Aposta reprovada.");
            connection.commit();
            return true;
        }
        else{
            console.log("Avaliação invalida.");
            return false;
        }
        
    }
    
    export const evaluateNewEventHandler: RequestHandler = async (req: Request, res:Response)=>{
        const eId = req.get("id_evento");
        const eEvaluate = req.get("evaluate");
        const fEmail = req.get("email_adm");
        const fSenha = req.get("senha_adm");

        const ID = eId ? parseInt(eId, 10): undefined;
        
        if(ID && eEvaluate && fEmail && fSenha){
            const loginADM = await AccountsManager.loginADM(fEmail, fSenha);
            if(loginADM !== null){
                const avaliacao = await evaluateEvent(ID, eEvaluate);
                if(avaliacao === true){
                    res.statusCode = 200;
                    res.send(`Evento avaliado.`);
                }else{
                    res.statusCode = 400;
                    res.send(`Avaliação Invalida.`);
                }
            }else{
                res.statusCode = 401;
                res.send(`Acesso Negado.`);
            }
        }else{
            res.statusCode = 400;
            res.send("Parâmetros invalidos ou faltantes");
        }
    }

    export async function getEventStatus(id_evento:number): Promise<any>{
        const connection = await conexao();
        let statusEvento = await connection.execute(
            `SELECT STATUS
             FROM EVENTOS
             WHERE ID_EVENTO = :id_evento`,
            {id_evento: id_evento}
        )
        return (statusEvento.rows as any)[0][0];
    }

    export async function betOnEvent(email: string, cotas: number, id_evento: number, opcao: string):Promise<boolean>{ 
        if(await getEventStatus(id_evento) === "APROVADO"){
            const connection = await conexao();
            const getUserId = await connection.execute(
                `SELECT ID_USUARIO FROM USUARIO WHERE EMAIL = :email`,
                {email: email}
            )

            const id_usuario = (getUserId.rows as any)[0][0];
            console.log(`Id usuario buscado: ${id_usuario}`);

            const getWalletId = await connection.execute(
                `SELECT ID_WALLET FROM WALLET WHERE ID_USUARIO = :id_usuario`,
                {id_usuario: id_usuario}
            )

            const id_carteira = (getWalletId.rows as any)[0][0];
            console.log(`Id carteira buscado: ${id_carteira}`);

            const getValorCotas = await connection.execute(
                `SELECT VALORCOTA FROM EVENTOS WHERE ID_EVENTO = :id_evento`,
                {id_evento: id_evento}
            )

            let updateQtdCotas = await connection.execute(
                `UPDATE EVENTOS
                    SET QUANTIDADECOTAS = QUANTIDADECOTAS + :qtd_cotas
                    WHERE ID_EVENTO = :id_evento`,
                {
                    qtd_cotas: cotas,
                    id_evento: id_evento
                }
            )
            console.log(`Quantidade de cotas atualizada: ${cotas}`, updateQtdCotas); 

            const valorCotas = (getValorCotas.rows as any)[0][0] * cotas;
            console.log(`Valor das cotas: ${valorCotas}`);
            
            let updateTotalValue = await connection.execute(
                `UPDATE EVENTOS
                    SET TOTAL_APOSTA = TOTAL_APOSTA + :valor
                    WHERE ID_EVENTO = :id_evento`,
                {
                    valor: valorCotas,
                    id_evento: id_evento
                }
            )
            console.log(`Valor total das apostas do evento atualizado.`, updateTotalValue);
            
            const aposta = await FinancialManager.withdrawnFunds(id_carteira, valorCotas, 1);
            if(aposta !== null){
                opcao = opcao.toLowerCase();
                let opt:number;
                if(opcao === "sim"){
                    opt = 1;
                    console.log("Escolha: Sim.");
                }else if(opcao === "não"){
                    opt = 0;
                    console.log("Escolha: Não.")
                }else{
                    console.log(`Erro ao realizar aposta.`);
                    return false;
                }

                let saveBet= await connection.execute(
                    `INSERT INTO HISTORICO_APOSTAS(ID_APOSTA, FK_ID_USUARIO, FK_ID_EVENTO, FK_ID_WALLET, HORA_APOSTA, DATA_APOSTA, COTAS, VALOR, OPCAO_APOSTA )
                        VALUES(SEQ_HIST_APOSTAS.NEXTVAL, :id_usuario, :id_evento, :id_carteira, SYSTIMESTAMP, SYSDATE, :cotas, :valor, :opcao)`,
                    {
                        id_evento: id_evento,
                        id_carteira: id_carteira,
                        valor: valorCotas,
                        opcao: opt,
                        id_usuario: id_usuario,
                        cotas: cotas
                    }
                )
                console.log(`Aposta salva no histórico.`, saveBet);
                connection.commit();
                console.log(`Aposta realizada. Valor das cotas: ${valorCotas}`);
                return true;
            }
            else{
                console.log(`Erro ao realizar aposta.`);
                return false;
            }
        }else{
            console.log(`Erro ao realizar aposta.`);
            return false;
        }
            
    }
    
    export const betOnEventHandler: RequestHandler = async (req:Request, res:Response)=>{
        const bEmail = req.get("email");
        const bIdEvento = req.get("evento");
        const bCotas = req.get("quantidade_cotas");
        const bEscolha = req.get("escolha");

        const id_evento = bIdEvento ? parseInt(bIdEvento, 10): undefined;
        const qtd_cotas = bCotas ? parseInt(bCotas, 10): undefined;
        
        if(bEmail && id_evento && qtd_cotas &&bEscolha){
            const bet = await betOnEvent(bEmail, qtd_cotas, id_evento, bEscolha);
                if(bet === true){
                res.statusCode = 200;
                res.send(`Aposta realizada. Cotas:${qtd_cotas}.`);
            }else{
                res.statusCode = 406;
                res.send(`Erro ao realizar aposta.`);
            }
        }else{
            res.statusCode = 400;
            res.send(`Parâmetros invalidos ou faltantes`)
        }
    }

    export async function searchEvent(keyWord: string): Promise<any>{
        const connection = await conexao();

        let searchEvent;
        keyWord = `%${keyWord}%`;
        searchEvent = await connection.execute(
            `SELECT ID_EVENTO, TITULO, DESCRICAO, DATA_INICIO, DATA_FIM, DATA_EVENTO, STATUS, VALORCOTA, RESULTADO_EVENTO 
            FROM EVENTOS 
            WHERE DESCRICAO LIKE UPPER(:keyword) OR TITULO LIKE UPPER(:keyword)`,
            {
                keyword: keyWord,
            },
            {outFormat: OracleDB.OUT_FORMAT_OBJECT}
        ) 
        console.log(`Busca realizada: ${keyWord}`)

        if(searchEvent && searchEvent.rows && searchEvent.rows.length > 0){
            return searchEvent.rows;
        }else{
            return null;
        }
    }     

    export const searchEventHandler: RequestHandler = async (req:Request, res:Response)=>{
        const sPesquisa = req.get("pesquisa");

        if(sPesquisa){
            const search = await searchEvent(sPesquisa);
            res.status(200).json({"Resultado da busca":search});
        }else{
            res.statusCode = 400;
            res.send(`Parâmetros invalidos ou faltantes`);
        }
    }

    

    export async function finishEvent(id_evento: number, resultado: string): Promise<any> {
        if(await getEventStatus(id_evento) == "FINALIZADO"){
            console.log(`Evento ${id_evento} já finalizado.`);
            return null;
        }

        const connection = await conexao();
        resultado = resultado.toUpperCase();
        let resultado_aposta: number;
        if(resultado === "SIM"){
            console.log(`Resultado do evento id:${id_evento}: ${resultado}`);
            resultado_aposta = 1;
        }else if(resultado === "NÃO"){
            console.log(`Resultado do evento id:${id_evento}: ${resultado}`);
            resultado_aposta = 0;
        }else{
            console.log(`Resultado invalido. Erro ao finalizar evento.`);
            return null;
        }
        
        let finalizarEvento = await connection.execute(
            `UPDATE EVENTOS
                SET STATUS = 'FINALIZADO',
                    RESULTADO_EVENTO = :resultado
                WHERE ID_EVENTO = :id_evento`,
                {
                    resultado: resultado,
                    id_evento: id_evento
                }
        )
        connection.commit();
        console.log(`Evento finalizado. Id_evento: ${id_evento}`, finalizarEvento);

        let apostasSim = await connection.execute(
            `SELECT SUM(COTAS), SUM(VALOR) FROM HISTORICO_APOSTAS
             WHERE OPCAO_APOSTA = 1 AND FK_ID_EVENTO = :id_evento`,
            {id_evento: id_evento}
        )
        const cotasSim = (apostasSim.rows as any)[0][0];
        const valorSim = (apostasSim.rows as any)[0][1];

        let apostasNao = await connection.execute(
            `SELECT SUM(COTAS), SUM(VALOR) FROM HISTORICO_APOSTAS
             WHERE OPCAO_APOSTA = 0 AND FK_ID_EVENTO = :id_evento`,
            {id_evento: id_evento}
        )
        const cotasNao = (apostasNao.rows as any)[0][0];
        const valorNao = (apostasNao.rows as any)[0][1];
        console.log(`Quantidade de cotas não: ${cotasNao} | Quantidade de cotas sim: ${cotasSim}`);
        console.log(`Valor total de nao: ${valorNao} | Valor total de sim: ${valorSim}`);

        let apostasVencedoras = await connection.execute(
            `SELECT ID_APOSTA, FK_ID_USUARIO, FK_ID_WALLET, COTAS, VALOR
             FROM HISTORICO_APOSTAS
             WHERE OPCAO_APOSTA = :resultado_aposta AND FK_ID_EVENTO = :id_evento`,
             {
                resultado_aposta: resultado_aposta,
                id_evento: id_evento
             }
        )
        let cotasVencedoras:number;
        let valorPerdedor:number;
        if(resultado_aposta === 0){
            cotasVencedoras = cotasNao;
            valorPerdedor = valorSim;
        }else{
            cotasVencedoras = cotasSim;
            valorPerdedor = valorNao;
        }
        console.log(apostasVencedoras.rows);
        const qnt_vencedores = (apostasVencedoras.rows?.length as any);
        
        let valor_vencedor:number;
        for(let i = 0; i<qnt_vencedores; i++){  // 0:id_aposta | 1:id_usuario | 2: id_wallet | 3: total de cotas | 4: Valor vencedor
            valor_vencedor =(apostasVencedoras.rows as any)[i][4] + ((apostasVencedoras.rows as any)[i][3] / cotasVencedoras) * valorPerdedor;
            let premiarVencedor = await connection.execute(
                `UPDATE WALLET
                    SET SALDO = SALDO + :valor_vencedor
                    WHERE ID_USUARIO = :id_vencedor`,
                    {
                        valor_vencedor: valor_vencedor,
                        id_vencedor: (apostasVencedoras.rows as any)[i][1]
                    }
            )
            await connection.commit();
            console.log(`Usuario premiado: ${(apostasVencedoras.rows as any)[i][1]} | Valor: ${valor_vencedor} | Id da aposta: ${(apostasVencedoras.rows as any)[i][0]}`);
            FinancialManager.addTransferHistory("PREMIAÇÃO", (apostasVencedoras.rows as any)[i][2], valor_vencedor);
            return true;
        }

    }
    
    export const finishEventHandler: RequestHandler = async (req:Request, res:Response)=>{
        const fIdEvento = req.get("id_evento");
        const fEmail = req.get("email_adm");
        const fSenha = req.get("senha_adm");
        const fResultadoEvento = req.get("resultado");
        
        const id = fIdEvento ? parseInt(fIdEvento, 10): undefined;
        
        if (id && fEmail && fSenha && fResultadoEvento){
            const loginAdm = await AccountsManager.loginADM(fEmail, fSenha);
            if(loginAdm !== null){
                const evento = await finishEvent(id, fResultadoEvento);
                if(evento !== null){
                    res.statusCode = 200;
                    res.send(`Aposta finalizada. ID:${id}`);
                }else{
                    res.statusCode = 406;
                    res.send(`Aposta já finalizada. ID:${id}`);
                }
            }else{
                res.statusCode = 406;
                res.send(`Conta de moderador não existente.`);
            }

        }else{
            res.statusCode = 400;
            res.send(`Parâmetros invalidos ou faltantes`);
        }
    }
}