// ✅ MAPS-INTEGRATION.JS COMPLETO - VERSÃO 5.0 COM COORDENADAS SEPARADAS
// ==================== VARIÁVEIS GLOBAIS ====================
let currentMapsData = [];

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', function() {
    setupMapsEventListeners();
    console.log('✅ Maps Integration carregado com sucesso - v5.0 com coordenadas separadas');
});

// ==================== CONFIGURAÇÃO DE EVENT LISTENERS ====================
function setupMapsEventListeners() {
    // Configurar botão de busca
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', startMapsSearch);
    }
    
    // Configurar botão de exportação
    const exportBtn = document.getElementById('btn-csv');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportarCSV);
    }
    
    // Configurar enter no campo de busca
    const searchTermInput = document.getElementById('searchTerm');
    if (searchTermInput) {
        searchTermInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                startMapsSearch();
            }
        });
    }
}

// ==================== PROTEÇÃO DA SEÇÃO DE MAPS ====================
function setupMapsProtection() {
    const mapsSection = document.getElementById('leadMapsSection');
    if (!mapsSection) return;

    // ✅ INTERCEPTAR TODOS OS CLIQUES DENTRO DA SEÇÃO MAPS
    mapsSection.addEventListener('click', function(e) {
        // Verificar se deve mostrar modal
        if (shouldShowModalForMaps(e.target)) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // Mostrar modal através do sistema global
            if (window.signupSystem && !window.signupSystem.isLoggedIn && window.signupSystem.hasUsedTool) {
                window.signupSystem.showModal();
                return false;
            }
        }
    }, true); // ✅ USAR CAPTURE PHASE
}

function shouldShowModalForMaps(element) {
    // Se não há sistema de cadastro ou usuário está logado, permitir
    if (!window.signupSystem || window.signupSystem.isLoggedIn || !window.signupSystem.hasUsedTool) {
        return false;
    }

    // ✅ ELEMENTOS QUE DEVEM SER BLOQUEADOS APÓS PRIMEIRO USO
    const restrictedSelectors = [
        // Botões de exportação CSV
        '#btn-csv',
        'button[onclick*="exportarCSV"]',
        'button[onclick*="exportCSV"]',
        '[data-export="csv"]',
        // Links externos da tabela Maps
        '#mapsTableBody a',
        '#searchResults a',
        'a[target="_blank"]',
        'a[href*="maps.google.com"]',
        // Botões de ação da tabela Maps
        'button[onclick*="addToFunnel"]',
        '.btn[onclick*="addToFunnel"]',
        '.btn-outline-primary',
        '.btn-outline-secondary',
        // Qualquer link/botão dentro dos resultados
        '#searchResults button:not(.btn-close)',
        '#mapsResultsTitle button',
        // Telefones clicáveis
        'a[href^="tel:"]',
        '.telefone-link',
        '#phonefound'
    ];

    // ✅ VERIFICAR SE ELEMENTO CORRESPONDE AOS SELETORES
    for (const selector of restrictedSelectors) {
        try {
            if (element.matches && element.matches(selector)) {
                return true;
            }
            if (element.closest && element.closest(selector)) {
                return true;
            }
        } catch (error) {
            continue;
        }
    }

    // ✅ VERIFICAR ATRIBUTOS ONCLICK
    const onclickAttr = element.getAttribute('onclick');
    if (onclickAttr) {
        const restrictedOnclicks = [
            'exportarCSV',
            'exportCSV',
            'addToFunnel',
            'exportar',
            'download'
        ];
        for (const restricted of restrictedOnclicks) {
            if (onclickAttr.includes(restricted)) {
                return true;
            }
        }
    }

    // ✅ VERIFICAR SE É UM LINK EXTERNO
    if (element.tagName === 'A' && element.href && 
        (element.href.startsWith('http') && !element.href.includes(window.location.hostname))) {
        return true;
    }

    return false;
}

// ==================== VERIFICAÇÃO DE PERMISSÃO ====================
function checkMapsPermission() {
    if (window.signupSystem) {
        const hasPermission = window.signupSystem.isLoggedIn || !window.signupSystem.hasUsedTool;
        if (!hasPermission) {
            window.signupSystem.showModal();
            return false;
        }
        return true;
    }
    return true; // Se não há sistema, permitir
}

