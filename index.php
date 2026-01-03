<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Presupuesto 2026</title>
    <link rel="stylesheet" href="styles.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
</head>
<body>
    <div class="container">
        <header>
            <h1>💰 Presupuesto 2026</h1>
            <p class="subtitle">Gestión de Deudas, Gastos y Metas</p>
        </header>

        <!-- Resumen General -->
        <section class="summary-section">
            <h2>📊 Resumen General</h2>
            <div class="summary-cards">
                <div class="card income-card">
                    <h3>Total Ingresos</h3>
                    <p class="amount" id="total-ingresos">$0</p>
                </div>
                <div class="card expense-card">
                    <h3>Total Gastos</h3>
                    <p class="amount" id="total-gastos">$0</p>
                </div>
                <div class="card debt-card">
                    <h3>Total Deudas</h3>
                    <p class="amount" id="total-deudas">$0</p>
                </div>
                <div class="card balance-card">
                    <h3>Balance Disponible</h3>
                    <p class="amount" id="balance-disponible">$0</p>
                </div>
                <div class="card savings-card">
                    <h3>Total Ahorros</h3>
                    <p class="amount" id="total-ahorros">$0</p>
                </div>
                <div class="card goals-card">
                    <h3>Progreso Metas</h3>
                    <p class="amount" id="progreso-metas">0%</p>
                </div>
            </div>
        </section>

        <!-- Tabs Navigation -->
        <nav class="tabs">
            <button class="tab-button active" onclick="showTab('salidas')">💸 Gastos</button>
            <button class="tab-button" onclick="showTab('deudas')">💳 Deudas</button>
            <button class="tab-button" onclick="showTab('entradas')">💵 Ingresos</button>
            <button class="tab-button" onclick="showTab('planificacion')">📅 Planificación Mensual</button>
            <button class="tab-button" onclick="showTab('metas')">🎯 Metas</button>
            <button class="tab-button" onclick="showTab('bitacora')">📋 Bitácora</button>
            <button class="tab-button" onclick="showTab('reportes')">📊 Reportes</button>
        </nav>

        <!-- Tab: Gastos -->
        <div id="tab-salidas" class="tab-content active">
            <div class="section-header">
                <h2>💸 Gastos</h2>
                <button class="btn btn-primary" onclick="openModal('modal-salida')">+ Agregar Gasto</button>
            </div>
            
            <!-- Gastos Comunes -->
            <div class="gastos-section">
                <h3 class="section-subtitle">💰 Gastos Comunes</h3>
                <div class="table-container">
                    <table id="table-salidas-comunes">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Descripción</th>
                                <th>Monto</th>
                                <th>Observación</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="tbody-salidas-comunes"></tbody>
                        <tfoot>
                            <tr>
                                <td colspan="2"><strong>TOTAL</strong></td>
                                <td id="salida-total-comunes">$0</td>
                                <td colspan="2"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <!-- Otros Gastos -->
            <div class="gastos-section">
                <h3 class="section-subtitle">💳 Otros Gastos</h3>
                <div class="table-container">
                    <table id="table-salidas-otros">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Descripción</th>
                                <th>Monto</th>
                                <th>Observación</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="tbody-salidas-otros"></tbody>
                        <tfoot>
                            <tr>
                                <td colspan="2"><strong>TOTAL</strong></td>
                                <td id="salida-total-otros">$0</td>
                                <td colspan="2"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>

        <!-- Tab: Deudas -->
        <div id="tab-deudas" class="tab-content">
            <div class="section-header">
                <h2>💳 Deudas Totales</h2>
                <button class="btn btn-primary" onclick="openModal('modal-deuda')">+ Agregar Deuda</button>
            </div>
            <div class="table-container">
                <table id="table-deudas">
                    <thead>
                        <tr>
                            <th>Descripción</th>
                            <th>Monto Total</th>
                            <th>¿Quién?</th>
                            <th>Comprometido (Mes)</th>
                            <th>Pagado</th>
                            <th>Restante</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tbody-deudas"></tbody>
                    <tfoot>
                        <tr>
                            <td><strong>TOTAL</strong></td>
                            <td id="deuda-total-monto">$0</td>
                            <td colspan="5"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

        <!-- Tab: Entradas -->
        <div id="tab-entradas" class="tab-content">
            <div class="section-header">
                <h2>💵 Ingresos (Sueldos)</h2>
                <button class="btn btn-primary" onclick="openModal('modal-entrada')">+ Agregar Ingreso</button>
            </div>
            <div class="table-container">
                <table id="table-entradas">
                    <thead>
                        <tr>
                            <th>Sueldo</th>
                            <th>¿Quién?</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tbody-entradas"></tbody>
                    <tfoot>
                        <tr>
                            <td><strong>TOTAL</strong></td>
                            <td id="entrada-total">$0</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

        <!-- Tab: Planificación Mensual -->
        <div id="tab-planificacion" class="tab-content">
            <div class="section-header">
                <h2>📅 Planificación Mensual 2026</h2>
                <div class="mes-selector">
                    <label for="mes-select">Mes: </label>
                    <select id="mes-select" onchange="cambiarMes()">
                        <option value="enero">Enero</option>
                        <option value="febrero">Febrero</option>
                        <option value="marzo">Marzo</option>
                        <option value="abril">Abril</option>
                        <option value="mayo">Mayo</option>
                        <option value="junio">Junio</option>
                        <option value="julio">Julio</option>
                        <option value="agosto">Agosto</option>
                        <option value="septiembre">Septiembre</option>
                        <option value="octubre">Octubre</option>
                        <option value="noviembre">Noviembre</option>
                        <option value="diciembre">Diciembre</option>
                    </select>
                </div>
            </div>
            <div class="planificacion-tabs">
                <button class="plan-tab-button active" onclick="mostrarSeccionPlanificacion('plan', this)">📋 Planificado</button>
                <button class="plan-tab-button" onclick="mostrarSeccionPlanificacion('real', this)">✅ Avance Real</button>
                <button class="plan-tab-button" onclick="mostrarSeccionPlanificacion('comparacion', this)">📊 Comparación</button>
            </div>
            
            <div class="planificacion-info">
                <div class="info-card">
                    <strong>Total Deudas Planificadas:</strong> <span id="total-deudas-mes">$0</span>
                </div>
                <div class="info-card">
                    <strong>Total Deudas Pagadas:</strong> <span id="total-deudas-pagadas-mes">$0</span>
                </div>
                <div class="info-card">
                    <strong>Ahorros Acumulados:</strong> <span id="ahorros-acumulados">$0</span>
                </div>
            </div>
            
            <!-- Sección Planificado -->
            <div id="seccion-plan" class="seccion-planificacion active">
                <h3 style="margin-bottom: 20px; color: var(--primary-color);">📋 Planificación para el Mes</h3>
                <div class="enero-container" id="planificacion-container"></div>
            </div>
            
            <!-- Sección Avance Real -->
            <div id="seccion-real" class="seccion-planificacion">
                <h3 style="margin-bottom: 20px; color: var(--secondary-color);">✅ Lo que Realmente Hicimos</h3>
                <div class="enero-container" id="avance-real-container"></div>
            </div>
            
            <!-- Sección Comparación -->
            <div id="seccion-comparacion" class="seccion-planificacion">
                <h3 style="margin-bottom: 20px; color: var(--warning-color);">📊 Planificado vs Real</h3>
                <div class="enero-container" id="comparacion-container"></div>
            </div>
        </div>

        <!-- Tab: Metas -->
        <div id="tab-metas" class="tab-content">
            <div class="section-header">
                <h2>🎯 Metas 2026</h2>
                <button class="btn btn-primary" onclick="openModal('modal-meta')">+ Agregar Meta</button>
            </div>
            <div class="metas-grid" id="metas-grid"></div>
        </div>

        <!-- Tab: Bitácora -->
        <div id="tab-bitacora" class="tab-content">
            <div class="section-header">
                <h2>📋 Bitácora de Cambios</h2>
                <div class="filter-buttons">
                    <button class="btn btn-secondary active" onclick="filtrarBitacora('', this)">Todos</button>
                    <button class="btn btn-secondary" onclick="filtrarBitacora('entrada', this)">Ingresos</button>
                    <button class="btn btn-secondary" onclick="filtrarBitacora('deuda', this)">Deudas</button>
                    <button class="btn btn-secondary" onclick="filtrarBitacora('salida', this)">Gastos</button>
                    <button class="btn btn-secondary" onclick="filtrarBitacora('meta', this)">Metas</button>
                </div>
            </div>
            <div class="bitacora-container" id="bitacora-container"></div>
        </div>

        <!-- Tab: Reportes -->
        <div id="tab-reportes" class="tab-content">
            <div class="section-header">
                <h2>📊 Reportes y Métricas</h2>
            </div>
            
            <!-- Resumen Ejecutivo -->
            <div class="reportes-section">
                <h3>📈 Resumen Ejecutivo</h3>
                <div class="metricas-grid">
                    <div class="metrica-card">
                        <div class="metrica-label">Ingresos Totales</div>
                        <div class="metrica-valor" id="reporte-ingresos-totales">$0</div>
                    </div>
                    <div class="metrica-card">
                        <div class="metrica-label">Gastos Totales</div>
                        <div class="metrica-valor" id="reporte-gastos-totales">$0</div>
                    </div>
                    <div class="metrica-card">
                        <div class="metrica-label">Deudas Totales</div>
                        <div class="metrica-valor" id="reporte-deudas-totales">$0</div>
                    </div>
                    <div class="metrica-card">
                        <div class="metrica-label">Deudas Pagadas</div>
                        <div class="metrica-valor" id="reporte-deudas-pagadas">$0</div>
                    </div>
                    <div class="metrica-card">
                        <div class="metrica-label">Ahorros Acumulados</div>
                        <div class="metrica-valor" id="reporte-ahorros">$0</div>
                    </div>
                    <div class="metrica-card">
                        <div class="metrica-label">Progreso Metas</div>
                        <div class="metrica-valor" id="reporte-progreso-metas">0%</div>
                    </div>
                </div>
            </div>

            <!-- Gráfico Ingresos vs Gastos Mensuales -->
            <div class="reportes-section">
                <h3>💰 Evolución Mensual: Ingresos vs Gastos</h3>
                <div class="chart-container">
                    <canvas id="chart-ingresos-gastos"></canvas>
                </div>
            </div>

            <!-- Gráfico Progreso de Ahorros -->
            <div class="reportes-section">
                <h3>💵 Progreso de Ahorros Acumulados</h3>
                <div class="chart-container">
                    <canvas id="chart-ahorros"></canvas>
                </div>
            </div>

            <!-- Gráfico Distribución de Gastos -->
            <div class="reportes-section">
                <h3>💸 Distribución de Gastos Comunes</h3>
                <div class="chart-container">
                    <canvas id="chart-gastos"></canvas>
                </div>
            </div>

            <!-- Gráfico Progreso de Metas -->
            <div class="reportes-section">
                <h3>🎯 Progreso de Metas</h3>
                <div class="chart-container">
                    <canvas id="chart-metas"></canvas>
                </div>
            </div>

            <!-- Tabla Resumen por Mes -->
            <div class="reportes-section">
                <h3>📅 Resumen por Mes</h3>
                <div class="table-container">
                    <table id="tabla-resumen-mensual">
                        <thead>
                            <tr>
                                <th>Mes</th>
                                <th>Ingresos</th>
                                <th>Gastos</th>
                                <th>Deudas Comprometidas</th>
                                <th>Deudas Pagadas</th>
                                <th>Ahorros</th>
                                <th>Balance</th>
                            </tr>
                        </thead>
                        <tbody id="tbody-resumen-mensual"></tbody>
                    </table>
                </div>
            </div>

            <!-- Estado de Deudas -->
            <div class="reportes-section">
                <h3>💳 Estado de Deudas</h3>
                <div class="table-container">
                    <table id="tabla-estado-deudas">
                        <thead>
                            <tr>
                                <th>Deuda</th>
                                <th>Total</th>
                                <th>Pagado</th>
                                <th>Restante</th>
                                <th>% Completado</th>
                            </tr>
                        </thead>
                        <tbody id="tbody-estado-deudas"></tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Modals -->
    <!-- Modal Deuda -->
    <div id="modal-deuda" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeModal('modal-deuda')">&times;</span>
            <h2 id="modal-deuda-title">Agregar Deuda</h2>
            <form id="form-deuda">
                <input type="hidden" id="deuda-id">
                <div class="form-group">
                    <label>Descripción:</label>
                    <input type="text" id="deuda-descripcion" required>
                </div>
                <div class="form-group">
                    <label>Monto Total:</label>
                    <input type="number" step="0.01" id="deuda-monto" required>
                </div>
                <div class="form-group">
                    <label>¿Quién?:</label>
                    <select id="deuda-quien" required>
                        <option value="GABRIELA">GABRIELA</option>
                        <option value="GREGORIO">GREGORIO</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Monto por Mes (Opcional - puedes editarlo después en planificación mensual):</label>
                    <input type="number" step="0.01" id="deuda-enero" value="0" placeholder="Dejar en 0 para planificar después">
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Guardar</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal('modal-deuda')">Cancelar</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal Entrada -->
    <div id="modal-entrada" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeModal('modal-entrada')">&times;</span>
            <h2 id="modal-entrada-title">Agregar Ingreso</h2>
            <form id="form-entrada">
                <input type="hidden" id="entrada-id">
                <div class="form-group">
                    <label>Sueldo:</label>
                    <input type="number" step="0.01" id="entrada-sueldo" required>
                </div>
                <div class="form-group">
                    <label>¿Quién?:</label>
                    <select id="entrada-quien" required>
                        <option value="GABRIELA">GABRIELA</option>
                        <option value="GREGORIO">GREGORIO</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Guardar</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal('modal-entrada')">Cancelar</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal Salida -->
    <div id="modal-salida" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeModal('modal-salida')">&times;</span>
            <h2 id="modal-salida-title">Agregar Gasto</h2>
            <form id="form-salida">
                <input type="hidden" id="salida-id">
                <div class="form-group">
                    <label>Fecha:</label>
                    <input type="date" id="salida-fecha" required>
                </div>
                <div class="form-group">
                    <label>Descripción:</label>
                    <input type="text" id="salida-descripcion" required>
                </div>
                <div class="form-group">
                    <label>Monto:</label>
                    <input type="number" step="0.01" id="salida-monto" required>
                </div>
                <div class="form-group">
                    <label>Tipo:</label>
                    <select id="salida-tipo" required>
                        <option value="comun">Gasto Común</option>
                        <option value="otro">Otro Gasto</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Observación:</label>
                    <textarea id="salida-observacion" rows="3" placeholder="Notas adicionales sobre este gasto..."></textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Guardar</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal('modal-salida')">Cancelar</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal Meta -->
    <div id="modal-meta" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeModal('modal-meta')">&times;</span>
            <h2 id="modal-meta-title">Agregar Meta</h2>
            <form id="form-meta">
                <input type="hidden" id="meta-id">
                <div class="form-group">
                    <label>Descripción:</label>
                    <input type="text" id="meta-descripcion" required>
                </div>
                <div class="form-group">
                    <label>Monto Meta:</label>
                    <input type="number" step="0.01" id="meta-monto-meta" required>
                </div>
                <div class="form-group">
                    <label>Monto Actual:</label>
                    <input type="number" step="0.01" id="meta-monto-actual" value="0">
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Guardar</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal('modal-meta')">Cancelar</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal Progreso Meta -->
    <div id="modal-progreso-meta" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeModal('modal-progreso-meta')">&times;</span>
            <h2>Actualizar Progreso</h2>
            <form id="form-progreso-meta">
                <input type="hidden" id="progreso-meta-id">
                <div class="form-group">
                    <label>Meta:</label>
                    <input type="text" id="progreso-meta-descripcion" readonly>
                </div>
                <div class="form-group">
                    <label>Monto Meta:</label>
                    <input type="number" step="0.01" id="progreso-meta-total" readonly>
                </div>
                <div class="form-group">
                    <label>Monto Actual:</label>
                    <input type="number" step="0.01" id="progreso-meta-actual" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Actualizar</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal('modal-progreso-meta')">Cancelar</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal Planificación Mensual -->
    <div id="modal-planificacion" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeModal('modal-planificacion')">&times;</span>
            <h2 id="modal-planificacion-title">Planificación Mensual</h2>
            <form id="form-planificacion">
                <input type="hidden" id="planificacion-mes">
                <input type="hidden" id="planificacion-quien">
                <div class="form-group">
                    <label>Monto (Casa + Deudas del Mes):</label>
                    <input type="number" step="0.01" id="planificacion-monto-casa-deudas" required>
                    <small>Este monto se calcula automáticamente según las deudas del mes</small>
                </div>
                <div class="form-group">
                    <label>Mamá:</label>
                    <input type="number" step="0.01" id="planificacion-mama" required>
                </div>
                <div class="form-group">
                    <label>Hijos:</label>
                    <input type="number" step="0.01" id="planificacion-hijos" required>
                </div>
                <div class="form-group">
                    <label>Ahorros:</label>
                    <input type="number" step="0.01" id="planificacion-ahorros" required>
                </div>
                <div class="form-group">
                    <label>Aportes a Metas (Opcional):</label>
                    <div id="aportes-metas-container"></div>
                    <small>Distribuye parte de tus ingresos entre las metas</small>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Guardar</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal('modal-planificacion')">Cancelar</button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Modal Avance Real Mensual -->
    <div id="modal-avance-real" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeModal('modal-avance-real')">&times;</span>
            <h2 id="modal-avance-real-title">Registrar Avance Real</h2>
            <form id="form-avance-real">
                <input type="hidden" id="avance-real-mes">
                <input type="hidden" id="avance-real-quien">
                <div class="form-group">
                    <label>Monto Real (Casa + Deudas Pagadas):</label>
                    <input type="number" step="0.01" id="avance-real-monto-casa-deudas" required>
                    <small>Monto real pagado en deudas este mes</small>
                </div>
                <div class="form-group">
                    <label>Mamá (Real):</label>
                    <input type="number" step="0.01" id="avance-real-mama" required>
                </div>
                <div class="form-group">
                    <label>Hijos (Real):</label>
                    <input type="number" step="0.01" id="avance-real-hijos" required>
                </div>
                <div class="form-group">
                    <label>Ahorros (Real):</label>
                    <input type="number" step="0.01" id="avance-real-ahorros" required>
                </div>
                <div class="form-group">
                    <label>Aportes Reales a Metas (Opcional):</label>
                    <div id="aportes-reales-metas-container"></div>
                    <small>Aportes reales que diste a las metas este mes</small>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Guardar</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal('modal-avance-real')">Cancelar</button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Modal Editar Pago Real Deuda -->
    <div id="modal-deuda-pago" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeModal('modal-deuda-pago')">&times;</span>
            <h2 id="modal-deuda-pago-title">Registrar Pago Real</h2>
            <form id="form-deuda-pago">
                <input type="hidden" id="deuda-pago-id">
                <input type="hidden" id="deuda-pago-mes">
                <div class="form-group">
                    <label>Deuda:</label>
                    <input type="text" id="deuda-pago-descripcion-input" readonly>
                </div>
                <div class="form-group">
                    <label>Mes:</label>
                    <input type="text" id="deuda-pago-mes-display" readonly>
                </div>
                <div class="form-group">
                    <label>Comprometido a pagar:</label>
                    <input type="number" step="0.01" id="deuda-pago-comprometido" readonly>
                </div>
                <div class="form-group">
                    <label>Monto Real Pagado:</label>
                    <input type="number" step="0.01" id="deuda-pago-monto" required>
                    <small>Ingresa el monto que realmente pagaste este mes</small>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Guardar</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal('modal-deuda-pago')">Cancelar</button>
                </div>
            </form>
        </div>
    </div>

    <script src="script.js"></script>
</body>
</html>

