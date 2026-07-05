let db = { lotes: [], equipe: [], produtos: [], vendas: [] };
let categoriaAtivaVitrine = 'Todos';

// Número do seu WhatsApp para receber os pedidos dos clientes
const WHATSAPP_NUMERO = "5511999999999"; // Substitua com o seu número real (DDD + número)
const SENHA_ADMIN_PRO = "1234"; // Sua senha de acesso para as telas de gestão

// Mapeamento das telas
function navegarPara(idTela) {
    // 1. Remove a classe 'ativa' de todas as telas
    document.querySelectorAll('.tela-painel').forEach(tela => {
        tela.classList.remove('ativa');
    });

    // 2. Remove a classe 'active' de todos os botões do menu lateral
    document.querySelectorAll('.menu-section button, .sidebar-menu button').forEach(btn => {
        btn.classList.remove('active');
    });

    // 3. Mostra a tela desejada
    const telaAlvo = document.getElementById(idTela);
    if (telaAlvo) {
        telaAlvo.classList.add('ativa');
    }

    // 4. Destaca o botão correspondente no menu de forma segura
    const todosBotoes = document.querySelectorAll('button[onclick]');
    const btnNav = Array.from(todosBotoes).find(btn => {
        const attr = btn.getAttribute('onclick');
        return attr && attr.includes(idTela);
    });
    
    if (btnNav) {
        btnNav.classList.add('active');
    }
}

// Filtros específicos da Vitrine (Estilo E-Commerce)
function filtrarProdutosVitrine(categoria) {
    categoriaAtivaVitrine = categoria;
    document.querySelectorAll('.btn-filtro-cat').forEach(btn => {
        if(btn.textContent.includes(categoria)) btn.classList.add('ativa');
        else btn.classList.remove('ativa');
    });
    renderizarVitrineLoja();
}


// ==========================================
// 🧵 GERENCIAMENTO DE LOTES (GLOBAL ENTRE MESES)
// ==========================================
document.getElementById('btn-salvar-lote').addEventListener('click', () => {
    const idEdicao = document.getElementById('lote-id-edicao').value;
    const nome = document.getElementById('lote-nome').value.trim();
    const valor = parseFloat(document.getElementById('lote-valor').value) || 0;
    const metrosTotais = parseFloat(document.getElementById('lote-metros').value) || 0;
    const perda = parseFloat(document.getElementById('lote-perda').value) || 0;
    const mesAtual = document.getElementById('filtro-mes-global').value;

    if (!nome || metrosTotais <= 0) return alert('Por favor, preencha o nome e a metragem do rolo!');

    if (idEdicao) {
        const lote = db.lotes.find(l => l.id == idEdicao);
        if (lote) { 
            lote.nome = nome; lote.valor = valor; lote.metrosTotais = metrosTotais; lote.perda = perda; 
        }
        document.getElementById('lote-id-edicao').value = '';
        document.getElementById('btn-salvar-lote').textContent = 'Registrar Compra de Lote';
    } else {
        // Lote guardado com o mês em que foi comprado, mas visível sempre!
        db.lotes.push({ id: Date.now(), nome, valor, metrosTotais, perda, mesCompra: mesAtual });
    }

    document.getElementById('lote-nome').value = '';
    document.getElementById('lote-valor').value = '';
    document.getElementById('lote-metros').value = '';
    salvarESincronizarTudo();
});

function calcularMetragemGastaLote(loteId) {
    // Soma o gasto de todos os produtos que usaram esse lote
    return db.produtos
        .filter(p => p.loteId == loteId)
        .reduce((soma, p) => soma + ((p.metrosGastoUnitario || 0) * (p.qtdInicial || 0)), 0);
}