// ==================== BUSCA PRINCIPAL ====================
async function startMapsSearch() {
    console.log('🔍 Iniciando busca no Maps');
    
    // IDs corretos dos elementos
    const searchTerm = document.getElementById('searchTerm').value.trim();
    const maxResults = document.getElementById('maxResults').value;

    if (!searchTerm) {
        alert('Digite um termo de busca!');
        return;
    }

    const searchBtn = document.getElementById('searchBtn');
    const resultsSection = document.getElementById('searchResults');
    const loadingSection = document.getElementById('mapsLoading');

    // ✅ MOSTRAR LOADING COM GIF
    if (loadingSection) loadingSection.classList.remove('hidden');
    if (resultsSection) resultsSection.classList.add('hidden');

    // ✅ ANIMAR STEPS PROGRESSIVAMENTE
    animateLoadingSteps();

    // ✅ EFEITO NO BOTÃO
    if (searchBtn) {
        searchBtn.innerHTML = '⏳ Buscando...';
        searchBtn.disabled = true;
    }

    try {
        console.log('📡 Enviando requisição para API...');
        
        // ✅ CONECTAR COM O BACKEND VIA NGROK (URL ATUALIZADA)
        const response = await fetch('http://192.168.18.77:3000/api/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                termo: searchTerm,
                maxResultados: parseInt(maxResults)
            })
        });

        console.log('📡 Resposta recebida, status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📊 Dados processados:', data);

        if (data.sucesso) {
            currentMapsData = data.resultados;
            displayMapsResults(data);

            // ✅ ESCONDER LOADING E MOSTRAR RESULTADOS
            if (loadingSection) loadingSection.classList.add('hidden');
            if (resultsSection) resultsSection.classList.remove('hidden');
            
            console.log('✅ Busca concluída com sucesso');
        } else {
            if (loadingSection) loadingSection.classList.add('hidden');
            alert('Erro: ' + data.erro);
            console.error('❌ Erro da API:', data.erro);
        }

    } catch (error) {
        console.error('❌ Erro na requisição:', error);
        if (loadingSection) loadingSection.classList.add('hidden');
        
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
            alert('Erro de conexão. Verifique se o servidor backend está rodando.');
        } else {
            alert('Erro: ' + error.message);
        }
    } finally {
        // ✅ RESTAURAR BOTÃO
        if (searchBtn) {
            searchBtn.innerHTML = '🔍 Buscar';
            searchBtn.disabled = false;
        }
    }
}

// ==================== ANIMAÇÃO DOS STEPS ====================
function animateLoadingSteps() {
    const steps = document.querySelectorAll('.step-text');
    if (!steps.length) return;

    // Reset todos os steps
    steps.forEach(step => {
        step.classList.remove('active');
    });

    // Animar steps sequencialmente
    steps.forEach((step, index) => {
        setTimeout(() => {
            step.classList.add('active');
        }, (index + 1) * 1500); // 1.5s entre cada step
    });
}

// ==================== FORMATAÇÃO DE COORDENADAS ====================
function formatarLatitude(latitude) {
    if (!latitude || typeof latitude !== 'number' || latitude === 0) {
        return '<span class="text-muted">-</span>';
    }
    
    const lat = latitude.toFixed(6);
    return `<span class="text-primary" style="font-family: monospace; font-size: 11px;">${lat}</span>`;
}

function formatarLongitude(longitude) {
    if (!longitude || typeof longitude !== 'number' || longitude === 0) {
        return '<span class="text-muted">-</span>';
    }
    
    const lng = longitude.toFixed(6);
    return `<span class="text-success" style="font-family: monospace; font-size: 11px;">${lng}</span>`;
}

// ==================== FORMATAÇÃO DE OUTROS CAMPOS ====================
function formatarTelefone(telefone) {
    if (!telefone || telefone === 'Telefone não encontrado') {
        return '<span class="text-muted">Não encontrado</span>';
    }
    return `<a href="tel:${telefone}" class="text-success" style="text-decoration: none; font-weight: 500;">📱 ${telefone}</a>`;
}

function formatarSite(site) {
    if (!site || site === 'Site não encontrado') {
        return '<span class="text-muted">-</span>';
    }
    return `<a href="${site}" target="_blank" class="text-primary" style="text-decoration: none; font-size: 12px;">🌐 Visitar</a>`;
}

function formatarAvaliacao(avaliacao) {
    if (!avaliacao || avaliacao === 'Sem avaliação') {
        return '<span class="text-muted">-</span>';
    }
    
    // Extrair número da avaliação se existir
    const match = avaliacao.match(/(\d+[,\.]\d+)/);
    if (match) {
        const nota = parseFloat(match[0].replace(',', '.'));
        const stars = '⭐'.repeat(Math.round(nota));
        return `<span class="text-warning" title="${avaliacao}">${stars} ${nota}</span>`;
    }
    
    return `<span class="text-info" style="font-size: 12px;">${avaliacao}</span>`;
}

