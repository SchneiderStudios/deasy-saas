import { useState, useCallback } from 'react';

export interface PdfConversionResult {
  base64Images: string[]; // чистый base64 JPEG, без префикса data:
  pageCount: number;
  fileName: string;
  fileType: 'image' | 'pdf';
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 МБ — лимит на исходный файл
const MAX_PDF_PAGES = 3; // больше страниц не влезет в лимит запроса Vercel (4,5 МБ)
const MAX_EDGE = 1800; // длинная сторона в пикселях — достаточно для чтения текста
const JPEG_QUALITY = 0.82;

const isHeic = (file: File) => {
  const name = file.name.toLowerCase();
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  );
};

const isPdf = (file: File) =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

/** Уменьшает canvas до MAX_EDGE и возвращает base64 JPEG без префикса. */
function canvasToJpegBase64(source: CanvasImageSource, width: number, height: number): string {
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas wird nicht unterstützt');
  // Белый фон, чтобы прозрачные PNG не стали чёрными
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY).split(',')[1];
}

/** Загружает Blob в <img> и сжимает в JPEG. */
function blobToCompressedJpeg(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      try {
        resolve(canvasToJpegBase64(img, img.naturalWidth, img.naturalHeight));
      } catch (e) {
        reject(e);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Bild konnte nicht gelesen werden / Не удалось прочитать изображение'));
    };
    img.src = url;
  });
}

/** HEIC → JPEG. Safari умеет сам, остальные браузеры — через heic2any. */
async function heicToJpeg(file: File): Promise<string> {
  try {
    return await blobToCompressedJpeg(file); // Safari / iOS
  } catch {
    const heic2any = (await import('heic2any')).default;
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    return blobToCompressedJpeg(blob);
  }
}

async function pdfToJpegs(file: File): Promise<{ images: string[]; pageCount: number }> {
  // legacy-сборка работает и на старых iPhone/Android
  const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
  // Воркер копируется в public/ при сборке (scripts.prebuild) — та же версия, без сторонних CDN
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pages = Math.min(MAX_PDF_PAGES, pdf.numPages);
  const images: string[] = [];

  for (let n = 1; n <= pages; n++) {
    const page = await pdf.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const scale = MAX_EDGE / Math.max(base.width, base.height);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas wird nicht unterstützt');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport }).promise;
    images.push(canvas.toDataURL('image/jpeg', JPEG_QUALITY).split(',')[1]);
  }

  return { images, pageCount: pdf.numPages };
}

export function usePdfUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convertFileToImages = useCallback(async (file: File): Promise<PdfConversionResult> => {
    setLoading(true);
    setError(null);

    try {
      if (!file) throw new Error('Keine Datei / Нет файла');

      if (file.size > MAX_FILE_SIZE) {
        throw new Error(
          `Datei zu groß (${(file.size / 1024 / 1024).toFixed(1)} MB, max. 10 MB) / Файл слишком большой (макс. 10 МБ)`
        );
      }

      if (isPdf(file)) {
        const { images, pageCount } = await pdfToJpegs(file);
        return { base64Images: images, pageCount, fileName: file.name, fileType: 'pdf' };
      }

      if (isHeic(file)) {
        const jpeg = await heicToJpeg(file);
        return {
          base64Images: [jpeg],
          pageCount: 1,
          fileName: file.name.replace(/\.(heic|heif)$/i, '.jpg'),
          fileType: 'image',
        };
      }

      if (file.type.startsWith('image/')) {
        const jpeg = await blobToCompressedJpeg(file);
        return { base64Images: [jpeg], pageCount: 1, fileName: file.name, fileType: 'image' };
      }

      throw new Error('Bitte PDF, JPG, PNG, WebP oder HEIC hochladen / Загрузите PDF, JPG, PNG, WebP или HEIC');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Datei konnte nicht verarbeitet werden';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { convertFileToImages, loading, error, clearError: () => setError(null) };
}
