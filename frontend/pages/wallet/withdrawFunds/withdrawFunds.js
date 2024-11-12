function toggleInputField() {
    const method = document.querySelector('input[name="metodoSaque"]:checked').value;
    document.getElementById('pixField').style.display = method === 'pix' ? 'block' : 'none';
    document.getElementById('contaField').style.display = method === 'conta' ? 'block' : 'none';
}
function switchWindow(){
    window.location.href = '/frontend/pages/wallet/wallet.html';
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
function isValid(valor){
    var valid = false;

    if(valor.length > 0){
        valid = true;
    }else{
        showErrorMessage("Insira o valor a ser sacado.");
    }
    return valid;
}
function showMessage(messageContent){
    document.getElementById("success").innerHTML = messageContent;
    var divMb = document.getElementById("successBox");
    divMb.style.display = "block";
}

async function performAddFunds(){
    var valor = document.getElementById("fieldSacar").value;

    if(isValid(valor)){
        const reqHeaders = new Headers();
        reqHeaders.append("Content-Type", "text/plain");
        reqHeaders.append("valor", valor);

        const response = await fetch(
            "http://192.168.0.10:3000/withdrawFunds",{
                method: "POST",
                headers: reqHeaders
            }
        );
        if(response.ok){
            cleanError();
            let message = (await response.status) + " - " + "Valor sacado.";
            showMessage(message);
            switchWindow();
        }else{
            let message = (await response.status) + " - " + (await response.text());
            if(await response.status == 401){
                message = message + " É necessário fazer login para sacar."
                showErrorMessage(message);
            }else{
                showErrorMessage(message);
            }
        }
    }
}