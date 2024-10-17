import {Request, RequestHandler, Response} from "express";
import OracleDB from "oracledb";
import dotenv from 'dotenv';
import { getActiveResourcesInfo } from "process";
import { escape } from "querystring";
dotenv.config();

//usar códigos para status

export namespace eventsManager {
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
        let connection = await OracleDB.getConnection({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_CONN_STR
        })

        let criareventos = await connection.execute(
            `INSERT INTO EVENTOS(ID_EVENTO, TITULO, DESCRICAO, DATAINICIO, DATAFIM, DATAEVENTO, STATUS, VALORCOTA, QUANTIDADECOTAS) 
            VALUES(SEQ_EVENTS.NEXTVAL, :titulo, :descricao, :data_inicio, :data_fim, :data_evento, 'em analise', :valor_cota, 0)`,
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
        let connection = await OracleDB.getConnection({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_CONN_STR
        })
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
        let connection = await OracleDB.getConnection({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_CONN_STR
        })
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
        let connection = await OracleDB.getConnection({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_CONN_STR
        })
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
}