import {Request, RequestHandler, Response} from "express";
import OracleDB, { dbObjectAsPojo } from "oracledb";
import dotenv from 'dotenv';
import { getActiveResourcesInfo } from "process";
import { escape } from "querystring";
import conexao from "../connection";
import { FinancialManager } from "../financial/financial";
import { AccountsManager } from "../accounts/accounts";
import { fstat, stat } from "fs";
import nodemailer from "nodemailer";
dotenv.config();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_ADM, 
      pass: process.env.EMAIL_PASS,
    },
  });
  
export namespace EventsManager {
    type event={
        id_evento: number | undefined,
        titulo: string,
        descricao: string,
        data_inicio: string,
        data_fim: string,
        data_evento: string,
        status: string | undefined,
        valor_cota: number,
        id_criador: number | undefined,
    }

    async function sendEmail(to: string, subject: string, ){
        
        const mailOptions = {
            from: process.env.EMAIL_USER,  
            to: to,                        
            subject: subject,              
            text:`
            Prezado(a) cliente,

            Agradecemos por utilizar a JapaBet como sua plataforma de criação de eventos. Informamos que o evento criado não foi aprovado devido ao motivo descrito no assunto desta mensagem.

            Para que o evento possa ser aceito, solicitamos que o recrie seguindo as adequações necessárias. Estamos à disposição para esclarecer quaisquer dúvidas ou fornecer orientações.

            Atenciosamente,
            Equipe JapaBet`,                    
        };

        try{
            const info = await transporter.sendMail(mailOptions);
            console.log(`{Email enviado. ${info.response}}`);
            return {success: true, info};
        }catch(error){
            console.log(`Erro ao enviar email. ${error}`);
            return {success: false, error}
        }
    }

    async function getEventStatus(id_evento:number | null, titulo: string | null): Promise<any>{
            const connection = await conexao();

            if(titulo === null){
                let statusEvento = await connection.execute(
                    `SELECT STATUS
                    FROM EVENTO
                    WHERE ID_EVENTO = :id_evento`,
                    {id_evento: id_evento}
                )
                if(statusEvento && statusEvento.rows && statusEvento.rows.length > 0){
                    return (statusEvento.rows as any)[0][0];
                }else{
                    return null;
                }
            }else{
                titulo = titulo.toUpperCase();
                let statusEvento = await connection.execute(
                    `SELECT STATUS
                    FROM EVENTO
                    WHERE TITULO = :titulo`,
                    {titulo: titulo}
                )
                console.log(statusEvento.rows);
                if(statusEvento && statusEvento.rows && statusEvento.rows.length > 0){
                    return (statusEvento.rows as any)[0][0];
                }else{
                    return null;
                }
            }
        }    
    
    async function salvarevento(event: event): Promise<any>{
    const connection= await conexao();
    event.titulo = event.titulo.toUpperCase();
        let checarTitulo = await connection.execute(
            `SELECT TITULO
             FROM EVENTO
             WHERE TITULO = :titulo`,
            {
                titulo: event.titulo
            }
        )
        console.log(`Titulo buscado: ${event.titulo} | Resultado: ${checarTitulo.rows}`);
        if(checarTitulo && checarTitulo.rows && checarTitulo.rows.length > 0){
            console.log(`Titulo já existente.`);
            return false;
        }

        let criareventos = await connection.execute(
            `INSERT INTO EVENTO(ID_EVENTO, TITULO, DESCRICAO, DATA_INICIO, DATA_FIM, DATA_EVENTO, STATUS, VALORCOTA, QUANTIDADECOTAS, TOTAL_APOSTA, ID_CRIADOR, ID_MODERADOR) 
            VALUES(SEQ_EVENTO.NEXTVAL, UPPER(:titulo), UPPER(:descricao), TO_DATE(:data_inicio, 'YYYY-MM-DD'), TO_DATE(:data_fim, 'YYYY-MM-DD'), TO_DATE(:data_evento, 'YYYY-MM-DD'), 'EM ANALISE', :valor_cota, 0, 0, :id_criador, 1)`,
            {
                titulo: event.titulo,
                descricao: event.descricao,
                data_inicio: event.data_inicio,
                data_fim: event.data_fim,
                data_evento: event.data_evento,
                valor_cota: event.valor_cota,
                id_criador: event.id_criador
            },
        )
        connection.commit();
        console.log("Evento criado e cadastrado no banco,", criareventos);
    }
    
