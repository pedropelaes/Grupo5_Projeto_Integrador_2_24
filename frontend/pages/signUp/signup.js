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
    window.location.href = '/frontend/pages/login/login.html';
}


function isValid(name, email, password, date ){
    var valid = false;
    if(email.length > 0 && password.length > 6 && name.length > 0 && date.length > 0){
        valid = true
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
    else if(password.length <= 6){
        showErrorMessage("Senha Invalida, no mínimo 6 caracteres.");
    }
    else if(date.length == 0){
        showErrorMessage("Por favor, selecione uma data valida.");
    }
    return valid
    }

async function performSignUp(){   
    var name = document.getElementById("fieldNome").value;
    var email = document.getElementById("fieldEmail").value;
    var password = document.getElementById("fieldPassword").value;
    var date = document.getElementById("dataNascimento").value;

    email = email.trim();
    password = password.trim();

    if(isValid(name,email,password,date)){
        const reqHeaders = new Headers();
        reqHeaders.append("Content-Type", "text/plain");
        reqHeaders.append("name", name);
        reqHeaders.append("email", email);
        reqHeaders.append("senha", password);
        reqHeaders.append("birthdate", date);

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