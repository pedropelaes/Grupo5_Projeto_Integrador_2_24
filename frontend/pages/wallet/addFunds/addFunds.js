import { switchWindow } from "/frontend/pages/home/home.js";
import { showErrorMessage, cleanError, showMessage } from "/frontend/pages/login/login.js";

function isValid(cartao, nome, validade, cvv, valor){
    var valid = false;
    if(cartao.length > 0 && nome.length > 0 && validade.length > 0 && cvv.length > 0 && valor.length){
        valid = true
    }
    else if(cartao.length == 0 && nome.length == 0 && validade.length == 0 && cvv.length == 0 && valor.length == 0){
        showErrorMessage("Por favor, preencha todos os campos.");
    }
    else if(cartao.length == 0){
        showErrorMessage("Por favor, digite o número do cartao.")
    }
    else if(nome.length == 0){
        showErrorMessage("Por favor, digite o nome do titular.");
    }
    else if(validade.length == 0){
        showErrorMessage("Por favor, digite a data de validade.")
    } 
    else if(cvv.length == 0){
        showErrorMessage("Por favor, digite o código de segurança.");
    }
    else if(valor.length == 0){
        showErrorMessage("Por favor, digite o valor a ser depositado.");
    }
    else if(valor < 0){
        showErrorMessage("Por favor, digite um valor valido.");
    }
    return valid
    }
async function performAddFunds() {
    var nCartao = document.getElementById("cardNumber").value;
    var nome = document.getElementById("cardName").value;
    var validade = document.getElementById("expiryDate").value;
    var cvv = document.getElementById("cvv").value;
    var valor = document.getElementById("amount").value;
    
    if(isValid(nCartao, nome, validade, cvv, valor)){
        console.log("a");
        const reqHeaders = new Headers();
        reqHeaders.append("Content-Type", "text/plain");
        reqHeaders.append("numero_do_cartao", nCartao);
        reqHeaders.append("nome_titular", nome);
        reqHeaders.append("data_validade", validade);
        reqHeaders.append("cvv", cvv);
        reqHeaders.append("saldo", valor);

        const response = await fetch(
            window.IP +"/addFunds",{
                method: "POST",
                headers: reqHeaders
            }
        );
        if(response.ok){
            cleanError();
            let message = (await response.status) + " - " + "Valor depositado.";
            showMessage(message);
            switchWindow('/frontend/pages/wallet/wallet.html');
        }else{
            let message = (await response.status) + " - " + (await response.text());
            if(await response.status == 401){
                message = message + " É necessário fazer login para depositar."
                showErrorMessage(message);
            }else{
                showErrorMessage(message);
            }
        }
        
    }
}
window.performAddFunds = performAddFunds;