//Exibir a div com o erro
function showErrorMessage(messageContent){
    //Atribuir o texto da mensagem no paragrafo
    document.getElementById("message").innerHTML = messageContent;
    var divMb = document.getElementById("messageBox");
    //Exibir a div de erro
    divMb.style.display = "block";
}
//função que oculta o erro (ocult a div)
function cleanError(){
    var divMb = document.getElementById("messageBox");
    divMb.style.display = "none";
}
//Verifica se o formulario esta valido, preenchido corretamente
//se estiver, retorna true, senao, false
function isValid(titulo, descricao, dataInicio, dataFim, valorCota){
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
    var valorCota = document.getElementById("fieldValorCota").value;

    if(isValid(email,password)){
        
        const reqHeaders = new Headers();
        reqHeaders.append("Content-Type", "text/plain");
        reqHeaders.append("titulo", titulo);
        reqHeaders.append("descricao", descricao);
        reqHeaders.append("dataInicio", dataInicio);
        reqHeaders.append("dataFim", dataFim);
        reqHeaders.append("valorCota", valorCota);

        //prosseguir com a chamada do backend.
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

        }else{

            let message = (await response.status) + " - " + (await response.text());
            showErrorMessage(message);
            
        }

    }
}