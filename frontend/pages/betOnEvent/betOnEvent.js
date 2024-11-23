import { switchWindow } from "../home/home.js";
import { showErrorMessage, cleanError, showMessage } from "../login/login.js";

window.titulo = sessionStorage.getItem("titulo");

function isValid(titulo, qtdCotas, opcao){
    var valid = false;
    if(titulo.length > 0 && qtdCotas.length > 0 && opcao.length > 0){
        valid = true
    }
    else if(titulo.length == 0 && qtdCotas.length == 0 &&  parseFloat(qtdCotas) >= 1 && opcao.length == 0){
        showErrorMessage("Por favor, preencha todos os campos.");
    }
    else if(titulo.length == 0){
        showErrorMessage("Por favor, digite o título do evento que deseja apostar.")
    }
    else if(qtdCotas.length == 0 || parseFloat(qtdCotas) < 1){
        showErrorMessage("Por favor, digite uma quantidade de cotas válida (mínimo 1).")
    }
    else if(opcao.length == 0){
        showErrorMessage("Por favor, escolha a opcão.")
    }
    return valid
    }

async function performBetOnEvent(){   
    var titulo = document.getElementById("fieldTitulo").value;
    var valorCotasApostadas = document.getElementById("fieldQtdCotas").value;
    var opcao = document.getElementById("fieldOpcao").value;

    titulo = titulo.trim();
    valorCotasApostadas = valorCotasApostadas.trim();
    opcao = opcao.trim();

    if(isValid(titulo,valorCotasApostadas, opcao)){
        const reqHeaders = new Headers();
        reqHeaders.append("Content-Type", "text/plain");
        reqHeaders.append("evento", titulo);
        reqHeaders.append("quantidade_cotas", valorCotasApostadas);
        reqHeaders.append("escolha", opcao);

        const response = await fetch (
            "http://192.168.0.10:3000/betOnEvent",{
                method: "POST",
                headers: reqHeaders
            }
        )
        if (response.status == 200){
            cleanError();
            let message = (await response.status) + " - " + "Aposta realizada.";
            //showMessage(message);
            alert(message)
            switchWindow("/frontend/pages/home/home.html");
            titulo = null;
        }
        else {
            let message = (await response.status) + " - " + (await response.text());
            if(await response.status == 401){
                showErrorMessage(message+" É necessário estar logado para apostar.");
            }else{
                showErrorMessage(message);
            }
        }
    }

}
window.performBetOnEvent = performBetOnEvent;

window.onload = function(){
    document.getElementById("fieldTitulo").value = window.titulo;
}