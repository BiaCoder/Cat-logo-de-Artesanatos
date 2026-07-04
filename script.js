let db = { lotes: [], equipe: [], produtos: [], vendas: [] };
let categoriaAtiva = 'Todos';

const seletorMesGlobal = document.getElementById('filtro-mes-global');
const selectLoteProd = document.getElementById('prod-lote-selecionado');
const selectFuncProd = document.getElementById('prod-func-selecionado');

// 📅 AJUSTE AUTOMÁTICO PARA O MÊS ATUAL DO SISTEMA
function definirMesAtualAutomatico() {
    const mesesAno = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const dataAtual = new Date();
    const nomeMesAtual = mesesAno[dataAtual.getMonth()];
    
    if (seletorMesGlobal && !seletorMesGlobal.value) {
        seletorMesGlobal.value = nomeMesAtual;
    }
}

// TROCA DE ABAS
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('ativa'));
        document.querySelectorAll('.conteudo-tab').forEach(t => t.classList.remove('ativa'));
        e.target.classList.add('ativa');
        document.getElementById(e.target.getAttribute('data-tab')).classList.add('ativa');
    });
});

if (seletorMesGlobal) {
    seletorMesGlobal.addEventListener('change', () => {
        atualizarLotesTela();
        atualizarEquipeTela();
        renderizarVitrine();
        atualizarHistoricoVendas();
        atualizarConsolidadoGeral();
    });
}

// ==========================================
// 📦 LOTES
// ==========================================
document.getElementById('btn-salvar-lote').addEventListener('click', () => {
    const idEdicao = document.getElementById('lote-id-edicao').value;
    const nome = document.getElementById('lote-nome').value.trim();
    const valor = parseFloat(document.getElementById('lote-valor').value) || 0;
    const perda = parseFloat(document.getElementById('lote-perda').value) || 0;
    const mes = seletorMesGlobal.value;

    if (!nome) return alert('Dê um nome ao lote!');

    if (idEdicao) {
        const lote = db.lotes.find(l => l.id == idEdicao);
        if (lote) { lote.nome = nome; lote.valor = valor; lote.perda = perda; }
        document.getElementById('lote-id-edicao').value = '';
        document.getElementById('btn-salvar-lote').textContent = 'Registrar Compra de Lote';
    } else {
        db.lotes.push({ id: Date.now(), nome, valor, perda, mes });
    }

    document.getElementById('lote-nome').value = '';
    salvarESincronizar();
});

function obterUsoLote(loteId) {
    return db.produtos
        .filter(p => p.loteId == loteId)
        .reduce((soma, p) => soma + ((p.porcentagemUso || 0) * (p.qtdInicial || 1)), 0);
}

function atualizarLotesTela() {
    const lista = document.getElementById('lista-lotes-cadastrados');
    if (!lista) return;
    lista.innerHTML = '';
    selectLoteProd.innerHTML = '<option value="">-- Selecione o Lote --</option>';

    const mesAtivo = seletorMesGlobal.value;
    db.lotes.filter(l => l.mes === mesAtivo).forEach(l => {
        const usoTotal = obterUsoLote(l.id);
        const saldoDisponivel = 100 - usoTotal;
        
        lista.innerHTML += `
            <li>
                <div class="registro-linha-superior"><span>${l.nome}</span> <strong>R$ ${l.valor.toFixed(2)}</strong></div>
                <div style="margin:4px 0;"><span class="badge-alerta">${saldoDisponivel}% restante</span></div>
                <div class="botoes-ajuste">
                    <button class="btn-ajustar" onclick="prepararEdicaoLote(${l.id})">✏️</button>
                    <button class="btn-ajustar" onclick="excluirLote(${l.id})">🗑️</button>
                </div>
            </li>`;
            
        selectLoteProd.innerHTML += `<option value="${l.id}">${l.nome}</option>`;
    });
}

function prepararEdicaoLote(id) {
    const lote = db.lotes.find(l => l.id == id);
    if (!lote) return;
    document.getElementById('lote-id-edicao').value = lote.id;
    document.getElementById('lote-nome').value = lote.nome;
    document.getElementById('lote-valor').value = lote.valor;
    document.getElementById('lote-perda').value = lote.perda;
    document.getElementById('btn-salvar-lote').textContent = 'Salvar Alterações';
}

function excluirLote(id) { if(confirm('Remover lote?')) { db.lotes = db.lotes.filter(l => l.id !== id); salvarESincronizar(); } }

