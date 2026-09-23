let listas = []
let listaAtual = null
let modoOrganizar = false;
let backupContador = 1;
let backupTitulo = "";
let backupLista = "";
let backupItens = [];
let tipoModal = "";
let idContador = 0;
let listaApagar = null;
let timeoutGaveta;
let menuCardAberto = null;
const container = document.querySelector(".container");
const inputNome = document.getElementById("inputModal");
const btnMenu = document.getElementById("btnMenu");
const menuGaveta = document.getElementById("menuGaveta");
const containerListas = document.getElementById("containerListas");


// =========================
// #region DELEGAÇÃO DE CLIQUES
// =========================

document.addEventListener("keydown", function(e){
    const modalAberto = document.querySelector(".modal[style*='display: flex']");
   if (e.key === "Enter" && modoOrganizar && !modalAberto) {
        order();
   }
});

document.addEventListener("click", function(e){
  if(!menuGaveta.classList.contains("aberto")) return; 
    if(!e.target.closest(".menuGaveta") && !e.target.closest("#btnMenu")){
        fecharGaveta();
    }
});

inputNome.addEventListener("keydown", function (e) {
if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation(); 
        confirmarModal();
    }
});

document.addEventListener("keydown", function (e){
   if(e.key === "Escape"){
      fecharModal(e);
   }
});

document.addEventListener("click", function(e) {
    if (!menuCardAberto) return;
    if(!e.target.closest(".menuCard") && !e.target.closest(".cardEditor")){
        menuCardAberto.remove();
        menuCardAberto = null;
    }
});


document.querySelectorAll(".modal").forEach(modal =>{
modal.addEventListener("click", function(e){
   if(!e.target.closest(".modalConteudo")){
      fecharModal();
   }
});
});

container.addEventListener("click", function (event) { 

    if (event.target.closest(".btnDeletor")) {
        let item = event.target.closest(".lista");
        if (item) {
            let id = item.id;
            listaAtual.itens = listaAtual.itens.filter(item => item.id !== id);
            item.remove();
        }
    };


   if (event.target.type === "checkbox") {
    let itemLista = event.target.closest(".lista");
    let texto = itemLista.querySelector("p");
    let chk = event.target.checked;
    if (chk) {
        event.target.setAttribute("checked", "checked");
        if (texto) texto.style.textDecoration = "line-through";
    } else {
        event.target.removeAttribute("checked");
        if (texto) texto.style.textDecoration = "none";
    }
    if(listaAtual && itemLista){
        let itemCHK = listaAtual.itens.find(item => item.id === itemLista.id)
        if(itemCHK) itemCHK.checked = chk;
    }
    limparLimpar();
};


    if (event.target.closest(".btnRename")) {
        let editor = event.target.closest(".btnRename");
        let itemLista = event.target.closest(".lista");
        let texto = itemLista.querySelector("p");
        let editando = itemLista.querySelector("#editorInput");

        if (container.hasAttribute("data-editando") && !editando) {
            mostrarAviso("Finalize a edição atual primeiro!");
            return;
        }

        if (!editando) {
            editor.innerHTML = '<i class="fa-solid fa-check"></i>';
            container.setAttribute("data-editando", "true");
            let editorInput = document.createElement("input");
            editorInput.id = "editorInput";
            editorInput.classList.add("inputLista");
            editorInput.value = texto.textContent;
            texto.parentNode.replaceChild(editorInput, texto);
            editorInput.focus();

            editorInput.addEventListener("keydown", function (e) {
                if (e.key === "Enter") {e.preventDefault(); e.stopPropagation(); 
                  salvar(editor, itemLista);}
            });
        } else {
            salvar(editor, itemLista);
        }
    };
}); 

btnMenu.addEventListener("click", function(e){
    e.stopPropagation();
  if(modoOrganizar){
    mostrarAviso("Finalize a edição primeiro!");
    return;
  }
  alternarGaveta();
});

//#endregion
// =========================
// #region DRAG AND DROP
// =========================

