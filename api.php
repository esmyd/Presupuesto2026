<?php
session_start();

// Verificar autenticación
if (!isset($_SESSION['usuario_autenticado']) || $_SESSION['usuario_autenticado'] !== true) {
    http_response_code(401);
    echo json_encode(['error' => 'No autorizado. Debe iniciar sesión.']);
    exit;
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

$dataFile = 'data.json';

// Leer datos
function readData() {
    global $dataFile;
    if (!file_exists($dataFile)) {
        return [
            'deudas' => [],
            'entradas' => [],
            'salidas' => [],
            'planificacion_mensual' => [],
            'avance_real_mensual' => [],
            'metas' => [],
            'bitacora' => []
        ];
    }
    $content = file_get_contents($dataFile);
    return json_decode($content, true);
}

// Guardar datos
function saveData($data) {
    global $dataFile;
    file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Registrar en bitácora
function registrarBitacora($data, $tipo, $accion, $descripcion, $valorAnterior = null, $valorNuevo = null, $id = null) {
    if (!isset($data['bitacora'])) {
        $data['bitacora'] = [];
    }
    
    // Obtener usuario de la sesión
    $usuario = isset($_SESSION['usuario']) ? $_SESSION['usuario'] : 'Sistema';
    
    $registro = [
        'id' => count($data['bitacora']) + 1,
        'fecha' => date('Y-m-d H:i:s'),
        'usuario' => $usuario,
        'tipo' => $tipo, // 'deuda', 'entrada', 'salida', 'meta', 'planificacion', 'avance_real'
        'accion' => $accion, // 'agregar', 'actualizar', 'eliminar'
        'descripcion' => $descripcion,
        'valor_anterior' => $valorAnterior,
        'valor_nuevo' => $valorNuevo,
        'id_item' => $id
    ];
    
    // Agregar al inicio del array (más reciente primero)
    array_unshift($data['bitacora'], $registro);
    
    // Limitar a 500 registros
    if (count($data['bitacora']) > 500) {
        $data['bitacora'] = array_slice($data['bitacora'], 0, 500);
    }
    
    return $data;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

$data = readData();

// Manejar diferentes acciones
switch ($action) {
    case 'get_all':
        echo json_encode($data);
        break;
        
    case 'add_deuda':
        if ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            $newId = !empty($data['deudas']) ? max(array_column($data['deudas'], 'id')) + 1 : 1;
            $nuevaDeuda = [
                'id' => $newId,
                'descripcion' => $input['descripcion'],
                'monto' => floatval($input['monto']),
                'quien' => $input['quien'],
                'montos_mensuales' => isset($input['montos_mensuales']) ? $input['montos_mensuales'] : []
            ];
            // Mantener compatibilidad con formato anterior
            if (isset($input['enero'])) {
                $nuevaDeuda['montos_mensuales']['enero'] = floatval($input['enero']);
            }
            $data['deudas'][] = $nuevaDeuda;
            $data = registrarBitacora($data, 'deuda', 'agregar', 
                "Deuda: {$input['descripcion']}", null, json_encode($nuevaDeuda), $newId);
            saveData($data);
            echo json_encode(['success' => true, 'data' => $data['deudas']]);
        }
        break;
        
    case 'update_deuda':
        if ($method === 'PUT') {
            $input = json_decode(file_get_contents('php://input'), true);
            $valorAnterior = null;
            foreach ($data['deudas'] as &$deuda) {
                if ($deuda['id'] == $input['id']) {
                    $valorAnterior = json_encode($deuda);
                    $deuda['descripcion'] = $input['descripcion'];
                    $deuda['monto'] = floatval($input['monto']);
                    $deuda['quien'] = $input['quien'];
                    if (!isset($deuda['montos_mensuales'])) {
                        $deuda['montos_mensuales'] = [];
                        // Migrar enero si existe
                        if (isset($deuda['enero'])) {
                            $deuda['montos_mensuales']['enero'] = floatval($deuda['enero']);
                        }
                    }
                    if (isset($input['montos_mensuales'])) {
                        $deuda['montos_mensuales'] = $input['montos_mensuales'];
                    }
                    // Compatibilidad con formato anterior
                    if (isset($input['enero'])) {
                        $deuda['montos_mensuales']['enero'] = floatval($input['enero']);
                    }
                    $valorNuevo = json_encode($deuda);
                    $data = registrarBitacora($data, 'deuda', 'actualizar', 
                        "Deuda: {$input['descripcion']}", $valorAnterior, $valorNuevo, $input['id']);
                    break;
                }
            }
            saveData($data);
            echo json_encode(['success' => true]);
        }
        break;
        
    case 'delete_deuda':
        if ($method === 'DELETE') {
            $id = intval($_GET['id']);
            $deudaEliminada = null;
            foreach ($data['deudas'] as $deuda) {
                if ($deuda['id'] == $id) {
                    $deudaEliminada = $deuda;
                    break;
                }
            }
            $data['deudas'] = array_filter($data['deudas'], function($d) use ($id) {
                return $d['id'] != $id;
            });
            $data['deudas'] = array_values($data['deudas']);
            if ($deudaEliminada) {
                $data = registrarBitacora($data, 'deuda', 'eliminar', 
                    "Deuda: {$deudaEliminada['descripcion']}", json_encode($deudaEliminada), null, $id);
            }
            saveData($data);
            echo json_encode(['success' => true]);
        }
        break;
        
    case 'add_entrada':
        if ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            $newId = !empty($data['entradas']) ? max(array_column($data['entradas'], 'id')) + 1 : 1;
            $nuevaEntrada = [
                'id' => $newId,
                'sueldo' => floatval($input['sueldo']),
                'quien' => $input['quien']
            ];
            $data['entradas'][] = $nuevaEntrada;
            $data = registrarBitacora($data, 'entrada', 'agregar', 
                "Ingreso: {$input['quien']} - $" . floatval($input['sueldo']), null, json_encode($nuevaEntrada), $newId);
            saveData($data);
            echo json_encode(['success' => true, 'data' => $data['entradas']]);
        }
        break;
        
    case 'update_entrada':
        if ($method === 'PUT') {
            $input = json_decode(file_get_contents('php://input'), true);
            $valorAnterior = null;
            foreach ($data['entradas'] as &$entrada) {
                if ($entrada['id'] == $input['id']) {
                    $valorAnterior = json_encode($entrada);
                    $sueldoAnterior = $entrada['sueldo'];
                    $entrada['sueldo'] = floatval($input['sueldo']);
                    $entrada['quien'] = $input['quien'];
                    $valorNuevo = json_encode($entrada);
                    $data = registrarBitacora($data, 'entrada', 'actualizar', 
                        "Ingreso: {$input['quien']} - Anterior: $" . $sueldoAnterior . " | Nuevo: $" . floatval($input['sueldo']), 
                        $valorAnterior, $valorNuevo, $input['id']);
                    break;
                }
            }
            saveData($data);
            echo json_encode(['success' => true]);
        }
        break;
        
    case 'delete_entrada':
        if ($method === 'DELETE') {
            $id = intval($_GET['id']);
            $entradaEliminada = null;
            foreach ($data['entradas'] as $entrada) {
                if ($entrada['id'] == $id) {
                    $entradaEliminada = $entrada;
                    break;
                }
            }
            $data['entradas'] = array_filter($data['entradas'], function($e) use ($id) {
                return $e['id'] != $id;
            });
            $data['entradas'] = array_values($data['entradas']);
            if ($entradaEliminada) {
                $data = registrarBitacora($data, 'entrada', 'eliminar', 
                    "Ingreso: {$entradaEliminada['quien']} - $" . $entradaEliminada['sueldo'], 
                    json_encode($entradaEliminada), null, $id);
            }
            saveData($data);
            echo json_encode(['success' => true]);
        }
        break;
        
    case 'add_salida':
        if ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            $newId = !empty($data['salidas']) ? max(array_column($data['salidas'], 'id')) + 1 : 1;
            $tipo = $input['tipo'] ?? 'otro';
            $nuevaSalida = [
                'id' => $newId,
                'descripcion' => $input['descripcion'],
                'monto' => floatval($input['monto']),
                'tipo' => $tipo,
                'fecha' => $input['fecha'] ?? date('Y-m-d'),
                'observacion' => $input['observacion'] ?? ''
            ];
            $data['salidas'][] = $nuevaSalida;
            $data = registrarBitacora($data, 'salida', 'agregar', 
                "Gasto ({$tipo}): {$input['descripcion']} - $" . floatval($input['monto']), null, json_encode($nuevaSalida), $newId);
            saveData($data);
            echo json_encode(['success' => true, 'data' => $data['salidas']]);
        }
        break;
        
    case 'update_salida':
        if ($method === 'PUT') {
            $input = json_decode(file_get_contents('php://input'), true);
            $valorAnterior = null;
            foreach ($data['salidas'] as &$salida) {
                if ($salida['id'] == $input['id']) {
                    $valorAnterior = json_encode($salida);
                    $montoAnterior = $salida['monto'];
                    $salida['descripcion'] = $input['descripcion'];
                    $salida['monto'] = floatval($input['monto']);
                    $salida['tipo'] = $input['tipo'] ?? ($salida['tipo'] ?? 'otro');
                    $salida['fecha'] = $input['fecha'] ?? ($salida['fecha'] ?? date('Y-m-d'));
                    $salida['observacion'] = $input['observacion'] ?? '';
                    $valorNuevo = json_encode($salida);
                    $data = registrarBitacora($data, 'salida', 'actualizar', 
                        "Gasto: {$input['descripcion']} - Anterior: $" . $montoAnterior . " | Nuevo: $" . floatval($input['monto']), 
                        $valorAnterior, $valorNuevo, $input['id']);
                    break;
                }
            }
            saveData($data);
            echo json_encode(['success' => true]);
        }
        break;
        
    case 'delete_salida':
        if ($method === 'DELETE') {
            $id = intval($_GET['id']);
            $salidaEliminada = null;
            foreach ($data['salidas'] as $salida) {
                if ($salida['id'] == $id) {
                    $salidaEliminada = $salida;
                    break;
                }
            }
            $data['salidas'] = array_filter($data['salidas'], function($s) use ($id) {
                return $s['id'] != $id;
            });
            $data['salidas'] = array_values($data['salidas']);
            if ($salidaEliminada) {
                $data = registrarBitacora($data, 'salida', 'eliminar', 
                    "Gasto: {$salidaEliminada['descripcion']} - $" . $salidaEliminada['monto'], 
                    json_encode($salidaEliminada), null, $id);
            }
            saveData($data);
            echo json_encode(['success' => true]);
        }
        break;
        
    case 'update_planificacion_mensual':
        if ($method === 'PUT') {
            $input = json_decode(file_get_contents('php://input'), true);
            $mes = $input['mes'];
            $quien = $input['quien'];
            
            if (!isset($data['planificacion_mensual'])) {
                $data['planificacion_mensual'] = [];
            }
            if (!isset($data['planificacion_mensual'][$mes])) {
                $data['planificacion_mensual'][$mes] = [];
            }
            
            $valorAnterior = isset($data['planificacion_mensual'][$mes][$quien]) 
                ? json_encode($data['planificacion_mensual'][$mes][$quien]) 
                : null;
            
            $montoCasaDeudas = floatval($input['monto_casa_deudas']);
            $data['planificacion_mensual'][$mes][$quien] = [
                'monto_casa_deudas' => $montoCasaDeudas,
                'mama' => floatval($input['mama']),
                'hijos' => floatval($input['hijos']),
                'ahorros' => floatval($input['ahorros']),
                'aportes_metas' => isset($input['aportes_metas']) ? $input['aportes_metas'] : []
            ];
            
            // Distribuir monto_casa_deudas entre las deudas de esta persona como comprometido
            $deudasPersona = array_filter($data['deudas'], function($d) use ($quien) {
                return $d['quien'] === $quien;
            });
            
            if (count($deudasPersona) > 0 && $montoCasaDeudas > 0) {
                // Calcular proporción basada en el monto total de cada deuda
                $totalDeudasPersona = array_sum(array_column($deudasPersona, 'monto'));
                
                foreach ($data['deudas'] as &$deuda) {
                    if ($deuda['quien'] === $quien) {
                        if (!isset($deuda['montos_comprometidos'])) {
                            $deuda['montos_comprometidos'] = [];
                        }
                        // Distribución proporcional
                        $proporcion = $totalDeudasPersona > 0 ? ($deuda['monto'] / $totalDeudasPersona) : 0;
                        $deuda['montos_comprometidos'][$mes] = round($montoCasaDeudas * $proporcion, 2);
                    }
                }
            }
            
            $valorNuevo = json_encode($data['planificacion_mensual'][$mes][$quien]);
            $mesNombre = ucfirst($mes);
            $data = registrarBitacora($data, 'planificacion', 'actualizar', 
                "Planificación {$mesNombre}: {$quien}", $valorAnterior, $valorNuevo, null);
            saveData($data);
            echo json_encode(['success' => true]);
        }
        break;
        
    case 'update_deuda_mes':
        if ($method === 'PUT') {
            // Este endpoint ahora solo actualiza comprometidos desde la planificación
            $input = json_decode(file_get_contents('php://input'), true);
            $deudaId = $input['id'];
            $mes = $input['mes'];
            $monto = floatval($input['monto']);
            
            foreach ($data['deudas'] as &$deuda) {
                if ($deuda['id'] == $deudaId) {
                    if (!isset($deuda['montos_comprometidos'])) {
                        $deuda['montos_comprometidos'] = [];
                    }
                    $valorAnterior = isset($deuda['montos_comprometidos'][$mes]) ? $deuda['montos_comprometidos'][$mes] : 0;
                    $deuda['montos_comprometidos'][$mes] = $monto;
                    
                    // Migrar formato antiguo
                    if (isset($deuda['montos_mensuales'][$mes]) && !isset($deuda['montos_pagados'][$mes])) {
                        if (!isset($deuda['montos_pagados'])) {
                            $deuda['montos_pagados'] = [];
                        }
                        $deuda['montos_pagados'][$mes] = $deuda['montos_mensuales'][$mes];
                    }
                    
                    $mesNombre = ucfirst($mes);
                    $data = registrarBitacora($data, 'deuda', 'actualizar', 
                        "Compromiso Deuda {$deuda['descripcion']} - {$mesNombre}: $" . $monto, 
                        json_encode(['mes' => $mes, 'comprometido' => $valorAnterior]), 
                        json_encode(['mes' => $mes, 'comprometido' => $monto]), 
                        $deudaId);
                    break;
                }
            }
            saveData($data);
            echo json_encode(['success' => true]);
        }
        break;
        
    case 'registrar_pago_deuda':
        if ($method === 'PUT') {
            $input = json_decode(file_get_contents('php://input'), true);
            $deudaId = $input['id'];
            $mes = $input['mes'];
            $monto = floatval($input['monto']);
            
            foreach ($data['deudas'] as &$deuda) {
                if ($deuda['id'] == $deudaId) {
                    if (!isset($deuda['montos_pagados'])) {
                        $deuda['montos_pagados'] = [];
                    }
                    $valorAnterior = isset($deuda['montos_pagados'][$mes]) ? $deuda['montos_pagados'][$mes] : 0;
                    $deuda['montos_pagados'][$mes] = $monto;
                    
                    $mesNombre = ucfirst($mes);
                    $comprometido = isset($deuda['montos_comprometidos'][$mes]) ? $deuda['montos_comprometidos'][$mes] : 0;
                    $data = registrarBitacora($data, 'deuda', 'actualizar', 
                        "Pago Real Deuda {$deuda['descripcion']} - {$mesNombre}: Comprometido $" . $comprometido . " | Pagado $" . $monto, 
                        json_encode(['mes' => $mes, 'pagado' => $valorAnterior]), 
                        json_encode(['mes' => $mes, 'pagado' => $monto]), 
                        $deudaId);
                    break;
                }
            }
            saveData($data);
            echo json_encode(['success' => true]);
        }
        break;
        
    case 'add_meta':
        if ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            $newId = !empty($data['metas']) ? max(array_column($data['metas'], 'id')) + 1 : 1;
            $nuevaMeta = [
                'id' => $newId,
                'descripcion' => $input['descripcion'],
                'monto_meta' => floatval($input['monto_meta']),
                'monto_actual' => floatval($input['monto_actual'] ?? 0)
            ];
            $data['metas'][] = $nuevaMeta;
            $data = registrarBitacora($data, 'meta', 'agregar', 
                "Meta: {$input['descripcion']} - $" . floatval($input['monto_meta']), null, json_encode($nuevaMeta), $newId);
            saveData($data);
            echo json_encode(['success' => true, 'data' => $data['metas']]);
        }
        break;
        
    case 'update_meta':
        if ($method === 'PUT') {
            $input = json_decode(file_get_contents('php://input'), true);
            $valorAnterior = null;
            foreach ($data['metas'] as &$meta) {
                if ($meta['id'] == $input['id']) {
                    $valorAnterior = json_encode($meta);
                    $meta['descripcion'] = $input['descripcion'];
                    $meta['monto_meta'] = floatval($input['monto_meta']);
                    $meta['monto_actual'] = floatval($input['monto_actual'] ?? 0);
                    $valorNuevo = json_encode($meta);
                    $data = registrarBitacora($data, 'meta', 'actualizar', 
                        "Meta: {$input['descripcion']}", $valorAnterior, $valorNuevo, $input['id']);
                    break;
                }
            }
            saveData($data);
            echo json_encode(['success' => true]);
        }
        break;
        
    case 'delete_meta':
        if ($method === 'DELETE') {
            $id = intval($_GET['id']);
            $metaEliminada = null;
            foreach ($data['metas'] as $meta) {
                if ($meta['id'] == $id) {
                    $metaEliminada = $meta;
                    break;
                }
            }
            $data['metas'] = array_filter($data['metas'], function($m) use ($id) {
                return $m['id'] != $id;
            });
            $data['metas'] = array_values($data['metas']);
            if ($metaEliminada) {
                $data = registrarBitacora($data, 'meta', 'eliminar', 
                    "Meta: {$metaEliminada['descripcion']}", json_encode($metaEliminada), null, $id);
            }
            saveData($data);
            echo json_encode(['success' => true]);
        }
        break;
        
    case 'update_progreso_meta':
        if ($method === 'PUT') {
            $input = json_decode(file_get_contents('php://input'), true);
            $valorAnterior = null;
            foreach ($data['metas'] as &$meta) {
                if ($meta['id'] == $input['id']) {
                    $valorAnterior = $meta['monto_actual'];
                    $meta['monto_actual'] = floatval($input['monto_actual']);
                    $data = registrarBitacora($data, 'meta', 'actualizar', 
                        "Progreso Meta: {$meta['descripcion']} - Anterior: $" . $valorAnterior . " | Nuevo: $" . floatval($input['monto_actual']), 
                        json_encode(['monto_actual' => $valorAnterior]), 
                        json_encode(['monto_actual' => floatval($input['monto_actual'])]), 
                        $input['id']);
                    break;
                }
            }
            saveData($data);
            echo json_encode(['success' => true]);
        }
        break;
        
    case 'update_avance_real':
        if ($method === 'PUT') {
            $input = json_decode(file_get_contents('php://input'), true);
            $mes = $input['mes'];
            $quien = $input['quien'];
            
            if (!isset($data['avance_real_mensual'])) {
                $data['avance_real_mensual'] = [];
            }
            if (!isset($data['avance_real_mensual'][$mes])) {
                $data['avance_real_mensual'][$mes] = [];
            }
            
            $valorAnterior = isset($data['avance_real_mensual'][$mes][$quien]) 
                ? json_encode($data['avance_real_mensual'][$mes][$quien]) 
                : null;
            
            $data['avance_real_mensual'][$mes][$quien] = [
                'monto_casa_deudas' => floatval($input['monto_casa_deudas']),
                'mama' => floatval($input['mama']),
                'hijos' => floatval($input['hijos']),
                'ahorros' => floatval($input['ahorros']),
                'aportes_metas' => isset($input['aportes_metas']) ? $input['aportes_metas'] : []
            ];
            
            $valorNuevo = json_encode($data['avance_real_mensual'][$mes][$quien]);
            $mesNombre = ucfirst($mes);
            $data = registrarBitacora($data, 'avance_real', 'actualizar', 
                "Avance Real {$mesNombre}: {$quien}", $valorAnterior, $valorNuevo, null);
            saveData($data);
            echo json_encode(['success' => true]);
        }
        break;
        
    default:
        echo json_encode(['error' => 'Acción no válida']);
        break;
}
?>
