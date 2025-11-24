// =====================================================
// PROPOSTA DE MÃDIA - JavaScript (MÃšLTIPLAS EMISSORAS)
// Build: 2025-11-19
// =====================================================

let proposalData = {
    tableId: null,
    emissoras: [],  // Array de emissoras
    changes: {},
    ocultasEmissoras: new Set(),  // Rastreia emissoras ocultas (por ID)
    initialOcultasEmissoras: new Set(),  // Estado inicial para detectar mudanÃ§as
    changedEmissoras: new Set(),  // Rastreia quais emissoras tiveram mudanÃ§as no status "Excluir"
    // Backup do Ãºltimo estado salvo com sucesso (para rollback em caso de erro)
    lastSuccessfulState: {
        ocultasEmissoras: new Set(),
        changes: {},
        emissoras: []
    }
};

// Flag para ignorar o prÃ³ximo evento de checkbox (evita double trigger)
let ignoreNextCheckboxChange = false;


// DefiniÃ§Ã£o de todos os produtos disponÃ­veis
const PRODUTOS = [
    { key: 'spots30', label: 'Spots 30"', tabelaKey: 'valorTabela30', negKey: 'valorNegociado30' },
    { key: 'spots60', label: 'Spots 60"', tabelaKey: 'valorTabela60', negKey: 'valorNegociado60' },
    { key: 'spotsBlitz', label: 'Blitz', tabelaKey: 'valorTabelaBlitz', negKey: 'valorNegociadoBlitz' },
    { key: 'spots15', label: 'Spots 15"', tabelaKey: 'valorTabela15', negKey: 'valorNegociado15' },
    { key: 'spots5', label: 'Spots 5"', tabelaKey: 'valorTabela5', negKey: 'valorNegociado5' },
    { key: 'spotsTest30', label: 'Test 30"', tabelaKey: 'valorTabelaTest30', negKey: 'valorNegociadoTest30' },
    { key: 'spotsTest60', label: 'Test 60"', tabelaKey: 'valorTabelaTest60', negKey: 'valorNegociadoTest60' },
    { key: 'spotsFlash30', label: 'Flash 30"', tabelaKey: 'valorTabelaFlash30', negKey: 'valorNegociadoFlash30' },
    { key: 'spotsFlash60', label: 'Flash 60"', tabelaKey: 'valorTabelaFlash60', negKey: 'valorNegociadoFlash60' },
    { key: 'spotsMensham30', label: 'Mensham 30"', tabelaKey: 'valorTabelaMensham30', negKey: 'valorNegociadoMensham30' },
    { key: 'spotsMensham60', label: 'Mensham 60"', tabelaKey: 'valorTabelaMensham60', negKey: 'valorNegociadoMensham60' }
];

let charts = {
    investment: null
};

// FunÃ§Ã£o para extrair o link da logo (pode vir como string, array ou objeto)
function getLogoUrl(linkLogoField) {
    if (!linkLogoField) return null;
    
    // Se for string, retorna direto
    if (typeof linkLogoField === 'string' && linkLogoField.trim()) {
        return linkLogoField.trim();
    }
    
    // Se for array, pega o primeiro elemento
    if (Array.isArray(linkLogoField) && linkLogoField.length > 0) {
        const firstItem = linkLogoField[0];
        if (typeof firstItem === 'string') {
            return firstItem.trim();
        } else if (typeof firstItem === 'object' && firstItem.url) {
            return firstItem.url.trim();
        }
    }
    
    // Se for objeto com propriedade url
    if (typeof linkLogoField === 'object' && linkLogoField.url) {
        return linkLogoField.url.trim();
    }
    
    return null;
}

// =====================================================
// GERENCIAMENTO DE SALDO ANTERIOR (ÃšLTIMA PROPOSTA SALVA)
// =====================================================

function getSaldoAnterior() {
    const saldoAnteriorStr = localStorage.getItem('saldoAnterior');
    if (saldoAnteriorStr) {
        try {
            return JSON.parse(saldoAnteriorStr);
        } catch (e) {
            console.error('Erro ao parsear saldoAnterior do localStorage:', e);
            return { negociado: 0, tabela: 0 };
        }
    }
    return { negociado: 0, tabela: 0 };
}

