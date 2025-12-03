// =====================================================
// PROPOSTA DE MÍDIA - JavaScript (MÚLTIPLAS EMISSORAS)
// =====================================================

let proposalData = {
    tableId: null,
    emissoras: [],  // Array de emissoras
    changes: {},
    parentPageId: null,
    proposalName: null
};

// Definição de todos os produtos disponíveis
const PRODUTOS = [
    { key: 'spots30', label: 'Spots 30"', tabelaKey: 'valorTabela30', negKey: 'valorNegociado30' },
    { key: 'spots60', label: 'Spots 60"', tabelaKey: 'valorTabela60', negKey: 'valorNegociado60' },
    { key: 'spotsBlitz', label: 'Blitz', tabelaKey: 'valorTabelaBlitz', negKey: 'valorNegociadoBlitz' },
    { key: 'spots15', label: 'Spots 15"', tabelaKey: 'valorTabela15', negKey: 'valorNegociado15' },
    { key: 'spots5', label: 'Spots 5"', tabelaKey: 'valorTabela5', negKey: 'valorNegociado5' },
    { key: 'spotsTest60', label: 'Test 60"', tabelaKey: 'valorTabelaTest60', negKey: 'valorNegociadoTest60' },
    { key: 'spotsFlash30', label: 'Flash 30"', tabelaKey: 'valorTabelaFlash30', negKey: 'valorNegociadoFlash30' },
    { key: 'spotsFlash60', label: 'Flash 60"', tabelaKey: 'valorTabelaFlash60', negKey: 'valorNegociadoFlash60' },
    { key: 'spotsMensham30', label: 'Mensham 30"', tabelaKey: 'valorTabelaMensham30', negKey: 'valorNegociadoMensham30' },
    { key: 'spotsMensham60', label: 'Mensham 60"', tabelaKey: 'valorTabelaMensham60', negKey: 'valorNegociadoMensham60' }
];

let charts = {
    investment: null,
    impacts: null
};

// =====================================================
// INICIALIZAÇÃO
// =====================================================

// Script carregado

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const params = new URLSearchParams(window.location.search);
        proposalData.tableId = params.get('id');

        if (!proposalData.tableId) {
            showWelcomeMessage();
            throw new Error('Nenhuma tabela selecionada. Aguardando ID da tabela na URL.');
        }

        await loadProposalFromDB(proposalData.tableId);
        renderInterface();
    } catch (error) {
        console.error('❌ Erro ao carregar:', error);
        showError(error.message);
    }
});

function showWelcomeMessage() {
    // Redirecionamento automático para a página principal
    window.location.href = 'https://emidiastec.com.br';
}

function loadFromWelcome() {
    const tableId = document.getElementById('tableIdInput')?.value?.trim();
    if (!tableId) {
        alert('⚠️ Por favor, insira o ID da tabela');
        return;
    }
    window.location.href = `?id=${encodeURIComponent(tableId)}`;
}

// =====================================================
// CARREGAMENTO DE DADOS
// =====================================================

async function loadProposalFromDB(tableId) {
    const apiUrl = getApiUrl();
    const baseUrl = apiUrl.endsWith('/') ? apiUrl : apiUrl + '/';
    const finalUrl = `${baseUrl}?id=${tableId}`;
    
    try {
        const response = await fetch(finalUrl);

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(`Erro ao carregar dados: ${response.status}`);
        }

        const data = await response.json();

        // Se recebeu erro, mostrar
        if (data.error) {
          throw new Error(`Erro da API: ${data.error}`);
        }

        // Armazenar dados da proposta
        if (data.emissoras && Array.isArray(data.emissoras)) {
            // Usar os dados diretamente da base de dados, sem transformação
            proposalData.emissoras = data.emissoras;
            proposalData.parentPageId = data.parentPageId || null;
            proposalData.proposalName = data.proposalName || null;
        } else if (Array.isArray(data) && data.length > 0) {
            // Fallback para formato antigo
            proposalData.emissoras = data;
        } else {
            throw new Error('Nenhuma emissora encontrada');
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
}

function getApiUrl() {
    const hostname = window.location.hostname;
    
    // Cloudflare Pages
    if (hostname.includes('pages.dev')) {
        return '/notion';
    }
    
    // Netlify
    if (hostname.includes('netlify.app')) {
        return '/.netlify/functions/notion';
    }
    
    // Local
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:8787/notion';
    }
    
    // Default
    return '/notion';
}

// =====================================================
// RENDERIZAÇÃO
// =====================================================

function renderInterface() {
    
    // Atualizar título com a primeira emissora como referência
    const firstEmissora = proposalData.emissoras[0];
    document.getElementById('proposalTitle').textContent = firstEmissora ? firstEmissora.emissora : 'Proposta de Mídia';
    document.getElementById('locationInfo').textContent = firstEmissora ? `${firstEmissora.uf}` : '';

    renderSpotsTable();
    updateStats();
    renderCharts();
}