// ==================== EXIBIÇÃO DE RESULTADOS COM COORDENADAS SEPARADAS ====================
function displayMapsResults(data) {
    const tbody = document.getElementById('mapsTableBody');
    const titleElement = document.getElementById('mapsResultsTitle');
    
    if (!tbody || !titleElement) {
        console.error('❌ Elementos da tabela não encontrados no HTML');
        return;
    }
    
    console.log('📋 Exibindo resultados na tabela...');
    
    titleElement.textContent = `${data.total} estabelecimentos encontrados para "${data.termo}"`;
    
    // Limpar tabela anterior
    tbody.innerHTML = '';
    
    // Contadores para estatísticas
    let telefonesEncontrados = 0;
    let coordenadasEncontradas = 0;
    let sitesEncontrados = 0;
    
    // Preencher tabela com resultados
    data.resultados.forEach(item => {
        // Contar estatísticas
        if (item.telefone !== 'Telefone não encontrado') {
            telefonesEncontrados++;
        }
        if (item.site !== 'Site não encontrado') {
            sitesEncontrados++;
        }
        // ✅ VERIFICAR COORDENADAS VÁLIDAS
        if (item.latitude && item.longitude && 
            typeof item.latitude === 'number' && typeof item.longitude === 'number' &&
            item.latitude !== 0 && item.longitude !== 0) {
            coordenadasEncontradas++;
        }

        const row = tbody.insertRow();
        row.innerHTML = `
            <td style="text-align: center; font-weight: 600; color: #053B49;">${item.indice}</td>
            <td style="font-weight: 500; color: #053B49; max-width: 200px; overflow: hidden; text-overflow: ellipsis;">
                ${item.nome || 'Nome não encontrado'}
            </td>
            <td style="font-size: 12px; color: #666; max-width: 250px; overflow: hidden; text-overflow: ellipsis;">
                ${item.endereco || 'Endereço não encontrado'}
            </td>
            <td style="text-align: center;">
                ${formatarTelefone(item.telefone)}
            </td>
            <td style="text-align: center;">
                ${formatarLatitude(item.latitude)}
            </td>
            <td style="text-align: center;">
                ${formatarLongitude(item.longitude)}
            </td>
            <td style="text-align: center;">
                ${formatarSite(item.site)}
            </td>
            <td style="text-align: center; font-size: 12px;">
                ${formatarAvaliacao(item.avaliacao)}
            </td>
            <td style="font-size: 12px; color: #666; max-width: 120px; overflow: hidden; text-overflow: ellipsis;">
                ${item.categoria || 'Categoria não encontrada'}
            </td>
            <td style="text-align: center;">
                <div class="btn-group btn-group-sm" style="gap: 4px;">
                    <button class="btn btn-outline-primary btn-sm" onclick="addToFunnel('${item.nome.replace(/'/g, "\\'")}', '${item.telefone}')" style="font-size: 11px; padding: 2px 8px;">
                        <i class="bi bi-plus"></i> Add
                    </button>
                    <a href="${item.link}" target="_blank" class="btn btn-outline-secondary btn-sm" style="font-size: 11px; padding: 2px 8px;">
                        <i class="bi bi-geo-alt"></i> Ver
                    </a>
                </div>
            </td>
        `;
    });
    
    // ✅ EXIBIR ESTATÍSTICAS DETALHADAS COM COORDENADAS
    exibirEstatisticasDetalhadas(data.total, telefonesEncontrados, coordenadasEncontradas, sitesEncontrados);
    
    // ✅ MARCAR FERRAMENTA COMO USADA APÓS PRIMEIRO SUCESSO
    if (window.signupSystem && data.resultados && data.resultados.length > 0) {
        window.signupSystem.markToolAsUsed();
        console.log('🎯 Ferramenta marcada como utilizada');
    }

    // ✅ ATIVAR PROTEÇÃO APÓS EXIBIR RESULTADOS
    setTimeout(() => {
        setupMapsProtection();
    }, 100);
    
    console.log('✅ Resultados exibidos com sucesso');
    console.log(`📞 Telefones encontrados: ${telefonesEncontrados}/${data.total}`);
    console.log(`📍 Coordenadas encontradas: ${coordenadasEncontradas}/${data.total}`);
    console.log(`🌐 Sites encontrados: ${sitesEncontrados}/${data.total}`);
}