function atualizarLotesTela() {
    const lista = document.getElementById('lista-lotes-cadastrados');
    const selectLoteProd = document.getElementById('prod-lote-selecionado');
    if (!lista || !selectLoteProd) return;

    lista.innerHTML = '';
    selectLoteProd.innerHTML = '<option value="">-- Selecione o Lote --</option>';

    // Lotes aparecem sempre (independente do mês) para permitir o uso contínuo
    db.lotes.forEach(l => {
        const metrosGastos = calcularMetragemGastaLote(l.id);
        const metrosDisponiveis = l.metrosTotais - metrosGastos;
        const porcentagemRestante = Math.max(0, ((metrosDisponiveis / l.metrosTotais) * 100).toFixed(1));

        lista.innerHTML += `
            <li>
                <div style="display:flex; justify-content:space-between; font-weight:bold;">
                    <span>${l.nome} (Comprado em: ${l.mesCompra})</span>
                    <span>R$ ${l.valor.toFixed(2)}</span>
                </div>
                <div style="font-size:0.85rem; color:#64748b; margin:4px 0;">
                    📏 Saldo: ${metrosDisponiveis.toFixed(1)}m / ${l.metrosTotais}m totais
                </div>
                <div class="barra-progresso-container" style="background:#e2e8f0; border-radius:4px; height:8px; overflow:hidden; margin:6px 0;">
                    <div style="background:#10b981; width: ${porcentagemRestante}%; height:100%;"></div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="badge-alerta" style="background:#dcfce7; color:#15803d; padding:2px 6px; border-radius:4px; font-size:0.75rem;">${porcentagemRestante}% restante</span>
                    <div>
                        <button onclick="prepararEdicaoLote(${l.id})" style="background:none; border:none; cursor:pointer;">✏️</button>
                        <button onclick="excluirLote(${l.id})" style="background:none; border:none; cursor:pointer; margin-left:6px;">🗑️</button>
                    </div>
                </div>
            </li>`;
            
        selectLoteProd.innerHTML += `<option value="${l.id}">${l.nome} (${porcentagemRestante}% disp.)</option>`;
    });
}

function prepararEdicaoLote(id) {
    const lote = db.lotes.find(l => l.id == id);
    if (!lote) return;
    document.getElementById('lote-id-edicao').value = lote.id;
    document.getElementById('lote-nome').value = lote.nome;
    document.getElementById('lote-valor').value = lote.valor;
    document.getElementById('lote-metros').value = lote.metrosTotais;
    document.getElementById('lote-perda').value = lote.perda;
    document.getElementById('btn-salvar-lote').textContent = 'Salvar Alterações';
}

function excluirLote(id) { if(confirm('Remover este lote definitivamente?')) { db.lotes = db.lotes.filter(l => l.id !== id); salvarESincronizarTudo(); } }

// ==========================================
// 👥 LINHA DE FRENTE (EQUIPE)
// ==========================================
document.getElementById('btn-salvar-func').addEventListener('click', () => {
    const idEdicao = document.getElementById('func-id-edicao').value;
    const nome = document.getElementById('func-nome').value.trim();
    const pecas = parseInt(document.getElementById('func-pecas').value) || 0;
    const precoPorPeca = parseFloat(document.getElementById('func-pago-por-peca').value) || 0;
    const mesAtivo = document.getElementById('filtro-mes-global').value;

    if (!nome) return alert('Insira o nome do colaborador!');

    if (idEdicao) {
        const func = db.equipe.find(f => f.id == idEdicao);
        if (func) { func.nome = nome; func.pecas = pecas; func.pago = pecas * precoPorPeca; }
        document.getElementById('func-id-edicao').value = '';
    } else {
        db.equipe.push({ id: Date.now(), nome, pecas, pago: pecas * precoPorPeca, mes: mesAtivo });
    }
    document.getElementById('func-nome').value = '';
    document.getElementById('func-pecas').value = '';
    document.getElementById('func-pago-por-peca').value = '';
    salvarESincronizarTudo();
});

