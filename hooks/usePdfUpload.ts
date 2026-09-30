import { useState, useCallback } from 'react';

export interface PdfConversionResult {
  base64Images: string[];
  pageCount: number;
  fileName: string;
  fileType: 'image' | 'pdf';
}

export function usePdfUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Функция для конвертации HEIC в JPG
  const convertHeicToJpeg = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          ctx.drawImage(img, 0, 0);
          const jpeg = canvas.toDataURL('image/jpeg', 0.95).split(',')[1];
          resolve(jpeg);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const convertFileToImages = useCallback(
    async (file: File): Promise<PdfConversionResult> => {
      setLoading(true);
      setError(null);

      try {
        if (!file) {
          throw new Error('No file provided');
        }

        const fileName = file.name;
        const fileSize = file.size;
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (fileSize > maxSize) {
          throw new Error(`File is too large. Maximum size is 10MB, but your file is ${(fileSize / 1024 / 1024).toFixed(1)}MB`);
        }

        // Поддержка HEIC (iPhone фото)
        if (file.type === 'image/heic' || file.type === 'image/heif' || fileName.toLowerCase().endsWith('.heic') || fileName.toLowerCase().endsWith('.heif')) {
          const base64 = await convertHeicToJpeg(file);
          setLoading(false);
          return {
            base64Images: [base64],
            pageCount: 1,
            fileName: fileName.replace(/\.(heic|heif)$/i, '.jpg'),
            fileType: 'image',
          };
        }

        // Поддержка обычных изображений (JPG, PNG, WebP и т.д.)
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();

          return await new Promise((resolve, reject) => {
            reader.onload = () => {
              const base64 = (reader.result as string).split(',')[1];
              setLoading(false);
              resolve({
                base64Images: [base64],
                pageCount: 1,
                fileName: fileName,
                fileType: 'image',
              });
            };
            reader.onerror = () => {
              reject(new Error('Failed to read image file'));
            };
            reader.readAsDataURL(file);
          });
        }

        // Поддержка PDF
        if (file.type === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
          const pdfjs = await import('pdfjs-dist');
          pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
          
          const base64Images: string[] = [];
          const pagesToConvert = Math.min(5, pdf.numPages);

          for (let pageNum = 1; pageNum <= pagesToConvert; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2 });
            
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Failed to get canvas context');

            await page.render({
              canvasContext: context,
              viewport: viewport,
            }).promise;

            const base64 = canvas.toDataURL('image/jpeg', 0.95).split(',')[1];
            base64Images.push(base64);
          }

          setLoading(false);
          return {
            base64Images,
            pageCount: pdf.numPages,
            fileName: fileName,
            fileType: 'pdf',
          };
        }

        throw new Error('Пожалуйста загрузите PDF, фото JPG, PNG или HEIC с iPhone');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to process file';
        setError(errorMessage);
        setLoading(false);
        throw new Error(errorMessage);
      }
    },
    []
  );

  return {
    convertFileToImages,
    loading,
    error,
    clearError: () => setError(null),
  };
}
