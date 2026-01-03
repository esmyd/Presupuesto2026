let allData = {
    deudas: [],
    entradas: [],
    salidas: [],
    planificacion_mensual: {},
    avance_real_mensual: {},
    metas: [],
    bitacora: []
};
let bitacoraFiltro = '';
let bitacoraFiltroUsuario = '';
let mesActual = 'enero';

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', function() {
    loadAllData();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    document.getElementById('form-deuda').addEventListener('submit', handleDeudaSubmit);
    document.getElementById('form-entrada').addEventListener('submit', handleEntradaSubmit);
    document.getElementById('form-salida').addEventListener('submit', handleSalidaSubmit);
    document.getElementById('form-meta').addEventListener('submit', handleMetaSubmit);
    document.getElementById('form-progreso-meta').addEventListener('submit', handleProgresoMetaSubmit);
    const formPlanificacion = document.getElementById('form-planificacion');
    if (formPlanificacion) {
        formPlanificacion.addEventListener('submit', handlePlanificacionSubmit);
    }
    const formDeudaPago = document.getElementById('form-deuda-pago');
    if (formDeudaPago) {
        formDeudaPago.addEventListener('submit', handleDeudaPagoSubmit);
    }
    const formAvanceReal = document.getElementById('form-avance-real');
    if (formAvanceReal) {
        formAvanceReal.addEventListener('submit', handleAvanceRealSubmit);
    }
}

// Cargar todos los datos
async function loadAllData() {
    try {
        const response = await fetch('api.php?action=get_all');
        allData = await response.json();
        
        // Migrar formato antiguo de deudas (enero -> montos_mensuales)
        if (allData.deudas) {
            allData.deudas.forEach(deuda => {
                if (deuda.enero !== undefined && (!deuda.montos_mensuales || !deuda.montos_mensuales.enero)) {
                    if (!deuda.montos_mensuales) {
                        deuda.montos_mensuales = {};
                    }
                    deuda.montos_mensuales.enero = parseFloat(deuda.enero || 0);
                }
            });
        }
        
        // Migrar formato antiguo de montos_enero a planificacion_mensual
        if (allData.montos_enero && !allData.planificacion_mensual) {
            allData.planificacion_mensual = {
                enero: allData.montos_enero
            };
        }
        
        renderAll();
    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}

// Renderizar todo
function renderAll() {
    renderDeudas();
    renderEntradas();
    renderSalidas();
        renderPlanificacionMensual();
        renderAvanceReal();
        renderComparacion();
        renderMetas();
        renderBitacora();
        renderReportes();
        updateSummary();
    }

// Variables para gráficos
let chartIngresosGastos = null;
let chartAhorros = null;
let chartGastos = null;
let chartMetas = null;

// Actualizar resumen
function updateSummary() {
    const totalIngresos = allData.entradas.reduce((sum, e) => sum + parseFloat(e.sueldo || 0), 0);
    const totalGastos = allData.salidas.reduce((sum, s) => sum + parseFloat(s.monto || 0), 0);
    const totalDeudas = allData.deudas.reduce((sum, d) => sum + parseFloat(d.monto || 0), 0);
    // Calcular ahorros acumulados de todos los meses
    let totalAhorros = 0;
    if (allData.planificacion_mensual) {
        Object.values(allData.planificacion_mensual).forEach(mes => {
            Object.values(mes).forEach(persona => {
                totalAhorros += parseFloat(persona.ahorros || 0);
            });
        });
    }
    const balance = totalIngresos - totalGastos - totalDeudas;
    
    // Calcular progreso de metas
    const totalMeta = allData.metas.reduce((sum, m) => sum + parseFloat(m.monto_meta || 0), 0);
    const totalActual = allData.metas.reduce((sum, m) => sum + parseFloat(m.monto_actual || 0), 0);
    const progresoPorcentaje = totalMeta > 0 ? ((totalActual / totalMeta) * 100).toFixed(1) : 0;
    
    document.getElementById('total-ingresos').textContent = formatCurrency(totalIngresos);
    document.getElementById('total-gastos').textContent = formatCurrency(totalGastos);
    document.getElementById('total-deudas').textContent = formatCurrency(totalDeudas);
    document.getElementById('balance-disponible').textContent = formatCurrency(balance);
    document.getElementById('total-ahorros').textContent = formatCurrency(totalAhorros);
    document.getElementById('progreso-metas').textContent = progresoPorcentaje + '%';
}

// Formatear moneda
function formatCurrency(value) {
    return '$' + parseFloat(value).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ========== DEUDAS ==========
function renderDeudas() {
    const tbody = document.getElementById('tbody-deudas');
    tbody.innerHTML = '';
    
    let total = 0;
    let totalComprometido = 0;
    let totalPagado = 0;
    
    allData.deudas.forEach(deuda => {
        total += parseFloat(deuda.monto || 0);
        
        // Obtener monto comprometido del mes actual
        let montoComprometido = 0;
        if (deuda.montos_comprometidos && deuda.montos_comprometidos[mesActual]) {
            montoComprometido = parseFloat(deuda.montos_comprometidos[mesActual] || 0);
        }
        // Migración: usar montos_mensuales como comprometido si no existe
        else if (deuda.montos_mensuales && deuda.montos_mensuales[mesActual]) {
            montoComprometido = parseFloat(deuda.montos_mensuales[mesActual] || 0);
        } else if (deuda.enero && mesActual === 'enero') {
            montoComprometido = parseFloat(deuda.enero || 0);
        }
        totalComprometido += montoComprometido;
        
        // Obtener monto pagado del mes actual
        let montoPagado = 0;
        if (deuda.montos_pagados && deuda.montos_pagados[mesActual]) {
            montoPagado = parseFloat(deuda.montos_pagados[mesActual] || 0);
        }
        // Migración: usar montos_mensuales como pagado si no existe montos_pagados
        else if (deuda.montos_mensuales && deuda.montos_mensuales[mesActual] && !deuda.montos_pagados) {
            montoPagado = parseFloat(deuda.montos_mensuales[mesActual] || 0);
        } else if (deuda.enero && mesActual === 'enero' && !deuda.montos_pagados) {
            montoPagado = parseFloat(deuda.enero || 0);
        }
        totalPagado += montoPagado;
        
        // Calcular total pagado en todos los meses (para calcular restante)
        let totalPagadoTodosMeses = 0;
        if (deuda.montos_pagados) {
            Object.values(deuda.montos_pagados).forEach(monto => {
                totalPagadoTodosMeses += parseFloat(monto || 0);
            });
        } else if (deuda.montos_mensuales) {
            // Migración temporal
            Object.values(deuda.montos_mensuales).forEach(monto => {
                totalPagadoTodosMeses += parseFloat(monto || 0);
            });
        } else if (deuda.enero) {
            totalPagadoTodosMeses = parseFloat(deuda.enero || 0);
        }
        
        const restante = parseFloat(deuda.monto || 0) - totalPagadoTodosMeses;
        
        // Indicador visual si hay diferencia entre comprometido y pagado
        let diferenciaClass = '';
        let diferenciaIcon = '';
        if (montoComprometido > 0 && montoPagado !== montoComprometido) {
            if (montoPagado < montoComprometido) {
                diferenciaClass = 'style="color: var(--warning-color);"';
                diferenciaIcon = ' ⚠️';
            } else if (montoPagado > montoComprometido) {
                diferenciaClass = 'style="color: var(--secondary-color);"';
                diferenciaIcon = ' ✅';
            }
        }
        
        const row = `
            <tr>
                <td>${deuda.descripcion}</td>
                <td>${formatCurrency(deuda.monto)}</td>
                <td>${deuda.quien}</td>
                <td>
                    ${formatCurrency(montoComprometido)}
                    <small style="color: #7f8c8d; font-size: 0.85em;">(Planificado)</small>
                </td>
                <td ${diferenciaClass}>
                    ${formatCurrency(montoPagado)}${diferenciaIcon}
                    <button class="btn btn-update" style="margin-left: 5px; padding: 3px 8px; font-size: 0.75em;" onclick="registrarPagoDeuda(${deuda.id}, '${mesActual}')" title="Registrar pago real">💰</button>
                </td>
                <td>${formatCurrency(restante)}</td>
                <td>
                    <button class="btn btn-edit" onclick="editDeuda(${deuda.id})">Editar</button>
                    <button class="btn btn-danger" onclick="deleteDeuda(${deuda.id})">Eliminar</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
    
    document.getElementById('deuda-total-monto').textContent = formatCurrency(total);
}

function openDeudaModal(deuda = null) {
    const modal = document.getElementById('modal-deuda');
    const form = document.getElementById('form-deuda');
    const title = document.getElementById('modal-deuda-title');
    
    if (deuda) {
        title.textContent = 'Editar Deuda';
        document.getElementById('deuda-id').value = deuda.id;
        document.getElementById('deuda-descripcion').value = deuda.descripcion;
        document.getElementById('deuda-monto').value = deuda.monto;
        document.getElementById('deuda-quien').value = deuda.quien;
        document.getElementById('deuda-enero').value = deuda.enero;
    } else {
        title.textContent = 'Agregar Deuda';
        form.reset();
        document.getElementById('deuda-id').value = '';
    }
    modal.style.display = 'block';
}

async function handleDeudaSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('deuda-id').value;
    const deuda = {
        descripcion: document.getElementById('deuda-descripcion').value,
        monto: document.getElementById('deuda-monto').value,
        quien: document.getElementById('deuda-quien').value,
        enero: document.getElementById('deuda-enero').value
    };
    
    try {
        if (id) {
            deuda.id = parseInt(id);
            await fetch('api.php?action=update_deuda', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(deuda)
            });
        } else {
            await fetch('api.php?action=add_deuda', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(deuda)
            });
        }
        closeModal('modal-deuda');
        loadAllData();
    } catch (error) {
        console.error('Error guardando deuda:', error);
        alert('Error al guardar la deuda');
    }
}

function editDeuda(id) {
    const deuda = allData.deudas.find(d => d.id === id);
    if (deuda) openDeudaModal(deuda);
}

async function deleteDeuda(id) {
    if (!confirm('¿Está seguro de eliminar esta deuda?')) return;
    
    try {
        await fetch(`api.php?action=delete_deuda&id=${id}`, { method: 'DELETE' });
        loadAllData();
    } catch (error) {
        console.error('Error eliminando deuda:', error);
        alert('Error al eliminar la deuda');
    }
}

// ========== ENTRADAS ==========
function renderEntradas() {
    const tbody = document.getElementById('tbody-entradas');
    tbody.innerHTML = '';
    
    let total = 0;
    allData.entradas.forEach(entrada => {
        total += parseFloat(entrada.sueldo || 0);
        const row = `
            <tr>
                <td>${formatCurrency(entrada.sueldo)}</td>
                <td>${entrada.quien}</td>
                <td>
                    <button class="btn btn-edit" onclick="editEntrada(${entrada.id})">Editar</button>
                    <button class="btn btn-danger" onclick="deleteEntrada(${entrada.id})">Eliminar</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
    
    document.getElementById('entrada-total').textContent = formatCurrency(total);
}

function openEntradaModal(entrada = null) {
    const modal = document.getElementById('modal-entrada');
    const form = document.getElementById('form-entrada');
    const title = document.getElementById('modal-entrada-title');
    
    if (entrada) {
        title.textContent = 'Editar Ingreso';
        document.getElementById('entrada-id').value = entrada.id;
        document.getElementById('entrada-sueldo').value = entrada.sueldo;
        document.getElementById('entrada-quien').value = entrada.quien;
    } else {
        title.textContent = 'Agregar Ingreso';
        form.reset();
        document.getElementById('entrada-id').value = '';
    }
    modal.style.display = 'block';
}

async function handleEntradaSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('entrada-id').value;
    const entrada = {
        sueldo: document.getElementById('entrada-sueldo').value,
        quien: document.getElementById('entrada-quien').value
    };
    
    try {
        if (id) {
            entrada.id = parseInt(id);
            await fetch('api.php?action=update_entrada', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entrada)
            });
        } else {
            await fetch('api.php?action=add_entrada', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entrada)
            });
        }
        closeModal('modal-entrada');
        loadAllData();
    } catch (error) {
        console.error('Error guardando entrada:', error);
        alert('Error al guardar el ingreso');
    }
}