function atualizarEquipeTela() {
    const selectFuncProd = document.getElementById('prod-func-selecionado');
    const rankingLista = document.getElementById('lista-ranking-produtividade');
    if (!selectFuncProd || !rankingLista) return;

    selectFuncProd.innerHTML = '<option value="">-- Selecione o Produtor --</option>';
    rankingLista.innerHTML = '';

    let totalMaoObra = 0;
    let totalPecas = 0;
    const mesAtivo = document.getElementById('filtro-mes-global').value;

    db.equipe.filter(f => f.mes === mesAtivo).forEach(f => {
        totalMaoObra += f.pago;
        totalPecas += f.pecas;
        rankingLista.innerHTML += `<li>👤 <strong>${f.nome}</strong> - Confeccionou ${f.pecas} pçs <span style="float:right; color:#15803d; font-weight:bold;">R$ ${f.pago.toFixed(2)}</span></li>`;
    });

    // Popula o select independente de mês para permitir vincular a ficha técnica
    db.equipe.forEach(f => {
        if (!Array.from(selectFuncProd.options).some(o => o.value == f.id)) {
            selectFuncProd.innerHTML += `<option value="${f.id}">${f.nome}</option>`;
        }
    });

    document.getElementById('dash-total-pago').textContent = totalMaoObra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('dash-total-pecas').textContent = totalPecas;
}

// ==========================================
// ⚙️ ENGENHARIA DE PRODUTO & ENGINE PRECIFICADORA
// ==========================================
function calcularPrecoProdutoDinamico() {
    const loteId = document.getElementById('prod-lote-selecionado').value;
    const funcId = document.getElementById('prod-func-selecionado').value;
    const metrosGasto = parseFloat(document.getElementById('prod-lote-metros-gasto').value) || 0;
    const margemEmpresa = parseFloat(document.getElementById('prod-lucro-empresa').value) || 0;

    let custoMaterialUnitario = 0;
    let custoMaoDeObraUnitaria = 0;

    if (loteId) {
        const lote = db.lotes.find(l => l.id == loteId);
        if (lote && lote.metrosTotais > 0) {
            // Custo por metro = Valor do rolo / Metragem total
            const custoPorMetro = lote.valor / lote.metrosTotais;
            custoMaterialUnitario = (custoPorMetro * metrosGasto) * (1 + (lote.perda / 100));
        }
    }
    if (funcId) {
        const func = db.equipe.find(f => f.id == funcId);
        if (func && func.pecas > 0) {
            custoMaoDeObraUnitaria = func.pago / func.pecas;
        }
    }

    const precoSugerido = (custoMaterialUnitario + custoMaoDeObraUnitaria) * (1 + (margemEmpresa / 100));

    document.getElementById('view-custo-mat').textContent = custoMaterialUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('view-custo-mo').textContent = custoMaoDeObraUnitaria.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('view-preco-final').textContent = precoSugerido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return { custoMaterialUnitario, custoMaoDeObraUnitaria, precoSugerido };
}

// Escuta mudanças nos inputs de engenharia para atualizar o cálculo em real-time
['prod-lote-selecionado', 'prod-func-selecionado', 'prod-lote-metros-gasto', 'prod-lucro-empresa'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('change', calcularPrecoProdutoDinamico);
        el.addEventListener('input', calcularPrecoProdutoDinamico);
    }
});