// ==========================================
// 🧵 LINHA DE FRENTE (EQUIPE)
// ==========================================
document.getElementById('btn-salvar-func').addEventListener('click', () => {
    const idEdicao = document.getElementById('func-id-edicao').value;
    const nome = document.getElementById('func-nome').value.trim();
    const pecas = parseInt(document.getElementById('func-pecas').value) || 0;
    const precoPorPeca = parseFloat(document.getElementById('func-pago-por-peca').value) || 0;
    const mes = seletorMesGlobal.value;

    if (!nome) return alert('Insira o nome!');

    if (idEdicao) {
        const func = db.equipe.find(f => f.id == idEdicao);
        if (func) { func.nome = nome; func.pecas = pecas; func.pago = pecas * precoPorPeca; }
        document.getElementById('func-id-edicao').value = '';
    } else {
        db.equipe.push({ id: Date.now(), nome, pecas, pago: pecas * precoPorPeca, mes });
    }
    document.getElementById('func-nome').value = '';
    salvarESincronizar();
});

function atualizarEquipeTela() {
    selectFuncProd.innerHTML = '<option value="">-- Selecione o Produtor --</option>';
    const rankingLista = document.getElementById('lista-ranking-produtividade');
    if (!rankingLista) return;
    rankingLista.innerHTML = '';

    let totalMaoObra = 0;
    let totalPecas = 0;

    db.equipe.filter(f => f.mes === seletorMesGlobal.value).forEach(f => {
        totalMaoObra += f.pago;
        totalPecas += f.pecas;
        rankingLista.innerHTML += `<li>👤 ${f.nome} (${f.pecas} pçs) - R$ ${f.pago.toFixed(2)}</li>`;
        selectFuncProd.innerHTML += `<option value="${f.id}">${f.nome}</option>`;
    });

    document.getElementById('dash-total-pago').textContent = totalMaoObra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('dash-total-pecas').textContent = totalPecas;
}

// ==========================================
// 🛍️ PRODUTOS E GESTÃO DE VENDAS
// ==========================================
function calcularPrecoProduto() {
    const loteId = selectLoteProd.value;
    const funcId = selectFuncProd.value;
    const usoPorcentagem = parseFloat(document.getElementById('prod-lote-porcentagem').value) || 0;
    const margemEmpresa = parseFloat(document.getElementById('prod-lucro-empresa').value) || 0;

    let custoMaterial = 0;
    let custoMaoDeObra = 0;

    if (loteId) {
        const lote = db.lotes.find(l => l.id == loteId);
        if (lote) custoMaterial = (lote.valor * (usoPorcentagem / 100)) * (1 + (lote.perda / 100));
    }
    if (funcId) {
        const func = db.equipe.find(f => f.id == funcId);
        if (func) custoMaoDeObra = func.pago / func.pecas;
    }

    const precoSugerido = (custoMaterial + custoMaoDeObra) * (1 + (margemEmpresa / 100));

    document.getElementById('view-custo-mat').textContent = custoMaterial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('view-custo-mo').textContent = custoMaoDeObra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('view-preco-final').textContent = precoSugerido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return { custoMaterial, custoMaoDeObra, precoSugerido };
}

[selectLoteProd, selectFuncProd, document.getElementById('prod-lote-porcentagem'), document.getElementById('prod-lucro-empresa')].forEach(el => {
    if (el) {
        el.addEventListener('change', calcularPrecoProduto);
        el.addEventListener('input', calcularPrecoProduto);
    }
});

document.getElementById('btn-salvar-produto').addEventListener('click', () => {
    const nomeInput = document.getElementById('prod-nome');
    const nome = nomeInput.value.trim();
    const qtd = parseInt(document.getElementById('prod-qtd').value) || 1;
    const cor = document.getElementById('prod-cor').value.trim() || 'Única';
    const categoria = document.getElementById('prod-categoria').value;
    const linkLoja = document.getElementById('prod-loja').value.trim();
    const loteId = selectLoteProd.value;
    const usoPorcentagem = parseFloat(document.getElementById('prod-lote-porcentagem').value) || 0;

    if (!nome) return alert('Por favor, digite o Nome Comercial do Produto!');
    
    const calculos = calcularPrecoProduto();

    db.produtos.push({
        id: Date.now(),
        nome,
        qtdInicial: qtd,
        cor,
        categoria,
        linkLoja,
        loteId,
        porcentagemUso: usoPorcentagem,
        mes: seletorMesGlobal.value,
        custoMaterial: calculos.custoMaterial,
        custoMO: calculos.custoMaoDeObra,
        precoVenda: calculos.precoSugerido
    });

    nomeInput.value = '';
    document.getElementById('prod-cor').value = '';
    salvarESincronizar();
});

