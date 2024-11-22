function switchWindow(caminho){
    window.location.href = caminho;
}
function bet(titulo){
    switchWindow("/frontend/pages/betOnEvent/betOnEvent.html")
    sessionStorage.setItem("titulo", titulo);
}
var busca = null;

function searchEvent(categoria){
    busca = categoria;
    sessionStorage.setItem("busca", categoria);
    switchWindow("/frontend/pages/searchEvent/searchEvent.html");
    
}
function searchEventbyButton(){
    pesquisa = document.getElementById("fieldBusca").value;
    sessionStorage.setItem("busca", pesquisa);
    switchWindow("/frontend/pages/searchEvent/searchEvent.html");
}

async function PerformShowEvents(){
    const response = await fetch(
        window.IP + "/home",{
            method: "POST",
        }
    );
    if(response.ok){
        const events = await response.json();
        const maisApostados = events.maisApostados;
        const maisProximos = events.maisProximos;

        const divProximos = document.getElementById("proximosDeVencer");
        const divMaisApostados = document.getElementById("maisApostados");
        
        for(let i = 0; i<maisProximos.length; i++){
            let event = document.createElement("div");
            event.classList.add("card", "mx-2", "mb-3");
            event.style.width = "18rem";

            event.innerHTML=`
                <img src="/frontend/res/images/icone_japabet.ico" class="card-img-top" alt="Evento">
                    <div class="card-body">
                        <h5 class="card-title">${maisProximos[i][0]}</h5>
                        <p class="card-text">${maisProximos[i][1]}</p>
                        <a href="#" class="btn btn-danger" type="button" onclick="bet('${(maisProximos[i][0])}')"><i class="fas fa-coins"></i> Apostar</a>
                        <a href="#" class="btn btn-vermais"><i class="fas fa-search"></i> Ver mais</a>
                </div>`;

            let eventoVerMais = event.querySelector(".btn-vermais");
        
            
            const modalFunction = function(){
                console.log(maisProximos[i]);
                showModalVerMais(maisProximos[i]);
            }
    
            eventoVerMais.addEventListener("click", modalFunction);

            divProximos.appendChild(event);
        }
        
        for(let i = 0; i<maisApostados.length; i++){
            let event = document.createElement("div");
            event.classList.add("card", "mx-2", "mb-3");
            event.style.width = "18rem";

            event.innerHTML=`
                <img src="/frontend/res/images/icone_japabet.ico" class="card-img-top" alt="Evento">
                    <div class="card-body">
                        <h5 class="card-title">${maisApostados[i][0]}</h5>
                        <p class="card-text">${maisApostados[i][1]}</p>
                        <a href="#" class="btn btn-danger" type="button" onclick="bet('${maisApostados[i][0]}')"><i class="fas fa-coins"></i> Apostar</a>
                        <a href="#" class="btn btn-vermais"><i class="fas fa-search"></i> Ver mais</a>
                </div>`;

            let eventoVerMais = event.querySelector(".btn-vermais");
            
            //0-titulo 1-descricao 2-datainicio 3-datafim 4-dataevento 5-valorcota
            const modalFunction = function(){
                console.log(maisApostados[i]);
                showModalVerMais(maisApostados[i]);
            }
    
            eventoVerMais.addEventListener("click", modalFunction);

            divMaisApostados.appendChild(event);
        }
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
                    <h1 class="modal-title fs-5" id="verMais">${evento[0]}:</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p>${evento[1]}</p>
                    <p>Período de apostas: ${evento[2]} - ${evento[3]}</p>
                    <p>Data do evento: ${evento[4]}</p>
                    <p>Valor da cota: ${evento[5]}</p>
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
    PerformShowEvents();
    
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