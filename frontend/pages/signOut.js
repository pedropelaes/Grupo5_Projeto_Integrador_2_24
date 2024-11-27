import { switchWindow } from "./home/home.js"; 

export async function signOut(){
    const response = await fetch(
        window.IP + "/signOut",{
            method: "POST",
        }
    );
    if(response.ok){
        console.log(response.status + " - " + await response.text());
        location.reload();
        switchWindow('/frontend/pages/login/login.html')

    }else{
        console.log(response.status + " - " + await response.text());
        location.reload();
        switchWindow('/frontend/pages/login/login.html')
    }
}
window.signOut = signOut;