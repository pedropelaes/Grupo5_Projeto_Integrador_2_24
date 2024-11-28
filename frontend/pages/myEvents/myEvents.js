import { switchWindow, bet, searchEventbyButton } from "../home/home.js";
import { showErrorMessage } from "../login/login.js";
import { showLoginButton } from "../wallet/wallet.js";
window.switchWindow = switchWindow;
window.bet = bet;
window.searchEventbyButton = searchEventbyButton;


async function performDelete(titulo) {
    const reqHeaders = new Headers();
    reqHeaders.append("titulo", titulo);
    
    const response = await fetch(
        window.IP + "/deleteEvent",{
            method: "POST",
            headers: reqHeaders
        }
    );
    if (response.ok) {
        alert(await response.status+" - "+await response.text());
        location.reload();
    }
    else {
        alert("Erro ao deletar evento");
        location.reload();
    }
}

async function PerformMyEvents(){
    const reqHeaders = new Headers();
    reqHeaders.append("usuario", "usuario");
    
    const response = await fetch(
        window.IP + "/getEvents",{
            method: "POST",
            headers: reqHeaders
        }
    );
    if(response.ok){
        const events = await response.json();
        console.log(events["Resultado da busca"]);
        const divEvents = document.getElementById("meusEventos");
        if(events["Resultado da busca"] == null){
            showErrorMessage("Você não possui eventos criados");
        }else{
            for(let i = 0; i<events["Resultado da busca"].length; i++){
                let event = document.createElement("div");
                event.classList.add("card", "mx-2", "mb-3");
                event.style.width = "18rem";

                event.innerHTML=`<img src="/frontend/res/images/icone_japabet.ico" class="card-img-top" alt="Evento">
                        <div class="card-body">
                            <h5 class="card-title">${events["Resultado da busca"][i]["TITULO"]}</h5>
                            <p class="card-text">${events["Resultado da busca"][i]["DESCRICAO"]}</p>
                            <a href="#" class="btn btn-danger" type="button" onclick="bet('${(events["Resultado da busca"][i]["TITULO"])}')"><i class="fas fa-coins"></i> Apostar</a>
                            <a href="#" class="btn btn-vermais"><i class="fas fa-search"></i> Ver mais</a>
                            <a href="#" class="btn btn-delete  w-100 mt-1"><i class="fas fa-solid fa-trash"></i> Deletar</a>
                    </div>`;
                let eventoVerMais = event.querySelector(".btn-vermais");
                let eventoDeletar = event.querySelector(".btn-delete")

                const modalDelete = function() {
                    showModalDelete(events["Resultado da busca"][i]);
                }
            
                const modalFunction = function(){
                    showModalVerMais(events["Resultado da busca"][i]);
                }
                eventoDeletar.addEventListener("click",modalDelete);
                eventoVerMais.addEventListener("click", modalFunction);
                divEvents.appendChild(event);
            }
        }

    }else{
        showErrorMessage(await response.status + " - " + await response.text());
        showLoginButton();
    }
    
}
function showModalVerMais(evento){
    console.log(evento);

    if(document.getElementById('modalVerMais')) {
        return; 
    }
    
    const modalVerMais = document.createElement("div");
    modalVerMais.innerHTML = `
    <div class="modal fade" id="modalVerMais" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="verMaisLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h1 class="modal-title fs-5" id="verMais">${evento["TITULO"]}:</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p>${evento["DESCRICAO"]}</p>
                    <p>Período de apostas: ${evento["DATA_INICIO"]} - ${evento["DATA_FIM"]}</p>
                    <p>Data do evento: ${evento["DATA_EVENTO"]}</p>
                    <p>Valor da cota: ${evento["VALORCOTA"]}</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                </div>
            </div>
        </div>
    </div>`;
    document.body.appendChild(modalVerMais);

    const modal = new bootstrap.Modal(document.getElementById("modalVerMais"));
    modal.show();

    modalVerMais.addEventListener("hidden.bs.modal", function () {
        modal.dispose();
        modalVerMais.remove();
    });


}

function showModalDelete(evento) {
    console.log(evento);

    if(document.getElementById('modalDelete')) {
        return; 
    }
    
    const modalDelete = document.createElement("div");
    modalDelete.innerHTML = `
    <div class="modal fade" id="modalDelete" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="deleteLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h1 class="modal-title fs-5" id="verMais">Deletando evento</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p>Deseja mesmo deletar o evento ${evento["TITULO"]}?</p>
                    <p>${evento["DESCRICAO"]}</p>
                    <p>Período de apostas: ${evento["DATA_INICIO"]} - ${evento["DATA_FIM"]}</p>
                    <p>Data do evento: ${evento["DATA_EVENTO"]}</p>
                    <p>Valor da cota: ${evento["VALORCOTA"]}</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button  id="botaoDelete"type="button" class="btn btn-delete2">Deletar</button>
                </div>
            </div>
        </div>
    </div>`;
    let eventoSendTitulo = modalDelete.querySelector(".btn-delete2")
    const sendTitulo = function() {
        performDelete(evento["TITULO"])
    }

    document.body.appendChild(modalDelete);

    const modal = new bootstrap.Modal(document.getElementById("modalDelete"));
    modal.show();

    modalDelete.addEventListener("hidden.bs.modal", function () {
        modal.dispose();
        modalDelete.remove();
    });

    eventoSendTitulo.addEventListener("click", sendTitulo);



}
window.onload = function(){
    if(window.location.pathname.includes("myEvents")){
        PerformMyEvents()

        let campoBusca = document.getElementById("fieldBusca");
        let botaoBusca = document.getElementById("botaoBusca");
        
        function checkBuscar(){
            if(campoBusca.value.trim().length == 0){
                botaoBusca.disabled = true;
            }else{
                botaoBusca.disabled = false;
            }
        }

        checkBuscar();

        campoBusca.addEventListener("input", checkBuscar);
}
}