    export const createEventHandler: RequestHandler = async (req: Request, res:Response)=>{
        const eTitulo = req.get("titulo");
        const eDesc = req.get("descricao");
        const eDataInicio = req.get("datainicio");
        const eDataFim = req.get("datafim");
        const eDataEvento = req.get("dataevento");
        const eValorCota = req.get("cota");

        const VC = eValorCota ? parseInt(eValorCota, 10): undefined; //converte a requisição do valor da cota para numero   
        
        if(eTitulo && eDesc && eDataInicio && eDataFim && eDataEvento  && VC !== undefined && VC >= 1){
            if(await AccountsManager.checkToken(AccountsManager.last_token as string)){
                const user_id = await AccountsManager.checkToken(AccountsManager.last_token as string)
                const novoevento:event = {
                    id_evento: undefined,
                    titulo: eTitulo,
                    descricao: eDesc,
                    data_inicio: eDataInicio,
                    data_fim: eDataFim,
                    data_evento: eDataEvento,
                    status: undefined,
                    valor_cota: VC,
                    id_criador: user_id,
                }
                const checkTitulo = await salvarevento(novoevento);
                if(checkTitulo === false){
                    res.statusCode = 409;
                    res.send(`Não foi possivel criar evento. Titulo já existe.`);
                }else{
                    res.statusCode = 200;
                    res.send(`Novo evento criado. Titulo: ${eTitulo}`);
                }
            }else{
                res.statusCode = 401;
                res.send(`Permissão negada.`);
            }
        }else{
            res.statusCode=400;
            res.send("Parâmetros invalidos ou faltantes.");
        }
    }

    async function getEvent(busca: string, req:string): Promise<any>{
        const connection= await conexao();
        if(req !== "usuario"){
            busca = busca.toUpperCase();
        }
        let buscarevento;
        if(req === "status"){
            buscarevento = await connection.execute(
                `SELECT * FROM EVENTO WHERE STATUS = :status`,
                {
                    status: busca,
                },
                {outFormat: OracleDB.OUT_FORMAT_OBJECT}
            ) 
        }else if(req === "titulo"){
            buscarevento = await connection.execute(
                `SELECT * FROM EVENTO WHERE TITULO = :titulo`,
                {
                    titulo: busca,
                },
                {outFormat: OracleDB.OUT_FORMAT_OBJECT}
            ) 
        }else if(req === "usuario"){
            const getUserId = await connection.execute(
                `SELECT ID_USUARIO FROM USUARIO WHERE EMAIL = :email`,
                {email: busca}
            )
            
            buscarevento = await connection.execute(
                `SELECT TO_CHAR(DATA_EVENTO, 'DD/MM/YYYY') AS DATA_EVENTO, TO_CHAR(DATA_FIM, 'DD/MM/YYYY') AS DATA_FIM, TO_CHAR(DATA_INICIO, 'DD/MM/YYYY') AS DATA_INICIO, DESCRICAO, TITULO, VALORCOTA
                 FROM EVENTO
                 WHERE ID_CRIADOR = :id_user AND STATUS IN ('APROVADO', 'EM ANALISE') `,
                {id_user: (getUserId.rows as any)[0][0]},
                {outFormat: OracleDB.OUT_FORMAT_OBJECT}
            )
        }
        
        console.log("Busca: ", busca);
        if(buscarevento && buscarevento.rows && buscarevento.rows.length > 0){
            return buscarevento.rows;
        }else{
            return null;
        }
    }

    async function getUserEmail(token:string): Promise<any>{
        const connection = await conexao();
        let buscarEmail = await connection.execute(
            `SELECT EMAIL
             FROM USUARIO
             WHERE TOKEN_SESSAO = :token`,
            {token: token}
        )
        console.log(buscarEmail.rows);
        if(buscarEmail && buscarEmail.rows && buscarEmail.rows.length > 0){
            return (buscarEmail.rows as any)[0][0];
        }
        return null;
    }