function renderSpotsTable() {
    const tbody = document.getElementById('spotsTableBody');

    if (!tbody) {
        console.error('Elemento spotsTableBody não encontrado!');
        return;
    }

    if (!proposalData.emissoras || proposalData.emissoras.length === 0) {
        console.error('Dados de emissoras não disponíveis!');
        return;
    }

    tbody.innerHTML = '';
    
    let totalLinhasAdicionadas = 0;

    // Renderizar cada emissora + cada produto como uma linha
    proposalData.emissoras.forEach((emissora, emissoraIndex) => {
        // Renderizar cada produto para essa emissora
        PRODUTOS.forEach((produto, produtoIndex) => {
            // Puxar valores diretos do objeto emissora (vindo da base de dados)
            const spots = emissora[produto.key] || 0;
            const valorTabela = emissora[produto.tabelaKey] || 0;
            const valorNegociado = emissora[produto.negKey] || 0;

            const invTabela = spots * valorTabela;
            const invNegociado = spots * valorNegociado;
            
            const rowId = `row-${emissoraIndex}-${produtoIndex}`;
            const checkboxId = `check-${emissoraIndex}-${produtoIndex}`;
            
            const row = document.createElement('tr');
            row.id = rowId;
            row.className = 'spots-data-row';
            row.innerHTML = `
                <td>
                    <input 
                        type="checkbox" 
                        id="${checkboxId}"
                        checked
                        onchange="updateRowSelection()"
                        style="cursor: pointer;"
                    >
                </td>
                <td>${emissora.uf || '-'}</td>
                <td>${emissora.praca || '-'}</td>
                <td><strong>${emissora.emissora || '-'}</strong></td>
                <td><strong>${produto.label}</strong></td>
                <td>
                    <input 
                        type="number" 
                        value="${spots}" 
                        onchange="updateEmissora(${emissoraIndex}, '${produto.key}', this.value)"
                        class="input-spots"
                        min="0"
                        step="1"
                        style="width: 70px; padding: 4px; text-align: center;"
                    >
                </td>
                <td class="value-cell">R$ ${valorTabela.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td class="value-cell">R$ ${valorNegociado.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td class="value-cell investment-tabela">R$ ${invTabela.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td class="value-cell investment-negociado">R$ ${invNegociado.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            `;
            tbody.appendChild(row);
            totalLinhasAdicionadas++;
        });
    });

    updateStats();
}

function updateStats() {
    const totalInvTabela = calculateTotalInvestimentoTabela();
    const totalInvNegociado = calculateTotalInvestimentoNegociado();
    const totalSpots = calculateTotalSpots();
    const cpm = calculateCPM();
    const economia = totalInvTabela - totalInvNegociado;

    const statTotalSpots = document.getElementById('statTotalSpots');
    const statTabelaValue = document.getElementById('statTabelaValue');
    const statNegociadoValue = document.getElementById('statNegociadoValue');
    const statCPM = document.getElementById('statCPM');
    const statEconomia = document.getElementById('statEconomia');

    if (statTotalSpots) statTotalSpots.textContent = totalSpots;
    if (statTabelaValue) statTabelaValue.textContent = formatCurrency(totalInvTabela);
    if (statNegociadoValue) statNegociadoValue.textContent = formatCurrency(totalInvNegociado);
    if (statCPM) statCPM.textContent = `R$ ${cpm.toFixed(2)}`;
    if (statEconomia) statEconomia.textContent = formatCurrency(economia);
}

function renderCharts() {
    try {
        Object.values(charts).forEach(chart => {
            if (chart) chart.destroy();
        });

        renderInvestmentChart();
        renderSpotTypesChart();
    } catch (error) {
        console.error('Erro ao renderizar gráficos:', error);
    }
}

function renderInvestmentChart() {
    const ctx = document.getElementById('investmentChart');
    if (!ctx) return;
    
    const canvasCtx = ctx.getContext('2d');
    
    const labels = ['Tabela', 'Negociado'];
    const data = [
        calculateTotalInvestimentoTabela(),
        calculateTotalInvestimentoNegociado()
    ];
    
    charts.investment = new Chart(canvasCtx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#ef4444', '#10b981'],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatCurrency(context.parsed);
                        }
                    }
                }
            }
        }
    });
}

function renderSpotTypesChart() {
    const ctx = document.getElementById('spotsChart');
    if (!ctx) return;
    
    const canvasCtx = ctx.getContext('2d');
    
    const labels = [];
    const data = [];
    
    proposalData.emissoras.forEach(emissora => {
        PRODUTOS.forEach(produto => {
            const spots = emissora[produto.key] || 0;
            if (spots > 0) {
                labels.push(`${emissora.emissora} - ${produto.label}`);
                data.push(spots);
            }
        });
    });
    
    if (charts.impacts) {
        charts.impacts.destroy();
    }
    
    charts.impacts = new Chart(canvasCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Quantidade de Spots',
                data: data,
                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                borderColor: '#6366f1',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}

// =====================================================
// CÁLCULOS
// =====================================================

function getSelectedRows() {
    // Retorna array de checkboxes selecionados
    const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]:checked');
    return checkboxes;
}

