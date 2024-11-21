

function showErrorMessage(messageContent){
    document.getElementById("message").innerHTML = messageContent;
    var divMb = document.getElementById("messageBox");
    divMb.style.display = "block";
}
function cleanError(){
    var divMb = document.getElementById("messageBox");
    divMb.style.display = "none";
}
function showMessage(messageContent){
    document.getElementById("success").innerHTML = messageContent;
    var divMb = document.getElementById("successBox");
    divMb.style.display = "block";
}

function switchWindow(){
    window.location.href = '/frontend/pages/home/home.html';
}


function isValid(titulo, qtdCotas, escolha){
    var valid = false;
    if(titulo.length > 0 && qtdCotas.length > 0 && escolha.length > 0){
        valid = true
    }
    else if(titulo.length == 0 && qtdCotas.length == 0 && escolha.length == 0){
        showErrorMessage("Por favor, preencha todos os campos.");
    }
    else if(titulo.length == 0){
        showErrorMessage("Por favor, digite o título do evento que deseja apostar.")
    }
    else if(qtdCotas.length == 0){
        showErrorMessage("Por favor, digite a quatidade de cotas a serem apostadas.")
    }
    else if(escolha.length == 0){
        showErrorMessage("Por favor, escolha a opcão.")
    }
    return valid
    }

async function performBetOnEvent(){   
    var titulo = document.getElementById("fieldTitulo").value;
    var valorCotasApostadas = document.getElementById("fieldValorCotaApostadas").value;

    titulo = titulo.trim();
    valorCotasApostadas = valorCotasApostadas.trim();

    if(isValid(titulo,valorCotasApostadas)){
        const reqHeaders = new Headers();
        reqHeaders.append("Content-Type", "text/plain");
        reqHeaders.append("evento", titulo);
        reqHeaders.append("quantidade_cotas", valorCotasApostadas);
        reqHeaders.append("escolha", escolha);

        const response = await fetch (
            "http://192.168.0.10:3000/signUp",{
                method: "POST",
                headers: reqHeaders
            }
        )
        if (response.status == 200){
            cleanError();
            let message = (await response.status) + " - " + "Conta cadastrada.";
            showMessage(message);
            switchWindow();
        }
        else {
            let message = (await response.status) + " - " + (await response.text());
            showErrorMessage(message);
        }
    }

}

