function performAddFunds() {
    const amount = document.getElementById("amount").value;
    const messageBox = document.getElementById("message");
    const successBox = document.getElementById("success");

    if (!amount || amount <= 0) {
        messageBox.textContent = "Por favor, insira um valor válido.";
        successBox.textContent = "";
        return;
    }

    messageBox.textContent = "";
    successBox.textContent = `Fundos de R$ ${amount} adicionados com sucesso!`;
}