// FUNÇÃO PARA INSERIR OU ATUALIZAR FLUXO DE VENDA
function registrarVendaComData(produtoId) {
    const inputData = document.getElementById(`data-venda-${produtoId}`);
    const dataSelecionada = inputData ? inputData.value : '';

    if (!dataSelecionada) return alert('Por favor, selecione o dia da venda!');

    const prod = db.produtos.find(p => p.id == produtoId);
    if (!prod) return;

    // Calcular estoque atual baseado nas vendas ativas
    const totalVendidas = db.vendas.filter(v => v.produtoId == produtoId).reduce((sum, v) => sum + v.quantidade, 0);

    if (totalVendidas >= prod.qtdInicial) {
        return alert('Limite de estoque atingido para este lote de produtos!');
    }

    db.vendas.push({
        id: Date.now(),
        produtoId: prod.id,
        nomeProduto: prod.nome,
        precoVenda: prod.precoVenda,
        quantidade: 1, // Vende de 1 em 1 no clique rápido
        data: dataSelecionada,
        mes: seletorMesGlobal.value
    });

    salvarESincronizar();
}

// ✏️ EDITA UMA VENDA CADASTRADA ERRADA
function editarVenda(vendaId) {
    const venda = db.vendas.find(v => v.id == vendaId);
    if (!venda) return;

    const novaData = prompt("Altere a data da venda (AAAA-MM-DD):", venda.data);
    const novaQtd = parseInt(prompt("Altere a quantidade vendida:", venda.quantidade));

    if (novaData && !isNaN(novaQtd) && novaQtd >= 0) {
        venda.data = novaData;
        venda.quantidade = novaQtd;
        salvarESincronizar();
    }
}

// 🗑️ DELETA UMA VENDA
function deletarVenda(vendaId) {
    if (confirm("Deseja estornar/excluir este registro de venda?")) {
        db.vendas = db.vendas.filter(v => v.id !== vendaId);
        salvarESincronizar();
    }
}

function renderizarVitrine() {
    const grid = document.getElementById('produtos-exibicao');
    if (!grid) return;
    grid.innerHTML = '';

    const filtrados = db.produtos.filter(p => p.mes === seletorMesGlobal.value && (categoriaAtiva === 'Todos' || p.categoria === categoriaAtiva));

    if(filtrados.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b;">Nenhuma bolsa exibida para o mês de ${seletorMesGlobal.value}.</div>`;
        return;
    }

    const hoje = new Date().toISOString().split('T')[0];

    filtrados.forEach(p => {
        const qtdVendida = db.vendas.filter(v => v.produtoId == p.id).reduce((sum, v) => sum + v.quantidade, 0);
        const estoqueDisponivel = p.qtdInicial - qtdVendida;
        const disabled = estoqueDisponivel <= 0 ? 'disabled' : '';

        grid.innerHTML += `
            <div class="card-produto">
                <button class="btn-deletar-prod" onclick="deletarProduto(${p.id})">🗑️</button>
                <div class="img-container">👜</div>
                <div class="card-conteudo">
                    <span class="tag-categoria">${p.categoria}</span>
                    <h4>${p.nome}</h4>
                    <p style="font-size:0.85rem; color:#64748b; margin:4px 0;">🎨 Cores: <strong>${p.cor}</strong></p>
                    
                    <div class="estoque-info" style="background: #f8fafc; border: 1px solid #e2e8f0; margin-bottom: 12px;">
                        📊 Estoque Atual: <strong>${estoqueDisponivel < 0 ? 0 : estoqueDisponivel} / ${p.qtdInicial} disp.</strong>
                    </div>

                    <div style="margin-bottom: 10px; display: flex; flex-direction: column; gap: 4px;">
                        <label style="font-size: 0.75rem; color: #475569; font-weight: bold;">📅 Data do fluxo da venda:</label>
                        <input type="date" id="data-venda-${p.id}" value="${hoje}" style="padding: 5px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.85rem; width: 100%;">
                    </div>

                    <div class="preco-final-box" style="margin-top:4px;">
                        <span>Preço Unitário:</span>
                        <strong style="color: #0f172a;">R$ ${p.precoVenda.toFixed(2).replace('.', ',')}</strong>
                    </div>

                    <button class="btn-venda-acao" ${disabled} onclick="registrarVendaComData(${p.id})" style="background: #2563eb; color: white; border: none; padding: 8px; border-radius: 6px; width: 100%; cursor: pointer; margin-top: 8px; font-weight: bold;">
                        ${estoqueDisponivel <= 0 ? '❌ Esgotado' : '💰 Registrar Saída'}
                    </button>
                </div>
            </div>`;
    });
}

