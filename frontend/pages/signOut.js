export async function signOut(){
    const response = await fetch(
        window.IP + "/signOut",{
            method: "POST",
        }
    );
    if(response.ok){
        console.log(response.status + " - " + await response.text());
        location.reload();
    }else{
        console.log(response.status + " - " + await response.text());
        location.reload();
    }
}
window.signOut = signOut;