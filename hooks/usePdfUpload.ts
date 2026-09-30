import { useState, useCallback } from 'react';

interface PdfConversionResult {
  base64Images: string[];
  pageCount: number;
  fileName: string;
}

export function usePdfUpload() {
  const [isConverting, setIsConverting] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);

  // Load PDF.js worker - use CDN fallback if needed
  const initPdfJs = useCallback(async () => {
    if (typeof window !== 'undefined') {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      return pdfjsLib;
    }
    return null;
  }, []);

  const convertPdfToImages = useCallback(
    async (pdfFile: File): Promise<PdfConversionResult> => {
      try {
        setIsConverting(true);
        setConversionError(null);

        // Validate file
        if (pdfFile.type !== 'application/pdf') {
          throw new Error('Invalid file type. Please upload a PDF file.');
        }

        if (pdfFile.size > 10 * 1024 * 1024) {
          throw new Error('File too large. Maximum size is 10 MB.');
        }

        // Initialize PDF.js
        const pdfjsLib = await initPdfJs();
        if (!pdfjsLib) {
          const pdfjs = await import('pdfjs-dist');
          pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
        }

        // Read PDF file as ArrayBuffer
        const arrayBuffer = await pdfFile.arrayBuffer();
        const { getDocument } = await import('pdfjs-dist');
        const pdf = await getDocument({ data: arrayBuffer }).promise;

        const base64Images: string[] = [];

        // Convert each page to image
        for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 5); pageNum++) {
          // Limit to first 5 pages for performance
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 2 }); // 2x scale for better quality

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          if (!context) {
            throw new Error('Failed to get canvas context');
          }

          await page.render({
            canvasContext: context,
            viewport,
          }).promise;

          // Convert canvas to base64
          const base64 = canvas.toDataURL('image/jpeg', 0.95);
          base64Images.push(base64);
        }

        setIsConverting(false);
        return {
          base64Images,
          pageCount: pdf.numPages,
          fileName: pdfFile.name,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to convert PDF to images';
        setConversionError(errorMessage);
        setIsConverting(false);
        throw error;
      }
    },
    [initPdfJs]
  );

  const convertFileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:image/...;base64, prefix
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }, []);

  return {
    isConverting,
    conversionError,
    convertPdfToImages,
    convertFileToBase64,
  };
}
