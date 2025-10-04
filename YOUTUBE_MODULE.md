# 📺 Módulo de YouTube - Resumen de Video con IA

## ✨ Características Implementadas

### 🎯 Funcionalidad Principal
El módulo de YouTube agrega un panel AI inteligente arriba de la lista de videos recomendados cuando estás viendo un video en YouTube.

### 🔧 Componentes Creados

1. **`modules/youtube.js`** - Módulo completo con:
   - Detección automática de YouTube
   - Observación de cambios de URL (YouTube es SPA)
   - Extracción de subtítulos del video
   - Generación de resúmenes usando AI
   - Interfaz de usuario interactiva

2. **Estilos CSS en `styles.css`**:
   - Panel con diseño moderno y gradiente morado
   - Header expandible/contraíble
   - Opciones personalizables
   - Área de resultados con markdown
   - Botones de acción (copiar, regenerar)
   - Scrollbars personalizados

3. **Actualización de `manifest.json`**:
   - Incluido `youtube.js` en content_scripts

## 🎨 Interfaz de Usuario

### Panel Principal
```
┌─────────────────────────────────────┐
│ 🤖 Asistente AI                     │
│    Resume este video            ▼   │
├─────────────────────────────────────┤
│ 💡 Genera un resumen inteligente... │
│                                      │
│ ☑ Incluir marcas de tiempo          │
│ ☑ Puntos clave                       │
│                                      │
│ [🔄 Generar Resumen del Video]      │
│                                      │
│ 📋 Resumen del video:    [📋] [🔄]  │
│ ┌────────────────────────────────┐ │
│ │ Resumen generado aquí...       │ │
│ └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## 🚀 Flujo de Trabajo

1. **Usuario abre un video en YouTube**
   - El módulo detecta la URL automáticamente
   - Se inserta el panel arriba de los videos recomendados

2. **Usuario configura opciones**
   - ✅ Incluir marcas de tiempo: Agrega [0:00] formato de tiempo
   - ✅ Puntos clave: Organiza el resumen en puntos importantes

3. **Usuario hace clic en "Generar Resumen"**
   - Se obtienen los subtítulos del video
   - Se procesan con la API de Summarizer
   - Se muestra el progreso de procesamiento

4. **Resultado**
   - Resumen formateado en Markdown
   - Opción de copiar al portapapeles
   - Opción de regenerar con diferentes parámetros

## 🔍 Extracción de Subtítulos

### Método Principal
```javascript
fetchYoutubeSubtitles(videoId)
```
- Extrae subtítulos de la API interna de YouTube
- Busca en el HTML la configuración de `captionTracks`
- Descarga el XML de subtítulos
- Parsea y formatea los segmentos

### Idiomas Soportados
1. **Español** (preferencia principal)
2. **Inglés** (segunda opción)
3. **Primer idioma disponible** (fallback)

### Formato de Subtítulos
```javascript
{
  start: 12.5,      // Tiempo en segundos
  duration: 3.2,    // Duración del segmento
  text: "Texto..."  // Contenido decodificado
}
```

## 🎯 Opciones de Resumen

### Con Marcas de Tiempo
```
[0:00] Introducción al tema principal
[2:15] Explicación del primer concepto
[5:30] Demostración práctica
[8:45] Conclusiones finales
```

### Sin Marcas de Tiempo
```
Este video trata sobre... El autor explica...
Los puntos principales incluyen...
```

### Con Puntos Clave
```markdown
## Resumen del Video

### 📌 Puntos Principales
- Punto importante 1
- Punto importante 2
- Punto importante 3

### 💡 Conceptos Clave
- Concepto A
- Concepto B

### ✅ Conclusiones
- Conclusión final
```

## 🛠️ Funciones Principales

### `init()`
Inicializa el módulo y detecta YouTube

### `observeYoutube()`
Observa cambios en la URL para detectar nuevos videos

### `insertYoutubePanel()`
Inserta el panel AI en el DOM de YouTube

### `generateVideoSummary()`
Genera el resumen usando los subtítulos y AI

### `getVideoSubtitles()`
Obtiene los subtítulos del video actual

### `fetchYoutubeSubtitles(videoId)`
Extrae y parsea subtítulos de YouTube

### `formatTime(seconds)`
Formatea segundos a formato MM:SS

## 🎨 Estilos CSS Personalizados

### Clases Principales
- `.ai-youtube-panel` - Contenedor principal
- `.ai-youtube-header` - Header con gradiente morado
- `.ai-youtube-content` - Área de contenido
- `.ai-youtube-result` - Área de resultados
- `.ai-youtube-summarize-btn` - Botón principal

### Características Visuales
- Gradiente morado (`#7a5cff` → `#5b3fd9`)
- Bordes redondeados (12px)
- Sombras suaves
- Transiciones animadas
- Hover effects
- Scrollbars personalizados

## ⚠️ Manejo de Errores

### Casos Cubiertos
1. **Sin subtítulos disponibles**
   ```
   ❌ Error: No se encontraron subtítulos disponibles...
   ```

2. **Error de red**
   ```
   ❌ Error: No se pudieron obtener los subtítulos...
   ```

3. **Error de AI**
   ```
   ❌ Error: Error al generar resumen...
   ```

### Mensajes de Usuario
- Diseñados con iconos ❌
- Fondo rojo suave (#2a1a1a)
- Borde izquierdo destacado
- Instrucciones claras

## 📋 Requisitos del Video

Para que funcione correctamente:
- ✅ El video debe tener subtítulos disponibles
- ✅ Pueden ser automáticos o manuales
- ✅ Funciona con subtítulos en múltiples idiomas
- ❌ No funciona con videos privados sin subtítulos

## 🔄 Estados del Botón

1. **Normal**: "Generar Resumen del Video"
2. **Obteniendo**: "Obteniendo subtítulos..."
3. **Procesando**: "Generando resumen..."
4. **Con progreso**: "Procesando 45%"
5. **Completado**: Vuelve al estado normal

## 💡 Mejoras Futuras Posibles

- [ ] Soporte para múltiples idiomas de salida
- [ ] Generación de timestamps clickeables
- [ ] Resumen por capítulos (si el video los tiene)
- [ ] Exportar resumen en diferentes formatos
- [ ] Traducir subtítulos antes de resumir
- [ ] Detectar y resaltar términos técnicos
- [ ] Integración con notas del usuario

## 🎉 Resultado Final

Un módulo completamente funcional que:
- ✅ Se integra perfectamente con YouTube
- ✅ Usa subtítulos nativos del video
- ✅ Genera resúmenes inteligentes con AI
- ✅ Ofrece opciones personalizables
- ✅ Tiene una interfaz moderna y atractiva
- ✅ Maneja errores elegantemente
- ✅ Es responsive y accesible

---

**¡El módulo está listo para usar! 🚀**
