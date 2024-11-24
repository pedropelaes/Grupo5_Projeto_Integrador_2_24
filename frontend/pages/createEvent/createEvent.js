import { switchWindow } from "../home/home.js";
import { showErrorMessage, cleanError, showMessage } from "../login/login.js";
import { botaoSearch } from "../searchEvent/searchEvent.js";
import { showLoginButton } from "../wallet/wallet.js";

function dataDeHoje(){
    const data = new Date();
    const d = String(data.getFullYear()) + "-" + String(data.getMonth()+1).padStart(2, '0') + "-" + String(data.getDate()).padStart(2, '0');
    
    return d;
}
function minDataFim(){
    document.getElementById("fieldDataFim").min = String(document.getElementById("fieldDataInicio").value);
}
window.minDataFim = minDataFim;
function minDataEvento(){
    const dataFim = (new Date(document.getElementById("fieldDataFim").value + "T00:00:00"));
    document.getElementById("fieldDataEvento").min = String(dataFim.getFullYear()) + '-' + String(dataFim.getMonth()+1).padStart(2, '0') + '-' + String(dataFim.getDate() + 1).padStart(2, '0');
}
window.minDataEvento = minDataEvento;
function toDate(stringData){
    return new Date(stringData + "T00:00:00");
}

function isValid(titulo, descricao, dataInicio, dataFim, dataEvento, valorCota){
    var valid = false;

    if(titulo.length > 0 && descricao.length > 0 && dataInicio.length > 0 && dataFim.length > 0 && valorCota.length > 0 && valorCota >= 1){
        valid = true;
    }
    else if(titulo.length == 0 && descricao.length == 0 && dataInicio.length == 0 && dataFim.length == 0 && valorCota.length == 0){
        showErrorMessage("Preencha todos os campos");
    }
    else if(titulo.length == 0){
        showErrorMessage("Insira um Título.");
    }
    else if(descricao.length == 0){
        showErrorMessage("Insira uma descrição.");
    }
    else if(dataInicio.length == 0){
        showErrorMessage("Insira a data de início.");
    }
    else if(dataFim.length == 0){
        showErrorMessage("Insira a data de término.");
    }
    else if(dataEvento.length == 0){
        showErrorMessage("Insira a data do evento");
    }
    else if(valorCota < 1){
        showErrorMessage("Insira um valor maior que R$1,00.");
    }
    else{
        showErrorMessage("Insira o valor da cota.");
    }
    return valid;
}

async function performCreate(){
    var titulo = document.getElementById("fieldTitulo").value;
    var descricao = document.getElementById("fieldDescricao").value;
    var dataInicio = document.getElementById("fieldDataInicio").value;
    var dataFim = document.getElementById("fieldDataFim").value;
    var dataEvento = document.getElementById("fieldDataEvento").value;
    var valorCota = document.getElementById("fieldValorCota").value;
    console.log(valorCota);

    if(isValid(titulo, descricao, dataInicio, dataFim, dataEvento, valorCota)){
        const reqHeaders = new Headers();
        reqHeaders.append("Content-Type", "text/plain");
        reqHeaders.append("titulo", titulo);
        reqHeaders.append("descricao", descricao);
        reqHeaders.append("datainicio", dataInicio);
        reqHeaders.append("datafim", dataFim);
        reqHeaders.append("dataevento", dataEvento);
        reqHeaders.append("cota", valorCota);

        const response = await fetch(
            "http://192.168.0.10:3000/addNewEvent",{
                method: "POST",
                headers: reqHeaders
            }
        );
        
        if(response.ok){
            cleanError();
            let message = (await response.status) + " - " + " Evento enviado para análise.";
            showMessage(message);
            switchWindow();
        }else{
            let message = (await response.status) + " - " + (await response.text());
            if(await response.status == 401){
                message = message + " É necessário fazer login para criar eventos."
                showErrorMessage(message);
                showLoginButton();
            }else{
                showErrorMessage(message);
            }
        }

    }
}
window.performCreate = performCreate;

window.onload = function(){
    if(window.location.pathname.includes("createEvent.html")){
        botaoSearch();

        let dataInicio = document.getElementById("fieldDataInicio");
        dataInicio.min = dataDeHoje();
        let dataFim = document.getElementById("fieldDataFim");
        let dataEvento = document.getElementById("fieldDataEvento");
        
        function checkDataInicio(){
            if(dataInicio.value.length == 0 || toDate(dataInicio.value) > toDate(dataFim.value)){
                dataFim.disabled = 'disabled';
                dataFim.value = null;
            }else{
                dataFim.disabled = false;
            }
        }
        function checkDataFim(){
            if(dataFim.value.length == 0 || dataFim.value.length == undefined){
                dataEvento.disabled = 'disabled';
            }else if(toDate(dataFim.value) > toDate(dataEvento.value)){
                dataEvento.value = null;
                dataEvento.value.length = undefined;
            }
            else{
                dataEvento.disabled = false;
            }
        }

        checkDataInicio();
        checkDataFim();

        dataInicio.addEventListener("input", checkDataInicio);
        dataFim.addEventListener("input", checkDataFim);
    }
};