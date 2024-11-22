function switchWindow(caminho){
    window.location.href = caminho;
}
function bet(titulo){
    switchWindow("/frontend/pages/betOnEvent/betOnEvent.html")
    sessionStorage.setItem("titulo", titulo);
}
function searchEventbyButton(){
    pesquisa = document.getElementById("fieldBusca").value;
    sessionStorage.setItem("busca", pesquisa);
    switchWindow("/frontend/pages/searchEvent/searchEvent.html");
}
function showErrorMessage(messageContent){
    document.getElementById("message").innerHTML = messageContent;
    var divMb = document.getElementById("messageBox");
    divMb.style.display = "block";
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
                </div>`;
            let eventoVerMais = event.querySelector(".btn-vermais");
    
        
            const modalFunction = function(){
                showModalVerMais(events["Resultado da busca"][i]);
            }
    
            eventoVerMais.addEventListener("click", modalFunction);
            divEvents.appendChild(event);
        }

    }else{
        showErrorMessage(await response.status + " - " + await response.text());
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
window.onload = function(){
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