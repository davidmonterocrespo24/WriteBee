# Iconos WriteBee

Este directorio contiene los iconos de la extensión WriteBee en diferentes tamaños.

## Diseño del Icono

El icono representa el asistente AI de WriteBee como una abeja con un diseño minimalista y amigable:

- **Cara circular amarilla**: Color `#ffd400` (amarillo vibrante como una abeja)
- **Dos antenas blancas**: Color `#ffffff` con bolitas en las puntas
- **Dos ojos negros**: Color `#1a1a1a` (negro para buen contraste)
- **Bordes negros**: Dos círculos concéntricos que definen las franjas de abeja

## Tamaños Disponibles

- **icon16.svg** - 16×16 px - Favicon y barra de herramientas pequeña
- **icon32.svg** - 32×32 px - Barra de herramientas estándar
- **icon48.svg** - 48×48 px - Tienda de extensiones
- **icon128.svg** - 128×128 px - Tienda de extensiones (grande) y promocional

## Formato

Todos los iconos están en formato **SVG** (Scalable Vector Graphics) para garantizar:
- ✅ Nitidez en cualquier tamaño
- ✅ Compatibilidad con temas claros y oscuros
- ✅ Peso mínimo de archivo
- ✅ Fácil edición y mantenimiento

## Uso en el Manifest

Los iconos se declaran en `manifest.json`:

```json
"icons": {
  "16": "icons/icon16.svg",
  "32": "icons/icon32.svg",
  "48": "icons/icon48.svg",
  "128": "icons/icon128.svg"
}
```

## Consistencia Visual

Estos iconos mantienen la misma identidad visual que el avatar AI usado en toda la extensión:

```css
.ai-avatar {
  background: #ffd400; /* Amarillo abeja */
  box-shadow: inset 0 0 0 2px #1a1a1a, inset 0 0 0 4px #ffd400, inset 0 0 0 6px #1a1a1a;
}

.ai-avatar .eyes span {
  background: #1a1a1a;
}

/* Antenas con pseudo-elementos */
.ai-avatar::before,
.ai-avatar::after {
  background: #ffffff;
}
```

## Conversión a PNG (Opcional)

Si necesitas versiones PNG para compatibilidad con navegadores antiguos:

```bash
# Usando Inkscape (instalar primero)
inkscape icon16.svg --export-filename=icon16.png --export-width=16
inkscape icon32.svg --export-filename=icon32.png --export-width=32
inkscape icon48.svg --export-filename=icon48.png --export-width=48
inkscape icon128.svg --export-filename=icon128.png --export-width=128
```

O usa herramientas online como:
- [CloudConvert](https://cloudconvert.com/svg-to-png)
- [Convertio](https://convertio.co/svg-png/)
