function switchWindow(caminho){
    window.location.href = caminho;
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
        "http://192.168.0.10:3000/home",{
            method: "POST",
        }
    );
    if(response.ok){
        const events = await response.json();
        const maisApostados = events.maisApostados;
        const maisProximos = events.maisProximos;

        const divProximos = document.getElementById("proximosDeVencer");
        const divMaisApostados = document.getElementById("maisApostados");
        
        for(var i = 0; i<maisProximos.length; i++){
            let event = document.createElement("div");
            event.classList.add("card", "mx-2", "mb-3");
            event.style.width = "18rem";

            event.innerHTML=`
                <img src="/frontend/res/images/icone_japabet.ico" class="card-img-top" alt="Evento">
                    <div class="card-body">
                        <h5 class="card-title">${maisProximos[i][0]}</h5>
                        <p class="card-text">${maisProximos[i][1]}</p>
                        <a href="#" class="btn btn-danger"><i class="fas fa-coins"></i> Apostar</a>
                        <a href="#" class="btn btn-vermais"><i class="fas fa-search"></i> Ver mais</a>
                </div>`

            divProximos.appendChild(event);
        }
        
        for(var i = 0; i<maisApostados.length; i++){
            let event = document.createElement("div");
            event.classList.add("card", "mx-2", "mb-3");
            event.style.width = "18rem";

            event.innerHTML=`
                <img src="/frontend/res/images/icone_japabet.ico" class="card-img-top" alt="Evento">
                    <div class="card-body">
                        <h5 class="card-title">${maisApostados[i][0]}</h5>
                        <p class="card-text">${maisApostados[i][1]}</p>
                        <a href="#" class="btn btn-danger"><i class="fas fa-coins"></i> Apostar</a>
                        <a href="#" class="btn btn-vermais"><i class="fas fa-search"></i> Ver mais</a>
                </div>`

            divMaisApostados.appendChild(event);
        }
    }
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