    export const getEventHandler: RequestHandler=async(req: Request, res:Response)=>{
        const gStatus = req.get("status");
        const gTitulo = req.get("titulo");
        const gEmail = req.get("usuario");

        if(gStatus){
            const busca = await getEvent(gStatus, "status");
            res.status(200).json({"Resultado da busca":busca});
        }else if(gTitulo){
            const busca = await getEvent(gTitulo, "titulo");
            res.status(200).json({"Resultado da busca":busca});
        }else if(gEmail){
            const token = AccountsManager.last_token;
            if(token === null){
                res.statusCode = 401;
                res.send("É necessário estar logado para visualizar seus eventos.");
            }else{
                const email = await getUserEmail(token as string);
                const busca = await getEvent(email, "usuario");
                res.status(200).json({"Resultado da busca":busca});
            }
        }
        else{
            res.statusCode=400;
            res.send("Parâmetros invalidos ou faltantes");
        }
    }

    async function deletarEvento(titulo: string, id_usuario: number): Promise<any>{
        const connection= await conexao()
        titulo = titulo.toUpperCase();
        let getIdCriador = await connection.execute(
            `SELECT ID_CRIADOR
             FROM EVENTO
             WHERE TITULO = :titulo`,
            {
                titulo: titulo
            }
        )
        if((getIdCriador.rows as any)[0][0] !== id_usuario){
            return null;
        }
        
        const apagarEvento = await connection.execute(
            `UPDATE EVENTO 
                SET STATUS = 'DELETADO' 
                WHERE TITULO = :titulo `,
        {
            titulo: titulo,
        })
        connection.commit();
        console.log("Evento apagado. ", apagarEvento);
        return true;
    }

    export const deleteEventHandler: RequestHandler = async (req: Request, res:Response)=>{
        const dTitulo = req.get("titulo");
        
        const status = await getEventStatus(null, dTitulo as string);
        console.log(status);
        console.log(await AccountsManager.checkToken(AccountsManager.last_token as string));

        if(dTitulo){
            if( await AccountsManager.checkToken(AccountsManager.last_token as string) !==null && status != null && status !== 'APROVADO'){
                const user_id = await AccountsManager.checkToken(AccountsManager.last_token as string);
                const del = await deletarEvento(dTitulo, user_id);
                if(del === true){
                    res.statusCode = 200;
                    res.send(`Evento deletado. Nome: ${dTitulo}`);
                }else{
                    res.statusCode = 403;
                    res.send(`Permissão para deletar evento negada. Evento não pertence a usuario.`);
                }
            }else{
                res.statusCode = 401;
                res.send(`Permissão para deletar evento negada ou evento inexistente.`);
            }
        }else{
            res.statusCode = 400;
            res.send("Parâmetros invalidos ou faltantes");
        }
    }

