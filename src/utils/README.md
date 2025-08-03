# PDF Extractor Utilities

This directory contains utilities for extracting data from PDF documents related to course information.

## Files

### `pdfExtractorCompleteRefactored.ts`

The main refactored PDF extractor utility with improved code quality, error handling, and parsing capabilities.

**Key Features:**
- Extracts text from PDF files using PDF.js
- Parses calendar data from EOBCalendario.pdf
- Extracts course information from EOBComunicazioneAvvioSezione.pdf
- Extracts participant data from ElencoStudentiEobSezione.pdf
- Handles combined "fast mode" text parsing
- Comprehensive error handling with fallback mechanisms
- Detailed logging for debugging

### `courseTableParser.ts`

Existing utility for parsing calendar data, used by the PDF extractor as the primary parsing method.

### `pdfExtractor.ts` *(Original)*

The original PDF extractor implementation, kept as a backup reference.

## Usage

```typescript
import { PDFExtractor } from './pdfExtractorCompleteRefactored';

// Process individual PDF files
const calendarData = await PDFExtractor.extractTextFromPDF(calendarFile);
const courseInfoData = await PDFExtractor.extractTextFromPDF(courseInfoFile);
const participantsData = await PDFExtractor.extractTextFromPDF(participantsFile);

// Or process all at once
const extractedData = await PDFExtractor.processAllPDFs(
  calendarFile,
  courseInfoFile,
  participantsFile
);

// Convert to CourseData format
const courseData = PDFExtractor.convertToCourseData(extractedData);
```

## Key Improvements

1. **Better Error Handling** - Comprehensive try-catch blocks and fallback mechanisms
2. **Improved Parsing** - Enhanced regex patterns and manual parsing fallbacks
3. **Cleaner Code** - Better organization, documentation, and naming conventions
4. **Detailed Logging** - Emoji-enhanced console logs for better traceability
5. **Type Safety** - Strong TypeScript typing throughout
6. **Modular Design** - Clear separation of concerns with single-responsibility functions

## Testing

The refactored utility has been tested with various PDF formats and edge cases, including:
- Multi-page PDFs
- PDFs with unusual text formatting
- Fast mode combined text parsing
- Error conditions and fallback scenarios

For any issues or questions, please refer to the detailed console logs or contact the development team.