function editEntrada(id) {
    const entrada = allData.entradas.find(e => e.id === id);
    if (entrada) openEntradaModal(entrada);
}

async function deleteEntrada(id) {
    if (!confirm('¿Está seguro de eliminar este ingreso?')) return;
    
    try {
        await fetch(`api.php?action=delete_entrada&id=${id}`, { method: 'DELETE' });
        loadAllData();
    } catch (error) {
        console.error('Error eliminando entrada:', error);
        alert('Error al eliminar el ingreso');
    }
}

// ========== SALIDAS ==========
function renderSalidas() {
    const tbodyComunes = document.getElementById('tbody-salidas-comunes');
    const tbodyOtros = document.getElementById('tbody-salidas-otros');
    tbodyComunes.innerHTML = '';
    tbodyOtros.innerHTML = '';
    
    // Ordenar gastos por fecha (más recientes primero)
    const salidasOrdenadas = [...allData.salidas].sort((a, b) => {
        const fechaA = a.fecha ? new Date(a.fecha) : new Date(0);
        const fechaB = b.fecha ? new Date(b.fecha) : new Date(0);
        return fechaB - fechaA; // Orden descendente
    });
    
    let totalComunes = 0;
    let totalOtros = 0;
    
    salidasOrdenadas.forEach(salida => {
        const tipo = salida.tipo || 'otro';
        const monto = parseFloat(salida.monto || 0);
        
        // Formatear fecha
        let fechaFormateada = '-';
        if (salida.fecha) {
            const fecha = new Date(salida.fecha);
            fechaFormateada = fecha.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
        
        // Observación truncada si es muy larga
        const observacion = salida.observacion || '';
        const observacionCorta = observacion.length > 50 ? observacion.substring(0, 50) + '...' : observacion;
        const observacionTooltip = observacion ? `title="${observacion}"` : '';
        
        const row = `
            <tr>
                <td>${fechaFormateada}</td>
                <td>${salida.descripcion}</td>
                <td>${formatCurrency(salida.monto)}</td>
                <td ${observacionTooltip} style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: ${observacion ? 'help' : 'default'}">
                    ${observacionCorta || '-'}
                </td>
                <td>
                    <button class="btn btn-edit" onclick="editSalida(${salida.id})">Editar</button>
                    <button class="btn btn-danger" onclick="deleteSalida(${salida.id})">Eliminar</button>
                </td>
            </tr>
        `;
        
        if (tipo === 'comun') {
            tbodyComunes.innerHTML += row;
            totalComunes += monto;
        } else {
            tbodyOtros.innerHTML += row;
            totalOtros += monto;
        }
    });
    
    document.getElementById('salida-total-comunes').textContent = formatCurrency(totalComunes);
    document.getElementById('salida-total-otros').textContent = formatCurrency(totalOtros);
}

function openSalidaModal(salida = null) {
    const modal = document.getElementById('modal-salida');
    const form = document.getElementById('form-salida');
    const title = document.getElementById('modal-salida-title');
    
    // Establecer fecha por defecto a hoy
    const hoy = new Date().toISOString().split('T')[0];
    
    if (salida) {
        title.textContent = 'Editar Gasto';
        document.getElementById('salida-id').value = salida.id;
        document.getElementById('salida-descripcion').value = salida.descripcion;
        document.getElementById('salida-monto').value = salida.monto;
        document.getElementById('salida-tipo').value = salida.tipo || 'otro';
        document.getElementById('salida-fecha').value = salida.fecha ? salida.fecha.split('T')[0] : hoy;
        document.getElementById('salida-observacion').value = salida.observacion || '';
    } else {
        title.textContent = 'Agregar Gasto';
        form.reset();
        document.getElementById('salida-id').value = '';
        document.getElementById('salida-tipo').value = 'otro';
        document.getElementById('salida-fecha').value = hoy;
        document.getElementById('salida-observacion').value = '';
    }
    modal.style.display = 'block';
}

async function handleSalidaSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('salida-id').value;
    const salida = {
        descripcion: document.getElementById('salida-descripcion').value,
        monto: document.getElementById('salida-monto').value,
        tipo: document.getElementById('salida-tipo').value,
        fecha: document.getElementById('salida-fecha').value,
        observacion: document.getElementById('salida-observacion').value
    };
    
    try {
        if (id) {
            salida.id = parseInt(id);
            await fetch('api.php?action=update_salida', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(salida)
            });
        } else {
            await fetch('api.php?action=add_salida', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(salida)
            });
        }
        closeModal('modal-salida');
        loadAllData();
    } catch (error) {
        console.error('Error guardando salida:', error);
        alert('Error al guardar el gasto');
    }
}