    async function evaluateEvent(id:number, evaluate:string): Promise<any>{
        const connection= await conexao();
        if(await getEventStatus(id, null)!=="EM ANALISE"){
            console.log("Evento não esta em analise.");
            return false;
        }
        else if(evaluate === "aprovado"){
            const avaliarEvento = await connection.execute(
                `UPDATE EVENTO 
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
                `UPDATE EVENTO 
                    SET STATUS = 'REPROVADO' 
                    WHERE ID_EVENTO = :id_evento `,
                {
                    id_evento: id,
                }
            )   
            console.log("Aposta reprovada.");
            connection.commit();
            return "rep";
        }
        else{
            console.log("Avaliação invalida.");
            return false;
        }
        
    }
    
    async function getCreatorEmail(id: number): Promise<any>{
        const connection= await conexao();
        let getCreatorId = await connection.execute(
            `SELECT ID_CRIADOR
             FROM EVENTO
             WHERE ID_EVENTO = :id_evento`,
            {
                id_evento: id
            }
        )
        const id_criador = (getCreatorId.rows as any)[0][0];
        let getCreatorEmail = await connection.execute(
            `SELECT EMAIL
             FROM USUARIO
             WHERE ID_USUARIO = :id_criador`,
            {
                id_criador: id_criador
            }
        )
        const email_criador = (getCreatorEmail.rows as any)[0][0];
        return email_criador;
    }
    
    export const evaluateNewEventHandler: RequestHandler = async (req: Request, res:Response)=>{
        const eId = req.get("id_evento");
        const eEvaluate = req.get("evaluate");
        const fEmail = req.get("email_adm");
        const fSenha = req.get("senha_adm");
        const eMotivo = req.get("motivo");

        const ID = eId ? parseInt(eId, 10): undefined;
        
        if(ID && eEvaluate && fEmail && fSenha && eMotivo){
            const loginADM = await AccountsManager.loginADM(fEmail, fSenha);
            if(loginADM !== null){
                const avaliacao = await evaluateEvent(ID, eEvaluate);
                if(avaliacao === true){
                    res.statusCode = 200;
                    res.send(`Evento avaliado. Aprovado.`);
                }else if(avaliacao === "rep"){
                    const email = await getCreatorEmail(ID);
                    const subject: string = "Evento reprovado. Motivo: "+eMotivo;
                    const infoEmail = await sendEmail(email, subject);
                    res.statusCode = 200;
                    res.send(`Evento avaliado. Reprovado por motivo: ${eMotivo}. Email do criador: ${email}. ${infoEmail.success}`);
                }
                else{
                    res.statusCode = 403;
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

    async function betOnEvent(token: string, cotas: number, titulo: string, opcao: string):Promise<boolean>{ 
        if(await getEventStatus(null, titulo) === "APROVADO"){
            const connection = await conexao();

            const validEventDate = await connection.execute(
                `SELECT ID_EVENTO
                    FROM EVENTO
                    WHERE TITULO = :titulo
                        AND data_inicio <= TRUNC(SYSDATE)`,
                 {
                    titulo:titulo
                 }
            )
            if(validEventDate && validEventDate.rows && validEventDate.rows.length == 0){
                console.log("Período de apostas ainda não iniciado");
                return false;
            }

            const getUserId = await connection.execute(
                `SELECT ID_USUARIO FROM USUARIO WHERE TOKEN_SESSAO = :token`,
                {token: token}
            )

            const id_usuario = (getUserId.rows as any)[0][0];
            console.log(`Id usuario buscado: ${id_usuario}`);

            const getWalletId = await connection.execute(
                `SELECT ID_WALLET FROM WALLET WHERE ID_USUARIO = :id_usuario`,
                {id_usuario: id_usuario}
            )
            if(getWalletId && getWalletId.rows && getWalletId.rows.length === 0){
                console.log("Carteira inexistente, primeiro deposito não foi realizado.");
                return false;
            }
            const id_carteira = (getWalletId.rows as any)[0][0];
            console.log(`Id carteira buscado: ${id_carteira}`);

            const getValorCotas = await connection.execute(
                `SELECT VALORCOTA FROM EVENTO WHERE TITULO = :titulo`,
                {titulo: titulo}
            )

            let updateQtdCotas = await connection.execute(
                `UPDATE EVENTO
                    SET QUANTIDADECOTAS = QUANTIDADECOTAS + :qtd_cotas
                    WHERE TITULO = :titulo`,
                {
                    qtd_cotas: cotas,
                    titulo: titulo
                }
            )
            console.log(`Quantidade de cotas atualizada: ${cotas}`, updateQtdCotas); 

            const valorCotas = (getValorCotas.rows as any)[0][0] * cotas;
            console.log(`Valor das cotas: ${valorCotas}`);
            
            let updateTotalValue = await connection.execute(
                `UPDATE EVENTO
                    SET TOTAL_APOSTA = TOTAL_APOSTA + :valor
                    WHERE TITULO = :titulo`,
                {
                    valor: valorCotas,
                    titulo: titulo
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
                }else if(opcao === "não" || opcao == "nao"){
                    opt = 0;
                    console.log("Escolha: Não.")
                }else{
                    console.log(`Erro ao realizar aposta.`);
                    return false;
                }
                
                let getEventId = await connection.execute(
                    `SELECT ID_EVENTO
                     FROM EVENTO
                     WHERE TITULO = :titulo`,
                    {
                        titulo: titulo
                    }
                )
                const id_evento = (getEventId.rows as any)[0][0];

                let saveBet= await connection.execute(
                    `INSERT INTO APOSTA(ID_APOSTA, FK_ID_USUARIO, FK_ID_EVENTO, HORA_APOSTA, DATA_APOSTA, COTAS, VALOR, OPCAO_APOSTA )
                        VALUES(SEQ_HIST_APOSTAS.NEXTVAL, :id_usuario, :id_evento, SYSTIMESTAMP, SYSDATE, :cotas, :valor, :opcao)`,
                    {
                        id_evento: id_evento,
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
        const bTitulo = req.get("evento");
        const bCotas = req.get("quantidade_cotas");
        const bEscolha = req.get("escolha");

        const qtd_cotas = bCotas ? parseInt(bCotas, 10): undefined;
        
        if(bTitulo && qtd_cotas &&bEscolha){
            if(await AccountsManager.checkToken(AccountsManager.last_token as string)){
                const bet = await betOnEvent(AccountsManager.last_token as string, qtd_cotas, bTitulo.toUpperCase(), bEscolha);
                    if(bet === true){
                    res.statusCode = 200;
                    res.send(`Aposta realizada. Cotas:${qtd_cotas}.`);
                }else{
                    res.statusCode = 403;
                    res.send(`Erro ao realizar aposta. Aposta não aprovada, usuario sem saldo ou carteira ou período de apostas ainda não iniciado.`);
                }
            }else{
                res.statusCode = 401;
                res.send(`Permissão negada.`);
            }
        }else{
            res.statusCode = 400;
            res.send(`Parâmetros invalidos ou faltantes`)
        }
    }

    async function searchEvent(keyWord: string): Promise<any>{
        const connection = await conexao();

        let searchEvent;
        keyWord = `%${keyWord}%`;
        searchEvent = await connection.execute(
            `SELECT ID_EVENTO, TITULO, DESCRICAO, TO_CHAR(DATA_INICIO, 'DD/MM/YYYY') AS INICIO, TO_CHAR(DATA_FIM, 'DD/MM/YYYY') AS FIM, TO_CHAR(DATA_EVENTO, 'DD/MM/YYYY') AS DATA, STATUS, VALORCOTA, RESULTADO_EVENTO 
            FROM EVENTO 
            WHERE (DESCRICAO LIKE UPPER(:keyword) OR TITULO LIKE UPPER(:keyword)) 
            AND STATUS = 'APROVADO' 
            AND SYSDATE < DATA_EVENTO`,
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

    

    async function finishEvent(id_evento: number, resultado: string): Promise<any> {
        if(await getEventStatus(id_evento, null) == "FINALIZADO"){
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
            `UPDATE EVENTO
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
            `SELECT SUM(COTAS), SUM(VALOR) FROM APOSTA
             WHERE OPCAO_APOSTA = 1 AND FK_ID_EVENTO = :id_evento`,
            {id_evento: id_evento}
        )
        const cotasSim = (apostasSim.rows as any)[0][0];
        const valorSim = (apostasSim.rows as any)[0][1];

        let apostasNao = await connection.execute(
            `SELECT SUM(COTAS), SUM(VALOR) FROM APOSTA
             WHERE OPCAO_APOSTA = 0 AND FK_ID_EVENTO = :id_evento`,
            {id_evento: id_evento}
        )
        const cotasNao = (apostasNao.rows as any)[0][0];
        const valorNao = (apostasNao.rows as any)[0][1];
        console.log(`Quantidade de cotas não: ${cotasNao} | Quantidade de cotas sim: ${cotasSim}`);
        console.log(`Valor total de nao: ${valorNao} | Valor total de sim: ${valorSim}`);

        let apostasVencedoras = await connection.execute(
            `SELECT ID_APOSTA, FK_ID_USUARIO, COTAS, VALOR
             FROM APOSTA
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
        const qnt_vencedores = (apostasVencedoras.rows?.length as number);
        console.log((apostasVencedoras.rows?.length as number));
        
        let valor_vencedor:number;
        for(let i = 0; i<qnt_vencedores; i++){  // 0:id_aposta | 1:id_usuario | 2: total de cotas | 3: Valor vencedor
            console.log(i);
            valor_vencedor =(apostasVencedoras.rows as any)[i][3] + ((apostasVencedoras.rows as any)[i][2] / cotasVencedoras) * valorPerdedor;
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
            console.log(`Usuario premiado: ${(apostasVencedoras.rows as any)[i][1]}  | Valor: ${valor_vencedor} | Id da aposta: ${(apostasVencedoras.rows as any)[i][0]}`);
            FinancialManager.addTransferHistory("PREMIAÇÃO", await FinancialManager.getWalletId((apostasVencedoras.rows as any)[i][1]), valor_vencedor); 
        }
        return true;
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
                    res.statusCode = 409;
                    res.send(`Aposta já finalizada. ID:${id}`);
                }
            }else{
                res.statusCode = 401;
                res.send(`Conta de moderador não existente.`);
            }

        }else{
            res.statusCode = 400;
            res.send(`Parâmetros invalidos ou faltantes`);
        }
    }

    async function specifyEvents(){
        const connection = await conexao();
        
        const mostBets = await connection.execute(
            `SELECT TITULO, DESCRICAO, DATA_INICIO, DATA_FIM, DATA_EVENTO, VALORCOTA
            FROM (
                SELECT e.TITULO, e.DESCRICAO, TO_CHAR(e.DATA_INICIO, 'DD/MM/YYYY') AS DATA_INICIO, TO_CHAR(e.DATA_FIM, 'DD/MM/YYYY') AS DATA_FIM, TO_CHAR(e.DATA_EVENTO, 'DD/MM/YYYY') AS DATA_EVENTO, e.VALORCOTA,
                    ROW_NUMBER() OVER (ORDER BY COUNT(a.FK_ID_EVENTO) DESC) AS RNUM
                FROM APOSTA a
                JOIN EVENTO e ON a.FK_ID_EVENTO = e.ID_EVENTO
                WHERE e.STATUS = 'APROVADO'
                GROUP BY e.TITULO, e.DESCRICAO, e.DATA_INICIO, e.DATA_FIM, e.DATA_EVENTO, e.VALORCOTA
            ) subquery
            WHERE RNUM <= 3`
        )
         mostBets.rows as any;
    
        const endDateNear = await connection.execute(
            `SELECT e.TITULO, e.DESCRICAO, TO_CHAR(e.DATA_INICIO, 'DD/MM/YYYY'), TO_CHAR(e.DATA_FIM, 'DD/MM/YYYY'), TO_CHAR(e.DATA_EVENTO, 'DD/MM/YYYY'), e.VALORCOTA   
            FROM EVENTO e
            WHERE e.DATA_FIM < SYSDATE + 10 AND e.STATUS = 'APROVADO'
            ORDER BY DATA_FIM
            FETCH FIRST 3 ROWS ONLY`
        )
        return {
            maisApostados: mostBets.rows as any,
            maisProximos: endDateNear.rows as any
        }
        
    }

    async function getLoggedUser(token:string):Promise<any> {
        const connection = await conexao();

        if(token === null){
            return null;
        }

        let getUserInfo = await connection.execute(
            `SELECT NOME FROM USUARIO
             WHERE TOKEN_SESSAO = :token`,
             {
                token:token
             }
        )

        if(getUserInfo && getUserInfo.rows && getUserInfo.rows.length > 0){
            return (getUserInfo.rows as any)[0][0];
        }
        return null;
    }
    
    export const homeHandler: RequestHandler = async (req:Request, res:Response) =>{
        const user = await getLoggedUser(AccountsManager.last_token as string);
        const events = await specifyEvents()
        console.log(user);
        if(user === null){
            res.status(200).json({events , usuarioLogado: null});
        }else{
            res.status(200).json({events , usuarioLogado: user});
        }
        console.log(events);
    }
}