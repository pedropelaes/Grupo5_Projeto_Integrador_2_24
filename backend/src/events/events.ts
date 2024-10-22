import {Request, RequestHandler, Response} from "express";
import OracleDB from "oracledb";
import dotenv from 'dotenv';
import { getActiveResourcesInfo } from "process";
import { escape } from "querystring";
import conexao from "../connection";
import { FinancialManager } from "../financial/financial";
dotenv.config();

//usar códigos para status

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
            VALUES(SEQ_EVENTS.NEXTVAL, UPPER(:titulo), UPPER(:descricao), :data_inicio, :data_fim, :data_evento, 'em analise', :valor_cota, 0, 0)`,
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

    export async function evaluateEvent(titulo:string, evaluate:string){
        const connection= await conexao()
        if(evaluate === "aprovado"){
            const avaliarEvento = await connection.execute(
                `UPDATE EVENTOS 
                    SET STATUS = 'Aprovado' 
                    WHERE TITULO = :titulo `,
                {
                    titulo: titulo,
                }
            )
            console.log("Aposta aprovada.");
        }
        else if(evaluate === "reprovado"){
            const avaliarEvento = await connection.execute(
                `UPDATE EVENTOS 
                    SET STATUS = 'Reprovado' 
                    WHERE TITULO = :titulo `,
                {
                   titulo: titulo,
                }
            )   
            console.log("Aposta reprovada.");
        }
        else{
            console.log("Avaliação invalida.");
        }
        connection.commit();
    }
    
    export const evaluateNewEventHandler: RequestHandler=(req: Request, res:Response)=>{
        const eTitulo = req.get("titulo");
        const eEvaluate = req.get("evaluate");

        if(eTitulo && eEvaluate){
            evaluateEvent(eTitulo, eEvaluate);
            res.statusCode = 200;
            res.send(`Evento avaliado. `);
        }else{
            res.statusCode = 400;
            res.send("Parâmetros invalidos ou faltantes");
        }
    }

    export async function betOnEvent(email: string, cotas: number, id_evento: number, opcao: string):Promise<boolean>{
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
            }else{
                opt = 0;
                console.log("Escolha: Não.")
            }

            let createBet = await connection.execute(
                `INSERT INTO APOSTA(ID_APOSTA, FK_ID_USUARIO, FK_ID_EVENTO, DATA_APOSTA, ESCOLHA)
                    VALUES(SEQ_APOSTA.NEXTVAL, :id_usuario, :id_evento, SYSDATE, :opcao)`,
                {   
                    id_usuario: id_usuario,
                    id_evento: id_evento,
                    opcao: opt
                }
            )
            let saveBetHistory = await connection.execute(
                `INSERT INTO HISTORICO_APOSTAS(ID_APOSTA, FK_ID_EVENTO, FK_ID_WALLET, HORA_APOSTA, DATA_APOSTA, VALOR, OPCAO_APOSTA)
                    VALUES(SEQ_HIST_APOSTAS.NEXTVAL, :id_evento, :id_carteira, SYSTIMESTAMP, SYSDATE, :valor, :opcao)`,
                {
                    id_evento: id_evento,
                    id_carteira: id_carteira,
                    valor: valorCotas,
                    opcao: opt
                }
            )
            console.log(`Aposta salva no histórico.`, saveBetHistory);
            connection.commit();
            console.log(`Aposta realizada. ${valorCotas}`);
            return true;
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
}