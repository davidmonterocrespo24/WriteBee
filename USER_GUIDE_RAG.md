# 🚀 Cómo Usar el Sistema RAG en WriteBee

## 📖 Guía de Usuario

### ¿Qué es esto?

El sistema RAG (Retrieval-Augmented Generation) mejora el chat con páginas web. Ahora WriteBee puede:

✨ **Buscar información en toda la página web** de forma inteligente
✨ **Explorar enlaces relacionados** automáticamente según tu pregunta
✨ **Dar respuestas precisas** basadas en información relevante

---

## 🎯 Uso Básico

### 1. Activar el Chat con Página

**Opción A: Desde el contexto**
1. Haz clic derecho en cualquier parte de una página web
2. Selecciona **"Chat with this page"** en el menú contextual
3. Se abrirá el side panel con el chat activado

**Opción B: Desde el side panel**
1. Presiona `Ctrl+M` para abrir el side panel
2. El RAG se activará automáticamente cuando sea necesario

### 2. Hacer Preguntas

Una vez activado, simplemente escribe tu pregunta:

**Ejemplos de preguntas efectivas:**
- "¿De qué trata esta página?"
- "¿Cuáles son los precios de los servicios?"
- "¿Cómo puedo contactar a la empresa?"
- "¿Qué productos ofrecen?"
- "Resume los puntos principales"
- "¿Dónde encuentro información sobre envíos?"

### 3. El Sistema Trabaja

Verás indicadores de progreso:
- ⏳ "Initializing RAG Engine..."
- ⏳ "Indexing current page..."
- ⏳ "Analyzing X links for relevance..."
- ⏳ "Finding relevant content..."
- ⏳ "Generating answer..."

### 4. Recibir Respuesta

La respuesta será:
- ✅ **Precisa** - Basada en información específica de la página
- ✅ **Completa** - Puede combinar información de múltiples secciones
- ✅ **Contextual** - Con referencias a las fuentes

---

## 💡 Ejemplos Prácticos

### Ejemplo 1: Información de Contacto

**Situación:** Estás en la página inicial de una empresa

**Pregunta:** "¿Cómo contacto al soporte técnico?"

**Lo que hace el RAG:**
1. 🔍 Analiza la página actual
2. 🔗 Encuentra enlaces: `/contact`, `/support`, `/help`
3. 📊 Determina que `/support` es más relevante
4. 📄 Vectoriza esa página
5. 🎯 Encuentra el chunk con información de contacto
6. 💬 Genera respuesta: "Puedes contactar al soporte en support@empresa.com o llamando al..."

---

### Ejemplo 2: Comparación de Productos

**Situación:** Estás en una tienda online

**Pregunta:** "¿Cuál es la diferencia entre el plan básico y premium?"

**Lo que hace el RAG:**
1. 🔍 Busca en la página actual
2. 🔗 Identifica `/pricing` como relevante
3. 📄 Vectoriza la página de precios
4. 🎯 Encuentra chunks sobre ambos planes
5. 💬 Genera comparación detallada

---

### Ejemplo 3: Información Dispersa

**Situación:** Información repartida en varias páginas

**Pregunta:** "¿Qué incluye el servicio y cuánto cuesta?"

**Lo que hace el RAG:**
1. 🔍 Busca en página actual
2. 🔗 Identifica `/services` y `/pricing`
3. 📄 Vectoriza ambas páginas
4. 🎯 Recupera chunks de ambas fuentes
5. 💬 Combina información en una respuesta completa

---

## 🎓 Tips para Mejores Resultados

### ✅ Haz Preguntas Específicas

**❌ Mal:**
- "Info"
- "Dime todo"
- "Qué hay aquí"

**✅ Bien:**
- "¿Cuáles son los horarios de atención?"
- "¿Qué métodos de pago aceptan?"
- "¿Tienen garantía en sus productos?"

### ✅ Usa Keywords Relevantes

El sistema busca por similitud semántica, así que usa términos relacionados:

**Para encontrar precios:**
- "precio", "cost", "cuánto cuesta", "tarifa"

**Para encontrar contacto:**
- "contacto", "email", "teléfono", "dirección"

**Para encontrar servicios:**
- "servicios", "qué ofrecen", "productos", "features"

