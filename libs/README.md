# PDF.js Libraries

Este directorio contiene las librerías locales de PDF.js necesarias para extraer texto de archivos PDF.

## Archivos

- **pdf.min.js** (v3.11.174): Librería principal de PDF.js
- **pdf.worker.min.js** (v3.11.174): Worker de PDF.js para procesamiento en segundo plano

## Fuente

Descargado de: https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/

## Licencia

PDF.js está licenciado bajo Apache License 2.0
https://github.com/mozilla/pdf.js

## Actualización

Para actualizar a una nueva versión:

```powershell
cd libs
Invoke-WebRequest -Uri "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/VERSION/pdf.min.js" -OutFile "pdf.min.js"
Invoke-WebRequest -Uri "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/VERSION/pdf.worker.min.js" -OutFile "pdf.worker.min.js"
```

Reemplaza `VERSION` con la versión deseada (ej: 3.11.174)
