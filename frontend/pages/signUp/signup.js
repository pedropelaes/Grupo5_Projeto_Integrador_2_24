import { switchWindow } from "../home/home.js";
import { showErrorMessage, cleanError, showMessage } from "../login/login.js";

function validarString(str) {
    return str.includes('@') && str.includes('.');
}

/*
function dataMinima(){
    const data = new Date();
    const d = String(data.getFullYear() - 18) + "-" + String(data.getMonth()+1).padStart(2, '0') + "-" + String(data.getDate()).padStart(2, '0');
    
    return d;
}
window.dataMinima = dataMinima;

document.getElementById("dataNascimento").max = dataMinima();
*/

function senhaIgual(senha1,senha2){
    var correto;
    if(senha1 != senha2){
        correto = false
    }
    else{
correto = true
}
return correto;
}



function isValid(name, email, password, date,password2 ){
    var valid = false;
    if(email.length > 0 && password.length >= 6 && name.length > 0 && date.length > 0 && validarString(email) && senhaIgual(password,password2) ){
        valid = true
    }
    else if(senhaIgual(password,password2) == false){
        showErrorMessage("Senhas diferentes, por favor digite senhas iguais.");
    }
    else if (validarString(email) == false){
        showErrorMessage("Email inválido.");
    }
    else if(email.length == 0 && password.length == 0 && name.length == 0 && date.length == 0){
        showErrorMessage("Por favor, preencha todos os campos.");
    }
    else if(name.length == 0){
        showErrorMessage("Por favor, digite seu nome.")
    }
    else if(email.length == 0){
        showErrorMessage("Por favor, digite seu email.")
    }
    else if(password.length == 0){
        showErrorMessage("Por favor, digite sua senha.");
    }
    else if(password.length < 6){
        showErrorMessage("Senha Invalida, no mínimo 6 caracteres.");
    }
    else if(date.length == 0){
        showErrorMessage("Por favor, selecione uma data valida.");
    }
    console.log(password.length)
    console.log(valid);
    return valid
    }

async function performSignUp(){   
    console.log('a')
    var name = document.getElementById("fieldNome").value;
    var email = document.getElementById("fieldEmail").value;
    var password = document.getElementById("fieldPassword").value;
    var date = document.getElementById("dataNascimento").value;
    var password2 = document.getElementById("fieldPassword2").value;
    email = email.trim();
    password = password.trim();

    if(isValid(name,email,password,date, password2)){
        const reqHeaders = new Headers();
        reqHeaders.append("Content-Type", "text/plain");
        reqHeaders.append("name", name);
        reqHeaders.append("email", email);
        reqHeaders.append("senha", password);
        reqHeaders.append("birthdate", date);

        const response = await fetch (
            window.IP +"/signUp",{
                method: "POST",
                headers: reqHeaders
            }
        )
        if (response.status == 200){
            cleanError();
            let message = (await response.status) + " - " + "Conta cadastrada.";
            showMessage(message);
            switchWindow('/frontend/pages/login/login.html');
        }
        else {
            let message = (await response.status) + " - " + (await response.text());
            showErrorMessage(message);
        }
    }
}
window.performSignUp = performSignUp;