// 📋 ATUALIZA A TABELA DE HISTÓRICO DE VENDAS NA TELA
function atualizarHistoricoVendas() {
    const container = document.getElementById('tabela-historico-vendas');
    if (!container) return;

    const vendasMes = db.vendas.filter(v => v.mes === seletorMesGlobal.value);

    if (vendasMes.length === 0) {
        container.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b; padding:12px;">Nenhuma venda corrigida ou lançada neste mês.</td></tr>`;
        return;
    }

    container.innerHTML = "";
    vendasMes.forEach(v => {
        // Formata data padrão AAAA-MM-DD para DD/MM/AAAA
        const partesData = v.data.split("-");
        const dataFormatada = partesData.length === 3 ? `${partesData[2]}/${partesData[1]}/${partesData[0]}` : v.data;

        container.innerHTML += `
            <tr>
                <td>${dataFormatada}</td>
                <td><strong>${v.nomeProduto || 'Produto'}</strong></td>
                <td>${v.quantidade} un.</td>
                <td>R$ ${(v.precoVenda * v.quantidade).toFixed(2).replace('.', ',')}</td>
                <td>
                    <button onclick="editarVenda(${v.id})" style="background:none; border:none; cursor:pointer;">✏️</button>
                    <button onclick="deletarVenda(${v.id})" style="background:none; border:none; cursor:pointer; margin-left:8px;">🗑️</button>
                </td>
            </tr>`;
    });
}

function deletarProduto(id) { 
    if(confirm('Remover produto do catálogo?')) { 
        db.produtos = db.produtos.filter(p => p.id !== id); 
        db.vendas = db.vendas.filter(v => v.produtoId !== id);
        salvarESincronizar(); 
    } 
}

// ==========================================
// 📊 BALANÇO FINANCEIRO CONSOLIDADO
// ==========================================
function atualizarConsolidadoGeral() {
    const mesAtivo = seletorMesGlobal.value;
    
    let custoInsumosMes = db.lotes.filter(l => l.mes === mesAtivo).reduce((sum, l) => sum + l.valor, 0);
    let custoMoMes = db.equipe.filter(f => f.mes === mesAtivo).reduce((sum, f) => sum + f.pago, 0);
    
    let faturamentoRealMes = db.vendas.filter(v => v.mes === mesAtivo).reduce((sum, v) => sum + (v.precoVenda * v.quantidade), 0);
    let lucroLiquidoMes = faturamentoRealMes - (custoInsumosMes + custoMoMes);

    document.getElementById('total-faturamento-real').textContent = faturamentoRealMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('total-custo-insumos').textContent = custoInsumosMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('total-custo-mo-geral').textContent = custoMoMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('total-lucro-liquido-mes').textContent = lucroLiquidoMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    let lucroAcumuladoAno = 0;
    const todosOsMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    
    todosOsMeses.forEach(m => {
        let insumosM = db.lotes.filter(l => l.mes === m).reduce((sum, l) => sum + l.valor, 0);
        let moM = db.equipe.filter(f => f.mes === m).reduce((sum, f) => sum + f.pago, 0);
        let fatM = db.vendas.filter(v => v.mes === m).reduce((sum, v) => sum + (v.precoVenda * v.quantidade), 0);
        lucroAcumuladoAno += (fatM - (insumosM + moM));
    });

    document.getElementById('lucro-acumulado-ano').textContent = lucroAcumuladoAno.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function salvarESincronizar() {
    localStorage.setItem('ateliePro_EstoqueAnual_v6', JSON.stringify(db));
    atualizarLotesTela();
    atualizarEquipeTela();
    renderizarVitrine();
    atualizarHistoricoVendas();
    atualizarConsolidadoGeral();
}

// CARREGAMENTO INICIAL
const dados = localStorage.getItem('ateliePro_EstoqueAnual_v6');
if (dados) {
    db = JSON.parse(dados);
    if (!db.vendas) db.vendas = [];
}

if (!seletorMesGlobal.value) {
    definirMesAtualAutomatico(); 
}

atualizarLotesTela();
atualizarEquipeTela();
renderizarVitrine();
atualizarHistoricoVendas();
atualizarConsolidadoGeral();