function calculateTotalSpots() {
    let total = 0;
    getSelectedRows().forEach(checkbox => {
        const row = checkbox.closest('tr');
        const input = row.querySelector('input[type="number"]');
        if (input) {
            total += parseFloat(input.value) || 0;
        }
    });
    return total;
}

function calculateTotalInvestimentoTabela() {
    let total = 0;
    getSelectedRows().forEach(checkbox => {
        const row = checkbox.closest('tr');
        const investCell = row.querySelector('.investment-tabela');
        if (investCell) {
            const value = investCell.textContent.replace('R$ ', '').replace(',', '.');
            total += parseFloat(value) || 0;
        }
    });
    return total;
}

function calculateTotalInvestimentoNegociado() {
    let total = 0;
    getSelectedRows().forEach(checkbox => {
        const row = checkbox.closest('tr');
        const investCell = row.querySelector('.investment-negociado');
        if (investCell) {
            const value = investCell.textContent.replace('R$ ', '').replace(',', '.');
            total += parseFloat(value) || 0;
        }
    });
    return total;
}

function calculateCPM() {
    const totalSpots = calculateTotalSpots();
    const totalInvestimento = calculateTotalInvestimentoNegociado();

    if (totalSpots === 0 || totalInvestimento === 0) return 0;
    return (totalInvestimento / totalSpots) * 1000;
}

// =====================================================
// EDIÇÃO E ATUALIZAÇÃO
// =====================================================

function updateEmissora(index, field, value) {
    const emissora = proposalData.emissoras[index];
    if (!emissora) return;
    
    const oldValue = emissora[field];
    const newValue = parseFloat(value) || 0;
    
    emissora[field] = newValue;

    const changeKey = `${index}-${field}`;
    if (!proposalData.changes[changeKey]) {
        proposalData.changes[changeKey] = {
            emissoraIndex: index,
            field: field,
            old: oldValue,
            new: newValue
        };
    } else {
        proposalData.changes[changeKey].new = newValue;
    }

    renderSpotsTable();
    updateStats();
}

function updateRowSelection() {
    // Função chamada quando um checkbox é marcado/desmarcado
    // Recalcula os totais baseado nas linhas selecionadas
    updateStats();
    renderCharts();
    showUnsavedChanges();
}

function showUnsavedChanges() {
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.style.display = Object.keys(proposalData.changes).length > 0 ? 'block' : 'none';
    }
}

// =====================================================
// SALVAR ALTERAÇÕES
// =====================================================

async function saveChanges() {
    if (Object.keys(proposalData.changes).length === 0) {
        alert('Nenhuma alteração para salvar!');
        return;
    }
    
    const changeCount = Object.keys(proposalData.changes).length;
    const confirmSave = confirm(`Deseja salvar ${changeCount} alteração(ões)?`);
    
    if (!confirmSave) return;
    
    try {
        const apiUrl = getApiUrl();
        const dataToSave = {
            tableId: proposalData.tableId,
            emissoras: proposalData.emissoras,
            changes: proposalData.changes
        };
        
        const response = await fetch(`${apiUrl}?id=${proposalData.tableId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSave)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao salvar');
        }

        const result = await response.json();

        proposalData.changes = {};
        showUnsavedChanges();

        alert('✅ Proposta atualizada com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert(`Erro ao salvar: ${error.message}`);
    }
}

// =====================================================
// UTILITÁRIOS
// =====================================================

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function showError(message) {
    console.error('❌', message);
    alert(`Erro: ${message}`);
}

function goBack() {
    // Verifica se temos dados da proposta para construir a URL
    if (proposalData.parentPageId && proposalData.proposalName) {
        try {
            // Limpar nome da proposta
            let cleanName = proposalData.proposalName
                .replace(/\([^)]*\)/g, '')  // Remove tudo entre parênteses
                .replace(/[/:]/g, '-')       // Substitui / e : por -
                .trim();                     // Remove espaços nas pontas

            // Remove --- duplicados (substituir múltiplos - por um único)
            cleanName = cleanName.replace(/-+/g, '-');

            // Remove - do início e fim
            cleanName = cleanName.replace(/^-+|-+$/g, '');

            // Limpar parent page ID (remover todos os traços)
            const cleanId = proposalData.parentPageId.replace(/-/g, '');

            // Construir URL
            const url = `https://hub.emidiastec.com.br/${cleanName}-${cleanId}`;
            window.location.href = url;
        } catch (error) {
            // Fallback em caso de erro
            window.location.href = 'https://emidiastec.com.br';
        }
    } else {
        // Fallback se não houver dados completos
        window.location.href = 'https://emidiastec.com.br';
    }
}

window.addEventListener('resize', () => {
    Object.values(charts).forEach(chart => {
        if (chart) chart.resize();
    });
});