function editSalida(id) {
    const salida = allData.salidas.find(s => s.id === id);
    if (salida) openSalidaModal(salida);
}

async function deleteSalida(id) {
    if (!confirm('¿Está seguro de eliminar este gasto?')) return;
    
    try {
        await fetch(`api.php?action=delete_salida&id=${id}`, { method: 'DELETE' });
        loadAllData();
    } catch (error) {
        console.error('Error eliminando salida:', error);
        alert('Error al eliminar el gasto');
    }
}

// ========== PLANIFICACIÓN MENSUAL ==========
function renderPlanificacionMensual() {
    const container = document.getElementById('planificacion-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    const personas = ['GABRIELA', 'GREGORIO'];
    const mesData = allData.planificacion_mensual[mesActual] || {};
    
    // Calcular total de deudas comprometidas del mes
    let totalDeudasMes = 0;
    allData.deudas.forEach(deuda => {
        if (deuda.montos_comprometidos && deuda.montos_comprometidos[mesActual]) {
            totalDeudasMes += parseFloat(deuda.montos_comprometidos[mesActual] || 0);
        } else if (deuda.montos_mensuales && deuda.montos_mensuales[mesActual]) {
            totalDeudasMes += parseFloat(deuda.montos_mensuales[mesActual] || 0);
        } else if (deuda.enero && mesActual === 'enero') {
            totalDeudasMes += parseFloat(deuda.enero || 0);
        }
    });
    document.getElementById('total-deudas-mes').textContent = formatCurrency(totalDeudasMes);
    
    // Calcular total deudas pagadas del mes
    let totalDeudasPagadas = 0;
    allData.deudas.forEach(deuda => {
        if (deuda.montos_pagados && deuda.montos_pagados[mesActual]) {
            totalDeudasPagadas += parseFloat(deuda.montos_pagados[mesActual] || 0);
        }
    });
    const elTotalPagadas = document.getElementById('total-deudas-pagadas-mes');
    if (elTotalPagadas) {
        elTotalPagadas.textContent = formatCurrency(totalDeudasPagadas);
    }
    
    // Calcular ahorros acumulados hasta el mes actual (desde avances reales si existen)
    let ahorrosAcumulados = 0;
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const mesIndex = meses.indexOf(mesActual);
    for (let i = 0; i <= mesIndex; i++) {
        const mes = meses[i];
        // Priorizar avances reales si existen
        if (allData.avance_real_mensual && allData.avance_real_mensual[mes]) {
            Object.values(allData.avance_real_mensual[mes]).forEach(persona => {
                ahorrosAcumulados += parseFloat(persona.ahorros || 0);
            });
        } else if (allData.planificacion_mensual[mes]) {
            Object.values(allData.planificacion_mensual[mes]).forEach(persona => {
                ahorrosAcumulados += parseFloat(persona.ahorros || 0);
            });
        }
    }
    const elAhorros = document.getElementById('ahorros-acumulados');
    if (elAhorros) {
        elAhorros.textContent = formatCurrency(ahorrosAcumulados);
    }
    
    personas.forEach(persona => {
        const data = mesData[persona] || {
            monto_casa_deudas: totalDeudasMes, // Auto-calcular según deudas del mes
            mama: 0,
            hijos: 0,
            ahorros: 0,
            aportes_metas: {}
        };
        
        // Si no tiene monto_casa_deudas, calcularlo desde comprometidos
        if (!data.monto_casa_deudas || data.monto_casa_deudas === 0) {
            let deudasPersona = 0;
            allData.deudas.forEach(deuda => {
                if (deuda.quien === persona) {
                    if (deuda.montos_comprometidos && deuda.montos_comprometidos[mesActual]) {
                        deudasPersona += parseFloat(deuda.montos_comprometidos[mesActual] || 0);
                    } else if (deuda.montos_mensuales && deuda.montos_mensuales[mesActual]) {
                        deudasPersona += parseFloat(deuda.montos_mensuales[mesActual] || 0);
                    } else if (deuda.enero && mesActual === 'enero') {
                        deudasPersona += parseFloat(deuda.enero || 0);
                    }
                }
            });
            data.monto_casa_deudas = deudasPersona;
        }
        
        const total = parseFloat(data.monto_casa_deudas || 0) + 
                     parseFloat(data.mama || 0) + 
                     parseFloat(data.hijos || 0) + 
                     parseFloat(data.ahorros || 0);
        
        // Calcular total de aportes a metas
        let totalAportesMetas = 0;
        if (data.aportes_metas) {
            Object.values(data.aportes_metas).forEach(monto => {
                totalAportesMetas += parseFloat(monto || 0);
            });
        }
        
        const card = `
            <div class="enero-card">
                <h3>${persona} - PLANIFICADO</h3>
                <div class="enero-item">
                    <span>Casa + Deudas ${capitalize(mesActual)} (Plan):</span>
                    <span>${formatCurrency(data.monto_casa_deudas || 0)}</span>
                </div>
                <div class="enero-item">
                    <span>Mamá:</span>
                    <span>${formatCurrency(data.mama || 0)}</span>
                </div>
                <div class="enero-item">
                    <span>Hijos:</span>
                    <span>${formatCurrency(data.hijos || 0)}</span>
                </div>
                <div class="enero-item">
                    <span>Ahorros:</span>
                    <span>${formatCurrency(data.ahorros || 0)}</span>
                </div>
                <div class="enero-item">
                    <span>Aportes a Metas:</span>
                    <span>${formatCurrency(totalAportesMetas)}</span>
                </div>
                <div class="enero-item">
                    <span>TOTAL:</span>
                    <span>${formatCurrency(total + totalAportesMetas)}</span>
                </div>
                <button class="btn btn-primary" style="margin-top: 15px; width: 100%;" onclick="openPlanificacionModal('${mesActual}', '${persona}')">Editar</button>
            </div>
        `;
        container.innerHTML += card;
    });
    
    // Total de ahorros del mes
    let ahorrosMes = 0;
    Object.values(mesData).forEach(persona => {
        ahorrosMes += parseFloat(persona.ahorros || 0);
    });
    
    const totalCard = `
        <div class="enero-card">
            <h3>Resumen ${capitalize(mesActual)}</h3>
            <div class="enero-item">
                <span>Ahorros del Mes:</span>
                <span>${formatCurrency(ahorrosMes)}</span>
            </div>
            <div class="enero-item" style="font-size: 1.2em; color: var(--secondary-color); margin-top: 10px;">
                <span>Ahorros Acumulados:</span>
                <span>${formatCurrency(ahorrosAcumulados)}</span>
            </div>
        </div>
    `;
    container.innerHTML += totalCard;
}

function cambiarMes() {
    const select = document.getElementById('mes-select');
    if (select) {
        mesActual = select.value;
        renderDeudas();
        renderPlanificacionMensual();
        renderAvanceReal();
        renderComparacion();
        
        // Actualizar total deudas pagadas del mes
        let totalDeudasPagadas = 0;
        allData.deudas.forEach(deuda => {
            if (deuda.montos_pagados && deuda.montos_pagados[mesActual]) {
                totalDeudasPagadas += parseFloat(deuda.montos_pagados[mesActual] || 0);
            }
        });
        const elTotalPagadas = document.getElementById('total-deudas-pagadas-mes');
        if (elTotalPagadas) {
            elTotalPagadas.textContent = formatCurrency(totalDeudasPagadas);
        }
    }
}

function mostrarSeccionPlanificacion(seccion, buttonElement = null) {
    // Ocultar todas las secciones
    document.querySelectorAll('.seccion-planificacion').forEach(sec => {
        sec.classList.remove('active');
    });
    
    // Ocultar todos los botones
    document.querySelectorAll('.plan-tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar sección seleccionada
    const seccionEl = document.getElementById(`seccion-${seccion}`);
    if (seccionEl) {
        seccionEl.classList.add('active');
    }
    
    // Activar botón correspondiente
    if (buttonElement) {
        buttonElement.classList.add('active');
    } else {
        // Buscar el botón por texto o posición
        const buttons = document.querySelectorAll('.plan-tab-button');
        buttons.forEach((btn, index) => {
            if ((seccion === 'plan' && index === 0) || 
                (seccion === 'real' && index === 1) || 
                (seccion === 'comparacion' && index === 2)) {
                btn.classList.add('active');
            }
        });
    }
    
    // Renderizar según la sección
    if (seccion === 'real') {
        renderAvanceReal();
    } else if (seccion === 'comparacion') {
        renderComparacion();
    }
}

// Renderizar Avance Real
function renderAvanceReal() {
    const container = document.getElementById('avance-real-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    const personas = ['GABRIELA', 'GREGORIO'];
    const avanceData = (allData.avance_real_mensual && allData.avance_real_mensual[mesActual]) ? allData.avance_real_mensual[mesActual] : {};
    
    personas.forEach(persona => {
        const data = avanceData[persona] || {
            monto_casa_deudas: 0,
            mama: 0,
            hijos: 0,
            ahorros: 0,
            aportes_metas: {}
        };
        
        // Calcular deudas realmente pagadas por esta persona
        let deudasPagadasPersona = 0;
        allData.deudas.forEach(deuda => {
            if (deuda.quien === persona) {
                if (deuda.montos_pagados && deuda.montos_pagados[mesActual]) {
                    deudasPagadasPersona += parseFloat(deuda.montos_pagados[mesActual] || 0);
                }
            }
        });
        
        // Si no tiene registro, usar las deudas pagadas
        if (!data.monto_casa_deudas || data.monto_casa_deudas === 0) {
            data.monto_casa_deudas = deudasPagadasPersona;
        }
        
        const total = parseFloat(data.monto_casa_deudas || 0) + 
                     parseFloat(data.mama || 0) + 
                     parseFloat(data.hijos || 0) + 
                     parseFloat(data.ahorros || 0);
        
        let totalAportesMetas = 0;
        if (data.aportes_metas) {
            Object.values(data.aportes_metas).forEach(monto => {
                totalAportesMetas += parseFloat(monto || 0);
            });
        }
        
        const card = `
            <div class="enero-card" style="border-left-color: var(--secondary-color);">
                <h3>${persona} - REAL</h3>
                <div class="enero-item">
                    <span>Deudas Pagadas:</span>
                    <span>${formatCurrency(data.monto_casa_deudas || deudasPagadasPersona)}</span>
                </div>
                <div class="enero-item">
                    <span>Mamá:</span>
                    <span>${formatCurrency(data.mama || 0)}</span>
                </div>
                <div class="enero-item">
                    <span>Hijos:</span>
                    <span>${formatCurrency(data.hijos || 0)}</span>
                </div>
                <div class="enero-item">
                    <span>Ahorros:</span>
                    <span>${formatCurrency(data.ahorros || 0)}</span>
                </div>
                <div class="enero-item">
                    <span>Aportes a Metas:</span>
                    <span>${formatCurrency(totalAportesMetas)}</span>
                </div>
                <div class="enero-item">
                    <span>TOTAL:</span>
                    <span>${formatCurrency(total + totalAportesMetas)}</span>
                </div>
                <button class="btn btn-update" style="margin-top: 15px; width: 100%;" onclick="openAvanceRealModal('${mesActual}', '${persona}')">Registrar Avance</button>
            </div>
        `;
        container.innerHTML += card;
    });
}

// Renderizar Comparación
function renderComparacion() {
    const container = document.getElementById('comparacion-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    const personas = ['GABRIELA', 'GREGORIO'];
    const planData = allData.planificacion_mensual[mesActual] || {};
    const avanceData = (allData.avance_real_mensual && allData.avance_real_mensual[mesActual]) ? allData.avance_real_mensual[mesActual] : {};
    
    personas.forEach(persona => {
        const plan = planData[persona] || {
            monto_casa_deudas: 0,
            mama: 0,
            hijos: 0,
            ahorros: 0,
            aportes_metas: {}
        };
        
        const real = avanceData[persona] || {
            monto_casa_deudas: 0,
            mama: 0,
            hijos: 0,
            ahorros: 0,
            aportes_metas: {}
        };
        
        // Calcular deudas realmente pagadas
        let deudasPagadasPersona = 0;
        allData.deudas.forEach(deuda => {
            if (deuda.quien === persona) {
                if (deuda.montos_pagados && deuda.montos_pagados[mesActual]) {
                    deudasPagadasPersona += parseFloat(deuda.montos_pagados[mesActual] || 0);
                }
            }
        });
        
        const deudasReal = real.monto_casa_deudas || deudasPagadasPersona;
        const deudasPlan = plan.monto_casa_deudas || 0;
        
        const card = `
            <div class="enero-card" style="border-left-color: var(--warning-color);">
                <h3>${persona}</h3>
                
                <div class="comparacion-item">
                    <span><strong>Deudas:</strong></span>
                    <div>
                        <span class="comparacion-planificado">Plan: ${formatCurrency(deudasPlan)}</span> | 
                        <span class="comparacion-real">Real: ${formatCurrency(deudasReal)}</span>
                        <span class="comparacion-diferencia ${deudasReal >= deudasPlan ? 'positivo' : 'negativo'}">
                            (${formatCurrency(deudasReal - deudasPlan)})
                        </span>
                    </div>
                </div>
                
                <div class="comparacion-item">
                    <span><strong>Mamá:</strong></span>
                    <div>
                        <span class="comparacion-planificado">Plan: ${formatCurrency(plan.mama || 0)}</span> | 
                        <span class="comparacion-real">Real: ${formatCurrency(real.mama || 0)}</span>
                        <span class="comparacion-diferencia ${(real.mama || 0) >= (plan.mama || 0) ? 'positivo' : 'negativo'}">
                            (${formatCurrency((real.mama || 0) - (plan.mama || 0))})
                        </span>
                    </div>
                </div>
                
                <div class="comparacion-item">
                    <span><strong>Hijos:</strong></span>
                    <div>
                        <span class="comparacion-planificado">Plan: ${formatCurrency(plan.hijos || 0)}</span> | 
                        <span class="comparacion-real">Real: ${formatCurrency(real.hijos || 0)}</span>
                        <span class="comparacion-diferencia ${(real.hijos || 0) >= (plan.hijos || 0) ? 'positivo' : 'negativo'}">
                            (${formatCurrency((real.hijos || 0) - (plan.hijos || 0))})
                        </span>
                    </div>
                </div>
                
                <div class="comparacion-item">
                    <span><strong>Ahorros:</strong></span>
                    <div>
                        <span class="comparacion-planificado">Plan: ${formatCurrency(plan.ahorros || 0)}</span> | 
                        <span class="comparacion-real">Real: ${formatCurrency(real.ahorros || 0)}</span>
                        <span class="comparacion-diferencia ${(real.ahorros || 0) >= (plan.ahorros || 0) ? 'positivo' : 'negativo'}">
                            (${formatCurrency((real.ahorros || 0) - (plan.ahorros || 0))})
                        </span>
                    </div>
                </div>
                
                <button class="btn btn-update" style="margin-top: 15px; width: 100%;" onclick="openAvanceRealModal('${mesActual}', '${persona}')">Actualizar Avance</button>
            </div>
        `;
        container.innerHTML += card;
    });
}

function openAvanceRealModal(mes, persona) {
    const modal = document.getElementById('modal-avance-real');
    const avanceData = (allData.avance_real_mensual && allData.avance_real_mensual[mes]) ? allData.avance_real_mensual[mes] : {};
    const data = avanceData[persona] || {
        monto_casa_deudas: 0,
        mama: 0,
        hijos: 0,
        ahorros: 0,
        aportes_metas: {}
    };
    
    // Calcular deudas realmente pagadas
    let deudasPagadasPersona = 0;
    allData.deudas.forEach(deuda => {
        if (deuda.quien === persona) {
            if (deuda.montos_pagados && deuda.montos_pagados[mes]) {
                deudasPagadasPersona += parseFloat(deuda.montos_pagados[mes] || 0);
            }
        }
    });
    
    document.getElementById('avance-real-mes').value = mes;
    document.getElementById('avance-real-quien').value = persona;
    document.getElementById('avance-real-monto-casa-deudas').value = data.monto_casa_deudas || deudasPagadasPersona;
    document.getElementById('avance-real-mama').value = data.mama || 0;
    document.getElementById('avance-real-hijos').value = data.hijos || 0;
    document.getElementById('avance-real-ahorros').value = data.ahorros || 0;
    document.getElementById('modal-avance-real-title').textContent = `Avance Real ${capitalize(mes)} - ${persona}`;
    
    // Renderizar aportes reales a metas
    const container = document.getElementById('aportes-reales-metas-container');
    container.innerHTML = '';
    allData.metas.forEach(meta => {
        const aporte = data.aportes_metas && data.aportes_metas[meta.id] ? data.aportes_metas[meta.id] : 0;
        const input = document.createElement('div');
        input.className = 'form-group';
        input.style.marginBottom = '10px';
        input.innerHTML = `
            <label style="font-size: 0.9em;">${meta.descripcion}:</label>
            <input type="number" step="0.01" id="aporte-real-meta-${meta.id}" value="${aporte}" class="aporte-meta-input" style="width: 100%; padding: 8px;">
        `;
        container.appendChild(input);
    });
    
    modal.style.display = 'block';
}

async function handleAvanceRealSubmit(e) {
    e.preventDefault();
    const mes = document.getElementById('avance-real-mes').value;
    const quien = document.getElementById('avance-real-quien').value;
    
    // Recopilar aportes reales a metas
    const aportesMetas = {};
    allData.metas.forEach(meta => {
        const input = document.getElementById(`aporte-real-meta-${meta.id}`);
        if (input && parseFloat(input.value) > 0) {
            aportesMetas[meta.id] = parseFloat(input.value);
        }
    });
    
    const avance = {
        mes: mes,
        quien: quien,
        monto_casa_deudas: document.getElementById('avance-real-monto-casa-deudas').value,
        mama: document.getElementById('avance-real-mama').value,
        hijos: document.getElementById('avance-real-hijos').value,
        ahorros: document.getElementById('avance-real-ahorros').value,
        aportes_metas: aportesMetas
    };
    
    try {
        await fetch('api.php?action=update_avance_real', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(avance)
        });
        closeModal('modal-avance-real');
        loadAllData();
    } catch (error) {
        console.error('Error guardando avance real:', error);
        alert('Error al guardar el avance real');
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function openPlanificacionModal(mes, persona) {
    const modal = document.getElementById('modal-planificacion');
    const mesData = allData.planificacion_mensual[mes] || {};
    const data = mesData[persona] || {
        monto_casa_deudas: 0,
        mama: 0,
        hijos: 0,
        ahorros: 0,
        aportes_metas: {}
    };
    
    // Calcular deudas comprometidas del mes para esta persona
    let deudasPersona = 0;
    allData.deudas.forEach(deuda => {
        if (deuda.quien === persona) {
            if (deuda.montos_comprometidos && deuda.montos_comprometidos[mes]) {
                deudasPersona += parseFloat(deuda.montos_comprometidos[mes] || 0);
            } else if (deuda.montos_mensuales && deuda.montos_mensuales[mes]) {
                deudasPersona += parseFloat(deuda.montos_mensuales[mes] || 0);
            } else if (deuda.enero && mes === 'enero') {
                deudasPersona += parseFloat(deuda.enero || 0);
            }
        }
    });
    
    document.getElementById('planificacion-mes').value = mes;
    document.getElementById('planificacion-quien').value = persona;
    document.getElementById('planificacion-monto-casa-deudas').value = data.monto_casa_deudas || deudasPersona;
    document.getElementById('planificacion-mama').value = data.mama || 0;
    document.getElementById('planificacion-hijos').value = data.hijos || 0;
    document.getElementById('planificacion-ahorros').value = data.ahorros || 0;
    document.getElementById('modal-planificacion-title').textContent = `Planificación ${capitalize(mes)} - ${persona}`;
    
    // Renderizar aportes a metas
    const container = document.getElementById('aportes-metas-container');
    container.innerHTML = '';
    allData.metas.forEach(meta => {
        const aporte = data.aportes_metas && data.aportes_metas[meta.id] ? data.aportes_metas[meta.id] : 0;
        const input = document.createElement('div');
        input.className = 'form-group';
        input.style.marginBottom = '10px';
        input.innerHTML = `
            <label style="font-size: 0.9em;">${meta.descripcion}:</label>
            <input type="number" step="0.01" id="aporte-meta-${meta.id}" value="${aporte}" class="aporte-meta-input" style="width: 100%; padding: 8px;">
        `;
        container.appendChild(input);
    });
    
    modal.style.display = 'block';
}

async function handlePlanificacionSubmit(e) {
    e.preventDefault();
    const mes = document.getElementById('planificacion-mes').value;
    const quien = document.getElementById('planificacion-quien').value;
    
    // Recopilar aportes a metas
    const aportesMetas = {};
    allData.metas.forEach(meta => {
        const input = document.getElementById(`aporte-meta-${meta.id}`);
        if (input && parseFloat(input.value) > 0) {
            aportesMetas[meta.id] = parseFloat(input.value);
        }
    });
    
    const planificacion = {
        mes: mes,
        quien: quien,
        monto_casa_deudas: document.getElementById('planificacion-monto-casa-deudas').value,
        mama: document.getElementById('planificacion-mama').value,
        hijos: document.getElementById('planificacion-hijos').value,
        ahorros: document.getElementById('planificacion-ahorros').value,
        aportes_metas: aportesMetas
    };
    
    try {
        await fetch('api.php?action=update_planificacion_mensual', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(planificacion)
        });
        closeModal('modal-planificacion');
        loadAllData();
    } catch (error) {
        console.error('Error guardando planificación:', error);
        alert('Error al guardar la planificación mensual');
    }
}

function registrarPagoDeuda(deudaId, mes) {
    const deuda = allData.deudas.find(d => d.id === deudaId);
    if (!deuda) return;
    
    const modal = document.getElementById('modal-deuda-pago');
    document.getElementById('deuda-pago-id').value = deudaId;
    document.getElementById('deuda-pago-mes').value = mes;
    
    const inputDesc = document.getElementById('deuda-pago-descripcion-input');
    if (inputDesc) {
        inputDesc.value = deuda.descripcion;
    }
    
    const mesDisplay = document.getElementById('deuda-pago-mes-display');
    if (mesDisplay) {
        mesDisplay.value = capitalize(mes);
    }
    
    // Obtener monto comprometido
    let montoComprometido = 0;
    if (deuda.montos_comprometidos && deuda.montos_comprometidos[mes]) {
        montoComprometido = parseFloat(deuda.montos_comprometidos[mes] || 0);
    } else if (deuda.montos_mensuales && deuda.montos_mensuales[mes]) {
        montoComprometido = parseFloat(deuda.montos_mensuales[mes] || 0);
    } else if (deuda.enero && mes === 'enero') {
        montoComprometido = parseFloat(deuda.enero || 0);
    }
    
    document.getElementById('deuda-pago-comprometido').value = montoComprometido;
    
    // Obtener monto pagado actual
    let montoPagado = 0;
    if (deuda.montos_pagados && deuda.montos_pagados[mes]) {
        montoPagado = parseFloat(deuda.montos_pagados[mes] || 0);
    }
    
    document.getElementById('deuda-pago-monto').value = montoPagado;
    modal.style.display = 'block';
}

async function handleDeudaPagoSubmit(e) {
    e.preventDefault();
    const deudaId = parseInt(document.getElementById('deuda-pago-id').value);
    const mes = document.getElementById('deuda-pago-mes').value;
    const monto = parseFloat(document.getElementById('deuda-pago-monto').value);
    
    try {
        await fetch('api.php?action=registrar_pago_deuda', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: deudaId, mes: mes, monto: monto })
        });
        closeModal('modal-deuda-pago');
        loadAllData();
    } catch (error) {
        console.error('Error guardando pago:', error);
        alert('Error al guardar el pago');
    }
}

// ========== METAS ==========
function renderMetas() {
    const grid = document.getElementById('metas-grid');
    grid.innerHTML = '';
    
    // Calcular aportes acumulados de todos los meses
    const aportesAcumulados = {};
    if (allData.planificacion_mensual) {
        Object.values(allData.planificacion_mensual).forEach(mes => {
            Object.values(mes).forEach(persona => {
                if (persona.aportes_metas) {
                    Object.keys(persona.aportes_metas).forEach(metaId => {
                        if (!aportesAcumulados[metaId]) {
                            aportesAcumulados[metaId] = 0;
                        }
                        aportesAcumulados[metaId] += parseFloat(persona.aportes_metas[metaId] || 0);
                    });
                }
            });
        });
    }
    
    allData.metas.forEach(meta => {
        const aporteMes = aportesAcumulados[meta.id] || 0;
        const totalAcumulado = parseFloat(meta.monto_actual || 0) + aporteMes;
        const porcentaje = parseFloat(meta.monto_meta || 0) > 0 
            ? ((totalAcumulado / parseFloat(meta.monto_meta || 0)) * 100).toFixed(1)
            : 0;
        const restante = parseFloat(meta.monto_meta || 0) - totalAcumulado;
        
        const card = `
            <div class="meta-card">
                <h3>${meta.descripcion}</h3>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${Math.min(porcentaje, 100)}%">
                        ${porcentaje}%
                    </div>
                </div>
                <div class="meta-info">
                    <span>Meta: ${formatCurrency(meta.monto_meta)}</span>
                    <span>Manual: ${formatCurrency(meta.monto_actual)}</span>
                </div>
                <div class="meta-info">
                    <span>Aportes Planificados: ${formatCurrency(aporteMes)}</span>
                </div>
                <div class="meta-info">
                    <span><strong>Total Acumulado: ${formatCurrency(totalAcumulado)}</strong></span>
                    <span>Restante: ${formatCurrency(restante)}</span>
                </div>
                <div class="meta-actions">
                    <button class="btn btn-update" onclick="openProgresoMetaModal(${meta.id})">Actualizar Progreso</button>
                    <button class="btn btn-edit" onclick="editMeta(${meta.id})">Editar</button>
                    <button class="btn btn-danger" onclick="deleteMeta(${meta.id})">Eliminar</button>
                </div>
            </div>
        `;
        grid.innerHTML += card;
    });
}

function openMetaModal(meta = null) {
    const modal = document.getElementById('modal-meta');
    const form = document.getElementById('form-meta');
    const title = document.getElementById('modal-meta-title');
    
    if (meta) {
        title.textContent = 'Editar Meta';
        document.getElementById('meta-id').value = meta.id;
        document.getElementById('meta-descripcion').value = meta.descripcion;
        document.getElementById('meta-monto-meta').value = meta.monto_meta;
        document.getElementById('meta-monto-actual').value = meta.monto_actual;
    } else {
        title.textContent = 'Agregar Meta';
        form.reset();
        document.getElementById('meta-id').value = '';
        document.getElementById('meta-monto-actual').value = 0;
    }
    modal.style.display = 'block';
}

function openProgresoMetaModal(id) {
    const meta = allData.metas.find(m => m.id === id);
    if (!meta) return;
    
    const modal = document.getElementById('modal-progreso-meta');
    document.getElementById('progreso-meta-id').value = meta.id;
    document.getElementById('progreso-meta-descripcion').value = meta.descripcion;
    document.getElementById('progreso-meta-total').value = meta.monto_meta;
    document.getElementById('progreso-meta-actual').value = meta.monto_actual;
    
    modal.style.display = 'block';
}

async function handleMetaSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('meta-id').value;
    const meta = {
        descripcion: document.getElementById('meta-descripcion').value,
        monto_meta: document.getElementById('meta-monto-meta').value,
        monto_actual: document.getElementById('meta-monto-actual').value
    };
    
    try {
        if (id) {
            meta.id = parseInt(id);
            await fetch('api.php?action=update_meta', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(meta)
            });
        } else {
            await fetch('api.php?action=add_meta', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(meta)
            });
        }
        closeModal('modal-meta');
        loadAllData();
    } catch (error) {
        console.error('Error guardando meta:', error);
        alert('Error al guardar la meta');
    }
}

