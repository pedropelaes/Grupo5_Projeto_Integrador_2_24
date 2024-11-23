import { switchWindow } from "/frontend/pages/home/home.js";
import { showErrorMessage, cleanError, showMessage } from "/frontend/pages//login/login.js";

function toggleInputField() {
    const method = document.querySelector('input[name="metodoSaque"]:checked').value;
    document.getElementById('pixField').style.display = method === 'pix' ? 'block' : 'none';
    document.getElementById('contaField').style.display = method === 'conta' ? 'block' : 'none';
}
window.toggleInputField = toggleInputField;

function isValid(valor, Cpix, Cconta, chavePix, nome, cpf, conta, banco, agencia){
    var valid = false;

    if(valor.length > 0 && valor > 0 && Cpix.checked && Cconta.checked){
        valid = true;
    }
    else if(!Cpix.checked && !Cconta.checked){
        showErrorMessage("É necessário escolher uma opção para sacar dinheiro.");
    }
    else if(Cpix.checked){
        if(chavePix.length == 0){
            showErrorMessage("Por favor, preencha a chave pix.");
        }
        else if(valor < 0 || valor.length == 0){
            showErrorMessage("Insira um valor valido,");
        }else{
            valid = true;
        }
    }
    else if(Cconta.checked){
        if(nome.length == 0){
            showErrorMessage("Por favor, preencha o nome.");
        }
        else if(cpf.length == 0){
            showErrorMessage("Por favor, preencha o CPF.");
        }
        else if(conta.length == 0){
            showErrorMessage("Por favor, preencha a conta.");
        }
        else if(banco.length == 0){
            showErrorMessage("Por favor, preencha o número do banco.");
        }
        else if(agencia.length == 0){
            showErrorMessage("Por favor, preencha o número da agência.");
        }
        else if(valor < 0 || valor.length == 0){
            showErrorMessage("Insira um valor valido,");
        }else{
            valid = true;
        }
    }
    return valid;
}

async function performWithdrawFunds(){
    var valor = document.getElementById("fieldSacar").value;
    var Cpix = document.getElementById("saquePix");
    var Cconta = document.getElementById("saqueConta");

    var chavePix = document.getElementById("pixKey").value;

    var nome = document.getElementById("fieldNome").value;
    var cpf = document.getElementById("fieldCPF").value;
    var conta = document.getElementById("fieldConta").value;
    var banco = document.getElementById("fieldNumBanco").value;
    var agencia = document.getElementById("fieldAgencia").value;
    

    if(isValid(valor, Cpix, Cconta, chavePix, nome, cpf, conta, banco, agencia)){
        const reqHeaders = new Headers();
        reqHeaders.append("Content-Type", "text/plain");
        reqHeaders.append("valor", valor);

        const response = await fetch(
            window.IP +"/withdrawFunds",{
                method: "POST",
                headers: reqHeaders
            }
        );
        if(response.ok){
            cleanError();
            let message = (await response.status) + " - " + "Valor sacado.";
            showMessage(message);
            switchWindow('/frontend/pages/wallet/wallet.html');
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
window.performWithdrawFunds = performWithdrawFunds;