import { switchWindow } from "/frontend/pages/home/home.js";
import { botaoSearch } from "../searchEvent/searchEvent.js";
import { showErrorMessage } from "/frontend/pages/login/login.js";
window.switchWindow = switchWindow;

export function showLoginButton(){
    var divMb = document.getElementById("messageBox");
    const loginButton = document.createElement("button");
    loginButton.id = ("botaoLogin");
    loginButton.classList.add("btn", "btn-outline-success")
    loginButton.onclick = () => {switchWindow('/frontend/pages/login/login.html');};
    loginButton.innerHTML = `
    <i class="fas fa-arrow-right"></i> Login`

    divMb.appendChild(loginButton);
}

async function PerformWalletInfo(){
    const response = await fetch(
        window.IP +"/wallet",{
            method: "POST",
        }
    );
    if(response.ok){
        let info = await response.json();
        const creditHistory = info.financialInfo;
        const betHistory = info.betsInfo;

        const saldo = document.getElementById("walletBalance");
        saldo.innerText = "R$"+creditHistory[0][0];
        
        //constante pra tabela
        const credits = document.getElementById("creditHistory"); //0-saldo 1-id_Transacao 2-tipo 3-data 4-hora 5-valor
        const bets = document.getElementById("betHistory"); //0-data 1-hora 2-titulo 3-valor 4-escolha
        
        
        
        for(var i = 0; i<creditHistory.length; i++){
            let rowsC = document.createElement("tr");
            rowsC.innerHTML = `
                <td>${creditHistory[i][3]}</td>
                <td>${creditHistory[i][4]}</td>
                <td>${creditHistory[i][2]}</td>
                <td>${creditHistory[i][5]}</td>
            `
            credits.appendChild(rowsC);
        }
        for(var i = 0; i<betHistory.length; i++){
            let rowsB = document.createElement("tr");
            rowsB.innerHTML = `
                <td>${betHistory[i][0]}</td>
                <td>${betHistory[i][1]}</td>
                <td>${betHistory[i][2]}</td>
                <td>${betHistory[i][3]}</td>
                <td>${betHistory[i][4]}</td>
            `
            bets.appendChild(rowsB);
        }
        
    }else{
        showErrorMessage("Faça login para visualizar sua carteira.");
        showLoginButton();
    }
}
window.onload = function(){
    if(window.location.pathname.includes("wallet.html")){
        PerformWalletInfo();

        botaoSearch();
    }
}