import { switchWindow } from "../home/home.js";
window.switchWindow = switchWindow;
//Exibir a div com o erro
export function showErrorMessage(messageContent){
    //Atribuir o texto da mensagem no paragrafo
    document.getElementById("message").innerHTML = messageContent;
    var divMb = document.getElementById("messageBox");
    //Exibir a div de erro
    divMb.style.display = "block";
}
//função que oculta o erro (ocult a div)
export function cleanError(){
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
        showErrorMessage("Por favor digite seu email e senha.");
    }
    else if(email.length == 0){
        showErrorMessage("Por favor, preencha o campo do email.");
    }
    else{
        showErrorMessage("Por favor, preencha o campo da senha.");
    }
    return valid;
}
export function showMessage(messageContent){
    document.getElementById("success").innerHTML = messageContent;
    var divMb = document.getElementById("successBox");
    divMb.style.display = "block";
}

function showSignUpButton(){
    var div = document.getElementById("messageBox");
    const signUpButton = document.createElement("button");
    signUpButton.id = ("botaoCadastro");
    signUpButton.classList.add("btn", "btn-outline-danger");
    signUpButton.onclick = () => {switchWindow('/frontend/pages/signUp/signUp.html')};
    signUpButton.innerHTML = `<i class="fas fa-user-plus"></i> Cadastrar`;
    div.appendChild(signUpButton);
}

async function performLogin(){
    var email = document.getElementById("fieldEmail").value;
    var password = document.getElementById("fieldPassword").value;

    //remover espaços eventuais em branco do email e da senha(antes,depois)
    email = email.trim();
    password = password.trim();

    if(isValid(email,password)){
        
        const reqHeaders = new Headers();
        reqHeaders.append("Content-Type", "text/plain");
        reqHeaders.append("email", email);
        reqHeaders.append("senha", password);

        //prosseguir com a chamada do backend.
        const response = await fetch(
            window.IP +"/login",{
                method: "POST",
                headers: reqHeaders
            }
        );
        
        if(response.ok){
            cleanError();
            let object = await response.json()
            console.log(object["Primeiro login"]);
            if(object["Primeiro login"] == true){
                const modalPrimeiroLogin = document.createElement("div");
                modalPrimeiroLogin.innerHTML = `
                <div class="modal fade" id="modalPrimeiroLogin" tabindex="-1" aria-labelledby="modalPrimeiroLoginLabel" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="modalPrimeiroLoginLabel">Seja bem-vindo à JapaBet</h5>
                            </div>
                            <div class="modal-body">
                                <p>Este é seu primeiro login. Gostaria de adicionar saldo à sua carteira?</p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Mais tarde</button>
                                <button type="button" class="btn btn-primary" onclick="switchWindow('/frontend/pages/wallet/addFunds/addFunds.html')">Fazer depósito</button>
                            </div>
                        </div>
                    </div>
                </div>`;
                ;
                document.body.appendChild(modalPrimeiroLogin);
                const modal = new bootstrap.Modal(document.getElementById("modalPrimeiroLogin"));
                modal.show();

                modalPrimeiroLogin.addEventListener("hidden.bs.modal", function () {
                    switchWindow('/frontend/pages/home/home.html');
                    modal.dispose();
                    modalPrimeiroLogin.remove();
                });
            }else{
                let message = (await response.status) + " - " + "Login executado.";
                showMessage(message);
                switchWindow('/frontend/pages/home/home.html');
            }
            
        }else{
            // deu erro
            //mostar o texto de erro...
            let message = (await response.status) + " - " + (await response.text());
            showErrorMessage(message);
            showSignUpButton();
        }

    }
}
window.performLogin = performLogin;