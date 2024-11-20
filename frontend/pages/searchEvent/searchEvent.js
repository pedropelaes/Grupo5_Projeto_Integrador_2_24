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

        for(var i = 0; i<resultado["Resultado da busca"].length; i++){
            let event = document.createElement("div");
            event.classList.add("card", "mx-2", "mb-3");
            event.style.width = "18rem";

            event.innerHTML=`
                <img src="/frontend/res/images/icone_japabet.ico" class="card-img-top" alt="Evento">
                    <div class="card-body">
                        <h5 class="card-title">${resultado["Resultado da busca"][i]["TITULO"]}</h5>
                        <p class="card-text">${resultado["Resultado da busca"][i]["DESCRICAO"]}</p>
                        <p class="card-text">Período de apostas: ${resultado["Resultado da busca"][i]["TO_CHAR(DATA_INICIO,'DD/MM')"]} - ${resultado["Resultado da busca"][i]["TO_CHAR(DATA_FIM,'DD/MM')"]}</p>
                        <p class="card-text">Valor das cotas: R$${resultado["Resultado da busca"][i]["VALORCOTA"]}</p>
                        <a href="#" class="btn btn-danger">Apostar</a>
                </div>`

            div.appendChild(event);
        }
        
    }
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