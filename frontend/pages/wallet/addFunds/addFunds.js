function toggleInputField() {
    const method = document.querySelector('input[name="metodoSaque"]:checked').value;
    document.getElementById('pixField').style.display = method === 'pix' ? 'block' : 'none';
    document.getElementById('contaField').style.display = method === 'conta' ? 'block' : 'none';
}