container.addEventListener("mousedown", (e) => {
    const handle = e.target.closest(".btnReorder");

    if (handle) {
        const item = handle.closest(".lista");

        if (item){
            item.setAttribute("draggable", "true");
        };
    }
});

container.addEventListener("dragend", (e) => {
    const item = e.target.closest(".lista");

    if (item) {
        item.setAttribute("draggable", "false");
        item.classList.remove("arrastando");

        const handle = item.querySelector(".btnReorder");
        handle.classList.remove("dragging");
        document.body.classList.remove("arrastando-ativo");
    }
    const novaOrdem = [...container.querySelectorAll(".lista")];
    const itensAntigos = listaAtual.itens;

    listaAtual.itens = novaOrdem.map(elemento =>{
        return itensAntigos.find(item => item.id == elemento.id);
    });
});

container.addEventListener("dragstart", (e) => {
    const item = e.target.closest(".lista");

    if (item && item.getAttribute("draggable") === "true") {
        const handle = item.querySelector(".btnReorder");
        handle.classList.add("dragging");
        const img = new Image();
        img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        e.dataTransfer.setDragImage(img, 0, 0);
        document.body.classList.add("arrastando-ativo");
        setTimeout(() => item.classList.add("arrastando"), 0);
    } else {
        e.preventDefault();
    }
});

const listaMutavel = (e) => {
    e.preventDefault();
    const itemArrastando = container.querySelector(".arrastando");
    if (!itemArrastando) return;
    const irmas = [...container.querySelectorAll(".lista:not(.arrastando)")];
    const proxIrma = irmas.find(irma => {
        return e.clientY <= irma.offsetTop + irma.offsetHeight / 2;
    });
    container.insertBefore(itemArrastando, proxIrma);
};

container.addEventListener("dragover", listaMutavel);

//#endregion
// =========================
// #region FUNÇÕES AUXILIARES
// =========================
function salvar(editor, itemLista) {
    let editorInput = itemLista.querySelector("#editorInput");
    let checkbox = itemLista.querySelector("input[type='checkbox']");

    if (!editorInput) return;

    if (editorInput.value.trim() === "") {
        listaAtual.itens = listaAtual.itens.filter(item => item.id !== itemLista.id);
        itemLista.remove();
    } else {
        let novoTexto = document.createElement("p");
        let itemDados = listaAtual.itens.find(item => item.id === itemLista.id);

        if(itemDados) itemDados.nome = editorInput.value;
        
        novoTexto.textContent = editorInput.value;
        novoTexto.classList.add("listaCont");

        if (checkbox && checkbox.checked) {
            novoTexto.style.textDecoration = "line-through";
        }

        editorInput.parentNode.replaceChild(novoTexto, editorInput);
        editor.innerHTML = '<i class="fa-solid fa-pencil"></i>';
        
    }
    container.removeAttribute("data-editando");
}

function criarLista() {
    document.getElementById("btnOrder").style.display = "none";
    fecharGaveta();
    tipoModal = "lista"
    document.getElementById("modalLista").style.display = "flex";
    const inputNome = document.getElementById("inputModal");
    inputNome.placeholder = "Digite o nome da lista"
    inputNome.value = "";
    inputNome.focus();
}

function rmvChecked() {
    document.getElementById("modalLimpar").style.display = "flex";
}

function fecharModal() {
    document.querySelectorAll(".modal").forEach(modal => {
        modal.style.display = "none";
    });
}

function confirmarAcao(e) {
    if(listaApagar){
        apagarLista();
        listaApagar = null;
        fecharModal();
        return;
    }

    const checkboxes = document.querySelectorAll("input[type='checkbox']");
    checkboxes.forEach(box => {
        if (box.checked) {
            const item = box.closest(".lista");
            const id = item.id;

            listaAtual.itens = listaAtual.itens.filter(itens => itens.id !== id)
        
                item.remove();
        }
    });
    fecharModal();
}

