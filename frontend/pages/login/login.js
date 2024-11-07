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
function isValid(email, password){
    var valid = false;

    if(email.length > 0 && password.length > 0){
        valid = true;
    }
    else if(email.length == 0 && password.length == 0){
        showErrorMessage("Please type your email and password.");
    }
    else if(email.length == 0){
        showErrorMessage("Please fill email field.");
    }
    else{
        showErrorMessage("Please fill password field.");
    }
    return valid;
}

async function performSignIn(){
    var email = document.getElementById("fieldEmail").value;
    var password = document.getElementById("fieldPassword").value;

    //remover espaços eventuais em branco do email e da senha(antes,depois)
    email = email.trim();
    password = password.trim();

    if(isValid(email,password)){
        
        const reqHeaders = new Headers();
        reqHeaders.append("Content-Type", "text/plain");
        reqHeaders.append("email", email);
        //reqHeaders.append("password", password);

        //prosseguir com a chamada do backend.
        const response = await fetch(
            "http://192.168.7.15:5500/login.html",{
                method: "POST",
                headers: reqHeaders
            }
        );

        if(response.ok){
            // deu resposta http 200 (exibir sucesso...)
        }else{
            // deu erro
            //mostar o texto de erro...
            showErrorMessage(response.status)
        }

    }
}