function setSaldoAnterior(negociado, tabela) {
    const saldoAnterior = {
        negociado: negociado,
        tabela: tabela,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('saldoAnterior', JSON.stringify(saldoAnterior));
    console.log('âœ… Saldo anterior salvo:', saldoAnterior);
}

// =====================================================
// INICIALIZAÃ‡ÃƒO
// =====================================================

console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
console.log('ðŸ”¥ script.js CARREGADO!');
console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');

document.addEventListener('DOMContentLoaded', async () => {
    console.log('\nðŸŽ¯ DOMContentLoaded DISPARADO!');
    console.log('ðŸš€ Inicializando pÃ¡gina de proposta...');
    
    try {
        const params = new URLSearchParams(window.location.search);
        proposalData.tableId = params.get('id');

        if (!proposalData.tableId) {
            showWelcomeMessage();
            throw new Error('Nenhuma tabela selecionada. Aguardando ID da tabela na URL.');
        }

        await loadProposalFromNotion(proposalData.tableId);
        renderInterface();
        console.log('âœ… PÃ¡gina carregada com sucesso!');
    } catch (error) {
        console.error('âŒ Erro ao carregar:', error);
        showError(error.message);
    }
});

function showWelcomeMessage() {
    const container = document.querySelector('.container');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <h1 style="font-size: 2.5rem; color: #6366f1; margin-bottom: 20px;">
                    ðŸ“‹ E-MÃDIAS
                </h1>
                <p style="font-size: 1.1rem; color: #6b7280; margin-bottom: 30px;">
                    Plataforma de GestÃ£o de Propostas RadiofÃ´nicas
                </p>
                <div style="background: #f3f4f6; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto;">
                    <p style="color: #374151; font-size: 1rem; line-height: 1.6; margin-bottom: 25px;">
                        â„¹ï¸ Nenhuma proposta foi carregada.
                    </p>
                    <div style="background: white; padding: 20px; border-radius: 8px;">
                        <label style="display: block; color: #374151; font-weight: 500; margin-bottom: 10px;">
                            ID da Tabela no Notion:
                        </label>
                        <input 
                            id="tableIdInput" 
                            type="text" 
                            placeholder="Cole o ID da tabela aqui..." 
                            style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-family: monospace; margin-bottom: 15px;"
                        />
                        <button 
                            onclick="loadFromWelcome()" 
                            style="width: 100%; padding: 12px; background: #6366f1; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 1rem;"
                        >
                            âœ… Carregar Proposta
                        </button>
                    </div>
                    <p style="color: #6b7280; font-size: 0.9rem; margin-top: 15px;">
                        ðŸ’¡ Ou acesse a URL com o ID: <code style="background: white; padding: 5px 8px; border-radius: 4px;">?id=SEU_ID_AQUI</code>
                    </p>
                </div>
            </div>
        `;
    }
}

function loadFromWelcome() {
    const tableId = document.getElementById('tableIdInput')?.value?.trim();
    if (!tableId) {
        alert('âš ï¸ Por favor, insira o ID da tabela');
        return;
    }
    window.location.href = `?id=${encodeURIComponent(tableId)}`;
}

// =====================================================
// CARREGAMENTO DE DADOS
// =====================================================

async function loadProposalFromNotion(tableId) {
    console.log('\nâ•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—');
    console.log('â•‘ ðŸ“ INICIANDO: loadProposalFromNotion()');
    console.log('â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
    console.log('ParÃ¢metro tableId:', tableId);
    
    const apiUrl = getApiUrl();
    const baseUrl = apiUrl.endsWith('/') ? apiUrl : apiUrl + '/';
    const finalUrl = `${baseUrl}?id=${tableId}`;
    
    console.log(`ðŸ“¡ URL final: ${finalUrl}`);
    
    try {
        const response = await fetch(finalUrl);
        
        console.log(`ðŸ“Š Status HTTP: ${response.status}`);
        console.log(`âœ… OK: ${response.ok}`);
        
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            console.log(`âŒ Erro: ${JSON.stringify(errorBody)}`);
            throw new Error(`Erro ao carregar dados: ${response.status}`);
        }

        const data = await response.json();
        
        // Log detalhado no console para diagnÃ³stico
        console.log('');
        console.log('â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—');
        console.log('â•‘  RESPOSTA BRUTA DA API - PRIMEIRO REGISTRO COMPLETO   â•‘');
        console.log('â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
        if (Array.isArray(data) && data.length > 0) {
            console.log(data[0]);
        } else {
            console.log(data);
        }
        console.log('');
        
        console.log(`ðŸ“¦ Dados tipo: ${typeof data}`);
        console.log(`ðŸ“¦ Dados Ã© array? ${Array.isArray(data)}`);
        console.log(`ðŸ“¦ Dados tem .error? ${'error' in data}`);
        
        // Se recebeu erro, mostrar
        if (data.error) {
          console.log(`âŒ API retornou erro: ${data.error}`);
          console.log(`ðŸ“‹ Debug info: ${JSON.stringify(data.debug || {})}`);
          throw new Error(`Erro da API: ${data.error}`);
        }
        
        // Se tem estrutura com debug, extrair emissoras
        let emissoras = Array.isArray(data) ? data : (data.emissoras || []);
        let ocultasEmissoras = data.ocultasEmissoras || [];
        
        // Log de debug das logos
        if (data.debug) {
          console.log(`ðŸ“Š Debug info:`, data.debug);
          console.log(`âœ… Logos encontradas: ${data.debug.logosFounded}`);
          console.log(`âŒ Logos NÃƒO encontradas: ${data.debug.logosNotFound}`);
          if (data.debug.sampleWithLogo) {
            console.log(`ðŸ“Œ Exemplo com logo:`, data.debug.sampleWithLogo.emissora, 'â†’', data.debug.sampleWithLogo.logo?.substring(0, 50));
          }
          if (data.debug.sampleWithoutLogo) {
            console.log(`âš ï¸ Exemplo sem logo:`, data.debug.sampleWithoutLogo.emissora);
          }
        }
        
        console.log(`ðŸ“Š Ã‰ array? ${Array.isArray(emissoras)}`);
        console.log(`ðŸ“Š Tamanho: ${Array.isArray(emissoras) ? emissoras.length : 'N/A'}`);
        console.log(`ðŸ‘¤ Emissoras ocultas: ${ocultasEmissoras.length}`);
        
        if (Array.isArray(emissoras) && emissoras.length > 0) {
            console.log(`âœ… Processando ${emissoras.length} emissoras`);
            console.log(`ðŸ“‹ Primeiro emissora: ${emissoras[0].emissora || 'SEM NOME'}`);
            
            // Usar os dados diretamente do Notion, sem transformaÃ§Ã£o
            proposalData.emissoras = emissoras;
            
            // Carregar emissoras ocultas no Set
            proposalData.ocultasEmissoras = new Set(ocultasEmissoras);
            proposalData.initialOcultasEmissoras = new Set(ocultasEmissoras);  // Guardar estado inicial
            console.log(`ðŸ‘¤ ${proposalData.ocultasEmissoras.size} emissoras marcadas como ocultas`);
            
            console.log(`âœ… ${proposalData.emissoras.length} emissoras carregadas com sucesso!`);
        } else {
            console.log('âš ï¸ Array vazio ou invÃ¡lido');
            throw new Error('Nenhuma emissora encontrada');
        }
    } catch (error) {
        console.log(`âŒ Erro na funÃ§Ã£o: ${error.message}`);
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
// RENDERIZAÃ‡ÃƒO
// =====================================================

function renderInterface() {
    console.log('\nâ•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—');
    console.log('â•‘ ðŸ“ INICIANDO: renderInterface()');
    console.log('â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
    console.log('proposalData.emissoras.length:', proposalData.emissoras.length);
    
    console.log('ðŸŽ¨ Renderizando interface...');
    console.log('ðŸ“Š Emissoras disponÃ­veis:', proposalData.emissoras.length);
    
    // Buscar o nome da proposta
    let proposalName = 'Proposta de MÃ­dia';
    
    if (proposalData.emissoras && proposalData.emissoras.length > 0) {
        const firstEmissora = proposalData.emissoras[0];
        
        // Tenta encontrar o nome da proposta nos campos
        if (firstEmissora.proposta && firstEmissora.proposta.trim()) {
            proposalName = firstEmissora.proposta;
            console.log('âœ… Nome da proposta encontrado:', proposalName);
        } else if (firstEmissora.empresa && firstEmissora.empresa.trim()) {
            proposalName = firstEmissora.empresa;
            console.log('âœ… Nome da empresa encontrado:', proposalName);
        } else {
            // Fallback: usa a primeira emissora
            proposalName = firstEmissora.emissora || 'Proposta de MÃ­dia';
            console.log('âš ï¸ Usando emissora como nome:', proposalName);
        }
    }
    
    console.log('ðŸ¢ Nome da proposta:', proposalName);
    // TÃ­tulo nÃ£o Ã© mais atualizado dinamicamente
    
    // Remover a seÃ§Ã£o de localizaÃ§Ã£o (jÃ¡ nÃ£o serÃ¡ exibida)
    const locationInfo = document.getElementById('locationInfo');
    if (locationInfo && locationInfo.parentElement) {
        locationInfo.parentElement.style.display = 'none';
    }
    
    console.log('ðŸŽ¯ Chamando renderSpotsTable...');
    renderSpotsTable();
    console.log('ðŸŽ¯ Chamando updateStats...');
    updateStats();
    console.log('ðŸŽ¯ Chamando renderCharts...');
    renderCharts();
    
    // ðŸ’¾ Criar backup do estado inicial (para rollback em caso de erro)
    proposalData.lastSuccessfulState = {
        ocultasEmissoras: new Set(proposalData.ocultasEmissoras),
        changes: JSON.parse(JSON.stringify(proposalData.changes)),
        emissoras: proposalData.emissoras.map(e => ({...e}))
    };
    console.log('ðŸ’¾ Estado inicial salvo para rollback:', {
        ocultasEmissoras: Array.from(proposalData.lastSuccessfulState.ocultasEmissoras),
        changesCount: Object.keys(proposalData.lastSuccessfulState.changes).length
    });
    
    console.log('ðŸŽ¯ Garantindo que botÃ£o de salvar estÃ¡ oculto (sem alteraÃ§Ãµes)...');
    showUnsavedChanges();
    console.log('âœ… renderInterface() finalizado!');
}

function renderSpotsTable() {
    console.log('\nðŸŽ¯ðŸŽ¯ðŸŽ¯ renderSpotsTable() INICIADA ðŸŽ¯ðŸŽ¯ðŸŽ¯');
    
    const tbody = document.getElementById('spotsTableBody');
    const table = document.getElementById('spotsTable');
    
    console.log('âœ… Procurando tbody #spotsTableBody...');
    console.log('âœ… tbody encontrado?', !!tbody);
    console.log('âœ… proposalData.emissoras.length:', proposalData.emissoras.length);
    
    if (!tbody || !table) {
        console.error('âŒ CRÃTICO: Elementos da tabela nÃ£o encontrados no DOM!');
        return;
    }
    
    if (!proposalData.emissoras || proposalData.emissoras.length === 0) {
        console.error('âŒ CRÃTICO: proposalData.emissoras vazio ou indefinido!');
        return;
    }
    
    // LOG: Verificar se campo 'impactos' existe nos dados
    console.log('\nâ•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—');
    console.log('â•‘ ðŸ” VERIFICANDO CAMPOS NOS DADOS');
    console.log('â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
    proposalData.emissoras.forEach((emissora, idx) => {
        const logoUrl = getLogoUrl(emissora.linkLogo);
        console.log(`  [${idx}] ${emissora.emissora}:`);
        console.log(`       - impactos: "${emissora.impactos}"`);
        console.log(`       - linkLogo (raw): ${JSON.stringify(emissora.linkLogo)}`);
        console.log(`       - linkLogo (tipo): ${typeof emissora.linkLogo}`);
        console.log(`       - linkLogo (extraÃ­do): "${logoUrl}"`);
        console.log(`       - logo: "${emissora.logo}"`);
        console.log(`       - Todas as chaves:`, Object.keys(emissora));
    });
    
    // Encontra quais produtos tÃªm dados (spots > 0) em qualquer emissora
    const produtosAtivos = new Set();
    proposalData.emissoras.forEach(emissora => {
        PRODUTOS.forEach(produto => {
            const spots = emissora[produto.key] || 0;
            if (spots > 0) {
                produtosAtivos.add(produto.key);
            }
        });
    });
    
    console.log('ðŸ” Produtos com dados encontrados:', Array.from(produtosAtivos).map(pk => {
        const p = PRODUTOS.find(x => x.key === pk);
        return p ? p.label : pk;
    }));
    
    // RECONSTRÃ“I os cabeÃ§alhos da tabela
    const thead = table.querySelector('thead');
    if (thead) {
        thead.innerHTML = '';
        const headerRow = document.createElement('tr');
        
        // CabeÃ§alhos fixos
        headerRow.innerHTML = `
            <th style="width: 40px; min-width: 40px;">âœ“</th>
            <th style="min-width: 80px;">RegiÃ£o</th>
            <th style="min-width: 100px;">PraÃ§a</th>
            <th style="min-width: 140px;">Emissora</th>
        `;
        
        // CabeÃ§alhos dinÃ¢micos por produto
        produtosAtivos.forEach(produtoKey => {
            const produto = PRODUTOS.find(p => p.key === produtoKey);
            headerRow.innerHTML += `
                <th colspan="2" style="text-align: center; border-bottom: 2px solid var(--primary); min-width: 180px;">
                    ${produto.label}
                </th>
            `;
        });
        
        headerRow.innerHTML += `
            <th style="min-width: 140px;">Inv. Tabela</th>
            <th style="min-width: 140px;">Inv. Negociado</th>
        `;
        
        thead.appendChild(headerRow);
    }
    
    // LIMPA o tbody completamente
    tbody.innerHTML = '';
    
    let totalLinhasAdicionadas = 0;
    
    // Renderiza uma linha por emissora
    proposalData.emissoras.forEach((emissora, emissoraIndex) => {
        console.log(`ðŸ“ Processando emissora ${emissoraIndex}: ${emissora.emissora}`);
        
        let investimentoTabelaEmissora = 0;
        let investimentoNegociadoEmissora = 0;
        
        const row = document.createElement('tr');
        row.className = 'spots-data-row';
        row.id = `emissora-row-${emissora.id}`;  // ID Ãºnico para CSS
        row.setAttribute('data-emissora-id', emissora.id);  // Para rastreamento
        
        // Aplicar estilo se oculta
        if (proposalData.ocultasEmissoras.has(emissora.id)) {
            row.classList.add('emissora-oculta');
        }
        
        // Colunas fixas
        const isOculta = proposalData.ocultasEmissoras.has(emissora.id);
        const logoUrl = getLogoUrl(emissora.linkLogo);
        
        console.log(`  Logo URL para ${emissora.emissora}: ${logoUrl}`);
        
        row.innerHTML = `
            <td class="checkbox-cell">
                <input 
                    type="checkbox" 
                    data-emissora-index="${emissoraIndex}"
                    data-emissora-id="${emissora.id}"
                    onchange="toggleOcultarEmissora(this)"
                    style="cursor: pointer;"
                    ${!isOculta ? 'checked' : ''}
                >
            </td>
            <td>${emissora.uf || '-'}</td>
            <td>${emissora.praca || '-'}</td>
            <td class="emissora-cell">
                ${logoUrl ? `<img src="${logoUrl}" alt="${emissora.emissora}" class="emissora-logo" onerror="console.error('Erro ao carregar logo de ${emissora.emissora}')">` : ''}
                <span class="emissora-name"><strong>${emissora.emissora || '-'}</strong></span>
            </td>
        `;
        
        // Colunas dinÃ¢micas por produto
        produtosAtivos.forEach(produtoKey => {
            const produto = PRODUTOS.find(p => p.key === produtoKey);
            const spots = emissora[produto.key] || 0;
            const valorTabela = emissora[produto.tabelaKey] || 0;
            const valorNegociado = emissora[produto.negKey] || 0;
            
            const invTabela = spots * valorTabela;
            const invNegociado = spots * valorNegociado;
            
            investimentoTabelaEmissora += invTabela;
            investimentoNegociadoEmissora += invNegociado;
            
            row.innerHTML += `
                <td style="text-align: center; min-width: 90px;">
                    <input 
                        type="number" 
                        value="${spots}" 
                        onchange="updateEmissora(${emissoraIndex}, '${produto.key}', this.value)"
                        class="input-spots"
                        min="0"
                        step="1"
                        style="width: 60px; padding: 4px; text-align: center;"
                    >
                </td>
                <td style="text-align: right; min-width: 90px;">R$ ${valorNegociado.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            `;
        });
        
        // Colunas de investimento
        row.innerHTML += `
            <td class="investment-tabela">R$ ${investimentoTabelaEmissora.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td class="investment-negociado">R$ ${investimentoNegociadoEmissora.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        `;
        
        tbody.appendChild(row);
        totalLinhasAdicionadas++;
    });
    
    console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
    console.log(`âœ… Tabela renderizada com sucesso! ${totalLinhasAdicionadas} emissoras exibidas`);
    console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
}

function updateActiveProducts() {
    const activeProductsList = document.getElementById('activeProductsList');
    if (!activeProductsList) return;
    
    // Contar quantidade de cada produto nas emissoras SELECIONADAS
    const productCounts = {};
    
    proposalData.emissoras.forEach((emissora, index) => {
        const checkbox = document.querySelector(`input[type="checkbox"][data-emissora-index="${index}"]`);
        
        // Apenas conta emissoras selecionadas
        if (checkbox && checkbox.checked) {
            PRODUTOS.forEach(produto => {
                const spots = emissora[produto.key] || 0;
                if (spots > 0) {
                    if (!productCounts[produto.label]) {
                        productCounts[produto.label] = 0;
                    }
                    productCounts[produto.label] += spots;
                }
            });
        }
    });
    
    // Renderizar badges com produtos ativos
    const badgesHTML = Object.entries(productCounts)
        .sort((a, b) => b[1] - a[1]) // Ordena por quantidade descendente
        .map(([product, count]) => {
            // Determinar classe de estilo baseado no tipo de produto
            let styleClass = 'secondary';
            if (product.includes('Spots') && product.includes('30')) styleClass = '';
            if (product.includes('5"')) styleClass = 'secondary';
            if (product.includes('15"')) styleClass = '';
            if (product.includes('60"')) styleClass = 'accent';
            if (product.includes('Test')) styleClass = 'secondary';
            
            return `<div class="product-badge ${styleClass}"><strong>${product}:</strong> ${count}</div>`;
        })
        .join('');
    
    activeProductsList.innerHTML = badgesHTML || '<div class="product-badge">Nenhum produto selecionado</div>';
}

function updateStats() {
    console.log('\nâ•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—');
    console.log('â•‘ ðŸ“ INICIANDO: updateStats()');
    console.log('â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
    console.log('âœ… Iniciando cÃ¡lculos apenas das emissoras SELECIONADAS...');
    
    // Calcula o investimento total APENAS das emissoras checadas
    let totalInvestimentoTabela = 0;
    let totalInvestimentoNegociado = 0;
    let totalSpots = 0;
    
    // Percorre apenas as linhas que estÃ£o selecionadas (checkbox marcado)
    proposalData.emissoras.forEach((emissora, index) => {
        const checkbox = document.querySelector(`input[type="checkbox"][data-emissora-index="${index}"]`);
        
        // Se a checkbox estÃ¡ checada, inclui no cÃ¡lculo
        if (checkbox && checkbox.checked) {
            PRODUTOS.forEach(produto => {
                const spots = emissora[produto.key] || 0;
                if (spots > 0) {
                    const valorTabela = emissora[produto.tabelaKey] || 0;
                    const valorNegociado = emissora[produto.negKey] || 0;
                    
                    totalInvestimentoTabela += spots * valorTabela;
                    totalInvestimentoNegociado += spots * valorNegociado;
                    totalSpots += spots;
                }
            });
        }
    });
    
    // Calcula total de impactos das emissoras selecionadas
    let totalImpactos = 0;
    proposalData.emissoras.forEach((emissora, index) => {
        const checkbox = document.querySelector(`input[type="checkbox"][data-emissora-index="${index}"]`);
        if (checkbox && checkbox.checked) {
            const impactosValue = emissora.impactos || 0;
            // Se for string, converte do formato brasileiro
            const impactosNum = typeof impactosValue === 'string' 
                ? parseFloat(impactosValue.replace('.', '').replace(',', '.')) || 0
                : impactosValue;
            totalImpactos += impactosNum;
        }
    });
    
    // Calcula percentual de desconto
    const economia = totalInvestimentoTabela - totalInvestimentoNegociado;
    const percentualDesconto = totalInvestimentoTabela > 0 
        ? ((economia / totalInvestimentoTabela) * 100).toFixed(2)
        : 0;
    
    console.log('ðŸ“Š Total Spots:', totalSpots);
    console.log('ðŸ’° Total Investimento Tabela:', totalInvestimentoTabela);
    console.log('ðŸ’° Total Investimento Negociado:', totalInvestimentoNegociado);
    console.log('ðŸ“ˆ Total Impactos:', totalImpactos);
    console.log('ðŸ’µ Economia (R$):', economia);
    console.log('ðŸ’µ Desconto (%):', percentualDesconto);
    
    const statTotalSpots = document.getElementById('statTotalSpots');
    const statTabelaValue = document.getElementById('statTabelaValue');
    const statNegociadoValue = document.getElementById('statNegociadoValue');
    const statTotalImpacts = document.getElementById('statTotalImpacts');
    const statEconomia = document.getElementById('statEconomia');
    
    console.log('ðŸ” Elementos encontrados:', {
        statTotalSpots: !!statTotalSpots,
        statTabelaValue: !!statTabelaValue,
        statNegociadoValue: !!statNegociadoValue,
        statTotalImpacts: !!statTotalImpacts,
        statEconomia: !!statEconomia
    });
    
    if (statTotalSpots) statTotalSpots.textContent = totalSpots;
    if (statTabelaValue) statTabelaValue.textContent = formatCurrency(totalInvestimentoTabela);
    if (statNegociadoValue) statNegociadoValue.textContent = formatCurrency(totalInvestimentoNegociado);
    if (statTotalImpacts) statTotalImpacts.textContent = totalImpactos.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    if (statEconomia) statEconomia.textContent = percentualDesconto + '%';
    
    // Atualizar lista de produtos ativos
    updateActiveProducts();
    
    // Atualizar tabela comparativa "Sua Proposta"
    updateComparisonTable(totalInvestimentoNegociado, totalInvestimentoTabela);
    
    console.log('âœ… EstatÃ­sticas atualizadas!\n');
}

function updateComparisonTable(negociado, tabela) {
    // ObtÃ©m os elementos da tabela
    const compNegociado = document.getElementById('compNegociado');
    const compNegociadoAtual = document.getElementById('compNegociadoAtual');
    const compTabela = document.getElementById('compTabela');
    const compTabelaAtual = document.getElementById('compTabelaAtual');
    
    // ObtÃ©m o saldo anterior do localStorage
    const saldoAnterior = getSaldoAnterior();
    const negociadoAnterior = saldoAnterior.negociado || 0;
    const tabelaAnterior = saldoAnterior.tabela || 0;
    
    // Atualiza os valores
    if (compNegociado) compNegociado.textContent = formatCurrency(negociadoAnterior);
    if (compNegociadoAtual) compNegociadoAtual.textContent = formatCurrency(negociado);
    if (compTabela) compTabela.textContent = formatCurrency(tabelaAnterior);
    if (compTabelaAtual) compTabelaAtual.textContent = formatCurrency(tabela);
}

function renderCharts() {
    console.log('ðŸ“Š Renderizando grÃ¡ficos...');
    
    try {
        // Destroi os grÃ¡ficos antigos se existirem
        if (charts.investment) {
            charts.investment.destroy();
            charts.investment = null;
        }
        
        renderInvestmentChart();
        console.log('âœ… GrÃ¡ficos renderizados com sucesso!');
    } catch (error) {
        console.error('âš ï¸ Erro ao renderizar grÃ¡ficos (nÃ£o crÃ­tico):', error);
    }
}

function renderInvestmentChart() {
    const ctx = document.getElementById('investmentChart');
    if (!ctx) {
        console.warn('âš ï¸ Elemento investmentChart nÃ£o encontrado');
        return;
    }
    
    const canvasCtx = ctx.getContext('2d');
    
    // Calcula investimentos apenas das linhas selecionadas
    let totalTabela = 0;
    let totalNegociado = 0;
    
    const rows = document.querySelectorAll('#spotsTableBody tr');
    rows.forEach(row => {
        const checkbox = row.querySelector('input[type="checkbox"]');
        if (checkbox && checkbox.checked) {
            // Encontra as cÃ©lulas de investimento nesta linha
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
                // Pega as Ãºltimas 2 cÃ©lulas (investimento tabela e negociado)
                const investTabelaCell = cells[cells.length - 2];
                const investNegociadoCell = cells[cells.length - 1];
                
                if (investTabelaCell && investNegociadoCell) {
                    const tabelaText = investTabelaCell.textContent.replace('R$ ', '').replace(/\./g, '').replace(',', '.');
                    const negociadoText = investNegociadoCell.textContent.replace('R$ ', '').replace(/\./g, '').replace(',', '.');
                    
                    totalTabela += parseFloat(tabelaText) || 0;
                    totalNegociado += parseFloat(negociadoText) || 0;
                }
            }
        }
    });
    
    const labels = ['Tabela', 'Negociado'];
    const data = [totalTabela, totalNegociado];
    
    console.log('ðŸ“Š GrÃ¡fico investimento - Tabela:', totalTabela, 'Negociado:', totalNegociado);
    
    charts.investment = new Chart(canvasCtx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#8b5cf6', '#06055b'],
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

// Calcula o mÃ¡ximo de escala (max redondo) que garanta visualizaÃ§Ã£o de TODAS as barras
function calculateChartMax(dataArray) {
    if (!dataArray || dataArray.length === 0) return 100000;
    
    // Pega o valor mÃ¡ximo real
    const maxValue = Math.max(...dataArray);
    if (maxValue === 0) return 100000;
    
    // Calcula um mÃ¡ximo "redondo" que seja ~20% maior que o mÃ¡ximo
    // Isso garante espaÃ§o no topo mas mantÃ©m escala legÃ­vel
    const targetMax = maxValue * 1.15;
    
    // Arredonda para um valor "bonito": 100k, 200k, 500k, 1M, 2M, 5M, 10M, etc.
    const magnitude = Math.pow(10, Math.floor(Math.log10(targetMax)));
    const normalized = targetMax / magnitude;
    
    let roundedMax;
    if (normalized <= 1) roundedMax = magnitude;
    else if (normalized <= 2) roundedMax = 2 * magnitude;
    else if (normalized <= 5) roundedMax = 5 * magnitude;
    else roundedMax = 10 * magnitude;
    
    return roundedMax;
}


// =====================================================
// CÃLCULOS
// =====================================================

function getSelectedRows() {
    console.log('  â†³ getSelectedRows() chamada');
    // Retorna array de checkboxes selecionados
    const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]:checked');
    console.log('  â†³ Checkboxes selecionados:', checkboxes.length);
    return checkboxes;
}

function calculateTotalSpots() {
    console.log('  â†³ calculateTotalSpots() chamada');
    let total = 0;
    getSelectedRows().forEach(checkbox => {
        const row = checkbox.closest('tr');
        const input = row.querySelector('input[type="number"]');
        if (input) {
            total += parseFloat(input.value) || 0;
        }
    });
    console.log('  â†³ Total spots calculado:', total);
    return total;
}

function calculateTotalInvestimentoTabela() {
    console.log('  â†³ calculateTotalInvestimentoTabela() chamada');
    let total = 0;
    getSelectedRows().forEach(checkbox => {
        const row = checkbox.closest('tr');
        const investCell = row.querySelector('.investment-tabela');
        if (investCell) {
            const value = investCell.textContent.replace('R$ ', '').replace(',', '.');
            total += parseFloat(value) || 0;
        }
    });
    console.log('  â†³ Total investimento tabela calculado:', total);
    return total;
}

function calculateTotalInvestimentoNegociado() {
    console.log('  â†³ calculateTotalInvestimentoNegociado() chamada');
    let total = 0;
    getSelectedRows().forEach(checkbox => {
        const row = checkbox.closest('tr');
        const investCell = row.querySelector('.investment-negociado');
        if (investCell) {
            const value = investCell.textContent.replace('R$ ', '').replace(',', '.');
            total += parseFloat(value) || 0;
        }
    });
    console.log('  â†³ Total investimento negociado calculado:', total);
    return total;
}

function calculateCPM() {
    console.log('  â†³ calculateCPM() chamada');
    const totalSpots = calculateTotalSpots();
    const totalInvestimento = calculateTotalInvestimentoNegociado();
    
    console.log('  â†³ CPM: spots=', totalSpots, 'investimento=', totalInvestimento);
    
    if (totalSpots === 0 || totalInvestimento === 0) return 0;
    return (totalInvestimento / totalSpots) * 1000;
}

// =====================================================
// EDIÃ‡ÃƒO E ATUALIZAÃ‡ÃƒO
// =====================================================

function updateEmissora(index, field, value) {
    console.log(`ðŸ”´ UPDATE: index=${index}, field=${field}, value=${value}`);
    
    const emissora = proposalData.emissoras[index];
    if (!emissora) {
        console.error('âŒ Emissora nÃ£o encontrada:', index);
        return;
    }
    
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
    
    console.log(`ðŸ“ Emissora ${index} - ${field}: ${oldValue} â†’ ${newValue}`);
    console.log('ðŸ“Š Changes agora:', proposalData.changes);
    
    // NÃƒO chama renderSpotsTable, apenas atualiza estatÃ­sticas e grÃ¡ficos
    updateStats();
    renderCharts();
    
    // Mostrar botÃ£o de salvar quando hÃ¡ alteraÃ§Ãµes
    showUnsavedChanges();
}

function updateRowSelection() {
    // FunÃ§Ã£o chamada quando um checkbox Ã© marcado/desmarcado
    // Recalcula os totais baseado nas linhas selecionadas
    console.log('ðŸ“ Linha selecionada/desmarcada');
    updateStats();
    renderCharts();
    
    // Marcar como alteraÃ§Ã£o - seleÃ§Ã£o de linhas tambÃ©m Ã© uma mudanÃ§a!
    showUnsavedChanges();
}

function toggleOcultarEmissora(checkbox) {
    // Se a flag estÃ¡ ativa, ignora este evento e desativa a flag
    if (ignoreNextCheckboxChange) {
        console.log('â­ï¸ Ignorando evento de checkbox (double trigger prevention)');
        ignoreNextCheckboxChange = false;
        return;
    }
    
    const emissoraId = checkbox.getAttribute('data-emissora-id');
    const emissoraIndex = parseInt(checkbox.getAttribute('data-emissora-index'));
    const emissora = proposalData.emissoras[emissoraIndex];
    
    console.log(`\nðŸ”„ TOGGLE EMISSORA: ${emissora?.emissora || emissoraId}`);
    console.log(`   ID: ${emissoraId}`);
    console.log(`   Checkbox.checked: ${checkbox.checked}`);
    console.log(`   Estado ANTES:`);
    console.log(`     - ocultasEmissoras: [${Array.from(proposalData.ocultasEmissoras).join(', ')}]`);
    console.log(`     - changedEmissoras: [${Array.from(proposalData.changedEmissoras).join(', ')}]`);
    
    if (checkbox.checked) {
        // âœ… MARCAR = REMOVER da lista de ocultas (mostra na proposta)
        console.log(`   â†’ AÃ§Ã£o: REMOVER de ocultasEmissoras (ADICIONAR Ã  proposta)`);
        
        // SÃ³ faz algo se estava realmente oculto
        if (proposalData.ocultasEmissoras.has(emissoraId)) {
            proposalData.ocultasEmissoras.delete(emissoraId);
            proposalData.changedEmissoras.add(emissoraId);
            
            const row = document.getElementById(`emissora-row-${emissoraId}`);
            if (row) row.classList.remove('emissora-oculta');
            
            updateStats();
            renderCharts();
            showUnsavedChanges();
            
            console.log(`   âœ… REMOVIDO de ocultasEmissoras`);
        } else {
            console.log(`   âš ï¸ JÃ¡ estava visÃ­vel, nada a fazer`);
        }
    } else {
        // âŒ DESMARCAR = ADICIONAR Ã  lista de ocultas (esconde da proposta)
        console.log(`   â†’ AÃ§Ã£o: ADICIONAR a ocultasEmissoras (REMOVER da proposta)`);
        
        // SÃ³ faz algo se estava realmente visÃ­vel
        if (!proposalData.ocultasEmissoras.has(emissoraId)) {
            proposalData.changedEmissoras.add(emissoraId);
            showUnsavedChanges();  // Mostrar botÃ£o de salvar
            
            console.log(`   â†’ Abrindo modal de confirmaÃ§Ã£o...`);
            showConfirmRemovalModal(checkbox, emissora, emissoraId);
            return;  // Espera confirmaÃ§Ã£o do usuÃ¡rio
        } else {
            console.log(`   âš ï¸ JÃ¡ estava oculto, nada a fazer`);
        }
    }
    
    console.log(`   Estado DEPOIS:`);
    console.log(`     - ocultasEmissoras: [${Array.from(proposalData.ocultasEmissoras).join(', ')}]`);
    console.log(`     - changedEmissoras: [${Array.from(proposalData.changedEmissoras).join(', ')}]\n`);
}

// âœ… FUNÃ‡ÃƒO DE SINCRONIZAÃ‡ÃƒO: ForÃ§a o estado correto dos checkboxes baseado no proposalData
function syncCheckboxState() {
    console.log('ðŸ”„ SINCRONIZANDO ESTADO DOS CHECKBOXES...');
    console.log('   Emissoras ocultas no estado:', Array.from(proposalData.ocultasEmissoras));
    
    proposalData.emissoras.forEach((emissora, index) => {
        const checkbox = document.querySelector(`input[type="checkbox"][data-emissora-index="${index}"]`);
        if (checkbox) {
            const deveEstarVisivel = !proposalData.ocultasEmissoras.has(emissora.id);
            const estaChecked = checkbox.checked;
            
            console.log(`   ${emissora.emissora}: deveEstarVisivel=${deveEstarVisivel}, estaChecked=${estaChecked}`);
            
            if (deveEstarVisivel !== estaChecked) {
                console.log(`      âš ï¸ DESSINCRONIZADO! Corrigindo...`);
                ignoreNextCheckboxChange = true;
                checkbox.checked = deveEstarVisivel;
                
                const row = document.getElementById(`emissora-row-${emissora.id}`);
                if (row) {
                    if (deveEstarVisivel) {
                        row.classList.remove('emissora-oculta');
                    } else {
                        row.classList.add('emissora-oculta');
                    }
                }
            }
        }
    });
    
    console.log('âœ… SincronizaÃ§Ã£o completa');
}
// =====================================================
// SALVAR ALTERAÃ‡Ã•ES
// =====================================================

async function saveChanges() {
    console.log('ðŸ”´ CLICOU EM SALVAR!');
    console.log('ðŸ“Š proposalData.changes:', proposalData.changes);
    console.log('ðŸ“Š NÃºmero de mudanÃ§as:', Object.keys(proposalData.changes).length);
    console.log('ðŸ‘¤ Emissoras ocultas:', proposalData.ocultasEmissoras.size);
    console.log('ðŸ‘¤ Emissoras alteradas:', proposalData.changedEmissoras.size);
    
    const temMudancas = Object.keys(proposalData.changes).length > 0;
    const temMudancasEmissoras = proposalData.changedEmissoras.size > 0;
    
    if (!temMudancas && !temMudancasEmissoras) {
        console.warn('âš ï¸ Nenhuma alteraÃ§Ã£o para salvar!');
        alert('Nenhuma alteraÃ§Ã£o para salvar!');
        return;
    }
    
    console.log('ðŸ’¾ Preparando alteraÃ§Ãµes para visualizaÃ§Ã£o...');
    
    // Montar o resumo das alteraÃ§Ãµes agrupadas por emissora
    showConfirmModal();
}

function showConfirmModal() {
    console.log('ðŸ“‹ Abrindo modal de confirmaÃ§Ã£o...');
    
    const modal = document.getElementById('confirmModal');
    const modalBody = document.getElementById('confirmModalBody');
    
    // Agrupar alteraÃ§Ãµes por emissora
    const changesByEmissora = {};
    
    for (const changeKey in proposalData.changes) {
        const change = proposalData.changes[changeKey];
        const emissora = proposalData.emissoras[change.emissoraIndex];
        
        if (!changesByEmissora[change.emissoraIndex]) {
            changesByEmissora[change.emissoraIndex] = [];
        }
        
        changesByEmissora[change.emissoraIndex].push({
            field: change.field,
            old: change.old,
            new: change.new,
            emissora: emissora
        });
    }
    
    // Montar HTML do modal
    let html = '';
    
    // Primeiro, mostrar as emissoras que serÃ£o removidas (ocultas)
    if (proposalData.ocultasEmissoras.size > 0) {
        html += `
            <div class="change-group" style="border-left-color: #dc2626; background-color: #fef2f2;">
                <div class="change-group-title" style="color: #dc2626;">
                    <i class="fas fa-trash"></i> Emissoras a Remover
                </div>
        `;
        
        for (const emissoraId of proposalData.ocultasEmissoras) {
            const emissora = proposalData.emissoras.find(e => e.id === emissoraId);
            if (emissora) {
                html += `
                    <div class="change-item" style="padding: 8px 0; color: #dc2626;">
                        <strong>${emissora.emissora}</strong>
                        <span style="font-size: 12px; color: #999;"> - serÃ¡ movida para "Lista de alternantes"</span>
                    </div>
                `;
            }
        }
        
        html += '</div>';
    }
    
    // Mostrar as emissoras que serÃ£o adicionadas (foram restauradas)
    // SÃ£o aquelas que estÃ£o em changedEmissoras mas NÃƒO estÃ£o em ocultasEmissoras
    const emisssorasAdicionar = Array.from(proposalData.changedEmissoras).filter(
        emissoraId => !proposalData.ocultasEmissoras.has(emissoraId)
    );
    
    if (emisssorasAdicionar.length > 0) {
        html += `
            <div class="change-group" style="border-left-color: #10b981; background-color: #f0fdf4;">
                <div class="change-group-title" style="color: #10b981;">
                    <i class="fas fa-plus-circle"></i> Emissoras a Adicionar
                </div>
        `;
        
        for (const emissoraId of emisssorasAdicionar) {
            const emissora = proposalData.emissoras.find(e => e.id === emissoraId);
            if (emissora) {
                html += `
                    <div class="change-item" style="padding: 8px 0; color: #10b981;">
                        <strong>${emissora.emissora}</strong>
                        <span style="font-size: 12px; color: #999;"> - serÃ¡ incluÃ­da na proposta</span>
                    </div>
                `;
            }
        }
        
        html += '</div>';
    }
    
    // Depois, mostrar as mudanÃ§as de valores
    for (const emissoraIndex in changesByEmissora) {
        const changes = changesByEmissora[emissoraIndex];
        const emissora = proposalData.emissoras[emissoraIndex];
        const emissoraName = emissora?.emissora || 'Desconhecida';
        
        html += `
            <div class="change-group">
                <div class="change-group-title">
                    <i class="fas fa-radio"></i> ${emissoraName}
                </div>
        `;
        
        changes.forEach(change => {
            // Encontrar o label do produto
            let fieldLabel = change.field;
            const produto = PRODUTOS.find(p => 
                p.key === change.field || 
                p.tabelaKey === change.field || 
                p.negKey === change.field
            );
            
            if (produto) {
                if (change.field === produto.key) {
                    fieldLabel = `${produto.label}`;
                } else if (change.field === produto.tabelaKey) {
                    fieldLabel = `${produto.label} (Tabela)`;
                } else if (change.field === produto.negKey) {
                    fieldLabel = `${produto.label} (Negociado)`;
                }
            }
            
            // Formatar valores
            let oldValue = change.old;
            let newValue = change.new;
            
            // Se for valor monetÃ¡rio, formatar como moeda
            if (change.field.includes('valor') || change.field.includes('investimento')) {
                oldValue = formatCurrency(change.old);
                newValue = formatCurrency(change.new);
            }
            
            html += `
                <div class="change-item">
                    <span class="change-item-label">${fieldLabel}</span>
                    <div style="display: flex; align-items: center;">
                        <span class="change-old">${oldValue}</span>
                        <span class="change-arrow">â†’</span>
                        <span class="change-new">${newValue}</span>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    modalBody.innerHTML = html;
    modal.style.display = 'flex';
    
    console.log('âœ… Modal aberto com sucesso!');
}

function closeConfirmModal() {
    console.log('âŒ Fechando modal (editando novamente)');
    document.getElementById('confirmModal').style.display = 'none';
}

// =====================================================
// MODAL DE CONFIRMAÃ‡ÃƒO DE REMOÃ‡ÃƒO
// =====================================================

let pendingRemovalData = null;

function showConfirmRemovalModal(checkbox, emissora, emissoraId) {
    console.log('ðŸ“‹ Abrindo modal de confirmaÃ§Ã£o de remoÃ§Ã£o...');
    
    // Salvar dados para confirmaÃ§Ã£o
    pendingRemovalData = {
        checkbox: checkbox,
        emissora: emissora,
        emissoraId: emissoraId
    };
    
    const modal = document.getElementById('confirmRemovalModal');
    const modalBody = document.getElementById('confirmRemovalModalBody');
    
    // Montar HTML do modal
    const html = `
        <div class="change-group" style="padding: 20px; background: #fff3cd; border-left: 4px solid #ff6b6b; border-radius: 4px;">
            <div class="change-group-title" style="color: #d32f2f; margin-bottom: 12px;">
                <i class="fas fa-exclamation-triangle"></i> Confirmar RemoÃ§Ã£o de Emissora
            </div>
            <p style="margin: 12px 0; font-size: 15px;">
                VocÃª estÃ¡ removendo a emissora <strong>${emissora.emissora}</strong> desta proposta.
            </p>
            <p style="margin: 12px 0; font-size: 14px; color: #666;">
                Esta emissora serÃ¡ excluÃ­da e nÃ£o serÃ¡ contabilizada. VocÃª poderÃ¡ restaurÃ¡-la marcando novamente depois.
            </p>
        </div>
    `;
    
    modalBody.innerHTML = html;
    modal.style.display = 'flex';
}

function closeConfirmRemovalModal() {
    console.log('âŒ Cancelando remoÃ§Ã£o');
    document.getElementById('confirmRemovalModal').style.display = 'none';
    
    // Restaurar checkbox para o estado anterior
    if (pendingRemovalData) {
        const { checkbox, emissoraId } = pendingRemovalData;
        
        // âš ï¸ IMPORTANTE: Remover do changedEmissoras porque estamos cancelando
        proposalData.changedEmissoras.delete(emissoraId);
        
        // Ativar flag para ignorar o prÃ³ximo evento de checkbox
        ignoreNextCheckboxChange = true;
        checkbox.checked = true;
        
        // Sincronizar visual tambÃ©m
        const row = document.getElementById(`emissora-row-${emissoraId}`);
        if (row) {
            row.classList.remove('emissora-oculta');
        }
        
        // Atualizar estado do botÃ£o salvar
        showUnsavedChanges();
        
        console.log(`   âœ… Estado do cancelamento sincronizado`);
    }
    
    pendingRemovalData = null;
}

function confirmRemoval() {
    console.log('\nâœ… CONFIRMANDO REMOÃ‡ÃƒO DE EMISSORA');
    
    if (!pendingRemovalData) {
        console.error('âŒ pendingRemovalData Ã© nulo!');
        return;
    }
    
    const { checkbox, emissora, emissoraId } = pendingRemovalData;
    
    console.log(`   Emissora: ${emissora?.emissora || emissoraId}`);
    console.log(`   Estado ANTES:`);
    console.log(`     - ocultasEmissoras: [${Array.from(proposalData.ocultasEmissoras).join(', ')}]`);
    console.log(`     - changedEmissoras: [${Array.from(proposalData.changedEmissoras).join(', ')}]`);
    console.log(`     - checkbox.checked: ${checkbox.checked}`);
    
    // ValidaÃ§Ã£o: sÃ³ adiciona Ã  lista de ocultas se ainda nÃ£o estÃ¡ lÃ¡
    if (!proposalData.ocultasEmissoras.has(emissoraId)) {
        proposalData.ocultasEmissoras.add(emissoraId);
        console.log(`   âœ… Adicionado a ocultasEmissoras`);
    } else {
        console.log(`   âš ï¸ JÃ¡ estava em ocultasEmissoras`);
    }
    
    // Garantir que estÃ¡ em changedEmissoras
    proposalData.changedEmissoras.add(emissoraId);
    
    // Atualizar visual da linha
    const row = document.getElementById(`emissora-row-${emissoraId}`);
    if (row) {
        row.classList.add('emissora-oculta');
        console.log(`   âœ… Linha visual marcada como oculta`);
    } else {
        console.warn(`   âš ï¸ Linha nÃ£o encontrada: ${emissoraId}`);
    }
    
    // âš ï¸ CRUCIAL: Atualizar o checkbox visualmente mas com flag para nÃ£o trigger novamente
    ignoreNextCheckboxChange = true;
    checkbox.checked = false;
    
    // Atualizar estatÃ­sticas
    updateStats();
    renderCharts();
    
    // Mostrar botÃ£o salvar e marcar como alteraÃ§Ã£o
    showUnsavedChanges();
    
    // Fechar modal
    document.getElementById('confirmRemovalModal').style.display = 'none';
    pendingRemovalData = null;
    
    console.log(`   Estado DEPOIS:`);
    console.log(`     - ocultasEmissoras: [${Array.from(proposalData.ocultasEmissoras).join(', ')}]`);
    console.log(`     - changedEmissoras: [${Array.from(proposalData.changedEmissoras).join(', ')}]\n`);
}


function showUnsavedChanges() {
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        const temMudancas = Object.keys(proposalData.changes).length > 0;
        const temMudancasEmissoras = proposalData.changedEmissoras.size > 0;
        
        const shouldShow = temMudancas || temMudancasEmissoras;
        
        console.log(`ðŸ’¾ showUnsavedChanges:`);
        console.log(`   MudanÃ§as em campos: ${temMudancas}`);
        console.log(`   MudanÃ§as em emissoras: ${temMudancasEmissoras} (${proposalData.changedEmissoras.size})`);
        console.log(`   Mostrar botÃ£o: ${shouldShow}`);
        console.log(`   Changes: ${JSON.stringify(proposalData.changes)}`);
        console.log(`   Emissoras alteradas: ${Array.from(proposalData.changedEmissoras)}`);
        
        saveBtn.style.display = shouldShow ? 'block' : 'none';
    } else {
        console.warn('âŒ BotÃ£o saveBtn nÃ£o encontrado!');
    }
}


async function confirmAndSave() {
    console.log('âœ… Confirmando e salvando alteraÃ§Ãµes...');
    
    const modal = document.getElementById('confirmModal');
    modal.style.display = 'none';
    
    // âš ï¸ USAR O ÃšLTIMO ESTADO SALVO COM SUCESSO PARA ROLLBACK
    // NÃ£o criamos backup aqui, usamos o lastSuccessfulState que foi salvo
    // na Ãºltima operaÃ§Ã£o bem-sucedida (ou no carregamento inicial)
    console.log('ðŸ”„ Estado atual antes de salvar:', {
        ocultasEmissoras: Array.from(proposalData.ocultasEmissoras),
        changedEmissoras: Array.from(proposalData.changedEmissoras),
        changesCount: Object.keys(proposalData.changes).length
    });
    console.log('ðŸ’¾ Ãšltimo estado salvo com sucesso (fallback):', {
        ocultasEmissoras: Array.from(proposalData.lastSuccessfulState.ocultasEmissoras),
        changesCount: Object.keys(proposalData.lastSuccessfulState.changes).length
    });
    
    try {
        const apiUrl = getApiUrl();
        console.log('ðŸ“¡ API URL:', apiUrl);
        
        // Sincronizar o estado "Excluir" com o Notion
        const dataToSave = {
            tableId: proposalData.tableId,
            emissoras: proposalData.emissoras,
            changes: proposalData.changes,
            ocultasEmissoras: Array.from(proposalData.ocultasEmissoras)  // Converter Set para Array
        };
        
        console.log('ðŸ“¤ Enviando dados:', dataToSave);
        console.log('ðŸ‘¤ Emissoras ocultas:', dataToSave.ocultasEmissoras);
        
        const response = await fetch(`${apiUrl}?id=${proposalData.tableId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSave)
        });
        
        console.log('ðŸ“¥ Response status:', response.status);
        console.log('ðŸ“¥ Response ok:', response.ok);
        
        // âš ï¸ VALIDAÃ‡ÃƒO RIGOROSA DA RESPOSTA
        if (!response.ok) {
            const errorData = await response.json();
            console.error('âŒ Erro na resposta:', errorData);
            console.error('âŒ Erro completo:', JSON.stringify(errorData, null, 2));
            
            // ðŸ”„ ROLLBACK: Restaurar Ãºltimo estado salvo com sucesso
            console.log('ðŸ”„ FAZENDO ROLLBACK PARA ÃšLTIMO ESTADO SALVO...');
            proposalData.ocultasEmissoras = new Set(proposalData.lastSuccessfulState.ocultasEmissoras);
            proposalData.changedEmissoras = new Set();  // Limpar mudanÃ§as pendentes
            proposalData.changes = JSON.parse(JSON.stringify(proposalData.lastSuccessfulState.changes));
            proposalData.emissoras = proposalData.lastSuccessfulState.emissoras.map(e => ({...e}));
            
            console.log('   Estado restaurado para:', {
                ocultasEmissoras: Array.from(proposalData.ocultasEmissoras),
                changesCount: Object.keys(proposalData.changes).length
            });
            
            // Restaurar visualmente todos os checkboxes baseado no Ãºltimo estado salvo
            proposalData.emissoras.forEach((emissora, index) => {
                const checkbox = document.querySelector(`input[type="checkbox"][data-emissora-index="${index}"]`);
                if (checkbox) {
                    const shouldBeChecked = !proposalData.lastSuccessfulState.ocultasEmissoras.has(emissora.id);
                    ignoreNextCheckboxChange = true;
                    checkbox.checked = shouldBeChecked;
                    
                    const row = document.getElementById(`emissora-row-${emissora.id}`);
                    if (row) {
                        if (shouldBeChecked) {
                            row.classList.remove('emissora-oculta');
                        } else {
                            row.classList.add('emissora-oculta');
                        }
                    }
                }
            });
            
            updateStats();
            renderCharts();
            showUnsavedChanges();
            
            throw new Error(errorData.error || errorData.message || 'Erro ao salvar');
        }
        
        const result = await response.json();
        
        // âš ï¸ VALIDAÃ‡ÃƒO: Verificar se resposta contÃ©m dados vÃ¡lidos
        if (!result || result.success === false) {
            console.error('âŒ Resposta indicou falha:', result);
            
            // ðŸ”„ ROLLBACK: Restaurar Ãºltimo estado salvo com sucesso
            console.log('ðŸ”„ FAZENDO ROLLBACK PARA ÃšLTIMO ESTADO SALVO...');
            proposalData.ocultasEmissoras = new Set(proposalData.lastSuccessfulState.ocultasEmissoras);
            proposalData.changedEmissoras = new Set();  // Limpar mudanÃ§as pendentes
            proposalData.changes = JSON.parse(JSON.stringify(proposalData.lastSuccessfulState.changes));
            proposalData.emissoras = proposalData.lastSuccessfulState.emissoras.map(e => ({...e}));
            
            console.log('   Estado restaurado para:', {
                ocultasEmissoras: Array.from(proposalData.ocultasEmissoras),
                changesCount: Object.keys(proposalData.changes).length
            });
            
            // Restaurar visualmente todos os checkboxes baseado no Ãºltimo estado salvo
            proposalData.emissoras.forEach((emissora, index) => {
                const checkbox = document.querySelector(`input[type="checkbox"][data-emissora-index="${index}"]`);
                if (checkbox) {
                    const shouldBeChecked = !proposalData.lastSuccessfulState.ocultasEmissoras.has(emissora.id);
                    ignoreNextCheckboxChange = true;
                    checkbox.checked = shouldBeChecked;
                    
                    const row = document.getElementById(`emissora-row-${emissora.id}`);
                    if (row) {
                        if (shouldBeChecked) {
                            row.classList.remove('emissora-oculta');
                        } else {
                            row.classList.add('emissora-oculta');
                        }
                    }
                }
            });
            
            updateStats();
            renderCharts();
            showUnsavedChanges();
            
            throw new Error(result.message || 'Falha desconhecida ao salvar');
        }
        
        // âš ï¸ VALIDAÃ‡ÃƒO EXTRA: Verificar se houve FALHAS NAS ATUALIZAÃ‡Ã•ES ESPECÃFICAS
        // Mesmo que success: true, pode haver failedUpdates
        const failedUpdates = result.failedUpdates || 0;
        const details = result.details || [];
        
        console.log('ðŸ“Š Resultado da operaÃ§Ã£o:');
        console.log(`   - Sucesso total: ${result.success}`);
        console.log(`   - AtualizaÃ§Ãµes bem-sucedidas: ${result.successfulUpdates || 0}`);
        console.log(`   - AtualizaÃ§Ãµes falhadas: ${failedUpdates}`);
        console.log(`   - Detalhes:`, details);
        
        if (failedUpdates > 0) {
            console.error('âŒ ATENÃ‡ÃƒO: Algumas atualizaÃ§Ãµes falharam!');
            
            // Mostrar quais falharam
            details.forEach(detail => {
                if (!detail.success) {
                    console.error(`   âŒ ${detail.emissoraName} - Campo "${detail.field}" FALHOU:`, detail.error);
                }
            });
            
            // ðŸ”„ ROLLBACK PARCIAL: Restaurar Ãºltimo estado salvo com sucesso
            console.log('ðŸ”„ FAZENDO ROLLBACK PARA ÃšLTIMO ESTADO SALVO (falhas detectadas)...');
            proposalData.ocultasEmissoras = new Set(proposalData.lastSuccessfulState.ocultasEmissoras);
            proposalData.changedEmissoras = new Set();  // Limpar mudanÃ§as pendentes
            proposalData.changes = JSON.parse(JSON.stringify(proposalData.lastSuccessfulState.changes));
            proposalData.emissoras = proposalData.lastSuccessfulState.emissoras.map(e => ({...e}));
            
            console.log('   Estado restaurado para:', {
                ocultasEmissoras: Array.from(proposalData.ocultasEmissoras),
                changesCount: Object.keys(proposalData.changes).length
            });
            
            // Restaurar visualmente todos os checkboxes baseado no Ãºltimo estado salvo
            proposalData.emissoras.forEach((emissora, index) => {
                const checkbox = document.querySelector(`input[type="checkbox"][data-emissora-index="${index}"]`);
                if (checkbox) {
                    const shouldBeChecked = !proposalData.lastSuccessfulState.ocultasEmissoras.has(emissora.id);
                    ignoreNextCheckboxChange = true;
                    checkbox.checked = shouldBeChecked;
                    
                    const row = document.getElementById(`emissora-row-${emissora.id}`);
                    if (row) {
                        if (shouldBeChecked) {
                            row.classList.remove('emissora-oculta');
                        } else {
                            row.classList.add('emissora-oculta');
                        }
                    }
                }
            });
            
            updateStats();
            renderCharts();
            showUnsavedChanges();
            
            // Mostrar erro com detalhes
            const failedEmissoras = details
                .filter(d => !d.success)
                .map(d => `${d.emissoraName} (${d.field})`)
                .join(', ');
            
            throw new Error(`Erro ao salvar alguns campos: ${failedEmissoras}. Estado foi revertido. Tente novamente.`);
        }
        
        console.log('âœ… AlteraÃ§Ãµes salvas!', result);
        console.log('ðŸ” debugLogs recebido:', result.debugLogs);
        
        // Exibir logs do servidor no console
        if (result.debugLogs && Array.isArray(result.debugLogs)) {
            console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
            console.log('ðŸ“‹ LOGS DO SERVIDOR (Notion.js):');
            console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
            result.debugLogs.forEach(log => console.log(log));
            console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
        } else {
            console.warn('âš ï¸ debugLogs vazio ou nÃ£o Ã© array:', result.debugLogs);
        }
        
        // âœ… SÃ“ LIMPA ESTADO APÃ“S CONFIRMAÃ‡ÃƒO DE SUCESSO
        proposalData.changes = {};
        proposalData.initialOcultasEmissoras = new Set(proposalData.ocultasEmissoras);
        proposalData.changedEmissoras = new Set();  // Limpar emissoras alteradas
        
        // ðŸ’¾ ATUALIZAR BACKUP DO ÃšLTIMO ESTADO SALVO COM SUCESSO
        proposalData.lastSuccessfulState = {
            ocultasEmissoras: new Set(proposalData.ocultasEmissoras),
            changes: JSON.parse(JSON.stringify(proposalData.changes)),
            emissoras: proposalData.emissoras.map(e => ({...e}))
        };
        console.log('ðŸ’¾ Novo estado salvo como backup para rollback futuro:', {
            ocultasEmissoras: Array.from(proposalData.lastSuccessfulState.ocultasEmissoras),
            changesCount: Object.keys(proposalData.lastSuccessfulState.changes).length
        });
        
        // âœ… SALVAR O SALDO ATUAL COMO "SALDO ANTERIOR" PARA A PRÃ“XIMA PROPOSTA
        let totalInvestimentoTabela = 0;
        let totalInvestimentoNegociado = 0;
        
        proposalData.emissoras.forEach((emissora, index) => {
            const checkbox = document.querySelector(`input[type="checkbox"][data-emissora-index="${index}"]`);
            if (checkbox && checkbox.checked) {
                PRODUTOS.forEach(produto => {
                    const spots = emissora[produto.key] || 0;
                    if (spots > 0) {
                        const valorTabela = emissora[produto.tabelaKey] || 0;
                        const valorNegociado = emissora[produto.negKey] || 0;
                        totalInvestimentoTabela += spots * valorTabela;
                        totalInvestimentoNegociado += spots * valorNegociado;
                    }
                });
            }
        });
        
        // Salvar no localStorage como "saldo anterior"
        setSaldoAnterior(totalInvestimentoNegociado, totalInvestimentoTabela);
        console.log('ðŸ’¾ Saldo anterior atualizado para prÃ³xima ediÃ§Ã£o');
        
        // Ocultar botÃ£o de salvar jÃ¡ que nÃ£o hÃ¡ mais alteraÃ§Ãµes
        showUnsavedChanges();
        
        // Mostrar modal de sucesso
        showSuccessModal();
    } catch (error) {
        console.error('âŒ Erro ao salvar:', error);
        alert(`Erro ao salvar: ${error.message}`);
    }
}

function showSuccessModal() {
    console.log('ðŸŽ‰ Mostrando modal de sucesso...');
    
    // âœ… Sincronizar estado dos checkboxes apÃ³s sucesso confirmado
    console.log('ðŸ”„ Sincronizando estado apÃ³s sucesso...');
    syncCheckboxState();
    
    const successModal = document.getElementById('successModal');
    successModal.style.display = 'flex';
    
    // Auto-fechar apÃ³s 5 segundos (opcional)
    setTimeout(() => {
        // Comentado para o usuÃ¡rio controlar quando fechar
        // closeSuccessModal();
    }, 5000);
}

function closeSuccessModal() {
    console.log('Fechando modal de sucesso');
    document.getElementById('successModal').style.display = 'none';
}

// âœ… FUNÃ‡ÃƒO DE DEBUG: Exibir estado atual completo
function debugState() {
    console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
    console.log('ðŸ” DEBUG STATE - Estado Completo da AplicaÃ§Ã£o');
    console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
    console.log('ðŸ“Š proposalData.changes:', proposalData.changes);
    console.log('ðŸ‘¤ proposalData.ocultasEmissoras:', Array.from(proposalData.ocultasEmissoras));
    console.log('ðŸ‘¤ proposalData.changedEmissoras:', Array.from(proposalData.changedEmissoras));
    console.log('ðŸ“‹ proposalData.initialOcultasEmissoras:', Array.from(proposalData.initialOcultasEmissoras));
    
    console.log('\nðŸ“‹ ESTADO DOS CHECKBOXES:');
    proposalData.emissoras.forEach((emissora, index) => {
        const checkbox = document.querySelector(`input[type="checkbox"][data-emissora-index="${index}"]`);
        const isOculta = proposalData.ocultasEmissoras.has(emissora.id);
        const checkboxValue = checkbox ? checkbox.checked : 'NOT FOUND';
        const deveEstarVisivel = !isOculta;
        const estaSincronizado = checkboxValue === deveEstarVisivel;
        
        console.log(`   [${estaSincronizado ? 'âœ…' : 'âŒ'}] ${emissora.emissora}:`);
        console.log(`       - Checkbox: ${checkboxValue}`);
        console.log(`       - Deve estar visÃ­vel: ${deveEstarVisivel}`);
        console.log(`       - EstÃ¡ oculta no estado: ${isOculta}`);
    });
    
    console.log('\nðŸ“± ESTADO DO BOTÃƒO SALVAR:');
    const saveBtn = document.getElementById('saveBtn');
    console.log(`   - VisÃ­vel: ${saveBtn ? saveBtn.style.display !== 'none' : 'NOT FOUND'}`);
    console.log(`   - Display: ${saveBtn ? saveBtn.style.display : 'NOT FOUND'}`);
    
    console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
}

// âœ… FUNÃ‡ÃƒO DE FORÃ‡A-SINCRONIZAÃ‡ÃƒO: Chamar manualmente se algo ficar dessincronizado
function forceSync() {
    console.log('ðŸ”´ FORÃ‡A-SINCRONIZAÃ‡ÃƒO MANUAL ACIONADA!');
    console.log('   Estado ANTES:');
    proposalData.emissoras.forEach((emissora, index) => {
        const checkbox = document.querySelector(`input[type="checkbox"][data-emissora-index="${index}"]`);
        console.log(`   - ${emissora.emissora}: checkbox=${checkbox?.checked}, oculta=${proposalData.ocultasEmissoras.has(emissora.id)}`);
    });
    
    syncCheckboxState();
    updateStats();
    renderCharts();
    
    console.log('   Estado DEPOIS:');
    proposalData.emissoras.forEach((emissora, index) => {
        const checkbox = document.querySelector(`input[type="checkbox"][data-emissora-index="${index}"]`);
        console.log(`   - ${emissora.emissora}: checkbox=${checkbox?.checked}, oculta=${proposalData.ocultasEmissoras.has(emissora.id)}`);
    });
    
    alert('âœ… SincronizaÃ§Ã£o forÃ§ada realizada! Verifique o console para detalhes.');
}

// =====================================================
// UTILITÃRIOS
// =====================================================

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function showError(message) {
    console.error('âŒ', message);
    alert(`Erro: ${message}`);
}

function goBack() {
    window.history.back();
}

window.addEventListener('resize', () => {
    Object.values(charts).forEach(chart => {
        if (chart) chart.resize();
    });
});