function confirmarModal(e) {
    let nome = document.getElementById("inputModal").value;
    if (!nome){mostrarAviso("O campo não pode estar em branco!"); return;}

   if(tipoModal === "lista"){
    limparContainer();
     const novaLista = {
        nome: nome,
        itens: [],
        fixada: false
     };
     listas.push(novaLista);
     listaAtual = novaLista;

     idContador = 0;
     criarElementos(listaAtual);
     order();
    };

   if(tipoModal === "item"){
    const novoItem = {
        id: "item_" + idContador,
        nome: nome,
        checked: false
    }

    listaAtual.itens.push(novoItem);
    const item = criarItem(novoItem);
    container.appendChild(item);
    
    idContador++;
    }
    fecharModal();
}

function novoItem() {
     if(container.hasAttribute("data-editando")){
    mostrarAviso("Finalize a edição primeiro!");
    return;
  };
   tipoModal = "item";
    document.getElementById("btnOrder").style.display = "flex";
    document.getElementById("modalLista").style.display = "flex";
    const inputNome = document.getElementById("inputModal");
    inputNome.placeholder = "Digite o nome do item"
    inputNome.value = "";
    inputNome.focus();
}

function order() {
    if (!modoOrganizar) {
        document.getElementById("btnChecked").style.display = "none";
        let titulo = document.getElementById("menuAtual").innerText; 
        backupTitulo = document.getElementById("menuAtual").innerText;
    
        if(container.querySelector(".checkboxEstilo")){
            container.querySelectorAll(".checkboxEstilo").forEach(e =>{
                e.style.display = "none";
            });
        }

        container.querySelectorAll("input[type='checkbox']").forEach(box => {
            if (box.checked) {
                box.setAttribute("checked", "checked");
            } else {
                box.removeAttribute("checked");
            }
        });
        
        backupLista = container.innerHTML;
        backupItens = structuredClone(listaAtual.itens);
        backupContador = idContador;
        modoOrganizar = true;

        document.body.classList.add("organizando");
        document.getElementById("btnOrder").innerText = "Pronto";

        let tituloInput = document.createElement("input");
        let tituloLista = document.createElement("div");
        tituloLista.classList.add("tituloLista");
        tituloInput.id = "inputTitulo";
        tituloLista.id = "tituloLista";
        tituloInput.value = titulo;
        tituloInput.focus();
        tituloLista.appendChild(tituloInput);
        container.prepend(tituloLista);

        document.getElementById("menuAtual").innerText = "Editando";

    } else {
      let titulo = document.getElementById("inputTitulo").value
      document.getElementById("btnChecked").style.display = "none";
       if(!titulo){mostrarAviso("Título não pode ficar em branco!") 
         return;}

        listaAtual.nome = titulo;
        let tituloInput = document.getElementById("inputTitulo");
        let tituloLista = document.getElementById("tituloLista");

        if (tituloInput) {
            document.getElementById("menuAtual").innerText = titulo;
            tituloInput.remove();
            tituloLista.remove();
        }
        if (container.hasAttribute("data-editando")) {
            let editorInput = document.querySelector("#editorInput");
            if (editorInput) {
                let itemLista = editorInput.closest(".lista");
                let editor = itemLista.querySelector(".btnRename");
                salvar(editor, itemLista);
            }
        }

             if(container.querySelector(".checkboxEstilo")){
            container.querySelectorAll(".checkboxEstilo").forEach(e =>{
                e.style.display = "";
            });
        }
        
        modoOrganizar = false;
        document.body.classList.remove("organizando");
        document.getElementById("btnOrder").innerText = "Editar";
        backupLista = "";
        limparLimpar();
    }
}

function cancel() {
    let tituloInput = document.getElementById("inputTitulo");
    if (tituloInput) {
       document.getElementById("menuAtual").innerText = backupTitulo;
    }
    listaAtual.itens = backupItens;
    container.innerHTML = backupLista;
    container.removeAttribute("data-editando");
    idContador = backupContador;
    modoOrganizar = false;
    document.body.classList.remove("organizando");
    document.getElementById("btnOrder").innerText = "Editar"
    fecharModal();
}