async function handleProgresoMetaSubmit(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('progreso-meta-id').value);
    const montoActual = parseFloat(document.getElementById('progreso-meta-actual').value);
    
    try {
        await fetch('api.php?action=update_progreso_meta', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, monto_actual: montoActual })
        });
        closeModal('modal-progreso-meta');
        loadAllData();
    } catch (error) {
        console.error('Error actualizando progreso:', error);
        alert('Error al actualizar el progreso');
    }
}

function editMeta(id) {
    const meta = allData.metas.find(m => m.id === id);
    if (meta) openMetaModal(meta);
}

async function deleteMeta(id) {
    if (!confirm('¿Está seguro de eliminar esta meta?')) return;
    
    try {
        await fetch(`api.php?action=delete_meta&id=${id}`, { method: 'DELETE' });
        loadAllData();
    } catch (error) {
        console.error('Error eliminando meta:', error);
        alert('Error al eliminar la meta');
    }
}

// ========== UTILIDADES ==========
function showTab(tabName) {
    // Ocultar todos los tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar tab seleccionado
    document.getElementById(`tab-${tabName}`).classList.add('active');
    event.target.classList.add('active');
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// ========== BITÁCORA ==========
function renderBitacora() {
    const container = document.getElementById('bitacora-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    let bitacora = allData.bitacora || [];
    
    // Filtrar si hay filtro activo por tipo
    if (bitacoraFiltro) {
        bitacora = bitacora.filter(b => b.tipo === bitacoraFiltro);
    }
    
    // Filtrar si hay filtro activo por usuario
    if (bitacoraFiltroUsuario) {
        bitacora = bitacora.filter(b => (b.usuario || 'Sistema') === bitacoraFiltroUsuario);
    }
    
    if (bitacora.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">No hay registros en la bitácora</p>';
        return;
    }
    
    bitacora.forEach(registro => {
        const item = document.createElement('div');
        item.className = 'bitacora-item';
        
        let valorAnteriorHTML = '';
        let valorNuevoHTML = '';
        
        if (registro.valor_anterior) {
            try {
                const valorAnterior = JSON.parse(registro.valor_anterior);
                let valorFormateado = '';
                
                // Formatear según el tipo
                if (registro.tipo === 'entrada' && valorAnterior.sueldo !== undefined) {
                    valorFormateado = `Sueldo: ${formatCurrency(valorAnterior.sueldo)} | Quien: ${valorAnterior.quien || 'N/A'}`;
                } else if (registro.tipo === 'deuda' && valorAnterior.monto !== undefined) {
                    valorFormateado = `Monto: ${formatCurrency(valorAnterior.monto)} | Enero: ${formatCurrency(valorAnterior.enero || 0)} | Quien: ${valorAnterior.quien || 'N/A'}`;
                } else if (registro.tipo === 'salida' && valorAnterior.monto !== undefined) {
                    valorFormateado = `Monto: ${formatCurrency(valorAnterior.monto)} | Tipo: ${valorAnterior.tipo || 'otro'}`;
                } else if (registro.tipo === 'meta') {
                    if (valorAnterior.monto_actual !== undefined) {
                        valorFormateado = `Progreso: ${formatCurrency(valorAnterior.monto_actual)}`;
                    } else {
                        valorFormateado = `Meta: ${formatCurrency(valorAnterior.monto_meta || 0)} | Progreso: ${formatCurrency(valorAnterior.monto_actual || 0)}`;
                    }
                } else {
                    valorFormateado = JSON.stringify(valorAnterior, null, 2);
                }
                
                valorAnteriorHTML = `<div class="bitacora-valor bitacora-valor-anterior"><strong>Anterior:</strong> ${valorFormateado}</div>`;
            } catch (e) {
                valorAnteriorHTML = `<div class="bitacora-valor bitacora-valor-anterior"><strong>Anterior:</strong> ${registro.valor_anterior}</div>`;
            }
        }
        
        if (registro.valor_nuevo) {
            try {
                const valorNuevo = JSON.parse(registro.valor_nuevo);
                let valorFormateado = '';
                
                // Formatear según el tipo
                if (registro.tipo === 'entrada' && valorNuevo.sueldo !== undefined) {
                    valorFormateado = `Sueldo: ${formatCurrency(valorNuevo.sueldo)} | Quien: ${valorNuevo.quien || 'N/A'}`;
                } else if (registro.tipo === 'deuda' && valorNuevo.monto !== undefined) {
                    valorFormateado = `Monto: ${formatCurrency(valorNuevo.monto)} | Enero: ${formatCurrency(valorNuevo.enero || 0)} | Quien: ${valorNuevo.quien || 'N/A'}`;
                } else if (registro.tipo === 'salida' && valorNuevo.monto !== undefined) {
                    valorFormateado = `Monto: ${formatCurrency(valorNuevo.monto)} | Tipo: ${valorNuevo.tipo || 'otro'}`;
                } else if (registro.tipo === 'meta') {
                    if (valorNuevo.monto_actual !== undefined && !valorNuevo.monto_meta) {
                        valorFormateado = `Progreso: ${formatCurrency(valorNuevo.monto_actual)}`;
                    } else {
                        valorFormateado = `Meta: ${formatCurrency(valorNuevo.monto_meta || 0)} | Progreso: ${formatCurrency(valorNuevo.monto_actual || 0)}`;
                    }
                } else {
                    valorFormateado = JSON.stringify(valorNuevo, null, 2);
                }
                
                valorNuevoHTML = `<div class="bitacora-valor bitacora-valor-nuevo"><strong>Nuevo:</strong> ${valorFormateado}</div>`;
            } catch (e) {
                valorNuevoHTML = `<div class="bitacora-valor bitacora-valor-nuevo"><strong>Nuevo:</strong> ${registro.valor_nuevo}</div>`;
            }
        }
        
        const valoresHTML = (valorAnteriorHTML || valorNuevoHTML) 
            ? `<div class="bitacora-valores">${valorAnteriorHTML}${valorNuevoHTML}</div>` 
            : '';
        
        const usuario = registro.usuario || 'Sistema';
        item.innerHTML = `
            <div class="bitacora-header">
                <div>
                    <div class="bitacora-fecha">${formatearFecha(registro.fecha)}</div>
                    <div style="display: flex; gap: 10px; align-items: center; margin-top: 5px;">
                        <span class="bitacora-tipo ${registro.tipo}">${registro.tipo}</span>
                        <span style="background: #4a90e2; color: white; padding: 3px 10px; border-radius: 12px; font-size: 0.8em; font-weight: 500;">👤 ${usuario}</span>
                    </div>
                </div>
                <span class="bitacora-accion">${registro.accion.toUpperCase()}</span>
            </div>
            <div class="bitacora-descripcion">${registro.descripcion}</div>
            ${valoresHTML}
        `;
        
        container.appendChild(item);
    });
}

function formatearFecha(fechaStr) {
    const fecha = new Date(fechaStr);
    const ahora = new Date();
    const diffMs = ahora - fecha;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    
    return fecha.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function filtrarBitacora(tipo, buttonElement = null) {
    bitacoraFiltro = tipo;
    
    // Actualizar botones activos de tipo (solo los que no tienen data-filtro="usuario")
    if (buttonElement) {
        // Desactivar todos los botones de tipo
        buttonElement.parentElement.querySelectorAll('.btn:not([data-filtro="usuario"])').forEach(btn => {
            btn.classList.remove('active');
        });
        // Activar el botón seleccionado
        buttonElement.classList.add('active');
    }
    
    renderBitacora();
}

function filtrarBitacoraUsuario(usuario, buttonElement = null) {
    bitacoraFiltroUsuario = usuario;
    
    // Actualizar botones activos de usuario
    if (buttonElement) {
        // Desactivar todos los botones de usuario
        buttonElement.parentElement.querySelectorAll('.btn[data-filtro="usuario"]').forEach(btn => {
            btn.classList.remove('active');
        });
        // Activar el botón seleccionado
        buttonElement.classList.add('active');
    }
    
    renderBitacora();
}

// ========== REPORTES ==========
function renderReportes() {
    if (!document.getElementById('tab-reportes')) return;
    
    calcularMetricasEjecutivas();
    renderGraficoIngresosGastos();
    renderGraficoAhorros();
    renderGraficoGastos();
    renderGraficoMetas();
    renderResumenMensual();
    renderEstadoDeudas();
}

function calcularMetricasEjecutivas() {
    // Ingresos totales
    const ingresosTotales = allData.entradas.reduce((sum, e) => sum + parseFloat(e.sueldo || 0), 0);
    
    // Gastos totales
    const gastosTotales = allData.salidas.reduce((sum, s) => sum + parseFloat(s.monto || 0), 0);
    
    // Deudas totales
    const deudasTotales = allData.deudas.reduce((sum, d) => sum + parseFloat(d.monto || 0), 0);
    
    // Deudas pagadas
    let deudasPagadas = 0;
    allData.deudas.forEach(deuda => {
        if (deuda.montos_pagados) {
            Object.values(deuda.montos_pagados).forEach(monto => {
                deudasPagadas += parseFloat(monto || 0);
            });
        } else if (deuda.montos_mensuales) {
            Object.values(deuda.montos_mensuales).forEach(monto => {
                deudasPagadas += parseFloat(monto || 0);
            });
        } else if (deuda.enero) {
            deudasPagadas += parseFloat(deuda.enero || 0);
        }
    });
    
    // Ahorros acumulados
    let ahorrosTotales = 0;
    if (allData.planificacion_mensual) {
        Object.values(allData.planificacion_mensual).forEach(mes => {
            Object.values(mes).forEach(persona => {
                ahorrosTotales += parseFloat(persona.ahorros || 0);
            });
        });
    }
    
    // Progreso metas
    const totalMeta = allData.metas.reduce((sum, m) => sum + parseFloat(m.monto_meta || 0), 0);
    const aportesAcumulados = {};
    if (allData.planificacion_mensual) {
        Object.values(allData.planificacion_mensual).forEach(mes => {
            Object.values(mes).forEach(persona => {
                if (persona.aportes_metas) {
                    Object.keys(persona.aportes_metas).forEach(metaId => {
                        if (!aportesAcumulados[metaId]) {
                            aportesAcumulados[metaId] = 0;
                        }
                        aportesAcumulados[metaId] += parseFloat(persona.aportes_metas[metaId] || 0);
                    });
                }
            });
        });
    }
    let totalActual = 0;
    allData.metas.forEach(meta => {
        totalActual += parseFloat(meta.monto_actual || 0) + (aportesAcumulados[meta.id] || 0);
    });
    const progresoPorcentaje = totalMeta > 0 ? ((totalActual / totalMeta) * 100).toFixed(1) : 0;
    
    // Actualizar UI
    document.getElementById('reporte-ingresos-totales').textContent = formatCurrency(ingresosTotales);
    document.getElementById('reporte-gastos-totales').textContent = formatCurrency(gastosTotales);
    document.getElementById('reporte-deudas-totales').textContent = formatCurrency(deudasTotales);
    document.getElementById('reporte-deudas-pagadas').textContent = formatCurrency(deudasPagadas);
    document.getElementById('reporte-ahorros').textContent = formatCurrency(ahorrosTotales);
    document.getElementById('reporte-progreso-metas').textContent = progresoPorcentaje + '%';
}

function renderGraficoIngresosGastos() {
    const ctx = document.getElementById('chart-ingresos-gastos');
    if (!ctx) return;
    
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const mesesKeys = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    const ingresosMensuales = [];
    const gastosMensuales = [];
    
    mesesKeys.forEach(mesKey => {
        // Ingresos mensuales (mismo para todos los meses)
        const ingresos = allData.entradas.reduce((sum, e) => sum + parseFloat(e.sueldo || 0), 0);
        ingresosMensuales.push(ingresos);
        
        // Gastos mensuales (recurrentes más deudas pagadas del mes)
        let gastos = allData.salidas.reduce((sum, s) => sum + parseFloat(s.monto || 0), 0);
        let deudasMes = 0;
        allData.deudas.forEach(deuda => {
            if (deuda.montos_pagados && deuda.montos_pagados[mesKey]) {
                deudasMes += parseFloat(deuda.montos_pagados[mesKey] || 0);
            }
        });
        gastosMensuales.push(gastos + deudasMes);
    });
    
    if (chartIngresosGastos) {
        chartIngresosGastos.destroy();
    }
    
    chartIngresosGastos = new Chart(ctx, {
        type: 'line',
        data: {
            labels: meses,
            datasets: [
                {
                    label: 'Ingresos',
                    data: ingresosMensuales,
                    borderColor: '#50c878',
                    backgroundColor: 'rgba(80, 200, 120, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Gastos',
                    data: gastosMensuales,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function renderGraficoAhorros() {
    const ctx = document.getElementById('chart-ahorros');
    if (!ctx) return;
    
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const mesesKeys = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    const ahorrosAcumulados = [];
    let acumulado = 0;
    
    mesesKeys.forEach(mesKey => {
        if (allData.planificacion_mensual[mesKey]) {
            Object.values(allData.planificacion_mensual[mesKey]).forEach(persona => {
                acumulado += parseFloat(persona.ahorros || 0);
            });
        }
        ahorrosAcumulados.push(acumulado);
    });
    
    if (chartAhorros) {
        chartAhorros.destroy();
    }
    
    chartAhorros = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: meses,
            datasets: [{
                label: 'Ahorros Acumulados',
                data: ahorrosAcumulados,
                backgroundColor: 'rgba(74, 144, 226, 0.8)',
                borderColor: '#4a90e2',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function renderGraficoGastos() {
    const ctx = document.getElementById('chart-gastos');
    if (!ctx) return;
    
    const gastosComunes = allData.salidas.filter(s => s.tipo === 'comun');
    const labels = gastosComunes.map(g => g.descripcion);
    const valores = gastosComunes.map(g => parseFloat(g.monto || 0));
    
    if (chartGastos) {
        chartGastos.destroy();
    }
    
    chartGastos = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: valores,
                backgroundColor: [
                    '#4a90e2',
                    '#50c878',
                    '#f39c12',
                    '#e74c3c',
                    '#9b59b6',
                    '#1abc9c',
                    '#e67e22',
                    '#3498db'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.parsed);
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderGraficoMetas() {
    const ctx = document.getElementById('chart-metas');
    if (!ctx) return;
    
    // Calcular aportes acumulados
    const aportesAcumulados = {};
    if (allData.planificacion_mensual) {
        Object.values(allData.planificacion_mensual).forEach(mes => {
            Object.values(mes).forEach(persona => {
                if (persona.aportes_metas) {
                    Object.keys(persona.aportes_metas).forEach(metaId => {
                        if (!aportesAcumulados[metaId]) {
                            aportesAcumulados[metaId] = 0;
                        }
                        aportesAcumulados[metaId] += parseFloat(persona.aportes_metas[metaId] || 0);
                    });
                }
            });
        });
    }
    
    const labels = allData.metas.map(m => m.descripcion);
    const metas = allData.metas.map(m => parseFloat(m.monto_meta || 0));
    const actuales = allData.metas.map(m => {
        const aporte = aportesAcumulados[m.id] || 0;
        return parseFloat(m.monto_actual || 0) + aporte;
    });
    
    if (chartMetas) {
        chartMetas.destroy();
    }
    
    chartMetas = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Meta',
                    data: metas,
                    backgroundColor: 'rgba(189, 195, 199, 0.6)',
                    borderColor: '#bdc3c7',
                    borderWidth: 2
                },
                {
                    label: 'Progreso',
                    data: actuales,
                    backgroundColor: 'rgba(80, 200, 120, 0.8)',
                    borderColor: '#50c878',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function renderResumenMensual() {
    const tbody = document.getElementById('tbody-resumen-mensual');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const mesesKeys = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    const ingresosMensual = allData.entradas.reduce((sum, e) => sum + parseFloat(e.sueldo || 0), 0);
    const gastosRecurrentes = allData.salidas.reduce((sum, s) => sum + parseFloat(s.monto || 0), 0);
    
    mesesKeys.forEach((mesKey, index) => {
        let deudasComprometidas = 0;
        let deudasPagadas = 0;
        let ahorros = 0;
        
        allData.deudas.forEach(deuda => {
            if (deuda.montos_comprometidos && deuda.montos_comprometidos[mesKey]) {
                deudasComprometidas += parseFloat(deuda.montos_comprometidos[mesKey] || 0);
            }
            if (deuda.montos_pagados && deuda.montos_pagados[mesKey]) {
                deudasPagadas += parseFloat(deuda.montos_pagados[mesKey] || 0);
            }
        });
        
        if (allData.planificacion_mensual[mesKey]) {
            Object.values(allData.planificacion_mensual[mesKey]).forEach(persona => {
                ahorros += parseFloat(persona.ahorros || 0);
            });
        }
        
        const gastos = gastosRecurrentes + deudasPagadas;
        const balance = ingresosMensual - gastos - ahorros;
        
        const row = `
            <tr>
                <td><strong>${meses[index]}</strong></td>
                <td>${formatCurrency(ingresosMensual)}</td>
                <td>${formatCurrency(gastos)}</td>
                <td>${formatCurrency(deudasComprometidas)}</td>
                <td>${formatCurrency(deudasPagadas)}</td>
                <td>${formatCurrency(ahorros)}</td>
                <td style="color: ${balance >= 0 ? 'var(--secondary-color)' : 'var(--danger-color)'}; font-weight: bold;">
                    ${formatCurrency(balance)}
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function renderEstadoDeudas() {
    const tbody = document.getElementById('tbody-estado-deudas');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    allData.deudas.forEach(deuda => {
        const total = parseFloat(deuda.monto || 0);
        let pagado = 0;
        
        if (deuda.montos_pagados) {
            Object.values(deuda.montos_pagados).forEach(monto => {
                pagado += parseFloat(monto || 0);
            });
        } else if (deuda.montos_mensuales) {
            Object.values(deuda.montos_mensuales).forEach(monto => {
                pagado += parseFloat(monto || 0);
            });
        } else if (deuda.enero) {
            pagado = parseFloat(deuda.enero || 0);
        }
        
        const restante = total - pagado;
        const porcentaje = total > 0 ? ((pagado / total) * 100).toFixed(1) : 0;
        
        const row = `
            <tr>
                <td>${deuda.descripcion}</td>
                <td>${formatCurrency(total)}</td>
                <td>${formatCurrency(pagado)}</td>
                <td>${formatCurrency(restante)}</td>
                <td>
                    <div style="background: #ecf0f1; border-radius: 10px; height: 20px; position: relative;">
                        <div style="background: ${porcentaje == 100 ? 'var(--secondary-color)' : 'var(--primary-color)'}; width: ${porcentaje}%; height: 100%; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.75em; font-weight: bold;">
                            ${porcentaje}%
                        </div>
                    </div>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// Alias para funciones globales
window.openDeudaModal = openDeudaModal;
window.openEntradaModal = openEntradaModal;
window.openSalidaModal = openSalidaModal;
window.openMetaModal = openMetaModal;
window.openPlanificacionModal = openPlanificacionModal;
window.openAvanceRealModal = openAvanceRealModal;
window.registrarPagoDeuda = registrarPagoDeuda;
window.cambiarMes = cambiarMes;
window.mostrarSeccionPlanificacion = mostrarSeccionPlanificacion;
window.editDeuda = editDeuda;
window.deleteDeuda = deleteDeuda;
window.editEntrada = editEntrada;
window.deleteEntrada = deleteEntrada;
window.editSalida = editSalida;
window.deleteSalida = deleteSalida;
window.editMeta = editMeta;
window.deleteMeta = deleteMeta;
window.openProgresoMetaModal = openProgresoMetaModal;
window.showTab = showTab;
window.openModal = openModal;
window.closeModal = closeModal;
window.filtrarBitacora = function(tipo, buttonElement) {
    return filtrarBitacora(tipo, buttonElement);
};

window.filtrarBitacoraUsuario = function(usuario, buttonElement) {
    return filtrarBitacoraUsuario(usuario, buttonElement);
};

// Renderizar reportes cuando se cambia al tab
const originalShowTab = window.showTab;
window.showTab = function(tabName) {
    originalShowTab.call(this, tabName);
    if (tabName === 'reportes') {
        renderReportes();
    }
};