### ✅ Preguntas de Seguimiento

Puedes hacer preguntas de seguimiento sin reactivar el RAG:

```
Tú: "¿Qué servicios ofrecen?"
Bot: [Respuesta sobre servicios]

Tú: "¿Cuál es el precio del servicio premium?"
Bot: [Respuesta específica sobre pricing]
```

---

## 🔧 Configuración Avanzada (Opcional)

### Para Desarrolladores

Si quieres personalizar el comportamiento:

```javascript
// En la consola del navegador
const rag = RAGEngine.getInstance();

// Ver configuración actual
console.log(rag);

// Limpiar índice para forzar re-indexación
rag.clear();

// Ajustar tamaño de chunks (valor por defecto: 500 palabras)
const chunker = new RAGEngine.ChunkCreator(300, 50);

// Ajustar número de resultados (valor por defecto: 5)
const chunks = rag.retrieve(question, 10);
```

### Testing

Puedes probar el sistema con:

```javascript
// Ejecutar todos los tests
RAGTests.runAll()

// Ejecutar test específico
RAGTests.test_tokenization()
RAGTests.test_url_scoring()
```

### Ejemplos de Código

```javascript
// Ver ejemplo básico
RAGExamples.example1_BasicPageChat()

// Ver ejemplo con enlaces
RAGExamples.example2_ChatWithLinks()

// Ver cómo funciona el scoring de URLs
RAGExamples.example3_URLScoring()
```

---

## 🐛 Solución de Problemas

### "RAG Engine not loaded"

**Solución:**
1. Recarga la extensión en `chrome://extensions/`
2. Recarga la página web
3. Intenta de nuevo

### Respuesta genérica o poco precisa

**Posibles causas:**
- La página no tiene la información que buscas
- Los enlaces relevantes están bloqueados por CORS
- La información está en un formato no textual (imagen, PDF)

**Solución:**
- Intenta reformular la pregunta
- Verifica que la página tenga la información
- Navega manualmente a la sección correcta y pregunta de nuevo

### Lento o no responde

**Posibles causas:**
- Página muy grande con muchos enlaces
- Muchos enlaces externos

**Solución:**
- Espera un poco más (puede tardar 5-10 segundos)
- Si tarda mucho, recarga y pregunta de forma más específica
- El sistema tiene fallback automático

### "Error: ..."

Si ves un error, el sistema automáticamente usa el modo tradicional (sin RAG) como fallback. La respuesta será funcional aunque menos precisa.

---

## 📊 Indicadores de Estado

### Cuando el RAG está trabajando:

```
⏳ Initializing RAG Engine...
⏳ Indexing current page...
⏳ Analyzing 25 links for relevance...
⏳ Finding relevant content...
⏳ Generating answer...
```

### Cuando usa fallback:

```
⏳ Using fallback method...
```

Esto significa que hubo un error pero la extensión sigue funcionando normalmente.

---

## 🎯 Casos de Uso Recomendados

### ✅ Perfecto para:
- 📚 Buscar información en sitios corporativos
- 🛒 E-commerce (precios, características, políticas)
- 📖 Documentación técnica
- 📰 Sitios de noticias
- 🏢 Páginas institucionales

### ⚠️ Limitado para:
- 📱 SPAs con contenido dinámico cargado por JavaScript
- 🔒 Contenido detrás de login
- 🎬 Contenido multimedia sin texto
- 📄 PDFs embebidos

---

## 🆘 Soporte

### ¿Necesitas ayuda?

1. **Consulta la documentación:** Ver `RAG_DOCUMENTATION.md`
2. **Revisa los ejemplos:** Ejecutar `RAGExamples` en consola
3. **Ejecuta tests:** Ver si hay problemas con `RAGTests.runAll()`
4. **Revisa logs:** Abre DevTools y mira la consola

### Reportar Problemas

Si encuentras un bug:
1. Abre DevTools (F12)
2. Ve a la pestaña Console
3. Captura los logs
4. Describe qué intentaste hacer
5. Reporta en el repositorio

---

## 🎉 ¡Disfruta!

El sistema RAG hace que chatear con páginas web sea mucho más poderoso y preciso. 

**¡Explora, pregunta y descubre información de forma inteligente!** 🚀