document.getElementById('btn-salvar-produto').addEventListener('click', () => {
    const nome = document.getElementById('prod-nome').value.trim();
    const qtdInput = document.getElementById('prod-qtd');
    const qtd = parseInt(qtdInput.value) || 0;
    const cor = document.getElementById('prod-cor').value.trim() || 'Única';
    const categoria = document.getElementById('prod-categoria').value;
    const linkLoja = document.getElementById('prod-loja').value.trim();
    const loteId = document.getElementById('prod-lote-selecionado').value;
    const metrosGasto = parseFloat(document.getElementById('prod-lote-metros-gasto').value) || 0;

    if (!nome || qtd <= 0) return alert('Preencha o Nome Comercial e a Quantidade produzida!');
    
    const calculos = calcularPrecoProdutoDinamico();

    db.produtos.push({
        id: Date.now(),
        nome,
        qtdInicial: qtd,
        cor,
        categoria,
        linkLoja,
        loteId,
        metrosGastoUnitario: metrosGasto,
        mes: document.getElementById('filtro-mes-global').value,
        custoMaterial: calculos.custoMaterialUnitario,
        custoMO: calculos.custoMaoDeObraUnitaria,
        precoVenda: calculos.precoSugerido
    });

    // LIMFANDO INPUTS E RESETANDO A QUANTIDADE (Sua solicitação!)
    document.getElementById('prod-nome').value = '';
    qtdInput.value = ''; 
    document.getElementById('prod-cor').value = '';
    document.getElementById('prod-loja').value = '';
    document.getElementById('prod-lote-metros-gasto').value = '';
    
    salvarESincronizarTudo();
    alert('Produto inserido com sucesso na vitrine!');
});

// ==========================================
// 🏪 ENGINE DA VITRINE DIGITAL (LOJA ADAPTÁVEL)
// ==========================================
function renderizarVitrineLoja() {
    const grid = document.getElementById('produtos-exibicao');
    if (!grid) return;
    grid.innerHTML = '';

    const isAdmin = localStorage.getItem("adminLogado") === "true";
    const mesAtivo = document.getElementById('filtro-mes-global').value;

    // Filtra por categoria e exibe os produtos correspondentes
    const filtrados = db.produtos.filter(p => {
        const matchCat = (categoriaAtivaVitrine === 'Todos' || p.categoria === categoriaAtivaVitrine);
        return matchCat;
    });

    if(filtrados.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 6px; color: #94a3b8; font-size:1rem;">Nenhum produto em exposição nesta categoria.</div>`;
        return;
    }

    filtrados.forEach(p => {
        const qtdVendida = db.vendas.filter(v => v.produtoId == p.id).reduce((sum, v) => sum + v.quantidade, 0);
        const estoqueDisponivel = Math.max(0, p.qtdInicial - qtdVendida);
        
        // Configuração do Botão de Compra Inteligente
        let botaodeCompraHTML = '';
        if (p.linkLoja) {
            // Se tiver link (Mercado Livre/Enjoei), vai direto pra lá
            botaodeCompraHTML = `<a href="${p.linkLoja}" target="_blank" class="btn-comprar-vitrine link-externo">🛍️ Ver no Site de Vendas</a>`;
        } else {
            // Se não tiver link, vira fluxo automático para o WhatsApp formatado
            const textoMensagem = encodeURIComponent(`Olá Ana! Gostei muito de ver a peça "${p.nome}" no seu Catálogo e gostaria de saber sobre a disponibilidade na cor: ${p.cor}.`);
            const linkWhats = `https://wa.me/${WHATSAPP_NUMERO}?text=${textoMensagem}`;
            botaodeCompraHTML = `<a href="${linkWhats}" target="_blank" class="btn-comprar-vitrine whats">💬 Comprar pelo WhatsApp</a>`;
        }

        // Se for administrador logado, exibe os botões secretos de gerenciar estoques e remover
        const painelGerenciamentoInterno = isAdmin ? `
            <div class="painel-interno-admin-card" style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 10px; margin-top: 10px; border-radius:6px;">
                <label style="font-size:0.75rem; font-weight:bold; display:block; margin-bottom:4px;">Lançar Fluxo de Saída:</label>
                <div style="display:flex; gap:4px;">
                    <input type="date" id="data-venda-${p.id}" value="${new Date().toISOString().split('T')[0]}" style="font-size:0.8rem; padding:4px;">
                    <button onclick="registrarVendaDireta(${p.id})" style="background:#10b981; color:white; border:none; padding:4px 8px; border-radius:4px; font-weight:bold; cursor:pointer;">💸 Vender 1</button>
                </div>
                <button onclick="deletarProdutoCatalogo(${p.id})" style="background:#ef4444; color:white; border:none; width:100%; margin-top:6px; padding:3px; border-radius:4px; font-size:0.75rem; cursor:pointer;">🗑️ Remover do Catálogo</button>
            </div>
        ` : '';

        grid.innerHTML += `
            <div class="card-produto-vitrine">
                <div class="badge-tag-cat">${p.categoria}</div>
                <div class="imagem-peça-placeholder">👜</div>
                <div class="detalhes-produto-vitrine">
                    <h3>${p.nome}</h3>
                    <p class="txt-cor">🎨 Cores: <strong>${p.cor}</strong></p>
                    <div class="status-estoque-box ${estoqueDisponivel === 0 ? 'esgotado' : ''}">
                        📊 Estoque: <strong>${estoqueDisponivel} un.</strong> disponível
                    </div>
                    <div class="preco-vitrine-tag">
                        R$ ${p.precoVenda.toFixed(2).replace('.', ',')}
                    </div>
                    ${botaodeCompraHTML}
                    ${painelGerenciamentoInterno}
                </div>
            </div>`;
    });
}

