function switchWindow(){
    window.location.href = '/frontend/pages/home/home.html';
}
function showErrorMessage(messageContent){
    document.getElementById("message").innerHTML = messageContent;
    var divMb = document.getElementById("messageBox");
    divMb.style.display = "block";
}
function cleanError(){
    var divMb = document.getElementById("messageBox");
    divMb.style.display = "none";
}
function isValid(titulo, descricao, dataInicio, dataFim, dataEvento, valorCota){
    var valid = false;

    if(titulo.length > 0 && descricao.length > 0 && dataInicio.length > 0 && dataFim.length > 0 && valorCota.length > 0){
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
    else{
        showErrorMessage("Insira o valor da cota.");
    }
    return valid;
}
function showMessage(messageContent){
    document.getElementById("success").innerHTML = messageContent;
    var divMb = document.getElementById("successBox");
    divMb.style.display = "block";
}

async function performCreate(){
    var titulo = document.getElementById("fieldTitulo").value;
    var descricao = document.getElementById("fieldDescricao").value;
    var dataInicio = document.getElementById("fieldDataInicio").value;
    var dataFim = document.getElementById("fieldDataFim").value;
    var dataEvento = document.getElementById("fieldDataEvento").value;
    var valorCota = document.getElementById("fieldValorCota").value;

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
            }else{
                showErrorMessage(message);
            }
        }

    }
}