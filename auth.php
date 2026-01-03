<?php
session_start();

// Función para verificar si el usuario está autenticado
function verificarAutenticacion() {
    if (!isset($_SESSION['usuario_autenticado']) || $_SESSION['usuario_autenticado'] !== true) {
        header('Location: login.php');
        exit;
    }
}

// Verificar autenticación automáticamente si se incluye este archivo
verificarAutenticacion();
?>