// Lançamento de saída direto da Vitrine logada
function registrarVendaDireta(produtoId) {
    const inputData = document.getElementById(`data-venda-${produtoId}`);
    const dataVenda = inputData ? inputData.value : new Date().toISOString().split('T')[0];

    const prod = db.produtos.find(p => p.id == produtoId);
    if (!prod) return;

    const totalVendidas = db.vendas.filter(v => v.produtoId == produtoId).reduce((sum, v) => sum + v.quantidade, 0);
    if (totalVendidas >= prod.qtdInicial) return alert('Estoque esgotado para esse lote de produtos!');

    db.vendas.push({
        id: Date.now(),
        produtoId: prod.id,
        nomeProduto: prod.nome,
        precoVenda: prod.precoVenda,
        quantidade: 1,
        data: dataVenda,
        mes: document.getElementById('filtro-mes-global').value
    });

    salvarESincronizarTudo();
}

function deletarProdutoCatalogo(id) {
    if(confirm('Remover este item e todo histórico de vendas dele da vitrine?')) {
        db.produtos = db.produtos.filter(p => p.id !== id);
        db.vendas = db.vendas.filter(v => v.produtoId !== id);
        salvarESincronizarTudo();
    }
}

// ==========================================
// 📋 AUDITORIA HISTÓRICA E RELATÓRIO CONSOLIDADO
// ==========================================
function atualizarHistoricoTabelaVendas() {
    const tbody = document.getElementById('tabela-historico-vendas');
    if (!tbody) return;

    const mesAtivo = document.getElementById('filtro-mes-global').value;
    const vendasM = db.vendas.filter(v => v.mes === mesAtivo);

    if (vendasM.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b; padding:12px;">Nenhuma movimentação realizada neste mês.</td></tr>`;
        return;
    }

    tbody.innerHTML = "";
    vendasM.forEach(v => {
        const partes = v.data.split("-");
        const dataFormatada = partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : v.data;

        tbody.innerHTML += `
            <tr>
                <td>${dataFormatada}</td>
                <td><strong>${v.nomeProduto}</strong></td>
                <td>${v.quantidade} un.</td>
                <td>R$ ${(v.precoVenda * v.quantidade).toFixed(2).replace('.', ',')}</td>
                <td>
                    <button onclick="removerFluxoVenda(${v.id})" style="background:none; border:none; cursor:pointer; color:#ef4444; font-weight:bold;">🗑️ Estornar</button>
                </td>
            </tr>`;
    });
}