function mostrarAviso(mensagem) {
    let toast = document.getElementById("toastAviso");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toastAviso";
        toast.style.cssText = `
            position: fixed; bottom: 20px; right: 20px;
            background: #73655d; color: #f2ded0;
            padding: 12px 20px; border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
            z-index: 9999; transition: opacity 0.4s ease;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = mensagem;
    toast.style.opacity = "1";

    setTimeout(() => {
        toast.style.opacity = "0";
    }, 2500);
    setTimeout(() => {
        toast.remove()
    }, 3000);
};

function modalCancelar(){
     document.getElementById("modalCancelar").style.display = "flex";
};

function mostrarListas(){
    document.getElementById("menuAtual").innerText = "Minhas Listas";
    document.getElementById("btnOrder").style.display = "none";
    document.getElementById("containerListas").style.display = "grid"
    fecharGaveta();
    listaAtual = null;
    limparContainer();
    limparLimpar()

   const listaOrdenada = listas.toSorted((a, b) =>{
    if (a.fixada !== b.fixada){
        return b.fixada - a.fixada;
    }
    return a.nome.localeCompare(b.nome);
   })

    if(listas.length === 0){
        const aviso = document.createElement("h1");
        aviso.classList.add("erroAviso");
        aviso.textContent = "Você não tem listas.";
        container.appendChild(aviso);
        return;
        };

    listaOrdenada.forEach(lista =>{
        const areaMenu = document.createElement("div");
        areaMenu.classList.add("areaMenu");

        const card = document.createElement("div");
        card.classList.add("cardLista");

        const titulo = document.createElement("h3");
        titulo.textContent = lista.nome;
        card.appendChild(titulo);

        const cardEditar = document.createElement("button");
        cardEditar.innerHTML = "⋮";
        cardEditar.classList.add("cardEditor");

        cardEditar.addEventListener("click", function(e){
            e.stopPropagation();

            if(menuCardAberto){
                menuCardAberto.remove();
                menuCardAberto = null;
                return;
            }

            const menuCard = document.createElement("div");
            menuCard.classList.add("menuCard")

            menuCardAberto = menuCard;

            const btnEditar = document.createElement("button");
            btnEditar.classList.add("btn", "btnCard", "btnRename");
            btnEditar.innerHTML = '<i class="fa-solid fa-pencil"></i> Editar';
            menuCard.appendChild(btnEditar);
            btnEditar.addEventListener("click", function(e){
                e.stopPropagation();

                listaAtual = lista;
                criarElementos(listaAtual);
                order();
            })

            const btnApagar = document.createElement("button");
            btnApagar.classList.add("btn", "btnApagar", "btnCard");
            btnApagar.innerHTML = '<i class="fa-solid fa-trash"></i> Apagar';
            menuCard.appendChild(btnApagar);
            btnApagar.addEventListener("click", function(e){
                e.stopPropagation();
                listaApagar = lista;
                document.getElementById("limparLista").innerText =
                    `Você está prestes a apagar a lista "${lista.nome}".`;
                document.getElementById("modalLimpar").style.display = "flex";
            })
            
            areaMenu.appendChild(menuCard);
        });
        
        areaMenu.appendChild(cardEditar);
        card.appendChild(areaMenu);

       lista.itens.slice(0,5).forEach(item =>{
        const conteudo = document.createElement("p");
        conteudo.textContent = (item.checked ? "☑ " : "☐ ") + item.nome;
        card.appendChild(conteudo);

       });
       
    card.addEventListener("click", function(){
        listaAtual = lista;
        criarElementos(listaAtual);
        if(listaAtual.itens.length == 0){ 
            order();
        }
    });

    const pin = document.createElement("button");
    pin.classList.add("btn", "btnFixar");

      if(lista.fixada){
       pin.innerHTML = "★";
      }else{
       pin.innerHTML = "☆";
      };

    card.appendChild(pin);
    pin.addEventListener("click", function(e){
        e.stopPropagation();
      lista.fixada = !lista.fixada;

       mostrarListas();
    });

    containerListas.appendChild(card);
     });
};

function mostrarTemas(){
    document.getElementById("menuAtual").innerText = "Temas";
    document.getElementById("btnOrder").style.display = "none";
    fecharGaveta();
    listaAtual = null;
    limparContainer();
    limparLimpar()

    document.getElementById("containerTemas").style.display = "grid";
}

function mudarTema(tema){
    document.body.classList.remove("temaMatcha", "temaEscuro");
    if(tema === "matcha"){
        document.body.classList.add("temaMatcha");
    }
    if(tema === "escuro"){
        document.body.classList.add("temaEscuro");
    }
}

function limparLimpar(){
    const btnLimpar = document.getElementById("btnChecked");
    if (!btnLimpar)return;
    const checados = document.querySelectorAll("input[type='checkbox']:checked").length;
    btnLimpar.style.display = checados > 0 ? "flex" : "none";
}

function limparContainer(){
    document.getElementById("Titulo").innerText = "";
    document.getElementById("containerTemas").style.display = "none";
    container.innerHTML = "";
    containerListas.innerHTML = "";
}

function criarElementos(listaAtual){
    limparContainer();
    document.getElementById("btnOrder").style.display = "flex";
    document.getElementById("menuAtual").innerText = listaAtual.nome;   

    listaAtual.itens.forEach(itemData =>{
        const item = criarItem(itemData);                                  
        container.appendChild(item);
        idContador++;     
    });

    limparLimpar();
}

function apagarLista(){
    const indice = listas.findIndex(item => item === listaApagar);
    listas.splice(indice, 1);

    mostrarListas();
}

function criarItem(itemData){
        const item = document.createElement("div");
        item.classList.add("lista");
        item.draggable = false;
        item.id = itemData.id;

        const p = document.createElement("p");                                                                                 
        p.textContent = itemData.nome;                                                                                 
        p.classList.add("listaCont");                                                                                 

        const label = document.createElement("label");
        label.classList.add("checkboxEstilo");
        if(modoOrganizar){
        label.style.display = "none";
        }

        const check = document.createElement("input");
        check.classList.add("checkbox");
        check.type = "checkbox";
        check.checked = itemData.checked;
         if(check.checked) p.style.textDecoration = "line-through";
        
                                                                                     
        const editor = document.createElement("button");                                                                                 
        editor.innerHTML = '<i class="fa-solid fa-pencil"></i>';                                                                                 
        editor.classList.add("btnEditor", "btnRename");                                                                                 
                                                                                     
        const deletor = document.createElement("button");                                                                                 
        deletor.innerHTML = '<i class="fa-solid fa-trash"></i>';                                                                                 
        deletor.classList.add("btnEditor", "btnDeletor");                                                                                 
                                                                                     
        const reorder = document.createElement("button");                                                                                 
        reorder.innerHTML = `
    <svg viewBox="0 0 24 24" class="icon-reorder">
        <path d="M5 10H19M14 19L12 21L10 19M14 5L12 3L10 5M5 14H19"></path>
    </svg>`;                   
        reorder.classList.add("btnEditor", "btnReorder");   

    const botoes = document.createElement("div");
    botoes.classList.add("btnLista");

    label.appendChild(check);
    botoes.append(editor, deletor, reorder);
    item.append(label, p, botoes);

    return item;
}

function alternarGaveta(){
    clearTimeout(timeoutGaveta);
    if(menuGaveta.classList.contains("aberto")){
        menuGaveta.classList.remove("aberto");
        timeoutGaveta = setTimeout(() => {
            btnMenu.innerHTML = '<i class="fa-solid fa-bars"></i>';
        }, 150);
    } else {
        menuGaveta.classList.add("aberto");
        btnMenu.innerHTML = '<i class="fa-solid fa-x"></i> Fechar';
    }
}

function fecharGaveta(){
    clearTimeout(timeoutGaveta);
    if(!menuGaveta.classList.contains("aberto")) return;
    menuGaveta.classList.remove("aberto");
    timeoutGaveta = setTimeout(() => {
        btnMenu.innerHTML = '<i class="fa-solid fa-bars"></i>';
    }, 150);
}



//#endregion

mostrarListas();