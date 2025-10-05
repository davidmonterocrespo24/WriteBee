# 🐦 Módulo de Twitter/X

## Descripción
El módulo de Twitter/X permite integrar la asistencia de IA directamente en la plataforma Twitter/X. Proporciona funcionalidades para crear tweets y responder a publicaciones con ayuda de inteligencia artificial.

## Características principales

### ✨ Detección automática
- Detecta cuando estás en Twitter (twitter.com) o X (x.com)
- Se activa automáticamente al abrir el compositor de tweets
- Inserta botones "AI" en las áreas de composición y respuesta

### 📝 Creación de Tweets
- Genera tweets profesionales desde cero
- Múltiples tonos: Informativo, Casual, Profesional, Viral
- Respeta el límite de 280 caracteres
- Contador de caracteres en tiempo real
- Sugerencias de hashtags relevantes

### 💬 Respuestas a Tweets
- Analiza el tweet original para generar respuestas contextuales
- Tonos de respuesta: Apoyar, Gracioso, Preguntar, Discrepar
- Genera respuestas coherentes y relevantes
- Mantiene la conversación natural

### 🌐 Multiidioma
- Español
- Inglés (English)
- Francés (Français)
- Alemán (Deutsch)

### 🔧 Funciones adicionales
- **Edición en vivo**: Los tweets generados son editables antes de publicar
- **Copiar**: Copia el tweet al portapapeles con un solo clic
- **Regenerar**: Genera una nueva versión si no te convence la primera
- **Insertar**: Inserta automáticamente el texto en el compositor de Twitter

## Uso

### Crear un Tweet Nuevo

1. **Abrir el compositor**
   - Haz clic en "Tweet" o "Post" en Twitter/X
   - El área de composición se abrirá

2. **Activar AI**
   - Verás el botón "AI" con un ícono de mensaje
   - Haz clic en el botón

3. **Configurar el tweet**
   - Escribe de qué quieres hablar: "Consejos para programar mejor"
   - Selecciona un tono (opcional):
     - 📚 **Informativo**: Para contenido educativo
     - 😎 **Casual**: Para tweets relajados
     - 💼 **Profesional**: Para contenido formal
     - 🚀 **Viral**: Para tweets llamativos
   - Selecciona el idioma (opcional)

4. **Generar**
   - Haz clic en "Generar"
   - La IA creará un tweet optimizado
   - Verás el contador de caracteres

5. **Editar y publicar**
   - Edita el tweet si quieres
   - Haz clic en "Insertar" para agregarlo al compositor
   - ¡Publica tu tweet!

### Responder a un Tweet

1. **Abrir respuesta**
   - Haz clic en "Responder" en cualquier tweet
   - El área de respuesta se abrirá

2. **Activar AI**
   - Verás el botón "AI" en la barra de herramientas
   - Haz clic en él

3. **Ver contexto**
   - El diálogo mostrará el tweet original
   - La IA analizará el contexto automáticamente

4. **Configurar respuesta**
   - Escribe cómo quieres responder: "Agregar un dato interesante"
   - Selecciona un tono:
     - 👍 **Apoyar**: Estar de acuerdo
     - 😄 **Gracioso**: Respuesta con humor
     - ❓ **Preguntar**: Hacer una pregunta
     - 🤔 **Discrepar**: Expresar desacuerdo respetuoso
   - Selecciona el idioma

5. **Generar y publicar**
   - Haz clic en "Generar"
   - Revisa y edita si es necesario
   - Haz clic en "Insertar"
   - ¡Publica tu respuesta!

## Arquitectura técnica

### Detección de Twitter/X
```javascript
isTwitter = window.location.hostname.includes('twitter.com') || 
            window.location.hostname.includes('x.com');
```

### Observación del DOM
Utiliza `MutationObserver` para detectar cambios en la interfaz:
```javascript
const observer = new MutationObserver(() => {
  checkForTweetComposer();
  checkForReplyBoxes();
});
```

### Selectores principales
```javascript
// Compositor de tweets
'[data-testid="tweetTextarea_0"]'

// Texto de tweets
'[data-testid="tweetText"]'

// Contenedor de tweet
'article[data-testid="tweet"]'
```

### Generación de contenido

**Para tweets nuevos:**
```javascript
prompt = `Genera un tweet [tono] sobre:
${userContent}

IMPORTANTE:
- Máximo 280 caracteres
- Usa 1-2 hashtags relevantes
- Que genere engagement`;
```

**Para respuestas:**
```javascript
prompt = `Tweet original:
"${originalTweet}"

Genera una respuesta [tono] basada en:
${userContent}

IMPORTANTE:
- Máximo 280 caracteres
- NO uses hashtags excesivos
- Responde directamente`;
```

### Inserción de texto
```javascript
function insertTextIntoTwitter(text) {
  const activeTextarea = document.querySelector('[data-testid="tweetTextarea_0"]');
  
  if (activeTextarea) {
    activeTextarea.focus();
    document.execCommand('insertText', false, text);
    activeTextarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
```

## Estilos personalizados

### Botones
- Color principal: `#1d9bf0` (azul Twitter)
- Diseño redondeado con `border-radius: 16px`
- Efecto hover con elevación
- Íconos SVG con animaciones

### Diálogo
- Diseño arrastrable
- Posicionamiento inteligente cerca del botón
- Chips de tono con estados activos
- Contador de caracteres con colores dinámicos:
  - Normal: < 260 caracteres
  - Advertencia: 260-280 caracteres (naranja)
  - Límite excedido: > 280 caracteres (rojo)