function removerFluxoVenda(vendaId) {
    if (confirm("Estornar/Remover esta venda? O estoque será recalculado.")) {
        db.vendas = db.vendas.filter(v => v.id !== vendaId);
        salvarESincronizarTudo();
    }
}

function atualizarConsolidadoGeralCalculos() {
    const mesAtivo = document.getElementById('filtro-mes-global').value;
    
    // Visões Mensais baseadas no mês selecionado
    let custoInsumosMes = db.lotes.filter(l => l.mesCompra === mesAtivo).reduce((sum, l) => sum + l.valor, 0);
    let custoMoMes = db.equipe.filter(f => f.mes === mesAtivo).reduce((sum, f) => sum + f.pago, 0);
    let faturamentoRealMes = db.vendas.filter(v => v.mes === mesAtivo).reduce((sum, v) => sum + (v.precoVenda * v.quantidade), 0);
    let lucroLiquidoMes = faturamentoRealMes - (custoInsumosMes + custoMoMes);

    document.getElementById('total-faturamento-real').textContent = faturamentoRealMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('total-custo-insumos').textContent = custoInsumosMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('total-custo-mo-geral').textContent = custoMoMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    const labelLucro = document.getElementById('total-lucro-liquido-mes');
    labelLucro.textContent = lucroLiquidoMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    labelLucro.style.color = lucroLiquidoMes >= 0 ? '#10b981' : '#ef4444';

    // 📅 ACUMULADO ANUAL CONSOLIDADO (Sua solicitação para ver o ano inteiro de 2026!)
    let lucroAcumuladoAno2026 = 0;
    const todosOsMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    
    todosOsMeses.forEach(m => {
        let insumosM = db.lotes.filter(l => l.mesCompra === m).reduce((sum, l) => sum + l.valor, 0);
        let moM = db.equipe.filter(f => f.mes === m).reduce((sum, f) => sum + f.pago, 0);
        let fatM = db.vendas.filter(v => v.mes === m).reduce((sum, v) => sum + (v.precoVenda * v.quantidade), 0);
        lucroAcumuladoAno2026 += (fatM - (insumosM + moM));
    });

    document.getElementById('lucro-acumulado-ano').textContent = lucroAcumuladoAno2026.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function salvarESincronizarTudo() {
    localStorage.setItem('ateliePro_EstoqueAnual_v7_PRO', JSON.stringify(db));
    atualizarLotesTela();
    atualizarEquipeTela();
    renderizarVitrineLoja();
    atualizarHistoricoTabelaVendas();
    atualizarConsolidadoGeralCalculos();
}

// CARREGAMENTO INICIAL DE BANCO DE DADOS LOCAL STORAGE
document.addEventListener("DOMContentLoaded", () => {
    const dados = localStorage.getItem('ateliePro_EstoqueAnual_v7_PRO');
    if (dados) {
        db = JSON.parse(dados);
        if(!db.vendas) db.vendas = [];
        if(!db.produtos) db.produtos = [];
        if(!db.lotes) db.lotes = [];
        if(!db.equipe) db.equipe = [];
    }

    // Gerencia mudança de mês global
    const seletorMes = document.getElementById('filtro-mes-global');
    if (seletorMes) {
        seletorMes.addEventListener('change', () => {
            atualizarLotesTela();
            atualizarEquipeTela();
            renderizarVitrineLoja();
            atualizarHistoricoTabelaVendas();
            atualizarConsolidadoGeralCalculos();
        });
    }

    aplicarPermissoesAdmin();
    atualizarLotesTela();
    atualizarEquipeTela();
    renderizarVitrineLoja();
    atualizarHistoricoTabelaVendas();
    atualizarConsolidadoGeralCalculos();

    navegarPara('tela-vitrine');

    function alternarSubmenu(idSubmenu) {
    const submenu = document.getElementById(idSubmenu);
    if (submenu.style.display === 'none') {
        submenu.style.display = 'block';
    } else {
        submenu.style.display = 'none';
    }
}
});