// ==================== ESTATÍSTICAS DETALHADAS ====================
function exibirEstatisticasDetalhadas(total, telefones, coordenadas, sites) {
    // Verificar se existe um elemento para estatísticas
    let statsElement = document.getElementById('mapsStatistics');
    
    // Se não existir, criar
    if (!statsElement) {
        const resultsSection = document.getElementById('searchResults');
        if (resultsSection) {
            statsElement = document.createElement('div');
            statsElement.id = 'mapsStatistics';
            statsElement.style.cssText = `
                margin: 20px 0;
                padding: 15px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 10px;
                display: flex;
                justify-content: space-around;
                flex-wrap: wrap;
                gap: 15px;
                color: white;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            `;
            resultsSection.insertBefore(statsElement, resultsSection.firstChild);
        }
    }

    // Calcular percentuais
    const percentualTelefones = total > 0 ? ((telefones / total) * 100).toFixed(1) : 0;
    const percentualCoordenadas = total > 0 ? ((coordenadas / total) * 100).toFixed(1) : 0;
    const percentualSites = total > 0 ? ((sites / total) * 100).toFixed(1) : 0;

    // Atualizar conteúdo
    if (statsElement) {
        statsElement.innerHTML = `
            <div style="text-align: center; color: white;">
                <div style="font-size: 28px; font-weight: 700;">${total}</div>
                <div style="font-size: 12px; opacity: 0.9;">Estabelecimentos</div>
            </div>
            <div style="text-align: center; color: white;">
                <div style="font-size: 28px; font-weight: 700; color: #28a745;">${telefones}</div>
                <div style="font-size: 12px; opacity: 0.9;">📱 Telefones (${percentualTelefones}%)</div>
            </div>
            <div style="text-align: center; color: white;">
                <div style="font-size: 28px; font-weight: 700; color: #ffc107;">${coordenadas}</div>
                <div style="font-size: 12px; opacity: 0.9;">📍 Coordenadas (${percentualCoordenadas}%)</div>
            </div>
            <div style="text-align: center; color: white;">
                <div style="font-size: 28px; font-weight: 700; color: #17a2b8;">${sites}</div>
                <div style="font-size: 12px; opacity: 0.9;">🌐 Sites (${percentualSites}%)</div>
            </div>
        `;
    }
}

// ==================== FUNÇÃO DE EXPORTAÇÃO COM COORDENADAS SEPARADAS ====================
function exportarCSV() {
    console.log('📄 Tentativa de exportação CSV');
    
    // Verificar permissão ANTES de executar
    if (!checkMapsPermission()) {
        console.log('❌ Exportação CSV bloqueada - usuário precisa se cadastrar');
        return false;
    }
    
    if (!currentMapsData || currentMapsData.length === 0) {
        alert('Nenhum dado para exportar');
        return;
    }

    try {
        // ✅ CSV COM COLUNAS SEPARADAS DE LATITUDE E LONGITUDE
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Nome,Endereço,Telefone,Latitude,Longitude,Site,Avaliação,Categoria,Link Maps\n"
            + currentMapsData.map(item => 
                `"${item.nome || ''}","${item.endereco || ''}","${item.telefone || ''}","${item.latitude || ''}","${item.longitude || ''}","${item.site || ''}","${item.avaliacao || ''}","${item.categoria || ''}","${item.link || ''}"`
            ).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `estabelecimentos_com_coordenadas_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ CSV exportado com coordenadas separadas');
        
        // Mostrar notificação de sucesso
        if (typeof showSuccess === 'function') {
            showSuccess('CSV exportado com sucesso!');
        } else {
            alert('CSV exportado com sucesso!');
        }
        
    } catch (error) {
        console.error('❌ Erro ao exportar CSV:', error);
        alert('Erro ao exportar arquivo CSV');
    }
}

// ==================== FUNÇÃO PARA ADICIONAR AO FUNIL ====================
function addToFunnel(nome, telefone) {
    console.log('➕ Tentativa de adicionar ao funil:', nome, telefone);
    
    // Verificar permissão ANTES de executar
    if (!checkMapsPermission()) {
        console.log('❌ Adicionar ao funil bloqueado - usuário precisa se cadastrar');
        return false;
    }
    
    // Aqui você pode implementar a lógica para adicionar ao funil/CRM
    // Por enquanto, apenas log
    console.log(`✅ Adicionando ao funil: ${nome} - ${telefone}`);
    
    if (typeof showSuccess === 'function') {
        showSuccess(`${nome} adicionado ao funil!`);
    } else {
        alert(`${nome} adicionado ao funil!`);
    }
}

// ==================== FUNÇÃO PARA MOSTRAR MENSAGENS DE SUCESSO ====================
function showSuccess(message) {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 500;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// ==================== CSS DINÂMICO PARA ANIMAÇÕES ====================
function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// ==================== INICIALIZAÇÃO DE ESTILOS ====================
document.addEventListener('DOMContentLoaded', function() {
    addAnimationStyles();
});

// ==================== LOGS DE DEBUG ====================
console.log('🗺️ Maps Integration v5.0 carregado');
console.log('📍 Funcionalidades ativas:');
console.log(' - ✅ Latitude e Longitude em colunas separadas');
console.log(' - ✅ Formatação com 6 casas decimais');
console.log(' - ✅ Validação de coordenadas');
console.log(' - ✅ Estatísticas detalhadas');
console.log(' - ✅ Exportação CSV com coordenadas');
console.log(' - ✅ Sistema de proteção integrado');
console.log(' - ✅ Animações e notificações');
