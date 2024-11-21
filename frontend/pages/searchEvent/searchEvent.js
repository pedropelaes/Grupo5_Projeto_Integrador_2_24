function switchWindow(caminho){
    window.location.href = caminho;
}

function searchEventbyButton(){
    pesquisa = document.getElementById("fieldBusca").value;
    sessionStorage.setItem("busca", pesquisa);
    switchWindow("/frontend/pages/searchEvent/searchEvent.html");
}

async function performSearch(){
    let busca = sessionStorage.getItem("busca")
    const reqHearders = new Headers();
    reqHearders.append("Content-Type", "text/plain");
    reqHearders.append("pesquisa", busca);

    const response = await fetch(
        "http://192.168.0.10:3000/searchEvent",{
            method: "POST",
            headers: reqHearders
        }
    );
    if(response.ok){
        const resultado = await response.json();
        console.log(resultado);
        console.log(resultado["Resultado da busca"][0]);
        console.log(resultado["Resultado da busca"].length);
        let buscaVazia = document.getElementById("buscaVazia");
        if(resultado["Resultado da busca"] != null){
            buscaVazia.hidden = true;
        }else{
            buscaVazia.hidden = false;
        }

        const div = document.getElementById("resultado");

        for(let i = 0; i<resultado["Resultado da busca"].length; i++){
            let event = document.createElement("div");
            event.classList.add("card", "mx-2", "mb-3");
            event.style.width = "18rem";

            event.innerHTML=`
                <img src="/frontend/res/images/icone_japabet.ico" class="card-img-top" alt="Evento">
                    <div class="card-body">
                        <h5 class="card-title">${resultado["Resultado da busca"][i]["TITULO"]}</h5>
                        <p class="card-text">${resultado["Resultado da busca"][i]["DESCRICAO"]}</p>
                        <a href="#" class="btn btn-danger"><i class="fas fa-coins"></i> Apostar</a>
                        <a href="#" class="btn btn-vermais">
                            <i class="fas fa-search"></i> Ver mais</a>
                </div>`

            let eventoVerMais = event.querySelector(".btn-vermais");
            
            
            const modalFunction = function(){
                console.log(resultado["Resultado da busca"][i]);
                showModalVerMais(resultado["Resultado da busca"][i]);
            }

            eventoVerMais.addEventListener("click", modalFunction);

            div.appendChild(event);
        }
        
    }
}
//evento = resultado["Resultado da busca"][i]
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
                    <p>Período de apostas: ${evento["INICIO"]} - ${evento["FIM"]}</p>
                    <p>Data do evento: ${evento["DATA"]}</p>
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

    performSearch();
    
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