### Contador de caracteres
```css
.ai-twitter-char-count {
  /* Verde si < 260 */
  /* Naranja si 260-280 */
  /* Rojo si > 280 */
}
```

## Compatibilidad

### Plataformas soportadas
- ✅ Twitter (twitter.com)
- ✅ X (x.com)

### Navegadores
- ✅ Chrome/Edge (con soporte de Chrome AI)
- ⚠️ Firefox/Safari (requiere adaptación)

## Limitaciones conocidas

1. **Límite de caracteres**: Twitter tiene un límite estricto de 280 caracteres
2. **Selectores dinámicos**: Twitter actualiza frecuentemente su estructura DOM
3. **Threads**: Actualmente solo soporta tweets individuales, no threads
4. **Imágenes**: No genera ni sugiere imágenes para tweets
5. **Encuestas**: No soporta creación de encuestas

## Mejoras futuras

- [ ] Soporte para crear threads (hilos)
- [ ] Sugerencias de imágenes usando AI
- [ ] Análisis de engagement previo del usuario
- [ ] Optimización de horarios de publicación
- [ ] Sugerencias de menciones relevantes
- [ ] Modo "Retweet con comentario"
- [ ] Análisis de tendencias para hashtags
- [ ] Generación de encuestas
- [ ] Respuestas a múltiples tweets (quote tweets)
- [ ] Análisis de sentimiento del tweet original

## Troubleshooting

### El botón no aparece
**Solución:**
- Verifica que estás en twitter.com o x.com
- Recarga la página (F5)
- Abre el compositor de tweets
- Revisa la consola de desarrollador (F12) para logs con 🐦

### El texto no se inserta
**Solución:**
- El texto se copia automáticamente al portapapeles
- Pégalo manualmente con Ctrl+V
- Twitter puede haber cambiado sus selectores

### El contador de caracteres no funciona
**Solución:**
- Edita el texto manualmente y se actualizará
- Si el tweet es muy largo, Twitter no te dejará publicarlo

### El diálogo aparece fuera de pantalla
**Solución:**
- Arrastra el diálogo desde el header
- El diálogo debería posicionarse automáticamente
- Cierra y vuelve a abrir

## Código de ejemplo

### Personalizar tonos de tweet
```javascript
const toneDescriptions = {
  informative: 'informativo y educativo',
  casual: 'casual y relajado',
  professional: 'profesional y formal',
  viral: 'llamativo y con potencial viral',
  // Agregar más tonos aquí
  motivational: 'motivacional e inspirador'
};
```

### Agregar nuevo idioma
```javascript
const languageNames = {
  es: 'español',
  en: 'inglés',
  fr: 'francés',
  de: 'alemán',
  // Agregar nuevo idioma
  pt: 'português'
};
```

### Modificar límite de caracteres
```javascript
function updateCharCount(element, countElement) {
  const text = element.innerText || element.textContent;
  const count = text.length;
  const limit = 280; // Cambiar aquí
  
  if (count > limit) {
    countElement.style.color = '#ff6b6b';
  }
}
```

## Mejores prácticas

### Para crear buenos tweets
1. **Sé específico**: Da contexto claro sobre qué quieres tweetear
2. **Usa tonos apropiados**: Elige el tono según tu audiencia
3. **Revisa antes de publicar**: Edita el tweet generado si es necesario
4. **Usa hashtags con moderación**: 1-2 hashtags son suficientes
5. **Mantén la autenticidad**: Ajusta el texto para que suene como tú

### Para responder tweets
1. **Lee el contexto**: Asegúrate de entender el tweet original
2. **Sé respetuoso**: Usa el tono "Discrepar" para desacuerdos civilizados
3. **Aporta valor**: Añade información útil en tus respuestas
4. **Sé breve**: Las respuestas cortas suelen funcionar mejor
5. **Mantén la conversación**: Usa preguntas para generar engagement

## Contribuir

Si encuentras bugs o tienes sugerencias:
1. Revisa el código en `modules/twitter.js`
2. Prueba con diferentes tipos de tweets
3. Documenta cambios en la estructura DOM de Twitter
4. Propón mejoras en el README

## Ejemplos de uso

### Tweet informativo
```
Input: "Beneficios de TypeScript"
Tono: Informativo
Idioma: Español

Output: "TypeScript transforma tu código JavaScript: ✅ Detección de errores temprana ✅ Mejor autocompletado ✅ Código más mantenible ✅ Refactoring seguro. ¿Ya lo usas en tus proyectos? #TypeScript #Programming"
```

### Respuesta graciosa
```
Tweet original: "Los desarrolladores solo tomamos café"
Input: "Hacer un chiste sobre otras bebidas"
Tono: Gracioso

Output: "Y agua... para diluir el café cuando está muy fuerte ☕➡️💧 También RedBull cuando el café ya no funciona 😅 #DevLife"
```

### Tweet viral
```
Input: "Nuevo framework de JavaScript"
Tono: Viral

Output: "BREAKING: Acaba de salir otro framework de JavaScript 🚀 Los desarrolladores: "¿Ya terminaste de aprenderlo?" Yo: "¿Cuál? Ya salieron 3 más" 😅 #JavaScript #WebDev #DevHumor"
```

---

**Implementado por**: GitHub Copilot  
**Fecha**: Octubre 4, 2025  
**Versión**: 1.0  
**Plataformas**: Twitter & X
