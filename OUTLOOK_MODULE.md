# 📧 Módulo de Outlook

## Descripción
El módulo de Outlook permite integrar la asistencia de IA directamente en la interfaz de correo electrónico de Outlook (Outlook.com y Office 365). Proporciona funcionalidades para resumir correos y generar respuestas profesionales automáticamente.

## Características principales

### ✨ Detección automática
- Detecta cuando estás en Outlook Web (outlook.live.com, outlook.office.com, outlook.office365.com)
- Se activa automáticamente cuando abres un correo electrónico
- Inserta un botón "Respuesta AI" en la interfaz de Outlook

### 📝 Resumen de correos
- Analiza automáticamente el contenido del correo abierto
- Genera un resumen conciso y claro del mensaje
- Muestra el progreso del análisis en tiempo real

### ✍️ Generación de respuestas
- Permite componer respuestas personalizadas basadas en el contenido del correo
- El usuario puede especificar qué incluir en la respuesta
- Genera respuestas profesionales y cordiales automáticamente

### 🔧 Funciones adicionales
- **Edición en vivo**: Las respuestas generadas son editables antes de insertarlas
- **Copiar**: Copia la respuesta al portapapeles con un solo clic
- **Regenerar**: Genera una nueva versión de la respuesta si no te convence la primera
- **Insertar**: Inserta automáticamente la respuesta en el editor de Outlook

## Uso

### Paso 1: Abrir un correo
1. Navega a Outlook Web (outlook.live.com o outlook.office.com)
2. Abre cualquier correo electrónico de tu bandeja de entrada
3. El botón "Respuesta AI" aparecerá automáticamente

### Paso 2: Generar resumen
1. Haz clic en el botón "Respuesta AI"
2. Se abrirá un diálogo mostrando el análisis del correo
3. El resumen se generará automáticamente

### Paso 3: Componer respuesta
1. En el campo "¿Qué quieres incluir en tu respuesta?", escribe tus indicaciones
2. Por ejemplo: "Confirmar la reunión del viernes a las 3pm"
3. Haz clic en el botón de enviar (flecha) o presiona Enter
4. La IA generará una respuesta profesional

### Paso 4: Usar la respuesta
- **Editar**: Haz clic en la respuesta para modificarla
- **Copiar**: Usa el botón "Copiar" para copiar al portapapeles
- **Regenerar**: Genera una nueva versión si no estás satisfecho
- **Insertar**: Haz clic en "Insertar en Outlook" para agregarla al editor de respuesta

## Arquitectura técnica

### Detección de Outlook
```javascript
isOutlook = window.location.hostname.includes('outlook.live.com') || 
            window.location.hostname.includes('outlook.office.com') ||
            window.location.hostname.includes('outlook.office365.com');
```

### Observación del DOM
Utiliza `MutationObserver` para detectar cambios en la interfaz y saber cuándo se abre un correo:
```javascript
const observer = new MutationObserver(() => {
  checkForEmailView();
});
```

### Extracción de contenido
Busca múltiples selectores para extraer el contenido del correo:
- `[role="region"][aria-label*="Cuerpo del mensaje"]`
- `[role="document"][aria-label*="mensaje"]`
- `.wide-content-host`
- `[data-app-section="MailReadMessageWell"]`

### Inserción de respuestas
Intenta insertar el texto en el editor de Outlook usando varios métodos:
1. `document.execCommand('insertText')`
2. Manipulación directa del DOM
3. Fallback: Copiar al portapapeles si no se encuentra el editor

## Estilos personalizados

### Botón principal
- Diseño consistente con la interfaz de Outlook
- Efecto hover con elevación y sombra azul
- Compatible con modo claro y oscuro de Outlook

### Botón flotante
- Se muestra cuando no hay toolbar disponible
- Posición sticky para seguir el scroll
- Más destacado visualmente para mejor visibilidad

### Diálogo
- Diseño arrastrable para reposicionar
- Scroll suave en contenido largo
- Estilos de markdown integrados

## Compatibilidad

### Versiones soportadas
- ✅ Outlook Web (outlook.live.com)
- ✅ Office 365 Outlook (outlook.office.com)
- ✅ Outlook Office 365 (outlook.office365.com)

### Navegadores
- ✅ Chrome/Edge (con soporte de Chrome AI)
- ⚠️ Firefox/Safari (requiere adaptación)

## Limitaciones conocidas

1. **Selectores dinámicos**: Outlook actualiza frecuentemente su estructura DOM
2. **Inserción de texto**: Algunos editores WYSIWYG pueden no soportar `execCommand`
3. **Idiomas**: Los mensajes de la UI están en español (personalizable)

## Mejoras futuras

- [ ] Soporte para responder a múltiples correos
- [ ] Templates de respuestas predefinidas
- [ ] Análisis de tono (formal, informal, urgente)
- [ ] Detección automática de idioma del correo
- [ ] Sugerencias de asunto para respuestas
- [ ] Integración con calendario para confirmación de citas
- [ ] Modo "Respuesta rápida" con botones predefinidos

## Troubleshooting

### El botón no aparece
- Verifica que estás en una URL de Outlook soportada
- Asegúrate de que la extensión está habilitada
- Recarga la página (F5)
- Abre la consola de desarrollador para ver logs

### La respuesta no se inserta
- El editor de Outlook puede haber cambiado su estructura
- Usa el botón "Copiar" y pega manualmente (Ctrl+V)
- Verifica la consola para mensajes de error

### El resumen no se genera
- Verifica que Chrome AI está disponible en tu navegador
- Comprueba la conexión a internet
- Revisa que el contenido del correo sea extraíble

## Código de ejemplo

### Personalizar el prompt de respuesta
```javascript
async function generateEmailResponse(emailContent, userContent) {
  const prompt = `Correo original:
${emailContent}

Instrucciones personalizadas:
${userContent}

Genera una respuesta [formal/informal/urgente] para este correo.`;

  const response = await AIModule.aiAnswer(prompt);
  return response;
}
```

### Agregar botón personalizado
```javascript
function insertCustomButton(emailContainer) {
  const button = document.createElement('button');
  button.className = 'ai-outlook-button';
  button.innerHTML = `
    <svg><!-- Tu icono --></svg>
    <span>Tu Texto</span>
  `;
  button.addEventListener('click', tuFuncion);
  emailContainer.appendChild(button);
}
```

## Contribuir

Si encuentras bugs o tienes sugerencias:
1. Revisa el código en `modules/outlook.js`
2. Prueba con diferentes versiones de Outlook
3. Documenta cambios en la estructura DOM de Outlook
4. Propón mejoras en el README

---

**Nota**: Este módulo está en desarrollo activo. La interfaz de Outlook puede cambiar, requiriendo actualizaciones en los selectores DOM.
